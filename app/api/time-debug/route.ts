import { NextResponse } from 'next/server';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export async function GET() {
  const now = new Date();
  const IST_TIMEZONE = 'Asia/Kolkata';
  
  // Multiple ways to get IST time
  const istDate = toZonedTime(now, IST_TIMEZONE);
  const istFormatted = formatInTimeZone(now, IST_TIMEZONE, 'yyyy-MM-dd HH:mm:ss EEEE');
  const istHours = parseInt(formatInTimeZone(now, IST_TIMEZONE, 'HH'));
  const istMinutes = parseInt(formatInTimeZone(now, IST_TIMEZONE, 'mm'));
  const istDay = parseInt(formatInTimeZone(now, IST_TIMEZONE, 'e')); // 0=Sun, 6=Sat
  
  // Calculate if within window
  const totalMinutes = istHours * 60 + istMinutes;
  const windowStart = 14 * 60 + 55; // 895
  const windowEnd = 15 * 60 + 5;    // 905
  const isWithinWindow = totalMinutes >= windowStart && totalMinutes <= windowEnd;
  const isWeekend = istDay === 0 || istDay === 6;
  
  return NextResponse.json({
    server: {
      timezone: process.env.TZ || 'Not set',
      nodeVersion: process.version,
      platform: process.platform
    },
    utc: {
      timestamp: now.toISOString(),
      hours: now.getUTCHours(),
      minutes: now.getUTCMinutes(),
      day: now.getUTCDay()
    },
    ist: {
      formatted: istFormatted,
      hours: istHours,
      minutes: istMinutes,
      totalMinutes: totalMinutes,
      day: istDay,
      dayName: formatInTimeZone(now, IST_TIMEZONE, 'EEEE'),
      isWeekend: isWeekend
    },
    window: {
      start: '14:55 IST (895 minutes)',
      end: '15:05 IST (905 minutes)',
      currentMinutes: totalMinutes,
      isWithinWindow: isWithinWindow && !isWeekend,
      reason: isWeekend ? 'Weekend' : (isWithinWindow ? 'Within window' : 'Outside window hours')
    },
    calculation: {
      istDate_getHours: istDate.getHours(),
      istDate_getMinutes: istDate.getMinutes(),
      formatInTimeZone_HH: istHours,
      formatInTimeZone_mm: istMinutes,
      note: 'formatInTimeZone is more reliable than toZonedTime().getHours()'
    }
  });
}
