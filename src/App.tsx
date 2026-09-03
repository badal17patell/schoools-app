/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ActiveScreen,
  School,
  UniformItem,
  CartItem,
  Order,
  ChildProfile,
  UserAccount,
  Address,
  ExchangeRequest,
} from './types';
import { SCHOOLS } from './data/schools';
import { UNIFORM_ITEMS } from './data/products';
import { INITIAL_ORDERS } from './data/orders';
import { INITIAL_PROFILES } from './data/profiles';
import {
  onAuthChange,
  subscribeToOrders,
  subscribeToProfiles,
  createOrderInDb,
  updateOrderStatusInDb,
  saveProfileInDb,
  updateUserProfileInDb,
  submitExchangeRequest,
} from './services/dbService';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Modals } from './components/Modals';

import { HomeView } from './components/HomeView';
import { SchoolStoreView } from './components/SchoolStoreView';
import { ProductDetailsView } from './components/ProductDetailsView';
import { CartCheckoutView } from './components/CartCheckoutView';
import { TrackOrderView } from './components/TrackOrderView';
import { AccountProfilesView } from './components/AccountProfilesView';
import { AdminTailorView } from './components/AdminTailorView';
import { LoginView } from './components/LoginView';
import { TaxInvoiceView } from './components/TaxInvoiceView';
import { ExchangeModal } from './components/ExchangeModal';
import { AddChildModal } from './components/AddChildModal';
import { AddressModal } from './components/AddressModal';
import { SupportModal } from './components/SupportModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('home');
  const [activeSchool, setActiveSchool] = useState<School>(SCHOOLS[0]);
  const [selectedProduct, setSelectedProduct] = useState<UniformItem>(UNIFORM_ITEMS[0]);
  const [selectedProductSize, setSelectedProductSize] = useState<string>('32');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Current authenticated user account state
  const [user, setUser] = useState<UserAccount>({
    id: 'usr-rajesh',
    name: 'Rajesh Sharma',
    phone: '+91 98201 49201',
    email: 'rajesh.sharma@example.com',
    role: 'parent',
    isLoggedIn: true,
    avatarUrl:
      'https://lh3.googleusercontent.com/aida/AEtjO1WdqKYFtNkOBysM4Y6KvU8SkPiXYGwzzrxfu5XdFg1MmmpSuxRaKjJXDDVqUw05mPCNIvZJ7rBGTHy0cqnUePCIuwGroE4jgLW8BQ4T_4Aswi9Td61Bj8nPCmv2GHuwjB7TxagLd4dqBnasGe2GNhsJvVAfBY9JbFzSzeOXoFD8urFIkT_DEOZN8_Dyj2KCBNCILm5eBIx9lHXpDCZgnpVsNAKXe_lmp7wdkPmUfJYRyn7-7rUOFX2-q4UQr29MGJVQOv2cjuc0rg',
    defaultAddress: {
      id: 'addr-1',
      fullName: 'Rajesh Sharma',
      phone: '+91 98201 49201',
      flat: 'Flat 402, Royal Palms Apartments',
      street: 'Lane 5, Koregaon Park',
      city: 'Pune',
      pincode: '411001',
      tag: 'Home',
    },
  });

  // Cart initialized with the 2 items from screen 2 for an instant authentic experience
  const [cart, setCart] = useState<CartItem[]>([
    {
      item: UNIFORM_ITEMS[0], // White Shirt
      size: '32',
      quantity: 1,
    },
    {
      item: UNIFORM_ITEMS[2], // Formal Trousers Navy / Grey
      size: '30',
      quantity: 1,
    },
  ]);

  // Orders and profiles
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [profiles, setProfiles] = useState<ChildProfile[]>(INITIAL_PROFILES);

  // Selected Order for Tax Invoice and Exchange
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order>(INITIAL_ORDERS[0]);
  const [selectedExchangeOrder, setSelectedExchangeOrder] = useState<Order | null>(null);

  // Modals & Toast State
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isFitQuizOpen, setIsFitQuizOpen] = useState(false);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Real Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time Cloud Firestore Orders
  useEffect(() => {
    const unsubscribe = subscribeToOrders(user?.id, user?.role || 'parent', (liveOrders) => {
      if (liveOrders && liveOrders.length > 0) {
        setOrders(liveOrders);
        setSelectedInvoiceOrder((prev) => {
          const match = liveOrders.find((o) => o.id === prev?.id);
          return match || liveOrders[0];
        });
      }
    });
    return () => unsubscribe();
  }, [user?.id, user?.role]);

  // Subscribe to real-time Cloud Firestore Student Profiles
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = subscribeToProfiles(user.id, (liveProfiles) => {
      if (liveProfiles && liveProfiles.length > 0) {
        setProfiles(liveProfiles);
      }
    });
    return () => unsubscribe();
  }, [user?.id]);

  // Cart operations
  const handleAddToCart = (item: UniformItem, size: string, quantity = 1) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (ci) => ci.item.id === item.id && ci.size === size
      );
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += quantity;
        return copy;
      } else {
        return [...prev, { item, size, quantity }];
      }
    });
    showToast(`Added ${item.name} (Size ${size}) to Cart`);
  };

  const handleUpdateQty = (itemId: string, size: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.item.id === itemId && ci.size === size) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (itemId: string, size: string) => {
    setCart((prev) =>
      prev.filter((ci) => !(ci.item.id === itemId && ci.size === size))
    );
    showToast('Item removed from cart');
  };

  const handleOpenProduct = (product: UniformItem, size: string) => {
    setSelectedProduct(product);
    setSelectedProductSize(size);
    setCurrentScreen('product-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBuyNow = (product: UniformItem, size: string) => {
    handleAddToCart(product, size, 1);
    setCurrentScreen('cart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenInvoice = (order: Order) => {
    setSelectedInvoiceOrder(order);
    setCurrentScreen('invoice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenExchange = (order: Order) => {
    setSelectedExchangeOrder(order);
  };

  const handleConfirmExchange = async (details: {
    itemName: string;
    currentSize: string;
    requestedSize: string;
    reason: string;
    pickupMode: 'Doorstep Courier Swap' | 'School Uniform Depot Pickup';
  }) => {
    if (!selectedExchangeOrder) return;
    const reqId = `EXC-${Date.now().toString().slice(-5)}`;
    const newReq: ExchangeRequest = {
      id: reqId,
      orderId: selectedExchangeOrder.id,
      userId: user.id || 'usr-rajesh',
      studentName: selectedExchangeOrder.studentName,
      itemName: details.itemName,
      currentSize: details.currentSize,
      requestedSize: details.requestedSize,
      reason: details.reason,
      pickupMode: details.pickupMode,
      status: 'Initiated',
      requestDate: new Date().toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    try {
      await submitExchangeRequest(newReq, user.id || 'usr-rajesh');
    } catch (err) {
      console.warn('submitExchangeRequest error:', err);
    }
    showToast(`Exchange request ${reqId} lodged with Master Tailor!`);
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: Order['status'],
    statusText: string,
    step: number
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: newStatus, statusText, timelineStep: step }
          : o
      )
    );
    try {
      await updateOrderStatusInDb(orderId, newStatus, statusText, step);
    } catch (err) {
      console.warn('updateOrderStatusInDb error:', err);
    }
  };

  const handleAddChild = async (newProfile: ChildProfile) => {
    setProfiles((prev) => [newProfile, ...prev]);
    if (user?.id) {
      try {
        await saveProfileInDb(newProfile, user.id);
      } catch (err) {
        console.warn('saveProfileInDb error:', err);
      }
    }
    showToast(`Added ${newProfile.name} (${newProfile.grade}) to enrolled students!`);
  };

  const handleSaveAddress = async (newAddr: Address) => {
    setUser((prev) => ({ ...prev, defaultAddress: newAddr }));
    if (user?.id) {
      try {
        await updateUserProfileInDb(user.id, { defaultAddress: newAddr });
      } catch (err) {
        console.warn('updateUserProfileInDb error:', err);
      }
    }
    showToast('Shipping destination updated successfully.');
  };

  const handleLoginSuccess = (account: Partial<UserAccount>) => {
    setUser((prev) => ({
      ...prev,
      ...account,
      id: account.id || prev.id,
      name: account.name || prev.name,
      role: account.role || prev.role,
      isLoggedIn: account.isLoggedIn !== undefined ? account.isLoggedIn : true,
      defaultAddress: account.defaultAddress || prev.defaultAddress,
    }));
    showToast(`Welcome back, ${account.name || 'Parent'}!`);
    setCurrentScreen('account');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderPlaced = (newOrderId: string) => {
    const formattedAddr = user.defaultAddress
      ? `${user.defaultAddress.flat}, ${user.defaultAddress.street}, ${user.defaultAddress.city} - ${user.defaultAddress.pincode}`
      : 'Flat 402, Royal Palms Apartments, Lane 5, Koregaon Park, Pune - 411001';

    const newOrder: Order = {
      id: newOrderId,
      date: 'Today, Just now',
      estimatedArrival: 'In 3-4 Days • by 5:00 PM',
      total: cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0),
      totalAmount: cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0),
      paymentMethod: 'UPI Instant Verified',
      studentName: profiles[0]?.name || 'Aarav Sharma',
      studentGrade: profiles[0]?.grade || 'Grade 6',
      school: activeSchool.name,
      house: 'Institutional Allocation',
      shippingAddress: formattedAddr,
      contactNumber: user.phone || '+91 98201 49201',
      statusText: 'ORDER PLACED & VERIFIED',
      status: 'in-transit',
      timelineStep: 1,
      items: cart.map((ci) => ({
        name: ci.item.name,
        spec: ci.item.fabricBlend || 'Standard School Weave',
        size: ci.size,
        qty: ci.quantity,
        price: ci.item.price,
        image: ci.item.image,
        patternVerified: true,
      })),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setSelectedInvoiceOrder(newOrder);
    setCart([]);
    showToast(`Order ${newOrderId} placed successfully!`);

    // Persist immediately to Cloud Firestore database
    if (user?.id) {
      createOrderInDb(newOrder, user.id, user.email).catch((err) => {
        console.warn('createOrderInDb error:', err);
      });
    }
  };

  const handleQuickReorder = (profile: ChildProfile) => {
    const shirt = UNIFORM_ITEMS[0];
    const trousers = UNIFORM_ITEMS[2];
    const blazer = UNIFORM_ITEMS[3];
    const size = profile.sizes?.shirt ? profile.sizes.shirt.replace('Size ', '') : '32';
    const trouSize = profile.sizes?.trousers ? profile.sizes.trousers.replace('Size ', '') : '30';

    setCart([
      { item: shirt, size, quantity: 2 },
      { item: trousers, size: trouSize, quantity: 2 },
      { item: blazer, size: '34', quantity: 1 },
    ]);
    showToast(`Pre-filled Annual Uniform Kit for ${profile.name}!`);
    setCurrentScreen('cart');
  };

  const handleApplyFitQuiz = (
    studentName: string,
    height: number,
    weight: number,
    recommendedSize: string
  ) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.name === studentName || p.id === 'aarav') {
          return {
            ...p,
            height: `${height} cm`,
            weight: `${weight} kg`,
            sizes: {
              ...(p.sizes || {}),
              shirt: `Size ${recommendedSize}`,
            },
          };
        }
        return p;
      })
    );
    showToast(`Calculated Size ${recommendedSize} applied for ${studentName}!`);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans antialiased selection:bg-secondary selection:text-primary">
      {/* Header Bar */}
      <Header
        currentScreen={currentScreen}
        onNavigate={(s) => {
          setCurrentScreen(s);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={totalCartCount}
        activeSchool={activeSchool}
        onOpenSearch={() => {
          setCurrentScreen('store');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSupport={() => setIsSupportModalOpen(true)}
        user={user}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-16">
        {currentScreen === 'home' && (
          <HomeView
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            activeSchool={activeSchool}
            onSelectSchool={(s) => {
              setActiveSchool(s);
              showToast(`Active school set to ${s.name}`);
            }}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
          />
        )}

        {currentScreen === 'store' && (
          <SchoolStoreView
            activeSchool={activeSchool}
            onOpenSchoolModal={() => setIsSchoolModalOpen(true)}
            onSelectProduct={handleOpenProduct}
            onAddToCart={handleAddToCart}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {currentScreen === 'product-details' && (
          <ProductDetailsView
            product={selectedProduct}
            initialSize={selectedProductSize}
            activeSchool={activeSchool}
            onBack={() => setCurrentScreen('store')}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
          />
        )}

        {currentScreen === 'cart' && (
          <CartCheckoutView
            cart={cart}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            activeSchool={activeSchool}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOrderPlaced={handleOrderPlaced}
            onOpenPolicyModal={() => setIsPolicyModalOpen(true)}
            user={user}
            onOpenAddressModal={() => setIsAddressModalOpen(true)}
          />
        )}

        {currentScreen === 'track-order' && (
          <TrackOrderView
            orders={orders}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
            onOpenInvoice={handleOpenInvoice}
            onOpenExchange={handleOpenExchange}
            onOpenSupport={() => setIsSupportModalOpen(true)}
            onChangeAddress={() => setIsAddressModalOpen(true)}
          />
        )}

        {currentScreen === 'account' && (
          <AccountProfilesView
            profiles={profiles}
            orders={orders}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenFitQuiz={() => setIsFitQuizOpen(true)}
            onQuickReorder={handleQuickReorder}
            onShowToast={showToast}
            user={user}
            onOpenAddChild={() => setIsAddChildModalOpen(true)}
            onOpenInvoice={handleOpenInvoice}
            onOpenAddressModal={() => setIsAddressModalOpen(true)}
            onSelectOrderToTrack={(orderId) => {
              // Track order view will read the order id
            }}
          />
        )}

        {currentScreen === 'admin' && (
          <AdminTailorView
            activeSchool={activeSchool}
            onSelectSchool={(s) => {
              setActiveSchool(s);
              showToast(`Production switched to ${s.name}`);
            }}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {currentScreen === 'login' && (
          <LoginView
            user={user}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLoginSuccess={handleLoginSuccess}
            activeSchool={activeSchool}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'invoice' && (
          <TaxInvoiceView
            order={selectedInvoiceOrder || orders[0]}
            user={user}
            activeSchool={activeSchool}
            onBack={() => {
              setCurrentScreen('track-order');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Persistent Bottom Navigation */}
      <BottomNav
        currentScreen={currentScreen}
        onNavigate={(s) => {
          setCurrentScreen(s);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={totalCartCount}
      />

      {/* Global Modals & Toasts */}
      <Modals
        isSchoolModalOpen={isSchoolModalOpen}
        onCloseSchoolModal={() => setIsSchoolModalOpen(false)}
        activeSchool={activeSchool}
        onSelectSchool={(s) => {
          setActiveSchool(s);
          showToast(`Active school set to ${s.name}`);
        }}
        isPolicyModalOpen={isPolicyModalOpen}
        onClosePolicyModal={() => setIsPolicyModalOpen(false)}
        isSizeGuideOpen={isSizeGuideOpen}
        onCloseSizeGuide={() => setIsSizeGuideOpen(false)}
        isFitQuizOpen={isFitQuizOpen}
        onCloseFitQuiz={() => setIsFitQuizOpen(false)}
        onApplyFitRecommendation={handleApplyFitQuiz}
        toastMessage={toastMessage}
        onCloseToast={() => setToastMessage(null)}
      />

      {/* Add Child Profile Modal */}
      <AddChildModal
        isOpen={isAddChildModalOpen}
        onClose={() => setIsAddChildModalOpen(false)}
        activeSchool={activeSchool}
        onAddChild={handleAddChild}
      />

      {/* Shipping Address Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        currentAddress={user.defaultAddress}
        onSaveAddress={handleSaveAddress}
      />

      {/* Size Exchange Request Modal */}
      {selectedExchangeOrder && (
        <ExchangeModal
          isOpen={!!selectedExchangeOrder}
          onClose={() => setSelectedExchangeOrder(null)}
          order={selectedExchangeOrder}
          onSubmitExchange={handleConfirmExchange}
        />
      )}

      {/* Direct Campus Support & WhatsApp Desk Modal */}
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        activeSchool={activeSchool}
        onShowToast={showToast}
      />
    </div>
  );
}
