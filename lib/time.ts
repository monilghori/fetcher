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
  
  // Get current time in IST
  const istDate = toZonedTime(now, IST_TIMEZONE);
  const istHours = istDate.getHours();
  const istMinutes = istDate.getMinutes();
  const istDay = istDate.getDay();
  
  // Calculate total minutes since midnight IST
  const currentMinutes = istHours * 60 + istMinutes;
  const windowStartMinutes = 14 * 60 + 55; // 14:55 = 895 minutes
  const windowEndMinutes = 15 * 60 + 5;    // 15:05 = 905 minutes
  
  // Create next window time in IST
  let nextWindowIST = new Date(istDate);
  nextWindowIST.setHours(14, 55, 0, 0);
  
  // If we're past today's window end, move to next day
  if (currentMinutes > windowEndMinutes) {
    nextWindowIST.setDate(nextWindowIST.getDate() + 1);
  }
  
  // Skip weekends
  let nextDay = nextWindowIST.getDay();
  while (nextDay === 0 || nextDay === 6) {
    nextWindowIST.setDate(nextWindowIST.getDate() + 1);
    nextDay = nextWindowIST.getDay();
  }
  
  // Convert IST date back to UTC
  // We need to parse the IST date as if it were UTC, then adjust
  const year = nextWindowIST.getFullYear();
  const month = nextWindowIST.getMonth();
  const date = nextWindowIST.getDate();
  const hours = nextWindowIST.getHours();
  const minutes = nextWindowIST.getMinutes();
  
  // Create a date string in IST timezone and parse it
  const istString = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  
  // Parse this as IST and convert to UTC
  const nextWindowUTC = new Date(istString + '+05:30');
  
  return nextWindowUTC;
}

export function getSecondsUntilWindow(): number {
  const now = new Date();
  const nextWindow = getNextWindowStart();
  const seconds = Math.floor((nextWindow.getTime() - now.getTime()) / 1000);
  
  return Math.max(0, seconds); // Ensure non-negative
}
