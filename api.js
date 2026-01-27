// DEPRECATED - This file is no longer used
// API calls are now made directly by frontend components or through custom hooks
// The backend routes (server.js and routes/) handle all API logic

// ==================== 
// AUTH API
// ====================
export const authAPI = {
    register: async (data) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    login: async (email, password) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return response.json();
    },

    verify: async (token) => {
        const response = await fetch(`${API_URL}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    logout: async (token) => {
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    }
};

// ==================== 
// PRODUCTS API
// ====================
export const productsAPI = {
    getAll: async (filters = {}) => {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_URL}/products?${queryString}`);
        return response.json();
    },

    getById: async (id) => {
        const response = await fetch(`${API_URL}/products/${id}`);
        return response.json();
    }
};

// ==================== 
// CART API
// ====================
export const cartAPI = {
    get: async (token) => {
        const response = await fetch(`${API_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    add: async (token, productId, quantity) => {
        const response = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity })
        });
        return response.json();
    },

    update: async (token, itemId, quantity) => {
        const response = await fetch(`${API_URL}/cart/update/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity })
        });
        return response.json();
    },

    remove: async (token, itemId) => {
        const response = await fetch(`${API_URL}/cart/remove/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    clear: async (token) => {
        const response = await fetch(`${API_URL}/cart/clear`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    }
};

// ==================== 
// ORDERS API
// ====================
export const ordersAPI = {
    create: async (token, shippingAddress) => {
        const response = await fetch(`${API_URL}/orders/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ shippingAddress })
        });
        return response.json();
    },

    getAll: async (token) => {
        const response = await fetch(`${API_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    getById: async (token, orderId) => {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    cancel: async (token, orderId) => {
        const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    }
};

// ==================== 
// PAYMENT API
// ====================
export const paymentAPI = {
    getConfig: async () => {
        const response = await fetch(`${API_URL}/payment/config`);
        return response.json();
    },

    createIntent: async (token, orderId) => {
        const response = await fetch(`${API_URL}/payment/create-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ orderId })
        });
        return response.json();
    },

    confirm: async (token, orderId, paymentIntentId) => {
        const response = await fetch(`${API_URL}/payment/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ orderId, paymentIntentId })
        });
        return response.json();
    }
};

// ==================== 
// USERS API
// ====================
export const usersAPI = {
    getProfile: async (token) => {
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    updateProfile: async (token, data) => {
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    changePassword: async (token, data) => {
        const response = await fetch(`${API_URL}/users/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    }
};

// ==================== 
// LOCAL STORAGE HELPERS
// ====================
export const storage = {
    setToken: (token) => localStorage.setItem('authToken', token),
    getToken: () => localStorage.getItem('authToken'),
    removeToken: () => localStorage.removeItem('authToken'),
    setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
    getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
    removeUser: () => localStorage.removeItem('user')
};
