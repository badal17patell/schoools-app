import React, { useState } from 'react';
import { ProductInventoryLog } from '../../types';

interface InventoryLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ProductInventoryLog[];
  onShowToast: (msg: string) => void;
}

export const InventoryLogsModal: React.FC<InventoryLogsModalProps> = ({
  isOpen,
  onClose,
  logs,
  onShowToast,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      log.productName?.toLowerCase().includes(q) ||
      log.size?.toLowerCase().includes(q) ||
      log.reason?.toLowerCase().includes(q) ||
      log.user?.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (logs.length === 0) {
      onShowToast('No logs available to export');
      return;
    }

    const headers = ['Date', 'Product Name', 'Size', 'Adjustment', 'Previous Stock', 'New Stock', 'Reason', 'User'];
    const rows = logs.map((l) => [
      l.date,
      `"${l.productName.replace(/"/g, '""')}"`,
      l.size,
      l.adjustment,
      l.previousQuantity,
      l.newQuantity,
      `"${l.reason}"`,
      l.user,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `magnum_inventory_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Exported inventory audit log CSV');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-surface-container-lowest w-full max-w-3xl rounded-2xl shadow-2xl border border-surface-container flex flex-col max-h-[85vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-primary text-on-primary flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary-fixed text-2xl">
              history_edu
            </span>
            <div>
              <h3 className="text-[16px] font-bold text-white leading-tight">
                Inventory Audit Trail & Stock History
              </h3>
              <span className="text-[11px] text-white/70">
                Live immutable record of batch receipts, orders, and adjustments
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">download</span>
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-surface-container bg-surface-container-low/50 flex items-center gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px]">
              search
            </span>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search audit trail by product, size, reason, or user..."
              className="w-full h-9 pl-9 pr-3 bg-surface-container-lowest border border-surface-container rounded-xl text-[12px] text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </div>
          <span className="text-[11px] text-on-surface-variant shrink-0">
            Showing {filteredLogs.length} events
          </span>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant text-[13px]">
              No inventory adjustment records found.
            </div>
          ) : (
            <div className="divide-y divide-surface-container/70 border border-surface-container rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 bg-surface-container-low px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-wider">
                <div className="col-span-3">Date & Time</div>
                <div className="col-span-4">Product & Size</div>
                <div className="col-span-2 text-center">Movement</div>
                <div className="col-span-3 text-right">Reason & User</div>
              </div>

              {filteredLogs.map((log) => {
                const isPositive = log.adjustment > 0;
                const formattedDate = new Date(log.date).toLocaleString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={log.id}
                    className="grid grid-cols-12 items-center px-3 py-2.5 bg-surface-container-lowest text-[12px] hover:bg-surface-container-low/30"
                  >
                    <div className="col-span-3 text-[11px] text-on-surface-variant font-mono">
                      {formattedDate}
                    </div>

                    <div className="col-span-4 pr-2">
                      <span className="font-bold text-primary block truncate">
                        {log.productName}
                      </span>
                      <span className="text-[10px] text-outline font-semibold">
                        Size: {log.size}
                      </span>
                    </div>

                    <div className="col-span-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                          isPositive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-error-container/30 text-error'
                        }`}
                      >
                        {isPositive ? `+${log.adjustment}` : log.adjustment}
                      </span>
                      <span className="text-[10px] text-outline block mt-0.5">
                        {log.previousQuantity} → {log.newQuantity}
                      </span>
                    </div>

                    <div className="col-span-3 text-right">
                      <span className="font-semibold text-primary block text-[11px]">
                        {log.reason}
                      </span>
                      <span className="text-[10px] text-outline truncate block">
                        {log.user || 'system'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
