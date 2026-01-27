import dotenv from 'dotenv';
import { supabaseAdmin } from './supabase.js';
import path from 'path';

dotenv.config();

// Import tattoos data from frontend
import { tattoos } from '../src/data/tattoos.js';

async function run() {
  if (!supabaseAdmin) {
    console.error('SUPABASE_SERVICE_ROLE_KEY missing in .env — cannot run admin insert.');
    process.exit(1);
  }

  const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');

  const rows = tattoos.map(t => {
    // Map frontend fields to Supabase `products` table fields
    const imagePath = t.image || '';
    const image_url = imagePath.startsWith('http')
      ? imagePath
      : (frontendUrl ? `${frontendUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}` : imagePath);

    return {
      name: t.title,
      description: t.description || '',
      price: Number(String(t.price).replace(/[^0-9.-]+/g, '')) || 0,
      category: t.category || 'uncategorized',
      image_url,
      stock: t.stock ?? 10,
      material: t.material || '',
      featured: t.featured ?? false,
    };
  });

  try {
    // Insert in batches to avoid large single requests
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { data, error } = await supabaseAdmin.from('products').insert(batch).select();
      if (error) throw error;
      console.log(`Inserted ${data.length} rows`);
    }

    console.log('✅ All frontend products inserted successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Insert error:', err.message || err);
    process.exit(1);
  }
}

run();
