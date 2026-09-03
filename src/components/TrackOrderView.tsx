import React, { useState } from 'react';
import { Order, ActiveScreen, UserAccount } from '../types';
import { MagnumLogo } from './MagnumLogo';
import { getOrderByIdFromDb } from '../services/dbService';

interface TrackOrderViewProps {
  orders: Order[];
  user?: UserAccount;
  onNavigate: (screen: ActiveScreen) => void;
  onShowToast: (msg: string) => void;
  onOpenInvoice?: (order: Order) => void;
  onOpenExchange?: (order: Order) => void;
  onOpenSupport?: () => void;
  onChangeAddress?: () => void;
}

export const TrackOrderView: React.FC<TrackOrderViewProps> = ({
  orders,
  user,
  onNavigate,
  onShowToast,
  onOpenInvoice,
  onOpenExchange,
  onOpenSupport,
  onChangeAddress,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const activeOrders = orders;
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orders[0]?.id || ''
  );

  const currentOrder = searchedOrder || activeOrders.find((o) => o.id === selectedOrderId) || activeOrders[0];

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      onShowToast('Please enter an Order ID or Consignment Number');
      return;
    }
    const cleanQuery = searchQuery.trim();
    setIsSearching(true);

    const foundLocal = activeOrders.find(
      (o) => o.id.toLowerCase() === cleanQuery.toLowerCase() || o.id.toLowerCase().includes(cleanQuery.toLowerCase())
    );

    if (foundLocal) {
      setSearchedOrder(foundLocal);
      setSelectedOrderId(foundLocal.id);
      setIsSearching(false);
      onShowToast(`Consignment found: ${foundLocal.id}`);
      return;
    }

    try {
      const liveOrder = await getOrderByIdFromDb(cleanQuery);
      if (liveOrder) {
        setSearchedOrder(liveOrder);
        setSelectedOrderId(liveOrder.id);
        onShowToast(`Consignment found: ${liveOrder.id}`);
      } else {
        setSearchedOrder(null);
        onShowToast(`No order found with ID "${cleanQuery}". Please verify your Order ID.`);
      }
    } catch (err) {
      console.error('Error searching order:', err);
      onShowToast('Error connecting to database. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!currentOrder) return;
    if (onOpenInvoice) {
      onOpenInvoice(currentOrder);
    } else {
      onNavigate('invoice');
    }
  };

  const handleExchangeRequest = () => {
    if (!currentOrder) return;
    if (onOpenExchange) {
      onOpenExchange(currentOrder);
    } else {
      onShowToast(`Exchange request initiated for ${currentOrder.id}.`);
    }
  };

  return (
    <div className="flex flex-col w-full pb-24">
      {/* Top Header */}
      <div className="px-4 py-2.5 bg-surface-container-lowest shadow-xs border-b border-surface-container flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 text-primary hover:text-secondary font-bold text-[14px]"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
          <span>Home</span>
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-bold text-primary">
            Track Consignment
          </span>
          <span className="text-[10px] bg-secondary-fixed text-primary px-1.5 py-0.5 rounded font-bold">
            {currentOrder ? currentOrder.id : 'Guest'}
          </span>
        </div>
        <button
          onClick={() => {
            if (onOpenSupport) onOpenSupport();
            else onShowToast('Connecting to Support Desk...');
          }}
          className="text-secondary text-[12px] font-bold flex items-center gap-0.5"
        >
          <span className="material-symbols-outlined text-sm">help</span>
          <span>Help</span>
        </button>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 pt-3 flex flex-col gap-4">
        {/* Guest Track Search Bar */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">
              search
            </span>
            <span className="text-[14px] font-bold text-primary">
              Track Order by ID / Consignment Number
            </span>
          </div>
          <form onSubmit={handleSearchOrder} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. #MGN-84920"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-surface-container-low border border-surface-container rounded-lg px-3 py-2 text-[13px] text-primary focus:outline-none focus:border-secondary"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-[13px] font-bold shadow-xs hover:bg-primary-container transition-colors"
            >
              Track
            </button>
          </form>
          {orders.length === 0 && !searchedOrder && (
            <div className="text-[11px] text-on-surface-variant flex items-center justify-between pt-1">
              {user && user.role !== 'guest' ? (
                <>
                  <span className="text-primary font-medium">
                    Signed in as <strong className="text-secondary">{user.email}</strong>. No orders linked to this account yet.
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('home')}
                    className="text-secondary font-bold hover:underline"
                  >
                    Browse Catalog
                  </button>
                </>
              ) : (
                <>
                  <span>Enter your institutional order reference ID above</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="text-secondary font-bold hover:underline"
                  >
                    Sign In to View All Orders
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {/* Order Selector Tab Strip if multiple orders */}
        {orders.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {orders.map((ord) => (
              <button
                key={ord.id}
                onClick={() => setSelectedOrderId(ord.id)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                  ord.id === selectedOrderId
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <span>{ord.id}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    ord.status === 'in-transit' ? 'bg-secondary' : 'bg-outline'
                  }`}
                ></span>
              </button>
            ))}
          </div>
        )}

        {!currentOrder ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-xs border border-surface-container text-center flex flex-col items-center gap-4 my-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary-fixed/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-3xl">
                {user && user.role !== 'guest' ? 'receipt_long' : 'local_shipping'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-[16px] font-bold text-primary">
                {user && user.role !== 'guest' ? 'No Orders Linked to Account' : 'Ready to Track Consignment'}
              </h3>
              <p className="text-[13px] text-on-surface-variant max-w-sm">
                {user && user.role !== 'guest' ? (
                  <>
                    You are signed in as <strong className="text-primary">{user.email}</strong>. No orders are currently associated with this account. Enter an Order ID above or browse the catalog.
                  </>
                ) : (
                  <>
                    Enter your Order ID (e.g. #MGN-84920) in the search box above to view real-time production and courier status, or sign in to your parent account.
                  </>
                )}
              </p>
            </div>
            {user && user.role !== 'guest' ? (
              <button
                onClick={() => onNavigate('home')}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-[13px] font-bold shadow-xs hover:bg-primary-container transition-colors cursor-pointer"
              >
                Browse Uniform Catalog
              </button>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-[13px] font-bold shadow-xs hover:bg-primary-container transition-colors cursor-pointer"
              >
                Sign In to Parent Account
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Order Selector Tab Strip if multiple orders */}
            {orders.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {orders.map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                      ord.id === selectedOrderId
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>{ord.id}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        ord.status === 'in-transit' ? 'bg-secondary' : 'bg-outline'
                      }`}
                    ></span>
                  </button>
                ))}
              </div>
            )}

            {/* Active Order Status Hero Card */}
            <div className="bg-primary text-on-primary rounded-2xl p-5 shadow-md flex flex-col gap-3 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-secondary-fixed uppercase tracking-wider font-bold">
                {currentOrder.statusText}
              </span>
              <h2 className="text-[20px] font-extrabold text-white leading-tight">
                {currentOrder.estimatedArrival}
              </h2>
              <span className="text-[12px] text-on-primary/80">
                School Courier: Express Logistics • AWB #902184910
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary-fixed/20 flex items-center justify-center text-secondary-fixed shrink-0">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_shipping
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary-fixed text-sm">
                school
              </span>
              <span className="font-semibold text-white">
                {currentOrder.studentName} ({currentOrder.studentGrade})
              </span>
            </div>
            <span className="text-secondary-fixed font-bold">
              {currentOrder.school}
            </span>
          </div>

          <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-secondary-fixed/10 pointer-events-none"></div>
        </div>

        {/* Detailed 6-Step Institutional Fulfillment Timeline */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-primary">
              Institutional Fulfillment Timeline
            </h3>
            <span className="text-[11px] text-secondary font-bold bg-secondary-fixed/30 px-2 py-0.5 rounded-full">
              Live {(currentOrder.school || '').split(',')[0]} Dispatch Log
            </span>
          </div>

          <div className="flex flex-col gap-0 relative pl-2 pt-1">
            {/* Step 1 */}
            <div className="flex items-start gap-3 relative pb-6">
              <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-secondary"></div>
              <div className="w-6 h-6 rounded-full bg-primary text-secondary-fixed flex items-center justify-center shrink-0 z-10 shadow-xs">
                <span className="material-symbols-outlined text-xs">check</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-primary">
                  Order Placed & Payment Confirmed
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {currentOrder.date} • Prepaid UPI Verified
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 relative pb-6">
              <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-secondary"></div>
              <div className="w-6 h-6 rounded-full bg-primary text-secondary-fixed flex items-center justify-center shrink-0 z-10 shadow-xs">
                <span className="material-symbols-outlined text-xs">check</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-primary">
                  School Pattern Verification
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Matched against DPS 2025-26 official dress code regulations
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 relative pb-6">
              <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-secondary"></div>
              <div className="w-6 h-6 rounded-full bg-primary text-secondary-fixed flex items-center justify-center shrink-0 z-10 shadow-xs">
                <span className="material-symbols-outlined text-xs">check</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-primary">
                  Master Tailoring & Crest Embroidery
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Precision computerized bullion crest stitched onto breast
                  pocket
                </span>
              </div>
            </div>

            {/* Step 4 (Current / Active) */}
            <div className="flex items-start gap-3 relative pb-6">
              <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-surface-container"></div>
              <div className="w-6 h-6 rounded-full bg-secondary text-primary flex items-center justify-center shrink-0 z-10 shadow-xs ring-4 ring-secondary-fixed/40 animate-pulse">
                <span className="material-symbols-outlined text-xs font-bold">
                  local_shipping
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-primary flex items-center gap-1.5">
                  <span>Dispatched & In Transit</span>
                  <span className="text-[9px] bg-secondary text-primary font-bold px-1.5 py-0.2 rounded uppercase">
                    Current
                  </span>
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  In transit via Magnum School Direct Fleet to Koregaon Park Hub
                </span>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start gap-3 relative pb-6">
              <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-surface-container"></div>
              <div className="w-6 h-6 rounded-full bg-surface-container text-outline flex items-center justify-center shrink-0 z-10">
                <span className="text-[11px] font-bold">5</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-outline">
                  Out for Delivery
                </span>
                <span className="text-[11px] text-outline">
                  Expected tomorrow by 2:00 PM
                </span>
              </div>
            </div>

            {/* Step 6 */}
            <div className="flex items-start gap-3 relative">
              <div className="w-6 h-6 rounded-full bg-surface-container text-outline flex items-center justify-center shrink-0 z-10">
                <span className="text-[11px] font-bold">6</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-outline">
                  Delivered & Fit Trial Verification
                </span>
                <span className="text-[11px] text-outline">
                  7-Day instantaneous size replacement active upon delivery
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Consignment Items Card */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-primary">
              Items in Consignment ({currentOrder.items.length})
            </h3>
            <span className="text-[11px] text-outline font-semibold">
              School Sealed
            </span>
          </div>

          <div className="flex flex-col gap-2.5 divide-y divide-surface-container/60">
            {currentOrder.items.map((item, idx) => (
              <div key={idx} className="flex gap-3 pt-2.5 first:pt-0">
                <div className="w-16 h-18 rounded-lg bg-surface-container overflow-hidden shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[13px] font-bold text-primary leading-tight">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-on-surface-variant">
                      {item.spec}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] font-bold bg-surface-container px-2 py-0.5 rounded text-primary">
                      Size: {item.size} • Qty: {item.qty}
                    </span>
                    <span className="text-[13px] font-bold text-primary">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address & Contact Card */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-lg">
                home_pin
              </span>
              <h3 className="text-[13px] font-bold text-primary">
                Shipping Destination
              </h3>
            </div>
            {onChangeAddress ? (
              <button
                onClick={onChangeAddress}
                className="text-[11px] text-secondary font-bold hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-xs">edit</span>
                <span>Update Address</span>
              </button>
            ) : (
              <span className="text-[11px] text-outline">Verified Address</span>
            )}
          </div>
          <p className="text-[12px] text-on-surface-variant leading-relaxed">
            {currentOrder.shippingAddress}
          </p>
          {Boolean(currentOrder.contactNumber?.trim()) && (
            <div className="flex items-center gap-1 text-[11px] text-primary font-semibold mt-1">
              <span className="material-symbols-outlined text-xs">call</span>
              <span>{currentOrder.contactNumber}</span>
            </div>
          )}
        </div>

        {/* Invoice & Exchange Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleDownloadInvoice}
            className="flex-1 h-11 bg-surface-container-lowest text-primary rounded-lg border border-surface-container shadow-xs text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base text-secondary">
              receipt_long
            </span>
            <span>Download School Tax Invoice</span>
          </button>

          <button
            onClick={handleExchangeRequest}
            className="flex-1 h-11 bg-surface-container text-primary rounded-lg shadow-xs text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-base text-secondary">
              sync_alt
            </span>
            <span>Request Size Exchange</span>
          </button>
        </div>

        {/* Need Help Card */}
        <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow-xs">
              <span className="material-symbols-outlined text-base">
                support_agent
              </span>
            </div>
            <div>
              <span className="text-[12px] font-bold text-primary block">
                Have questions about your uniform?
              </span>
              <span className="text-[11px] text-on-surface-variant">
                Magnum Institutional Helpdesk • Available 9 AM - 7 PM
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              if (onOpenSupport) onOpenSupport();
              else onShowToast('Connecting to WhatsApp Uniform Coordinator...');
            }}
            className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-[11px] font-bold shrink-0 shadow-xs active:scale-95 transition-transform"
          >
            Chat Now
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
};
