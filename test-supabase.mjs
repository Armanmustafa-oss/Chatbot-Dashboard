import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log(`URL: ${SUPABASE_URL}`);
console.log(`Key: ${SUPABASE_KEY?.substring(0, 20)}...`);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  try {
    console.log('\n📡 Attempting to connect to Supabase...');
    
    // Test 1: Check if conversations table exists
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('count(*)', { count: 'exact', head: true });

    if (convError) {
      console.error('❌ Error accessing conversations table:', convError.message);
      return false;
    }

    console.log('✅ Successfully connected to Supabase!');

    // Test 2: Fetch sample conversations
    const { data: sampleData, error: sampleError } = await supabase
      .from('conversations')
      .select('*')
      .limit(3);

    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError.message);
      return false;
    }

    console.log(`✅ Found ${sampleData?.length || 0} sample conversations`);

    if (sampleData && sampleData.length > 0) {
      console.log('\n📊 Sample Conversation:');
      const sample = sampleData[0];
      console.log(`  User: ${sample.user_id}`);
      console.log(`  Message: ${sample.user_message?.substring(0, 50)}...`);
      console.log(`  Response: ${sample.bot_response?.substring(0, 50)}...`);
      console.log(`  Sentiment: ${sample.sentiment}`);
      console.log(`  Intent: ${sample.intent}`);
      console.log(`  Timestamp: ${sample.timestamp}`);
    }

    // Test 3: Get statistics
    const { data: allConversations, error: allError } = await supabase
      .from('conversations')
      .select('sentiment, intent', { count: 'exact' });

    if (!allError && allConversations) {
      const sentiments = {};
      const intents = {};

      allConversations.forEach(conv => {
        sentiments[conv.sentiment] = (sentiments[conv.sentiment] || 0) + 1;
        intents[conv.intent] = (intents[conv.intent] || 0) + 1;
      });

      console.log('\n📈 Database Statistics:');
      console.log(`  Total Conversations: ${allConversations.length}`);
      console.log(`  Sentiment Breakdown:`, sentiments);
      console.log(`  Intent Breakdown:`, intents);
    }

    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

const result = await testConnection();
process.exit(result ? 0 : 1);
