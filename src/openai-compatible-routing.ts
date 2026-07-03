import type {
  AppProviderConfig,
  Capability,
  OpenAICompatibleProviderConfig,
} from "./provider-config";
import { resolveProvider } from "./provider-config";

export interface ProviderRequest {
  capability: Capability;
  path: string;
  method: "GET" | "POST";
  body?: unknown;
  headers?: Record<string, string>;
}

export interface RoutedRequest {
  url: string;
  apiKey: string;
  timeoutMs: number;
  method: "GET" | "POST";
  body?: unknown;
  headers: Record<string, string>;
}

function buildOpenAIHeaders(
  provider: OpenAICompatibleProviderConfig,
  extraHeaders?: Record<string, string>,
): Record<string, string> {
  return {
    Authorization: `Bearer ${provider.apiKey}`,
    "Content-Type": "application/json",
    ...extraHeaders,
  };
}

function withModel(body: unknown, model: string): unknown {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { model };
  }

  return {
    model,
    ...(body as Record<string, unknown>),
  };
}

export function routeProviderRequest(
  config: AppProviderConfig,
  request: ProviderRequest,
): RoutedRequest {
  const provider = resolveProvider(config, request.capability);

  return {
    url: `${provider.baseUrl}${request.path}`,
    apiKey: provider.apiKey,
    timeoutMs: provider.timeoutMs ?? 30000,
    method: request.method,
    body: withModel(request.body, provider.model),
    headers: buildOpenAIHeaders(provider, request.headers),
  };
}

export const OpenAICompatiblePaths = {
  llm: "/chat/completions",
  asr: "/audio/transcriptions",
  tts: "/audio/speech",
  pronunciation: "/pronunciation/assessments",
} as const;
