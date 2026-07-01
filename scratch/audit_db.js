import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function audit() {
  const tables = ['leads', 'customers', 'transactions', 'projects', 'tasks', 'produtos', 'profiles', 'atividades', 'arquivos'];
  for (const table of tables) {
    console.log(`\n--- Auditing table: ${table} ---`);
    // Attempt a select
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`❌ Error querying table ${table}:`, error.message, error.details || '');
    } else {
      console.log(`✅ Table ${table} queried successfully!`);
      if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
      } else {
        console.log('Table is empty. Attempting insert with empty object to get column names or schema info...');
        // We can do a POST to get the list of columns or check the response
        const { error: insertError } = await supabase.from(table).insert([{}]);
        if (insertError) {
          console.log('Insert error info (useful for columns):', insertError.message);
        }
      }
    }
  }
}

audit().catch(console.error);
