const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://yash-collections-backend.vercel.app/api' || 'http://localhost:5000/api';

// Returns clean token — strips "Bearer " if stored with prefix
const getToken = () => {
  const raw = localStorage.getItem('authToken') || '';
  return raw.startsWith('Bearer ') ? raw.slice(7) : raw;
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

export const fetchAllUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/users`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch users');
  const data = await response.json();
  return data.data?.users || [];
};

export const deleteUserAdmin = async (id) => {
  const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete user');
  return response.json();
};

/* ─── Products ─── */
export const fetchAllProducts = async () => {
  const response = await fetch(`${API_BASE_URL}/products/admin/all`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch products');
  const data = await response.json();
  return data.data?.products || [];
};

export const fetchProductById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch product');
  const data = await response.json();
  return data.data?.product;
};

export const createProduct = async (productData) => {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(productData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to create product');
  }
  const data = await response.json();
  return data.data?.product;
};

export const updateProduct = async (id, productData) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(productData),
  });
  if (!response.ok) throw new Error('Failed to update product');
  const data = await response.json();
  return data.data?.product;
};

export const deleteProduct = async (id) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) throw new Error('Failed to delete product');
  return true;
};

/* ─── Image Upload (product/banner) ─── */
export const uploadImage = async (file, type = 'products') => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload?type=${type}`, {
    method: 'POST',
    // No auth header — upload route is open
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to upload image');
  }
  const data = await response.json();
  return data.data?.imageUrl;
};


/* ─── Collections ─── */
export const fetchAllCollectionsAdmin = async () => {
  const response = await fetch(`${API_BASE_URL}/collections/admin/all`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) throw new Error('Failed to fetch collections');
  const data = await response.json();
  return data.data?.collections || [];
};

export const createCollection = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/collections`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData, // FormData — do NOT set Content-Type manually
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to create collection');
  }
  const data = await response.json();
  return data.data?.collection;
};

export const updateCollection = async (id, formData) => {
  const response = await fetch(`${API_BASE_URL}/collections/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to update collection');
  }
  const data = await response.json();
  return data.data?.collection;
};

export const deleteCollection = async (id) => {
  const response = await fetch(`${API_BASE_URL}/collections/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) throw new Error('Failed to delete collection');
  return true;
};

/* ─── Orders ─── */
export const fetchAllOrders = async () => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch orders');
  const data = await response.json();
  return data.data?.orders || [];
};

export const updateOrderStatusAdmin = async (id, status) => {
  const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ orderStatus: status }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to update order status');
  }
  const data = await response.json();
  return data.data?.order;
};

export const deleteOrderAdmin = async (id) => {
  const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) throw new Error('Failed to delete order');
  return true;
};

