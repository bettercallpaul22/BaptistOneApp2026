export const formatDate = (value: string | Date, locale = 'en-US') =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(new Date(value));
