import React, { useState } from 'react';
import { UserAccount } from '../types';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: UserAccount['defaultAddress'];
  onSaveAddress: (address: UserAccount['defaultAddress']) => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  currentAddress,
  onSaveAddress,
}) => {
  const [fullName, setFullName] = useState(currentAddress?.fullName || '');
  const [phone, setPhone] = useState(currentAddress?.phone || '');
  const [flat, setFlat] = useState(currentAddress?.flat || '');
  const [street, setStreet] = useState(currentAddress?.street || '');
  const [area, setArea] = useState(currentAddress?.area || '');
  const [city, setCity] = useState(currentAddress?.city || 'Pune');
  const [state, setState] = useState(currentAddress?.state || 'Maharashtra');
  const [pincode, setPincode] = useState(currentAddress?.pincode || '');
  const [tag, setTag] = useState<UserAccount['defaultAddress']['tag']>(
    currentAddress?.tag || 'Home'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAddress({
      fullName,
      phone,
      flat,
      street,
      area,
      city,
      state,
      pincode,
      tag,
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
              <span className="material-symbols-outlined text-base">pin_drop</span>
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-primary leading-tight">
                Delivery Address
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Direct doorstep or school campus reception
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Address Tag */}
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-1">
              Address Category
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Home', 'School Campus Pickup', 'Office'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                    tag === t
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Full Name & Phone */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                Parent / Recipient *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-low rounded-xl text-[12px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-low rounded-xl text-[12px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
                required
              />
            </div>
          </div>

          {/* Flat / Building */}
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-1">
              Flat / House No. / Building / Wing *
            </label>
            <input
              type="text"
              value={flat}
              onChange={(e) => setFlat(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container-low rounded-xl text-[12px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
              required
            />
          </div>

          {/* Street / Landmark */}
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-1">
              Street, Colony or Landmark
            </label>
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container-low rounded-xl text-[12px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </div>

          {/* City, State, PIN */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-10 px-2.5 bg-surface-container-low rounded-xl text-[12px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full h-10 px-2.5 bg-surface-container-low rounded-xl text-[12px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                PIN Code *
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full h-10 px-2.5 bg-surface-container-low rounded-xl text-[12px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 h-12 bg-primary text-on-primary rounded-xl text-[13px] font-bold shadow-md hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
            >
              <span>Save Address</span>
              <span className="material-symbols-outlined text-secondary-fixed text-base">
                check
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
