import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { supabase, supabaseAdmin } from '../supabase.js';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '2d';

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware to verify admin access
export const verifyAdmin = async (req, res, next) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', req.user.id)
            .single();

        if (error || !user || !user.is_admin) {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: 'Failed to verify admin status', error: err.message });
    }
};

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword, phone } = req.body;
        if (!firstName || !lastName || !email || !password || !phone)
            return res.status(400).json({ message: 'All fields are required' });
        if (password !== confirmPassword)
            return res.status(400).json({ message: 'Passwords do not match' });

        const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
        if (existing) return res.status(409).json({ message: 'Email already registered' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const { data: newUser, error } = await (supabaseAdmin || supabase)
            .from('users')
            .insert([
                { first_name: firstName, last_name: lastName, email, password_hash, phone },
            ])
            .select()
            .single();

        if (error) throw error;

        const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: newUser.id, firstName: newUser.first_name, lastName: newUser.last_name, email: newUser.email, phone: newUser.phone, isAdmin: newUser.is_admin }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

        const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
        if (error || !user) return res.status(401).json({ message: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

        res.json({ message: 'Login successful', token, user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, isAdmin: user.is_admin } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
});

// VERIFY TOKEN
router.get('/verify', verifyToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase.from('users').select('id, first_name, last_name, email, is_admin').eq('id', req.user.id).single();
        if (error) return res.status(401).json({ valid: false });
        res.json({ valid: true, user });
    } catch (err) {
        res.status(401).json({ valid: false });
    }
});

// LOGOUT
router.post('/logout', verifyToken, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

export default router;
