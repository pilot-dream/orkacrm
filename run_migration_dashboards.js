import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials not found in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  const sql = fs.readFileSync('migration_user_dashboards.sql', 'utf8');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error("Migration failed:", error);
    
    // Fallback if exec_sql is not available or fails
    console.log("Trying to insert directly (this won't create tables but let's check connection)...");
  } else {
    console.log("Migration successful:", data);
  }
}

runMigration();
