export function fmtInr(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}
