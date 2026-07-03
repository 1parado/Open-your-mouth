export type Capability = 'llm' | 'asr' | 'tts' | 'pronunciation';

export interface OpenAICompatibleProviderConfig {
  protocol: 'openai-compatible';
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs?: number;
  upstream?: Record<string, string | number | boolean>;
}

export interface AppProviderConfig {
  providers: {
    active: Record<Capability, string>;
    llm: Record<string, OpenAICompatibleProviderConfig>;
    asr: Record<string, OpenAICompatibleProviderConfig>;
    tts: Record<string, OpenAICompatibleProviderConfig>;
    pronunciation: Record<string, OpenAICompatibleProviderConfig>;
  };
}

export interface AppConfig {
  app: {
    env: string;
    port: number;
    storage: {
      type: 'local';
      rootDir: string;
    };
  };
  providers: AppProviderConfig['providers'];
}
