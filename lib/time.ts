import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

export function getISTTime(): Date {
  // Just return current UTC time - we'll convert when formatting
  return new Date();
}

export function formatISTTime(date: Date, format: string = 'yyyy-MM-dd HH:mm:ss'): string {
  // Use formatInTimeZone to properly convert UTC to IST
  return formatInTimeZone(date, IST_TIMEZONE, format);
}

export function isWithinCollectionWindow(): boolean {
  // Get current time in IST using formatInTimeZone to ensure correct conversion
  const now = new Date();
  
  // Parse the IST time string to get components
  const istDate = toZonedTime(now, IST_TIMEZONE);
  const day = istDate.getDay();
  const hours = parseInt(formatInTimeZone(now, IST_TIMEZONE, 'HH'));
  const minutes = parseInt(formatInTimeZone(now, IST_TIMEZONE, 'mm'));
  
  // Skip weekends (0 = Sunday, 6 = Saturday)
  if (day === 0 || day === 6) {
    return false;
  }
  
  const totalMinutes = hours * 60 + minutes;
  const windowStart = 14 * 60 + 55; // 14:55 = 895 minutes
  const windowEnd = 15 * 60 + 5;    // 15:05 = 905 minutes
  
  return totalMinutes >= windowStart && totalMinutes <= windowEnd;
}

export function getNextWindowStart(): Date {
  const now = new Date();
  
  // Convert current UTC to IST by adding 5.5 hours
  const nowIST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  
  // Get IST time components
  const istHours = nowIST.getUTCHours();
  const istMinutes = nowIST.getUTCMinutes();
  
  // Calculate total minutes since midnight IST
  const currentMinutes = istHours * 60 + istMinutes;
  const windowStartMinutes = 14 * 60 + 55; // 14:55 = 895 minutes
  
  // Start with today at 14:55 IST
  let nextWindowIST = new Date(nowIST);
  nextWindowIST.setUTCHours(14, 55, 0, 0);
  
  // If we're past today's window, move to next day
  if (currentMinutes >= windowStartMinutes) {
    nextWindowIST.setUTCDate(nextWindowIST.getUTCDate() + 1);
  }
  
  // Skip weekends
  let nextDay = nextWindowIST.getUTCDay();
  while (nextDay === 0 || nextDay === 6) {
    nextWindowIST.setUTCDate(nextWindowIST.getUTCDate() + 1);
    nextDay = nextWindowIST.getUTCDay();
  }
  
  // Convert back to actual UTC by subtracting 5.5 hours
  const nextWindowUTC = new Date(nextWindowIST.getTime() - (5.5 * 60 * 60 * 1000));
  
  return nextWindowUTC;
}

export function getSecondsUntilWindow(): number {
  const now = new Date();
  const nextWindow = getNextWindowStart();
  const seconds = Math.floor((nextWindow.getTime() - now.getTime()) / 1000);
  
  return Math.max(0, seconds); // Ensure non-negative
}
