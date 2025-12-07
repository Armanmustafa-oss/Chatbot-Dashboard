import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setupSupabase() {
  console.log('🔧 Setting up Supabase for Chatbot Dashboard...\n');

  try {
    // Test connection
    console.log('1️⃣  Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase.auth.getSession();
    
    if (testError) {
      console.log('⚠️  Auth test note:', testError.message);
    } else {
      console.log('✅ Supabase connection successful!');
    }

    // Try to list tables
    console.log('\n2️⃣  Checking for conversations table...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    if (convError) {
      console.log('⚠️  Conversations table error:', convError.message);
      console.log('\n📝 The conversations table may not exist yet.');
      console.log('   You need to create it in Supabase with the following schema:\n');
      
      console.log(`CREATE TABLE conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  context_used TEXT,
  language_code VARCHAR(10) DEFAULT 'en',
  session_id VARCHAR(255),
  intent VARCHAR(50),
  sentiment VARCHAR(50),
  urgency VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX idx_conversations_sentiment ON conversations(sentiment);
CREATE INDEX idx_conversations_intent ON conversations(intent);`);
      
      console.log('\n📍 Steps to create the table:');
      console.log('1. Go to https://app.supabase.com');
      console.log('2. Select your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Paste the SQL above and execute');
      console.log('5. Run this script again to verify\n');
    } else {
      console.log(`✅ Conversations table exists! Found ${conversations?.length || 0} records`);
    }

    // Check for other potential tables
    console.log('\n3️⃣  Checking for other tables...');
    const tables = ['messages', 'chats', 'interactions', 'logs'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`   ✅ Found table: ${table}`);
      }
    }

  } catch (error) {
    console.error('❌ Setup error:', error.message);
  }
}

await setupSupabase();
