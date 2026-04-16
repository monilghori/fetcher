import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { formatISTTime, getISTTime } from '@/lib/time';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const date = searchParams.get('date'); // YYYY-MM-DD format
    
    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return NextResponse.json({ 
        error: 'Invalid Parameter',
        message: 'Limit must be between 1 and 1000'
      }, { status: 400 });
    }
    
    const supabase = getSupabaseBrowserClient();
    let query = supabase
      .from('nifty50_ticks')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(limit);
    
    // Filter by date if provided
    if (date) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ 
          error: 'Invalid Date Format',
          message: 'Date must be in YYYY-MM-DD format'
        }, { status: 400 });
      }
      
      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;
      query = query.gte('fetched_at', startOfDay).lte('fetched_at', endOfDay);
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
      currentTime: formatISTTime(getISTTime())
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
