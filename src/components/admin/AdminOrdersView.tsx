import React, { useState, useMemo } from 'react';
import { ShoppingCart, Search, Eye } from 'lucide-react';
import { Order, School } from '../../types';

interface AdminOrdersViewProps {
  orders: Order[];
  activeSchool: School | null;
  onUpdateOrderStatus: (orderId: string, status: Order['status'], statusText: string, step: number) => void;
  onOpenOrderModal: (order: Order) => void;
  onShowToast: (msg: string) => void;
}

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({
  orders,
  activeSchool,
  onUpdateOrderStatus,
  onOpenOrderModal,
  onShowToast,
}) => {
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const statusTabs = ['All', 'processing', 'tailoring', 'quality-check', 'in-transit', 'delivered'];

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (activeSchool) {
        const matchesSchool = o.school.toLowerCase().includes(activeSchool.name.toLowerCase());
        if (!matchesSchool) return false;
      }
      if (selectedStatusTab !== 'All' && o.status !== selectedStatusTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = o.id.toLowerCase().includes(q);
        const matchName = o.studentName.toLowerCase().includes(q);
        const matchPhone = o.contactNumber.includes(q);
        if (!matchId && !matchName && !matchPhone) return false;
      }
      return true;
    });
  }, [orders, activeSchool, selectedStatusTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-[#171717]">Institutional Orders</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Manage customer orders, production steps, and fulfilment status.</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {statusTabs.map((tab) => {
          const isActive = selectedStatusTab === tab;
          const count = tab === 'All' ? orders.length : orders.filter((o) => o.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setSelectedStatusTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 capitalize ${
                isActive
                  ? 'bg-[#0B0B0B] text-[#C9A227] shadow-xs'
                  : 'bg-white text-zinc-600 border border-[#E5E5E5] hover:border-[#C9A227]'
              }`}
            >
              <span>{tab.replace('-', ' ')}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-[#1C1C1C] text-[#C9A227]' : 'bg-[#F8F6F0] text-zinc-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E5E5] flex items-center gap-4 shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by Order ID, student name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8F6F0] border border-[#E5E5E5] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[#171717] focus:outline-none focus:border-[#C9A227]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-xs">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <ShoppingCart size={36} className="mx-auto mb-3 text-zinc-300" />
            <p className="text-xs font-semibold">No orders found matching the filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8F6F0] border-b border-[#E5E5E5] text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">School</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#F8F6F0]/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#171717]">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="py-3.5 px-4 font-medium text-zinc-800">
                      <p>{order.studentName}</p>
                      <p className="text-[10px] text-zinc-400">{order.contactNumber}</p>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 font-medium">{order.school}</td>
                    <td className="py-3.5 px-4 text-zinc-600">{order.items.length} items</td>
                    <td className="py-3.5 px-4 font-semibold text-[#171717]">₹{(order.totalAmount || order.total).toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F8F6F0] text-[#171717] border border-[#E5E5E5] capitalize">
                        {order.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 text-[11px]">{order.date}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onOpenOrderModal(order)}
                        className="px-3 py-1.5 bg-[#0B0B0B] text-[#C9A227] hover:bg-[#1C1C1C] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ml-auto"
                      >
                        <Eye size={13} /> View Details
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
  );
};
