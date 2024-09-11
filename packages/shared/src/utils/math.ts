export function roundTo(num: number, precision: number) {
  return Math.round(num * 10 ** precision) / 10 ** precision
}
