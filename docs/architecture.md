# AI Oral Teacher - 系统架构设计

## 系统概述

AI 口语老师是一个基于 AI 的英语口语教学系统，通过实时对话、发音评测、语法纠错等功能帮助用户提升口语能力。

## 核心设计原则

### 1. 供应商无关性

所有 AI 能力（LLM、ASR、TTS、发音评测）通过统一的 OpenAI 兼容接口访问，业务层不感知具体供应商。

### 2. 配置驱动

供应商切换只需修改配置文件，无需改动业务代码。

### 3. 微服务架构

系统拆分为独立服务，各司其职，便于扩展和维护。

## 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│                    (Web / Mobile / Desktop)                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                         API Gateway                          │
│                    (Nginx / API Gateway)                     │
└───────┬───────────────────┬─────────────────────┬───────────┘
        │                   │                     │
        │                   │                     │
┌───────▼────────┐ ┌───────▼────────┐  ┌────────▼──────────┐
│   API Service  │ │   Realtime     │  │  Provider Gateway │
│                │ │  Orchestrator  │  │                   │
│ • 用户管理     │ │                │  │ • LLM Adapter     │
│ • 课程管理     │ │ • 会话管理     │  │ • ASR Adapter     │
│ • 场景管理     │ │ • 句子切分     │  │ • TTS Adapter     │
│ • 报告查询     │ │ • 打断控制     │  │ • Pronunciation   │
│ • 鉴权         │ │ • 实时对话     │  │   Adapter         │
└───────┬────────┘ └───────┬────────┘  └────────┬──────────┘
        │                   │                     │
        │                   │                     │
        │          ┌────────▼─────────┐          │
        │          │  Message Queue   │          │
        │          │     (Redis)      │          │
        │          └────────┬─────────┘          │
        │                   │                     │
        │          ┌────────▼─────────┐          │
        └──────────►   Worker Service  ◄──────────┘
                   │                   │
                   │ • 异步发音评测   │
                   │ • 语法纠错       │
                   │ • 课后总结       │
                   │ • 复习任务生成   │
                   └────────┬─────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐
│   PostgreSQL   │ │     Redis      │ │ Local Storage  │
│                │ │                │ │                │
│ • 业务数据     │ │ • 会话状态     │ │ • 录音文件     │
│ • 用户数据     │ │ • 缓存         │ │ • 合成语音     │
│ • 练习记录     │ │ • 队列         │ │ • 报告文件     │
└────────────────┘ └────────────────┘ └────────────────┘
```

## 服务详细设计

### 1. API Service

**职责**：
- 用户注册、登录、鉴权
- 课程、场景、练习记录的 CRUD
- 学习报告查询
- 媒体资源管理

**技术栈**：
- Node.js + TypeScript
- Fastify / Express
- pg (PostgreSQL client)
- ioredis (Redis client)
- JWT 认证

**核心接口**：
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `GET /api/v1/courses` - 课程列表
- `GET /api/v1/scenarios/:id` - 场景详情
- `GET /api/v1/sessions/:id/report` - 练习报告

### 2. Provider Gateway

**职责**：
- 统一 AI 能力接口
- 路由请求到真实上游供应商
- 统一错误处理、重试、超时
- 请求日志和监控

**技术栈**：
- Node.js + TypeScript
- Fastify
- axios / node-fetch
- YAML 配置解析

**核心接口**：
- `POST /v1/chat/completions` - LLM 对话
- `POST /v1/audio/transcriptions` - 语音转文字
- `POST /v1/audio/speech` - 文字转语音
- `POST /v1/pronunciation/assessments` - 发音评测

**适配器列表**：
- LLM: OpenAI, Azure OpenAI, 其他兼容服务
- ASR: OpenAI Whisper, Azure Speech, 其他兼容服务
- TTS: OpenAI TTS, Azure Speech, 其他兼容服务
- Pronunciation: 自定义评测服务（需实现）

### 3. Realtime Orchestrator

**职责**：
- 实时会话管理
- 句子切分（断句）
- 打断控制
- 协调 LLM、ASR、TTS 调用
- 会话状态维护

**技术栈**：
- Node.js + TypeScript
- WebSocket (ws / socket.io)
- Redis (会话状态存储)
- 事件驱动架构

**工作流程**：
1. 客户端建立 WebSocket 连接
2. 用户说话 → 上传音频
3. 调用 ASR 转写
4. 调用 LLM 生成回复
5. 调用 TTS 合成语音
6. 返回音频给客户端
7. 投递发音评测任务到队列

### 4. Worker Service

**职责**：
- 异步任务处理
- 发音评测
- 语法纠错分析
- 课后总结生成
- 复习任务生成

**技术栈**：
- Node.js + TypeScript
- BullMQ / Bull (任务队列)
- Redis (队列存储)

**任务类型**：
- `pronunciation-assessment` - 发音评测
- `grammar-check` - 语法纠错
- `session-summary` - 课后总结
- `review-task-generation` - 复习任务

## 数据库设计

### 核心表

**用户相关**：
- `users` - 用户主表
- `user_identities` - 用户身份（支持多种登录方式）
- `user_devices` - 用户设备
- `auth_sessions` - 认证会话

**内容相关**：
- `courses` - 课程
- `scenarios` - 场景
- `dialogues` - 场景对话模板

**练习相关**：
- `practice_sessions` - 练习会话
- `practice_turns` - 对话轮次
- `pronunciation_assessments` - 发音评测结果

**媒体相关**：
- `media_assets` - 媒体资源
- `media_variants` - 媒体变体

## 配置管理

### 配置文件结构

```
config/
├── providers.yaml          # 供应商配置（生产）
├── providers.example.yaml  # 供应商配置模板
├── .env                    # 环境变量（生产）
└── .env.example            # 环境变量模板
```

### 环境变量

- `DATABASE_URL` - PostgreSQL 连接串
- `REDIS_URL` - Redis 连接串
- `JWT_SECRET` - JWT 密钥
- `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` - LLM 配置
- `ASR_BASE_URL` / `ASR_API_KEY` / `ASR_MODEL` - ASR 配置
- `TTS_BASE_URL` / `TTS_API_KEY` / `TTS_MODEL` - TTS 配置
- `PRONUNCIATION_BASE_URL` / `PRONUNCIATION_API_KEY` / `PRONUNCIATION_MODEL` - 发音评测配置

## 存储方案

### 本地文件存储

```
storage/
├── recordings/           # 原始录音
│   └── {session_id}/
│       └── {turn_id}.wav
├── tts-cache/           # TTS 缓存
│   └── {hash}.mp3
└── reports/             # 报告文件
    └── {session_id}.pdf
```

### 媒体资源访问

- 数据库存储元数据（路径、大小、时长等）
- 文件系统存储实际文件
- API 提供统一的访问接口

## 安全设计

### 认证方案

- JWT Token 认证
- Refresh Token 机制
- Token 过期自动刷新

### 权限控制

- 用户只能访问自己的数据
- 管理员可以访问所有数据

### 数据安全

- 密码使用 bcrypt 加密
- 敏感数据传输使用 HTTPS
- API Key 不记录在日志中

## 监控与日志

### 日志方案

- 结构化日志（JSON 格式）
- 日志级别：DEBUG / INFO / WARN / ERROR
- 日志轮转和归档

### 监控指标

- API 请求量、响应时间
- 供应商 API 调用量、成功率、响应时间
- 任务队列积压情况
- 数据库连接池状态

## 部署方案

### 开发环境

- 所有服务运行在本地
- PostgreSQL / Redis 使用 Docker 或本地安装
- 使用 `npm run dev` 启动各服务

### 生产环境

- 使用 Docker Compose 或 Kubernetes 部署
- Nginx 作为反向代理
- PostgreSQL / Redis 使用云服务或独立部署
- 使用 PM2 / systemd 管理进程

## 扩展性考虑

### 供应商扩展

- 新增供应商只需在配置文件中添加
- 对于非 OpenAI 兼容的服务，编写适配器

### 功能扩展

- 新增评测维度（如情感识别）
- 新增练习模式（如跟读模式）
- 新增报告类型（如周报、月报）

### 性能扩展

- API Service / Realtime Orchestrator 可水平扩展
- Worker Service 可增加实例数
- Redis 可使用集群模式
- PostgreSQL 可使用读写分离
