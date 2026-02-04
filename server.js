import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import database
import { supabase } from './supabase.js';

// Import routes
import productRoutes from './routes/products.js';

const app = express();

// ==================== 
// MIDDLEWARE
// ====================
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '..')));

// Log Supabase connection once at startup
(async function checkSupabase() {
  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Connected to Supabase');
  } catch (err) {
    console.warn('⚠️ Supabase connectivity check failed:', err.message);
  }
})();

// ==================== 
// HEALTH CHECK (Supabase)
// ====================
app.get('/api/health', async (req, res) => {
    try {
        // simple query to validate DB connectivity
        const { error } = await supabase.from('products').select('id').limit(1);
        if (error) throw error;
        res.json({ status: 'Server is running ✅', database: 'Connected to Supabase' });
    } catch (error) {
        res.status(500).json({ status: 'Error', message: error.message });
    }
});

// ==================== 
// API ROUTES
// ====================
app.use('/api/products', productRoutes);
// Auth, cart, order, payment and user management routes removed per simplified setup.

// (health check route replaced above)

// ==================== 
// ERROR HANDLING
// ====================
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        status: err.status || 500
    });
});

// ==================== 
// 404 HANDLER
// ====================
app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found',
        path: req.originalUrl
    });
});

// ==================== 
// START SERVER
// ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
