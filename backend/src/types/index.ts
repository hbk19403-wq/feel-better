export type UserRole = 'user' | 'listener' | 'corporate_admin' | 'platform_admin';
export type SubscriptionPlan = 'free' | 'pay_per_session' | 'basic' | 'standard' | 'premium' | 'corporate';
export type SessionStatus = 'pending' | 'matching' | 'matched' | 'active' | 'completed' | 'cancelled';
export type SessionType = 'voice' | 'text' | 'scheduled';
export type ListenerStatus = 'online' | 'away' | 'break' | 'offline';
export type AgeSegment = '16_25' | '26_35' | '36_50' | '51_plus';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  age_segment: AgeSegment | null;
  profession: string | null;
  language_preference: string;
  anonymous_mode: boolean;
  subscription_plan: SubscriptionPlan;
  is_minor: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface Listener {
  id: string;
  alias: string;
  bio: string | null;
  specializations: string[];
  languages: string[];
  status: ListenerStatus;
  active_session_count: number;
  average_rating: number;
  rating_count: number;
  is_trauma_informed: boolean;
}

export interface Session {
  id: string;
  user_id: string;
  listener_id: string | null;
  category_id: string | null;
  session_type: SessionType;
  status: SessionStatus;
  user_alias: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  mood_before: number | null;
  mood_after: number | null;
  rating: number | null;
  crisis_flagged: boolean;
  created_at: string;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
