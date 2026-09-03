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
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDocFromServer,
  updateDoc,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, googleProvider, db, storage } from '../lib/firebase';
import {
  UserAccount,
  Order,
  ChildProfile,
  ExchangeRequest,
  Address,
  ManagedProduct,
  ProductImage,
  ProductSizeInventory,
  ProductInventoryLog,
  UniformItem,
  getPrimaryImageUrl,
} from '../types';
import { INITIAL_ORDERS } from '../data/orders';
import { INITIAL_PROFILES } from '../data/profiles';
import { UNIFORM_ITEMS } from '../data/products';
import { SCHOOLS } from '../data/schools';

// Empty default address for new accounts
export const EMPTY_PARENT_ADDRESS: Address = {
  fullName: '',
  phone: '',
  flat: '',
  street: '',
  area: '',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '',
  tag: 'Home',
};

// Test Firestore connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore connection check: client is offline or starting up.');
    }
    return false;
  }
}
testConnection().catch(() => {});

// ----------------------------------------------------
// AUTH SERVICES & SESSION PERSISTENCE
// ----------------------------------------------------

const SESSION_STORAGE_KEY = 'magnum_active_portal_session';
const authListeners: Set<(user: UserAccount | null) => void> = new Set();

function notifyAuthListeners(user: UserAccount | null) {
  authListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (e) {
      console.warn('Auth listener callback notification warning:', e);
    }
  });
}

export function getSavedSessionUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserAccount;
  } catch {
    return null;
  }
}

export function setSavedSessionUser(account: UserAccount | null) {
  try {
    if (account) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(account));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Unable to persist session to localStorage:', e);
  }
  notifyAuthListeners(account);
}

/**
 * Check if an email has admin/master tailor authority
 */
export function isMasterAdminEmail(email?: string | null): boolean {
  return Boolean(email && email.trim().toLowerCase() === 'badal17patell@gmail.com');
}

/**
 * Deterministic user ID for offline or verified Firestore profiles
 */
function generateDeterministicUid(email: string): string {
  const clean = email.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const safePart = clean.replace(/[^a-z0-9]/g, '').slice(0, 12);
  return `usr_${safePart}_${hex}`;
}

/**
 * Deterministic password hashing for Firestore security fallback
 */
async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_magnum_auth_salt_2025');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 0;
  const str = password + '_magnum_auth_salt_2025';
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}`;
}

/**
 * Sign in with Email and Password.
 * STRICTLY requires users to have registered first.
 * Does NOT auto-create accounts for dummy credentials.
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Please enter your email address');
  }
  if (!pass) {
    throw new Error('Please enter your password');
  }

  // Pre-seed master admin so application owner is not locked out
  if (isMasterAdminEmail(cleanEmail)) {
    const adminUid = generateDeterministicUid(cleanEmail);
    const adminRef = doc(db, 'users', adminUid);
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      const adminHash = await hashPassword('AdminBadal2025!');
      await setDoc(adminRef, {
        id: adminUid,
        name: 'Admin Badal',
        email: cleanEmail,
        phone: '+91 98000 00001',
        role: 'tailor',
        isLoggedIn: true,
        passwordHash: adminHash,
        defaultAddress: EMPTY_PARENT_ADDRESS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  // Check Cloud Firestore registered user profile first to strictly enforce passwordHash
  const uid = generateDeterministicUid(cleanEmail);
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  let docData: any = null;
  let docId = uid;
  let targetRef = userRef;

  if (!snap.exists()) {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('email', '==', cleanEmail));
    const querySnap = await getDocs(q);

    if (querySnap.empty) {
      const notFoundErr = new Error(
        `No registered account found with email "${cleanEmail}". Please register yourself first to sign in.`
      );
      (notFoundErr as any).code = 'auth/user-not-found';
      throw notFoundErr;
    }
    docId = querySnap.docs[0].id;
    docData = querySnap.docs[0].data();
    targetRef = querySnap.docs[0].ref;
  } else {
    docData = snap.data();
  }

  // Strict password hash verification
  if (docData.passwordHash) {
    const enteredHash = await hashPassword(pass);
    if (enteredHash !== docData.passwordHash) {
      const wrongErr = new Error('Incorrect password. Please verify your password or reset it.');
      (wrongErr as any).code = 'auth/wrong-password';
      throw wrongErr;
    }
  } else {
    // If account was created without passwordHash, set it now
    const newHash = await hashPassword(pass);
    await updateDoc(targetRef, { passwordHash: newHash });
  }

  // Optional Firebase Auth sign-in sync
  try {
    await signInWithEmailAndPassword(auth, cleanEmail, pass);
  } catch (authErr) {
    console.warn('Firebase Auth sign-in sync note:', authErr);
  }

  const account: UserAccount = {
    id: docId,
    name: docData.name || (isMasterAdminEmail(cleanEmail) ? 'Admin Badal' : 'Parent Account'),
    email: cleanEmail,
    phone: docData.phone || '',
    role: isMasterAdminEmail(cleanEmail) ? 'tailor' : (docData.role || 'parent'),
    isLoggedIn: true,
    avatarUrl: docData.avatarUrl || undefined,
    defaultAddress: docData.defaultAddress || EMPTY_PARENT_ADDRESS,
  };

  setSavedSessionUser(account);
  return account;
}

/**
 * Register a new Parent or Staff account with Email and Password.
 * Strictly verifies credentials and records user into Cloud Firestore.
 */
export async function registerWithEmail(
  name: string,
  email: string,
  pass: string,
  phone: string,
  role: 'parent' | 'tailor' = 'parent'
): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Please enter a valid email address');
  }
  if (!pass || pass.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  if (!name || name.trim().length < 2) {
    throw new Error('Please enter your full name (minimum 2 characters)');
  }

  const assignedRole: 'parent' | 'tailor' = isMasterAdminEmail(cleanEmail) ? 'tailor' : role;
  const uid = generateDeterministicUid(cleanEmail);
  const userRef = doc(db, 'users', uid);

  // Check if account is already registered in Firestore
  const existingSnap = await getDoc(userRef);
  if (existingSnap.exists()) {
    const err = new Error('An account with this email is already registered. Please sign in instead.');
    (err as any).code = 'auth/email-already-in-use';
    throw err;
  }

  const passwordHash = await hashPassword(pass);
  let firebaseUid = uid;

  // Try creating in Firebase Authentication
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    firebaseUid = cred.user.uid;
    if (name) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }
  } catch (authErr: any) {
    if (authErr?.code === 'auth/email-already-in-use') {
      const err = new Error('An account with this email is already registered. Please sign in instead.');
      (err as any).code = 'auth/email-already-in-use';
      throw err;
    }
    console.warn('Firebase Auth registration fallback to Firestore:', authErr?.message);
  }

  const newAccount: UserAccount = {
    id: firebaseUid,
    name: name.trim() || (assignedRole === 'tailor' ? 'Admin Badal' : 'Parent Account'),
    email: cleanEmail,
    phone: phone.trim() || '',
    role: assignedRole,
    isLoggedIn: true,
    avatarUrl: undefined,
    defaultAddress: EMPTY_PARENT_ADDRESS,
  };

  // Write registered user record to Cloud Firestore with hashed password
  await setDoc(userRef, {
    ...newAccount,
    passwordHash,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (firebaseUid !== uid) {
    await setDoc(
      doc(db, 'users', firebaseUid),
      {
        ...newAccount,
        passwordHash,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  setSavedSessionUser(newAccount);
  return newAccount;
}

/**
 * Sign in using Google OAuth Popup
 */
export async function loginWithGoogle(): Promise<UserAccount> {
  const cred = await signInWithPopup(auth, googleProvider);
  const account = await syncUserProfile(cred.user);
  setSavedSessionUser(account);
  return account;
}

/**
 * Anonymous / Guest access
 */
export async function loginAsGuest(): Promise<UserAccount> {
  try {
    const cred = await signInAnonymously(auth);
    const account = await syncUserProfile(cred.user, 'guest');
    setSavedSessionUser(account);
    return account;
  } catch (err: any) {
    if (
      err?.code === 'auth/operation-not-allowed' ||
      err?.message?.includes('operation-not-allowed')
    ) {
      console.warn('Firebase Anonymous auth disabled. Providing guest portal session.');
      const guestUid = 'guest_' + Math.random().toString(36).substring(2, 9);
      const guestAccount: UserAccount = {
        id: guestUid,
        name: 'Guest Parent',
        email: '',
        phone: '',
        role: 'guest',
        isLoggedIn: true,
        defaultAddress: EMPTY_PARENT_ADDRESS,
      };
      setSavedSessionUser(guestAccount);
      return guestAccount;
    }
    throw err;
  }
}

/**
 * Reset password via official Firebase Auth mailer
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Log out current Firebase session and clear saved local storage
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('SignOut warning:', err);
  }
  setSavedSessionUser(null);
}

/**
 * Listen to Firebase Auth state changes with fallback to saved local session
 */
export function onAuthChange(callback: (user: UserAccount | null) => void): () => void {
  authListeners.add(callback);

  // Check saved session on registration
  const existing = getSavedSessionUser();
  if (existing) {
    callback(existing);
  }

  const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      try {
        const account = await syncUserProfile(fbUser);
        setSavedSessionUser(account);
        callback(account);
      } catch (err) {
        console.error('Error syncing user profile on auth change:', err);
        const fallback = getSavedSessionUser();
        callback(fallback);
      }
    } else {
      // If Firebase Auth has no active user, check if we have a stored session
      const fallback = getSavedSessionUser();
      callback(fallback);
    }
  });

  return () => {
    authListeners.delete(callback);
    unsubscribe();
  };
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
  const isBadal = isMasterAdminEmail(fbUser.email);
  const targetRole = isBadal ? 'tailor' : (fbUser.isAnonymous ? 'guest' : fallbackRole);

  if (snap.exists()) {
    const data = snap.data();
    return {
      id: fbUser.uid,
      name: data.name || fbUser.displayName || (isBadal ? 'Admin Badal' : 'Parent Account'),
      email: data.email || fbUser.email || '',
      phone: data.phone || fbUser.phoneNumber || '',
      role: isBadal ? 'tailor' : (data.role || targetRole),
      isLoggedIn: true,
      avatarUrl: data.avatarUrl || fbUser.photoURL || undefined,
      defaultAddress: data.defaultAddress || EMPTY_PARENT_ADDRESS,
    };
  }

  // First-time user creation in Firestore
  const newProfile: UserAccount = {
    id: fbUser.uid,
    name: fbUser.displayName || (isBadal ? 'Admin Badal' : (fbUser.isAnonymous ? 'Guest Parent' : 'Parent Account')),
    email: fbUser.email || '',
    phone: fbUser.phoneNumber || '',
    role: targetRole,
    isLoggedIn: true,
    avatarUrl: fbUser.photoURL || undefined,
    defaultAddress: EMPTY_PARENT_ADDRESS,
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
  onUpdate: (orders: Order[]) => void,
  userEmail?: string
): () => void {
  if (!userId && !userEmail && role !== 'tailor') {
    onUpdate([]);
    return () => {};
  }

  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const allOrders: Order[] = snapshot.docs.map((docSnap) => {
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
          userId: data.userId,
          userEmail: data.userEmail,
        };
      });

      if (role === 'tailor') {
        onUpdate(allOrders);
      } else {
        const filtered = allOrders.filter((o) => {
          if (userId && o.userId === userId) return true;
          if (userEmail && o.userEmail && o.userEmail.toLowerCase() === userEmail.toLowerCase()) return true;
          return false;
        });
        onUpdate(filtered);
      }
    },
    (err) => {
      console.warn('Firestore orders subscription fallback:', err);
      onUpdate([]);
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

/**
 * Fetch a specific order by ID directly from Firestore
 */
export async function getOrderByIdFromDb(orderId: string): Promise<Order | null> {
  const cleanId = orderId.trim().replace(/^#/, '');
  const docRef = doc(db, 'orders', cleanId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    return {
      id: data.id || snap.id,
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
  }

  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('id', 'in', [orderId, `#${cleanId}`, cleanId]));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      const data = querySnap.docs[0].data();
      return {
        id: data.id || querySnap.docs[0].id,
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
    }
  } catch (err) {
    console.warn('Query order by id fallback error:', err);
  }

  return null;
}

// ----------------------------------------------------
// FIRESTORE CHILD PROFILES
// ----------------------------------------------------

/**
 * Subscribe to Student / Child Profiles
 */
export function subscribeToProfiles(
  userId: string | undefined,
  userEmail: string | undefined,
  onUpdate: (profiles: ChildProfile[]) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const profilesRef = collection(db, 'childProfiles');
  const q = query(profilesRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    async (snapshot) => {
      const isDemoAccount = userEmail?.trim().toLowerCase() === 'parent.rajesh@magnumuniforms.com';

      if (snapshot.empty) {
        if (isDemoAccount) {
          // Only seed initial sample profiles for the explicit demo test account
          for (const p of INITIAL_PROFILES) {
            await setDoc(doc(db, 'childProfiles', `${userId}_${p.id}`), {
              ...p,
              userId,
              createdAt: serverTimestamp(),
            });
          }
          return;
        }
        onUpdate([]);
        return;
      }

      // If this is a real user (not the sample demo account), purge any previously auto-seeded dummy profiles
      if (!isDemoAccount) {
        const dummyDocs = snapshot.docs.filter((docSnap) => {
          const d = docSnap.data();
          return (
            d.id === 'aarav' ||
            d.id === 'ananya' ||
            d.name === 'Aarav Sharma' ||
            d.name === 'Ananya Sharma'
          );
        });

        if (dummyDocs.length > 0) {
          for (const dDoc of dummyDocs) {
            try {
              await deleteDoc(dDoc.ref);
            } catch (delErr) {
              console.warn('Error cleaning up dummy profile doc:', delErr);
            }
          }
          return; // snapshot listener will fire again with purged clean list
        }
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
      console.warn('Child profiles subscription error, falling back to empty list:', err);
      onUpdate([]);
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

/**
 * Delete student profile from Firestore
 */
export async function deleteProfileFromDb(profileId: string, userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'childProfiles', `${userId}_${profileId}`));
  } catch {
    // Attempt direct ID fallback
  }
  try {
    await deleteDoc(doc(db, 'childProfiles', profileId));
  } catch (err) {
    console.warn('Error deleting student profile:', err);
  }
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

// ----------------------------------------------------
// PRODUCT & INVENTORY MANAGEMENT SYSTEM (SINGLE SOURCE OF TRUTH)
// ----------------------------------------------------

/**
 * Recursively remove undefined fields from an object so Firestore setDoc/updateDoc never throws:
 * "Unsupported field value: undefined"
 */
export function removeUndefinedFields<T extends Record<string, any>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefinedFields(item)) as any;
  }
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      result[key] = removeUndefinedFields(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Converts a static UniformItem catalog entry to a ManagedProduct format for Firestore and Admin Tailor View
 */
export function uniformItemToManagedProduct(item: UniformItem): ManagedProduct {
  const school = SCHOOLS.find((s) => s.id === item.schoolId);
  const sizes: ProductSizeInventory[] = (
    item.availableSizes && item.availableSizes.length > 0
      ? item.availableSizes
      : ['28', '30', '32', '34', '36', '38']
  ).map((sz, idx) => ({
    size: sz,
    stock: 45 + (idx % 4) * 10,
    reserved: 1,
    sold: 5 + idx * 2,
    lowStockThreshold: 15,
  }));
  const totalStock = sizes.reduce((acc, s) => acc + s.stock, 0);
  const price = Number(item.price) || 0;
  const mrp = Number(item.originalPrice) || Math.round((price || 850) * 1.18);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return {
    id: item.id,
    schoolId: item.schoolId,
    schoolName: item.schoolName || school?.name || 'Institutional School',
    name: item.name,
    description:
      item.description ||
      `Official approved uniform specification for ${school?.name || 'School'}. Tailored with double-stitched reinforcements, anti-pilling fabric, and official school crest.`,
    sku: (item.sku || item.id).toUpperCase().replace(/-/g, '_'),
    category: item.category,
    subcategory: item.categoryLabel || `${item.category.charAt(0).toUpperCase() + item.category.slice(1)} · Official Uniform`,
    gender: item.gender || 'unisex',
    ageGroup: item.ageGroup || 'All Grades',
    season: item.season || 'All Season',
    price,
    mrp,
    discount,
    images:
      item.images && item.images.length > 0
        ? item.images
        : [
            {
              url: item.image,
              isPrimary: true,
              name: item.name,
            },
          ],
    sizes: item.sizesInventory && item.sizesInventory.length > 0 ? item.sizesInventory : sizes,
    status: item.status || 'active',
    isPublished: item.isPublished !== undefined ? item.isPublished : true,
    totalStock,
    fabricBlend: item.fabricBlend || 'Cotton Blend / Easy Care',
    badge: item.badge || '',
    badgeType: item.badgeType || 'pattern',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'catalog_default',
  };
}

/**
 * Converts a ManagedProduct from Firestore to a UniformItem for customer views
 */
export function managedProductToUniformItem(mp: ManagedProduct): UniformItem {
  const primaryImg = getPrimaryImageUrl(mp.images);

  const availableSizes =
    mp.sizes && mp.sizes.length > 0
      ? mp.sizes.map((s) => s.size)
      : ['28', '30', '32', '34', '36', '38'];

  const calculatedTotalStock =
    mp.totalStock !== undefined
      ? mp.totalStock
      : mp.sizes?.reduce((sum, s) => sum + (Number(s.stock) || 0), 0) ?? 0;

  const hasStock = calculatedTotalStock > 0 && mp.status === 'active';

  return {
    id: mp.id,
    name: mp.name,
    category: mp.category,
    categoryLabel:
      mp.subcategory ||
      `${mp.category.charAt(0).toUpperCase() + mp.category.slice(1)} · Official Uniform`,
    price: Number(mp.price) || 0,
    originalPrice:
      Number(mp.mrp) || Math.round((Number(mp.price) || 850) * 1.18),
    image: primaryImg,
    altText: mp.name,
    badge: mp.badge,
    badgeType: mp.badgeType,
    inStock: hasStock,
    availableSizes: availableSizes.length > 0 ? availableSizes : ['Standard'],
    defaultSize: availableSizes[0] || '32',
    fabricBlend: mp.fabricBlend || 'Cotton Blend / Easy Care',
    schoolId: mp.schoolId,
    schoolName: mp.schoolName,
    description: mp.description,
    gender: mp.gender,
    sku: mp.sku,
    images: mp.images || [{ url: primaryImg, isPrimary: true }],
    sizesInventory: mp.sizes || [],
    status: mp.status || 'active',
    isPublished: mp.isPublished !== undefined ? mp.isPublished : true,
    totalStock: calculatedTotalStock,
    ageGroup: mp.ageGroup,
    season: mp.season,
  };
}

let isBootstrappingCatalog = false;

/**
 * Seed initial catalog to Firestore if empty, ensuring instant single-source-of-truth
 */
export async function seedInitialProductsIfEmpty(): Promise<number> {
  if (isBootstrappingCatalog) return 0;
  isBootstrappingCatalog = true;

  try {
    const productsRef = collection(db, 'products');
    const existingSnap = await getDocs(productsRef);
    if (!existingSnap.empty) {
      const officialTieRef = doc(db, 'products', 'dais-mum-tie-official');
      const juniorTieRef = doc(db, 'products', 'dais-mum-tie-junior');
      await updateDoc(officialTieRef, { 'images.0.url': 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80' }).catch(() => {});
      await updateDoc(juniorTieRef, { 'images.0.url': 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80' }).catch(() => {});

      isBootstrappingCatalog = false;
      return existingSnap.size;
    }

    console.log('Seeding initial products into Firestore...');
    const batch = writeBatch(db);

    // Seed up to 50 key products across top schools
    const seedCandidates = UNIFORM_ITEMS.slice(0, 50);

    for (const item of seedCandidates) {
      const school = SCHOOLS.find((s) => s.id === item.schoolId);
      const sizes: ProductSizeInventory[] = (
        item.availableSizes || ['28', '30', '32', '34', '36', '38']
      ).map((sz, idx) => ({
        size: sz,
        stock: 45 + (idx % 4) * 12,
        reserved: 1,
        sold: 6 + idx * 2,
        lowStockThreshold: 15,
      }));

      const totalStock = sizes.reduce((acc, s) => acc + s.stock, 0);

      const productDoc: ManagedProduct = {
        id: item.id,
        schoolId: item.schoolId,
        schoolName: school?.name || 'Institutional School',
        name: item.name,
        description:
          item.description ||
          `Official approved uniform specification for ${school?.name || 'Institution'}. Tailored with double-stitched reinforcements, anti-pilling fabric, and official school crest.`,
        sku: (item.sku || item.id).toUpperCase().replace(/-/g, '_'),
        category: item.category,
        subcategory: item.categoryLabel || 'Uniform Apparel',
        gender: item.gender || 'unisex',
        ageGroup: 'All Grades',
        season: 'All Season',
        price: item.price || 850,
        mrp: item.originalPrice || Math.round((item.price || 850) * 1.18),
        discount: Math.round(
          (((item.originalPrice || 1000) - (item.price || 850)) /
            (item.originalPrice || 1000)) *
            100
        ),
        images: [
          {
            url: item.image,
            isPrimary: true,
            name: 'Primary Uniform Display',
          },
        ],
        sizes,
        status: 'active',
        isPublished: true,
        totalStock,
        fabricBlend: item.fabricBlend || 'High Durability Poly-Cotton Blend',
        badge: item.badge,
        badgeType: item.badgeType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system_bootstrap',
      };

      const docRef = doc(db, 'products', item.id);
      batch.set(docRef, productDoc);
    }

    await batch.commit();
    console.log(`Successfully seeded ${seedCandidates.length} products to Firestore.`);
    isBootstrappingCatalog = false;
    return seedCandidates.length;
  } catch (err) {
    console.warn('Failed to seed initial products to Firestore:', err);
    isBootstrappingCatalog = false;
    return 0;
  }
}

/**
 * Subscribe to real-time products collection from Firestore
 */
export function subscribeToProducts(
  onUpdate: (products: ManagedProduct[]) => void
): () => void {
  const productsRef = collection(db, 'products');

  return onSnapshot(
    productsRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Trigger seed if empty
        seedInitialProductsIfEmpty().catch(() => {});
        onUpdate([]);
        return;
      }

      const list = snapshot.docs.map((d) => {
        const data = d.data() as ManagedProduct;
        return {
          ...data,
          id: d.id,
          totalStock:
            data.totalStock !== undefined
              ? data.totalStock
              : data.sizes?.reduce((sum, s) => sum + (Number(s.stock) || 0), 0) ?? 0,
        };
      });

      onUpdate(list);
    },
    (err) => {
      console.warn('Products subscription error:', err);
      onUpdate([]);
    }
  );
}

/**
 * Authoritative price & MRP update in Firestore.
 * Immediately syncs across School Store, Tailor Console, and Cart.
 */
export async function updateProductPriceInDb(
  productId: string,
  newPrice: number,
  newMrp?: number,
  userEmail?: string
): Promise<void> {
  const docRef = doc(db, 'products', productId);
  const snap = await getDoc(docRef);

  const price = Math.max(0, Math.round(Number(newPrice) || 0));
  const mrp =
    newMrp !== undefined && newMrp > price
      ? Math.round(Number(newMrp))
      : Math.round(price * 1.18);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const now = new Date().toISOString();
  const author = userEmail || 'badal17patell@gmail.com';

  if (snap.exists()) {
    await updateDoc(
      docRef,
      removeUndefinedFields({
        price,
        mrp,
        discount,
        updatedAt: now,
        updatedBy: author,
      })
    );
  } else {
    // If product was from base catalog and not yet written to Firestore, materialize it
    const baseItem = UNIFORM_ITEMS.find((u) => u.id === productId);
    if (baseItem) {
      const managed = uniformItemToManagedProduct(baseItem);
      managed.price = price;
      managed.mrp = mrp;
      managed.discount = discount;
      managed.updatedAt = now;
      managed.updatedBy = author;
      await setDoc(docRef, removeUndefinedFields(managed), { merge: true });
    } else {
      await setDoc(
        docRef,
        removeUndefinedFields({
          id: productId,
          price,
          mrp,
          discount,
          updatedAt: now,
          updatedBy: author,
        }),
        { merge: true }
      );
    }
  }
}

/**
 * Save or update product in Firestore
 */
export async function saveProductToDb(
  productData: Partial<ManagedProduct>,
  userEmail?: string
): Promise<string> {
  const productsRef = collection(db, 'products');
  const docId = productData.id || doc(productsRef).id;
  const docRef = doc(db, 'products', docId);

  const sizes = productData.sizes || [];
  const totalStock = sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);

  const finalProduct: ManagedProduct = {
    id: docId,
    schoolId: productData.schoolId || 'DAIS-MUM',
    schoolName: productData.schoolName || 'Institutional School',
    name: productData.name?.trim() || 'New School Uniform SKU',
    description: productData.description?.trim() || '',
    sku:
      productData.sku?.trim() ||
      `SKU_${(productData.schoolId || 'MAG').toUpperCase()}_${Date.now().toString().slice(-4)}`,
    category: productData.category || 'shirts',
    subcategory: productData.subcategory || 'School Uniform',
    gender: productData.gender || 'unisex',
    ageGroup: productData.ageGroup || 'All Grades',
    season: productData.season || 'All Season',
    price: Number(productData.price) || 0,
    mrp: Number(productData.mrp) || Math.round((Number(productData.price) || 0) * 1.15),
    discount:
      productData.mrp && productData.price
        ? Math.max(0, Math.round(((productData.mrp - productData.price) / productData.mrp) * 100))
        : 0,
    images:
      productData.images && productData.images.length > 0
        ? productData.images
        : [
            {
              url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPegsFvU5D5TQEr4WgomJcXTDUytvt7GJugPTreh_rTtEsBjjs59JfhFA6J2z5ZMcTEbF8ya16fB3XkDWUfx0IgAPugg33DIoH7HqFXy4SPI0FvAcK3gNt3Jdfh_cFsYWilzYk-tKbyVSOEFVJ2Yt6qcIuticFN-_aMZDF484bPT3PWt3tYUS0C35SUbMiiJ6IXTHcWSGMsVcygNmfw6vJVLu7_Vg5FnR4ni67FXue9ZXYenBr6PudXg',
              isPrimary: true,
              name: 'Default Specification',
            },
          ],
    sizes:
      sizes.length > 0
        ? sizes
        : [
            { size: '28', stock: 50, reserved: 0, sold: 0, lowStockThreshold: 10 },
            { size: '30', stock: 50, reserved: 0, sold: 0, lowStockThreshold: 10 },
            { size: '32', stock: 50, reserved: 0, sold: 0, lowStockThreshold: 10 },
          ],
    status: productData.status || 'active',
    isPublished: productData.isPublished !== undefined ? productData.isPublished : true,
    totalStock,
    fabricBlend: productData.fabricBlend || 'Cotton Blend',
    badge: productData.badge || '',
    badgeType: productData.badgeType || 'pattern',
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail || 'badal17patell@gmail.com',
    createdAt: productData.createdAt || new Date().toISOString(),
    createdBy: productData.createdBy || userEmail || 'badal17patell@gmail.com',
  };

  // Deeply sanitize object to eliminate any undefined values that cause Firestore setDoc to fail
  const sanitized = removeUndefinedFields(finalProduct);
  await setDoc(docRef, sanitized, { merge: true });
  return docId;
}

/**
 * Adjust stock for a specific size of a product and log audit trail
 */
export async function adjustProductStockInDb(
  productId: string,
  size: string,
  adjustment: number,
  reason: 'New Production' | 'Restock' | 'Damaged' | 'Correction' | 'Returned' | 'Manual Adjustment' | string,
  userEmail: string
): Promise<void> {
  const docRef = doc(db, 'products', productId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    throw new Error(`Product ${productId} not found in database`);
  }

  const product = snap.data() as ManagedProduct;
  const currentSizes = [...(product.sizes || [])];
  const sizeIdx = currentSizes.findIndex((s) => s.size === size);

  let previousQty = 0;
  let newQty = 0;

  if (sizeIdx >= 0) {
    previousQty = currentSizes[sizeIdx].stock || 0;
    newQty = Math.max(0, previousQty + adjustment);
    currentSizes[sizeIdx] = {
      ...currentSizes[sizeIdx],
      stock: newQty,
    };
  } else {
    previousQty = 0;
    newQty = Math.max(0, adjustment);
    currentSizes.push({
      size,
      stock: newQty,
      reserved: 0,
      sold: 0,
      lowStockThreshold: 15,
    });
  }

  const totalStock = currentSizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
  const newStatus = totalStock === 0 && product.status === 'active' ? 'out_of_stock' : product.status === 'out_of_stock' && totalStock > 0 ? 'active' : product.status;

  await setDoc(
    docRef,
    {
      sizes: currentSizes,
      totalStock,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail,
    },
    { merge: true }
  );

  // Record inventory audit log
  const logRef = doc(collection(db, 'inventoryLogs'));
  const logEntry: ProductInventoryLog = {
    id: logRef.id,
    productId,
    productName: product.name,
    size,
    adjustment,
    previousQuantity: previousQty,
    newQuantity: newQty,
    reason,
    user: userEmail,
    date: new Date().toISOString(),
  };

  await setDoc(logRef, logEntry);
}

/**
 * Archive a product in Firestore
 */
export async function archiveProductInDb(productId: string, userEmail?: string): Promise<void> {
  const docRef = doc(db, 'products', productId);
  await setDoc(
    docRef,
    {
      status: 'archived',
      isPublished: false,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || 'admin',
    },
    { merge: true }
  );
}

/**
 * Change publish status of a product in Firestore
 */
export async function publishProductInDb(
  productId: string,
  isPublished: boolean,
  userEmail?: string
): Promise<void> {
  const docRef = doc(db, 'products', productId);
  await setDoc(
    docRef,
    {
      isPublished,
      status: isPublished ? 'active' : 'draft',
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || 'admin',
    },
    { merge: true }
  );
}

/**
 * Delete product from Firestore
 */
export async function deleteProductFromDb(productId: string): Promise<void> {
  const docRef = doc(db, 'products', productId);
  await deleteDoc(docRef);
}

/**
 * Subscribe to inventory audit logs from Firestore
 */
export function subscribeToInventoryLogs(
  onUpdate: (logs: ProductInventoryLog[]) => void,
  productId?: string
): () => void {
  const logsRef = collection(db, 'inventoryLogs');
  const q = productId ? query(logsRef, where('productId', '==', productId)) : logsRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as ProductInventoryLog);
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(list);
    },
    (err) => {
      console.warn('Inventory logs subscription error:', err);
      onUpdate([]);
    }
  );
}

/**
 * Decrement inventory in Firestore when customer order is confirmed
 */
export async function decrementInventoryForOrder(
  items: { productId?: string; name: string; size: string; qty: number }[],
  orderId?: string,
  userEmail?: string
): Promise<void> {
  for (const item of items) {
    try {
      let targetProductRef = item.productId ? doc(db, 'products', item.productId) : null;

      if (!targetProductRef) {
        // Find product by name match
        const q = query(collection(db, 'products'), where('name', '==', item.name));
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetProductRef = snap.docs[0].ref;
        }
      }

      if (targetProductRef) {
        const prodSnap = await getDoc(targetProductRef);
        if (prodSnap.exists()) {
          const prodData = prodSnap.data() as ManagedProduct;
          const updatedSizes = [...(prodData.sizes || [])];
          const sIdx = updatedSizes.findIndex((s) => s.size === item.size);

          if (sIdx >= 0) {
            const currentStock = updatedSizes[sIdx].stock || 0;
            const newStock = Math.max(0, currentStock - item.qty);
            const soldCount = (updatedSizes[sIdx].sold || 0) + item.qty;

            updatedSizes[sIdx] = {
              ...updatedSizes[sIdx],
              stock: newStock,
              sold: soldCount,
            };

            const newTotalStock = updatedSizes.reduce((s, x) => s + (Number(x.stock) || 0), 0);

            await setDoc(
              targetProductRef,
              {
                sizes: updatedSizes,
                totalStock: newTotalStock,
                status: newTotalStock === 0 ? 'out_of_stock' : prodData.status,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );

            // Log adjustment
            const logRef = doc(collection(db, 'inventoryLogs'));
            await setDoc(logRef, {
              id: logRef.id,
              productId: targetProductRef.id,
              productName: prodData.name,
              size: item.size,
              adjustment: -item.qty,
              previousQuantity: currentStock,
              newQuantity: newStock,
              reason: `Order Placed ${orderId || ''}`,
              user: userEmail || 'customer_checkout',
              date: new Date().toISOString(),
            });
          }
        }
      }
    } catch (e) {
      console.warn('Inventory decrement warning for item:', item, e);
    }
  }
}

/**
 * Upload image to Firebase Storage with automatic fallback to data URL
 */
export async function uploadProductImageToStorage(
  file: File,
  productId: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; storagePath?: string }> {
  try {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `products/${productId}/${timestamp}_${sanitizedName}`;
    const fileRef = storageRef(storage, path);

    const uploadTask = uploadBytesResumable(fileRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        (error) => {
          console.warn('Firebase Storage direct upload failed, using high-fidelity local reader fallback:', error);
          // Fallback to FileReader Data URL
          const reader = new FileReader();
          reader.onload = () => {
            resolve({ url: reader.result as string });
          };
          reader.onerror = () => reject(new Error('Failed to read image file'));
          reader.readAsDataURL(file);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ url: downloadUrl, storagePath: path });
          } catch {
            const reader = new FileReader();
            reader.onload = () => resolve({ url: reader.result as string });
            reader.onerror = () => reject(new Error('Failed to read image file'));
            reader.readAsDataURL(file);
          }
        }
      );
    });
  } catch (err) {
    console.warn('Direct storage error, falling back to data URL:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ url: reader.result as string });
      reader.onerror = () => reject(err);
      reader.readAsDataURL(file);
    });
  }
}
