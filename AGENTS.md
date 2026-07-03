# Repository Guidelines

## Project Structure & Module Organization

This repository is a monorepo for an AI oral-teaching platform.

- `packages/provider-gateway/`: OpenAI-compatible gateway for LLM, ASR, TTS, and pronunciation providers.
- `packages/api/`: Fastify business API, auth, and PostgreSQL access.
- `packages/realtime-orchestrator/`, `packages/worker/`: planned realtime and async services.
- `frontend/web/`: Next.js 14 web client.
- `frontend/mobile/`: Flutter client.
- `config/`: local configuration templates and provider routing.
- `sql/`: schema and seed scripts.
- `docs/`: architecture and implementation notes.
- `storage/`: local runtime artifacts; do not commit generated files.

## Build, Test, and Development Commands

- `npm install`: install root workspace dependencies.
- `npm run dev:gateway`: run the provider gateway on the local dev port.
- `npm run dev:api`: run the API service with `dotenv` preloaded.
- `npm run build`: build all npm workspaces, including `frontend/web`.
- `npm run lint`: run workspace lint scripts where defined.
- `npm run format`: format TypeScript under `packages/`.
- `npm run type-check --workspace=ai-oral-teacher-web`: verify the web app without building.
- `psql -U postgres -d ai_oral_teacher -f sql/schema.sql`: initialize the database schema.

## Coding Style & Naming Conventions

Use TypeScript with `strict` settings and 2-space indentation. Prefer small modules, explicit return types on exported helpers, and parameterized SQL only. Use `camelCase` for variables/functions, `PascalCase` for React components and Dart classes, and kebab-case for file names unless the framework requires otherwise (`page.tsx`, `layout.tsx`). Use ESLint and Prettier before committing.

## Testing Guidelines

There is no full automated test suite yet. At minimum, contributors should run `npm run build` and `npm run lint`. For API and gateway changes, perform smoke tests with `curl` against local endpoints. For web changes, also run `npm run type-check --workspace=ai-oral-teacher-web`. Keep test data and secrets out of tracked files.

## Commit & Pull Request Guidelines

Recent history favors short imperative subjects, often with a scope prefix such as `fix(api): ...`, `refactor(api): ...`, or `docs: ...`. Keep commits focused and describe the user-visible change. PRs should include:

- a short summary of what changed
- affected packages or routes
- config or schema changes
- screenshots for `frontend/web` UI updates
- manual verification steps

## Security & Configuration Tips

Never commit `.env` files or live API keys. Commit only example templates such as `.env.example`. Keep provider secrets in local environment files, and verify `config/providers.yaml` references environment variables instead of hard-coded credentials.
