import React, { useState, useEffect } from 'react';
import { uploadImage, createProduct, updateProduct } from '../services/api';

const CATEGORIES = ['GRS', 'OPEN', 'CORD SET', 'GRS CAP', 'JKT', 'DORI', 'GRS RN', 'GIFT SET', 'U CHOICE'];
const MAX_IMAGE_KB = 300;
const MAX_IMAGES = 3;

const defaultVariant = () => ({ size: '', price: '', originalPrice: '', quantity: '' });

export default function AddProductModal({ isOpen, onClose, onProductAdded, productToEdit, categories = [] }) {
  const [formData, setFormData] = useState({
    category: 'GRS',
    newCategory: '',
    name: '',
    description: '',
    images: [],
    image: '',
  });

  const [variants, setVariants] = useState([ defaultVariant() ]);

  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        const editImages = productToEdit.images && productToEdit.images.length > 0 
          ? productToEdit.images 
          : (productToEdit.image ? [productToEdit.image] : []);
        setFormData({
          category: productToEdit.category || 'GRS',
          newCategory: '',
          name: productToEdit.name || '',
          description: productToEdit.description || '',
          images: editImages,
          image: editImages[0] || '',
        });
        setImagePreviews(editImages);
        
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
        setFormData({ category: 'GRS', newCategory: '', name: '', description: '', images: [], image: '' });
        setVariants([ defaultVariant() ]);
        setImagePreviews([]);
      }
      setError(null);
      setUploadError(null);
      setPreviewIndex(null);
    }
  }, [isOpen, productToEdit]);

  // Keyboard navigation for image preview
  useEffect(() => {
    if (previewIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPreviewIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setPreviewIndex((prev) => (prev > 0 ? prev - 1 : imagePreviews.length - 1));
      } else if (e.key === 'ArrowRight') {
        setPreviewIndex((prev) => (prev < imagePreviews.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewIndex, imagePreviews.length]);

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

  /* ─── Image Upload (3 images, 300KB each) ─── */
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Check total count
    if (imagePreviews.length + files.length > MAX_IMAGES) {
      setUploadError(`Maximum ${MAX_IMAGES} images allowed. You already have ${imagePreviews.length}.`);
      e.target.value = '';
      return;
    }

    // Check size for each file
    for (const file of files) {
      if (file.size > MAX_IMAGE_KB * 1024) {
        setUploadError(`Each image must be less than ${MAX_IMAGE_KB} KB. "${file.name}" is ${(file.size / 1024).toFixed(0)} KB.`);
        e.target.value = '';
        return;
      }
    }

    setUploadError(null);

    try {
      setUploading(true);
      const newPreviews = [...imagePreviews];

      for (const file of files) {
        const imageUrl = await uploadImage(file);
        newPreviews.push(imageUrl);
      }

      setImagePreviews(newPreviews);
      setFormData(prev => ({ 
        ...prev, 
        images: newPreviews,
        image: newPreviews[0] || prev.image
      }));
      e.target.value = '';
    } catch (err) {
      setUploadError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  /* ─── Remove Image ─── */
  const removeImage = (index) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);
    setFormData(prev => ({
      ...prev,
      images: newPreviews,
      image: newPreviews[0] || ''
    }));
    if (previewIndex !== null) {
      if (newPreviews.length === 0) {
        setPreviewIndex(null);
      } else if (previewIndex >= newPreviews.length) {
        setPreviewIndex(newPreviews.length - 1);
      }
    }
  };

  /* ─── Set Image as Primary (Main) ─── */
  const setAsPrimary = (index) => {
    if (index === 0 || index >= imagePreviews.length) return;
    const newPreviews = [...imagePreviews];
    const [selected] = newPreviews.splice(index, 1);
    newPreviews.unshift(selected);
    setImagePreviews(newPreviews);
    setFormData(prev => ({
      ...prev,
      images: newPreviews,
      image: newPreviews[0] || ''
    }));
    if (previewIndex !== null) {
      setPreviewIndex(0);
    }
  };

  /* ─── Submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) { setError('Product name is required.'); return; }
    if (imagePreviews.length === 0) { setError('Please upload at least one product image.'); return; }
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
        images: imagePreviews,
        image: imagePreviews[0] || '',
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
    <>
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

            {/* 6. Image Upload — 3 images max, 300KB each */}
            <div>
              <label className={lbl}>Product Images * <span className="font-normal text-gray-400">(max {MAX_IMAGES} images · {MAX_IMAGE_KB}KB each · JPG/JPEG/PNG)</span></label>

              {/* Image Preview Grid */}
              {imagePreviews.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-3 gap-3">
                    {imagePreviews.map((preview, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border-2 border-gray-200 hover:border-cyan-400 transition-all shadow-sm bg-gray-50 aspect-video sm:aspect-square flex items-center justify-center cursor-pointer"
                        onClick={() => setPreviewIndex(idx)}
                      >
                        <img
                          src={preview}
                          alt={`preview-${idx}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        
                        {/* Hover Overlay with Preview Icon */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                          <div className="bg-white/95 text-gray-900 px-2.5 py-1 rounded-full text-xs font-bold shadow flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview
                          </div>
                        </div>

                        {/* Top Action Row: Primary Badge + Delete Button */}
                        <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none z-10">
                          {idx === 0 ? (
                            <div className="bg-cyan-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold shadow">
                              Primary
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAsPrimary(idx);
                              }}
                              className="pointer-events-auto opacity-0 group-hover:opacity-100 bg-gray-900/80 hover:bg-cyan-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md transition shadow"
                              title="Set as main image"
                            >
                              Make Main
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(idx);
                            }}
                            className="pointer-events-auto bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center transition text-sm font-bold shadow hover:scale-110 ml-auto"
                            title="Remove image"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Bottom Image Index Badge */}
                        <div className="absolute bottom-2 right-2 bg-gray-900/80 text-white text-[11px] px-2 py-0.5 rounded font-semibold pointer-events-none z-10">
                          {idx + 1}/{imagePreviews.length}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                    <span className="text-cyan-600 font-bold">💡 Tip:</span> Click on any image thumbnail to view in full size preview
                  </p>
                </div>
              )}

              {/* Upload Area - only show if less than 3 images */}
              {imagePreviews.length < MAX_IMAGES && (
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition ${
                  uploading ? 'border-cyan-400 bg-cyan-50' : 'border-gray-300 hover:border-cyan-400 hover:bg-cyan-50'
                }`}>
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-cyan-600 font-medium">Uploading…</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">Click to add image ({imagePreviews.length}/{MAX_IMAGES})</span>
                      <span className="text-xs">Max {MAX_IMAGE_KB} KB per image</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png" 
                    onChange={handleImageUpload}
                    multiple
                    disabled={uploading || imagePreviews.length >= MAX_IMAGES}
                    className="hidden" 
                  />
                </label>
              )}

              {uploadError && (
                <p className="text-sm text-red-600 font-semibold mt-2 px-1 text-center bg-red-50 rounded py-1">{uploadError}</p>
              )}

              {imagePreviews.length > 0 && !uploading && !uploadError && (
                <p className="text-xs text-green-600 font-semibold mt-2">✓ {imagePreviews.length} image{imagePreviews.length > 1 ? 's' : ''} uploaded</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button type="submit" disabled={loading || uploading}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2.5 px-4 rounded-xl disabled:opacity-50 transition">
                {loading ? 'Saving Product…' : (productToEdit ? 'Update Product' : 'Create Product')}
              </button>
              <button type="button" onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Full-Screen Image Preview Lightbox Modal ── */}
      {previewIndex !== null && imagePreviews[previewIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 select-none"
          onClick={() => setPreviewIndex(null)}
        >
          {/* Top Bar */}
          <div
            className="absolute top-0 left-0 right-0 p-4 sm:px-8 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-base sm:text-lg">
                Product Image Preview
              </span>
              <span className="bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                Image {previewIndex + 1} of {imagePreviews.length}
              </span>
              {previewIndex === 0 && (
                <span className="bg-amber-500/20 border border-amber-400 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-semibold hidden sm:inline-block">
                  ⭐ Primary Image
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {previewIndex !== 0 && (
                <button
                  type="button"
                  onClick={() => setAsPrimary(previewIndex)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1 shadow"
                >
                  ⭐ Make Main
                </button>
              )}
              <button
                type="button"
                onClick={() => setPreviewIndex(null)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white font-bold text-xl flex items-center justify-center transition"
                title="Close preview (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Main Enlarged Image Stage */}
          <div
            className="relative max-w-4xl w-full max-h-[72vh] flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Arrow */}
            {imagePreviews.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setPreviewIndex((prev) => (prev > 0 ? prev - 1 : imagePreviews.length - 1))
                }
                className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-cyan-600 border border-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center text-3xl font-bold transition shadow-2xl z-10"
                title="Previous image (← Arrow key)"
              >
                ‹
              </button>
            )}

            {/* Active Image */}
            <img
              src={imagePreviews[previewIndex]}
              alt={`Full Preview ${previewIndex + 1}`}
              className="max-h-[68vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 bg-black/40 transition-all duration-200"
            />

            {/* Next Arrow */}
            {imagePreviews.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setPreviewIndex((prev) => (prev < imagePreviews.length - 1 ? prev + 1 : 0))
                }
                className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-cyan-600 border border-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center text-3xl font-bold transition shadow-2xl z-10"
                title="Next image (→ Arrow key)"
              >
                ›
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          {imagePreviews.length > 1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 p-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {imagePreviews.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPreviewIndex(i)}
                  className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
                    i === previewIndex
                      ? 'ring-2 ring-cyan-400 scale-110 shadow-lg opacity-100'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt={`thumb-${i}`} className="w-12 h-12 object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-cyan-600 text-[8px] text-white text-center font-bold">
                      Main
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

