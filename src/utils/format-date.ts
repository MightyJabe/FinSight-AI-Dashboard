// Utility for formatting dates

/**
 *
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions,
  locale: string = 'en-US'
) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(
    locale,
    options ?? { year: 'numeric', month: 'short', day: 'numeric' }
  ).format(d);
}
