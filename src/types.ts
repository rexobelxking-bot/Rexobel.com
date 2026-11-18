export type ProductCategory = 'Outerwear' | 'Knitwear' | 'Trousers' | 'Accessories';

export type GarmentSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'OS';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  price: number;
  fabricWeight: string;
  composition: string;
  origin: string;
  colorName: string;
  fit: string;
  description: string;
  care: string[];
  sizes: GarmentSize[];
  image: string;
  availability: string;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  size: GarmentSize;
  quantity: number;
  unitPrice: number;
  image: string;
}

export type PaymentProvider = 'card' | 'apple_pay' | 'paypal' | 'klarna';

export interface PaymentMethodInfo {
  provider: PaymentProvider;
  label: string;
  summary: string;
}

export type OrderTrackingStatus = 'Processing' | 'In Transit' | 'Delivered';

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: 'Confirmed' | 'Preparing Dispatch' | 'Shipped';
  trackingStatus: OrderTrackingStatus;
  trackingNumber?: string;
  estimatedDelivery?: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod?: PaymentMethodInfo;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
}

export interface MemberProfile {
  id: string;
  name: string;
  email: string;
  handle: string;
  bio: string;
  avatarUrl: string | null;
  preferredSize: GarmentSize;
  shippingAddress: ShippingAddress;
  wishlist: string[];
  orders: Order[];
  memberSince: string;
}

export interface CartItem {
  product: Product;
  size: GarmentSize;
  quantity: number;
}
