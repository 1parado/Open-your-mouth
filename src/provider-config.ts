export type Capability = "llm" | "asr" | "tts" | "pronunciation";

export interface OpenAICompatibleProviderConfig {
  protocol: "openai-compatible";
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

export function resolveProvider(
  config: AppProviderConfig,
  capability: Capability,
): OpenAICompatibleProviderConfig {
  const activeName = config.providers.active[capability];
  const provider = config.providers[capability][activeName];

  if (!provider) {
    throw new Error(
      `Missing provider for capability=${capability}, active=${activeName}`,
    );
  }

  return provider;
}
