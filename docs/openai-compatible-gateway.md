# OpenAI Compatible Gateway Blueprint

## 目标

把 `LLM / ASR / TTS / 发音评测` 全部收口成统一的提供方配置：

- `baseUrl`
- `apiKey`
- `model`

应用层不再感知 Azure、Ollama、Whisper、本地评测服务的差异，只通过统一协议访问。

## 关键结论

不是所有上游服务都天然支持 OpenAI 协议。

- `Ollama` 可以作为 OpenAI 兼容接口使用。
- 部分转写服务可以通过自建包装层暴露成 OpenAI 风格的 `/v1/audio/transcriptions`。
- Azure Speech `TTS` 和 `Pronunciation Assessment` 不是原生 OpenAI 协议，需要你自己在中间层做适配。

所以正确做法不是要求所有厂商都原生支持 OpenAI 协议，而是：

1. 应用内部只认 OpenAI 兼容接口
2. 对不兼容的上游，写适配网关
3. 业务切换只改配置文件

## 推荐服务边界

### 1. 统一 Provider Gateway

统一对外暴露以下接口：

- `POST /v1/chat/completions`
- `POST /v1/audio/transcriptions`
- `POST /v1/audio/speech`
- `POST /v1/pronunciation/assessments`

前三个尽量对齐 OpenAI 风格。
最后一个不是 OpenAI 官方标准路径，但继续保持：

- Bearer Token 认证
- `model` 字段
- JSON 请求/响应风格

这样前端和业务服务依旧只需要配置 `url + key + model`。

### 2. 上游适配器

#### LLM Adapter

- OpenAI
- Azure OpenAI
- Ollama
- 其他 OpenAI-compatible 推理网关

统一映射到：

- `/v1/chat/completions`

#### ASR Adapter

- OpenAI 转写
- 本地 `faster-whisper` 服务

统一映射到：

- `/v1/audio/transcriptions`

#### TTS Adapter

- OpenAI TTS
- Azure Speech TTS
- Piper

统一映射到：

- `/v1/audio/speech`

#### Pronunciation Adapter

- Azure Pronunciation Assessment
- 本地 GOP/Forced Alignment 服务

统一映射到：

- `/v1/pronunciation/assessments`

## 为什么要单独保留发音评测接口

发音评测不是 OpenAI 官方协议里的标准能力。
如果你强行塞进 `chat/completions`，会有三个问题：

1. 响应结构不稳定
2. 前后端很难做类型约束
3. 以后替换 Azure 或本地评分引擎时，成本更高

所以应该保留一个“OpenAI 风格但产品自定义”的标准接口。

## 建议的统一请求格式

### 1. 对话

`POST /v1/chat/completions`

```json
{
  "model": "qwen2.5:14b-instruct",
  "messages": [
    { "role": "system", "content": "You are an English speaking teacher." },
    { "role": "user", "content": "Let's practice airport check-in." }
  ],
  "temperature": 0.6,
  "stream": true
}
```

### 2. 转写

`POST /v1/audio/transcriptions`

表单字段保持 OpenAI 习惯：

- `file`
- `model`
- `language`
- `prompt`

### 3. 语音合成

`POST /v1/audio/speech`

```json
{
  "model": "azure-en-us-teacher",
  "input": "Welcome to the airport. May I see your passport?",
  "voice": "teacher-default",
  "format": "mp3",
  "speed": 1.0
}
```

### 4. 发音评测

`POST /v1/pronunciation/assessments`

```json
{
  "model": "azure-pron-v1",
  "reference_text": "I would like to check in for my flight.",
  "language": "en-US",
  "audio_url": "/media/session-001/u-001.wav",
  "granularity": "phoneme",
  "dimension_weights": {
    "accuracy": 0.3,
    "fluency": 0.25,
    "completeness": 0.2,
    "prosody": 0.15,
    "naturalness": 0.1
  }
}
```

## 推荐响应格式

```json
{
  "id": "pron_123",
  "object": "pronunciation.assessment",
  "model": "azure-pron-v1",
  "language": "en-US",
  "reference_text": "I would like to check in for my flight.",
  "scores": {
    "accuracy": 78,
    "fluency": 74,
    "completeness": 90,
    "prosody": 68,
    "naturalness": 72,
    "overall": 77
  },
  "issues": [
    {
      "token": "flight",
      "start_ms": 1280,
      "end_ms": 1710,
      "severity": "medium",
      "category": "phoneme",
      "message": "The initial consonant cluster is unclear."
    }
  ]
}
```

## 配置切换原则

应用运行时只读取配置文件里的四个 active provider：

- `providers.active.llm`
- `providers.active.asr`
- `providers.active.tts`
- `providers.active.pronunciation`

切换供应商时，不改业务代码，只切换：

- `baseUrl`
- `apiKey`
- `model`

## 推荐实现顺序

1. 先做 `Provider Gateway`
2. 先接通 `Ollama + faster-whisper + Azure TTS + Azure Pronunciation`
3. 业务层只调用统一协议
4. 以后要接 OpenAI、Azure OpenAI、Piper 或本地评测时，只补 adapter

## 不建议的做法

- 让前端直接连多个模型供应商
- 让业务服务直接写死 Azure Speech SDK
- 用多套完全不同的请求结构
- 把发音评测塞进普通聊天响应里
