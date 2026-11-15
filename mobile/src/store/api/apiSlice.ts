import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import * as SecureStore from 'expo-secure-store';
import { RootState } from '../index';
import { setTokens, logout } from '../authSlice';

// Defaults to the deployed backend so shipped builds work even when
// EXPO_PUBLIC_API_URL isn't injected. Override per-environment via env.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://backend-eosin-five-50.vercel.app';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// Single-flight refresh: the backend rotates refresh tokens, so concurrent 401s
// must share one refresh call instead of each invalidating the token.
let refreshPromise: Promise<string | null> | null = null;

function doRefresh(apiObj: any, extra: any): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) return null;
      const res = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST', body: { refresh_token: refreshToken } },
        apiObj, extra,
      );
      const data: any = res.data;
      if (!data?.accessToken) return null;
      apiObj.dispatch(setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken }));
      return data.accessToken as string;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

// Wraps every request: on a 401, transparently refreshes once and retries.
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, apiObj, extra) => {
  let result = await rawBaseQuery(args, apiObj, extra);
  if (result.error?.status === 401) {
    const fresh = await doRefresh(apiObj, extra);
    if (fresh) {
      result = await rawBaseQuery(args, apiObj, extra);
    } else {
      apiObj.dispatch(logout());
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Session', 'Listeners', 'Resources', 'Wellness', 'Workshops', 'Subscription', 'Community', 'Chat', 'Vent'],
  endpoints: (builder) => ({
    getMe: builder.query<any, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    updateMe: builder.mutation<any, any>({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<any, { email: string; password: string; name: string; is_minor?: boolean }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation<any, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    getAvailableListeners: builder.query<any[], { category_id?: string; session_type?: string }>({
      query: (params) => ({ url: '/listeners/available', params }),
      providesTags: ['Listeners'],
    }),
    requestSession: builder.mutation<any, any>({
      query: (body) => ({ url: '/sessions/request', method: 'POST', body }),
      invalidatesTags: ['Session'],
    }),
    getSession: builder.query<any, string>({
      query: (id) => `/sessions/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Session', id }],
    }),
    endSession: builder.mutation<any, string>({
      query: (id) => ({ url: `/sessions/${id}/end`, method: 'POST' }),
      invalidatesTags: ['Session'],
    }),
    reviewSession: builder.mutation<any, { id: string; rating: number; mood_after: number; comment?: string }>({
      query: ({ id, ...body }) => ({ url: `/sessions/${id}/review`, method: 'POST', body }),
      invalidatesTags: ['Session'],
    }),
    getSessionHistory: builder.query<any, void>({
      query: () => '/sessions/history',
      providesTags: ['Session'],
    }),
    getSubscription: builder.query<any, void>({
      query: () => '/subscriptions/me',
      providesTags: ['Subscription'],
    }),
    getPlans: builder.query<any[], void>({
      query: () => '/subscriptions/plans',
      transformResponse: (r: any) => r.plans || [],
    }),
    checkoutPlan: builder.mutation<any, string>({
      query: (plan) => ({ url: '/subscriptions/checkout', method: 'POST', body: { plan } }),
    }),
    confirmPayment: builder.mutation<any, { txn_ref: string; upi_txn_id: string }>({
      query: (body) => ({ url: '/subscriptions/confirm', method: 'POST', body }),
      invalidatesTags: ['Subscription'],
    }),
    getResources: builder.query<any[], { category?: string; type?: string; search?: string }>({
      query: (params) => ({ url: '/resources', params }),
      providesTags: ['Resources'],
    }),
    submitCheckin: builder.mutation<any, { mood: number; note?: string }>({
      query: (body) => ({ url: '/wellness/checkin', method: 'POST', body }),
      invalidatesTags: ['Wellness'],
    }),
    getWellnessTrends: builder.query<any[], void>({
      query: () => '/wellness/trends',
      providesTags: ['Wellness'],
    }),
    getWorkshops: builder.query<any[], void>({
      query: () => '/workshops',
      providesTags: ['Workshops'],
    }),
    registerWorkshop: builder.mutation<any, string>({
      query: (id) => ({ url: `/workshops/${id}/register`, method: 'POST' }),
      invalidatesTags: ['Workshops'],
    }),

    // --- Community ---
    getCommunityGroups: builder.query<any[], void>({
      query: () => '/community/groups',
      transformResponse: (r: any) => r.groups || [],
      providesTags: ['Community'],
    }),
    getGroupPosts: builder.query<any, string>({
      query: (slug) => `/community/groups/${slug}/posts`,
      providesTags: (_r, _e, slug) => [{ type: 'Community', id: slug }],
    }),
    createPost: builder.mutation<any, { slug: string; body: string; title?: string; alias?: string }>({
      query: ({ slug, ...body }) => ({ url: `/community/groups/${slug}/posts`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { slug }) => [{ type: 'Community', id: slug }],
    }),
    supportPost: builder.mutation<any, string>({
      query: (id) => ({ url: `/community/posts/${id}/support`, method: 'POST' }),
    }),

    // --- Community live chat ---
    getGroupChat: builder.query<any, string>({
      query: (slug) => `/community/groups/${slug}/chat`,
      providesTags: (_r, _e, slug) => [{ type: 'Chat', id: slug }],
    }),
    sendGroupChat: builder.mutation<any, { slug: string; body: string; alias?: string }>({
      query: ({ slug, ...body }) => ({ url: `/community/groups/${slug}/chat`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { slug }) => [{ type: 'Chat', id: slug }],
    }),

    // --- AI listeners + chat ---
    getAiListeners: builder.query<any[], { gender?: string; topic?: string } | void>({
      query: (params) => ({ url: '/ai-listeners', params: params || undefined }),
      providesTags: ['Listeners'],
    }),
    createAiSession: builder.mutation<any, { ai_listener_id: string; mode?: string; topic_id?: string; age_group?: string }>({
      query: (body) => ({ url: '/ai-chat/sessions', method: 'POST', body }),
    }),
    sendAiMessage: builder.mutation<any, { id: string; content: string }>({
      query: ({ id, content }) => ({ url: `/ai-chat/sessions/${id}/messages`, method: 'POST', body: { content } }),
    }),
    unlockChatAdvice: builder.mutation<any, string>({
      query: (id) => ({ url: `/ai-chat/sessions/${id}/unlock`, method: 'POST' }),
    }),
    confirmChatUnlock: builder.mutation<any, { id: string; txn_ref: string; upi_txn_id: string }>({
      query: ({ id, ...body }) => ({ url: `/ai-chat/sessions/${id}/confirm-unlock`, method: 'POST', body }),
    }),
    settleSession: builder.mutation<any, string>({
      query: (id) => ({ url: `/sessions/${id}/settle`, method: 'POST' }),
    }),
    confirmSettle: builder.mutation<any, { id: string; txn_ref: string; upi_txn_id: string }>({
      query: ({ id, ...body }) => ({ url: `/sessions/${id}/settle-confirm`, method: 'POST', body }),
    }),
    // Mints an OpenAI Realtime ephemeral token for a voice call.
    getVoiceToken: builder.mutation<any, { ai_listener_id: string; mode?: string; topic_id?: string; age_group?: string; voice?: string }>({
      query: (body) => ({ url: '/ai-voice/token', method: 'POST', body }),
    }),
    endVoiceSession: builder.mutation<any, string>({
      query: (id) => ({ url: `/ai-voice/sessions/${id}/end`, method: 'POST' }),
    }),

    // --- Vent Line ---
    getVentFeed: builder.query<any[], void>({
      query: () => '/vent-line/feed',
      transformResponse: (r: any) => r.entries || [],
      providesTags: ['Vent'],
    }),
    submitVent: builder.mutation<any, { body: string; mood?: string; alias?: string; is_public?: boolean }>({
      query: (body) => ({ url: '/vent-line', method: 'POST', body }),
      invalidatesTags: ['Vent'],
    }),
  }),
});

export const {
  useGetMeQuery,
  useUpdateMeMutation,
  useRegisterMutation,
  useLoginMutation,
  useGetAvailableListenersQuery,
  useRequestSessionMutation,
  useGetSessionQuery,
  useEndSessionMutation,
  useReviewSessionMutation,
  useGetSessionHistoryQuery,
  useGetSubscriptionQuery,
  useGetResourcesQuery,
  useSubmitCheckinMutation,
  useGetWellnessTrendsQuery,
  useGetWorkshopsQuery,
  useRegisterWorkshopMutation,
  useGetCommunityGroupsQuery,
  useGetGroupPostsQuery,
  useCreatePostMutation,
  useSupportPostMutation,
  useGetGroupChatQuery,
  useSendGroupChatMutation,
  useGetVentFeedQuery,
  useSubmitVentMutation,
  useGetAiListenersQuery,
  useCreateAiSessionMutation,
  useSendAiMessageMutation,
  useGetVoiceTokenMutation,
  useEndVoiceSessionMutation,
  useUnlockChatAdviceMutation,
  useConfirmChatUnlockMutation,
  useSettleSessionMutation,
  useConfirmSettleMutation,
  useGetPlansQuery,
  useCheckoutPlanMutation,
  useConfirmPaymentMutation,
} = api;
