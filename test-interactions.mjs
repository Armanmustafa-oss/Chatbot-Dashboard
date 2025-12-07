import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testInteractions() {
  console.log('🔍 Testing Supabase Interactions Table...\n');

  try {
    // Fetch interactions
    const { data, error, count } = await supabase
      .from('interactions')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log(`✅ Successfully connected to Supabase!`);
    console.log(`📊 Total interactions: ${count}`);
    console.log(`📝 Sample interactions (showing ${data?.length || 0}):\n`);

    if (data && data.length > 0) {
      data.forEach((interaction, index) => {
        console.log(`${index + 1}. User: ${interaction.user_id}`);
        console.log(`   Message: ${interaction.user_message?.substring(0, 60)}...`);
        console.log(`   Response: ${interaction.bot_response?.substring(0, 60)}...`);
        console.log(`   Sentiment: ${interaction.sentiment || 'N/A'}`);
        console.log(`   Intent: ${interaction.intent || 'N/A'}`);
        console.log(`   Time: ${interaction.timestamp}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

await testInteractions();
