import React, { useState, useEffect } from 'react';
import { ChildProfile, Order, ActiveScreen, UserAccount } from '../types';
import { MagnumLogo } from './MagnumLogo';

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
  onLogout?: () => void;
  onDeleteProfile?: (profileId: string) => void;
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
  onLogout,
  onDeleteProfile,
}) => {
  const [activeChildId, setActiveChildId] = useState(profiles[0]?.id || '');
  const [growthAlert, setGrowthAlert] = useState(true);
  const [whatsappAlert, setWhatsappAlert] = useState(true);

  // Keep activeChildId synchronized when profiles load or change
  useEffect(() => {
    if (profiles.length === 0) {
      setActiveChildId('');
    } else if (!profiles.some((p) => p.id === activeChildId)) {
      setActiveChildId(profiles[0].id);
    }
  }, [profiles, activeChildId]);

  const selectedChild =
    profiles.find((p) => p.id === activeChildId) || profiles[0];

  const hasAddress = Boolean(
    user.defaultAddress &&
    (user.defaultAddress.flat?.trim() || user.defaultAddress.street?.trim()) &&
    user.defaultAddress.pincode?.trim()
  );

  const isBadal = Boolean(
    user.isLoggedIn &&
    user.email?.trim().toLowerCase() === 'badal17patell@gmail.com'
  );

  if (!user?.isLoggedIn) {
    return (
      <div className="flex flex-col w-full pb-24 min-h-[75vh] items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface-container-lowest rounded-2xl p-6 shadow-md border border-surface-container text-center flex flex-col items-center gap-4">
          <div className="w-full flex justify-center mb-2">
            <MagnumLogo variant="full" size="lg" />
          </div>
          <h1 className="text-[22px] font-extrabold text-primary tracking-tight">
            Please Sign In
          </h1>
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full mt-2">
            <button
              onClick={() => onNavigate('login')}
              className="w-full py-2.5 bg-primary text-on-primary rounded-xl text-[13px] font-bold shadow-xs hover:bg-primary-container transition-all cursor-pointer"
            >
              Sign In to Account
            </button>
            <button
              onClick={() => onNavigate('store')}
              className="w-full py-2.5 bg-surface-container-low text-primary rounded-xl text-[13px] font-bold hover:bg-surface-container transition-all cursor-pointer"
            >
              Browse School Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-24">
      {/* Account Header */}
      <div className="px-4 py-3 bg-surface-container-lowest shadow-xs border-b border-surface-container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MagnumLogo variant="crest" size={30} />
          <h1 className="text-[18px] font-bold text-primary">My Account</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                onNavigate('login');
              }
            }}
            className="text-[11px] font-bold text-error hover:bg-error-container/20 flex items-center gap-1 bg-surface-container-low px-2.5 py-1 rounded transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 pt-4 flex flex-col gap-4">
        {/* Admin Quick Banner for Badal */}
        {isBadal && (
          <div className="bg-primary text-on-primary rounded-2xl p-4 shadow-md flex items-center justify-between gap-3 border border-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary text-primary flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
              </div>
              <div>
                <span className="text-[10px] text-secondary-fixed uppercase tracking-wider font-bold block">
                  Authorized Administrator
                </span>
                <span className="text-[14px] font-bold text-white">
                  Master Tailor Console Access
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('admin')}
              className="px-3 py-1.5 bg-secondary text-primary rounded-lg text-[12px] font-bold hover:bg-secondary-container transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <span>Open Console</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Parent Details Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex items-center gap-3.5">
            <img
              alt={user.name || 'Parent'}
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
                {user.phone ? `${user.phone} • ` : ''}{user.email || 'Verified Account'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block text-[10px] font-semibold text-outline uppercase tracking-wider">
                  {isBadal ? 'Master Tailor Admin' : (user.role === 'parent' ? 'Primary Account Holder' : 'Staff / Tailor')}
                </span>
                <button
                  onClick={() => onNavigate('login')}
                  className="text-[11px] text-secondary font-bold hover:underline"
                >
                  Switch Account
                </button>
              </div>
            </div>
          </div>

        {/* Saved Delivery Address Card */}
        {hasAddress ? (
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
                  {[
                    user.defaultAddress?.flat?.trim(),
                    user.defaultAddress?.street?.trim(),
                    user.defaultAddress?.city?.trim(),
                    user.defaultAddress?.pincode?.trim() ? `PIN: ${user.defaultAddress.pincode.trim()}` : '',
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {(user.defaultAddress?.fullName || user.defaultAddress?.phone) && (
                  <p className="text-[11px] text-outline mt-0.5">
                    Recipient: {user.defaultAddress?.fullName} {user.defaultAddress?.phone ? `(${user.defaultAddress.phone})` : ''}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onOpenAddressModal}
              className="px-2.5 py-1 bg-surface-container-low text-primary rounded-lg text-[11px] font-bold hover:bg-surface-container border border-surface-container shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">edit</span>
              <span>Change</span>
            </button>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-secondary text-xl shrink-0">
                add_location_alt
              </span>
              <div>
                <h3 className="text-[13px] font-bold text-primary">
                  No Delivery Address Saved
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  Add your shipping destination for seamless uniform checkout
                </p>
              </div>
            </div>
            <button
              onClick={onOpenAddressModal}
              className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-[11px] font-bold hover:bg-primary-container shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-xs text-secondary-fixed">add</span>
              <span>Add Address</span>
            </button>
          </div>
        )}

        {/* Child Profile Switcher */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-outline uppercase tracking-wider">
              Enrolled Children Profiles ({profiles.length})
            </span>
            <button
              onClick={onOpenAddChild}
              className="text-[12px] font-bold text-secondary flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Add Child</span>
            </button>
          </div>

          {profiles.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-surface-container text-center flex flex-col items-center gap-2.5">
              <div className="w-12 h-12 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">school</span>
              </div>
              <h3 className="text-[14px] font-bold text-primary">No Student Profiles Enrolled</h3>
              <p className="text-[12px] text-on-surface-variant max-w-sm">
                Add your child's academic school, grade, and tailoring measurements to unlock bespoke auto-sizing and school dress code verification.
              </p>
              <button
                onClick={onOpenAddChild}
                className="mt-1 px-4 py-2 bg-primary text-on-primary rounded-xl text-[12px] font-bold hover:bg-primary-container transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm text-secondary-fixed">add</span>
                <span>Add Student Profile</span>
              </button>
            </div>
          ) : (
            <>
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
                          {child.grade} • {(child.school || '').split(',')[0]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedChild && (
                <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">
                          Enrolled Student Sizing Profile
                        </span>
                      </div>
                      <h3 className="text-[17px] font-bold text-primary leading-tight mt-0.5">
                        {selectedChild.name}
                      </h3>
                      <p className="text-[12px] text-on-surface-variant">
                        {selectedChild.school} • {selectedChild.session || '2025-26'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={onOpenFitQuiz}
                        className="px-2.5 py-1.5 bg-secondary-container/30 text-secondary rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-secondary-container/50 transition-colors cursor-pointer"
                        title="Run AI Fit Quiz for this student"
                      >
                        <span className="material-symbols-outlined text-sm">
                          auto_fix_high
                        </span>
                        <span>Fit Quiz</span>
                      </button>
                      {onDeleteProfile && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove ${selectedChild.name}'s profile from your account?`)) {
                              onDeleteProfile(selectedChild.id);
                            }
                          }}
                          className="p-1.5 text-outline hover:text-error hover:bg-error-container/20 rounded-lg transition-colors cursor-pointer"
                          title="Remove student profile"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      )}
                    </div>
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
                    className="w-full h-11 bg-primary text-on-primary rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-xs hover:bg-primary-container active:scale-[0.99] transition-all mt-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-secondary-fixed text-base">
                      shopping_cart
                    </span>
                    <span>Pre-fill Annual Kit for {(selectedChild.name || '').split(' ')[0]}</span>
                  </button>
                </div>
              )}
            </>
          )}
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
            {orders.length === 0 ? (
              <div className="py-6 px-4 text-center bg-surface-container-low rounded-xl border border-surface-container flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-outline">receipt_long</span>
                <p className="text-[13px] font-bold text-primary">No Uniform Orders Placed Yet</p>
                <p className="text-[11px] text-on-surface-variant max-w-xs">
                  Orders placed from the school store will appear here with live consignment tracking and downloadable GST tax invoices.
                </p>
                <button
                  onClick={() => onNavigate('store')}
                  className="mt-1 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-[11px] font-bold hover:bg-primary-container transition-colors cursor-pointer"
                >
                  Explore School Catalog
                </button>
              </div>
            ) : (
              orders.map((order) => (
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
                      className="px-2.5 py-1 bg-surface-container-lowest text-primary rounded text-[11px] font-bold hover:bg-surface-container border border-surface-container cursor-pointer"
                    >
                      Track Status
                    </button>
                    <button
                      onClick={() => onOpenInvoice(order)}
                      className="px-2.5 py-1 bg-primary text-on-primary rounded text-[11px] font-bold hover:bg-primary-container flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs text-secondary-fixed">
                        receipt_long
                      </span>
                      <span>Tax Invoice</span>
                    </button>
                  </div>
                </div>
              ))
            )}
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
