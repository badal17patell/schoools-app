import React from 'react';
import { Factory } from 'lucide-react';
import { Order } from '../../types';

interface AdminProductionViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status'], statusText: string, step: number) => void;
  onOpenOrderModal: (order: Order) => void;
}

export const AdminProductionView: React.FC<AdminProductionViewProps> = ({
  orders,
  onUpdateOrderStatus,
  onOpenOrderModal,
}) => {
  const stages: Order['status'][] = ['processing', 'tailoring', 'quality-check', 'in-transit', 'delivered'];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs">
        <h2 className="text-lg font-bold text-[#171717]">Production Kanban Board</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Manage workshop cutting, stitching, and quality inspection workflows.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const stageOrders = orders.filter((o) => o.status === stage);
          return (
            <div key={stage} className="bg-[#F8F6F0] rounded-2xl border border-[#E5E5E5] p-4 flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E5E5]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">{stage.replace('-', ' ')}</h3>
                <span className="w-5 h-5 rounded-full bg-white border border-[#E5E5E5] text-[10px] font-bold flex items-center justify-center">
                  {stageOrders.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageOrders.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400 text-[11px]">No orders in {stage}</div>
                ) : (
                  stageOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => onOpenOrderModal(order)}
                      className="bg-white p-3.5 rounded-xl border border-[#E5E5E5] hover:border-[#C9A227] cursor-pointer shadow-xs space-y-2 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#171717]">#{order.id.slice(-6).toUpperCase()}</span>
                        <span className="text-[10px] font-semibold text-zinc-500">₹{order.totalAmount || order.total}</span>
                      </div>
                      <p className="text-xs font-medium text-zinc-800">{order.studentName}</p>
                      <p className="text-[10px] text-zinc-400">{order.items.length} garments</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
