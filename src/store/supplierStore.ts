import { create } from 'zustand';
import { Supplier, PurchaseOrder, PurchaseOrderItem } from '../types';
import { getDatabase, generateId } from '../db/database';

interface SupplierState {
  suppliers: Supplier[];
  orders: PurchaseOrder[];
  isLoading: boolean;
  loadSuppliers: () => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  createPurchaseOrder: (
    supplierId: string,
    items: Omit<PurchaseOrderItem, 'id' | 'orderId'>[],
    notes?: string
  ) => Promise<PurchaseOrder>;
  loadOrders: (supplierId?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: PurchaseOrder['status']) => Promise<void>;
  getSupplierById: (id: string) => Supplier | undefined;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  orders: [],
  isLoading: false,

  loadSuppliers: async () => {
    set({ isLoading: true });
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<any>('SELECT * FROM suppliers ORDER BY name ASC');
      const suppliers: Supplier[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        address: row.address,
        company: row.company,
        createdAt: row.created_at,
      }));
      set({ suppliers, isLoading: false });
    } catch (error) {
      console.error('Error loading suppliers:', error);
      set({ isLoading: false });
    }
  },

  addSupplier: async (supplier) => {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO suppliers (id, name, phone, address, company, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, supplier.name, supplier.phone, supplier.address || null, supplier.company || null, now]
    );
    await get().loadSuppliers();
  },

  updateSupplier: async (supplier) => {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE suppliers SET name=?, phone=?, address=?, company=? WHERE id=?`,
      [supplier.name, supplier.phone, supplier.address || null, supplier.company || null, supplier.id]
    );
    await get().loadSuppliers();
  },

  deleteSupplier: async (id) => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM suppliers WHERE id=?', [id]);
    await get().loadSuppliers();
  },

  createPurchaseOrder: async (supplierId, items, notes) => {
    const db = await getDatabase();
    const orderId = generateId();
    const now = new Date().toISOString();
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    await db.runAsync(
      `INSERT INTO purchase_orders (id, supplier_id, status, total_amount, notes, created_at, updated_at)
       VALUES (?, ?, 'pending', ?, ?, ?, ?)`,
      [orderId, supplierId, totalAmount, notes || null, now, now]
    );

    for (const item of items) {
      const itemId = generateId();
      await db.runAsync(
        `INSERT INTO purchase_order_items (id, order_id, product_id, product_name, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [itemId, orderId, item.productId, item.productName, item.quantity, item.unitPrice]
      );
    }

    const order: PurchaseOrder = {
      id: orderId,
      supplierId,
      items: items.map((item, idx) => ({ ...item, id: `temp-${idx}`, orderId })),
      status: 'pending',
      totalAmount,
      notes,
      createdAt: now,
      updatedAt: now,
    };

    await get().loadOrders(supplierId);
    return order;
  },

  loadOrders: async (supplierId) => {
    try {
      const db = await getDatabase();
      const query = supplierId
        ? 'SELECT * FROM purchase_orders WHERE supplier_id = ? ORDER BY created_at DESC'
        : 'SELECT * FROM purchase_orders ORDER BY created_at DESC';
      const params = supplierId ? [supplierId] : [];
      const rows = await db.getAllAsync<any>(query, params);

      const orders: PurchaseOrder[] = [];
      for (const row of rows) {
        const itemRows = await db.getAllAsync<any>(
          'SELECT * FROM purchase_order_items WHERE order_id = ?',
          [row.id]
        );
        orders.push({
          id: row.id,
          supplierId: row.supplier_id,
          items: itemRows.map((ir: any) => ({
            id: ir.id,
            orderId: ir.order_id,
            productId: ir.product_id,
            productName: ir.product_name,
            quantity: ir.quantity,
            unitPrice: ir.unit_price,
          })),
          status: row.status,
          totalAmount: row.total_amount,
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }
      set({ orders });
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  },

  updateOrderStatus: async (orderId, status) => {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE purchase_orders SET status=?, updated_at=? WHERE id=?',
      [status, new Date().toISOString(), orderId]
    );
    await get().loadOrders();
  },

  getSupplierById: (id) => {
    return get().suppliers.find((s) => s.id === id);
  },
}));
