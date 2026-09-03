import React, { useState } from 'react';
import { ManagedProduct } from '../../types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ManagedProduct | null;
  onConfirm: (size: string, delta: number, reason: string) => Promise<void>;
  onShowToast: (msg: string) => void;
}

const REASONS = [
  'New Production',
  'Restock',
  'Damaged',
  'Correction',
  'Returned',
  'Manual Adjustment',
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirm,
  onShowToast,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(25);
  const [reason, setReason] = useState<string>('Restock');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default selected size when product opens
  React.useEffect(() => {
    if (product && product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0].size);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const currentSizeObj = product.sizes?.find((s) => s.size === selectedSize);
  const currentQty = currentSizeObj?.stock || 0;
  const newQty = Math.max(0, currentQty + adjustmentDelta);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSize) {
      onShowToast('Please select a size to adjust');
      return;
    }
    if (adjustmentDelta === 0) {
      onShowToast('Adjustment delta cannot be 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(selectedSize, adjustmentDelta, reason);
      onShowToast(
        `Adjusted ${product.name} (Size ${selectedSize}) by ${
          adjustmentDelta > 0 ? `+${adjustmentDelta}` : adjustmentDelta
        } units`
      );
      onClose();
    } catch (err) {
      console.error('Adjustment failed:', err);
      onShowToast('Failed to adjust inventory');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl border border-surface-container overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-3.5 bg-primary text-on-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-fixed text-xl">
              warehouse
            </span>
            <div>
              <h3 className="text-[15px] font-bold text-white leading-tight">
                Inventory Stock Adjustment
              </h3>
              <span className="text-[11px] text-white/70">
                Log auditable batch movements in Firestore
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-surface-container-low p-3 rounded-xl border border-surface-container/60 flex items-center gap-3">
            <div className="w-12 h-14 rounded-lg bg-surface-container overflow-hidden shrink-0">
              <img
                src={product.images?.[0]?.url || ''}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-outline uppercase font-bold block">
                {product.sku} • {product.schoolName}
              </span>
              <h4 className="text-[13px] font-bold text-primary truncate">
                {product.name}
              </h4>
              <span className="text-[11px] text-on-surface-variant">
                Total across sizes: {product.totalStock} units
              </span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-outline uppercase block mb-1">
              Select Size Specification *
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-xl text-[13px] text-primary font-bold focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
            >
              {product.sizes?.map((s) => (
                <option key={s.size} value={s.size}>
                  Size {s.size} (Current: {s.stock} in stock)
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-outline uppercase">
                Adjustment Delta *
              </label>
              <div className="flex items-center gap-1">
                {[-10, -5, +10, +25, +50].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setAdjustmentDelta(quick)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      adjustmentDelta === quick
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-primary hover:bg-surface-container-high'
                    }`}
                  >
                    {quick > 0 ? `+${quick}` : quick}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              value={adjustmentDelta}
              onChange={(e) => setAdjustmentDelta(Number(e.target.value))}
              placeholder="e.g. +25 or -10"
              className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-xl text-[14px] font-extrabold text-primary focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </div>

          {/* Before & After Preview */}
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-surface-container flex items-center justify-between text-[12px]">
            <div>
              <span className="text-[10px] text-outline uppercase font-bold block">
                Current Count
              </span>
              <span className="text-[16px] font-bold text-primary">
                {currentQty} units
              </span>
            </div>

            <div className="flex items-center text-secondary font-bold text-[18px]">
              <span className="material-symbols-outlined">trending_flat</span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-outline uppercase font-bold block">
                New Count
              </span>
              <span className="text-[16px] font-extrabold text-primary">
                {newQty} units
              </span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-outline uppercase block mb-1">
              Audit Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-xl text-[13px] text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-surface-container text-primary rounded-xl text-[12px] font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl text-[12px] font-bold shadow-xs hover:bg-primary-container transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">
                    progress_activity
                  </span>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm text-secondary-fixed">
                    check
                  </span>
                  <span>Confirm Adjustment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
