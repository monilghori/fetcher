import { NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseBrowserClient();
    
    // Get distinct dates from the database
    const { data, error } = await supabase
      .from('nifty50_ticks')
      .select('fetched_at')
      .order('fetched_at', { ascending: false });
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ 
        error: 'Database Error',
        message: 'Failed to fetch available dates',
        details: error.message
      }, { status: 500 });
    }
    
    // Extract unique dates
    const dates = new Set<string>();
    data?.forEach((row) => {
      const date = new Date(row.fetched_at).toISOString().split('T')[0];
      dates.add(date);
    });
    
    const sortedDates = Array.from(dates).sort().reverse();
    
    return NextResponse.json({
      dates: sortedDates,
      count: sortedDates.length
    });
    
  } catch (error: any) {
    console.error('Get available dates error:', error);
    return NextResponse.json({
      error: 'Server Error',
      message: error.message || 'Failed to fetch available dates'
    }, { status: 500 });
  }
}
