
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number | null;
  stock_quantity: number;
  image_url: string;
  category: string;
  is_featured?: boolean;
  is_flash_sale?: boolean;
  created_at?: string;
  // Dynamic fields for real ratings
  avg_rating?: number;
  review_count?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  role: 'admin' | 'customer';
}

export interface OrderItem {
  id?: string;
  product_id: string;
  name: string; // Snapshot of name at time of purchase
  price: number; // Snapshot of price at time of purchase
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  user_email?: string; // Optional for display
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  total_amount: number;
  payment_method: 'esewa_manual' | 'esewa_direct' | 'cod';
  payment_details?: string; // Phone number or Transaction ID
  shipping_address?: string;
  created_at: string;
  items?: OrderItem[]; // For fetching joined data
  discount_applied?: number;
}

export interface Review {
  id: string;
  product_id?: string;
  product_name?: string; // For Admin display
  user_name: string;
  rating: number;
  comment: string;
  reply?: string; // Admin reply
  date: string;
  created_at?: string;
}

export interface Voucher {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  is_active: boolean;
  created_at: string;
}
