import express from 'express';
import { supabase, supabaseAdmin } from '../supabase.js';
import { verifyToken } from './auth.js';

const router = express.Router();

function generateOrderNumber() {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// CREATE ORDER
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    if (!shippingAddress) return res.status(400).json({ message: 'Shipping address required' });

    const { data: cart } = await supabase.from('carts').select('id').eq('user_id', req.user.id).single();
    if (!cart) return res.status(400).json({ message: 'Cart not found' });

    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select('*, product:products(name, price)')
      .eq('cart_id', cart.id);
    if (itemsError || !cartItems || cartItems.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = subtotal > 100 ? 0 : 15;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const totalAmount = subtotal + shippingCost + tax;

    const orderNumber = generateOrderNumber();
    const { data: order, error: orderError } = await (supabaseAdmin || supabase)
      .from('orders')
      .insert([
        {
          order_number: orderNumber,
          user_id: req.user.id,
          first_name: shippingAddress.firstName,
          last_name: shippingAddress.lastName,
          email: shippingAddress.email,
          phone: shippingAddress.phone,
          street: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip_code: shippingAddress.zipCode,
          country: shippingAddress.country,
          subtotal,
          shipping_cost: shippingCost,
          tax,
          total_amount: totalAmount,
          payment_status: 'pending',
          order_status: 'pending'
        },
      ])
      .select()
      .single();
    if (orderError) throw orderError;

    const orderItemsData = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
    }));

    const { error: itemInsertError } = await (supabaseAdmin || supabase).from('order_items').insert(orderItemsData);
    if (itemInsertError) throw itemInsertError;

    await (supabaseAdmin || supabase).from('cart_items').delete().eq('cart_id', cart.id);

    res.status(201).json({ message: 'Order created successfully', order: { id: order.id, orderNumber: order.order_number, totalAmount: order.total_amount } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// GET USER ORDERS
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data: orders, error } = await supabase.from('orders').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// GET SINGLE ORDER
router.get('/:orderId', verifyToken, async (req, res) => {
  try {
    const { data: order, error } = await supabase.from('orders').select('*, order_items(*)').eq('id', req.params.orderId).eq('user_id', req.user.id).single();
    if (error || !order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
});

export default router;
