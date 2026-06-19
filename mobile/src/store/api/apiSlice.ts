import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['User', 'Session', 'Listeners', 'Resources', 'Wellness', 'Workshops', 'Subscription'],
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
} = api;
