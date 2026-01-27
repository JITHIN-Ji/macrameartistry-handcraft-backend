import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and ANON key must be set in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

export default supabase;
