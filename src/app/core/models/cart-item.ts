export interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  quantity: number;
  imageUrl?: string;
}
