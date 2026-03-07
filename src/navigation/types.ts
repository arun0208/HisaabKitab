import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  OTP: { phone: string };
  StoreSetup: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  InventoryTab: NavigatorScreenParams<InventoryStackParamList>;
  BillingTab: undefined;
  CustomersTab: NavigatorScreenParams<CustomerStackParamList>;
  MoreTab: NavigatorScreenParams<MoreStackParamList>;
};

export type HomeStackParamList = {
  Dashboard: undefined;
};

export type InventoryStackParamList = {
  InventoryList: undefined;
  AddProduct: { productId?: string } | undefined;
  ProductDetail: { productId: string };
};

export type CustomerStackParamList = {
  CustomerList: undefined;
  AddCustomer: { customerId?: string } | undefined;
  CustomerDetail: { customerId: string };
  AddCreditRecord: { customerId: string; type: 'credit' | 'payment' };
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  SupplierList: undefined;
  AddSupplier: { supplierId?: string } | undefined;
  SupplierDetail: { supplierId: string };
  CreatePurchaseOrder: { supplierId: string };
  Analytics: undefined;
  Settings: undefined;
};
