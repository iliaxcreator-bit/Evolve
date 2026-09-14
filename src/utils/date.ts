export const TBILISI_TZ = 'Asia/Tbilisi';

/**
 * Returns today's ISO date string (YYYY-MM-DD) in Asia/Tbilisi timezone
 */
export function getTbilisiTodayDate(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TBILISI_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // en-CA gives YYYY-MM-DD
}

/**
 * Returns current Tbilisi time as HH:MM string in 24h
 */
export function getTbilisiTime24(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TBILISI_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(now);
}

/**
 * Formats a YYYY-MM-DD date string in Georgian: "ორშაბათი, 14 სექტემბერი"
 */
export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  try {
    return new Intl.DateTimeFormat('ka-GE', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
}

/**
 * Formats short date in Georgian: "14 სექ"
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  try {
    return new Intl.DateTimeFormat('ka-GE', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }
}

/**
 * Currency formatter for Georgian Lari
 */
export function formatGEL(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₾0';
  return `₾${amount.toLocaleString('ka-GE')}`;
}

/**
 * Returns day-of-week name in English (Monday, Tuesday, etc.) in Tbilisi for configs
 */
export function getTbilisiDayOfWeek(dateStr?: string): string {
  if (dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  }
  const now = new Date();
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TBILISI_TZ,
    weekday: 'long',
  }).format(now);
}

/**
 * Returns day-of-week in Georgian
 */
export function getGeorgianDayOfWeek(dateStr?: string): string {
  const enDay = getTbilisiDayOfWeek(dateStr);
  const dayMap: Record<string, string> = {
    'Monday': 'ორშაბათი',
    'Tuesday': 'სამშაბათი',
    'Wednesday': 'ოთხშაბათი',
    'Thursday': 'ხუთშაბათი',
    'Friday': 'პარასკევი',
    'Saturday': 'შაბათი',
    'Sunday': 'კვირა',
  };
  return dayMap[enDay] || enDay;
}

/**
 * Friendly time-of-day greeting in Georgian
 */
export function getTimeOfDayGreeting(): string {
  const time = getTbilisiTime24();
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 12) return 'დილა მშვიდობისა';
  if (hour < 18) return 'შუადღე მშვიდობისა';
  return 'საღამო მშვიდობისა';
}

/**
 * Helper to calculate day offset relative to today
 * negative = past, 0 = today, 1 = tomorrow, etc.
 */
export function getDaysDifference(targetDateStr: string, baseDateStr = getTbilisiTodayDate()): number {
  const [y1, m1, d1] = targetDateStr.split('-').map(Number);
  const [y2, m2, d2] = baseDateStr.split('-').map(Number);
  const t1 = new Date(y1, m1 - 1, d1).getTime();
  const t2 = new Date(y2, m2 - 1, d2).getTime();
  const diffTime = t1 - t2;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Convert HH:MM into total minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Format total seconds into MM:SS or HH:MM:SS
 */
export function formatSecondsToTimer(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
