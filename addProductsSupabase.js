import dotenv from 'dotenv';
import { supabaseAdmin } from './supabase.js';

dotenv.config();



async function addProducts() {
  if (!supabaseAdmin) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not provided in .env — cannot insert via admin client.');
    process.exit(1);
  }

  try {
    const { data, error } = await supabaseAdmin.from('products').insert(products).select();
    if (error) throw error;

    console.log(`✅ Inserted ${data.length} products`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error inserting products:', err.message || err);
    process.exit(1);
  }
}

addProducts();
