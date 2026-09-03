import React, { useState, useEffect, useMemo } from 'react';
import { School, ManagedProduct, ProductInventoryLog, ActiveScreen, Order, UserAccount, getPrimaryImageUrl } from '../types';
import { SCHOOLS } from '../data/schools';
import { UNIFORM_ITEMS } from '../data/products';
import {
  subscribeToProducts,
  saveProductToDb,
  adjustProductStockInDb,
  archiveProductInDb,
  publishProductInDb,
  subscribeToInventoryLogs,
  isMasterAdminEmail,
  uniformItemToManagedProduct,
  updateProductPriceInDb,
} from '../services/dbService';
import { ProductFormModal } from './admin/ProductFormModal';
import { StockAdjustmentModal } from './admin/StockAdjustmentModal';
import { InventoryLogsModal } from './admin/InventoryLogsModal';

interface AdminTailorViewProps {
  activeSchool: School;
  onSelectSchool: (school: School) => void;
  onNavigate: (screen: ActiveScreen) => void;
  onShowToast: (msg: string) => void;
  orders?: Order[];
  onUpdateOrderStatus?: (orderId: string, status: Order['status'], statusText: string, step: number) => void;
  user?: UserAccount;
}

export const AdminTailorView: React.FC<AdminTailorViewProps> = ({
  activeSchool,
  onSelectSchool,
  onNavigate,
  onShowToast,
  orders = [],
  onUpdateOrderStatus,
  user,
}) => {
  const isAdminBadal = Boolean(
    (user?.isLoggedIn && isMasterAdminEmail(user?.email)) || user?.role === 'tailor'
  );

  // Real-time Firestore Products & Inventory Logs
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<ProductInventoryLog[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'out_of_stock' | 'archived'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'stock-asc' | 'stock-desc' | 'price-asc' | 'price-desc' | 'name-asc'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [scopeAllSchools, setScopeAllSchools] = useState(false);

  // Active Modals State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ManagedProduct | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<ManagedProduct | null>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [archivingProduct, setArchivingProduct] = useState<ManagedProduct | null>(null);

  // Quick Inline Price Editing
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [quickPrice, setQuickPrice] = useState<number>(0);
  const [quickMrp, setQuickMrp] = useState<number>(0);
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  const startEditPrice = (item: ManagedProduct, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPriceId(item.id);
    setQuickPrice(item.price);
    setQuickMrp(item.mrp || Math.round(item.price * 1.18));
  };

  const cancelEditPrice = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPriceId(null);
  };

  const saveQuickPrice = async (item: ManagedProduct, e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.stopPropagation();
    if (quickPrice <= 0) {
      onShowToast('Price must be greater than ₹0');
      return;
    }
    setIsSavingPrice(true);
    try {
      const calculatedMrp = quickMrp > quickPrice ? quickMrp : Math.round(quickPrice * 1.18);
      const calculatedDiscount = calculatedMrp > quickPrice ? Math.round(((calculatedMrp - quickPrice) / calculatedMrp) * 100) : 0;

      // Optimistic local update
      setProducts((prev) => {
        const idx = prev.findIndex((p) => p.id === item.id);
        const updated: ManagedProduct = {
          ...item,
          price: quickPrice,
          mrp: calculatedMrp,
          discount: calculatedDiscount,
          updatedAt: new Date().toISOString(),
        };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });

      await updateProductPriceInDb(item.id, quickPrice, calculatedMrp, user?.email);
      onShowToast(`Price for "${item.name}" updated to ₹${quickPrice} (Live synced to School Store)`);
      setEditingPriceId(null);
    } catch (err) {
      console.error('Failed to update price:', err);
      onShowToast('Error updating price. Please try again.');
    } finally {
      setIsSavingPrice(false);
    }
  };

  // Subscribe to live Firestore products
  useEffect(() => {
    setIsLoadingProducts(true);
    const unsubscribe = subscribeToProducts((liveProducts) => {
      setProducts(liveProducts);
      setIsLoadingProducts(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to live Firestore inventory logs
  useEffect(() => {
    const unsubscribe = subscribeToInventoryLogs((liveLogs) => {
      setInventoryLogs(liveLogs);
    });
    return () => unsubscribe();
  }, []);

  // Unified single source of truth:
  // Base catalog UNIFORM_ITEMS are synchronized with real-time Firestore ManagedProduct overrides.
  // This guarantees identical catalog and prices between Tailor Console and School Store!
  const allManagedProducts = useMemo<ManagedProduct[]>(() => {
    const firestoreMap = new Map<string, ManagedProduct>();
    products.forEach((p) => {
      firestoreMap.set(p.id, p);
    });

    const list: ManagedProduct[] = UNIFORM_ITEMS.map((item) => {
      const live = firestoreMap.get(item.id);
      if (live) return live;
      return uniformItemToManagedProduct(item);
    });

    products.forEach((p) => {
      const exists = UNIFORM_ITEMS.some((u) => u.id === p.id);
      if (!exists) {
        list.push(p);
      }
    });

    return list;
  }, [products]);

  // Filter products for active school and selected criteria
  const schoolProducts = useMemo(() => {
    return allManagedProducts.filter((p) => {
      if (scopeAllSchools) return true;
      return p.schoolId === activeSchool.id;
    });
  }, [allManagedProducts, activeSchool.id, scopeAllSchools]);

  const filteredProducts = useMemo(() => {
    return schoolProducts
      .filter((p) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.schoolName && p.schoolName.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q));
          if (!match) return false;
        }

        // Category
        if (categoryFilter !== 'all' && p.category !== categoryFilter) {
          return false;
        }

        // Status
        if (statusFilter !== 'all' && p.status !== statusFilter) {
          return false;
        }

        // Stock
        if (stockFilter === 'in_stock' && (p.totalStock || 0) <= 0) return false;
        if (stockFilter === 'out_of_stock' && (p.totalStock || 0) > 0) return false;
        if (stockFilter === 'low_stock') {
          const hasLowSize = p.sizes?.some((s) => (s.stock || 0) <= (s.lowStockThreshold || 15));
          if (!hasLowSize) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        }
        if (sortBy === 'stock-asc') return (a.totalStock || 0) - (b.totalStock || 0);
        if (sortBy === 'stock-desc') return (b.totalStock || 0) - (a.totalStock || 0);
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [schoolProducts, searchQuery, categoryFilter, statusFilter, stockFilter, sortBy]);

  // Real Metric Calculations strictly derived from Firestore
  const totalSchoolStock = useMemo(() => {
    return schoolProducts.reduce((acc, p) => acc + (p.totalStock || 0), 0);
  }, [schoolProducts]);

  const lowStockCount = useMemo(() => {
    return schoolProducts.filter((p) =>
      p.sizes?.some((s) => (s.stock || 0) <= (s.lowStockThreshold || 15))
    ).length;
  }, [schoolProducts]);

  const schoolOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        scopeAllSchools ||
        (o.school && o.school.toLowerCase().includes((activeSchool.name || '').toLowerCase().split(' ')[0]))
    );
  }, [orders, activeSchool.name, scopeAllSchools]);

  if (!isAdminBadal) {
    return (
      <div className="flex flex-col w-full min-h-[70vh] items-center justify-center px-4 py-12 text-center pb-24">
        <div className="w-16 h-16 rounded-full bg-error-container/40 text-error flex items-center justify-center mb-4 shadow-sm">
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>
        <span className="text-[11px] font-bold tracking-wider uppercase text-outline mb-1">
          Authorized Personnel Only
        </span>
        <h1 className="text-[20px] font-bold text-primary max-w-sm">
          Master Tailor Console Restricted
        </h1>
        <p className="text-[13px] text-on-surface-variant max-w-md mt-2 leading-relaxed">
          Access to institutional tailoring queues, catalogue management, and inventory overrides is strictly restricted to administrator <strong>badal17patell@gmail.com</strong>.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
          <button
            onClick={() => onNavigate('login')}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-[13px] font-bold shadow-xs hover:bg-primary-container transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base text-secondary-fixed">
              login
            </span>
            <span>Sign In as Admin Badal</span>
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="px-5 py-2.5 bg-surface-container text-primary rounded-xl text-[13px] font-bold hover:bg-surface-container-high transition-all cursor-pointer"
          >
            Return to Store
          </button>
        </div>
      </div>
    );
  }

  // Action Handlers
  const handleOpenAddSku = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditSku = (product: ManagedProduct) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleOpenStockAdjust = (product: ManagedProduct) => {
    setAdjustingProduct(product);
    setIsStockModalOpen(true);
  };

  const handleSaveProduct = async (productData: Partial<ManagedProduct>) => {
    await saveProductToDb(productData, user?.email);
  };

  const handleConfirmStockAdjustment = async (size: string, delta: number, reason: string) => {
    if (!adjustingProduct) return;
    await adjustProductStockInDb(
      adjustingProduct.id,
      size,
      delta,
      reason,
      user?.email || 'badal17patell@gmail.com'
    );
  };

  const handleTogglePublish = async (product: ManagedProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPublish = !product.isPublished;
    await publishProductInDb(product.id, newPublish, user?.email);
    onShowToast(
      newPublish
        ? `Published ${product.sku} to live store!`
        : `Unpublished ${product.sku} (moved to draft)`
    );
  };

  const handleQuickDeltaStock = async (product: ManagedProduct, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetSize = product.sizes?.[0]?.size || '32';
    await adjustProductStockInDb(
      product.id,
      targetSize,
      delta,
      'Quick Adjustment',
      user?.email || 'badal17patell@gmail.com'
    );
    onShowToast(`Adjusted ${product.sku} (Size ${targetSize}) by ${delta > 0 ? `+${delta}` : delta}`);
  };

  const handleConfirmArchive = async () => {
    if (!archivingProduct) return;
    await archiveProductInDb(archivingProduct.id, user?.email);
    onShowToast(`Archived product ${archivingProduct.sku}`);
    setArchivingProduct(null);
  };

  const handleExportManifest = () => {
    if (filteredProducts.length === 0) {
      onShowToast('No products to export');
      return;
    }

    const headers = ['SKU', 'School', 'Name', 'Category', 'Price (INR)', 'MRP (INR)', 'Total Stock', 'Status', 'Sizes Breakdown'];
    const rows = filteredProducts.map((p) => {
      const sizesStr = p.sizes?.map((s) => `${s.size}:${s.stock}`).join(' | ') || '';
      return [
        p.sku,
        `"${p.schoolName || activeSchool.name}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        p.category,
        p.price,
        p.mrp,
        p.totalStock,
        p.status,
        `"${sizesStr}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `magnum_catalog_${activeSchool.id}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Exported institutional manifest for ${activeSchool.name} (CSV)`);
  };

  const advanceOrderStatus = (order: Order) => {
    if (!onUpdateOrderStatus) return;

    if (order.status === 'processing') {
      onUpdateOrderStatus(order.id, 'tailoring', 'TAILORING & CRESTING', 2);
      onShowToast(`Order ${order.id} moved to Master Tailor stitching queue`);
    } else if (order.status === 'tailoring') {
      onUpdateOrderStatus(order.id, 'quality-check', 'QUALITY INSPECTION PASSED', 3);
      onShowToast(`Order ${order.id} moved to Quality Inspection`);
    } else if (order.status === 'quality-check') {
      onUpdateOrderStatus(order.id, 'in-transit', 'DISPATCHED VIA BLUEDART', 4);
      onShowToast(`Order ${order.id} dispatched for courier delivery`);
    } else if (order.status === 'in-transit') {
      onUpdateOrderStatus(order.id, 'delivered', 'DELIVERED TO PARENT', 5);
      onShowToast(`Order ${order.id} marked as Delivered`);
    } else {
      onShowToast(`Order ${order.id} is already completed.`);
    }
  };

  return (
    <div className="flex flex-col w-full pb-24">
      {/* Admin Header */}
      <div className="px-4 py-3 bg-primary text-on-primary shadow-md flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('home')}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[16px] font-bold text-white leading-tight">
                Master Tailor Console
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-secondary text-primary text-[10px] font-extrabold tracking-wide uppercase">
                Real-Time DB
              </span>
            </div>
            <span className="text-[11px] text-secondary-fixed">
              Single Source of Truth • Synchronized with Cloud Firestore
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLogsModalOpen(true)}
            className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-[11px] font-bold hover:bg-white/20 transition-colors flex items-center gap-1 cursor-pointer"
            title="View Inventory Audit Trail"
          >
            <span className="material-symbols-outlined text-sm text-secondary-fixed">
              history_edu
            </span>
            <span className="hidden sm:inline">Audit Trail</span>
          </button>

          <button
            onClick={handleExportManifest}
            className="px-3 py-1.5 bg-secondary text-primary rounded-lg text-[11px] font-bold shadow-xs hover:bg-secondary-container transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span className="hidden sm:inline">Export Manifest</span>
          </button>

          <button
            onClick={handleOpenAddSku}
            className="px-3 py-1.5 bg-secondary-fixed text-primary rounded-lg text-[11px] font-extrabold shadow-sm hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Add SKU</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 pt-4 flex flex-col gap-4">
        {/* Active Production Line & School Switcher */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div>
              <span className="text-[10px] text-outline uppercase font-bold block">
                Active Production Line
              </span>
              <span className="text-[15px] font-bold text-primary">
                {activeSchool.name}
              </span>
              <span className="text-[11px] text-on-surface-variant block">
                {activeSchool.board} • {activeSchool.city}, {activeSchool.state}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <label className="text-[11px] font-bold text-outline uppercase">Switch School:</label>
            <select
              value={activeSchool.id}
              onChange={(e) => {
                const s = SCHOOLS.find((sc) => sc.id === e.target.value);
                if (s) onSelectSchool(s);
              }}
              className="h-10 px-3 bg-surface-container-low text-primary text-[12px] font-bold rounded-xl border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
            >
              {SCHOOLS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Real Metric Cards Calculated strictly from Firestore */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-xs border border-surface-container flex flex-col gap-1">
            <span className="text-[11px] text-outline font-semibold">
              Active Catalog SKUs
            </span>
            <span className="text-[22px] font-extrabold text-primary">
              {isLoadingProducts ? '...' : `${schoolProducts.length} SKUs`}
            </span>
            <span className="text-[10px] text-secondary font-bold">
              {schoolProducts.filter((p) => p.status === 'active').length} Published to Store
            </span>
          </div>

          <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-xs border border-surface-container flex flex-col gap-1">
            <span className="text-[11px] text-outline font-semibold">
              In Stock Units
            </span>
            <span className="text-[22px] font-extrabold text-primary">
              {isLoadingProducts ? '...' : `${totalSchoolStock} Units`}
            </span>
            <span className="text-[10px] text-on-surface-variant font-medium">
              Across all size matrices
            </span>
          </div>

          <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-xs border border-surface-container flex flex-col gap-1">
            <span className="text-[11px] text-outline font-semibold">
              Low Stock Alerts
            </span>
            <span
              className={`text-[22px] font-extrabold ${
                lowStockCount > 0 ? 'text-error' : 'text-primary'
              }`}
            >
              {lowStockCount} SKUs
            </span>
            <span className="text-[10px] text-on-surface-variant font-medium">
              Threshold: &le;15 units
            </span>
          </div>

          <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-xs border border-surface-container flex flex-col gap-1">
            <span className="text-[11px] text-outline font-semibold">
              Live DB Orders
            </span>
            <span className="text-[22px] font-extrabold text-primary">
              {schoolOrders.length} Orders
            </span>
            <span className="text-[10px] text-emerald-700 font-bold">
              Real-Time Firestore
            </span>
          </div>
        </div>

        {/* Product Catalog & Inventory Section */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-primary">
                  Uniform Specifications & Live Inventory
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary text-[10px] font-bold">
                  {filteredProducts.length} items
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Manage specifications, prices, sizing matrices, and stock for {activeSchool.name}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setScopeAllSchools(!scopeAllSchools)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  scopeAllSchools
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-primary hover:bg-surface-container-high'
                }`}
              >
                {scopeAllSchools ? 'All Schools View' : 'Current School Only'}
              </button>

              <div className="flex items-center border border-surface-container rounded-xl overflow-hidden bg-surface-container-low p-0.5">
                <button
                  onClick={() => setViewMode('table')}
                  title="List View"
                  className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                    viewMode === 'table'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-outline hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">view_list</span>
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-outline hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">grid_view</span>
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>

              <button
                onClick={handleOpenAddSku}
                className="px-3.5 py-1.5 bg-primary text-on-primary rounded-xl text-[12px] font-bold flex items-center gap-1 shadow-xs hover:bg-primary-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-secondary-fixed">add</span>
                <span>Add SKU</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Search Input */}
            <div className="sm:col-span-5 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by SKU, item name, fabric..."
                className="w-full h-9 pl-9 pr-3 bg-surface-container-low border border-surface-container rounded-xl text-[12px] text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-secondary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-primary"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="sm:col-span-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-9 px-2.5 bg-surface-container-low border border-surface-container rounded-xl text-[12px] text-primary font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="shirts">Shirts</option>
                <option value="trousers">Trousers</option>
                <option value="skirts">Skirts</option>
                <option value="blazers">Blazers</option>
                <option value="sweaters">Sweaters</option>
                <option value="ties">Ties & Belts</option>
                <option value="socks">Socks</option>
                <option value="shoes">Shoes</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full h-9 px-2 bg-surface-container-low border border-surface-container rounded-xl text-[12px] text-primary font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="sm:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-9 px-2 bg-surface-container-low border border-surface-container rounded-xl text-[12px] text-primary font-semibold focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="stock-desc">Stock: High to Low</option>
                <option value="stock-asc">Stock: Low to High</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Product Items List (Table Mode) */}
          {isLoadingProducts ? (
            <div className="py-16 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-3xl animate-spin text-secondary">
                progress_activity
              </span>
              <span className="text-[13px] font-semibold">
                Syncing institutional products from Cloud Firestore...
              </span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-3xl text-outline">
                inventory_2
              </span>
              <span className="text-[13px] font-bold text-primary">
                No matching uniform SKUs found
              </span>
              <p className="text-[11px] text-on-surface-variant max-w-sm">
                Try adjusting your search filter or click &ldquo;Add SKU&rdquo; to create a new uniform specification.
              </p>
              <button
                onClick={handleOpenAddSku}
                className="mt-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-[12px] font-bold cursor-pointer"
              >
                Add SKU for {activeSchool.name}
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 max-h-[700px] overflow-y-auto pr-1">
              {filteredProducts.map((item) => {
                const isLow = item.sizes?.some(
                  (s) => (s.stock || 0) <= (s.lowStockThreshold || 15)
                );
                const isOutOfStock = (item.totalStock || 0) === 0;
                const primaryImage = getPrimaryImageUrl(item.images);

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-surface-container-low rounded-2xl border border-surface-container/70 flex flex-col justify-between gap-2.5 hover:shadow-xs transition-shadow"
                  >
                    <div>
                      {/* Image & Badges */}
                      <div className="aspect-[4/3] rounded-xl bg-surface-container overflow-hidden relative mb-2">
                        <img
                          src={primaryImage}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-surface-container-lowest/90 text-primary shadow-xs">
                            {item.sku}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              item.status === 'active'
                                ? 'bg-emerald-100/90 text-emerald-800'
                                : 'bg-surface-container/90 text-outline'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        {item.badge && (
                          <span className="absolute bottom-0 inset-x-0 bg-primary/85 text-secondary-fixed text-[9px] font-bold text-center py-0.5">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <h4 className="text-[13px] font-bold text-primary line-clamp-2 leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-outline uppercase font-semibold mt-0.5">
                        {item.category} • {item.gender}
                      </p>

                      {/* Price / Quick Price Editor */}
                      {editingPriceId === item.id ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 bg-surface-container p-2 rounded-xl border border-secondary flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-bold text-secondary">Price: ₹</span>
                            <input
                              type="number"
                              value={quickPrice}
                              onChange={(e) => setQuickPrice(Number(e.target.value))}
                              className="w-20 h-6 px-1.5 bg-surface-container-lowest border border-surface-container rounded text-[12px] font-bold text-primary"
                              autoFocus
                            />
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] text-outline">MRP: ₹</span>
                            <input
                              type="number"
                              value={quickMrp}
                              onChange={(e) => setQuickMrp(Number(e.target.value))}
                              className="w-20 h-6 px-1.5 bg-surface-container-lowest border border-surface-container rounded text-[12px] text-outline"
                            />
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <button
                              type="button"
                              onClick={(e) => saveQuickPrice(item, e)}
                              disabled={isSavingPrice}
                              className="flex-1 py-1 bg-primary text-on-primary rounded text-[11px] font-bold text-center cursor-pointer"
                            >
                              {isSavingPrice ? 'Saving...' : 'Save & Sync'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditPrice}
                              className="px-2 py-1 text-outline text-[11px] cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1 mt-2">
                          <button
                            type="button"
                            onClick={(e) => startEditPrice(item, e)}
                            className="flex items-center gap-1 hover:bg-surface-container px-1.5 py-0.5 rounded cursor-pointer"
                            title="Click to edit price"
                          >
                            <span className="text-[14px] font-extrabold text-primary">
                              ₹{item.price}
                            </span>
                            <span className="material-symbols-outlined text-[13px] text-outline">
                              edit
                            </span>
                            {item.mrp > item.price && (
                              <span className="text-[11px] text-outline line-through ml-1">
                                ₹{item.mrp}
                              </span>
                            )}
                          </button>
                          <span
                            className={`text-[11px] font-bold ${
                              isOutOfStock
                                ? 'text-error'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-primary'
                            }`}
                          >
                            {item.totalStock} left
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-1 pt-2 border-t border-surface-container/60">
                      <button
                        type="button"
                        onClick={(e) => startEditPrice(item, e)}
                        className="flex-1 py-1 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs text-secondary">payments</span>
                        <span>Price</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenStockAdjust(item)}
                        className="flex-1 py-1 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">tune</span>
                        <span>Stock</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditSku(item)}
                        className="flex-1 py-1 bg-primary text-on-primary hover:bg-primary-container rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs text-secondary-fixed">edit</span>
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-3 divide-y divide-surface-container/70 max-h-[650px] overflow-y-auto pr-1">
              {filteredProducts.map((item) => {
                const isLow = item.sizes?.some(
                  (s) => (s.stock || 0) <= (s.lowStockThreshold || 15)
                );
                const isOutOfStock = (item.totalStock || 0) === 0;
                const primaryImage = getPrimaryImageUrl(item.images);

                return (
                  <div key={item.id} className="pt-3 first:pt-0 flex flex-col gap-2.5">
                    {/* Main Row Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Thumbnail */}
                        <div className="w-14 h-16 rounded-xl bg-surface-container overflow-hidden shrink-0 border border-surface-container relative group">
                          <img
                            src={primaryImage}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {item.badge && (
                            <span className="absolute bottom-0 inset-x-0 bg-primary/80 text-secondary-fixed text-[8px] font-bold text-center py-0.5 truncate px-0.5">
                              {item.badge}
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-surface-container text-primary">
                              {item.sku}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                item.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'draft'
                                  ? 'bg-amber-100 text-amber-800'
                                  : item.status === 'out_of_stock'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-surface-container text-outline'
                              }`}
                            >
                              {item.status}
                            </span>
                            <span className="text-[10px] text-outline font-semibold uppercase">
                              {item.category} • {item.gender}
                            </span>
                          </div>

                          <h3 className="text-[14px] font-bold text-primary leading-tight truncate mt-1">
                            {item.name}
                          </h3>

                          {/* Price Display / Quick Inline Price Editor */}
                          {editingPriceId === item.id ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 mt-1.5 bg-surface-container-high/80 p-2 rounded-xl border border-secondary shadow-sm flex-wrap"
                            >
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] font-bold text-secondary">Price: ₹</span>
                                <input
                                  type="number"
                                  value={quickPrice}
                                  onChange={(e) => setQuickPrice(Number(e.target.value))}
                                  className="w-18 h-7 px-2 bg-surface-container-lowest border border-surface-container rounded-lg text-[12px] font-bold text-primary focus:outline-none focus:ring-1 focus:ring-secondary"
                                  placeholder="Price"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveQuickPrice(item, e);
                                    if (e.key === 'Escape') cancelEditPrice(e as any);
                                  }}
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-outline font-semibold">MRP: ₹</span>
                                <input
                                  type="number"
                                  value={quickMrp}
                                  onChange={(e) => setQuickMrp(Number(e.target.value))}
                                  className="w-18 h-7 px-2 bg-surface-container-lowest border border-surface-container rounded-lg text-[12px] font-medium text-outline focus:outline-none focus:ring-1 focus:ring-secondary"
                                  placeholder="MRP"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveQuickPrice(item, e);
                                    if (e.key === 'Escape') cancelEditPrice(e as any);
                                  }}
                                />
                              </div>

                              <div className="flex items-center gap-1 ml-auto">
                                <button
                                  type="button"
                                  onClick={(e) => saveQuickPrice(item, e)}
                                  disabled={isSavingPrice}
                                  title="Save price & live sync with school store"
                                  className="px-2.5 py-1 bg-primary text-on-primary rounded-lg text-[11px] font-bold hover:bg-primary-container flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                  {isSavingPrice ? (
                                    <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                                  ) : (
                                    <span className="material-symbols-outlined text-xs text-secondary-fixed">check</span>
                                  )}
                                  <span>Save</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditPrice}
                                  title="Cancel edit"
                                  className="px-2 py-1 text-outline hover:text-primary rounded-lg text-[11px] font-semibold cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-0.5">
                              <button
                                type="button"
                                onClick={(e) => startEditPrice(item, e)}
                                title="Click to instantly edit retail price & sync"
                                className="group/price flex items-center gap-1 bg-surface-container/60 hover:bg-surface-container px-2 py-0.5 rounded-lg border border-transparent hover:border-surface-container transition-all cursor-pointer"
                              >
                                <span className="text-[13px] font-extrabold text-primary group-hover/price:text-secondary transition-colors">
                                  ₹{item.price}
                                </span>
                                <span className="material-symbols-outlined text-[13px] text-outline group-hover/price:text-secondary opacity-70 group-hover/price:opacity-100 transition-all">
                                  edit
                                </span>
                              </button>
                              {item.mrp > item.price && (
                                <span className="text-[11px] text-outline line-through">
                                  ₹{item.mrp}
                                </span>
                              )}
                              <span className="text-[11px] text-on-surface-variant truncate">
                                • {item.fabricBlend || 'Cotton Blend'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stock Badge & Main Actions */}
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[13px] font-extrabold ${
                              isOutOfStock
                                ? 'text-error'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-primary'
                            }`}
                          >
                            {item.totalStock} in stock
                          </span>
                        </div>

                        <div className="flex items-center gap-1 pt-1">
                          {/* Quick Price action button */}
                          <button
                            type="button"
                            onClick={(e) => startEditPrice(item, e)}
                            title="Quick Edit Price & Sync to Store"
                            className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-xs text-secondary">payments</span>
                            <span>Price</span>
                          </button>

                          {/* Publish toggle */}
                          <button
                            onClick={(e) => handleTogglePublish(item, e)}
                            title={item.isPublished ? 'Unpublish to Draft' : 'Publish to Store'}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              item.isPublished
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-surface-container text-outline hover:text-primary'
                            }`}
                          >
                            {item.isPublished ? 'Published' : 'Draft'}
                          </button>

                          {/* Quick Adjust modal trigger */}
                          <button
                            onClick={() => handleOpenStockAdjust(item)}
                            className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-xs">tune</span>
                            <span>Stock</span>
                          </button>

                          {/* Edit SKU */}
                          <button
                            onClick={() => handleOpenEditSku(item)}
                            className="px-2.5 py-1 bg-primary text-on-primary hover:bg-primary-container rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-xs text-secondary-fixed">edit</span>
                            <span>Edit</span>
                          </button>

                          {/* Archive */}
                          <button
                            onClick={() => setArchivingProduct(item)}
                            title="Archive Product"
                            className="p-1 text-outline hover:text-error rounded-lg transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">archive</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sizing Matrix Pill Breakdown */}
                    <div className="bg-surface-container-low/70 px-3 py-2 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-outline uppercase font-bold mr-1">
                          Sizes:
                        </span>
                        {item.sizes?.map((sz) => {
                          const isSizeLow = (sz.stock || 0) <= (sz.lowStockThreshold || 15);
                          return (
                            <span
                              key={sz.size}
                              className={`px-2 py-0.5 rounded font-mono font-bold ${
                                sz.stock === 0
                                  ? 'bg-error-container/30 text-error'
                                  : isSizeLow
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-surface-container-lowest text-primary border border-surface-container'
                              }`}
                              title={`Size ${sz.size}: ${sz.stock} units available (Alert at ${sz.lowStockThreshold || 15})`}
                            >
                              {sz.size}: {sz.stock}
                            </span>
                          );
                        })}
                      </div>

                      {/* Quick Stepper on Primary Size */}
                      <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                        <span className="text-[10px] text-outline font-semibold">
                          Quick:
                        </span>
                        <button
                          onClick={(e) => handleQuickDeltaStock(item, -10, e)}
                          className="px-2 py-0.5 bg-surface-container rounded text-primary text-[10px] font-bold hover:bg-surface-container-high cursor-pointer"
                        >
                          -10
                        </button>
                        <button
                          onClick={(e) => handleQuickDeltaStock(item, 25, e)}
                          className="px-2 py-0.5 bg-primary text-on-primary rounded text-[10px] font-bold hover:bg-primary-container cursor-pointer"
                        >
                          +25
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Firestore Order Queue & Progression */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-primary">
                  Live Institutional Orders (Cloud Database)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Advance orders placed by parents in real-time
              </p>
            </div>
            <span className="text-[11px] text-on-surface-variant">
              {schoolOrders.length} orders
            </span>
          </div>

          <div className="space-y-2.5">
            {schoolOrders.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-[12px]">
                No institutional orders found for this school queue.
              </div>
            ) : (
              schoolOrders.slice(0, 8).map((order) => {
                return (
                  <div
                    key={order.id}
                    className="p-3 rounded-xl bg-surface-container-low border border-surface-container/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-primary font-mono">
                          {order.id}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-primary text-secondary-fixed">
                          {order.status}
                        </span>
                        <span className="text-[11px] text-outline">
                          {order.date}
                        </span>
                      </div>
                      <span className="text-[12px] font-semibold text-primary block mt-0.5">
                        {order.studentName} ({order.studentGrade || 'Enrolled Student'}) • ₹{order.total || order.totalAmount}
                      </span>
                      <span className="text-[11px] text-on-surface-variant block">
                        {order.items?.map((it) => `${it.name} (Size ${it.size}) × ${it.qty || 1}`).join(', ') || 'Custom Uniform Kit'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => advanceOrderStatus(order)}
                        className="px-2.5 py-1.5 bg-primary text-on-primary rounded-lg text-[11px] font-bold hover:bg-primary-container transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs text-secondary-fixed">sync</span>
                        <span>Advance Stage</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={editingProduct}
        activeSchool={activeSchool}
        onSave={handleSaveProduct}
        onShowToast={onShowToast}
        userEmail={user?.email}
      />

      {/* MODAL 2: STOCK ADJUSTMENT */}
      <StockAdjustmentModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={adjustingProduct}
        onConfirm={handleConfirmStockAdjustment}
        onShowToast={onShowToast}
      />

      {/* MODAL 3: INVENTORY AUDIT LOGS */}
      <InventoryLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        logs={inventoryLogs}
        onShowToast={onShowToast}
      />

      {/* MODAL 4: ARCHIVE CONFIRMATION */}
      {archivingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-surface-container text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-error-container/30 text-error flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">archive</span>
            </div>
            <h3 className="text-[15px] font-bold text-primary">
              Archive SKU {archivingProduct.sku}?
            </h3>
            <p className="text-[12px] text-on-surface-variant mt-1.5 leading-relaxed">
              This will hide <strong>{archivingProduct.name}</strong> from the customer store. Historical orders referencing this SKU remain preserved.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setArchivingProduct(null)}
                className="flex-1 py-2 bg-surface-container text-primary rounded-xl text-[12px] font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmArchive}
                className="flex-1 py-2 bg-error text-white rounded-xl text-[12px] font-bold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
