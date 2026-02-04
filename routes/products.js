import express from 'express';
import { supabase, supabaseAdmin } from '../supabase.js';

// Simple admin header check to allow product management without full auth system.
// Frontend admin page must send `x-admin-user` and `x-admin-pass` headers.
const ADMIN_USER = process.env.ADMIN_USER || 'macrameartistry@gmail.com';
const ADMIN_PASS = process.env.ADMIN_PASS || '12345678';

const isAdminRequest = (req) => {
    const user = req.headers['x-admin-user'];
    const pass = req.headers['x-admin-pass'];
    return user === ADMIN_USER && pass === ADMIN_PASS;
};

const router = express.Router();

// GET ALL PRODUCTS
router.get('/', async (req, res) => {
    try {
        const { category, search, featured, sort } = req.query;

        let query = supabase.from('products').select('*');

        if (category) query = query.eq('category', category);
        if (featured === 'true') query = query.eq('featured', true);

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        if (sort === 'price-low') query = query.order('price', { ascending: true });
        else if (sort === 'price-high') query = query.order('price', { ascending: false });
        else if (sort === 'newest') query = query.order('created_at', { ascending: false });

        const { data: products, error } = await query;

        if (error) throw error;

        console.log(`✅ Products loaded successfully from Supabase - ${products.length} products found`);
        res.json({ count: products.length, products });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch products', error: error.message });
    }
});

// GET SINGLE PRODUCT
router.get('/:id', async (req, res) => {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !product) return res.status(404).json({ message: 'Product not found' });

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch product', error: error.message });
    }
});

// CREATE PRODUCT (ADMIN ONLY)
router.post('/', async (req, res) => {
    try {
        if (!isAdminRequest(req)) return res.status(403).json({ message: 'Access denied. Admin credentials required in headers.' });
        const { name, description, price, category, image_url, stock, material, featured } = req.body;

        if (!name || !description || !price || !image_url) {
            return res.status(400).json({ message: 'Required fields missing' });
        }

        const { data: product, error } = await supabaseAdmin
            .from('products')
            .insert([
                {
                    name,
                    description,
                    price,
                    category: category || 'other',
                    image_url,
                    stock: stock || 0,
                    material: material || '',
                    featured: featured || false,
                },
            ])
            .select()
            .single();

        if (error) throw error;

        console.log(`🆕 New product added: ${product.name} (id: ${product.id})`);

        res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create product', error: error.message });
    }
});

// UPDATE PRODUCT (ADMIN ONLY)
router.put('/:id', async (req, res) => {
    try {
        if (!isAdminRequest(req)) return res.status(403).json({ message: 'Access denied. Admin credentials required in headers.' });
        const { data: product, error } = await supabaseAdmin
            .from('products')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!product) return res.status(404).json({ message: 'Product not found' });

        res.json({ message: 'Product updated successfully', product });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update product', error: error.message });
    }
});

// DELETE PRODUCT (ADMIN ONLY)
router.delete('/:id', async (req, res) => {
    try {
        if (!isAdminRequest(req)) return res.status(403).json({ message: 'Access denied. Admin credentials required in headers.' });
        const { error } = await supabaseAdmin.from('products').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete product', error: error.message });
    }
});

export default router;
