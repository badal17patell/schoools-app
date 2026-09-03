import React, { useMemo } from 'react';
import { Layers, Search, AlertTriangle, CheckCircle2, Sliders, History } from 'lucide-react';
import { ManagedProduct, ProductInventoryLog, School } from '../../types';

interface AdminInventoryViewProps {
  products: ManagedProduct[];
  inventoryLogs: ProductInventoryLog[];
  activeSchool: School | null;
  onOpenStockModal: (product: ManagedProduct) => void;
  onOpenLogsModal: () => void;
}

export const AdminInventoryView: React.FC<AdminInventoryViewProps> = ({
  products,
  inventoryLogs,
  activeSchool,
  onOpenStockModal,
  onOpenLogsModal,
}) => {
  const filteredProducts = useMemo(() => {
    if (!activeSchool) return products;
    return products.filter((p) => p.schoolId === activeSchool.id);
  }, [products, activeSchool]);

  const totalUnits = useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + (p.totalStock || 0), 0);
  }, [filteredProducts]);

  const lowStockCount = useMemo(() => {
    let count = 0;
    filteredProducts.forEach((p) => {
      (p.sizes || []).forEach((s) => {
        if ((s.stock || 0) <= (s.lowStockThreshold || 10)) count++;
      });
    });
    return count;
  }, [filteredProducts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-[#171717]">Inventory & Stock Control</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Real-time per-size stock matrix, audits, and low-stock replenishment.</p>
        </div>
        <button
          onClick={onOpenLogsModal}
          className="px-4 py-2 bg-[#F8F6F0] border border-[#E5E5E5] hover:border-[#C9A227] rounded-xl text-xs font-bold text-[#171717] transition-all flex items-center gap-2"
        >
          <History size={16} /> Audit Logs ({inventoryLogs.length})
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs">
          <p className="text-xs font-semibold text-zinc-400 uppercase">Total Available Units</p>
          <p className="text-2xl font-bold text-[#171717] mt-1">{totalUnits}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs">
          <p className="text-xs font-semibold text-zinc-400 uppercase">Low Stock Alerts</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{lowStockCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs">
          <p className="text-xs font-semibold text-zinc-400 uppercase">Audit Trail Events</p>
          <p className="text-2xl font-bold text-[#171717] mt-1">{inventoryLogs.length}</p>
        </div>
      </div>

      {/* Inventory Matrix Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#171717] uppercase tracking-wider">SKU Size Inventory Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F8F6F0] border-b border-[#E5E5E5] text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">School</th>
                <th className="py-3 px-4">Size Variant</th>
                <th className="py-3 px-4">Available</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.map((product) =>
                (product.sizes || []).map((sizeObj, idx) => {
                  const isLow = (sizeObj.stock || 0) <= (sizeObj.lowStockThreshold || 10);
                  const isOut = (sizeObj.stock || 0) === 0;
                  return (
                    <tr key={`${product.id}-${sizeObj.size}-${idx}`} className="hover:bg-[#F8F6F0]/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#171717]">{product.name}</td>
                      <td className="py-3 px-4 font-mono text-zinc-600">{product.sku}</td>
                      <td className="py-3 px-4 text-zinc-600">{product.schoolName || 'Institutional'}</td>
                      <td className="py-3 px-4 font-bold text-[#C9A227]">{sizeObj.size}</td>
                      <td className="py-3 px-4 font-semibold text-[#171717]">{sizeObj.stock || 0} units</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOut ? 'bg-red-50 text-red-700' : isLow ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Healthy'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onOpenStockModal(product)}
                          className="px-3 py-1.5 bg-[#0B0B0B] text-[#C9A227] hover:bg-[#1C1C1C] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <Sliders size={13} /> Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
