import React, { useState } from 'react';
import { CartItem, School, ActiveScreen, UserAccount } from '../types';

interface CartCheckoutViewProps {
  cart: CartItem[];
  onUpdateQty: (itemId: string, size: string, delta: number) => void;
  onRemoveItem: (itemId: string, size: string) => void;
  activeSchool: School;
  onNavigate: (screen: ActiveScreen) => void;
  onOrderPlaced: (orderId: string) => void;
  onOpenPolicyModal: () => void;
  user?: UserAccount;
  onOpenAddressModal?: () => void;
}

export const CartCheckoutView: React.FC<CartCheckoutViewProps> = ({
  cart,
  onUpdateQty,
  onRemoveItem,
  activeSchool,
  onNavigate,
  onOrderPlaced,
  onOpenPolicyModal,
  user,
  onOpenAddressModal,
}) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(2);
  const [paymentMethod, setPaymentMethod] = useState<
    'upi' | 'card' | 'netbanking' | 'cod'
  >('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.item.price * item.quantity,
    0
  );
  const deliveryCharge = 0; // FREE
  const discount = subtotal > 1500 ? 150 : 0;
  const totalPayable = Math.max(0, subtotal - discount + deliveryCharge);

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const newOrderId = '#MGN-' + Math.floor(10000 + Math.random() * 90000);
      onOrderPlaced(newOrderId);
      onNavigate('track-order');
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full pb-28">
      {/* Checkout Header */}
      <div className="px-4 py-2.5 bg-surface-container-lowest shadow-xs border-b border-surface-container flex items-center justify-between">
        <button
          onClick={() => onNavigate('store')}
          className="flex items-center gap-1.5 text-primary hover:text-secondary font-bold text-[14px]"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
          <span>School Store</span>
        </button>
        <h1 className="text-[15px] font-bold text-primary">Checkout Flow</h1>
        <div className="w-8"></div>
      </div>

      <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
        {/* Magnum Institutional School Lock Banner */}
        <div className="bg-primary text-on-primary px-4 py-3 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center shrink-0">
                <span
                  className="material-symbols-outlined text-secondary-container text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-secondary-container uppercase tracking-wider block font-bold leading-tight">
                  Authorized School Store
                </span>
                <p className="text-[15px] font-bold text-on-primary truncate">
                  {activeSchool.name}
                </p>
              </div>
            </div>
            <button
              onClick={onOpenPolicyModal}
              aria-label="Order compliance policy"
              className="shrink-0 flex items-center justify-center p-1.5 rounded-lg text-secondary-container hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                info
              </span>
            </button>
          </div>
        </div>

        {/* Single-School Institutional Cart Notice */}
        <div className="bg-surface-container-low px-4 py-2 flex items-center gap-2 shadow-xs border-b border-surface-container/60">
          <span
            className="material-symbols-outlined text-secondary shrink-0 text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            lock
          </span>
          <p className="text-[12px] text-on-surface-variant flex-1">
            Cart restricted to{' '}
            <strong className="text-on-surface">{activeSchool.name}</strong>.
            Uniforms from multiple institutions cannot be consolidated.
          </p>
        </div>

        <div className="px-4 flex flex-col gap-4">
          {/* Multi-Step Checkout Stepper */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container">
            <div className="flex items-center justify-between relative max-w-sm mx-auto">
              {/* Connecting Progress Tracks */}
              <div className="absolute top-4 left-6 right-6 h-[2px] bg-surface-container -z-0"></div>
              <div
                className={`absolute top-4 left-6 h-[2px] bg-primary -z-0 transition-all duration-300 ${
                  activeStep === 1
                    ? 'w-0'
                    : activeStep === 2
                    ? 'w-1/2'
                    : 'w-full'
                }`}
              ></div>

              {/* Step 1: Delivery Address */}
              <button
                onClick={() => setActiveStep(1)}
                className="flex flex-col items-center gap-1 z-10"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-colors ${
                    activeStep >= 1
                      ? 'bg-primary text-secondary-container'
                      : 'bg-surface-container text-outline'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-base"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-on-surface">
                  Address
                </span>
              </button>

              {/* Step 2: Order Review */}
              <button
                onClick={() => setActiveStep(2)}
                className="flex flex-col items-center gap-1 z-10"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-colors ${
                    activeStep === 2
                      ? 'bg-secondary-container text-primary font-bold'
                      : activeStep > 2
                      ? 'bg-primary text-secondary-container'
                      : 'bg-surface-container text-outline'
                  }`}
                >
                  <span className="text-[13px] font-bold">2</span>
                </div>
                <span
                  className={`text-[11px] ${
                    activeStep === 2
                      ? 'font-bold text-primary'
                      : 'text-on-surface'
                  }`}
                >
                  Review
                </span>
              </button>

              {/* Step 3: Payment */}
              <button
                onClick={() => setActiveStep(3)}
                className="flex flex-col items-center gap-1 z-10"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    activeStep === 3
                      ? 'bg-secondary-container text-primary font-bold'
                      : 'bg-surface-container text-outline'
                  }`}
                >
                  <span className="text-[13px] font-medium">3</span>
                </div>
                <span
                  className={`text-[11px] ${
                    activeStep === 3 ? 'font-bold text-primary' : 'text-outline'
                  }`}
                >
                  Payment
                </span>
              </button>
            </div>
          </div>

          {/* Cart Items Section */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-primary">
                Your Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)} Items)
              </h2>
              <span className="text-[11px] bg-secondary-container/30 text-secondary px-2.5 py-0.5 rounded-full font-bold">
                CBSE Pattern Verified
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="bg-surface-container-lowest p-8 rounded-xl shadow-xs border border-surface-container text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl text-outline">
                  shopping_bag
                </span>
                <p className="text-[14px] font-bold text-primary">
                  Your cart is currently empty
                </p>
                <p className="text-[12px] text-on-surface-variant">
                  Explore approved uniform sets for {activeSchool.name}
                </p>
                <button
                  onClick={() => onNavigate('store')}
                  className="mt-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-[13px] font-bold"
                >
                  Go to School Store
                </button>
              </div>
            ) : (
              cart.map((cartItem) => (
                <div
                  key={`${cartItem.item.id}-${cartItem.size}`}
                  className="bg-surface-container-lowest p-3.5 rounded-xl shadow-xs border border-surface-container flex flex-col gap-2 transition-all"
                >
                  <div className="flex gap-3">
                    <div className="w-20 h-24 rounded-lg bg-surface-container overflow-hidden shrink-0 shadow-inner">
                      <img
                        src={cartItem.item.image}
                        alt={cartItem.item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="text-[14px] font-bold text-primary line-clamp-2 leading-tight">
                            {cartItem.item.name}
                          </h3>
                          <button
                            onClick={() =>
                              onRemoveItem(cartItem.item.id, cartItem.size)
                            }
                            aria-label="Remove item"
                            className="text-outline hover:text-error p-1 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete_outline
                            </span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="bg-surface-container px-2 py-0.5 rounded text-on-surface text-[11px] font-semibold">
                            Size: {cartItem.size}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {cartItem.item.fabricBlend || 'Standard Weave'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-surface-container/50">
                        <div className="flex flex-col">
                          <span className="text-[15px] font-bold text-primary">
                            ₹{(cartItem.item.price * cartItem.quantity).toLocaleString(
                              'en-IN'
                            )}
                          </span>
                          <span className="text-[10px] text-outline">
                            ₹{cartItem.item.price} each
                          </span>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center bg-surface-container rounded-lg p-1 gap-2">
                          <button
                            onClick={() =>
                              onUpdateQty(cartItem.item.id, cartItem.size, -1)
                            }
                            className="w-6 h-6 flex items-center justify-center bg-surface-container-lowest rounded text-primary hover:bg-surface-container-high transition-colors active:scale-95 shadow-xs"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              remove
                            </span>
                          </button>
                          <span className="text-[12px] font-bold text-primary w-4 text-center">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() =>
                              onUpdateQty(cartItem.item.id, cartItem.size, 1)
                            }
                            className="w-6 h-6 flex items-center justify-center bg-surface-container-lowest rounded text-primary hover:bg-surface-container-high transition-colors active:scale-95 shadow-xs"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              add
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Student Delivery Destination */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-secondary text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_shipping
                </span>
                <span className="text-[14px] font-bold text-primary">
                  Shipping Destination
                </span>
              </div>
              <button
                onClick={() => {
                  if (onOpenAddressModal) {
                    onOpenAddressModal();
                  } else {
                    onNavigate('account');
                  }
                }}
                className="text-[12px] text-secondary font-bold hover:underline"
              >
                Change
              </button>
            </div>

            <div className="bg-surface-container-low p-3 rounded-lg flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-primary">
                  {user?.defaultAddress?.fullName || user?.name || 'Rajesh Sharma'}
                </span>
                <span className="bg-surface-container text-on-surface-variant text-[11px] px-2 py-0.5 rounded font-semibold">
                  {user?.defaultAddress?.tag || 'Home'}
                </span>
              </div>
              <p className="text-[13px] text-on-surface-variant leading-relaxed">
                {user?.defaultAddress
                  ? `${user.defaultAddress.flat}, ${user.defaultAddress.street}, ${user.defaultAddress.city}, Maharashtra - ${user.defaultAddress.pincode}`
                  : 'Flat 402, Royal Palms, Koregaon Park, Pune, Maharashtra - 411001'}
              </p>
              <div className="flex items-center gap-1.5 text-outline text-[12px] mt-1">
                <span className="material-symbols-outlined text-sm">call</span>
                <span className="text-on-surface font-semibold">
                  {user?.defaultAddress?.phone || user?.phone || '+91 98201 49201'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-secondary text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  account_balance_wallet
                </span>
                <span className="text-[14px] font-bold text-primary">
                  Payment Method
                </span>
              </div>
              <div className="flex items-center gap-1 bg-secondary-container/20 text-secondary px-2.5 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-xs">
                  security
                </span>
                <span className="text-[11px] font-bold">256-Bit SSL</span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="flex flex-col gap-2">
              {/* Option 1: UPI */}
              <label
                onClick={() => setPaymentMethod('upi')}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                  paymentMethod === 'upi'
                    ? 'bg-surface-container-low border-secondary shadow-xs'
                    : 'bg-surface-container-lowest border-surface-container hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      paymentMethod === 'upi'
                        ? 'bg-primary'
                        : 'bg-surface-container'
                    }`}
                  >
                    {paymentMethod === 'upi' && (
                      <div className="w-2 h-2 rounded-full bg-secondary-container"></div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-primary">
                      UPI Instant Transfer
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Google Pay, PhonePe, Paytm, BHIM
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-secondary text-[22px]">
                  qr_code_scanner
                </span>
              </label>

              {/* Option 2: Cards */}
              <label
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                  paymentMethod === 'card'
                    ? 'bg-surface-container-low border-secondary shadow-xs'
                    : 'bg-surface-container-lowest border-surface-container hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      paymentMethod === 'card'
                        ? 'bg-primary'
                        : 'bg-surface-container'
                    }`}
                  >
                    {paymentMethod === 'card' && (
                      <div className="w-2 h-2 rounded-full bg-secondary-container"></div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-primary">
                      Credit / Debit Card
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Visa, Mastercard, RuPay
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[22px]">
                  credit_card
                </span>
              </label>

              {/* Option 3: Net Banking */}
              <label
                onClick={() => setPaymentMethod('netbanking')}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                  paymentMethod === 'netbanking'
                    ? 'bg-surface-container-low border-secondary shadow-xs'
                    : 'bg-surface-container-lowest border-surface-container hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      paymentMethod === 'netbanking'
                        ? 'bg-primary'
                        : 'bg-surface-container'
                    }`}
                  >
                    {paymentMethod === 'netbanking' && (
                      <div className="w-2 h-2 rounded-full bg-secondary-container"></div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-primary">
                      Net Banking
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      HDFC, ICICI, SBI & all major banks
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[22px]">
                  account_balance
                </span>
              </label>

              {/* Option 4: COD */}
              <label
                onClick={() => setPaymentMethod('cod')}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                  paymentMethod === 'cod'
                    ? 'bg-surface-container-low border-secondary shadow-xs'
                    : 'bg-surface-container-lowest border-surface-container hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      paymentMethod === 'cod'
                        ? 'bg-primary'
                        : 'bg-surface-container'
                    }`}
                  >
                    {paymentMethod === 'cod' && (
                      <div className="w-2 h-2 rounded-full bg-secondary-container"></div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-primary">
                      Cash on Delivery
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Verified uniform handoff
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[22px]">
                  payments
                </span>
              </label>
            </div>

            {/* Trust Footer */}
            <div className="flex items-center justify-center gap-1.5 pt-1 text-outline text-[12px]">
              <span className="material-symbols-outlined text-secondary text-sm">
                lock
              </span>
              <span>100% Secure 256-bit SSL Encrypted Payment</span>
            </div>
          </div>

          {/* Institutional Guarantee 3-Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-surface-container-lowest p-2.5 rounded-lg flex flex-col items-center text-center gap-1 border border-surface-container shadow-xs">
              <span className="material-symbols-outlined text-secondary text-lg">
                shield
              </span>
              <span className="text-[11px] text-primary font-bold leading-tight">
                Fabric Durability
              </span>
            </div>
            <div className="bg-surface-container-lowest p-2.5 rounded-lg flex flex-col items-center text-center gap-1 border border-surface-container shadow-xs">
              <span className="material-symbols-outlined text-secondary text-lg">
                check_circle
              </span>
              <span className="text-[11px] text-primary font-bold leading-tight">
                Approved Pattern
              </span>
            </div>
            <div className="bg-surface-container-lowest p-2.5 rounded-lg flex flex-col items-center text-center gap-1 border border-surface-container shadow-xs">
              <span className="material-symbols-outlined text-secondary text-lg">
                published_with_changes
              </span>
              <span className="text-[11px] text-primary font-bold leading-tight">
                7-Day Exchange
              </span>
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container flex flex-col gap-2.5 mb-2">
            <span className="text-[14px] font-bold text-primary">
              Order Summary
            </span>
            <div className="flex flex-col gap-1.5 text-on-surface-variant text-[13px]">
              <div className="flex items-center justify-between">
                <span>Items Subtotal</span>
                <span className="text-on-surface font-semibold">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span>School Delivery Charge</span>
                  <span className="material-symbols-outlined text-outline text-xs">
                    info
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="line-through text-outline text-[11px]">
                    ₹49
                  </span>
                  <span className="text-secondary font-bold">FREE</span>
                </div>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-secondary">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      loyalty
                    </span>
                    <span>School Season Discount</span>
                  </div>
                  <span className="font-bold">-₹{discount}</span>
                </div>
              )}
              <div className="h-[1px] bg-surface-container my-1"></div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-primary">
                    Total Payable
                  </span>
                  <span className="text-[11px] text-outline">
                    Inclusive of all institutional GST
                  </span>
                </div>
                <span className="text-[22px] font-bold text-primary">
                  ₹{totalPayable.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest p-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] border-t border-surface-container">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-outline">Total Amount</span>
            <span className="text-[20px] font-bold text-primary leading-tight">
              ₹{totalPayable.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={cart.length === 0 || isProcessing}
            className="flex-1 max-w-xs bg-primary text-on-primary py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 text-[14px] font-bold shadow-md hover:bg-primary-container active:scale-[0.99] transition-all relative overflow-hidden group disabled:opacity-50"
          >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-secondary-container"></div>
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined text-secondary-container text-base animate-spin">
                  progress_activity
                </span>
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <span>Place Order</span>
                <span className="material-symbols-outlined text-secondary-container text-base group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
