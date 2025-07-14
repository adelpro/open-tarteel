import { clientConfig } from './config';

export const getErrorMessage = (
  error: unknown,
  customMessage?: string
): string => {
  console.log(clientConfig.DEBUG, process.env.DEBUG);
  if (clientConfig.DEBUG) {
    console.error(error);
  }
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else {
    return customMessage || 'An unknown error occurred';
  }
};
