import { create } from 'zustand';
import { Product } from '../types';
import { getDatabase, generateId } from '../db/database';

interface InventoryState {
  products: Product[];
  isLoading: boolean;
  searchQuery: string;
  selectedCategory: string;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  loadProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (id: string, quantityChange: number) => Promise<void>;
  getLowStockProducts: () => Product[];
  getProductById: (id: string) => Product | undefined;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  isLoading: false,
  searchQuery: '',
  selectedCategory: 'All',

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  loadProducts: async () => {
    set({ isLoading: true });
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<any>('SELECT * FROM products ORDER BY name ASC');
      const products: Product[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        barcode: row.barcode,
        price: row.price,
        costPrice: row.cost_price,
        quantity: row.quantity,
        unit: row.unit,
        lowStockThreshold: row.low_stock_threshold,
        imageUri: row.image_uri,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
      set({ products, isLoading: false });
    } catch (error) {
      console.error('Error loading products:', error);
      set({ isLoading: false });
    }
  },

  addProduct: async (product) => {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO products (id, name, category, barcode, price, cost_price, quantity, unit, low_stock_threshold, image_uri, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, product.name, product.category, product.barcode || null, product.price, product.costPrice, product.quantity, product.unit, product.lowStockThreshold, product.imageUri || null, now, now]
    );
    await get().loadProducts();
  },

  updateProduct: async (product) => {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE products SET name=?, category=?, barcode=?, price=?, cost_price=?, quantity=?, unit=?, low_stock_threshold=?, image_uri=?, updated_at=? WHERE id=?`,
      [product.name, product.category, product.barcode || null, product.price, product.costPrice, product.quantity, product.unit, product.lowStockThreshold, product.imageUri || null, now, product.id]
    );
    await get().loadProducts();
  },

  deleteProduct: async (id) => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM products WHERE id=?', [id]);
    await get().loadProducts();
  },

  updateStock: async (id, quantityChange) => {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE products SET quantity = quantity + ?, updated_at = ? WHERE id = ?',
      [quantityChange, new Date().toISOString(), id]
    );
    await get().loadProducts();
  },

  getLowStockProducts: () => {
    return get().products.filter((p) => p.quantity <= p.lowStockThreshold);
  },

  getProductById: (id) => {
    return get().products.find((p) => p.id === id);
  },
}));
