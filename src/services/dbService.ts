import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserAccount, Order, ChildProfile, ExchangeRequest } from '../types';
import { INITIAL_ORDERS } from '../data/orders';
import { INITIAL_PROFILES } from '../data/profiles';

// Default parent address
export const DEFAULT_PARENT_ADDRESS = {
  fullName: 'Rajesh Sharma',
  phone: '+91 98201 49201',
  flat: 'Flat 402, Royal Palms Apartments',
  street: 'Lane 5, Koregaon Park',
  area: 'Koregaon Park South',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411001',
  tag: 'Home' as const,
};

// ----------------------------------------------------
// AUTH SERVICES
// ----------------------------------------------------

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserAccount> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return syncUserProfile(cred.user);
}

/**
 * Register a new Parent or Staff account with Email and Password
 */
export async function registerWithEmail(
  name: string,
  email: string,
  pass: string,
  phone: string,
  role: 'parent' | 'tailor' = 'parent'
): Promise<UserAccount> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }

  const newAccount: UserAccount = {
    id: cred.user.uid,
    name: name || 'Parent Account',
    email: cred.user.email || email,
    phone: phone || '+91 98201 49201',
    role,
    isLoggedIn: true,
    avatarUrl: cred.user.photoURL || undefined,
    defaultAddress: DEFAULT_PARENT_ADDRESS,
  };

  await setDoc(doc(db, 'users', cred.user.uid), {
    ...newAccount,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return newAccount;
}

/**
 * Sign in using Google OAuth Popup
 */
export async function loginWithGoogle(): Promise<UserAccount> {
  const cred = await signInWithPopup(auth, googleProvider);
  return syncUserProfile(cred.user);
}

/**
 * Anonymous / Guest access
 */
export async function loginAsGuest(): Promise<UserAccount> {
  const cred = await signInAnonymously(auth);
  return syncUserProfile(cred.user, 'guest');
}

/**
 * Reset password via official Firebase Auth mailer
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Log out current Firebase session
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Listen to Firebase Auth state changes
 */
export function onAuthChange(callback: (user: UserAccount | null) => void): () => void {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      try {
        const account = await syncUserProfile(fbUser);
        callback(account);
      } catch (err) {
        console.error('Error syncing user profile on auth change:', err);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

/**
 * Helper to fetch or create Firestore user profile
 */
export async function syncUserProfile(
  fbUser: FirebaseUser,
  fallbackRole: 'parent' | 'tailor' | 'guest' = 'parent'
): Promise<UserAccount> {
  const userRef = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data();
    return {
      id: fbUser.uid,
      name: data.name || fbUser.displayName || 'Parent Account',
      email: data.email || fbUser.email || '',
      phone: data.phone || fbUser.phoneNumber || '+91 98201 49201',
      role: data.role || (fbUser.isAnonymous ? 'guest' : fallbackRole),
      isLoggedIn: true,
      avatarUrl: data.avatarUrl || fbUser.photoURL || undefined,
      defaultAddress: data.defaultAddress || DEFAULT_PARENT_ADDRESS,
    };
  }

  // First-time user creation in Firestore
  const newProfile: UserAccount = {
    id: fbUser.uid,
    name: fbUser.displayName || (fbUser.isAnonymous ? 'Guest Parent' : 'Authorized Parent'),
    email: fbUser.email || '',
    phone: fbUser.phoneNumber || '+91 98201 49201',
    role: fbUser.isAnonymous ? 'guest' : fallbackRole,
    isLoggedIn: true,
    avatarUrl: fbUser.photoURL || undefined,
    defaultAddress: DEFAULT_PARENT_ADDRESS,
  };

  await setDoc(userRef, {
    ...newProfile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return newProfile;
}

/**
 * Update user profile in Firestore
 */
export async function updateUserProfileInDb(uid: string, updates: Partial<UserAccount>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await setDoc(
    userRef,
    {
      ...updates,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ----------------------------------------------------
// FIRESTORE REAL-TIME ORDERS
// ----------------------------------------------------

/**
 * Subscribe to real-time orders from Firestore
 * Parents receive their own orders; Tailors receive all institutional orders.
 */
export function subscribeToOrders(
  userId: string | undefined,
  role: 'parent' | 'tailor' | 'guest',
  onUpdate: (orders: Order[]) => void
): () => void {
  const ordersRef = collection(db, 'orders');

  let q;
  if (role === 'tailor') {
    // Tailor views all institutional orders
    q = query(ordersRef, orderBy('createdAt', 'desc'));
  } else if (userId) {
    // Parent views their own orders or demo orders
    q = query(ordersRef, where('userId', '==', userId));
  } else {
    // Fallback query
    q = query(ordersRef, orderBy('createdAt', 'desc'));
  }

  return onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty && userId) {
        // Seed initial orders into Firestore for new user so they have rich data
        await seedInitialOrders(userId);
        return;
      }

      const list: Order[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: data.id || docSnap.id,
          date: data.date,
          estimatedArrival: data.estimatedArrival,
          total: data.total || data.totalAmount || 0,
          totalAmount: data.totalAmount || data.total || 0,
          paymentMethod: data.paymentMethod,
          studentName: data.studentName,
          studentGrade: data.studentGrade,
          school: data.school,
          house: data.house,
          shippingAddress: data.shippingAddress,
          contactNumber: data.contactNumber,
          statusText: data.statusText,
          status: data.status,
          timelineStep: data.timelineStep || 1,
          items: data.items || [],
        };
      });

      // Sort by creation or date descending
      onUpdate(list.length > 0 ? list : INITIAL_ORDERS);
    },
    (err) => {
      console.warn('Firestore orders subscription fallback:', err);
      onUpdate(INITIAL_ORDERS);
    }
  );
}

/**
 * Seed initial sample orders for a newly registered user
 */
export async function seedInitialOrders(userId: string): Promise<void> {
  try {
    const ordersRef = collection(db, 'orders');
    for (const order of INITIAL_ORDERS) {
      const docId = `${userId}_${order.id.replace('#', '')}`;
      await setDoc(
        doc(ordersRef, docId),
        {
          ...order,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.error('Error seeding initial orders in Firestore:', err);
  }
}

/**
 * Create a new Order in Firestore
 */
export async function createOrderInDb(order: Order, userId: string, userEmail?: string): Promise<void> {
  const docId = order.id.replace('#', '');
  const orderRef = doc(db, 'orders', docId);

  await setDoc(orderRef, {
    ...order,
    userId,
    userEmail: userEmail || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update order status (used by Master Tailor console)
 */
export async function updateOrderStatusInDb(
  orderId: string,
  newStatus: Order['status'],
  statusText?: string,
  timelineStep?: number
): Promise<void> {
  const cleanId = orderId.replace('#', '');
  const orderRef = doc(db, 'orders', cleanId);

  await setDoc(
    orderRef,
    {
      status: newStatus,
      ...(statusText ? { statusText } : {}),
      ...(timelineStep ? { timelineStep } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ----------------------------------------------------
// FIRESTORE CHILD PROFILES
// ----------------------------------------------------

/**
 * Subscribe to Student / Child Profiles
 */
export function subscribeToProfiles(
  userId: string | undefined,
  onUpdate: (profiles: ChildProfile[]) => void
): () => void {
  if (!userId) {
    onUpdate(INITIAL_PROFILES);
    return () => {};
  }

  const profilesRef = collection(db, 'childProfiles');
  const q = query(profilesRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed default profiles for this parent
        for (const p of INITIAL_PROFILES) {
          await setDoc(doc(db, 'childProfiles', `${userId}_${p.id}`), {
            ...p,
            userId,
            createdAt: serverTimestamp(),
          });
        }
        return;
      }

      const list: ChildProfile[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: d.id || docSnap.id,
          name: d.name,
          initials: d.initials || (d.name ? d.name.slice(0, 2).toUpperCase() : 'ST'),
          school: d.school,
          grade: d.grade,
          board: d.board || 'CBSE',
          session: d.session || 'Session 2025-26',
          height: d.height,
          heightInches: d.heightInches,
          weight: d.weight,
          weightCategory: d.weightCategory || 'Regular',
          age: d.age || 10,
          growthBuffer: d.growthBuffer,
          active: d.active !== undefined ? d.active : true,
          sizes: d.sizes || {},
        };
      });

      onUpdate(list);
    },
    (err) => {
      console.warn('Child profiles subscription error, using initial profiles:', err);
      onUpdate(INITIAL_PROFILES);
    }
  );
}

/**
 * Save or update student profile in Firestore
 */
export async function saveProfileInDb(profile: ChildProfile, userId: string): Promise<void> {
  const docId = `${userId}_${profile.id}`;
  await setDoc(
    doc(db, 'childProfiles', docId),
    {
      ...profile,
      userId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ----------------------------------------------------
// FIRESTORE EXCHANGE REQUESTS
// ----------------------------------------------------

/**
 * Submit real exchange request to Firestore
 */
export async function submitExchangeRequest(request: ExchangeRequest, userId: string): Promise<void> {
  const docRef = doc(db, 'exchangeRequests', request.id);
  await setDoc(docRef, {
    ...request,
    userId,
    createdAt: serverTimestamp(),
  });
}

/**
 * Subscribe to exchange requests for tailor console
 */
export function subscribeToExchangeRequests(onUpdate: (requests: ExchangeRequest[]) => void): () => void {
  const ref = collection(db, 'exchangeRequests');
  return onSnapshot(
    ref,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as ExchangeRequest);
      onUpdate(list);
    },
    (err) => {
      console.warn('Exchange requests subscription fallback:', err);
    }
  );
}
