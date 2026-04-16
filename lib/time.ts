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
  const now = new Date();
  
  // Get current IST date string and parse it
  const istDateStr = formatInTimeZone(now, IST_TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const istDate = new Date(istDateStr + '+05:30'); // Create Date with IST timezone
  
  console.log('📅 Calculating next window:');
  console.log('  Current UTC:', now.toISOString());
  console.log('  Current IST:', formatInTimeZone(now, IST_TIMEZONE, 'yyyy-MM-dd HH:mm:ss EEEE'));
  
  // Get day of week using JavaScript's getDay() on IST date
  // Note: We need to create a proper IST date object
  const istHours = parseInt(formatInTimeZone(now, IST_TIMEZONE, 'HH'));
  const istMinutes = parseInt(formatInTimeZone(now, IST_TIMEZONE, 'mm'));
  
  // Calculate total minutes since midnight IST
  const currentMinutes = istHours * 60 + istMinutes;
  const windowStartMinutes = 14 * 60 + 55; // 14:55 = 895 minutes
  
  let daysToAdd = 0;
  
  // If we're past today's window (after 14:55), move to next day
  if (currentMinutes >= windowStartMinutes) {
    daysToAdd = 1;
    console.log('  Past today\'s window (', istHours, ':', istMinutes, '), moving to next day');
  } else {
    console.log('  Before today\'s window, using today');
  }
  
  // Calculate next window date by adding days
  let nextWindowDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  let nextDayStr = formatInTimeZone(nextWindowDate, IST_TIMEZONE, 'yyyy-MM-dd EEEE');
  
  // Get day of week (0=Sun, 1=Mon, ..., 6=Sat) by parsing the IST date
  let nextDayIST = formatInTimeZone(nextWindowDate, IST_TIMEZONE, 'yyyy-MM-dd');
  let nextDayObj = new Date(nextDayIST + 'T12:00:00+05:30'); // Noon IST to avoid edge cases
  let nextDay = nextDayObj.getUTCDay(); // This gives us the day in the timezone
  
  console.log('  Initial next day:', nextDayStr, 'Day number:', nextDay);
  
  // Skip weekends (0=Sunday, 6=Saturday)
  while (nextDay === 0 || nextDay === 6) {
    console.log('  Skipping weekend day:', nextDay);
    daysToAdd++;
    nextWindowDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    nextDayStr = formatInTimeZone(nextWindowDate, IST_TIMEZONE, 'yyyy-MM-dd EEEE');
    nextDayIST = formatInTimeZone(nextWindowDate, IST_TIMEZONE, 'yyyy-MM-dd');
    nextDayObj = new Date(nextDayIST + 'T12:00:00+05:30');
    nextDay = nextDayObj.getUTCDay();
  }
  
  console.log('  Final next day:', nextDayStr, 'Day number:', nextDay);
  console.log('  Total days to add:', daysToAdd);
  
  // Create next window time: next valid day at 14:55:00 IST
  const nextWindowDateStr = formatInTimeZone(nextWindowDate, IST_TIMEZONE, 'yyyy-MM-dd');
  const nextWindowIST = new Date(`${nextWindowDateStr}T14:55:00+05:30`);
  
  console.log('  Next window IST:', formatInTimeZone(nextWindowIST, IST_TIMEZONE, 'yyyy-MM-dd HH:mm:ss EEEE'));
  console.log('  Next window UTC:', nextWindowIST.toISOString());
  
  return nextWindowIST;
}

export function getSecondsUntilWindow(): number {
  const now = new Date();
  const nextWindow = getNextWindowStart();
  const seconds = Math.floor((nextWindow.getTime() - now.getTime()) / 1000);
  
  console.log('⏰ Countdown calculation:');
  console.log('  Now (UTC):', now.toISOString());
  console.log('  Next window (IST):', formatInTimeZone(nextWindow, IST_TIMEZONE, 'yyyy-MM-dd HH:mm:ss'));
  console.log('  Seconds until window:', seconds);
  
  return seconds;
}
