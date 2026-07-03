# AI Oral Teacher

AI 口语老师系统 - 基于 OpenAI 兼容接口的英语口语教学平台

## 项目结构

```
ai-oral-teacher/
├── packages/
│   ├── provider-gateway/      # AI 能力统一网关
│   ├── api/                    # 业务 API 服务
│   ├── realtime-orchestrator/  # 实时对话编排服务
│   └── worker/                 # 异步任务处理服务
├── config/                     # 配置文件
│   ├── providers.yaml          # 供应商配置
│   └── .env                    # 环境变量
├── storage/                    # 本地存储
│   ├── recordings/             # 录音文件
│   ├── tts-cache/              # TTS 缓存
│   └── reports/                # 报告文件
├── sql/                        # SQL 脚本
│   ├── schema.sql              # 数据库表结构
│   └── seed.sql                # 初始数据
└── docs/                       # 文档
    ├── architecture.md         # 架构设计
    ├── 7-day-plan.md           # 7 天实现计划
    └── tech-stack.md           # 技术选型

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `config/.env.example` 为 `config/.env`，填写 API Key：

```bash
cp config/.env.example config/.env
```

### 3. 初始化数据库

```bash
psql -U postgres -d oral_teacher -f sql/schema.sql
psql -U postgres -d oral_teacher -f sql/seed.sql
```

### 4. 启动 Provider Gateway

```bash
npm run dev:gateway
```

服务将在 http://localhost:8090 启动

### 5. 测试接口

```bash
# 健康检查
curl http://localhost:8090/health

# LLM 测试
curl -X POST http://localhost:8090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# 发音评测测试（返回模拟数据）
curl -X POST http://localhost:8090/v1/pronunciation/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "reference_text": "Hello world",
    "language": "en-US"
  }'
```

## 开发进度

- [x] Day 1: 项目基础搭建 + Provider Gateway
- [ ] Day 2: API Service - 基础设施
- [ ] Day 3: API Service - 业务接口
- [ ] Day 4: Realtime Orchestrator
- [ ] Day 5: Worker Service
- [ ] Day 6: 集成测试
- [ ] Day 7: 部署优化

## 技术栈

- **语言**: TypeScript
- **框架**: Fastify
- **数据库**: PostgreSQL 15+
- **缓存**: Redis 7+
- **任务队列**: BullMQ
- **认证**: JWT

## 文档

详细文档请查看 `docs/` 目录：

- [系统架构](docs/architecture.md)
- [7 天实现计划](docs/7-day-plan.md)
- [技术选型说明](docs/tech-stack.md)
- [OpenAI 兼容网关设计](docs/openai-compatible-gateway.md)

## License

MIT
