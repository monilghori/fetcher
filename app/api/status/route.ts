import { NextResponse } from 'next/server';
import { isWithinCollectionWindow, getISTTime, formatISTTime, getSecondsUntilWindow, getNextWindowStart } from '@/lib/time';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export async function GET() {
  try {
    const isWithinWindow = isWithinCollectionWindow();
    const currentTime = getISTTime();
    const nextWindowStart = getNextWindowStart();
    const nextWindowStartTimestamp = nextWindowStart.getTime();
    const secondsUntilWindow = isWithinWindow ? 0 : getSecondsUntilWindow();
    
    // Log for debugging on Vercel
    console.log('Status API - IST Time:', formatISTTime(currentTime));
    console.log('Status API - Next Window:', formatISTTime(nextWindowStart));
    console.log('Status API - Next Window Timestamp:', nextWindowStartTimestamp);
    console.log('Status API - Seconds Until Window:', secondsUntilWindow);
    
    // Get today's tick count
    const supabase = getSupabaseBrowserClient();
    const today = formatISTTime(currentTime, 'yyyy-MM-dd');
    
    const { count, error } = await supabase
      .from('nifty50_ticks')
      .select('*', { count: 'exact', head: true })
      .gte('fetched_at', `${today}T00:00:00`)
      .lte('fetched_at', `${today}T23:59:59`);
    
    if (error) {
      console.error('Supabase count error:', error);
      // Return status without count on error but WITH timestamp
      return NextResponse.json({
        isWithinWindow,
        currentTime: formatISTTime(currentTime),
        nextWindowStart: formatISTTime(nextWindowStart),
        nextWindowStartTimestamp,
        secondsUntilWindow,
        todayTickCount: 0,
        warning: 'Could not fetch tick count from database'
      });
    }
    
    return NextResponse.json({
      isWithinWindow,
      currentTime: formatISTTime(currentTime),
      nextWindowStart: formatISTTime(nextWindowStart),
      nextWindowStartTimestamp,
      secondsUntilWindow,
      todayTickCount: count || 0
    });
    
  } catch (error: any) {
    console.error('Status error:', error);
    return NextResponse.json({
      error: 'Server Error',
      message: error.message || 'Failed to get status',
      details: error.toString()
    }, { status: 500 });
  }
}
