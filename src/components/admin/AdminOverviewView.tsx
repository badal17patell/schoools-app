import React, { useMemo } from 'react';
import { ShoppingCart, DollarSign, Package, AlertTriangle, Clock, ArrowUpRight, ChevronRight, CheckCircle2 } from 'lucide-react';
import { ManagedProduct, Order, School } from '../../types';

interface AdminOverviewViewProps {
  products: ManagedProduct[];
  orders: Order[];
  activeSchool: School | null;
  onNavigateTab: (tab: any) => void;
  onOpenOrder: (order: Order) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({
  products,
  orders,
  activeSchool,
  onNavigateTab,
  onOpenOrder,
}) => {
  // Filter by active school if selected
  const filteredOrders = useMemo(() => {
    if (!activeSchool) return orders;
    return orders.filter((o) =>
      o.items.some((i) => i.schoolId === activeSchool.id)
    );
  }, [orders, activeSchool]);

  const filteredProducts = useMemo(() => {
    if (!activeSchool) return products;
    return products.filter((p) => p.schoolId === activeSchool.id);
  }, [products, activeSchool]);

  // KPIs
  const totalRevenue = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [filteredOrders]);

  const totalUnitsSold = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.items.reduce((acc, i) => acc + i.quantity, 0), 0);
  }, [filteredOrders]);

  const pendingProduction = useMemo(() => {
    return filteredOrders.filter(
      (o) => o.status === 'Confirmed' || o.status === 'Production' || o.status === 'Pending'
    ).length;
  }, [filteredOrders]);

  const lowStockCount = useMemo(() => {
    let count = 0;
    filteredProducts.forEach((p) => {
      (p.sizes || []).forEach((s) => {
        if ((s.stock || 0) <= (s.lowStockThreshold || 10)) {
          count++;
        }
      });
    });
    return count;
  }, [filteredProducts]);

  // Order Pipeline stages
  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {
      processing: 0,
      tailoring: 0,
      'quality-check': 0,
      'in-transit': 0,
      delivered: 0,
    };
    filteredOrders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      } else {
        counts['processing']++;
      }
    });
    return counts;
  }, [filteredOrders]);

  // Low stock inventory items
  const lowStockItems = useMemo(() => {
    const items: { product: ManagedProduct; size: string; stock: number; threshold: number }[] = [];
    filteredProducts.forEach((p) => {
      (p.sizes || []).forEach((s) => {
        if ((s.stock || 0) <= (s.lowStockThreshold || 10)) {
          items.push({
            product: p,
            size: s.size,
            stock: s.stock || 0,
            threshold: s.lowStockThreshold || 10,
          });
        }
      });
    });
    return items.slice(0, 5);
  }, [filteredProducts]);

  return (
    <div className="space-y-6">
      {/* Welcome & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-[#171717]">
            Good morning, Master Tailor {activeSchool ? `(${activeSchool.name})` : ''}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Here's the real-time operational status across Magnum Uniforms today.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#F8F6F0] p-1 rounded-xl border border-[#E5E5E5] text-xs font-semibold">
          <button className="px-3 py-1.5 bg-white text-[#171717] rounded-lg shadow-xs">Today</button>
          <button className="px-3 py-1.5 text-zinc-600 hover:text-black">7 Days</button>
          <button className="px-3 py-1.5 text-zinc-600 hover:text-black">30 Days</button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white p-5 rounded-2xl border border-[#E5E5E5] hover:border-[#C9A227] transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Orders Today</span>
            <div className="p-2 bg-[#F8F6F0] text-[#C9A227] rounded-xl group-hover:bg-[#C9A227] group-hover:text-white transition-colors">
              <ShoppingCart size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#171717]">{filteredOrders.length}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-semibold">
            <span>Live Firestore Data</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white p-5 rounded-2xl border border-[#E5E5E5] hover:border-[#C9A227] transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Revenue</span>
            <div className="p-2 bg-[#F8F6F0] text-[#C9A227] rounded-xl group-hover:bg-[#C9A227] group-hover:text-white transition-colors">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#171717]">₹{totalRevenue.toLocaleString()}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-semibold">
            <span>Authoritative Total</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white p-5 rounded-2xl border border-[#E5E5E5] hover:border-[#C9A227] transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Units Sold</span>
            <div className="p-2 bg-[#F8F6F0] text-[#C9A227] rounded-xl group-hover:bg-[#C9A227] group-hover:text-white transition-colors">
              <Package size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#171717]">{totalUnitsSold}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500 font-semibold">
            <span>Garment items dispatched</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('production')}
          className="bg-white p-5 rounded-2xl border border-[#E5E5E5] hover:border-[#C9A227] transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Pending Production</span>
            <div className="p-2 bg-[#F8F6F0] text-[#C9A227] rounded-xl group-hover:bg-[#C9A227] group-hover:text-white transition-colors">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#171717]">{pendingProduction}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#C9A227] font-semibold">
            <span>Active workshop line</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('inventory')}
          className="bg-white p-5 rounded-2xl border border-[#E5E5E5] hover:border-[#C9A227] transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Low Stock Alerts</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#171717]">{lowStockCount}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-600 font-semibold">
            <span>Action required</span>
          </div>
        </div>
      </div>

      {/* Order Pipeline */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#171717]">Order Fulfilment Pipeline</h3>
          <button
            onClick={() => onNavigateTab('production')}
            className="text-xs font-semibold text-[#C9A227] hover:underline flex items-center gap-1"
          >
            Open Production Board <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(pipelineCounts).map(([stage, count]) => (
            <div
              key={stage}
              onClick={() => onNavigateTab('orders')}
              className="bg-[#F8F6F0] p-3.5 rounded-xl border border-[#E5E5E5] hover:border-[#C9A227] cursor-pointer transition-all text-center"
            >
              <p className="text-[11px] font-semibold text-zinc-500 uppercase">{stage}</p>
              <p className="text-xl font-bold text-[#171717] mt-1">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Grid: Low Stock & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Attention Required */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#171717]">Inventory Attention Required</h3>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs font-semibold text-[#C9A227] hover:underline"
            >
              View All
            </button>
          </div>
          {lowStockItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-zinc-400">
              <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
              <p className="text-xs font-medium">All stock levels are healthy.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {lowStockItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#F8F6F0] rounded-xl border border-[#E5E5E5]">
                  <div>
                    <p className="text-xs font-bold text-[#171717]">{item.product.name}</p>
                    <p className="text-[10px] text-zinc-500">SKU: {item.product.sku} • Size: {item.size}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {item.stock} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#171717]">Recent Institutional Orders</h3>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-semibold text-[#C9A227] hover:underline flex items-center gap-1"
            >
              View All Orders <ChevronRight size={14} />
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-zinc-400">
              <ShoppingCart size={32} className="mb-2 text-zinc-300" />
              <p className="text-xs font-medium">No orders recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E5E5] text-zinc-400 uppercase font-semibold text-[10px]">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Items</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredOrders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-[#F8F6F0]/50 transition-colors">
                      <td className="py-3 font-bold text-[#171717]">#{order.id.slice(-6).toUpperCase()}</td>
                      <td className="py-3 font-medium text-zinc-800">{order.shippingAddress.fullName}</td>
                      <td className="py-3 text-zinc-600">{order.items.length} items</td>
                      <td className="py-3 font-semibold text-[#171717]">₹{order.totalAmount.toLocaleString()}</td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F8F6F0] text-[#171717] border border-[#E5E5E5]">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onOpenOrder(order)}
                          className="p-1.5 hover:bg-[#E5E5E5] rounded-lg text-zinc-600 hover:text-black transition-colors"
                        >
                          <ArrowUpRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
