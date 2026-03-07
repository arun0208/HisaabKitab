import { create } from 'zustand';
import { Customer, CreditRecord } from '../types';
import { getDatabase, generateId } from '../db/database';

interface CustomerState {
  customers: Customer[];
  creditRecords: CreditRecord[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadCustomers: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'totalCredit' | 'totalPaid' | 'createdAt'>) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addCreditRecord: (record: Omit<CreditRecord, 'id' | 'createdAt'>) => Promise<void>;
  loadCreditRecords: (customerId: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  getTotalOutstanding: () => number;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  creditRecords: [],
  isLoading: false,
  searchQuery: '',

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  loadCustomers: async () => {
    set({ isLoading: true });
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<any>('SELECT * FROM customers ORDER BY name ASC');
      const customers: Customer[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        address: row.address,
        totalCredit: row.total_credit,
        totalPaid: row.total_paid,
        reminderFrequency: row.reminder_frequency,
        createdAt: row.created_at,
      }));
      set({ customers, isLoading: false });
    } catch (error) {
      console.error('Error loading customers:', error);
      set({ isLoading: false });
    }
  },

  addCustomer: async (customer) => {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO customers (id, name, phone, address, total_credit, total_paid, reminder_frequency, created_at)
       VALUES (?, ?, ?, ?, 0, 0, ?, ?)`,
      [id, customer.name, customer.phone, customer.address || null, customer.reminderFrequency || 'monthly', now]
    );
    await get().loadCustomers();
  },

  updateCustomer: async (customer) => {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE customers SET name=?, phone=?, address=?, reminder_frequency=? WHERE id=?`,
      [customer.name, customer.phone, customer.address || null, customer.reminderFrequency || 'monthly', customer.id]
    );
    await get().loadCustomers();
  },

  deleteCustomer: async (id) => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM customers WHERE id=?', [id]);
    await get().loadCustomers();
  },

  addCreditRecord: async (record) => {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO credit_records (id, customer_id, amount, type, description, date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, record.customerId, record.amount, record.type, record.description || null, record.date, now]
    );

    if (record.type === 'credit') {
      await db.runAsync(
        'UPDATE customers SET total_credit = total_credit + ? WHERE id = ?',
        [record.amount, record.customerId]
      );
    } else {
      await db.runAsync(
        'UPDATE customers SET total_paid = total_paid + ? WHERE id = ?',
        [record.amount, record.customerId]
      );
    }

    await get().loadCustomers();
    await get().loadCreditRecords(record.customerId);
  },

  loadCreditRecords: async (customerId) => {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM credit_records WHERE customer_id = ? ORDER BY date DESC',
        [customerId]
      );
      const creditRecords: CreditRecord[] = rows.map((row) => ({
        id: row.id,
        customerId: row.customer_id,
        amount: row.amount,
        type: row.type,
        description: row.description,
        date: row.date,
        createdAt: row.created_at,
      }));
      set({ creditRecords });
    } catch (error) {
      console.error('Error loading credit records:', error);
    }
  },

  getCustomerById: (id) => {
    return get().customers.find((c) => c.id === id);
  },

  getTotalOutstanding: () => {
    return get().customers.reduce((sum, c) => sum + (c.totalCredit - c.totalPaid), 0);
  },
}));
