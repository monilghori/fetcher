import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { addDays, setHours, setMinutes, setSeconds } from 'date-fns';

const IST_TIMEZONE = 'Asia/Kolkata';

export function getISTTime(): Date {
  return toZonedTime(new Date(), IST_TIMEZONE);
}

export function formatISTTime(date: Date, format: string = 'yyyy-MM-dd HH:mm:ss'): string {
  return formatInTimeZone(date, IST_TIMEZONE, format);
}

export function isWithinCollectionWindow(): boolean {
  const ist = getISTTime();
  const day = ist.getDay();
  
  // Skip weekends (0 = Sunday, 6 = Saturday)
  if (day === 0 || day === 6) {
    return false;
  }
  
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  const windowStart = 14 * 60 + 55; // 14:55
  const windowEnd = 15 * 60 + 5;    // 15:05
  
  return totalMinutes >= windowStart && totalMinutes <= windowEnd;
}

export function getNextWindowStart(): Date {
  const ist = getISTTime();
  let nextWindow = setSeconds(setMinutes(setHours(ist, 14), 55), 0);
  
  // If we're past today's window, move to next weekday
  if (ist >= nextWindow) {
    nextWindow = addDays(nextWindow, 1);
  }
  
  // Skip weekends
  while (nextWindow.getDay() === 0 || nextWindow.getDay() === 6) {
    nextWindow = addDays(nextWindow, 1);
  }
  
  return nextWindow;
}

export function getSecondsUntilWindow(): number {
  const now = getISTTime();
  const nextWindow = getNextWindowStart();
  return Math.floor((nextWindow.getTime() - now.getTime()) / 1000);
}
