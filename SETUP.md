# 1800-FeelBetter — Setup Guide

## Prerequisites
- Node.js 20+ and npm
- Docker Desktop (for PostgreSQL + Redis)

---

## 1. Start the Database

```bash
cd backend
docker compose up -d
```

---

## 2. Backend Setup

```bash
cd backend
cp .env.example .env          # edit JWT_SECRET with a real random string
npm install
npm run migrate               # creates all tables
npm run seed                  # seeds listeners, resources, workshops
npm run dev                   # starts on http://localhost:3000
```

Health check: `curl http://localhost:3000/health`

---

## 3. Mobile App Setup

```bash
cd mobile
cp .env.example .env.local    # set EXPO_PUBLIC_API_URL=http://localhost:3000
npm install
npx expo start                # scan QR with Expo Go app
```

For iOS Simulator: `npx expo start --ios`
For Android Emulator: `npx expo start --android`

---

## Project Structure

```
1800-feelbetter/
├── backend/                  # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── routes/           # auth, users, sessions, listeners, etc.
│   │   ├── services/         # JWT, listener matching engine
│   │   ├── websocket/        # Socket.IO session events
│   │   └── config/           # DB pool, migrate, seed
│   └── migrations/           # PostgreSQL schema
└── mobile/                   # Expo React Native app
    ├── app/
    │   ├── index.tsx          # Splash screen
    │   ├── (auth)/            # Login, register, onboarding (4 steps)
    │   └── (app)/             # Home, Match, In-Call, Review, Resources, Profile
    └── src/
        ├── store/             # Redux + RTK Query
        └── constants/         # Colors, categories, segments
```

---

## Key Features (Phase 1)

| Feature | Status |
|---------|--------|
| Email + password auth | ✅ |
| JWT (15m access + 30d refresh) | ✅ |
| 4-step onboarding | ✅ |
| AI listener matching | ✅ |
| Listener match screen | ✅ |
| In-call screen (UI, timer, mute) | ✅ |
| Crisis safety modal | ✅ |
| Post-session review | ✅ |
| Home dashboard + mood tracking | ✅ |
| Resource library | ✅ |
| Upcoming workshops | ✅ |
| WebSocket events (Socket.IO) | ✅ |
| Anonymous mode | ✅ |
| Profile + settings screen | ✅ |
| Twilio voice integration | Requires Twilio credentials |
| Stripe billing | Requires Stripe secret key |
| Push notifications (FCM) | Phase 2 |
| Apple/Google SSO | Phase 2 |

---

## API Endpoints

All endpoints require `Authorization: Bearer <access_token>` except auth routes.

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Sign in |
| POST | /auth/refresh | Rotate tokens |
| GET | /users/me | Get profile |
| PATCH | /users/me | Update profile |
| GET | /listeners/available | Matched listeners |
| POST | /sessions/request | Start session |
| POST | /sessions/:id/end | End session |
| POST | /sessions/:id/review | Submit rating |
| GET | /sessions/history | Past sessions |
| GET | /subscriptions/me | Current plan |
| GET | /resources | Resource library |
| POST | /wellness/checkin | Daily mood log |
| GET | /wellness/trends | 30-day mood data |
| GET | /workshops | Upcoming events |
| POST | /workshops/:id/register | Register for workshop |

## WebSocket Events (Socket.IO)

Connect with `auth: { token: <access_token> }` handshake.

| Event | Payload |
|-------|---------|
| session:matched | `{ sessionId, listenerId, estimatedWait }` |
| session:listener_ready | `{ sessionId, callToken }` |
| session:call_started | `{ sessionId, startTime }` |
| session:call_ended | `{ sessionId, endTime, duration }` |
| session:crisis_flag | `{ sessionId, resourceUrl }` |
| session:timer_warning | `{ sessionId, remainingSeconds }` |
