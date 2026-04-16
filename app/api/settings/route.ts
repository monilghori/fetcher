import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Get current settings
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseBrowserClient();
    
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('key', 'dhan_credentials')
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Failed to fetch settings:', error);
      return NextResponse.json({ 
        error: 'Database Error',
        message: 'Failed to fetch settings'
      }, { status: 500 });
    }
    
    // Return masked credentials (don't expose full values)
    const credentials = data?.value || {};
    return NextResponse.json({
      hasAccessToken: !!credentials.access_token,
      hasClientId: !!credentials.client_id,
      accessTokenPreview: credentials.access_token ? `${credentials.access_token.substring(0, 8)}...` : null,
      clientIdPreview: credentials.client_id ? `${credentials.client_id.substring(0, 8)}...` : null
    });
    
  } catch (error: any) {
    console.error('Get settings error:', error);
    return NextResponse.json({
      error: 'Server Error',
      message: error.message || 'Failed to fetch settings'
    }, { status: 500 });
  }
}

// Update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, clientId } = body;
    
    if (!accessToken || !clientId) {
      return NextResponse.json({ 
        error: 'Invalid Input',
        message: 'Access token and client ID are required'
      }, { status: 400 });
    }
    
    const supabase = getSupabaseBrowserClient();
    
    // Upsert credentials
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        key: 'dhan_credentials',
        value: {
          access_token: accessToken,
          client_id: clientId
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });
    
    if (error) {
      console.error('Failed to update settings:', error);
      return NextResponse.json({ 
        error: 'Database Error',
        message: 'Failed to update settings',
        details: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Credentials updated successfully'
    });
    
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({
      error: 'Server Error',
      message: error.message || 'Failed to update settings'
    }, { status: 500 });
  }
}
