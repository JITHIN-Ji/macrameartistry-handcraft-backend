import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase, supabaseAdmin } from '../supabase.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// GET PROFILE
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase.from('users').select('id, first_name, last_name, email, phone, street, city, state, zip_code, country, profile_image_url').eq('id', req.user.id).single();
        if (error) throw error;
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
    }
});

// UPDATE PROFILE
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const updates = req.body;
        const { data: user, error } = await (supabaseAdmin || supabase).from('users').update(updates).eq('id', req.user.id).select().single();
        if (error) throw error;
        res.json({ message: 'Profile updated successfully', user });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update profile', error: err.message });
    }
});

// CHANGE PASSWORD
router.put('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmPassword) return res.status(400).json({ message: 'All fields required' });
        if (newPassword !== confirmPassword) return res.status(400).json({ message: 'New passwords do not match' });

        const { data: user, error } = await supabase.from('users').select('id, password_hash').eq('id', req.user.id).single();
        if (error || !user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);
        const { data: updated, error: updateError } = await (supabaseAdmin || supabase).from('users').update({ password_hash }).eq('id', req.user.id).select().single();
        if (updateError) throw updateError;

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to change password', error: err.message });
    }
});

// DELETE ACCOUNT
router.delete('/delete-account', verifyToken, async (req, res) => {
    try {
        const { error } = await (supabaseAdmin || supabase).from('users').delete().eq('id', req.user.id);
        if (error) throw error;
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete account', error: err.message });
    }
});

// GET SHIPPING ADDRESS
router.get('/shipping', verifyToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, first_name, last_name, email, phone, street, city, state, zip_code, country')
            .eq('id', req.user.id)
            .single();
        if (error) throw error;
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch shipping address', error: err.message });
    }
});

// UPDATE SHIPPING ADDRESS
router.put('/shipping', verifyToken, async (req, res) => {
    try {
        const { street, city, state, zip_code, country, phone } = req.body;
        
        const updates = {};
        if (street !== undefined) updates.street = street;
        if (city !== undefined) updates.city = city;
        if (state !== undefined) updates.state = state;
        if (zip_code !== undefined) updates.zip_code = zip_code;
        if (country !== undefined) updates.country = country;
        if (phone !== undefined) updates.phone = phone;

        const { data: user, error } = await (supabaseAdmin || supabase)
            .from('users')
            .update(updates)
            .eq('id', req.user.id)
            .select('id, first_name, last_name, email, phone, street, city, state, zip_code, country')
            .single();
        
        if (error) throw error;
        res.json({ message: 'Shipping address updated successfully', user });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update shipping address', error: err.message });
    }
});

export default router;
