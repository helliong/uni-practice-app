export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: 'hoodie' | 'tshirt' | 'mug' | 'sticker' | 'other';
  availableSizes?: string[]; // e.g. ['S', 'M', 'L', 'XL']
  availableColors?: string[]; // e.g. ['black', 'white', 'gray']
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'developer' | 'designer';
}
