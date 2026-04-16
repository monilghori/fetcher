import { NextResponse } from 'next/server';
import { getSupabaseServerClient, getSupabaseBrowserClient } from '@/lib/supabase';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {} as any,
    supabase: {} as any,
    dhan: {} as any,
    recommendations: [] as string[]
  };

  // Check environment variables
  diagnostics.environment = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
      (process.env.SUPABASE_SERVICE_ROLE_KEY === 'your_service_role_key_here' ? '✗ Placeholder' : '✓ Set') : 
      '✗ Missing',
    DHAN_ACCESS_TOKEN: process.env.DHAN_ACCESS_TOKEN ? 
      (process.env.DHAN_ACCESS_TOKEN === 'your_dhan_access_token_here' ? '✗ Placeholder' : '✓ Set') : 
      '✗ Missing',
    DHAN_CLIENT_ID: process.env.DHAN_CLIENT_ID ? 
      (process.env.DHAN_CLIENT_ID === 'your_dhan_client_id_here' ? '✗ Placeholder' : '✓ Set') : 
      '✗ Missing',
    CRON_SECRET: process.env.CRON_SECRET ? '✓ Set' : '✗ Missing',
    NEXT_PUBLIC_CRON_SECRET: process.env.NEXT_PUBLIC_CRON_SECRET ? '✓ Set' : '✗ Missing',
  };

  // Test Supabase connection
  try {
    const supabase = getSupabaseServerClient();
    
    // Test table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('nifty50_ticks')
      .select('id')
      .limit(1);
    
    if (tableError) {
      diagnostics.supabase.tableExists = '✗ Error: ' + tableError.message;
      if (tableError.message.includes('nifty50_ticks')) {
        diagnostics.recommendations.push('Run the SQL setup from supabase-setup.sql in your Supabase dashboard');
      }
    } else {
      diagnostics.supabase.tableExists = '✓ Table exists';
    }
    
    // Test insert permission
    const testData = {
      fetched_at: new Date().toISOString(),
      ltp: 99999.99,
      data_source: 'diagnostic_test',
      raw_response: { test: true }
    };
    
    const { data: insertTest, error: insertError } = await supabase
      .from('nifty50_ticks')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      diagnostics.supabase.canInsert = '✗ Error: ' + insertError.message;
      if (insertError.message.includes('permission') || insertError.message.includes('policy')) {
        diagnostics.recommendations.push('Check RLS policies in Supabase. Service role key should bypass RLS.');
      }
      if (insertError.message.includes('authentication')) {
        diagnostics.recommendations.push('SUPABASE_SERVICE_ROLE_KEY is invalid. Get the correct key from Supabase Settings → API');
      }
    } else {
      diagnostics.supabase.canInsert = '✓ Insert successful (test row created)';
      diagnostics.supabase.testRowId = insertTest.id;
      
      // Clean up test row
      await supabase
        .from('nifty50_ticks')
        .delete()
        .eq('id', insertTest.id);
      
      diagnostics.supabase.cleanup = '✓ Test row deleted';
    }
    
    // Count existing rows
    const { count } = await supabase
      .from('nifty50_ticks')
      .select('*', { count: 'exact', head: true });
    
    diagnostics.supabase.totalRows = count || 0;
    
  } catch (error: any) {
    diagnostics.supabase.error = error.message;
    diagnostics.recommendations.push('Check Supabase connection and credentials');
  }

  // Test Dhan API
  try {
    const accessToken = process.env.DHAN_ACCESS_TOKEN;
    const clientId = process.env.DHAN_CLIENT_ID;
    
    if (!accessToken || !clientId || 
        accessToken === 'your_dhan_access_token_here' || 
        clientId === 'your_dhan_client_id_here') {
      diagnostics.dhan.status = '✗ Credentials not configured';
      diagnostics.recommendations.push('Set valid DHAN_ACCESS_TOKEN and DHAN_CLIENT_ID in .env.local');
    } else {
      const response = await fetch('https://api.dhan.co/v2/marketfeed/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
          'client-id': clientId,
        },
        body: JSON.stringify({
          NSE_FNO: {
            '13': [{ secId: '13', type: 'INDEX' }]
          }
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        diagnostics.dhan.status = '✓ API connection successful';
        diagnostics.dhan.currentLTP = data.data?.last_price || 'N/A';
      } else {
        diagnostics.dhan.status = `✗ API error (${response.status})`;
        diagnostics.dhan.error = await response.text();
        diagnostics.recommendations.push('Check Dhan API credentials are valid and not expired');
      }
    }
  } catch (error: any) {
    diagnostics.dhan.status = '✗ Connection failed';
    diagnostics.dhan.error = error.message;
    diagnostics.recommendations.push('Check internet connection and Dhan API availability');
  }

  // Add general recommendations
  if (diagnostics.environment.SUPABASE_SERVICE_ROLE_KEY === '✗ Placeholder') {
    diagnostics.recommendations.unshift('🔴 CRITICAL: Update SUPABASE_SERVICE_ROLE_KEY in .env.local with your actual service role key from Supabase Settings → API');
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
