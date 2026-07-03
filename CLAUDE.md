# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Oral Teacher (AI 口语老师) is an AI-powered English oral teaching platform built as a microservices architecture. The system uses OpenAI-compatible interfaces to abstract AI capabilities (LLM, ASR, TTS, pronunciation assessment) from specific providers, allowing flexible vendor switching through configuration only.

## Architecture

The system follows a **vendor-agnostic microservices** design:

1. **Provider Gateway** (`packages/provider-gateway/`) - OpenAI-compatible unified AI capability gateway that routes requests to actual upstream providers
2. **API Service** (`packages/api/`) - Business API handling users, courses, scenarios, practice records, authentication
3. **Realtime Orchestrator** (`packages/realtime-orchestrator/`) - WebSocket service managing real-time conversations, coordinating ASR/LLM/TTS calls
4. **Worker Service** (`packages/worker/`) - Async task processing (pronunciation assessment, grammar correction, session summaries)

**Key Design Principle**: Business logic never calls specific AI providers directly. All AI capabilities go through Provider Gateway's OpenAI-compatible endpoints. Provider switching requires only configuration changes, not code changes.

## Tech Stack

- **Language**: TypeScript 5.x
- **Runtime**: Node.js 18.x/20.x
- **Framework**: Fastify 4.x (chosen for performance over Express)
- **Database**: PostgreSQL 15+ (user: `postgres`, password: `123456`, database: `ai_oral_teacher`)
- **Cache/Queue**: Redis 7+
- **Task Queue**: BullMQ
- **Auth**: JWT (Access Token: 15min, Refresh Token: 7 days)
- **Password**: bcrypt
- **Validation**: Zod
- **Logging**: pino
- **HTTP Client**: axios
- **WebSocket**: ws
- **Database Client**: pg (raw SQL, no ORM - chosen for performance and flexibility)

**Frontend** (in progress):
- Web: Next.js 14+ with React 18+, Tailwind CSS, shadcn/ui
- Mobile/Desktop: Flutter 3.19+

## Database Schema

The database uses a PostgreSQL schema `oral_teacher` with 50+ tables. Key table groups:

- **Users**: `users`, `user_identities`, `user_devices`, `auth_sessions`
- **Content**: `scenarios`, `scenario_versions`, `teacher_personas`, `lesson_plans`, `curriculums`
- **Practice**: `practice_sessions`, `conversation_turns`, `utterances`, `session_state_snapshots`
- **Assessment**: `pronunciation_assessments`, `pronunciation_issue_items`, `grammar_corrections`, `fluency_metrics`
- **Media**: `media_assets`, `media_variants`
- **Jobs**: `async_jobs`, `job_dead_letters`

All tables use `uuid` primary keys generated via `gen_random_uuid()`. Soft deletes use `deleted_at` timestamp. Auto-updated `updated_at` via triggers.

## Common Commands

### Development

```bash
# Install dependencies (workspace root)
npm install

# Run individual services
npm run dev:gateway       # Provider Gateway on :8090
npm run dev:api          # API Service on :8080
npm run dev:orchestrator # Realtime Orchestrator on :8081
npm run dev:worker       # Worker Service

# Build all packages
npm run build

# Lint and format
npm run lint
npm run format
```

### Database

```bash
# Initialize database (first time)
psql -U postgres -d ai_oral_teacher -f sql/schema.sql
psql -U postgres -d ai_oral_teacher -f sql/seed.sql

# Connect to database
psql -U postgres -d ai_oral_teacher
```

### Testing

Provider Gateway endpoints:
```bash
# Health check
curl http://localhost:8090/health

# LLM (OpenAI-compatible)
curl -X POST http://localhost:8090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Hello"}]}'

# ASR (Whisper-compatible)
curl -X POST http://localhost:8090/v1/audio/transcriptions \
  -F "file=@audio.wav" \
  -F "model=whisper-1"

# TTS (OpenAI TTS-compatible)
curl -X POST http://localhost:8090/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"model": "tts-1", "voice": "alloy", "input": "Hello"}' \
  --output speech.mp3

# Pronunciation assessment (custom, returns mock data currently)
curl -X POST http://localhost:8090/v1/pronunciation/assessments \
  -H "Content-Type: application/json" \
  -d '{"reference_text": "Hello world", "language": "en-US"}'
```

API Service endpoints:
```bash
# Register
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "display_name": "Test User"}'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Get current user (requires token)
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

## Configuration

### Environment Variables

The system uses `.env` files in the `config/` directory. Key variables:

**Database**:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

**Redis**:
- `REDIS_HOST`, `REDIS_PORT`

**JWT**:
- `JWT_SECRET`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES`

**AI Providers** (for Provider Gateway):
- `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`
- `ASR_BASE_URL`, `ASR_API_KEY`, `ASR_MODEL`
- `TTS_BASE_URL`, `TTS_API_KEY`, `TTS_MODEL`
- `PRONUNCIATION_BASE_URL`, `PRONUNCIATION_API_KEY`, `PRONUNCIATION_MODEL`

### Provider Configuration

Provider Gateway loads `config/providers.yaml` to determine routing. The YAML structure defines capabilities (`llm`, `asr`, `tts`, `pronunciation`) and maps them to upstream services.

When adding a new provider:
1. Update `config/providers.yaml` with base_url, model, api_key
2. If the provider is not OpenAI-compatible, create an adapter in `packages/provider-gateway/src/adapters/`
3. No changes to business services needed

## Code Patterns

### Database Queries

Always use parameterized queries (never string interpolation):

```typescript
// ✓ Good
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ✗ Bad
const result = await pool.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### Error Handling

Services use Fastify's error handler. Throw errors with:
- `statusCode` for HTTP status
- `message` for user-facing message
- `code` for internal error codes

```typescript
throw {
  statusCode: 404,
  message: 'User not found',
  code: 'USER_NOT_FOUND'
};
```

### Authentication

API Service uses JWT middleware. Protected routes automatically have `request.user` populated:

```typescript
fastify.get('/api/v1/sessions', {
  preHandler: [authenticateJWT],
  handler: async (request, reply) => {
    const userId = request.user.id; // Available after auth
    // ...
  }
});
```

### Logging

Use pino logger (available as `fastify.log` or imported from `utils/logger`):

```typescript
logger.info({ userId, sessionId }, 'Session started');
logger.error({ err, userId }, 'Failed to process audio');
```

Log levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`

### Validation

Use Zod for request validation:

```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// In route
const body = loginSchema.parse(request.body);
```

## Development Status (as of Day 1-2)

**Completed**:
- ✓ Provider Gateway: All 4 endpoints (LLM, ASR, TTS, pronunciation) working
- ✓ API Service: Database pool, auth system (register/login/token refresh), basic middleware
- ✓ Database schema fully defined in `sql/schema.sql`
- ✓ Monorepo structure with npm workspaces

**In Progress**:
- API Service: Business endpoints (courses, scenarios, sessions, media)
- Realtime Orchestrator: WebSocket server, conversation engine
- Worker Service: Job queue, pronunciation assessment processing
- Frontend: Initial structure created, not yet connected

**Not Started**:
- Integration testing
- Deployment configuration (Docker, Nginx)
- Advanced features (interruption control, reconnection, session summaries)

## File Organization

```
ai-oral-teacher-blueprint/
├── packages/
│   ├── provider-gateway/src/
│   │   ├── adapters/       # Provider-specific adapters (if non-OpenAI-compatible)
│   │   ├── config/         # Config loading and types
│   │   ├── middleware/     # Error handling, logging
│   │   ├── routes/         # /v1/chat, /v1/audio, /v1/pronunciation
│   │   ├── utils/          # HTTP client, retry logic
│   │   └── index.ts
│   │
│   ├── api/src/
│   │   ├── db/            # pool.ts (connection), queries.ts, migrations.ts
│   │   ├── middleware/    # auth.ts (JWT), error.ts, logger.ts
│   │   ├── routes/        # auth.ts, courses.ts, scenarios.ts, sessions.ts
│   │   ├── utils/         # jwt.ts, hash.ts, validation.ts, logger.ts
│   │   └── index.ts
│   │
│   ├── realtime-orchestrator/src/
│   │   ├── handlers/      # WebSocket message handlers
│   │   ├── services/      # session-manager, dialogue-engine, provider-client
│   │   └── index.ts
│   │
│   └── worker/src/
│       ├── jobs/          # Task processors (pronunciation, grammar, summary)
│       ├── services/      # provider-client, db-client
│       └── index.ts
│
├── config/                # .env, providers.yaml (gitignored actual files)
├── storage/               # Local file storage (recordings, tts-cache, reports)
├── sql/                   # schema.sql, seed.sql
├── docs/                  # Architecture, tech-stack, 7-day-plan
└── frontend/              # web/ (Next.js), mobile/ (Flutter)
```

## Important Implementation Notes

### Why No ORM?

The project deliberately uses raw SQL (`pg`) instead of Prisma/TypeORM because:
- Project is not overly complex
- Raw SQL offers better performance tuning
- Avoids abstraction layers that obscure actual queries
- Easier debugging and optimization

When writing queries, prefer explicit SQL with good indexing strategy.

### Provider Gateway Design

The gateway acts as a **translation layer** - it receives OpenAI-compatible requests and routes them to actual providers (which may or may not be OpenAI). This allows:
- Business services to be completely provider-agnostic
- A/B testing different providers by configuration
- Fallback mechanisms (try provider A, fall back to B)
- Centralized monitoring and cost tracking

### Real-time Conversation Flow

1. Client establishes WebSocket connection (token in query string or header)
2. User speaks → audio chunks sent via WebSocket
3. Orchestrator calls Provider Gateway ASR → text
4. Orchestrator builds prompt (scenario context + dialogue history + user text)
5. Orchestrator calls Provider Gateway LLM → AI response
6. Orchestrator calls Provider Gateway TTS → audio stream
7. Audio streamed back to client
8. Orchestrator saves turn to database
9. Orchestrator enqueues pronunciation assessment job (async)

### Session State Management

Real-time sessions store state in Redis (not database) for performance:
- `session:{sessionId}` → session metadata, current state
- `dialogue:{sessionId}` → conversation history (array of turns)
- Sessions expire after inactivity (TTL on Redis keys)

Persistent data (turns, assessments, reports) goes to PostgreSQL.

## Troubleshooting

**"dotenv not loading environment variables"**
- Services use `tsx watch --require dotenv/config` in dev mode
- In production, use `node -r dotenv/config dist/index.js`
- Alternatively, export environment variables directly before running

**"Database connection refused"**
- Ensure PostgreSQL is running: `psql -U postgres` to test
- Check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` in config/.env
- Verify database exists: `psql -U postgres -l | grep ai_oral_teacher`

**"Redis connection failed"**
- Start Redis: `redis-server` or via Docker
- Check `REDIS_HOST` and `REDIS_PORT`

**"Provider Gateway returns 500 for LLM requests"**
- Check `config/providers.yaml` has valid base_url and api_key
- Test upstream provider directly (e.g., `curl https://api.openai.com/v1/models`)
- Check Provider Gateway logs for actual error

## Security Notes

- Passwords hashed with bcrypt (cost factor 10)
- JWT tokens signed with `JWT_SECRET` (keep this secret)
- API Keys for providers stored in `.env` (never commit)
- File uploads should validate size (<10MB) and type
- SQL injection prevented via parameterized queries
- CORS configured in API Service via `@fastify/cors`

## Next Steps (Development Roadmap)

**Day 3-4**: Complete API Service business endpoints, start Realtime Orchestrator
**Day 5**: Worker Service and async job processing
**Day 6**: Integration testing and bug fixes
**Day 7**: Docker deployment, optimization, monitoring

**Future**: Frontend integration, advanced features (VAD, GOP pronunciation, learning paths, social features, admin dashboard)
