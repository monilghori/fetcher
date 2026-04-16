import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { fetchNifty50Quote } from '@/lib/dhan';
import { isWithinCollectionWindow, getISTTime, formatISTTime } from '@/lib/time';

export async function POST(request: NextRequest) {
  try {
    // Verify secret header
    const secret = request.headers.get('x-cron-secret');
    
    if (secret !== process.env.CRON_SECRET) {
      console.error('AUTH FAILED: Invalid CRON_SECRET');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Invalid or missing CRON_SECRET. Please check your environment configuration.'
      }, { status: 401 });
    }
    
    // Check if this is test mode
    const body = await request.json().catch(() => ({}));
    const isTestMode = body.testMode === true;
    
    // Check if within collection window (skip check for test mode)
    if (!isTestMode && !isWithinCollectionWindow()) {
      return NextResponse.json({
        status: 'outside_window',
        message: 'Not within collection window (14:55-15:05 IST, Mon-Fri)',
        currentTime: formatISTTime(getISTTime())
      });
    }
    
    // Fetch data from Dhan API
    let quoteData;
    try {
      quoteData = await fetchNifty50Quote();
    } catch (error: any) {
      console.error('Dhan API error:', error);
      return NextResponse.json({ 
        error: 'Dhan API Error',
        message: error.message || 'Failed to fetch data from Dhan API. Check your DHAN_ACCESS_TOKEN and DHAN_CLIENT_ID.',
        details: error.toString()
      }, { status: 500 });
    }
    
    const fetchedAt = new Date().toISOString();
    
    // Validate quote data
    if (!quoteData?.data?.last_price) {
      console.error('Invalid data from Dhan API:', quoteData);
      return NextResponse.json({ 
        error: 'Invalid Data',
        message: 'Dhan API returned invalid data. Missing last_price field.',
        receivedData: quoteData
      }, { status: 500 });
    }
    
    // Prepare insert data
    const insertData = {
      fetched_at: fetchedAt,
      ltp: quoteData.data.last_price,
      open_price: quoteData.data.open,
      high_price: quoteData.data.high,
      low_price: quoteData.data.low,
      close_price: quoteData.data.close,
      volume: quoteData.data.volume,
      open_interest: quoteData.data.oi,
      net_change: quoteData.data.net_change,
      percent_change: quoteData.data.percent_change,
      data_source: isTestMode ? 'test_mode' : 'dhan_api',
      raw_response: quoteData
    };
    
    // Insert into Supabase
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('nifty50_ticks')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ 
        error: 'Database Error',
        message: 'Failed to save data to database. Check your Supabase configuration.',
        details: error.message,
        code: error.code,
        hint: error.hint || 'Verify SUPABASE_SERVICE_ROLE_KEY and table permissions'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      status: 'success',
      tick: data,
      fetchedAt: formatISTTime(getISTTime())
    });
    
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      error: 'Server Error',
      message: error.message || 'An unexpected error occurred',
      details: error.toString()
    }, { status: 500 });
  }
}
