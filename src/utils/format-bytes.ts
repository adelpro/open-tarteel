export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const u = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / Math.pow(k, index)).toFixed(1))} ${u[index]}`;
}
