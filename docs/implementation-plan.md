# Implementation Plan

## 你现在最合理的落地方式

在现有技术栈下，建议把系统拆成 5 个服务：

1. `api`
2. `provider-gateway`
3. `realtime-orchestrator`
4. `worker`
5. `postgres + redis`

## 服务职责

### api

- 用户、课程、场景、报告接口
- 鉴权
- 练习记录查询

### provider-gateway

- 对外暴露统一 OpenAI 兼容接口
- 内部路由到真实上游
- 统一重试、日志、超时、错误码

### realtime-orchestrator

- 会话管理
- 句子切分
- 打断控制
- 调用 `provider-gateway`

### worker

- 异步发音评测
- 语法纠错
- 课后总结
- 复习任务生成

## 本地存储方案

因为你没有 OSS，先用：

- 原始录音：`storage/recordings`
- 合成语音缓存：`storage/tts-cache`
- 报告导出文件：`storage/reports`

数据库只保存元数据。

## MVP 供应商组合

- `LLM`: Ollama
- `ASR`: faster-whisper
- `TTS`: Azure Speech TTS
- `Pronunciation`: Azure Speech Pronunciation Assessment

## 二期替换能力

以后如果你获得 OpenAI API 或其他兼容服务，只需要修改：

- `providers.active.*`
- 对应 provider 的 `baseUrl / apiKey / model`

业务逻辑不需要整体重写。
