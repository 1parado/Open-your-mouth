# 分阶段架构说明

## 架构原则

当前产品不是通用 AI 工具集合，而是“老师驱动的口语练习产品”。  
因此系统架构应当服务于以下核心链路：

1. 用户登录
2. 选择老师
3. 进入练习
4. 用户说话
5. 老师回复
6. 产生反馈
7. 逐步升级为数字人

## 当前阶段架构

当前最简可运行架构如下：

```
Web Client
  ├─ 登录
  ├─ 老师卡片首页
  └─ 老师会话页
       ├─ 调用 /v1/chat/completions
       └─ 调用 /v1/audio/speech

API Service
  └─ 用户鉴权

Provider Gateway
  ├─ LLM
  ├─ ASR
  ├─ TTS
  └─ Pronunciation
```

这个阶段的重点不是全量后端，而是尽快形成可体验的老师产品主链路。

## Phase 1：前端驱动架构

### 特点

- 老师配置可先放在前端静态文件
- 老师差异通过 `prompt + voice + 展示文案` 实现
- 用户会话可以先不持久化
- 语音识别可以先用浏览器能力

### 适用原因

- 开发快
- 能快速验证老师体验
- 能证明产品不是“工具页集合”

## Phase 2：老师系统架构

### 新增核心域

- Teacher
- VoiceProfile
- AvatarProfile
- Scenario
- PracticeSession

### 架构变化

```
Web Client
  ├─ GET /teachers
  ├─ GET /teachers/:id
  ├─ GET /teachers/:id/scenarios
  └─ POST /practice-sessions

API Service
  ├─ Auth
  ├─ Teachers
  ├─ Scenarios
  └─ Practice Sessions
```

### 关键点

- 老师从静态配置变成真实业务实体
- 首页和老师页都由 API 提供数据

## Phase 3：实时语音架构

### 新增服务

- Realtime Orchestrator

### 职责

- WebSocket 会话管理
- 实时音频输入
- 会话状态缓存
- 中断控制
- 协调 ASR / LLM / TTS

### 架构变化

```
Client
  └─ WebSocket
       ↓
Realtime Orchestrator
  ├─ session manager
  ├─ turn coordinator
  └─ interrupt control
       ↓
Provider Gateway
  ├─ ASR
  ├─ LLM
  └─ TTS
```

### 为什么单独拆这个服务

- 实时语音链路和普通 REST API 的性能模型不同
- 中断控制和会话状态不适合直接堆在 API Service

## Phase 4：反馈处理架构

### 新增服务或能力

- Worker Service

### 职责

- 发音评测异步处理
- 语法纠错摘要
- 会话总结
- 推荐下一次练习

### 架构变化

```
Practice Session End
  └─ enqueue jobs
       ↓
Worker
  ├─ pronunciation assessment
  ├─ grammar summary
  └─ session feedback
```

### 为什么异步

- 发音评测和总结不应该阻塞主对话链路
- 用户完成练习后可以先看到核心结果，再逐步补充完整反馈

## Phase 5：数字人架构

### 新增能力

- Digital Human Renderer
- Lip Sync / Emotion Mapper

### 架构变化

```
LLM Reply Text
  ├─ TTS -> audio
  └─ emotion tag
         ↓
Digital Human Renderer
  ├─ lip sync
  ├─ expression
  └─ motion preset
         ↓
Client Playback
```

### 设计原则

- 数字人只是老师的呈现层
- 不能反过来主导老师的数据模型
- 必须有纯语音模式作为降级路径

## 推荐数据边界

### API Service

- 用户
- 老师
- 场景
- 会话元数据
- 历史记录

### Realtime Orchestrator

- 临时会话状态
- 当前对话轮次
- 中断状态

### Worker

- 异步评测
- 总结生成
- 反馈写回

### Provider Gateway

- 所有 AI 能力统一入口
- 屏蔽供应商差异

## 当前项目的最佳结合方式

当前仓库里最应该保留的中台能力是 `provider-gateway`。  
最应该改造的是产品入口和业务模型。  
最不应该继续保留的是“工具页驱动”的首页叙事。

## 一句话结论

架构要服务产品。这个产品的架构演进路径应该是：

**老师静态配置 -> 老师后端实体 -> 实时语音服务 -> 反馈异步化 -> 数字人渲染层。**
