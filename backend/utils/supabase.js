require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://aezdtsjycbsygqnsvkbz.supabase.co';

// IMPORTANT: Use service role key for admin operations (bypasses RLS)
// Get this from Supabase Dashboard > Settings > API > service_role key (secret)
// Set it in .env file as: SUPABASE_SERVICE_KEY=your_key_here
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey || supabaseServiceKey === 'your_service_role_key_here') {
  console.error('⚠️ WARNING: SUPABASE_SERVICE_KEY not configured!');
  console.error('⚠️ The backend needs the service_role key to access the users table.');
  console.error('⚠️ Current value:', supabaseServiceKey || 'NOT SET');
  console.error('⚠️ Get your key from: Supabase Dashboard > Settings > API > service_role key');
  console.error('⚠️ In backend/.env set: SUPABASE_SERVICE_KEY=your_actual_key (use Brave or your browser to open Supabase Dashboard)');
  console.error('⚠️ Then restart the server with: npm start');
}

// Create Supabase client with service role key for admin operations
// If service role key is not provided, backend will not work properly
const supabaseKey = supabaseServiceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlemR0c2p5Y2JzeWdxbnN2a2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mjk4MTEsImV4cCI6MjA4MjMwNTgxMX0.q6DYxzIGPJLt8_2Aop1HQ31VkGk0OP9ODwy7CTJoN2I';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const hasValidServiceKey = Boolean(supabaseServiceKey && supabaseServiceKey !== 'your_service_role_key_here');

module.exports = supabase;
module.exports.hasValidServiceKey = hasValidServiceKey;
