import { DhanQuoteResponse } from './types';
import { fetch as undiciFetch } from 'undici';
import { getSupabaseBrowserClient } from './supabase';

const DHAN_API_BASE = 'https://api.dhan.co';
const NIFTY50_SECURITY_ID = 13;

// Fetch credentials from database or fallback to env variables
async function getDhanCredentials(): Promise<{ accessToken: string; clientId: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'dhan_credentials')
      .single();
    
    if (!error && data?.value?.access_token && data?.value?.client_id) {
      return {
        accessToken: data.value.access_token,
        clientId: data.value.client_id
      };
    }
  } catch (error) {
    // Silently fallback to env variables
  }
  
  // Fallback to environment variables
  const accessToken = process.env.DHAN_ACCESS_TOKEN || '';
  const clientId = process.env.DHAN_CLIENT_ID || '';
  
  return { accessToken, clientId };
}

export async function fetchNifty50Quote(): Promise<DhanQuoteResponse> {
  const { accessToken, clientId } = await getDhanCredentials();
  
  if (!accessToken || !clientId) {
    throw new Error('Dhan API credentials not configured. Please set them in Settings or environment variables.');
  }
  
  if (accessToken === 'your_dhan_access_token_here' || clientId === 'your_dhan_client_id_here') {
    throw new Error('Dhan API credentials are placeholder values. Please update with real credentials.');
  }
  
  const requestBody = {
    "IDX_I": [NIFTY50_SECURITY_ID]
  };
  
  try {
    const response = await undiciFetch(`${DHAN_API_BASE}/v2/marketfeed/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
        'client-id': clientId,
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 400) {
        throw new Error(`Dhan API bad request (400). The request format may be incorrect.`);
      } else if (response.status === 401) {
        throw new Error(`Dhan API authentication failed (401). Check your credentials in Settings.`);
      } else if (response.status === 403) {
        throw new Error(`Dhan API access forbidden (403). Your credentials may be invalid or expired.`);
      } else if (response.status === 429) {
        throw new Error(`Dhan API rate limit exceeded (429). Please wait before making more requests.`);
      } else if (response.status >= 500) {
        throw new Error(`Dhan API server error (${response.status}). The service may be temporarily unavailable.`);
      } else {
        throw new Error(`Dhan API error (${response.status}): ${errorText}`);
      }
    }
    
    const data: any = await response.json();
    
    if (!data || !data.data) {
      throw new Error('Dhan API returned invalid response structure.');
    }
    
    const idxData = data.data['IDX_I'] || data.data['NSE_FNO'];
    
    if (!idxData) {
      throw new Error('Dhan API response missing segment data');
    }
    
    let niftyData = idxData[NIFTY50_SECURITY_ID.toString()] || 
                    idxData[NIFTY50_SECURITY_ID] ||
                    idxData['13'] ||
                    idxData[13];
    
    if (!niftyData) {
      if (data.last_price || data.ltp) {
        niftyData = data;
      } else {
        throw new Error(`Dhan API response missing data for security ID ${NIFTY50_SECURITY_ID}`);
      }
    }
    
    const ltp = niftyData.last_price || niftyData.ltp || niftyData.LTP || 0;
    const prevClose = niftyData.prev_close || niftyData.close || niftyData.previous_close || niftyData.prevClose || niftyData.prev_day_close || 0;
    const open = niftyData.open || niftyData.open_price || niftyData.OPEN || null;
    const high = niftyData.high || niftyData.high_price || niftyData.HIGH || null;
    const low = niftyData.low || niftyData.low_price || niftyData.LOW || null;
    const volume = niftyData.volume || niftyData.VOLUME || niftyData.vol || null;
    const oi = niftyData.oi || niftyData.open_interest || niftyData.OI || niftyData.openInterest || null;
    
    let netChange = 0;
    let percentChange = 0;
    
    if (prevClose && prevClose > 0) {
      netChange = ltp - prevClose;
      percentChange = (netChange / prevClose) * 100;
    } else if (open && open > 0) {
      netChange = ltp - open;
      percentChange = (netChange / open) * 100;
    }
    
    return {
      data: {
        last_price: ltp,
        open: open,
        high: high,
        low: low,
        close: prevClose || null,
        volume: volume,
        oi: oi,
        net_change: netChange,
        percent_change: percentChange
      }
    } as DhanQuoteResponse;
  } catch (error: any) {
    if (error.message?.includes('fetch') || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`Network error connecting to Dhan API: ${error.message}`);
    }
    throw error;
  }
}

export async function fetchNifty50LTP(): Promise<number> {
  const { accessToken, clientId } = await getDhanCredentials();
  
  if (!accessToken || !clientId) {
    throw new Error('Dhan API credentials not configured.');
  }
  
  const requestBody = {
    "IDX_I": [NIFTY50_SECURITY_ID]
  };
  
  try {
    const response = await fetch(`${DHAN_API_BASE}/v2/marketfeed/ltp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
        'client-id': clientId,
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dhan API error (${response.status}): ${errorText}`);
    }
    
    const data: any = await response.json();
    const idxData = data.data['IDX_I'] || data.data['NSE_FNO'];
    
    if (!idxData || !idxData[NIFTY50_SECURITY_ID.toString()]) {
      throw new Error('Dhan API returned invalid response structure.');
    }
    
    const ltp = idxData[NIFTY50_SECURITY_ID.toString()].ltp || idxData[NIFTY50_SECURITY_ID.toString()].last_price;
    
    if (typeof ltp !== 'number') {
      throw new Error('Dhan API returned invalid LTP value.');
    }
    
    return ltp;
  } catch (error: any) {
    if (error.message?.includes('fetch')) {
      throw new Error(`Network error connecting to Dhan API: ${error.message}`);
    }
    throw error;
  }
}
