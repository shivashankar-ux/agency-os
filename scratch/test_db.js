const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Simple parser for .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const { data, error } = await supabase.from("tasks")
      .select("id, title, profiles!assigned_to(name)")
      .limit(2);
    
    if (error) {
      console.error("Query Error:", error);
    } else {
      console.log("Query Success! Sample data:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

test();
