import React, { useState, useEffect } from 'react';
import { uploadImage, createProduct, updateProduct } from '../services/api';

const CATEGORIES = ['GRS', 'OPEN', 'CORD SET', 'GRS CAP', 'JKT', 'DORI', 'GRS RN', 'GIFT SET', 'U CHOICE'];
const MAX_IMAGE_KB = 300;

const defaultVariant = () => ({ size: '', price: '', originalPrice: '', quantity: '' });

export default function AddProductModal({ isOpen, onClose, onProductAdded, productToEdit, categories = [] }) {
  const [formData, setFormData] = useState({
    category: 'GRS',
    newCategory: '',
    name: '',
    description: '',
    image: '',
  });

  const [variants, setVariants] = useState([ defaultVariant() ]);

  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setFormData({
          category: productToEdit.category || 'GRS',
          newCategory: '',
          name: productToEdit.name || '',
          description: productToEdit.description || '',
          image: productToEdit.image || '',
        });
        setImagePreview(productToEdit.image || null);
        
        if (productToEdit.variants && productToEdit.variants.length > 0) {
          const mappedVars = productToEdit.variants.map(v => ({
            size: v.size,
            price: v.price.toString(),
            originalPrice: v.originalPrice?.toString() || '',
            quantity: v.quantity !== undefined ? v.quantity.toString() : '0',
          }));
          setVariants(mappedVars);
        }
      } else {
        // Reset to default
        setFormData({ category: 'GRS', newCategory: '', name: '', description: '', image: '' });
        setVariants([ defaultVariant() ]);
        setImagePreview(null);
      }
      setError(null);
      setUploadError(null);
    }
  }, [isOpen, productToEdit]);

  /* ─── Helpers ─── */
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    if (field === 'size') {
      updated[index][field] = value;
    } else {
      updated[index][field] = Number(value) || '';
    }
    setVariants(updated);
  };

  const addVariantRow = () => setVariants(prev => [...prev, defaultVariant()]);

  const removeVariantRow = (index) =>
    setVariants(prev => prev.filter((_, i) => i !== index));

  /* ─── Image Upload (size: 150KB - 300KB) ─── */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Size check
    if (file.size > MAX_IMAGE_KB * 1024) {
      setUploadError(`Image must be less than ${MAX_IMAGE_KB} KB. Your file is ${(file.size / 1024).toFixed(0)} KB.`);
      e.target.value = '';
      return;
    }

    setUploadError(null);
    setImagePreview(URL.createObjectURL(file));

    try {
      setUploading(true);
      const imageUrl = await uploadImage(file);
      setFormData(prev => ({ ...prev, image: imageUrl }));
    } catch (err) {
      setUploadError(err.message || 'Image upload failed. Please try again.');
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  /* ─── Submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) { setError('Product name is required.'); return; }
    if (!formData.image) { setError('Please upload a product image.'); return; }
    if (!formData.description.trim()) { setError('Description is required.'); return; }

    let finalCategory = formData.category;
    if (formData.category === 'ADD_NEW') {
      if (!formData.newCategory?.trim()) { setError('Please enter a name for the new category.'); return; }
      finalCategory = formData.newCategory.trim().toUpperCase();
    }

    const filledVariants = variants.filter(v => v.size && v.price);
    if (filledVariants.length === 0) {
      setError('Please add at least one variant with Size and Price.');
      return;
    }

    try {
      setLoading(true);

      // Auto-calculate price range from filled variants
      const prices = filledVariants.map(v => Number(v.price)).filter(p => p > 0);
      const minP = Math.min(...prices);
      const maxP = Math.max(...prices);
      const volumePricing = prices.length > 0
        ? (minP === maxP ? `₹${minP}` : `₹${minP} - ₹${maxP}`)
        : '';

      const payload = {
        ...formData,
        category: finalCategory,
        volumePricing,
        variants: filledVariants.map(v => ({
          size: v.size,
          price: Number(v.price),
          originalPrice: Number(v.originalPrice) || 0,
          quantity: Number(v.quantity) || 0,
        })),
      };

      if (productToEdit) {
        await updateProduct(productToEdit._id, payload);
      } else {
        await createProduct(payload);
      }
      onProductAdded();
      onClose(); // Just close, effect will reset on next open
    } catch (err) {
      setError(err.message || `Failed to ${productToEdit ? 'update' : 'create'} product. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  /* ─── Shared input class ─── */
  const inp = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm outline-none';
  const lbl = 'block text-sm font-semibold text-gray-700 mb-1.5';

  const allCategories = Array.from(new Set([
    ...CATEGORIES, 
    ...categories,
    ...(productToEdit?.category ? [productToEdit.category] : [])
  ]));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900">{productToEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* 1. Category */}
          <div>
            <label className={lbl}>Category *</label>
            <select name="category" value={formData.category} onChange={handleFormChange} className={inp}>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="ADD_NEW" className="font-bold text-cyan-600">+ Add New Category</option>
            </select>
            {formData.category === 'ADD_NEW' && (
              <div className="mt-2">
                <input 
                  type="text" 
                  name="newCategory" 
                  value={formData.newCategory} 
                  onChange={handleFormChange} 
                  placeholder="Enter new category name..." 
                  className={inp} 
                />
              </div>
            )}
          </div>

          {/* 2. Product Name */}
          <div>
            <label className={lbl}>Product Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleFormChange}
              placeholder="e.g., Kids Printed T-Shirt Set" className={inp} />
          </div>

          {/* 3. Description */}
          <div>
            <label className={lbl}>Description *</label>
            <textarea name="description" value={formData.description} onChange={handleFormChange}
              placeholder="Product description..." rows="3" className={inp + ' resize-none'} />
          </div>

          {/* 5. Variants: Size | Price | Original Price | In Stock dropdown */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className={lbl + ' mb-0'}>Variants (Size, Price, Stock Qty) *</label>
              <button type="button" onClick={addVariantRow}
                className="text-xs font-bold text-cyan-600 hover:text-cyan-800 border border-cyan-300 px-3 py-1 rounded-full hover:bg-cyan-50 transition">
                + Add Size
              </button>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-9 gap-2 mb-1 px-1">
              <span className="col-span-4 text-xs font-bold text-gray-500 uppercase">Size</span>
              <span className="col-span-3 text-xs font-bold text-gray-500 uppercase">Price (₹)</span>
              <span className="col-span-2 text-xs font-bold text-gray-500 uppercase">Stock</span>
            </div>

            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-9 gap-2 items-center">
                  <div className="col-span-4">
                    <input type="text" value={v.size}
                      onChange={e => handleVariantChange(i, 'size', e.target.value)}
                      placeholder="e.g. M" className={inp} />
                  </div>
                  <div className="col-span-3">
                    <input type="number" value={v.price} min="0"
                      onChange={e => handleVariantChange(i, 'price', e.target.value)}
                      placeholder="₹ Price" className={inp} />
                  </div>
                  <div className="col-span-2 relative flex items-center gap-2">
                    <input type="number" value={v.quantity} min="0"
                      onChange={e => handleVariantChange(i, 'quantity', e.target.value)}
                      placeholder="Qty" className={inp} />
                    {variants.length > 1 && (
                      <button type="button" onClick={() => removeVariantRow(i)}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition" title="Remove">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Image Upload — size: 150KB - 300KB, JPG/JPEG/PNG only */}
          <div>
            <label className={lbl}>Product Image * <span className="font-normal text-gray-400">(size: 150KB - 300KB · JPG / JPEG / PNG)</span></label>

            <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition ${
              uploading ? 'border-cyan-400 bg-cyan-50' : 'border-gray-300 hover:border-cyan-400 hover:bg-cyan-50'
            }`}>
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-cyan-600 font-medium">Uploading…</span>
                </div>
              ) : imagePreview ? (
                <img src={imagePreview} alt="preview" className="h-full w-full object-contain p-2 rounded-xl" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Click to upload image</span>
                  <span className="text-xs">Max size: {MAX_IMAGE_KB} KB</span>
                </div>
              )}
              <input type="file" accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png" onChange={handleImageUpload}
                disabled={uploading} className="hidden" />
            </label>

            {uploadError && (
              <p className="text-sm text-red-600 font-semibold mt-2 px-1 text-center bg-red-50 rounded py-1">{uploadError}</p>
            )}

            {formData.image && !uploading && !uploadError && (
              <p className="text-xs text-green-600 font-semibold mt-1">✓ Image uploaded successfully</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="submit" disabled={loading || uploading}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2.5 px-4 rounded-xl disabled:opacity-50 transition">
              {loading ? 'Creating Product…' : 'Create Product'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
