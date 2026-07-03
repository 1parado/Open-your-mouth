# AI Oral Teacher - 技术选型说明

## 编程语言

**TypeScript**

- 类型安全，减少运行时错误
- 优秀的 IDE 支持和代码提示
- Node.js 生态成熟，库丰富
- 适合快速开发和迭代

## 后端框架

**Fastify**

选择理由：
- 性能优于 Express（~2-3倍吞吐量）
- 内置 schema 验证（JSON Schema）
- 插件系统设计优秀
- TypeScript 支持友好
- 异步处理性能好

替代方案：Express（更成熟，生态更大）

## 数据库

### 主数据库: PostgreSQL 15+

选择理由：
- 开源、成熟、稳定
- 强大的 JSON 支持（JSONB）
- 全文搜索能力
- 丰富的扩展（pg_trgm 模糊搜索、citext 不区分大小写）
- 事务支持完善

### 缓存: Redis 7+

用途：
- 会话状态存储
- 缓存热点数据（课程、场景）
- 任务队列（BullMQ）
- 分布式锁

## ORM / 数据库客户端

**node-postgres (pg)**

选择理由：
- 轻量、性能好
- 直接写 SQL，灵活性高
- 不需要复杂的 ORM 映射
- 支持连接池

不选择 Prisma/TypeORM 的原因：
- 项目规模不大，SQL 复杂度可控
- 原生 SQL 性能更好，可调优空间大
- 减少抽象层，便于问题排查

## HTTP 客户端

**axios**

选择理由：
- API 简洁
- 支持 Promise
- 拦截器机制（请求/响应）
- 自动转换 JSON
- 超时、重试易配置

## WebSocket

**ws**

选择理由：
- 轻量、性能好
- 低层级 API，灵活性高
- 内存占用小

替代方案：socket.io（更高层抽象，自动降级，但更重）

## 任务队列

**BullMQ**

选择理由：
- 基于 Redis，性能好
- 支持任务优先级、延迟、重试
- 可视化管理工具（Bull Board）
- TypeScript 支持好
- 活跃维护

## 认证方案

**JWT (jsonwebtoken)**

选择理由：
- 无状态，易扩展
- 前后端分离友好
- 标准化，跨平台支持好

配合 Refresh Token 实现：
- Access Token：短期有效（15分钟）
- Refresh Token：长期有效（7天），用于刷新

## 密码加密

**bcrypt**

选择理由：
- 行业标准
- 自动加盐
- 计算成本可配置（防暴力破解）

## 参数验证

**Zod**

选择理由：
- TypeScript-first 设计
- 类型推断优秀
- API 简洁
- 错误提示清晰

替代方案：Joi（更成熟，但 TypeScript 支持较弱）

## 日志

**pino**

选择理由：
- 极快（JSON 日志）
- 低开销
- 结构化日志
- 生态好（pino-pretty 美化输出）

## 配置管理

**YAML + dotenv**

- YAML 用于复杂配置（providers.yaml）
- .env 用于环境敏感信息（API Key、数据库密码）

解析库：
- `js-yaml`: YAML 解析
- `dotenv`: 环境变量加载

## 文件上传

**Fastify Multipart**

选择理由：
- Fastify 官方插件
- 支持流式处理（内存友好）
- 文件大小限制

## 测试框架（可选）

**Vitest**

选择理由：
- 快速（基于 Vite）
- 兼容 Jest API
- TypeScript 原生支持
- ESM 友好

## 代码质量

- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查

## 部署

### 开发环境
- 直接运行 TypeScript（ts-node 或 tsx）
- 数据库/Redis 使用 Docker 或本地安装

### 生产环境
- Docker + Docker Compose
- Nginx 反向代理
- PM2 进程管理（或 systemd）

## 监控（可选）

- **Prometheus + Grafana**: 指标监控
- **ELK / Loki**: 日志收集
- **Sentry**: 错误追踪

## 技术栈总结

| 层级 | 技术 | 版本 |
|------|------|------|
| 语言 | TypeScript | 5.x |
| 运行时 | Node.js | 18.x / 20.x |
| 后端框架 | Fastify | 4.x |
| 数据库 | PostgreSQL | 15.x |
| 缓存 | Redis | 7.x |
| 数据库客户端 | pg | 8.x |
| HTTP 客户端 | axios | 1.x |
| WebSocket | ws | 8.x |
| 任务队列 | BullMQ | 4.x |
| 认证 | jsonwebtoken | 9.x |
| 密码加密 | bcrypt | 5.x |
| 参数验证 | Zod | 3.x |
| 日志 | pino | 8.x |
| 配置解析 | js-yaml, dotenv | - |

## 为什么不选择其他方案

### 为什么不用 NestJS？
- 过于重量级，学习曲线陡
- 对于简单项目来说过度设计
- Fastify + 简单架构足够

### 为什么不用 GraphQL？
- RESTful API 足够简单
- 实时对话主要通过 WebSocket
- 增加复杂度不带来明显收益

### 为什么不用 MongoDB？
- 需要复杂查询和 JOIN
- PostgreSQL JSONB 已支持灵活存储
- 事务支持更好

### 为什么不用 Prisma？
- 项目规模不大，SQL 复杂度可控
- 原生 SQL 性能更好
- 减少抽象层和魔法

### 为什么不用 RabbitMQ？
- Redis + BullMQ 足够轻量
- 部署更简单
- 延迟更低

## 开发工具推荐

- **IDE**: VS Code / WebStorm
- **数据库管理**: DBeaver / pgAdmin
- **Redis 管理**: Redis Insight / Medis
- **API 测试**: Postman / Insomnia / REST Client (VS Code)
- **WebSocket 测试**: Postman / wscat
- **Git 客户端**: SourceTree / GitKraken / CLI

## 依赖安装清单

### Provider Gateway
```bash
npm install fastify axios js-yaml dotenv pino
npm install -D typescript @types/node tsx
```

### API Service
```bash
npm install fastify pg bcrypt jsonwebtoken zod pino
npm install -D typescript @types/node @types/pg @types/bcrypt @types/jsonwebtoken tsx
```

### Realtime Orchestrator
```bash
npm install fastify ws axios ioredis pino
npm install -D typescript @types/node @types/ws tsx
```

### Worker
```bash
npm install bullmq axios pg ioredis pino
npm install -D typescript @types/node @types/pg tsx
```

## 性能预估

基于 Fastify + PostgreSQL + Redis 的架构：

- **API 吞吐量**: ~10,000 req/s（单实例）
- **WebSocket 连接数**: ~10,000 并发（单实例）
- **任务处理**: ~1,000 jobs/s（取决于任务复杂度）
- **数据库**: ~5,000 qps（合理索引和查询优化）

实际性能取决于：
- 硬件配置
- 网络延迟
- 上游 AI 服务响应时间
- 查询复杂度

---

## 前端技术栈

### Web 端

**Next.js 14+ (React 18+)**

选择理由：
- 完整的 React 全栈框架，支持 SSR/SSG
- App Router 模式，服务端组件提升性能
- 优秀的 TypeScript 支持
- 文件系统路由，开发效率高
- 生态成熟，社区活跃

核心依赖：
- **React 18**: UI 框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 原子化 CSS，开发效率高
- **shadcn/ui**: 基于 Tailwind 的组件库
- **TanStack Query (React Query)**: 服务端状态管理
- **Zustand**: 客户端状态管理
- **axios**: HTTP 客户端

### 移动端 & 桌面端

**Flutter 3.19+**

选择理由：
- 一套代码覆盖 iOS、Android、Windows、macOS、Linux
- 优秀的跨平台性能和一致的 UI 体验
- 热重载开发效率高
- 支持 Web 嵌入（可选方案）
- 丰富的插件生态

核心依赖：
- **flutter_bloc**: 状态管理
- **dio**: HTTP 客户端
- **get_it / injectable**: 依赖注入
- **freezed**: 不可变数据类
- **shared_preferences**: 本地存储
- **audioplayers**: 音频播放
- **record**: 音频录制
- **web_socket_channel**: WebSocket 通信

### 前后端交互

**API 通信**: RESTful API + WebSocket
- 认证: JWT (Bearer Token)
- 数据格式: JSON
- 实时通信: WebSocket (口语练习)

### 前端项目结构

```
frontend/
├── web/                    # Next.js Web 端
│   ├── src/
│   │   ├── app/           # App Router
│   │   ├── components/    # 组件
│   │   ├── hooks/         # 自定义 Hooks
│   │   ├── lib/           # 工具函数
│   │   ├── stores/        # 状态管理
│   │   └── types/         # TypeScript 类型
│   └── package.json
│
├── mobile/                 # Flutter 移动端 + 桌面端
│   ├── lib/
│   │   ├── main.dart
│   │   ├── models/        # 数据模型
│   │   ├── views/         # 页面
│   │   ├── widgets/       # 组件
│   │   ├── blocs/         # BLoC 状态管理
│   │   ├── services/      # 服务层（API、WebSocket）
│   │   └── utils/         # 工具函数
│   └── pubspec.yaml
│
└── shared/                 # 共享代码（类型定义、常量等）
    └── src/
```

### 前端安装清单

#### Web (Next.js)
```bash
# 初始化
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir

# 核心依赖
cd web
npm install @tanstack/react-query zustand axios

# UI 组件库
npm install -D @shadcn/ui
```

#### Mobile & Desktop (Flutter)
```bash
# 创建项目
flutter create --org com.aioralteacher mobile

cd mobile

# 添加依赖 (pubspec.yaml)
flutter pub add flutter_bloc dio get_it injectable freezed_annotation json_annotation
flutter pub add --dev build_runner freezed json_serializable injectable_generator
flutter pub add shared_preferences audioplayers record web_socket_channel
```
