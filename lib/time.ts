import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { addDays, setHours, setMinutes, setSeconds } from 'date-fns';

const IST_TIMEZONE = 'Asia/Kolkata';

export function getISTTime(): Date {
  // Get current UTC time and convert to IST
  const now = new Date();
  return toZonedTime(now, IST_TIMEZONE);
}

export function formatISTTime(date: Date, format: string = 'yyyy-MM-dd HH:mm:ss'): string {
  return formatInTimeZone(date, IST_TIMEZONE, format);
}

export function isWithinCollectionWindow(): boolean {
  // Get current time in IST using formatInTimeZone to ensure correct conversion
  const now = new Date();
  const istTimeString = formatInTimeZone(now, IST_TIMEZONE, 'yyyy-MM-dd HH:mm:ss EEEE');
  
  console.log('🕐 Checking collection window:');
  console.log('  UTC Time:', now.toISOString());
  console.log('  IST Time:', istTimeString);
  
  // Parse the IST time string to get components
  const istDate = toZonedTime(now, IST_TIMEZONE);
  const day = istDate.getDay();
  const hours = parseInt(formatInTimeZone(now, IST_TIMEZONE, 'HH'));
  const minutes = parseInt(formatInTimeZone(now, IST_TIMEZONE, 'mm'));
  
  console.log('  Day of week:', day, '(0=Sun, 6=Sat)');
  console.log('  Hours:', hours, 'Minutes:', minutes);
  
  // Skip weekends (0 = Sunday, 6 = Saturday)
  if (day === 0 || day === 6) {
    console.log('  ❌ Weekend - outside window');
    return false;
  }
  
  const totalMinutes = hours * 60 + minutes;
  const windowStart = 14 * 60 + 55; // 14:55 = 895 minutes
  const windowEnd = 15 * 60 + 5;    // 15:05 = 905 minutes
  
  console.log('  Total minutes:', totalMinutes);
  console.log('  Window: 14:55 (895) to 15:05 (905)');
  
  const isWithin = totalMinutes >= windowStart && totalMinutes <= windowEnd;
  console.log('  Result:', isWithin ? '✅ WITHIN WINDOW' : '❌ Outside window');
  
  return isWithin;
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
