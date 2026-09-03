import React, { useState, useMemo } from 'react';
import { Package, Search, Plus, Filter, LayoutGrid, List, Check, AlertCircle, Edit3, Trash2, Archive, Globe } from 'lucide-react';
import { ManagedProduct, School, getPrimaryImageUrl } from '../../types';
import { SCHOOLS } from '../../data/schools';

interface AdminProductsViewProps {
  products: ManagedProduct[];
  activeSchool: School | null;
  onOpenNewProductModal: () => void;
  onOpenEditProductModal: (product: ManagedProduct) => void;
  onPublishProduct: (productId: string, publish: boolean) => void;
  onArchiveProduct: (productId: string) => void;
  onShowToast: (msg: string) => void;
}

export const AdminProductsView: React.FC<AdminProductsViewProps> = ({
  products,
  activeSchool,
  onOpenNewProductModal,
  onOpenEditProductModal,
  onPublishProduct,
  onArchiveProduct,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeSchool && p.schoolId !== activeSchool.id) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        if (!matchName && !matchSku) return false;
      }
      return true;
    });
  }, [products, activeSchool, categoryFilter, statusFilter, searchQuery]);

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-[#171717]">Institutional Uniform Catalogue</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Manage SKU specifications, pricing, sizes, and school assignments.</p>
        </div>
        <button
          onClick={onOpenNewProductModal}
          className="px-4 py-2.5 bg-[#0B0B0B] text-[#C9A227] hover:bg-[#1C1C1C] rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> Add New SKU
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E5E5] flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8F6F0] border border-[#E5E5E5] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[#171717] focus:outline-none focus:border-[#C9A227]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#F8F6F0] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-[#C9A227]"
          >
            <option value="all">All Categories</option>
            <option value="Shirts">Shirts</option>
            <option value="Trousers">Trousers</option>
            <option value="Skirts">Skirts</option>
            <option value="Blazers">Blazers</option>
            <option value="Sports">Sports</option>
            <option value="Accessories">Accessories</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F8F6F0] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 focus:outline-none focus:border-[#C9A227]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <div className="flex items-center bg-[#F8F6F0] p-1 rounded-xl border border-[#E5E5E5]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-white shadow-xs text-black' : 'text-zinc-400'}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-xs text-black' : 'text-zinc-400'}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-[#E5E5E5] text-center text-zinc-400">
          <Package size={40} className="mx-auto mb-3 text-zinc-300" />
          <p className="text-sm font-bold text-zinc-700">No products found</p>
          <p className="text-xs text-zinc-500 mt-1">Add a new SKU or select a different filter.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8F6F0] border-b border-[#E5E5E5] text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-zinc-300 text-[#C9A227] focus:ring-[#C9A227]"
                    />
                  </th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Price / MRP</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredProducts.map((product) => {
                  const imgUrl = getPrimaryImageUrl(product.images);
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <tr key={product.id} className="hover:bg-[#F8F6F0]/40 transition-colors">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(product.id)}
                          className="rounded border-zinc-300 text-[#C9A227] focus:ring-[#C9A227]"
                        />
                      </td>
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img src={imgUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-zinc-200" />
                        <div>
                          <p className="font-bold text-[#171717]">{product.name}</p>
                          <p className="text-[10px] text-zinc-400">{product.schoolName || 'Institutional'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-zinc-600">{product.sku}</td>
                      <td className="py-3 px-4 text-zinc-700 font-medium">{product.category}</td>
                      <td className="py-3 px-4 font-semibold text-[#171717]">{product.totalStock || 0} units</td>
                      <td className="py-3 px-4 font-bold text-[#171717]">
                        ₹{product.price} <span className="text-[10px] text-zinc-400 line-through font-normal">₹{product.mrp}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          product.isPublished !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {product.isPublished !== false ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => onOpenEditProductModal(product)}
                          title="Edit Product"
                          className="p-1.5 bg-[#F8F6F0] hover:bg-[#C9A227] hover:text-white rounded-lg text-zinc-700 transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => onPublishProduct(product.id, product.isPublished === false)}
                          title={product.isPublished !== false ? 'Unpublish' : 'Publish'}
                          className="p-1.5 bg-[#F8F6F0] hover:bg-emerald-600 hover:text-white rounded-lg text-zinc-700 transition-colors"
                        >
                          <Globe size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const imgUrl = getPrimaryImageUrl(product.images);
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-xs flex flex-col">
                <div className="relative h-44 bg-zinc-100">
                  <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-black">
                    {product.totalStock || 0} in stock
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-[#C9A227] uppercase tracking-wider">{product.sku}</p>
                    <h3 className="text-xs font-bold text-[#171717] mt-0.5 line-clamp-1">{product.name}</h3>
                    <p className="text-[11px] font-bold text-[#171717] mt-2">₹{product.price} <span className="text-[10px] text-zinc-400 line-through font-normal">₹{product.mrp}</span></p>
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100">
                    <button
                      onClick={() => onOpenEditProductModal(product)}
                      className="px-3 py-1.5 bg-[#0B0B0B] text-[#C9A227] rounded-lg text-xs font-semibold hover:bg-[#1C1C1C]"
                    >
                      Edit SKU
                    </button>
                    <button
                      onClick={() => onPublishProduct(product.id, product.isPublished === false)}
                      className="text-xs font-semibold text-zinc-600 hover:text-black"
                    >
                      {product.isPublished !== false ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
