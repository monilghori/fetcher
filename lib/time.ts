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
  
  // Convert current UTC to IST by adding 5.5 hours
  const nowIST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  
  console.log('📅 Calculating next window:');
  console.log('  Current UTC:', now.toISOString());
  console.log('  Current IST:', nowIST.toISOString(), '(as UTC+5:30)');
  
  // Get IST time components
  const istHours = nowIST.getUTCHours();
  const istMinutes = nowIST.getUTCMinutes();
  const istDay = nowIST.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  
  console.log('  IST Day:', istDay, 'Hours:', istHours, 'Minutes:', istMinutes);
  
  // Calculate total minutes since midnight IST
  const currentMinutes = istHours * 60 + istMinutes;
  const windowStartMinutes = 14 * 60 + 55; // 14:55 = 895 minutes
  
  // Start with today at 14:55 IST
  let nextWindowIST = new Date(nowIST);
  nextWindowIST.setUTCHours(14, 55, 0, 0);
  
  // If we're past today's window, move to next day
  if (currentMinutes >= windowStartMinutes) {
    nextWindowIST.setUTCDate(nextWindowIST.getUTCDate() + 1);
    console.log('  Past today\'s window, moving to next day');
  }
  
  // Skip weekends
  let nextDay = nextWindowIST.getUTCDay();
  while (nextDay === 0 || nextDay === 6) {
    console.log('  Skipping weekend day:', nextDay);
    nextWindowIST.setUTCDate(nextWindowIST.getUTCDate() + 1);
    nextDay = nextWindowIST.getUTCDay();
  }
  
  console.log('  Next window IST (as UTC):', nextWindowIST.toISOString());
  
  // Convert back to actual UTC by subtracting 5.5 hours
  const nextWindowUTC = new Date(nextWindowIST.getTime() - (5.5 * 60 * 60 * 1000));
  
  console.log('  Next window UTC:', nextWindowUTC.toISOString());
  console.log('  Next window IST display:', formatInTimeZone(nextWindowUTC, IST_TIMEZONE, 'yyyy-MM-dd HH:mm:ss EEEE'));
  
  return nextWindowUTC;
}

export function getSecondsUntilWindow(): number {
  const now = new Date();
  const nextWindow = getNextWindowStart();
  const seconds = Math.floor((nextWindow.getTime() - now.getTime()) / 1000);
  
  console.log('⏰ Countdown calculation:');
  console.log('  Now (UTC):', now.toISOString());
  console.log('  Next window (UTC):', nextWindow.toISOString());
  console.log('  Seconds until window:', seconds);
  console.log('  Hours until window:', (seconds / 3600).toFixed(2));
  
  return Math.max(0, seconds); // Ensure non-negative
}
