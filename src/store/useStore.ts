import { create } from 'zustand';

export type PageName =
  | 'login'
  | 'admin-dashboard'
  | 'cashier-dashboard'
  | 'products'
  | 'transaction'
  | 'stock-report'
  | 'sales-report';

interface User {
  id: string;
  username: string;
  role: string;
  name: string;
}

interface StoreState {
  // Auth
  token: string | null;
  user: User | null;
  setAuth: (token: string | null, user: User | null) => void;
  logout: () => void;

  // Navigation
  currentPage: PageName;
  setPage: (page: PageName) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;

  // Products
  products: Product[];
  setProducts: (products: Product[]) => void;

  // Last transaction
  lastTransaction: Transaction | null;
  setLastTransaction: (transaction: Transaction | null) => void;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
  subtotal: number;
}

export interface TransactionDetail {
  id: string;
  productId: string;
  quantity: number;
  subtotal: number;
  product: { name: string; price: number };
}

export interface Transaction {
  id: string;
  kasirId: string;
  totalPrice: number;
  payment: number;
  change: number;
  createdAt: string;
  kasir: { username: string; name: string };
  details: TransactionDetail[];
}

export const useStore = create<StoreState>((set, get) => ({
  // Auth
  token: typeof window !== 'undefined' ? localStorage.getItem('pos_token') : null,
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('pos_user') || 'null') : null,
  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('pos_token', token);
        localStorage.setItem('pos_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_user');
      }
    }
    set({ token, user });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
    }
    set({ token: null, user: null, currentPage: 'login', cart: [], lastTransaction: null });
  },

  // Navigation
  currentPage: 'login',
  setPage: (page) => set({ currentPage: page }),

  // Cart
  cart: [],
  addToCart: (item) => {
    const { cart } = get();
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      const newQty = existing.quantity + 1;
      if (newQty > existing.stock) return;
      set({
        cart: cart.map((c) =>
          c.id === item.id ? { ...c, quantity: newQty, subtotal: newQty * c.price } : c
        ),
      });
    } else {
      if (item.quantity <= 0) return;
      set({ cart: [...cart, { ...item, quantity: 1, subtotal: item.price }] });
    }
  },
  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((c) => c.id !== productId) });
  },
  updateCartQuantity: (productId, quantity) => {
    const { cart } = get();
    const item = cart.find((c) => c.id === productId);
    if (!item) return;
    if (quantity <= 0) {
      set({ cart: cart.filter((c) => c.id !== productId) });
      return;
    }
    if (quantity > item.stock) return;
    set({
      cart: cart.map((c) =>
        c.id === productId ? { ...c, quantity, subtotal: quantity * c.price } : c
      ),
    });
  },
  clearCart: () => set({ cart: [] }),
  getCartTotal: () => get().cart.reduce((sum, item) => sum + item.subtotal, 0),

  // Products
  products: [],
  setProducts: (products) => set({ products }),

  // Last transaction
  lastTransaction: null,
  setLastTransaction: (transaction) => set({ lastTransaction: transaction }),
}));
