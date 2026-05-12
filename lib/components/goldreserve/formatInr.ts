export function fmtInr(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function fmtInrDecimals(n: number, decimals = 2) {
  const parts = n.toFixed(decimals).split('.');
  const intPart = Number(parts[0]).toLocaleString('en-IN');
  return `₹${intPart}.${parts[1]}`;
}
