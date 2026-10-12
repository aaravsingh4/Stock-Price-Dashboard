import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface AppConfig {
  port: number;
  nodeEnv: string;
  finnhubApiKey: string;
  isFinnhubConfigured: boolean;
  databaseUrl: string;
  directUrl: string;
  isDatabaseConfigured: boolean;
  sessionSecret: string;
  isProduction: boolean;
}

export const env: AppConfig = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  finnhubApiKey: process.env.FINNHUB_API_KEY?.trim() || '',
  databaseUrl: process.env.DATABASE_URL?.trim() || '',
  directUrl: process.env.DIRECT_URL?.trim() || '',
  sessionSecret: process.env.SESSION_SECRET?.trim() || 'tradepulse-default-fallback-session-secret-key-32chars',
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  },
  get isFinnhubConfigured(): boolean {
    return Boolean(this.finnhubApiKey && this.finnhubApiKey.length > 5 && !this.finnhubApiKey.includes('your_finnhub_api_key'));
  },
  get isDatabaseConfigured(): boolean {
    return Boolean(this.databaseUrl && this.databaseUrl.startsWith('postgres'));
  },
};

