import { isAxiosError } from 'axios';

interface ProviderErrorPayload {
  error?: {
    message?: string;
  };
}

export function getProviderErrorDetails(error: unknown): {
  status: number;
  message: string;
  logMessage: string;
} {
  if (isAxiosError<ProviderErrorPayload>(error)) {
    return {
      status: error.response?.status ?? 500,
      message: error.response?.data?.error?.message ?? error.message,
      logMessage: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message,
      logMessage: error.message,
    };
  }

  return {
    status: 500,
    message: 'Internal server error',
    logMessage: 'Unknown error',
  };
}
