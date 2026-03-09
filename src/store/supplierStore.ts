import { create } from 'zustand';
import { Supplier, PurchaseOrder, PurchaseOrderItem, SupplierCreditRecord } from '../types';
import { getDatabase, generateId } from '../db/database';

interface SupplierState {
  suppliers: Supplier[];
  orders: PurchaseOrder[];
  supplierCreditRecords: SupplierCreditRecord[];
  isLoading: boolean;
  loadSuppliers: () => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalCredit' | 'totalPaid' | 'createdAt'>) => Promise<void>;
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
  addSupplierCreditRecord: (record: Omit<SupplierCreditRecord, 'id' | 'createdAt'>) => Promise<void>;
  loadSupplierCreditRecords: (supplierId: string) => Promise<void>;
  getTotalSupplierOutstanding: () => number;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  orders: [],
  supplierCreditRecords: [],
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
        totalCredit: row.total_credit || 0,
        totalPaid: row.total_paid || 0,
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
      `INSERT INTO suppliers (id, name, phone, address, company, total_credit, total_paid, created_at) VALUES (?, ?, ?, ?, ?, 0, 0, ?)`,
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

  addSupplierCreditRecord: async (record) => {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO supplier_credit_records (id, supplier_id, amount, type, description, date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, record.supplierId, record.amount, record.type, record.description || null, record.date, now]
    );

    if (record.type === 'credit') {
      await db.runAsync(
        'UPDATE suppliers SET total_credit = total_credit + ? WHERE id = ?',
        [record.amount, record.supplierId]
      );
    } else {
      await db.runAsync(
        'UPDATE suppliers SET total_paid = total_paid + ? WHERE id = ?',
        [record.amount, record.supplierId]
      );
    }

    await get().loadSuppliers();
    await get().loadSupplierCreditRecords(record.supplierId);
  },

  loadSupplierCreditRecords: async (supplierId) => {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM supplier_credit_records WHERE supplier_id = ? ORDER BY date DESC',
        [supplierId]
      );
      const supplierCreditRecords: SupplierCreditRecord[] = rows.map((row) => ({
        id: row.id,
        supplierId: row.supplier_id,
        amount: row.amount,
        type: row.type,
        description: row.description,
        date: row.date,
        createdAt: row.created_at,
      }));
      set({ supplierCreditRecords });
    } catch (error) {
      console.error('Error loading supplier credit records:', error);
    }
  },

  getTotalSupplierOutstanding: () => {
    return get().suppliers.reduce((sum, s) => sum + (s.totalCredit - s.totalPaid), 0);
  },
}));
