export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / 1024 ** i

  return `${Math.round(value * 100) / 100} ${sizes[i]}`
}
