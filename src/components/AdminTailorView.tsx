import React, { useState, useEffect, useMemo } from 'react';
import { School, ManagedProduct, ProductInventoryLog, ActiveScreen, Order, UserAccount } from '../types';
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
  updateProductPriceInDb,
  logoutUser,
} from '../services/dbService';
import { ProductFormModal } from './admin/ProductFormModal';
import { StockAdjustmentModal } from './admin/StockAdjustmentModal';
import { InventoryLogsModal } from './admin/InventoryLogsModal';
import { AdminSidebar, AdminTab } from './admin/AdminSidebar';
import { AdminHeader } from './admin/AdminHeader';
import { AdminOverviewView } from './admin/AdminOverviewView';
import { AdminOrdersView } from './admin/AdminOrdersView';
import { AdminProductsView } from './admin/AdminProductsView';
import { AdminInventoryView } from './admin/AdminInventoryView';
import { AdminSchoolsView } from './admin/AdminSchoolsView';
import { AdminProductionView } from './admin/AdminProductionView';
import { AdminCustomersView, AdminExchangesView, AdminReportsView, AdminTeamView, AdminSettingsView } from './admin/AdminExtraViews';

interface AdminTailorViewProps {
  activeSchool: School | null;
  onSelectSchool: (school: School | null) => void;
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
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time Firestore Products & Inventory Logs
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<ProductInventoryLog[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Active Modals State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ManagedProduct | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<ManagedProduct | null>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);

  // Subscribe to live Firestore products
  useEffect(() => {
    setIsLoadingProducts(true);
    const unsubscribe = subscribeToProducts((liveProducts) => {
      setProducts(liveProducts || []);
      setIsLoadingProducts(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to live Firestore inventory logs
  useEffect(() => {
    const unsubscribe = subscribeToInventoryLogs((liveLogs) => {
      setInventoryLogs(liveLogs || []);
    });
    return () => unsubscribe();
  }, []);

  const handlePublish = async (productId: string, publish: boolean) => {
    try {
      await publishProductInDb(productId, publish, user?.email);
      onShowToast(publish ? 'Product published to School Store' : 'Product moved to draft');
    } catch (err) {
      console.error('Publish error:', err);
      onShowToast('Failed to update product publish status.');
    }
  };

  const handleArchive = async (productId: string) => {
    try {
      await archiveProductInDb(productId, user?.email);
      onShowToast('Product archived successfully');
    } catch (err) {
      console.error('Archive error:', err);
      onShowToast('Failed to archive product.');
    }
  };

  const adminName = user?.name || 'Master Tailor';
  const adminEmail = user?.email || 'admin@magnum.com';

  return (
    <div className="flex min-h-screen bg-[#F8F6F0]">
      {/* Permanent Operations Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        adminName={adminName}
        adminEmail={adminEmail}
        onLogout={async () => {
          await logoutUser();
          onNavigate('home');
        }}
        onOpenSupport={() => onShowToast('Magnum Operations Support: support@magnumuniforms.com')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          activeSchool={activeSchool}
          onSelectSchool={onSelectSchool}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          adminName={adminName}
          roleTitle="Master Tailor / Operations"
          onNavigateStore={() => onNavigate('home')}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          {currentTab === 'overview' && (
            <AdminOverviewView
              products={products}
              orders={orders}
              activeSchool={activeSchool}
              onNavigateTab={setCurrentTab}
              onOpenOrder={(order) => setSelectedOrderModal(order)}
            />
          )}

          {currentTab === 'orders' && (
            <AdminOrdersView
              orders={orders}
              activeSchool={activeSchool}
              onUpdateOrderStatus={onUpdateOrderStatus || (() => {})}
              onOpenOrderModal={(order) => setSelectedOrderModal(order)}
              onShowToast={onShowToast}
            />
          )}

          {currentTab === 'products' && (
            <AdminProductsView
              products={products}
              activeSchool={activeSchool}
              onOpenNewProductModal={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              onOpenEditProductModal={(prod) => {
                setEditingProduct(prod);
                setIsProductModalOpen(true);
              }}
              onPublishProduct={handlePublish}
              onArchiveProduct={handleArchive}
              onShowToast={onShowToast}
            />
          )}

          {currentTab === 'inventory' && (
            <AdminInventoryView
              products={products}
              inventoryLogs={inventoryLogs}
              activeSchool={activeSchool}
              onOpenStockModal={(prod) => {
                setAdjustingProduct(prod);
                setIsStockModalOpen(true);
              }}
              onOpenLogsModal={() => setIsLogsModalOpen(true)}
            />
          )}

          {currentTab === 'schools' && (
            <AdminSchoolsView
              onSelectSchoolContext={(school) => {
                onSelectSchool(school);
                setCurrentTab('overview');
                onShowToast(`Active context switched to ${school.name}`);
              }}
            />
          )}

          {currentTab === 'production' && (
            <AdminProductionView
              orders={orders}
              onUpdateOrderStatus={onUpdateOrderStatus || (() => {})}
              onOpenOrderModal={(order) => setSelectedOrderModal(order)}
            />
          )}

          {currentTab === 'customers' && <AdminCustomersView orders={orders} />}
          {currentTab === 'exchanges' && <AdminExchangesView />}
          {currentTab === 'reports' && <AdminReportsView />}
          {currentTab === 'team' && <AdminTeamView />}
          {currentTab === 'settings' && <AdminSettingsView />}
        </main>
      </div>

      {/* Modals */}
      {isProductModalOpen && (
        <ProductFormModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          editingProduct={editingProduct}
          onSave={async (prod) => {
            await saveProductToDb(prod, user?.email);
            setIsProductModalOpen(false);
            onShowToast(`SKU "${prod.name}" saved successfully to Firestore`);
          }}
          onShowToast={onShowToast}
          activeSchool={activeSchool || SCHOOLS[0]}
        />
      )}

      {isStockModalOpen && adjustingProduct && (
        <StockAdjustmentModal
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          product={adjustingProduct}
          onAdjust={async (prodId, size, qty, reason) => {
            await adjustProductStockInDb(prodId, size, qty, reason, user?.email);
            setIsStockModalOpen(false);
            onShowToast('Stock adjusted successfully');
          }}
          onShowToast={onShowToast}
        />
      )}

      {isLogsModalOpen && (
        <InventoryLogsModal
          isOpen={isLogsModalOpen}
          onClose={() => setIsLogsModalOpen(false)}
          logs={inventoryLogs}
        />
      )}
    </div>
  );
};
