import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import dotenv from 'dotenv';
import type { AppConfig, Capability, OpenAICompatibleProviderConfig } from './types';

// Load environment variables from project root
const projectRoot = join(__dirname, '../../../..');
dotenv.config({ path: join(projectRoot, 'config', '.env') });

export function loadConfig(): AppConfig {
  // Try to find config in project root
  const configPath = join(projectRoot, 'config', 'providers.yaml');
  const content = readFileSync(configPath, 'utf-8');
  const raw = yaml.load(content);

  // Replace environment variables in the config
  const config = replaceEnvVars(raw) as Partial<AppConfig> & {
    app?: Partial<AppConfig['app']>;
  };

  return {
    ...config,
    app: {
      storage: config.app?.storage ?? {
        type: 'local',
        rootDir: './storage',
      },
      port: config.app?.port ?? parseInt(process.env.PORT || '8090'),
      env: config.app?.env ?? process.env.NODE_ENV ?? 'development',
    },
  } as AppConfig;
}

function replaceEnvVars(obj: unknown): unknown {
  if (typeof obj === 'string') {
    // Replace ${VAR_NAME} with environment variable
    const match = obj.match(/^\$\{(.+)\}$/);
    if (match) {
      const envVar = match[1];
      const value = process.env[envVar];
      if (!value) {
        throw new Error(`Environment variable ${envVar} is not defined`);
      }
      return value;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(replaceEnvVars);
  }

  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceEnvVars(value);
    }
    return result;
  }

  return obj;
}

export function resolveProvider(
  config: AppConfig,
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
