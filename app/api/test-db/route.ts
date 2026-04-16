import { NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseBrowserClient();
    
    // Test 1: Check if table exists
    const { data: existingData, error: selectError } = await supabase
      .from('nifty50_ticks')
      .select('id')
      .limit(1);
    
    if (selectError) {
      return NextResponse.json({
        success: false,
        test: 'table_check',
        error: selectError.message,
        code: selectError.code,
        hint: selectError.hint,
        details: selectError.details
      }, { status: 500 });
    }
    
    // Test 2: Try to insert test data
    const testData = {
      fetched_at: new Date().toISOString(),
      ltp: 99999.99,
      data_source: 'db_test',
      raw_response: { test: true }
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('nifty50_ticks')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      return NextResponse.json({
        success: false,
        test: 'insert_test',
        error: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        details: insertError.details,
        message: 'INSERT failed. You need to add INSERT policy to Supabase.'
      }, { status: 500 });
    }
    
    // Test 3: Clean up test data
    await supabase
      .from('nifty50_ticks')
      .delete()
      .eq('id', insertData.id);
    
    // Test 4: Count existing records
    const { count } = await supabase
      .from('nifty50_ticks')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      success: true,
      message: 'Database is working correctly!',
      tests: {
        table_exists: true,
        can_select: true,
        can_insert: true,
        can_delete: true
      },
      existing_records: count || 0,
      test_row_id: insertData.id
    }, { status: 200 });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
