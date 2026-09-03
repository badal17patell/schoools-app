export interface School {
  id: string;
  name: string;
  board: string;
  city: string;
  state: string;
  address: string;
  iconName: string;
  approvedYear: string;
  curriculum: string;
  grades: string;
}

export interface ProductImage {
  url: string;
  storagePath?: string;
  isPrimary: boolean;
  name?: string;
}

export interface ProductSizeInventory {
  size: string;
  stock: number;
  reserved: number;
  sold: number;
  lowStockThreshold: number;
}

export interface ProductInventoryLog {
  id: string;
  date: string;
  user: string;
  productId: string;
  productName: string;
  size: string;
  previousQuantity: number;
  adjustment: number;
  newQuantity: number;
  reason: 'New Production' | 'Restock' | 'Damaged' | 'Correction' | 'Returned' | 'Manual Adjustment' | string;
}

export interface ManagedProduct {
  id: string;
  schoolId: string;
  schoolName: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  subcategory?: string;
  gender: 'boys' | 'girls' | 'unisex';
  ageGroup?: string;
  season?: string;
  price: number;
  mrp: number;
  discount?: number;
  images: ProductImage[];
  sizes: ProductSizeInventory[];
  status: 'draft' | 'active' | 'out_of_stock' | 'discontinued' | 'archived';
  isPublished: boolean;
  totalStock: number;
  fabricBlend?: string;
  badge?: string;
  badgeType?: 'pattern' | 'stain' | 'wool' | 'house' | 'cotton' | 'leather' | 'thermal';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface UniformItem {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  price: number;
  originalPrice: number;
  image: string;
  altText: string;
  badge?: string;
  badgeType?: 'pattern' | 'stain' | 'wool' | 'house' | 'cotton' | 'leather' | 'thermal';
  inStock: boolean;
  availableSizes: string[];
  defaultSize: string;
  fabricBlend?: string;
  schoolId: string;
  schoolName?: string;
  description?: string;
  gender?: 'boys' | 'girls' | 'unisex';
  sku?: string;
  images?: ProductImage[];
  sizesInventory?: ProductSizeInventory[];
  status?: 'draft' | 'active' | 'out_of_stock' | 'discontinued' | 'archived';
  isPublished?: boolean;
  totalStock?: number;
  ageGroup?: string;
  season?: string;
}

export interface CartItem {
  item: UniformItem;
  size: string;
  quantity: number;
}

export interface ChildProfile {
  id: string;
  name: string;
  initials: string;
  school: string;
  grade: string;
  board: string;
  session: string;
  height: string;
  heightInches: string;
  weight: string;
  weightCategory: string;
  age: number;
  growthBuffer: string;
  active: boolean;
  measurements?: {
    chest?: string;
    waist?: string;
    inseam?: string;
  };
  sizes: {
    shirt: string;
    trousers?: string;
    skirt?: string;
    blazer: string;
    sportsKit: string;
    shoes?: string;
    pullover?: string;
  };
}

export interface OrderTimelineStage {
  stage: number;
  title: string;
  timestamp?: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  icon: string;
  assignedNote?: string;
}

export interface Order {
  id: string;
  date: string;
  estimatedArrival: string;
  total: number;
  totalAmount?: number;
  paymentMethod: string;
  studentName: string;
  studentGrade: string;
  school: string;
  house: string;
  shippingAddress: string;
  contactNumber: string;
  statusText: string;
  status: 'processing' | 'tailoring' | 'quality-check' | 'in-transit' | 'delivered';
  timelineStep: number; // e.g. 3 of 7
  userId?: string;
  userEmail?: string;
  items: {
    name: string;
    spec: string;
    size: string;
    qty: number;
    price: number;
    image: string;
    patternVerified: boolean;
  }[];
}

export type ActiveScreen =
  | 'home'
  | 'store'
  | 'product-details'
  | 'cart'
  | 'track-order'
  | 'account'
  | 'admin'
  | 'login'
  | 'invoice';

export interface Address {
  id?: string;
  fullName: string;
  phone: string;
  flat: string;
  street: string;
  area?: string;
  city: string;
  state?: string;
  pincode: string;
  tag: 'Home' | 'School Campus Pickup' | 'Office';
}

export interface UserAccount {
  id?: string;
  name: string;
  phone: string;
  email: string;
  role: 'parent' | 'tailor' | 'guest';
  isLoggedIn: boolean;
  avatarUrl?: string;
  defaultAddress: Address;
}

export interface ExchangeRequest {
  id: string;
  orderId: string;
  userId?: string;
  studentName: string;
  itemName: string;
  currentSize: string;
  requestedSize: string;
  reason: string;
  pickupMode: 'Doorstep Courier Swap' | 'School Uniform Depot Pickup';
  status: 'Initiated' | 'Approved by Master Tailor' | 'Replacement Dispatched' | 'Completed';
  requestDate: string;
}

export function getPrimaryImageUrl(images: any): string {
  const fallback = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPegsFvU5D5TQEr4WgomJcXTDUytvt7GJugPTreh_rTtEsBjjs59JfhFA6J2z5ZMcTEbF8ya16fB3XkDWUfx0IgAPugg33DIoH7HqFXy4SPI0FvAcK3gNt3Jdfh_cFsYWilzYk-tKbyVSOEFVJ2Yt6qcIuticFN-_aMZDF484bPT3PWt3tYUS0C35SUbMiiJ6IXTHcWSGMsVcygNmfw6vJVLu7_Vg5FnR4ni67FXue9ZXYenBr6PudXg';
  if (!images) return fallback;
  if (typeof images === 'string') return images;
  if (Array.isArray(images)) {
    const found = images.find((i: any) => i && typeof i === 'object' && i.isPrimary);
    if (found && found.url) return found.url;
    if (images[0]) {
      if (typeof images[0] === 'string') return images[0];
      if (images[0].url) return images[0].url;
    }
  }
  if (typeof images === 'object' && (images as any).url) {
    return (images as any).url;
  }
  return fallback;
}
