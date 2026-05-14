// API Base URL - change this based on environment
const API_URL = import.meta.env.VITE_API_URL || 'https://yash-collections-backend.vercel.app/api' || 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401 || (data.message && (data.message.includes('User no longer exists') || data.message.includes('suspended')))) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('savedAddresses');
    localStorage.removeItem('myOrders');
    localStorage.removeItem('cart');
    window.location.href = '/login';
    throw new Error(data.message || 'Session expired. Please login again.');
  }

  if (!response.ok) {
    throw new Error(data.message || 'API Error');
  }

  return data;
};

// ============= AUTH API =============
export const authAPI = {
  register: (userData) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getProfile: () => apiCall('/auth/profile'),

  updateProfile: (profileData) =>
    apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
};

// ============= PRODUCT API =============
export const productAPI = {
  getAllProducts: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiCall(`/products${queryParams ? '?' + queryParams : ''}`);
  },

  getProductById: (id) => apiCall(`/products/${id}`),

  createProduct: (productData) =>
    apiCall('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),

  updateProduct: (id, productData) =>
    apiCall(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),

  deleteProduct: (id) =>
    apiCall(`/products/${id}`, {
      method: 'DELETE',
    }),
};

// ============= CART API =============
export const cartAPI = {
  getCart: () => apiCall('/cart'),

  syncCart: (items) =>
    apiCall('/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  addToCart: (cartData) =>
    apiCall('/cart/add', {
      method: 'POST',
      body: JSON.stringify(cartData),
    }),

  removeFromCart: (removeData) =>
    apiCall('/cart/remove', {
      method: 'POST',
      body: JSON.stringify(removeData),
    }),

  updateCartItem: (updateData) =>
    apiCall('/cart/update', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),

  clearCart: () =>
    apiCall('/cart/clear', {
      method: 'POST',
    }),
};

// ============= ORDER API =============
export const orderAPI = {
  createOrder: (orderData) =>
    apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  getMyOrders: () => apiCall('/orders/my-orders'),

  getOrderById: (id) => apiCall(`/orders/${id}`),

  getAllOrders: () => apiCall('/orders'),

    updateOrderStatus: (id, statusData) =>
      apiCall(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(statusData),
      }),
  };

  // ============= COLLECTION API =============
  export const collectionAPI = {
    getAllCollections: () => apiCall('/collections'),
  };

export default {
  authAPI,
  productAPI,
  cartAPI,
  orderAPI,
  collectionAPI,
};
