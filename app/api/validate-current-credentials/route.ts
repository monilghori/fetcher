import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Agent, fetch as undiciFetch } from 'undici';

const DHAN_API_BASE = 'https://api.dhan.co';
const NIFTY50_SECURITY_ID = 13;

// Create agent with TLS options for development
const agent = process.env.NODE_ENV === 'development' 
  ? new Agent({ connect: { rejectUnauthorized: false } })
  : undefined;

export async function POST(request: NextRequest) {
  try {
    // Get credentials from database
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'dhan_credentials')
      .single();
    
    if (error || !data?.value?.access_token || !data?.value?.client_id) {
      return NextResponse.json({
        valid: false,
        error: 'No Credentials',
        message: 'No credentials found in database',
        errorCode: 'NO_CREDENTIALS'
      });
    }
    
    const accessToken = data.value.access_token;
    const clientId = data.value.client_id;
    
    // Test the credentials with a simple API call
    const requestBody = {
      "IDX_I": [NIFTY50_SECURITY_ID]
    };
    
    try {
      const response = await undiciFetch(`${DHAN_API_BASE}/v2/marketfeed/ltp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
          'client-id': clientId,
        },
        body: JSON.stringify(requestBody),
        dispatcher: agent
      });
      
      if (response.status === 401) {
        return NextResponse.json({
          valid: false,
          error: 'Authentication Failed',
          message: 'Invalid access token',
          errorCode: 'INVALID_TOKEN'
        });
      }
      
      if (response.status === 403) {
        return NextResponse.json({
          valid: false,
          error: 'Access Forbidden',
          message: 'Access token has expired or been revoked',
          errorCode: 'TOKEN_EXPIRED'
        });
      }
      
      if (response.status === 400) {
        return NextResponse.json({
          valid: false,
          error: 'Invalid Client ID',
          message: 'The client ID is incorrect',
          errorCode: 'INVALID_CLIENT_ID'
        });
      }
      
      if (response.status === 429) {
        return NextResponse.json({
          valid: false,
          error: 'Rate Limit Exceeded',
          message: 'Too many requests',
          errorCode: 'RATE_LIMIT'
        });
      }
      
      if (response.status >= 500) {
        return NextResponse.json({
          valid: false,
          error: 'Dhan API Error',
          message: 'Dhan API is temporarily unavailable',
          errorCode: 'API_ERROR'
        });
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({
          valid: false,
          error: 'API Error',
          message: `Dhan API returned error: ${errorText}`,
          errorCode: 'UNKNOWN_ERROR'
        });
      }
      
      // If we get here, credentials are valid
      const responseData: any = await response.json();
      
      // Verify we got valid data back
      if (!responseData || !responseData.data) {
        return NextResponse.json({
          valid: false,
          error: 'Invalid Response',
          message: 'Dhan API returned an unexpected response format',
          errorCode: 'INVALID_RESPONSE'
        });
      }
      
      return NextResponse.json({
        valid: true,
        message: 'Current credentials are valid',
        testData: {
          hasData: true,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (fetchError: any) {
      console.error('Validation fetch error:', fetchError);
      
      if (fetchError.code === 'ECONNREFUSED' || fetchError.code === 'ENOTFOUND') {
        return NextResponse.json({
          valid: false,
          error: 'Network Error',
          message: 'Unable to connect to Dhan API',
          errorCode: 'NETWORK_ERROR'
        });
      }
      
      return NextResponse.json({
        valid: false,
        error: 'Connection Error',
        message: `Failed to connect to Dhan API: ${fetchError.message}`,
        errorCode: 'CONNECTION_ERROR'
      });
    }
    
  } catch (error: any) {
    console.error('Validate current credentials error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Server Error',
      message: error.message || 'Failed to validate credentials',
      errorCode: 'SERVER_ERROR'
    }, { status: 500 });
  }
}
