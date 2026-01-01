import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aezdtsjycbsygqnsvkbz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlemR0c2p5Y2JzeWdxbnN2a2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mjk4MTEsImV4cCI6MjA4MjMwNTgxMX0.q6DYxzIGPJLt8_2Aop1HQ31VkGk0OP9ODwy7CTJoN2I'

export const supabase = createClient(supabaseUrl, supabaseKey)