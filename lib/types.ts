export interface DhanQuoteResponse {
  data: {
    last_price: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    oi?: number;
    net_change?: number;
    percent_change?: number;
  };
}

export interface Nifty50Tick {
  id?: number;
  fetched_at: string;
  market_timestamp?: string;
  ltp: number;
  open_price?: number;
  high_price?: number;
  low_price?: number;
  close_price?: number;
  volume?: number;
  open_interest?: number;
  net_change?: number;
  percent_change?: number;
  data_source: string;
  raw_response?: any;
  created_at?: string;
}

export interface CollectionStatus {
  isWithinWindow: boolean;
  currentTime: string;
  nextWindowStart?: string;
  secondsUntilWindow?: number;
}
