import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { formatISTTime, getISTTime } from '@/lib/time';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const date = searchParams.get('date'); // YYYY-MM-DD format
    
    const supabase = getSupabaseBrowserClient();
    let query = supabase
      .from('nifty50_ticks')
      .select('*')
      .order('fetched_at', { ascending: false });
    
    // Filter by date if provided
    if (date) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ 
          error: 'Invalid Date Format',
          message: 'Date must be in YYYY-MM-DD format'
        }, { status: 400 });
      }
      
      // Convert IST date to UTC range for database query
      // The date parameter is in IST (e.g., "2026-04-16")
      // We need to query for UTC timestamps that fall within this IST date
      const startOfDayIST = new Date(`${date}T00:00:00+05:30`);
      const endOfDayIST = new Date(`${date}T23:59:59+05:30`);
      
      const startOfDayUTC = startOfDayIST.toISOString();
      const endOfDayUTC = endOfDayIST.toISOString();
      
      query = query.gte('fetched_at', startOfDayUTC).lte('fetched_at', endOfDayUTC);
      // NO LIMIT when filtering by date - fetch ALL ticks for that day
    } else {
      // Apply limit only when NOT filtering by date
      let limit = 1000; // Default high limit
      if (limitParam) {
        limit = parseInt(limitParam);
        // Validate limit
        if (isNaN(limit) || limit < 1 || limit > 1000) {
          return NextResponse.json({ 
            error: 'Invalid Parameter',
            message: 'Limit must be between 1 and 1000'
          }, { status: 400 });
        }
      }
      query = query.limit(limit);
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
