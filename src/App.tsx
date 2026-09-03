/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  ManagedProduct,
} from './types';
import { SCHOOLS } from './data/schools';
import { UNIFORM_ITEMS } from './data/products';
import { INITIAL_ORDERS } from './data/orders';
import {
  onAuthChange,
  subscribeToOrders,
  subscribeToProfiles,
  createOrderInDb,
  updateOrderStatusInDb,
  saveProfileInDb,
  deleteProfileFromDb,
  updateUserProfileInDb,
  submitExchangeRequest,
  logoutUser,
  subscribeToProducts,
  managedProductToUniformItem,
  seedInitialProductsIfEmpty,
  decrementInventoryForOrder,
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

const GUEST_USER: UserAccount = {
  id: '',
  name: 'Guest Parent',
  phone: '',
  email: '',
  role: 'guest',
  isLoggedIn: false,
  defaultAddress: {
    fullName: '',
    phone: '',
    flat: '',
    street: '',
    city: 'Pune',
    pincode: '',
    tag: 'Home',
  },
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('home');
  const [activeSchool, setActiveSchool] = useState<School>(SCHOOLS[0]);
  const [selectedProduct, setSelectedProduct] = useState<UniformItem>(UNIFORM_ITEMS[0]);
  const [selectedProductSize, setSelectedProductSize] = useState<string>('32');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Clean initial state: unauthenticated guest user with an empty shopping cart
  const [user, setUser] = useState<UserAccount>(GUEST_USER);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [managedProducts, setManagedProducts] = useState<ManagedProduct[]>([]);

  // Selected Order for Tax Invoice and Exchange
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
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

  // Real Firestore Products subscription & bootstrap seeding
  useEffect(() => {
    seedInitialProductsIfEmpty().catch((err) => {
      console.warn('Seeding check:', err);
    });

    const unsubscribe = subscribeToProducts((liveProds) => {
      setManagedProducts(liveProds || []);
    });
    return () => unsubscribe();
  }, []);

  // Compute live uniform items as unified single-source-of-truth:
  // Synchronizes base catalog UNIFORM_ITEMS with real-time Firestore managedProducts.
  // Any update to a product in Firestore immediately overrides the catalog with its live price, mrp, stock, etc.
  // Any new custom products added in Firestore are seamlessly included.
  const liveUniformItems = useMemo<UniformItem[]>(() => {
    const firestoreMap = new Map<string, ManagedProduct>();
    (managedProducts || []).forEach((p) => {
      firestoreMap.set(p.id, p);
    });

    const merged: UniformItem[] = UNIFORM_ITEMS.map((baseItem) => {
      const live = firestoreMap.get(baseItem.id);
      if (live) {
        return managedProductToUniformItem(live);
      }
      return baseItem;
    });

    (managedProducts || []).forEach((p) => {
      const exists = UNIFORM_ITEMS.some((b) => b.id === p.id);
      if (!exists) {
        merged.push(managedProductToUniformItem(p));
      }
    });

    return merged.filter(
      (item) => item.status !== 'archived' && item.isPublished !== false
    );
  }, [managedProducts]);

  // Real Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(GUEST_USER);
        setOrders([]);
        setProfiles([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time Cloud Firestore Orders
  useEffect(() => {
    const unsubscribe = subscribeToOrders(user?.id, user?.role || 'guest', (liveOrders) => {
      setOrders(liveOrders || []);
      if (liveOrders && liveOrders.length > 0) {
        setSelectedInvoiceOrder((prev) => {
          const match = liveOrders.find((o) => o.id === prev?.id);
          return match || liveOrders[0];
        });
      }
    }, user?.email);
    return () => unsubscribe();
  }, [user?.id, user?.role, user?.email]);

  // Subscribe to real-time Cloud Firestore Student Profiles
  useEffect(() => {
    if (!user?.id) {
      setProfiles([]);
      return;
    }
    const unsubscribe = subscribeToProfiles(user.id, user.email, (liveProfiles) => {
      setProfiles(liveProfiles || []);
    });
    return () => unsubscribe();
  }, [user?.id, user?.email]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout fallback:', err);
    }
    setUser(GUEST_USER);
    setCart([]);
    setOrders([]);
    setProfiles([]);
    showToast('Signed out successfully');
    setCurrentScreen('home');
  };

  // Cart operations
  const handleAddToCart = (item: UniformItem, size: string, quantity = 1) => {
    const freshItem = liveUniformItems.find((p) => p.id === item.id) || item;
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (ci) => ci.item.id === freshItem.id && ci.size === size
      );
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += quantity;
        copy[existingIdx].item = freshItem;
        return copy;
      } else {
        return [...prev, { item: freshItem, size, quantity }];
      }
    });
    showToast(`Added ${freshItem.name} (Size ${size}) to Cart`);
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

  const handleDeleteChild = async (profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    if (user?.id) {
      try {
        await deleteProfileFromDb(profileId, user.id);
      } catch (err) {
        console.warn('deleteProfileFromDb error:', err);
      }
    }
    showToast('Student profile removed from account.');
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
    const formattedAddr =
      user.defaultAddress && (user.defaultAddress.flat?.trim() || user.defaultAddress.street?.trim())
        ? [
            user.defaultAddress.flat?.trim(),
            user.defaultAddress.street?.trim(),
            user.defaultAddress.city?.trim(),
            user.defaultAddress.pincode?.trim() ? `PIN: ${user.defaultAddress.pincode.trim()}` : '',
          ]
            .filter(Boolean)
            .join(', ')
        : 'School Campus Uniform Delivery Depot';

    const newOrder: Order = {
      id: newOrderId,
      date: 'Today, Just now',
      estimatedArrival: 'In 3-4 Days • by 5:00 PM',
      total: cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0),
      totalAmount: cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0),
      paymentMethod: 'UPI Instant Verified',
      studentName: profiles[0]?.name || user.name || 'Student',
      studentGrade: profiles[0]?.grade || 'Official Uniform',
      school: activeSchool.name,
      house: 'Institutional Allocation',
      shippingAddress: formattedAddr,
      contactNumber: user.defaultAddress?.phone || user.phone || '',
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

    // Deduct stock in real-time Cloud Firestore
    decrementInventoryForOrder(
      cart.map((ci) => ({
        productId: ci.item.id,
        name: ci.item.name,
        size: ci.size,
        qty: ci.quantity,
      })),
      newOrderId,
      user?.email || 'guest@magnumuniforms.com'
    ).catch((err) => {
      console.warn('decrementInventoryForOrder error:', err);
    });

    // Persist immediately to Cloud Firestore database
    const targetUserId = user?.id || `guest_${Date.now()}`;
    const targetUserEmail = user?.email || 'guest@magnumuniforms.com';
    createOrderInDb(newOrder, targetUserId, targetUserEmail).catch((err) => {
      console.warn('createOrderInDb error:', err);
    });
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
            products={liveUniformItems}
          />
        )}

        {currentScreen === 'product-details' && (
          <ProductDetailsView
            product={
              liveUniformItems.find((p) => p.id === selectedProduct.id) ||
              selectedProduct
            }
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
            cart={cart.map((ci) => {
              const fresh = liveUniformItems.find((p) => p.id === ci.item.id);
              return fresh ? { ...ci, item: fresh } : ci;
            })}
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
            user={user}
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
            onLogout={handleLogout}
            onOpenAddChild={() => setIsAddChildModalOpen(true)}
            onDeleteProfile={handleDeleteChild}
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
            user={user}
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
            order={(selectedInvoiceOrder || orders[0]) as any}
            user={user}
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
