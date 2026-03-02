export type ActionCallbacks = {
  onSuccess?: () => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
};
