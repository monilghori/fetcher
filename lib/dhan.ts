import { DhanQuoteResponse } from './types';
import { fetch as undiciFetch } from 'undici';

const DHAN_API_BASE = 'https://api.dhan.co';
const NIFTY50_SECURITY_ID = '13';

export async function fetchNifty50Quote(): Promise<DhanQuoteResponse> {
  const accessToken = process.env.DHAN_ACCESS_TOKEN;
  const clientId = process.env.DHAN_CLIENT_ID;
  
  if (!accessToken || !clientId) {
    throw new Error('Dhan API credentials not configured. Please set DHAN_ACCESS_TOKEN and DHAN_CLIENT_ID in .env.local');
  }
  
  if (accessToken === 'your_dhan_access_token_here' || clientId === 'your_dhan_client_id_here') {
    throw new Error('Dhan API credentials are placeholder values. Please update with real credentials in .env.local');
  }
  
  console.log('🌐 Making request to:', `${DHAN_API_BASE}/v2/marketfeed/quote`);
  console.log('📝 Headers:', {
    'Content-Type': 'application/json',
    'access-token': accessToken.substring(0, 20) + '...',
    'client-id': clientId
  });
  
  try {
    const response = await undiciFetch(`${DHAN_API_BASE}/v2/marketfeed/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
        'client-id': clientId,
      },
      body: JSON.stringify({
        NSE_FNO: {
          [NIFTY50_SECURITY_ID]: [
            {
              secId: NIFTY50_SECURITY_ID,
              type: 'INDEX'
            }
          ]
        }
      }),
    });
    
    console.log('📥 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error body:', errorText);
      
      if (response.status === 401) {
        throw new Error(`Dhan API authentication failed (401). Check your DHAN_ACCESS_TOKEN and DHAN_CLIENT_ID. Response: ${errorText}`);
      } else if (response.status === 403) {
        throw new Error(`Dhan API access forbidden (403). Your credentials may be invalid or expired. Response: ${errorText}`);
      } else if (response.status === 429) {
        throw new Error(`Dhan API rate limit exceeded (429). Please wait before making more requests. Response: ${errorText}`);
      } else if (response.status >= 500) {
        throw new Error(`Dhan API server error (${response.status}). The service may be temporarily unavailable. Response: ${errorText}`);
      } else {
        throw new Error(`Dhan API error (${response.status}): ${errorText}`);
      }
    }
    
    const data: any = await response.json();
    console.log('✅ Response data received:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Validate response structure
    if (!data || !data.data) {
      throw new Error('Dhan API returned invalid response structure. Missing data field.');
    }
    
    return data as DhanQuoteResponse;
  } catch (error: any) {
    console.error('💥 Fetch error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      cause: error.cause
    });
    
    if (error.message?.includes('fetch') || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`Network error connecting to Dhan API: ${error.message}. Check your internet connection and firewall settings.`);
    }
    throw error;
  }
}

export async function fetchNifty50LTP(): Promise<number> {
  const accessToken = process.env.DHAN_ACCESS_TOKEN;
  const clientId = process.env.DHAN_CLIENT_ID;
  
  if (!accessToken || !clientId) {
    throw new Error('Dhan API credentials not configured. Please set DHAN_ACCESS_TOKEN and DHAN_CLIENT_ID in .env.local');
  }
  
  if (accessToken === 'your_dhan_access_token_here' || clientId === 'your_dhan_client_id_here') {
    throw new Error('Dhan API credentials are placeholder values. Please update with real credentials in .env.local');
  }
  
  try {
    const response = await fetch(`${DHAN_API_BASE}/v2/marketfeed/ltp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
        'client-id': clientId,
      },
      body: JSON.stringify({
        NSE_FNO: {
          [NIFTY50_SECURITY_ID]: [
            {
              secId: NIFTY50_SECURITY_ID,
              type: 'INDEX'
            }
          ]
        }
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 401) {
        throw new Error(`Dhan API authentication failed (401). Check your DHAN_ACCESS_TOKEN and DHAN_CLIENT_ID. Response: ${errorText}`);
      } else if (response.status === 403) {
        throw new Error(`Dhan API access forbidden (403). Your credentials may be invalid or expired. Response: ${errorText}`);
      } else if (response.status === 429) {
        throw new Error(`Dhan API rate limit exceeded (429). Please wait before making more requests. Response: ${errorText}`);
      } else if (response.status >= 500) {
        throw new Error(`Dhan API server error (${response.status}). The service may be temporarily unavailable. Response: ${errorText}`);
      } else {
        throw new Error(`Dhan API error (${response.status}): ${errorText}`);
      }
    }
    
    const data: any = await response.json();
    
    // Validate response structure
    if (!data || !data.data || typeof data.data.last_price !== 'number') {
      throw new Error('Dhan API returned invalid response structure. Missing or invalid last_price field.');
    }
    
    return data.data.last_price;
  } catch (error: any) {
    if (error.message?.includes('fetch')) {
      throw new Error(`Network error connecting to Dhan API: ${error.message}. Check your internet connection.`);
    }
    throw error;
  }
}
