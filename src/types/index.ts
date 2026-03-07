export interface User {
  id: string;
  phone: string;
  name: string;
  storeName: string;
  storeAddress?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  barcode?: string;
  price: number;
  costPrice: number;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalCredit: number;
  totalPaid: number;
  reminderFrequency?: 'weekly' | 'monthly' | 'custom';
  createdAt: string;
}

export interface CreditRecord {
  id: string;
  customerId: string;
  amount: number;
  type: 'credit' | 'payment';
  description?: string;
  date: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  company?: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  items: PurchaseOrderItem[];
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  paymentType: 'cash' | 'upi' | 'credit';
  customerId?: string;
  discount: number;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  totalOutstanding: number;
  weeklySales: { day: string; amount: number }[];
  topProducts: { name: string; quantity: number }[];
}

export type PaymentType = 'cash' | 'upi' | 'credit';
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type ReminderFrequency = 'weekly' | 'monthly' | 'custom';
