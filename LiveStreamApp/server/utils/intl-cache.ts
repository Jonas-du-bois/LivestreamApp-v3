const formatterCache = new Map<string, Intl.DateTimeFormat>();

export function safeFormatDate(value: any, locale: string, options: Intl.DateTimeFormatOptions): string {
  const timestamp = typeof value === 'string' ? Date.parse(value) : (value instanceof Date ? value.getTime() : Number(value));
  if (Number.isNaN(timestamp)) return 'Invalid Date';
  const key = `${locale}-${JSON.stringify(options)}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(key, formatter);
  }
  return formatter.format(timestamp);
}
