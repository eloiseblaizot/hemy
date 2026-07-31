function formatDate(d, opts) {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", opts != null ? opts : { day: "numeric", month: "long", year: "numeric" }).format(date);
}
function formatNumber(n) {
  return new Intl.NumberFormat("fr-FR").format(n);
}
function pct(part, total) {
  if (!total) return 0;
  return Math.round(part / total * 100);
}

export { formatNumber as a, formatDate as f, pct as p };
//# sourceMappingURL=format.mjs.map
