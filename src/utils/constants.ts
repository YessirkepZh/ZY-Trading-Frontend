export const STRATEGY_COLORS: Record<string, string> = {
  'Пробой':         '#4caf50',
  'Ложный Пробой':  '#ff9800',
  'Отбой':          '#2196f3',
};

export const STATUS_COLORS: Record<string, string> = {
  created:  '#666',
  notified: '#2196f3',
  entered:  '#ff9800',
  closed:   '#4caf50',
  missed:   '#f44336',
};

export const STATUS_LABELS: Record<string, string> = {
  created:  'Создана',
  notified: 'Отправлена',
  entered:  'Вошёл',
  closed:   'Закрыта',
  missed:   'Пропущена',
};

export const RESULT_COLORS: Record<string, string> = {
  win:       '#4caf50',
  loss:      '#f44336',
  breakeven: '#ff9800',
};

export const RESULT_LABELS: Record<string, string> = {
  win:       'Win ✅',
  loss:      'Loss ❌',
  breakeven: 'BE ➖',
};

export const MARKET_LABELS: Record<string, string> = {
  crypto:  'Крипто',
  stocks:  'Акции',
  forex:   'Форекс',
};

export const DIRECTION_LABELS: Record<string, string> = {
  long:  'Long',
  short: 'Short',
};
