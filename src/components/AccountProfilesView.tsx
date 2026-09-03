import React, { useState } from 'react';
import { ChildProfile, Order, ActiveScreen, UserAccount } from '../types';

interface AccountProfilesViewProps {
  profiles: ChildProfile[];
  orders: Order[];
  onNavigate: (screen: ActiveScreen) => void;
  onOpenFitQuiz: () => void;
  onQuickReorder: (profile: ChildProfile) => void;
  onShowToast: (msg: string) => void;
  user: UserAccount;
  onOpenAddChild: () => void;
  onOpenInvoice: (order: Order) => void;
  onOpenAddressModal: () => void;
  onSelectOrderToTrack?: (orderId: string) => void;
}

export const AccountProfilesView: React.FC<AccountProfilesViewProps> = ({
  profiles,
  orders,
  onNavigate,
  onOpenFitQuiz,
  onQuickReorder,
  onShowToast,
  user,
  onOpenAddChild,
  onOpenInvoice,
  onOpenAddressModal,
  onSelectOrderToTrack,
}) => {
  const [activeChildId, setActiveChildId] = useState(profiles[0]?.id || 'aarav');
  const [growthAlert, setGrowthAlert] = useState(true);
  const [whatsappAlert, setWhatsappAlert] = useState(true);

  const selectedChild =
    profiles.find((p) => p.id === activeChildId) || profiles[0];

  return (
    <div className="flex flex-col w-full pb-24">
      {/* Account Header */}
      <div className="px-4 py-3 bg-surface-container-lowest shadow-xs border-b border-surface-container flex items-center justify-between">
        <h1 className="text-[18px] font-bold text-primary">Parent Portal</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('login')}
            className="text-[11px] font-bold text-primary hover:text-secondary flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded"
          >
            <span className="material-symbols-outlined text-xs">switch_account</span>
            <span>Switch / Login</span>
          </button>
          <span className="text-[11px] font-bold text-secondary bg-secondary-fixed/30 px-2 py-0.5 rounded-full">
            DPS Pune Verified
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 pt-4 flex flex-col gap-4">
        {/* Parent Details Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex items-center gap-3.5">
          <img
            alt={user.name}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-secondary/50 shrink-0"
            src={
              user.avatarUrl ||
              'https://lh3.googleusercontent.com/aida/AEtjO1WdqKYFtNkOBysM4Y6KvU8SkPiXYGwzzrxfu5XdFg1MmmpSuxRaKjJXDDVqUw05mPCNIvZJ7rBGTHy0cqnUePCIuwGroE4jgLW8BQ4T_4Aswi9Td61Bj8nPCmv2GHuwjB7TxagLd4dqBnasGe2GNhsJvVAfBY9JbFzSzeOXoFD8urFIkT_DEOZN8_Dyj2KCBNCILm5eBIx9lHXpDCZgnpVsNAKXe_lmp7wdkPmUfJYRyn7-7rUOFX2-q4UQr29MGJVQOv2cjuc0rg'
            }
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[16px] font-bold text-primary truncate">
                {user.name}
              </h2>
              <span
                className="material-symbols-outlined text-secondary text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            </div>
            <p className="text-[12px] text-on-surface-variant truncate">
              {user.phone || '+91 98201 49201'} • {user.email || 'rajesh.sharma@example.com'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block text-[10px] font-semibold text-outline uppercase tracking-wider">
                {user.role === 'parent' ? 'Primary Account Holder' : 'Staff / Tailor'}
              </span>
              <button
                onClick={() => onNavigate('login')}
                className="text-[11px] text-secondary font-bold hover:underline"
              >
                {user.isLoggedIn ? 'Manage Account' : 'Sign In Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Saved Delivery Address Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-secondary text-xl shrink-0 mt-0.5">
              pin_drop
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-bold text-primary">
                  Default Delivery Address
                </h3>
                <span className="text-[10px] bg-secondary-container/30 text-secondary font-bold px-1.5 py-0.2 rounded">
                  {user.defaultAddress?.tag || 'Home'}
                </span>
              </div>
              <p className="text-[12px] text-on-surface-variant mt-0.5 leading-relaxed">
                {user.defaultAddress?.flat}, {user.defaultAddress?.street},{' '}
                {user.defaultAddress?.city} - {user.defaultAddress?.pincode}
              </p>
              <p className="text-[11px] text-outline mt-0.5">
                Recipient: {user.defaultAddress?.fullName} ({user.defaultAddress?.phone})
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAddressModal}
            className="px-2.5 py-1 bg-surface-container-low text-primary rounded-lg text-[11px] font-bold hover:bg-surface-container border border-surface-container shrink-0 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">edit</span>
            <span>Change</span>
          </button>
        </div>

        {/* Child Profile Switcher */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-outline uppercase tracking-wider">
              Enrolled Children Profiles ({profiles.length})
            </span>
            <button
              onClick={onOpenAddChild}
              className="text-[12px] font-bold text-secondary flex items-center gap-0.5 hover:underline"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Add Child</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {profiles.map((child) => {
              const isActive = child.id === activeChildId;
              return (
                <button
                  key={child.id}
                  onClick={() => setActiveChildId(child.id)}
                  className={`flex-1 min-w-[170px] p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                    isActive
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface-container-lowest text-primary border-surface-container hover:bg-surface-container'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${
                      isActive
                        ? 'bg-secondary-fixed text-primary'
                        : 'bg-surface-container text-primary'
                    }`}
                  >
                    {child.initials || child.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[13px] font-bold truncate">
                      {child.name}
                    </span>
                    <span
                      className={`block text-[11px] truncate ${
                        isActive ? 'text-on-primary/80' : 'text-on-surface-variant'
                      }`}
                    >
                      {child.grade} • {child.school.split(',')[0]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Child Sizing Profile Details */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">
                Official Institutional Profile
              </span>
              <h3 className="text-[17px] font-bold text-primary leading-tight mt-0.5">
                {selectedChild.name}
              </h3>
              <p className="text-[12px] text-on-surface-variant">
                {selectedChild.school} • {selectedChild.session || '2025-26'}
              </p>
            </div>
            <button
              onClick={onOpenFitQuiz}
              className="px-2.5 py-1.5 bg-secondary-container/30 text-secondary rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-secondary-container/50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                auto_fix_high
              </span>
              <span>Fit Quiz</span>
            </button>
          </div>

          {/* Student Physical Dimensions */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-surface-container/60">
            <div className="p-2 rounded-lg bg-surface-container-low text-center">
              <span className="text-[10px] text-outline uppercase block font-semibold">
                Height
              </span>
              <span className="text-[13px] font-bold text-primary block mt-0.5">
                {selectedChild.height || `${selectedChild.measurements?.height} cm`}
              </span>
              <span className="text-[10px] text-on-surface-variant">
                {selectedChild.heightInches || 'Metric'}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-surface-container-low text-center">
              <span className="text-[10px] text-outline uppercase block font-semibold">
                Weight
              </span>
              <span className="text-[13px] font-bold text-primary block mt-0.5">
                {selectedChild.weight || `${selectedChild.measurements?.weight} kg`}
              </span>
              <span className="text-[10px] text-on-surface-variant">
                {selectedChild.weightCategory || 'Standard'}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-surface-container-low text-center">
              <span className="text-[10px] text-outline uppercase block font-semibold">
                Class
              </span>
              <span className="text-[13px] font-bold text-primary block mt-0.5">
                {selectedChild.grade}
              </span>
              <span className="text-[10px] text-on-surface-variant">
                DPS Pune
              </span>
            </div>

            <div className="p-2 rounded-lg bg-surface-container-low text-center">
              <span className="text-[10px] text-outline uppercase block font-semibold">
                Growth Buffer
              </span>
              <span className="text-[13px] font-bold text-secondary block mt-0.5">
                {selectedChild.growthBuffer || '+1.5"'}
              </span>
              <span className="text-[10px] text-on-surface-variant">
                Tailored
              </span>
            </div>
          </div>

          {/* Recommended Master Sizing Matrix */}
          <div className="mt-1 flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              Assigned Sizing Specifications
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {selectedChild.sizes ? (
                Object.entries(selectedChild.sizes).map(([garment, size]) => (
                  <div
                    key={garment}
                    className="p-2.5 rounded-lg bg-surface-container flex items-center justify-between"
                  >
                    <span className="text-[12px] capitalize font-medium text-on-surface-variant">
                      {garment}
                    </span>
                    <span className="text-[12px] font-bold text-primary bg-surface-container-lowest px-2 py-0.5 rounded shadow-xs">
                      {size}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-2.5 rounded-lg bg-surface-container flex items-center justify-between col-span-2">
                  <span className="text-[12px] font-medium text-on-surface-variant">
                    Standard Uniform Fit
                  </span>
                  <span className="text-[12px] font-bold text-primary bg-surface-container-lowest px-2 py-0.5 rounded shadow-xs">
                    Size {selectedChild.measurements?.preferredSize || '32'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Direct Quick Reorder CTA */}
          <button
            onClick={() => onQuickReorder(selectedChild)}
            className="w-full h-11 bg-primary text-on-primary rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-xs hover:bg-primary-container active:scale-[0.99] transition-all mt-1"
          >
            <span className="material-symbols-outlined text-secondary-fixed text-base">
              shopping_cart
            </span>
            <span>Pre-fill Annual Kit for {selectedChild.name.split(' ')[0]}</span>
          </button>
        </div>

        {/* Academic Order History with Real Tax Invoices */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-primary">
              Uniform Purchase History
            </h3>
            <span className="text-[11px] text-outline">
              All Orders Archival
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-primary">
                      {order.id}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        order.status === 'in-transit'
                          ? 'bg-secondary text-primary'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {order.statusText}
                    </span>
                  </div>
                  <span className="text-[13px] font-bold text-primary">
                    ₹{(order.totalAmount ?? order.total ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="text-[11px] text-on-surface-variant flex items-center justify-between">
                  <span>
                    {order.date} • {order.items.length} Uniform Sets
                  </span>
                  <span>{order.studentName}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-surface-container/60">
                  <button
                    onClick={() => {
                      if (onSelectOrderToTrack) onSelectOrderToTrack(order.id);
                      onNavigate('track-order');
                    }}
                    className="px-2.5 py-1 bg-surface-container-lowest text-primary rounded text-[11px] font-bold hover:bg-surface-container border border-surface-container"
                  >
                    Track Status
                  </button>
                  <button
                    onClick={() => onOpenInvoice(order)}
                    className="px-2.5 py-1 bg-primary text-on-primary rounded text-[11px] font-bold hover:bg-primary-container flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs text-secondary-fixed">
                      receipt_long
                    </span>
                    <span>Tax Invoice</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Notification Preferences */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex flex-col gap-3">
          <h3 className="text-[14px] font-bold text-primary">
            Institutional Preferences
          </h3>

          <div className="flex items-center justify-between py-1">
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-primary">
                Annual Growth Sizing Reminders
              </span>
              <span className="text-[11px] text-on-surface-variant">
                Alerts when academic term uniform sizes need recalibration
              </span>
            </div>
            <input
              type="checkbox"
              checked={growthAlert}
              onChange={() => {
                setGrowthAlert(!growthAlert);
                onShowToast(`Growth alerts ${!growthAlert ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-1 border-t border-surface-container/60">
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-primary">
                WhatsApp Dispatch & Tracking Updates
              </span>
              <span className="text-[11px] text-on-surface-variant">
                Real-time delivery milestones sent to registered mobile
              </span>
            </div>
            <input
              type="checkbox"
              checked={whatsappAlert}
              onChange={() => {
                setWhatsappAlert(!whatsappAlert);
                onShowToast(`WhatsApp updates ${!whatsappAlert ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
