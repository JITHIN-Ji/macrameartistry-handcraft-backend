import express from 'express';
import { supabase, supabaseAdmin } from '../supabase.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// GET CART
router.get('/', verifyToken, async (req, res) => {
    try {
        // Get or create cart
        let { data: cart } = await supabase.from('carts').select('*').eq('user_id', req.user.id).single();

        if (!cart) {
            const { data: newCart, error: createError } = await (supabaseAdmin || supabase)
                .from('carts')
                .insert([{ user_id: req.user.id }])
                .select()
                .single();
            if (createError) throw createError;
            cart = newCart;
        }

        // Get cart items with full product details
        const { data: items, error: itemsError } = await supabase
            .from('cart_items')
            .select(`
                id,
                cart_id,
                product_id,
                quantity,
                price,
                product:products(id, name, description, price, image_url, category, stock, featured, created_at)
            `)
            .eq('cart_id', cart.id);

        if (itemsError) throw itemsError;

        res.json({ id: cart.id, user_id: cart.user_id, items: items || [] });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch cart', error: error.message });
    }
});

// ADD TO CART
router.post('/add', verifyToken, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        if (!productId || !quantity) return res.status(400).json({ message: 'Product ID and quantity required' });

        // Get or create cart
        let { data: cart } = await supabase.from('carts').select('id').eq('user_id', req.user.id).single();
        if (!cart) {
            const { data: newCart } = await (supabaseAdmin || supabase).from('carts').insert([{ user_id: req.user.id }]).select().single();
            cart = newCart;
        }

        // Get product price
        const { data: product, error: productError } = await supabase.from('products').select('price').eq('id', productId).single();
        if (productError || !product) return res.status(404).json({ message: 'Product not found' });

        // Check if item exists
        const { data: existingItem } = await supabase.from('cart_items').select('id, quantity').eq('cart_id', cart.id).eq('product_id', productId).single();

        if (existingItem) {
            const { error: updateError } = await (supabaseAdmin || supabase)
                .from('cart_items')
                .update({ quantity: existingItem.quantity + quantity })
                .eq('id', existingItem.id);
            if (updateError) throw updateError;
        } else {
            const { error: insertError } = await (supabaseAdmin || supabase).from('cart_items').insert([{ cart_id: cart.id, product_id: productId, quantity, price: product.price }]);
            if (insertError) throw insertError;
        }

        res.json({ message: 'Added to cart' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add to cart', error: error.message });
    }
});

// UPDATE CART ITEM
router.put('/update/:itemId', verifyToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        if (quantity <= 0) {
            const { error } = await (supabaseAdmin || supabase).from('cart_items').delete().eq('id', req.params.itemId);
            if (error) throw error;
        } else {
            const { error } = await (supabaseAdmin || supabase).from('cart_items').update({ quantity }).eq('id', req.params.itemId);
            if (error) throw error;
        }

        res.json({ message: 'Cart updated' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update cart', error: error.message });
    }
});

// REMOVE FROM CART
router.delete('/remove/:itemId', verifyToken, async (req, res) => {
    try {
        const { error } = await (supabaseAdmin || supabase).from('cart_items').delete().eq('id', req.params.itemId);
        if (error) throw error;
        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove item', error: error.message });
    }
});

// CLEAR CART
router.delete('/clear/:cartId', verifyToken, async (req, res) => {
    try {
        const { error } = await (supabaseAdmin || supabase).from('cart_items').delete().eq('cart_id', req.params.cartId);
        if (error) throw error;
        res.json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to clear cart', error: error.message });
    }
});

export default router;
