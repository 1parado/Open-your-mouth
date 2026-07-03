# 项目错误检查报告

> 生成日期: 2026-07-03
> 检查范围: 全项目（TypeScript 编译、ESLint、依赖、配置一致性）

---

## 严重（Critical）

### C1. TypeScript 编译错误 — `packages/api/src/app.ts`

**文件:** `packages/api/src/app.ts`

| 行 | 错误码 | 描述 |
|---|--------|------|
| 12 | TS2769 | 自定义 pino `logger` 类型不兼容 Fastify 期望的 `FastifyBaseLogger`（缺少 `msgPrefix`） |
| 21 | TS2345 | `errorHandler` 参数类型签名不匹配（Http2SecureServer vs RawServerDefault） |
| 33 | TS2322 | 函数返回类型标注为 HTTP/1.1 `FastifyInstance`，但实际推断为 HTTP/2 `FastifyInstance<Http2SecureServer>` |

**根因:** 三个错误相互关联，logger 类型不匹配导致 Fastify 类型推断降级为 HTTP/2 变体，进而引发连锁报错。

**修复方向:**
- 将自定义 logger 转换为 `FastifyBaseLogger`，或使用 Fastify 的 logger 配置对象方式
- 统一 `errorHandler` 的 Fastify 请求类型参数
- 修正 `buildApp()` 的返回类型注解，匹配实际推断类型

---

### C2. TypeScript 编译错误 — `packages/provider-gateway/src/routes/audio.ts`

**文件:** `packages/provider-gateway/src/routes/audio.ts:5`

| 错误码 | 描述 |
|--------|------|
| TS6133 | `import type { MultipartFile } from '@fastify/multipart'` 已导入但从未使用（`noUnusedLocals: true`） |

**修复方向:** 删除未使用的导入。

---

### C3. ESLint 错误 — 3 个

| 文件 | 行 | 规则 | 描述 |
|------|---|------|------|
| `packages/api/src/middleware/auth.ts` | 3 | `@typescript-eslint/no-unused-vars` | `ApiError` 已导入但从未使用 |
| `packages/provider-gateway/src/routes/audio.ts` | 5 | `@typescript-eslint/no-unused-vars` | `MultipartFile` 已导入但从未使用 |
| `packages/provider-gateway/src/routes/audio.ts` | 34 | `@typescript-eslint/no-var-requires` | `require('form-data')` 应替换为 `import FormData from 'form-data'` |

**修复方向:** 删除未使用的导入；将 `require()` 替换为 ES module `import`。

---

### C4. Root `tsconfig.json` 缺少 `include` 约束

**文件:** `tsconfig.json`

**问题:** `compilerOptions.rootDir: "./src"` 已设置，但缺少 `include` 字段。TypeScript 默认 `include: ["**/*"]`，导致 `packages/` 和 `frontend/` 中不在 `./src` 下的 `.ts` 文件被包含，运行 `tsc --noEmit` 产生 **15 个 TS6059 错误**。

**修复方向:** 添加 `"include": ["src/**/*"]` 并补充 `"exclude": ["node_modules", "dist", "packages", "frontend"]`。

---

### C5. Token 存储 Key 不匹配 — 前端认证完全失效

| 文件 | 行 | 行为 |
|------|---|------|
| `frontend/web/src/lib/api/client.ts` | 16 | `localStorage.getItem("token")` — 直接从 localStorage 读 key `"token"` |
| `frontend/web/src/stores/auth-store.ts` | 30 | zustand persist 使用 key `"auth-storage"` — 存储完整状态 JSON: `{state: {user, token, isAuthenticated}, version: 0}` |

**问题:** API 客户端永远找不到 token，因为实际存储的 key 是 `"auth-storage"` 且格式为嵌套 JSON，而非原始字符串。每次 API 调用都会以 401 失败。

**修复方向:** 统一两种方式之一：
- 方案 A: `client.ts` 从 zustand store 读取 `useAuthStore.getState().token`
- 方案 B: 将 `auth-store.ts` persist 的 key 改为 `"token"`，仅存储 token 字符串

---

### C6. `form-data` 缺失依赖 — 运行时崩溃

**文件:** `packages/provider-gateway/src/routes/audio.ts:34`

```typescript
const FormData = require('form-data');
```

`form-data` 在代码中使用，但 **未在 `packages/provider-gateway/package.json` 中声明**。运行时调用音频转录端点会抛出 `MODULE_NOT_FOUND`。

**修复方向:** 将 `form-data` 添加到 `packages/provider-gateway/package.json` 的 `dependencies` 中。

---

### C7. `frontend/web/` 不在 npm workspaces 中 — 依赖未安装

**文件:** 根 `package.json` → `"workspaces": ["packages/*"]`

**问题:** `frontend/web` 不被 workspaces 管理，根目录 `npm install` 不会安装其依赖。而 `frontend/web/package.json` 声明了 `next`、`react`、`zustand`、`axios` 等依赖，但这些依赖 **从未被安装**。

**修复方向:** 在 `frontend/web/` 目录下单独运行 `npm install`，或将 `frontend/web` 添加到 workspaces。

---

## 重要（Important）

### I1. `DB_NAME` 默认值与 `.env` 不一致

| 来源 | 值 |
|------|----|
| `packages/api/src/db/pool.ts` 默认值 | `oral_teacher` |
| `packages/api/.env` 实际值 | `ai_oral_teacher` |
| SQL Schema 使用值 | `oral_teacher` |

**问题:** 若 `.env` 加载失败，应用将连接错误的数据库。且 schema 与 `.env` 配置也冲突。

**修复方向:** 统一为同一值（建议 `oral_teacher`，与 schema 一致）。

---

### I2. `config/.env` 与 `.env.example` 不一致

**`config/.env` 缺少的变量（根据 `.env.example`）：**

| 分类 | 缺失变量 |
|------|---------|
| LLM | `LLM_BASE_URL`、`LLM_MODEL` |
| ASR | `ASR_BASE_URL`、`ASR_MODEL` |
| TTS | `TTS_BASE_URL`、`TTS_MODEL` |
| Pronunciation | 全部（`PRONUNCIATION_BASE_URL`、`PRONUNCIATION_API_KEY`、`PRONUNCIATION_MODEL`） |
| Azure | 全部（8 个 `AZURE_*` 变量） |

**说明:** 当前 `providers.yaml` 硬编码了 `baseUrl` 和 `model`，未使用 `${LLM_BASE_URL}` 等模板变量（与 `providers.example.yaml` 不同），因此不影响运行。但若切换为示例配置将崩溃。

**建议:** 补充 `.env` 中的必要变量，或移除 `.env.example` 中未使用的变量定义以避免混淆。

---

### I3. 重复的类型/函数定义

**涉及文件：**
- `src/provider-config.ts`
- `packages/provider-gateway/src/config/types.ts`
- `packages/provider-gateway/src/config/loader.ts`

| 重复项 | 说明 |
|--------|------|
| `Capability` 类型 | `"llm" | "asr" | "tts" | "pronunciation"` 在两处完全一致 |
| `OpenAICompatibleProviderConfig` 接口 | 字段完全一致，引号风格不同 |
| `AppProviderConfig` 接口 | 字段完全一致 |
| `resolveProvider()` 函数 | 逻辑几乎一致，输入参数类型略有不同 |

**修复方向:** 抽取公共类型到共享包（如 `packages/shared/`），或统一从 `src/provider-config.ts` 引用。

---

### I4. 查询键失效策略不匹配

| 组件 | 行为 |
|------|------|
| `useApiQuery(key: string[])` | 接受自定义 `key` 作为查询键 |
| `useApiMutation` 的 `onSuccess` | 使用 `queryClient.invalidateQueries({ queryKey: [endpoint] })` 进行失效 |

**问题:** 如果 `useApiQuery` 使用了自定义 key（而非 `[endpoint]`），mutation 后的失效将不起作用，导致数据过时。

**修复方向:** 统一失效策略，让 mutation 返回正确的 key 或使用模糊匹配失效。

---

## 一般（Minor）

### M1. ESLint `no-explicit-any` 警告（29 个）

分布文件及次数：
| 文件 | 次数 |
|------|------|
| `packages/provider-gateway/src/utils/http-client.ts` | 9 |
| `packages/provider-gateway/src/routes/audio.ts` | 9 |
| `packages/provider-gateway/src/routes/chat.ts` | 4 |
| `packages/provider-gateway/src/routes/pronunciation.ts` | 4 |
| `packages/provider-gateway/src/config/loader.ts` | 3 |
| `packages/api/src/db/migrations.ts` | 1 |

**建议:** 逐步替代 `any` 为具体类型，提升类型安全性。

---

### M2. `packages/provider-gateway/src/middleware/error.ts` — 参数类型

**文件:** `packages/provider-gateway/src/middleware/error.ts:3`

```typescript
export function errorHandler(error: Error, request: FastifyRequest, reply: FastifyReply)
```

Fastify 的 `setErrorHandler` 期望第一个参数为 `FastifyError`（虽继承自 `Error`，但类型精度不够）。

**建议:** 将 `Error` 替换为 `FastifyError`。

---

### M3. 三个空包

| 包路径 | 状态 |
|--------|------|
| `packages/realtime-orchestrator/` | 完全为空 |
| `packages/worker/` | 完全为空 |
| `frontend/shared/` | 完全为空 |

**建议:** 添加桩代码或更新 README/架构文档说明当前暂未实现。

---

### M4. 版本不一致

| 依赖 | `packages/api` | `packages/provider-gateway` |
|------|---------------|---------------------------|
| `tsx` | `^4.22.5` | `^4.7.0` |

**建议:** 统一为同一版本。

---

## 数据汇总

| 类别 | 数量 |
|------|------|
| TS 编译错误 | 4 |
| ESLint 错误 | 3 |
| ESLint 警告 | 29 |
| 严重问题 | 7 |
| 重要问题 | 4 |
| 一般问题 | 4 |

> **优先级建议:** 按 C1→C5→C6→C3→C4→C2→C7→I1→I3→I4 的顺序修复。
