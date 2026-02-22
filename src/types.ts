export interface User {
  id: string | number;
  name: string;
  email: string;
  role: 'producer' | 'consumer';
  location?: string;
  description?: string;
  image_url?: string;
}

export interface Product {
  id: number;
  producer_id: string | number;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  category: string;
  image_url: string;
  producer_name?: string;
  producer_location?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: number;
  consumer_id: string | number;
  total: number;
  status: string;
  created_at: string;
}
