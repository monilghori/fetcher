import { NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseBrowserClient();
    
    // Get all ticks ordered by date
    const { data, error } = await supabase
      .from('nifty50_ticks')
      .select('fetched_at, ltp')
      .order('fetched_at', { ascending: false });
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ 
        error: 'Database Error',
        message: 'Failed to fetch daily summaries',
        details: error.message
      }, { status: 500 });
    }
    
    // Group by date and calculate summaries
    const dateMap = new Map<string, {
      date: string;
      tick_count: number;
      high_ltp: number;
      low_ltp: number;
      opening_ltp: number;
      closing_ltp: number;
      ltps: number[];
    }>();
    
    data?.forEach((row) => {
      const date = new Date(row.fetched_at).toISOString().split('T')[0];
      
      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          tick_count: 0,
          high_ltp: row.ltp,
          low_ltp: row.ltp,
          opening_ltp: row.ltp,
          closing_ltp: row.ltp,
          ltps: []
        });
      }
      
      const summary = dateMap.get(date)!;
      summary.tick_count++;
      summary.ltps.push(row.ltp);
      summary.high_ltp = Math.max(summary.high_ltp, row.ltp);
      summary.low_ltp = Math.min(summary.low_ltp, row.ltp);
      summary.closing_ltp = row.ltp; // Latest (first in desc order)
    });
    
    // Set opening_ltp to the last tick of each day
    dateMap.forEach((summary) => {
      if (summary.ltps.length > 0) {
        summary.opening_ltp = summary.ltps[summary.ltps.length - 1];
      }
      delete (summary as any).ltps; // Remove temporary array
    });
    
    const summaries = Array.from(dateMap.values()).sort((a, b) => 
      b.date.localeCompare(a.date)
    );
    
    return NextResponse.json({
      summaries,
      count: summaries.length
    });
    
  } catch (error: any) {
    console.error('Get daily summary error:', error);
    return NextResponse.json({
      error: 'Server Error',
      message: error.message || 'Failed to fetch daily summaries'
    }, { status: 500 });
  }
}
