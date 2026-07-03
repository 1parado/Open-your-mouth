# 7 天实现计划

## 总体目标

在 7 天内实现 AI 口语老师系统的核心功能，包括后端服务、数据库、配置管理和基础 API。

## 技术栈确认

- **语言**: TypeScript
- **后端框架**: Fastify
- **数据库**: PostgreSQL (用户名: `postgres`, 密码: `123456`)
- **缓存**: Redis
- **任务队列**: BullMQ
- **认证**: JWT
- **HTTP 客户端**: axios
- **WebSocket**: ws / socket.io

---

## Day 1: 项目基础搭建 + Provider Gateway

### 目标

搭建项目基础结构，实现 Provider Gateway 核心功能。

### 任务清单

#### 1. 项目初始化

- [ ] 创建项目根目录结构
  ```
  ai-oral-teacher/
  ├── packages/
  │   ├── provider-gateway/
  │   ├── api/
  │   ├── realtime-orchestrator/
  │   └── worker/
  ├── config/
  ├── storage/
  ├── sql/
  └── docs/
  ```
- [ ] 初始化 monorepo (使用 npm workspaces 或 pnpm workspace)
- [ ] 配置 TypeScript (`tsconfig.json`)
- [ ] 配置 ESLint + Prettier
- [ ] 创建 `.gitignore`

#### 2. Provider Gateway 实现

**目录结构**：
```
packages/provider-gateway/
├── src/
│   ├── config/
│   │   ├── loader.ts          # 配置加载
│   │   └── types.ts           # 配置类型定义
│   ├── adapters/
│   │   ├── base.ts            # 适配器基类
│   │   ├── llm.ts             # LLM 适配器
│   │   ├── asr.ts             # ASR 适配器
│   │   ├── tts.ts             # TTS 适配器
│   │   └── pronunciation.ts   # 发音评测适配器
│   ├── routes/
│   │   ├── chat.ts            # /v1/chat/completions
│   │   ├── audio.ts           # /v1/audio/*
│   │   └── pronunciation.ts   # /v1/pronunciation/assessments
│   ├── middleware/
│   │   ├── auth.ts            # API Key 验证
│   │   ├── error.ts           # 错误处理
│   │   └── logger.ts          # 日志记录
│   ├── utils/
│   │   ├── http-client.ts     # HTTP 客户端封装
│   │   └── retry.ts           # 重试逻辑
│   ├── app.ts                 # Fastify 应用
│   └── index.ts               # 入口
├── package.json
└── tsconfig.json
```

**核心功能**：

- [ ] 实现配置加载器（读取 YAML + 环境变量）
- [ ] 实现 HTTP 客户端封装（axios + 重试）
- [ ] 实现 LLM 适配器
  - `POST /v1/chat/completions`
  - 支持流式响应
  - 路由到配置的上游服务
- [ ] 实现 ASR 适配器
  - `POST /v1/audio/transcriptions`
  - 支持 multipart/form-data
- [ ] 实现 TTS 适配器
  - `POST /v1/audio/speech`
  - 返回音频流
- [ ] 实现发音评测适配器（占位实现）
  - `POST /v1/pronunciation/assessments`
  - 返回模拟数据
- [ ] 实现错误处理中间件
- [ ] 实现日志中间件
- [ ] 编写启动脚本

#### 3. 测试

- [ ] 使用 curl 测试 LLM 接口
- [ ] 使用 curl 测试 ASR 接口
- [ ] 使用 curl 测试 TTS 接口

### 交付物

- Provider Gateway 服务可以启动
- 四个核心接口可以正常响应
- 配置文件可以正确加载

---

## Day 2: API Service - 基础设施

### 目标

实现 API Service 的基础设施，包括数据库连接、认证、基础中间件。

### 任务清单

#### 1. 数据库连接

**目录结构**：
```
packages/api/
├── src/
│   ├── db/
│   │   ├── pool.ts            # 连接池
│   │   ├── migrations.ts      # 迁移管理
│   │   └── queries.ts         # 查询构建
│   ├── models/
│   │   ├── user.ts
│   │   ├── course.ts
│   │   └── session.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── courses.ts
│   │   └── sessions.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── error.ts
│   │   └── logger.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── hash.ts
│   │   └── validation.ts
│   ├── app.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

**核心功能**：

- [ ] 配置 PostgreSQL 连接池
  ```typescript
  const pool = new Pool({
    host: 'localhost',
    database: 'oral_teacher',
    user: 'postgres',
    password: '123456',
    port: 5432,
  });
  ```
- [ ] 创建数据库连接测试脚本
- [ ] 实现查询封装（参数化查询）

#### 2. 认证系统

- [ ] 实现密码哈希工具（bcrypt）
- [ ] 实现 JWT 工具
  - `generateAccessToken(userId)`
  - `generateRefreshToken(userId)`
  - `verifyToken(token)`
- [ ] 实现认证中间件
  - 从 `Authorization: Bearer <token>` 提取 token
  - 验证 token 有效性
  - 注入 `req.user`

#### 3. 基础路由

- [ ] `POST /api/v1/auth/register` - 用户注册
  - 验证邮箱/密码
  - 哈希密码
  - 插入用户记录
  - 返回 access_token + refresh_token
- [ ] `POST /api/v1/auth/login` - 用户登录
  - 验证邮箱/密码
  - 返回 access_token + refresh_token
- [ ] `POST /api/v1/auth/refresh` - 刷新 token
- [ ] `GET /api/v1/auth/me` - 获取当前用户信息

#### 4. 中间件

- [ ] 错误处理中间件
- [ ] 日志中间件
- [ ] 请求验证中间件（使用 Zod 或 Joi）

#### 5. 测试

- [ ] 测试用户注册
- [ ] 测试用户登录
- [ ] 测试 token 验证

### 交付物

- API Service 可以启动
- 认证系统正常工作
- 可以注册、登录用户

---

## Day 3: API Service - 业务接口

### 目标

实现课程、场景、练习记录相关的业务接口。

### 任务清单

#### 1. 课程管理

- [ ] `GET /api/v1/courses` - 课程列表
  - 支持分页
  - 支持筛选（难度、类型）
- [ ] `GET /api/v1/courses/:id` - 课程详情
- [ ] `POST /api/v1/courses` - 创建课程（管理员）
- [ ] `PUT /api/v1/courses/:id` - 更新课程（管理员）

#### 2. 场景管理

- [ ] `GET /api/v1/courses/:courseId/scenarios` - 场景列表
- [ ] `GET /api/v1/scenarios/:id` - 场景详情
  - 包含对话模板
  - 包含提示词
- [ ] `POST /api/v1/scenarios` - 创建场景（管理员）

#### 3. 练习记录

- [ ] `POST /api/v1/sessions` - 创建练习会话
  - 记录场景 ID、用户 ID
  - 返回 session_id
- [ ] `GET /api/v1/sessions/:id` - 获取会话详情
- [ ] `GET /api/v1/sessions` - 获取会话列表（我的练习记录）
  - 支持分页
  - 支持日期筛选

#### 4. 媒体资源

- [ ] `GET /api/v1/media/:id` - 获取媒体文件
  - 验证权限
  - 返回文件流
- [ ] `POST /api/v1/media/upload` - 上传媒体文件
  - 保存到 `storage/` 目录
  - 记录元数据到数据库

#### 5. 数据初始化

- [ ] 运行 `seed.sql` 插入示例数据
  - 示例课程
  - 示例场景
  - 示例对话模板

#### 6. 测试

- [ ] 测试课程列表接口
- [ ] 测试场景详情接口
- [ ] 测试创建练习会话
- [ ] 测试媒体文件上传和访问

### 交付物

- 课程、场景、练习记录接口正常工作
- 示例数据已导入
- 可以通过 API 查询课程和场景

---

## Day 4: Realtime Orchestrator - 核心逻辑

### 目标

实现 Realtime Orchestrator 的核心逻辑，支持 WebSocket 连接和实时对话。

### 任务清单

#### 1. 项目结构

**目录结构**：
```
packages/realtime-orchestrator/
├── src/
│   ├── config/
│   │   └── index.ts
│   ├── services/
│   │   ├── session-manager.ts    # 会话管理
│   │   ├── dialogue-engine.ts    # 对话引擎
│   │   ├── sentence-splitter.ts  # 句子切分
│   │   └── provider-client.ts    # Provider Gateway 客户端
│   ├── handlers/
│   │   ├── connection.ts         # 连接处理
│   │   ├── audio.ts              # 音频处理
│   │   └── control.ts            # 控制消息
│   ├── models/
│   │   ├── session.ts
│   │   └── turn.ts
│   ├── utils/
│   │   └── redis-client.ts
│   ├── app.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

#### 2. WebSocket 服务

- [ ] 初始化 WebSocket 服务（使用 `ws` 或 `socket.io`）
- [ ] 实现连接处理
  - 验证 token
  - 创建会话
- [ ] 实现消息路由
  - `audio` - 音频数据
  - `control` - 控制消息（暂停、继续、结束）
  - `ping` - 心跳

#### 3. 会话管理

- [ ] 实现会话管理器
  - 在 Redis 中存储会话状态
  - 支持多个并发会话
  - 会话超时自动清理
- [ ] 会话状态包含：
  - `session_id`
  - `user_id`
  - `scenario_id`
  - `turn_count`
  - `dialogue_history` - 对话历史
  - `current_state` - 当前状态（listening / thinking / speaking）

#### 4. 对话引擎

- [ ] 实现对话流程
  1. 接收用户音频
  2. 调用 Provider Gateway ASR 接口转写
  3. 构建 prompt（场景提示词 + 对话历史 + 用户输入）
  4. 调用 Provider Gateway LLM 接口生成回复
  5. 调用 Provider Gateway TTS 接口合成语音
  6. 返回音频给客户端
  7. 保存对话轮次到数据库
  8. 投递发音评测任务到队列

- [ ] 实现 Provider Gateway 客户端
  - HTTP 客户端封装
  - 支持流式响应（LLM）
  - 错误处理

#### 5. 句子切分

- [ ] 实现简单的句子切分逻辑
  - 基于标点符号（. ! ?）
  - 基于静音检测（可选）

#### 6. Redis 集成

- [ ] 配置 Redis 连接
- [ ] 实现会话状态存储
- [ ] 实现消息队列（用于投递任务）

#### 7. 测试

- [ ] 使用 WebSocket 客户端连接
- [ ] 测试发送音频数据
- [ ] 测试接收 TTS 音频
- [ ] 验证对话历史存储

### 交付物

- Realtime Orchestrator 可以启动
- WebSocket 连接正常
- 可以进行简单的一问一答对话

---

## Day 5: Worker Service + 发音评测

### 目标

实现 Worker Service，处理异步任务，重点实现发音评测功能。

### 任务清单

#### 1. 项目结构

**目录结构**：
```
packages/worker/
├── src/
│   ├── config/
│   │   └── index.ts
│   ├── jobs/
│   │   ├── pronunciation-assessment.ts
│   │   ├── grammar-check.ts
│   │   ├── session-summary.ts
│   │   └── review-task.ts
│   ├── services/
│   │   ├── provider-client.ts
│   │   └── db-client.ts
│   ├── utils/
│   │   └── queue.ts
│   ├── app.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

#### 2. 任务队列

- [ ] 配置 BullMQ
  - 连接 Redis
  - 定义队列（pronunciation、grammar、summary、review）
- [ ] 实现队列封装
  - `addJob(queue, data)`
  - `processJob(queue, handler)`

#### 3. 发音评测任务

- [ ] 实现发音评测 Job Handler
  ```typescript
  interface PronunciationJobData {
    sessionId: string;
    turnId: string;
    audioPath: string;
    referenceText: string;
    language: string;
  }
  ```
- [ ] 调用 Provider Gateway 发音评测接口
- [ ] 解析评测结果
- [ ] 保存到数据库（`pronunciation_assessments` 表）
- [ ] 更新练习轮次记录

#### 4. 语法纠错任务（简化版）

- [ ] 实现语法纠错 Job Handler
- [ ] 调用 LLM 接口分析语法错误
- [ ] 保存纠错结果到数据库

#### 5. 课后总结任务（简化版）

- [ ] 实现课后总结 Job Handler
- [ ] 汇总会话数据
  - 对话轮次
  - 发音评分
  - 语法错误
- [ ] 调用 LLM 生成总结报告
- [ ] 保存报告到数据库和文件系统

#### 6. 错误处理

- [ ] 实现任务失败重试
- [ ] 实现死信队列
- [ ] 错误日志记录

#### 7. 测试

- [ ] 手动投递发音评测任务
- [ ] 验证评测结果保存
- [ ] 测试任务重试逻辑

### 交付物

- Worker Service 可以启动
- 可以处理发音评测任务
- 评测结果正确保存到数据库

---

## Day 6: 集成测试 + 完善功能

### 目标

进行端到端集成测试，完善遗漏功能，修复 bug。

### 任务清单

#### 1. 集成测试

- [ ] 完整流程测试：
  1. 用户注册 / 登录
  2. 查询课程列表
  3. 选择场景
  4. 建立 WebSocket 连接
  5. 发送音频
  6. 接收 TTS 音频
  7. 查看发音评测结果
  8. 查看课后总结

#### 2. Provider Gateway 完善

- [ ] 实现 API Key 验证（Bearer Token）
- [ ] 实现请求限流
- [ ] 完善错误响应格式
- [ ] 添加健康检查接口 `GET /health`

#### 3. API Service 完善

- [ ] 实现练习报告接口
  - `GET /api/v1/sessions/:id/report`
  - 包含对话历史、发音评分、语法错误、总结
- [ ] 实现学习统计接口
  - `GET /api/v1/users/stats`
  - 总练习次数、总时长、平均评分
- [ ] 完善权限控制
  - 用户只能访问自己的数据

#### 4. Realtime Orchestrator 完善

- [ ] 实现打断控制
  - 用户说话时中断 AI 播报
- [ ] 实现断线重连
  - 恢复会话状态
- [ ] 优化对话流程
  - 减少等待时间
  - 支持并发处理

#### 5. 错误处理完善

- [ ] 统一错误码和错误消息
- [ ] 完善日志记录
- [ ] 错误监控（可选）

#### 6. 文档完善

- [ ] 编写 API 文档
- [ ] 编写部署文档
- [ ] 编写开发文档

#### 7. 测试

- [ ] 压力测试（模拟多用户）
- [ ] 边界测试（大文件、长文本）
- [ ] 异常测试（网络中断、服务宕机）

### 交付物

- 所有服务集成正常工作
- 主要功能完整可用
- 基础文档已完成

---

## Day 7: 部署 + 优化

### 目标

部署系统到开发/生产环境，进行性能优化。

### 任务清单

#### 1. Docker 化

- [ ] 为每个服务编写 Dockerfile
  ```dockerfile
  FROM node:18-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY dist ./dist
  CMD ["node", "dist/index.js"]
  ```
- [ ] 编写 docker-compose.yml
  ```yaml
  services:
    postgres:
      image: postgres:15
      environment:
        POSTGRES_PASSWORD: 123456
      ports:
        - "5432:5432"
    
    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
    
    provider-gateway:
      build: ./packages/provider-gateway
      ports:
        - "8090:8090"
    
    api:
      build: ./packages/api
      ports:
        - "8080:8080"
    
    realtime-orchestrator:
      build: ./packages/realtime-orchestrator
      ports:
        - "8081:8081"
    
    worker:
      build: ./packages/worker
  ```

#### 2. 配置管理

- [ ] 完善环境变量配置
- [ ] 区分开发/生产配置
- [ ] 配置热加载（可选）

#### 3. 反向代理

- [ ] 配置 Nginx
  - 静态资源
  - API 路由
  - WebSocket 代理
- [ ] 配置 HTTPS（可选）

#### 4. 性能优化

- [ ] 数据库索引优化
  - 为高频查询字段添加索引
- [ ] Redis 缓存
  - 课程列表缓存
  - 场景详情缓存
  - TTS 结果缓存
- [ ] 连接池优化
  - 调整数据库连接池大小
  - 调整 Redis 连接池大小

#### 5. 监控和日志

- [ ] 配置日志收集
  - 使用 winston 或 pino
  - 日志轮转
- [ ] 基础监控（可选）
  - 服务健康检查
  - 资源使用监控

#### 6. 启动脚本

- [ ] 编写启动脚本
  ```bash
  # start.sh
  docker-compose up -d postgres redis
  sleep 5
  npm run migrate
  npm run seed
  docker-compose up -d provider-gateway api realtime-orchestrator worker
  ```

#### 7. 测试

- [ ] 在 Docker 环境中测试
- [ ] 验证所有服务正常启动
- [ ] 端到端测试

#### 8. 部署文档

- [ ] 编写部署指南
  - 环境要求
  - 安装步骤
  - 配置说明
  - 常见问题

### 交付物

- 系统可以通过 Docker 一键部署
- 所有服务运行稳定
- 部署文档完整

---

## 每日检查清单

每天结束时，确保：

- [ ] 代码已提交到 Git
- [ ] 核心功能已测试通过
- [ ] 重要问题已记录（TODO / FIXME）
- [ ] 文档已更新（API 变更、配置变更）

---

## 技术要点提醒

### Day 1-2: TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

### Day 2: PostgreSQL 连接

```typescript
// packages/api/src/db/pool.ts
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'oral_teacher',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Day 4: WebSocket 认证

```typescript
// 从 query string 或 header 获取 token
const token = url.searchParams.get('token') || 
              headers['authorization']?.replace('Bearer ', '');

if (!token || !verifyToken(token)) {
  ws.close(1008, 'Unauthorized');
  return;
}
```

### Day 5: BullMQ 配置

```typescript
// packages/worker/src/utils/queue.ts
import { Queue, Worker } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const pronunciationQueue = new Queue('pronunciation', { connection });

export const createWorker = (queueName: string, processor: any) => {
  return new Worker(queueName, processor, { connection });
};
```

---

## 风险和注意事项

1. **供应商 API 配额**: OpenAI API 有请求限制，注意监控使用量
2. **音频文件大小**: 限制上传音频大小（建议 < 10MB）
3. **WebSocket 连接数**: 单机 WebSocket 连接数有限，注意扩展性
4. **数据库性能**: 高频查询需要添加索引
5. **Redis 内存**: 会话状态占用内存，注意清理过期数据
6. **文件存储**: 本地存储方案不适合生产环境，后续考虑 OSS

---

## 后续优化方向（Day 8+）

- 前端开发（Web / Mobile）
- 实时音频流处理（VAD 语音活动检测）
- 更精确的发音评测（GOP 算法）
- 学习路径推荐
- 社交功能（排行榜、打卡）
- 管理后台
- 数据分析和报表
- 性能优化和压测
- 生产环境部署
- CI/CD 流程
