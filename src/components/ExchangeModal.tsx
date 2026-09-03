import React, { useState } from 'react';
import { Order } from '../types';

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSubmitExchange: (details: {
    itemName: string;
    currentSize: string;
    requestedSize: string;
    reason: string;
    pickupMode: 'Doorstep Courier Swap' | 'School Uniform Depot Pickup';
  }) => void;
}

export const ExchangeModal: React.FC<ExchangeModalProps> = ({
  isOpen,
  onClose,
  order,
  onSubmitExchange,
}) => {
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [requestedSize, setRequestedSize] = useState('32');
  const [reason, setReason] = useState('Chest / Fit is too tight');
  const [pickupMode, setPickupMode] = useState<
    'Doorstep Courier Swap' | 'School Uniform Depot Pickup'
  >('Doorstep Courier Swap');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const currentItem = order.items[selectedItemIndex] || order.items[0];

  const sizeOptions = ['26', '28', '30', '32', '34', '36', '38', '40'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitExchange({
      itemName: currentItem.name,
      currentSize: currentItem.size,
      requestedSize,
      reason,
      pickupMode,
    });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl border border-surface-container max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-base">sync_alt</span>
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-primary leading-tight">
                Request Size Exchange
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Order Ref: {order.id} • 7-Day Institutional Guarantee
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-primary"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Select Item */}
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-1">
              1. Select Garment to Swap
            </label>
            <select
              value={selectedItemIndex}
              onChange={(e) => setSelectedItemIndex(Number(e.target.value))}
              className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-[13px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
            >
              {order.items.map((item, idx) => (
                <option key={idx} value={idx}>
                  {item.name} (Current Size: {item.size})
                </option>
              ))}
            </select>
          </div>

          {/* New Size Requested */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-primary uppercase">
                2. Requested Replacement Size
              </label>
              <span className="text-[11px] text-secondary font-bold">
                Current: Size {currentItem.size}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {sizeOptions.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setRequestedSize(sz)}
                  className={`h-9 rounded-lg text-[12px] font-bold transition-all ${
                    requestedSize === sz
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container-low text-primary hover:bg-surface-container'
                  }`}
                >
                  Size {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Reason for Exchange */}
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-1">
              3. Reason for Exchange
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-[13px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
            >
              <option value="Chest / Fit is too tight">Chest / Fit is too tight</option>
              <option value="Length / Sleeves are too long">Length / Sleeves are too long</option>
              <option value="Ordered wrong size by mistake">Ordered wrong size by mistake</option>
              <option value="Need 1 size larger for growth room">Need 1 size larger for growth room</option>
              <option value="School uniform inspector recommendation">School uniform inspector recommendation</option>
            </select>
          </div>

          {/* Pickup / Swap Mode */}
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-1">
              4. Replacement Fulfillment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPickupMode('Doorstep Courier Swap')}
                className={`p-2.5 rounded-xl text-left border flex flex-col gap-1 transition-all ${
                  pickupMode === 'Doorstep Courier Swap'
                    ? 'border-secondary bg-secondary-container/20 text-primary font-bold'
                    : 'border-surface-container bg-surface-container-low text-on-surface-variant'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-base">
                    local_shipping
                  </span>
                  <span className="text-[12px]">Doorstep Swap</span>
                </div>
                <span className="text-[10px] text-on-surface-variant leading-tight">
                  Delivery rider brings new size and collects old set simultaneously.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPickupMode('School Uniform Depot Pickup')}
                className={`p-2.5 rounded-xl text-left border flex flex-col gap-1 transition-all ${
                  pickupMode === 'School Uniform Depot Pickup'
                    ? 'border-secondary bg-secondary-container/20 text-primary font-bold'
                    : 'border-surface-container bg-surface-container-low text-on-surface-variant'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-base">
                    school
                  </span>
                  <span className="text-[12px]">Campus Desk</span>
                </div>
                <span className="text-[10px] text-on-surface-variant leading-tight">
                  Instant exchange counter at Delhi Public School administration block.
                </span>
              </button>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-1">
              Tailor Alteration Note (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please hem trousers by 1 inch"
              className="w-full h-10 px-3 bg-surface-container-low rounded-xl text-[12px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </div>

          {/* Assurance Notice */}
          <div className="p-2.5 bg-surface-container-low rounded-xl flex items-center gap-2 text-[11px] text-on-surface-variant">
            <span className="material-symbols-outlined text-secondary text-base shrink-0">
              verified
            </span>
            <span>
              Zero courier fee. Garment must be unworn with original tags attached.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 h-12 bg-primary text-on-primary rounded-xl text-[13px] font-bold shadow-md hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
            >
              <span>Confirm Size Exchange</span>
              <span className="material-symbols-outlined text-secondary-fixed text-base">
                arrow_forward
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-12 px-4 bg-surface-container text-on-surface-variant rounded-xl text-[13px] font-semibold hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
