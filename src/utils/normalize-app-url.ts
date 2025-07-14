export const normalizeAppUrl = (url?: string) => {
  return url?.replace(/\/+$/, '');
};
