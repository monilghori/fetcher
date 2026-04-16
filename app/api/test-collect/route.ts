import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { fetchNifty50Quote } from '@/lib/dhan';
import { formatISTTime, getISTTime } from '@/lib/time';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { duration = 60 } = body; // Default 60 seconds
    
    const results = [];
    const errors = [];
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    
    let tickCount = 0;
    
    // Collect data every 3 seconds for the specified duration
    while (Date.now() < endTime) {
      try {
        // Fetch data from Dhan API
        const quoteData = await fetchNifty50Quote();
        const fetchedAt = new Date().toISOString();
        
        // Insert into Supabase
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
          .from('nifty50_ticks')
          .insert({
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
            data_source: 'test_mode',
            raw_response: quoteData
          })
          .select()
          .single();
        
        if (error) {
          errors.push({ time: fetchedAt, error: error.message });
        } else {
          tickCount++;
          results.push({
            time: formatISTTime(new Date(fetchedAt)),
            ltp: data.ltp,
            change: data.percent_change
          });
        }
        
        // Wait 3 seconds before next fetch
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error: any) {
        errors.push({ 
          time: new Date().toISOString(), 
          error: error.message 
        });
        // Continue even if one fetch fails
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    return NextResponse.json({
      status: 'completed',
      duration: duration,
      ticksCollected: tickCount,
      totalAttempts: results.length + errors.length,
      results: results,
      errors: errors,
      message: `Test collection completed. Collected ${tickCount} ticks in ${duration} seconds.`
    });
    
  } catch (error: any) {
    console.error('Test collect error:', error);
    return NextResponse.json({
      error: 'Test collection failed',
      message: error.message
    }, { status: 500 });
  }
}
