import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { fetchNifty50Quote } from '@/lib/dhan';
import { isWithinCollectionWindow, getISTTime, formatISTTime } from '@/lib/time';

export async function POST(request: NextRequest) {
  console.log('\n🔵 === FETCH-TICK API CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Verify secret header
    const secret = request.headers.get('x-cron-secret');
    console.log('Secret provided:', secret ? 'Yes (length: ' + secret.length + ')' : 'No');
    console.log('Expected secret:', process.env.CRON_SECRET ? 'Set (length: ' + process.env.CRON_SECRET.length + ')' : 'Not set');
    
    if (secret !== process.env.CRON_SECRET) {
      console.error('❌ AUTH FAILED: Secret mismatch');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Invalid or missing CRON_SECRET. Please check your environment configuration.'
      }, { status: 401 });
    }
    console.log('✅ Auth passed');
    
    // Check if this is test mode
    const body = await request.json().catch(() => ({}));
    const isTestMode = body.testMode === true;
    console.log('Test mode:', isTestMode ? 'YES' : 'NO');
    
    // Check if within collection window (skip check for test mode)
    if (!isTestMode && !isWithinCollectionWindow()) {
      console.log('⚠️ Outside collection window (and not test mode)');
      return NextResponse.json({
        status: 'outside_window',
        message: 'Not within collection window (14:55-15:05 IST, Mon-Fri)',
        currentTime: formatISTTime(getISTTime())
      });
    }
    
    if (isTestMode) {
      console.log('🧪 TEST MODE: Bypassing time window check');
    } else {
      console.log('✅ Within collection window');
    }
    
    // Fetch data from Dhan API
    console.log('📡 Fetching from Dhan API...');
    let quoteData;
    try {
      quoteData = await fetchNifty50Quote();
      console.log('✅ Dhan API response received');
      console.log('LTP:', quoteData.data?.last_price);
      console.log('Full data:', JSON.stringify(quoteData, null, 2));
    } catch (error: any) {
      console.error('❌ Dhan API error:', error);
      return NextResponse.json({ 
        error: 'Dhan API Error',
        message: error.message || 'Failed to fetch data from Dhan API. Check your DHAN_ACCESS_TOKEN and DHAN_CLIENT_ID.',
        details: error.toString()
      }, { status: 500 });
    }
    
    const fetchedAt = new Date().toISOString();
    console.log('Fetched at:', fetchedAt);
    
    // Validate quote data
    if (!quoteData?.data?.last_price) {
      console.error('❌ Invalid data structure from Dhan API');
      console.log('Received:', quoteData);
      return NextResponse.json({ 
        error: 'Invalid Data',
        message: 'Dhan API returned invalid data. Missing last_price field.',
        receivedData: quoteData
      }, { status: 500 });
    }
    console.log('✅ Data validation passed');
    
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
    console.log('💾 Preparing to insert:', insertData);
    
    // Insert into Supabase
    console.log('💾 Inserting into Supabase...');
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('nifty50_ticks')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase insert error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      return NextResponse.json({ 
        error: 'Database Error',
        message: 'Failed to save data to database. Check your Supabase configuration.',
        details: error.message,
        code: error.code,
        hint: error.hint || 'Verify SUPABASE_SERVICE_ROLE_KEY and table permissions'
      }, { status: 500 });
    }
    
    console.log('✅ Successfully inserted into Supabase!');
    console.log('Inserted row ID:', data.id);
    console.log('🔵 === FETCH-TICK API SUCCESS ===\n');
    
    return NextResponse.json({
      status: 'success',
      tick: data,
      fetchedAt: formatISTTime(getISTTime())
    });
    
  } catch (error: any) {
    console.error('💥 Unexpected error:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json({
      error: 'Server Error',
      message: error.message || 'An unexpected error occurred',
      details: error.toString()
    }, { status: 500 });
  }
}
