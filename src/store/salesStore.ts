import { create } from 'zustand';
import { Sale, SaleItem, DashboardStats } from '../types';
import { getDatabase, generateId } from '../db/database';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  maxQuantity: number;
}

interface SalesState {
  sales: Sale[];
  cart: CartItem[];
  discount: number;
  isLoading: boolean;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  setDiscount: (discount: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getGrandTotal: () => number;
  completeSale: (paymentType: 'cash' | 'upi' | 'credit', customerId?: string) => Promise<Sale>;
  loadSales: (limit?: number) => Promise<void>;
  loadDashboardStats: () => Promise<DashboardStats>;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  sales: [],
  cart: [],
  discount: 0,
  isLoading: false,

  addToCart: (item) => {
    const cart = get().cart;
    const existing = cart.find((c) => c.productId === item.productId);
    if (existing) {
      set({
        cart: cart.map((c) =>
          c.productId === item.productId
            ? { ...c, quantity: Math.min(c.quantity + item.quantity, c.maxQuantity) }
            : c
        ),
      });
    } else {
      set({ cart: [...cart, item] });
    }
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((c) => c.productId !== productId) });
  },

  updateCartQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set({
      cart: get().cart.map((c) =>
        c.productId === productId ? { ...c, quantity: Math.min(quantity, c.maxQuantity) } : c
      ),
    });
  },

  setDiscount: (discount) => set({ discount }),

  clearCart: () => set({ cart: [], discount: 0 }),

  getCartTotal: () => {
    return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getGrandTotal: () => {
    return get().getCartTotal() - get().discount;
  },

  completeSale: async (paymentType, customerId) => {
    const db = await getDatabase();
    const { cart, discount } = get();
    const saleId = generateId();
    const now = new Date().toISOString();
    const totalAmount = get().getGrandTotal();

    await db.runAsync(
      `INSERT INTO sales (id, total_amount, payment_type, customer_id, discount, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [saleId, totalAmount, paymentType, customerId || null, discount, now]
    );

    const saleItems: SaleItem[] = [];
    for (const item of cart) {
      const itemId = generateId();
      await db.runAsync(
        `INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [itemId, saleId, item.productId, item.productName, item.quantity, item.price]
      );
      // Deduct stock
      await db.runAsync(
        'UPDATE products SET quantity = quantity - ?, updated_at = ? WHERE id = ?',
        [item.quantity, now, item.productId]
      );
      saleItems.push({
        id: itemId,
        saleId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      });
    }

    // If credit sale, update customer credit
    if (paymentType === 'credit' && customerId) {
      await db.runAsync(
        'UPDATE customers SET total_credit = total_credit + ? WHERE id = ?',
        [totalAmount, customerId]
      );
      const creditId = generateId();
      await db.runAsync(
        `INSERT INTO credit_records (id, customer_id, amount, type, description, date, created_at)
         VALUES (?, ?, ?, 'credit', ?, ?, ?)`,
        [creditId, customerId, totalAmount, `Bill #${saleId.slice(0, 8)}`, now, now]
      );
    }

    const sale: Sale = {
      id: saleId,
      items: saleItems,
      totalAmount,
      paymentType,
      customerId,
      discount,
      createdAt: now,
    };

    get().clearCart();
    return sale;
  },

  loadSales: async (limit = 50) => {
    set({ isLoading: true });
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<any>(
        `SELECT * FROM sales ORDER BY created_at DESC LIMIT ?`,
        [limit]
      );

      const sales: Sale[] = [];
      for (const row of rows) {
        const itemRows = await db.getAllAsync<any>(
          'SELECT * FROM sale_items WHERE sale_id = ?',
          [row.id]
        );
        sales.push({
          id: row.id,
          items: itemRows.map((ir: any) => ({
            id: ir.id,
            saleId: ir.sale_id,
            productId: ir.product_id,
            productName: ir.product_name,
            quantity: ir.quantity,
            price: ir.price,
          })),
          totalAmount: row.total_amount,
          paymentType: row.payment_type,
          customerId: row.customer_id,
          discount: row.discount,
          createdAt: row.created_at,
        });
      }
      set({ sales, isLoading: false });
    } catch (error) {
      console.error('Error loading sales:', error);
      set({ isLoading: false });
    }
  },

  loadDashboardStats: async (): Promise<DashboardStats> => {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];

    const todayStats = await db.getFirstAsync<any>(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE date(created_at) = ?`,
      [today]
    );

    const productCount = await db.getFirstAsync<any>('SELECT COUNT(*) as count FROM products');
    const lowStockCount = await db.getFirstAsync<any>(
      'SELECT COUNT(*) as count FROM products WHERE quantity <= low_stock_threshold'
    );

    const customerCount = await db.getFirstAsync<any>('SELECT COUNT(*) as count FROM customers');
    const outstanding = await db.getFirstAsync<any>(
      'SELECT COALESCE(SUM(total_credit - total_paid), 0) as total FROM customers'
    );

    // Weekly sales
    const weeklyRows = await db.getAllAsync<any>(
      `SELECT date(created_at) as day, COALESCE(SUM(total_amount), 0) as amount
       FROM sales WHERE created_at >= datetime('now', '-7 days')
       GROUP BY date(created_at) ORDER BY day ASC`
    );

    // Top products
    const topRows = await db.getAllAsync<any>(
      `SELECT product_name as name, SUM(quantity) as quantity
       FROM sale_items si JOIN sales s ON si.sale_id = s.id
       WHERE s.created_at >= datetime('now', '-30 days')
       GROUP BY product_name ORDER BY quantity DESC LIMIT 5`
    );

    return {
      todaySales: todayStats?.count || 0,
      todayRevenue: todayStats?.revenue || 0,
      totalProducts: productCount?.count || 0,
      lowStockCount: lowStockCount?.count || 0,
      totalCustomers: customerCount?.count || 0,
      totalOutstanding: outstanding?.total || 0,
      weeklySales: weeklyRows.map((r: any) => ({ day: r.day, amount: r.amount })),
      topProducts: topRows.map((r: any) => ({ name: r.name, quantity: r.quantity })),
    };
  },
}));
