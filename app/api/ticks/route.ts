import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { formatISTTime, getISTTime } from '@/lib/time';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const date = searchParams.get('date'); // YYYY-MM-DD format
    
    // If date is provided, ignore limit and fetch all ticks for that day
    // Otherwise use the limit parameter
    let limit = 1000; // Default high limit
    if (!date && limitParam) {
      limit = parseInt(limitParam);
      // Validate limit
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        return NextResponse.json({ 
          error: 'Invalid Parameter',
          message: 'Limit must be between 1 and 1000'
        }, { status: 400 });
      }
    }
    
    const supabase = getSupabaseBrowserClient();
    let query = supabase
      .from('nifty50_ticks')
      .select('*')
      .order('fetched_at', { ascending: false });
    
    // Only apply limit if not filtering by date
    if (!date) {
      query = query.limit(limit);
    }
    
    // Filter by date if provided
    if (date) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ 
          error: 'Invalid Date Format',
          message: 'Date must be in YYYY-MM-DD format'
        }, { status: 400 });
      }
      
      console.log('🔍 Filtering by date:', date);
      
      // Convert IST date to UTC range for database query
      // The date parameter is in IST (e.g., "2026-04-16")
      // We need to query for UTC timestamps that fall within this IST date
      const startOfDayIST = new Date(`${date}T00:00:00+05:30`);
      const endOfDayIST = new Date(`${date}T23:59:59+05:30`);
      
      const startOfDayUTC = startOfDayIST.toISOString();
      const endOfDayUTC = endOfDayIST.toISOString();
      
      console.log('📅 Date range (IST):', date);
      console.log('📅 Start (UTC):', startOfDayUTC);
      console.log('📅 End (UTC):', endOfDayUTC);
      
      query = query.gte('fetched_at', startOfDayUTC).lte('fetched_at', endOfDayUTC);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ 
        error: 'Database Error',
        message: 'Failed to fetch ticks from database',
        details: error.message,
        hint: 'Check Supabase connection and table permissions'
      }, { status: 500 });
    }
    
    console.log('✅ Query successful. Found', data?.length || 0, 'ticks');
    if (date) {
      console.log('📊 Sample tick timestamps (first 3):');
      data?.slice(0, 3).forEach((tick, i) => {
        console.log(`  ${i + 1}. ${tick.fetched_at} (UTC) -> ${new Date(tick.fetched_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)`);
      });
    }
    
    return NextResponse.json({
      ticks: data,
      count: data?.length || 0,
      currentTime: formatISTTime(getISTTime()),
      ...(date && { queriedDate: date })
    });
    
  } catch (error: any) {
    console.error('Get ticks error:', error);
    return NextResponse.json({
      error: 'Server Error',
      message: error.message || 'Failed to fetch ticks',
      details: error.toString()
    }, { status: 500 });
  }
}
