export type ItemCondition = 'LIKE_NEW' | 'GOOD' | 'FAIR';
export type ItemStatus = 'PENDING' | 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'REJECTED';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  itemCount: number;
}

export interface ItemImage {
  id: string;
  url: string;
  position: number;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: ItemCondition;
  area: string;
  status: ItemStatus;
  featured: boolean;
  soldAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string; icon: string };
  images: ItemImage[];
}

export interface ItemList {
  items: Item[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Review {
  id: string;
  name: string;
  text: string;
  rating: number;
  createdAt: string;
}
