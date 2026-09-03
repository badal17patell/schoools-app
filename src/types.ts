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

export interface UniformItem {
  id: string;
  name: string;
  category: 'boys' | 'girls' | 'shirts' | 'trousers' | 'skirts' | 'blazers' | 'accessories' | 'socks' | 'sweaters' | 'shoes';
  categoryLabel: string;
  price: number;
  originalPrice: number;
  image: string;
  altText: string;
  badge?: string;
  badgeType?: 'pattern' | 'stain' | 'wool' | 'house';
  inStock: boolean;
  availableSizes: string[];
  defaultSize: string;
  fabricBlend?: string;
  schoolId: string;
  description?: string;
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
