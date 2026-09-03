import React, { useState } from 'react';
import { School, UniformItem, ActiveScreen, Order } from '../types';
import { UNIFORM_ITEMS } from '../data/products';
import { SCHOOLS } from '../data/schools';

interface AdminTailorViewProps {
  activeSchool: School;
  onSelectSchool: (school: School) => void;
  onNavigate: (screen: ActiveScreen) => void;
  onShowToast: (msg: string) => void;
  orders?: Order[];
  onUpdateOrderStatus?: (orderId: string, status: Order['status'], statusText: string, step: number) => void;
}

export const AdminTailorView: React.FC<AdminTailorViewProps> = ({
  activeSchool,
  onSelectSchool,
  onNavigate,
  onShowToast,
  orders = [],
  onUpdateOrderStatus,
}) => {
  const [items] = useState<UniformItem[]>(UNIFORM_ITEMS);
  const [stockCounts, setStockCounts] = useState<Record<string, number>>({
    'dps-shirt-boys': 142,
    'dps-skirt-girls': 88,
    'dps-trousers-navy': 64,
    'dps-blazer-crest': 29,
    'dps-tie-belt-combo': 210,
    'dps-tracksuit-set': 45,
    'dps-oxford-grey-trousers': 73,
    'dps-ganges-tracksuit': 38,
  });

  const handleUpdateStock = (itemId: string, delta: number) => {
    setStockCounts((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 50) + delta),
    }));
    onShowToast(`Stock adjusted for ${itemId}`);
  };

  const handleExportManifest = () => {
    onShowToast(`Exported institutional uniform manifest for ${activeSchool.name} (CSV/PDF)`);
  };

  const advanceOrderStatus = (order: Order) => {
    if (!onUpdateOrderStatus) return;

    if (order.status === 'processing') {
      onUpdateOrderStatus(order.id, 'tailoring', 'TAILORING & CRESTING', 2);
      onShowToast(`Order ${order.id} sent to Master Tailor stitching queue`);
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
      <div className="px-4 py-3 bg-primary text-on-primary shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('home')}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
          </button>
          <div>
            <h1 className="text-[16px] font-bold text-white leading-tight">
              Master Tailor Console
            </h1>
            <span className="text-[11px] text-secondary-fixed">
              Magnum Institutional Production & Inventory Hub
            </span>
          </div>
        </div>

        <button
          onClick={handleExportManifest}
          className="px-3 py-1.5 bg-secondary text-primary rounded-lg text-[11px] font-bold shadow-xs hover:bg-secondary-container transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          <span>Export Manifest</span>
        </button>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 pt-4 flex flex-col gap-4">
        {/* Institutional Switcher & Status */}
        <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-xs border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">
              store
            </span>
            <div>
              <span className="text-[10px] text-outline uppercase font-bold block">
                Active Production Line
              </span>
              <span className="text-[14px] font-bold text-primary">
                {activeSchool.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activeSchool.id}
              onChange={(e) => {
                const s = SCHOOLS.find((sc) => sc.id === e.target.value);
                if (s) onSelectSchool(s);
              }}
              className="h-9 px-2.5 bg-surface-container-low text-primary text-[12px] font-bold rounded-lg focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
            >
              {SCHOOLS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Production Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-surface-container-lowest p-3 rounded-xl shadow-xs border border-surface-container flex flex-col gap-1">
            <span className="text-[11px] text-outline font-semibold">
              Active Catalog SKUs
            </span>
            <span className="text-[20px] font-extrabold text-primary">
              {items.length} SKUs
            </span>
            <span className="text-[10px] text-secondary font-bold">
              100% Pattern Approved
            </span>
          </div>

          <div className="bg-surface-container-lowest p-3 rounded-xl shadow-xs border border-surface-container flex flex-col gap-1">
            <span className="text-[11px] text-outline font-semibold">
              In Stock Units
            </span>
            <span className="text-[20px] font-extrabold text-primary">
              {Object.values(stockCounts).reduce((a: number, b: number) => a + b, 0)} Units
            </span>
            <span className="text-[10px] text-on-surface-variant font-medium">
              Central Tailoring Depot
            </span>
          </div>

          <div className="bg-surface-container-lowest p-3 rounded-xl shadow-xs border border-surface-container flex flex-col gap-1">
            <span className="text-[11px] text-outline font-semibold">
              Live DB Orders
            </span>
            <span className="text-[20px] font-extrabold text-primary">
              {orders.length}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold">
              Synced to Firestore
            </span>
          </div>

          <div className="bg-surface-container-lowest p-3 rounded-xl shadow-xs border border-surface-container flex flex-col gap-1">
            <span className="text-[11px] text-outline font-semibold">
              Fulfillment Status
            </span>
            <span className="text-[20px] font-extrabold text-primary">
              {orders.filter((o) => o.status !== 'delivered').length} Active
            </span>
            <span className="text-[10px] text-secondary font-bold">
              On Schedule
            </span>
          </div>
        </div>

        {/* Live Firestore Order Queue & Progression */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-primary">
                Live Institutional Orders (Cloud Database)
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Advance real-time order stages stored in Firestore
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Real-Time Sync Active
            </span>
          </div>

          <div className="space-y-2.5">
            {orders.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant text-[12px]">
                No institutional orders found in Firestore yet.
              </div>
            ) : (
              orders.slice(0, 6).map((order) => {
                return (
                  <div
                    key={order.id}
                    className="p-3 rounded-xl bg-surface-container-low border border-surface-container/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-primary">
                          {order.id}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-primary text-secondary-fixed">
                          {order.status}
                        </span>
                      </div>
                      <span className="text-[12px] font-semibold text-primary block mt-0.5">
                        {order.studentName} ({order.studentGrade || 'DPS Student'}) • ₹{order.total}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {order.items?.map((it) => `${it.name} (Size ${it.size})`).join(', ') || 'Custom Uniform Kit'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => advanceOrderStatus(order)}
                        className="px-2.5 py-1.5 bg-primary text-on-primary rounded-lg text-[11px] font-bold hover:bg-primary-container transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">sync</span>
                        <span>Advance Stage</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Master Tailor Uniform Inventory List */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-primary">
                Uniform Specifications & Inventory
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Live inventory counts for {activeSchool.name}
              </p>
            </div>
            <button
              onClick={() => onShowToast(`New SKU specification created for ${activeSchool.name}`)}
              className="px-2.5 py-1.5 bg-primary text-on-primary rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-secondary-fixed">
                add
              </span>
              <span>Add SKU</span>
            </button>
          </div>

          <div className="flex flex-col gap-2.5 divide-y divide-surface-container/70">
            {(items.filter((i) => i.schoolId === activeSchool.id).length > 0
              ? items.filter((i) => i.schoolId === activeSchool.id)
              : items.slice(0, 3)
            ).map((item) => {
              const currentUnits = stockCounts[item.id] || 60;
              const isLow = currentUnits < 40;

              return (
                <div key={item.id} className="pt-2.5 first:pt-0 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-14 rounded-lg bg-surface-container overflow-hidden shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-outline uppercase font-semibold">
                          {item.categoryLabel}
                        </span>
                        <h3 className="text-[13px] font-bold text-primary leading-tight truncate">
                          {item.name}
                        </h3>
                        <span className="text-[11px] text-secondary font-semibold">
                          ₹{item.price} • {item.fabricBlend || 'Cotton Blend'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span
                        className={`text-[12px] font-extrabold ${
                          isLow ? 'text-error' : 'text-primary'
                        }`}
                      >
                        {currentUnits} in stock
                      </span>
                      <span className="text-[10px] text-outline">
                        Sizes: {item.availableSizes.slice(0, 3).join(', ')}...
                      </span>
                    </div>
                  </div>

                  {/* Stock Stepper Controls */}
                  <div className="flex items-center justify-between bg-surface-container-low px-3 py-1.5 rounded-lg text-[12px]">
                    <span className="text-on-surface-variant text-[11px]">
                      Batch Code: DPS-PUN-2025 • Crest Verified
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateStock(item.id, -10)}
                        title="Deduct 10 units"
                        className="px-2 py-0.5 bg-surface-container rounded text-primary text-[11px] font-bold hover:bg-surface-container-high cursor-pointer"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleUpdateStock(item.id, 25)}
                        title="Restock 25 units"
                        className="px-2 py-0.5 bg-primary text-on-primary rounded text-[11px] font-bold hover:bg-primary-container cursor-pointer"
                      >
                        +25 Restock
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
