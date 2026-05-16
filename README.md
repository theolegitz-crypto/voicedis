# Discord Clone MVP

Современное Discord-like веб-приложение на `Next.js + NestJS + PostgreSQL + Redis + Socket.IO + WebRTC`.

MVP позволяет:
- регистрироваться и входить по JWT;
- создавать серверы;
- создавать текстовые и голосовые каналы;
- открывать сервер, видеть каналы и участников;
- загружать историю сообщений;
- отправлять сообщения в real time;
- видеть presence-обновления;
- подключаться к голосовым комнатам через WebRTC mesh;
- использовать STUN/TURN-конфиг для прохождения NAT;
- запускать проект локально через `docker compose`.

## Product framing

### Epics
- `Epic 1` Authentication and User Accounts
- `Epic 2` Server Management
- `Epic 3` Channel Management
- `Epic 4` Text Messaging
- `Epic 5` Real-Time Presence
- `Epic 6` Voice Communication
- `Epic 11` UI/UX
- `Epic 12` DevOps and Deployment

### MoSCoW for this repo

#### Must Have
- Auth: registration, login, `GET /auth/me`
- JWT guards for protected API
- Server creation and listing
- Server view with channels and members
- Text and voice channel creation
- Message history with pagination cursor
- Real-time message delivery via Socket.IO
- WebRTC voice signaling and join/leave/mute
- STUN/TURN env wiring
- Discord-like dark UI shell
- Docker Compose stack

#### Should Have
- User profile page
- Invite links
- Soft-delete message flow on backend socket layer
- Presence updates through Redis-backed counters
- Basic role checks through owner/admin/member

#### Could Have
- Typing indicator
- Custom roles CRUD
- Direct messages UI/API
- Attachments upload
- Mobile-first navigation polish

#### Won't Have in this MVP
- Video calls
- Screen sharing
- E2E encryption
- Public server discovery
- Bot marketplace
- Full-text global message search

## Tech stack

### Frontend
- `Next.js 14`
- `React 18`
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui style components`
- `Zustand`
- `socket.io-client`
- native `WebRTC`

### Backend
- `NestJS`
- `TypeScript`
- `Prisma ORM`
- `PostgreSQL`
- `Redis`
- `Socket.IO`
- `JWT`
- `bcrypt`

### Infra
- `Docker`
- `Docker Compose`
- `Nginx`
- `coturn`

## Repository structure

```text
.
├─ apps/
│  ├─ api/
│  │  ├─ prisma/
│  │  └─ src/
│  │     ├─ auth/
│  │     ├─ users/
│  │     ├─ servers/
│  │     ├─ channels/
│  │     ├─ messages/
│  │     ├─ voice/
│  │     ├─ websocket/
│  │     ├─ permissions/
│  │     ├─ prisma/
│  │     ├─ redis/
│  │     └─ common/
│  └─ web/
│     └─ src/
│        ├─ app/
│        ├─ components/
│        ├─ lib/
│        ├─ stores/
│        └─ types/
├─ infra/
│  ├─ coturn/
│  └─ nginx/
├─ docker-compose.yml
└─ .env.example
```

## Implemented iterations

### Iteration 1 — Foundation
- monorepo-like app split in `apps/api` and `apps/web`
- Dockerfiles and `docker-compose.yml`
- PostgreSQL, Redis, Nginx, coturn services
- Prisma schema, initial migration, seed script

### Iteration 2 — Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- frontend login/register pages
- protected frontend routes via Next middleware

### Iteration 3 — Servers and Channels
- `GET /servers`
- `POST /servers`
- `GET /servers/:serverId`
- `PATCH /servers/:serverId`
- `DELETE /servers/:serverId`
- `POST /servers/:serverId/channels`
- `PATCH /channels/:channelId`
- `DELETE /channels/:channelId`
- default `general` text + `voice-lounge` voice channel on server creation

### Iteration 4 — Text Chat
- `GET /channels/:channelId/messages`
- `message:send`
- `message:new`
- `message:update`
- `message:delete`
- chat UI with history loading

### Iteration 5 — Voice MVP
- `POST /voice/channels/:channelId/join`
- `POST /voice/channels/:channelId/leave`
- socket signaling for WebRTC
- join/leave/mute/unmute voice panel
- mesh peer connections for small rooms

### Iteration 6 — TURN / VPS baseline
- TURN env variables
- coturn config example
- nginx reverse proxy example
- deployment notes in this README

### Iteration 7 — Polish
- profile settings page
- invite accept page
- Redis-backed presence updates
- loading skeletons

## Prisma models

The schema includes:
- `User`
- `Server`
- `ServerMember`
- `Role`
- `Channel`
- `Message`
- `Invite`
- `DirectConversation`
- `DirectMessage`
- `VoiceSession`
- `MessageAttachment`

Migration file:
- [apps/api/prisma/migrations/202605160001_init/migration.sql](/D:/discord/apps/api/prisma/migrations/202605160001_init/migration.sql)

Schema file:
- [apps/api/prisma/schema.prisma](/D:/discord/apps/api/prisma/schema.prisma)

## API surface

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Users
- `GET /users/me`
- `PATCH /users/me`
- `GET /users/:userId`

### Servers
- `GET /servers`
- `POST /servers`
- `GET /servers/:serverId`
- `PATCH /servers/:serverId`
- `DELETE /servers/:serverId`

### Invites
- `POST /servers/:serverId/invites`
- `GET /invites/:code`
- `POST /invites/:code/accept`

### Channels
- `POST /servers/:serverId/channels`
- `PATCH /channels/:channelId`
- `DELETE /channels/:channelId`

### Messages
- `GET /channels/:channelId/messages`

### Voice
- `POST /voice/channels/:channelId/join`
- `POST /voice/channels/:channelId/leave`

### Health
- `GET /health`

## Socket.IO events

### Text
- `message:send`
- `message:new`
- `message:update`
- `message:delete`

### Presence
- `presence:online`
- `presence:offline`
- `presence:update`

### Typing
- `typing:start`
- `typing:stop`

### Voice
- `voice:join`
- `voice:leave`
- `voice:user-joined`
- `voice:user-left`
- `voice:offer`
- `voice:answer`
- `voice:ice-candidate`
- `voice:mute`
- `voice:unmute`

### Internal subscription helpers
- `server:join`
- `channel:join`

## Local run

### 1. Prepare env

Copy env template:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### 2. Start everything

```bash
docker compose up --build
```

Services:
- frontend dev server: `http://localhost:3000`
- backend API: `http://localhost:4000`
- nginx reverse proxy: `http://localhost`
- postgres: `localhost:5432`
- redis: `localhost:6379`
- coturn: `3478/5349`

### 3. Run migrations and seed locally without Docker

From repository root:

```bash
npm --prefix apps/api install
npm --prefix apps/api run prisma:generate
npm --prefix apps/api run prisma:migrate
npm --prefix apps/api run prisma:seed
```

### 4. Demo account

Seed script creates:
- email: `demo@example.com`
- password: `password123`

Seed file:
- [apps/api/prisma/seed.ts](/D:/discord/apps/api/prisma/seed.ts)

## Environment variables

Root env template:
- [.env.example](/D:/discord/.env.example)

Important variables:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/discord_clone
REDIS_URL=redis://redis:6379
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
PORT=4000
CORS_ORIGIN=http://localhost

NEXT_PUBLIC_API_URL=http://localhost
NEXT_PUBLIC_WS_URL=http://localhost

NEXT_PUBLIC_STUN_URL=stun:your-domain.com:3478
NEXT_PUBLIC_TURN_URL=turn:your-domain.com:3478
NEXT_PUBLIC_TURN_USERNAME=demo
NEXT_PUBLIC_TURN_CREDENTIAL=strongpassword
```

## coturn configuration

Config file:
- [infra/coturn/turnserver.conf](/D:/discord/infra/coturn/turnserver.conf)

Example:

```conf
listening-port=3478
tls-listening-port=5349
fingerprint
lt-cred-mech
realm=your-domain.com
server-name=your-domain.com
user=demo:strongpassword
external-ip=YOUR_VPS_PUBLIC_IP
min-port=49160
max-port=49200
no-multicast-peers
no-loopback-peers
log-file=/var/log/turnserver.log
verbose
```

For VPS deployment open:
- `80/tcp`
- `443/tcp`
- `3478/tcp`
- `3478/udp`
- `5349/tcp`
- `5349/udp`
- `49160-49200/udp`

## Nginx reverse proxy

Config file:
- [infra/nginx/default.conf](/D:/discord/infra/nginx/default.conf)

What it does:
- proxies `/` to Next.js
- proxies `/socket.io/` to NestJS websocket server
- proxies `/auth`, `/users`, `/servers`, `/invites`, `/channels`, `/voice` to NestJS

For production, add:
- TLS via Let's Encrypt
- websocket headers for `Upgrade/Connection`
- stricter rate limiting
- separate domain mapping if desired:
  - `app.example.com`
  - `api.example.com`
  - `turn.example.com`

## WebRTC signaling flow

Current MVP voice architecture:

1. Client selects a voice channel.
2. Frontend calls `POST /voice/channels/:channelId/join` to get ICE config and current participants.
3. Frontend opens microphone through `navigator.mediaDevices.getUserMedia`.
4. Frontend emits `voice:join`.
5. Existing peers receive `voice:user-joined`.
6. Peers exchange:
   - `voice:offer`
   - `voice:answer`
   - `voice:ice-candidate`
7. Browser creates direct audio peer connections.
8. `voice:leave` tears down session state and closes peer connections.

Frontend helper:
- [apps/web/src/lib/webrtc.ts](/D:/discord/apps/web/src/lib/webrtc.ts)

Backend gateway:
- [apps/api/src/websocket/events.gateway.ts](/D:/discord/apps/api/src/websocket/events.gateway.ts)

## Security notes

Implemented baseline:
- bcrypt password hashing
- JWT auth guard
- DTO validation with `class-validator`
- request throttling
- private route protection on frontend
- membership checks for server/channel/message access
- owner/admin permission checks for management actions
- CORS and helmet
- password hash never returned from API

MVP caveats:
- JWT is stored client-side for speed of implementation
- TURN credentials are static env variables
- no refresh-token rotation yet
- no S3 upload security pipeline yet

Production improvements:
- move auth to httpOnly cookies + refresh token rotation
- generate ephemeral TURN credentials
- add CSRF strategy if cookie auth is used
- add structured audit logs
- add file scanning and upload signing

## VPS deployment outline

1. Provision a Linux VPS with Docker and Docker Compose.
2. Copy repository and `.env`.
3. Set real production values:
   - `JWT_SECRET`
   - `DATABASE_URL`
   - `REDIS_URL`
   - `NEXT_PUBLIC_STUN_URL`
   - `NEXT_PUBLIC_TURN_URL`
   - `TURN_EXTERNAL_IP`
4. Point DNS to VPS.
5. Add TLS termination in nginx.
6. Start stack:

```bash
docker compose up -d --build
```

Recommended additions before production traffic:
- managed PostgreSQL backups
- persistent Redis strategy
- log aggregation
- health monitoring
- CI/CD pipeline

## Current MVP limitations

- Voice uses mesh WebRTC, so large rooms will not scale well.
- Direct messages are modeled in Prisma but not exposed in UI/API yet.
- Attachments model exists but upload endpoint is not included yet.
- Message edit/delete is available in backend socket layer, but the current UI focuses on send/history first.
- Redis is used for presence counters, not yet as a full Socket.IO multi-node adapter.
- Mobile UX is usable only at a basic level; desktop is the primary target.

## Recommended production roadmap

### Next backend steps
- add Socket.IO Redis adapter for horizontal scale
- add refresh tokens and session revocation
- implement DM endpoints and unread states
- add attachments with S3-compatible storage
- add automated tests

### Next voice steps
- replace mesh with SFU
- recommended options:
  - `LiveKit`
  - `mediasoup`
  - `Janus`
  - `Jitsi`

### Next frontend steps
- channel context menus
- message edit/delete UX
- unread badges
- mobile drawer layout
- invite creation UI from server settings

## Key files

- Backend bootstrap: [apps/api/src/main.ts](/D:/discord/apps/api/src/main.ts)
- App module: [apps/api/src/app.module.ts](/D:/discord/apps/api/src/app.module.ts)
- Auth service: [apps/api/src/auth/auth.service.ts](/D:/discord/apps/api/src/auth/auth.service.ts)
- Servers service: [apps/api/src/servers/servers.service.ts](/D:/discord/apps/api/src/servers/servers.service.ts)
- Messages service: [apps/api/src/messages/messages.service.ts](/D:/discord/apps/api/src/messages/messages.service.ts)
- Voice service: [apps/api/src/voice/voice.service.ts](/D:/discord/apps/api/src/voice/voice.service.ts)
- Frontend shell: [apps/web/src/components/layout/app-shell.tsx](/D:/discord/apps/web/src/components/layout/app-shell.tsx)
- Auth store: [apps/web/src/stores/auth.store.ts](/D:/discord/apps/web/src/stores/auth.store.ts)
- Server store: [apps/web/src/stores/server.store.ts](/D:/discord/apps/web/src/stores/server.store.ts)
- Voice store: [apps/web/src/stores/voice.store.ts](/D:/discord/apps/web/src/stores/voice.store.ts)

## Notes for reviewers

This repository is intentionally structured as an extensible MVP:
- core domain entities are already in Prisma;
- permission boundaries are separated into a dedicated module;
- WebSocket and REST concerns are split cleanly;
- frontend state is isolated into dedicated stores;
- infra files are ready for local Docker and future VPS hardening.
