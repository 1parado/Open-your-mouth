import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { OpenAICompatibleProviderConfig } from '../config/types';

export interface HttpClientOptions {
  provider: OpenAICompatibleProviderConfig;
  logger?: any;
}

export class HttpClient {
  private client: AxiosInstance;
  private logger: any;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(options: HttpClientOptions) {
    this.logger = options.logger;
    const { provider } = options;

    this.client = axios.create({
      baseURL: provider.baseUrl,
      timeout: provider.timeoutMs || 30000,
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((config) => {
      this.logger?.info({
        type: 'http_request',
        method: config.method,
        url: config.url,
      });
      return config;
    });

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        this.logger?.info({
          type: 'http_response',
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        this.logger?.error({
          type: 'http_error',
          message: error.message,
          url: error.config?.url,
          status: error.response?.status,
        });
        throw error;
      },
    );
  }

  async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.request<T>(config);
        return response;
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === this.maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt);
        this.logger?.warn({
          type: 'http_retry',
          attempt: attempt + 1,
          delay,
          error: error.message,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'post', url, data });
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'get', url });
  }

  async stream(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.request({
      ...config,
      method: 'post',
      url,
      data,
      responseType: 'stream',
    });
  }
}
