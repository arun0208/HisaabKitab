import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  HomeStackParamList,
  InventoryStackParamList,
  CustomerStackParamList,
  MoreStackParamList,
} from './types';

// Auth screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OTPScreen } from '../screens/auth/OTPScreen';
import { StoreSetupScreen } from '../screens/auth/StoreSetupScreen';

// Home screens
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';

// Inventory screens
import { InventoryListScreen } from '../screens/inventory/InventoryListScreen';
import { AddProductScreen } from '../screens/inventory/AddProductScreen';
import { ProductDetailScreen } from '../screens/inventory/ProductDetailScreen';

// Billing screens
import { BillingScreen } from '../screens/billing/BillingScreen';

// Customer screens
import { CustomerListScreen } from '../screens/customers/CustomerListScreen';
import { AddCustomerScreen } from '../screens/customers/AddCustomerScreen';
import { CustomerDetailScreen } from '../screens/customers/CustomerDetailScreen';
import { AddCreditRecordScreen } from '../screens/customers/AddCreditRecordScreen';

// More screens
import { MoreMenuScreen } from '../screens/settings/MoreMenuScreen';
import { SupplierListScreen } from '../screens/suppliers/SupplierListScreen';
import { AddSupplierScreen } from '../screens/suppliers/AddSupplierScreen';
import { SupplierDetailScreen } from '../screens/suppliers/SupplierDetailScreen';
import { CreatePurchaseOrderScreen } from '../screens/suppliers/CreatePurchaseOrderScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const InventoryStack = createNativeStackNavigator<InventoryStackParamList>();
const CustomerStack = createNativeStackNavigator<CustomerStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="OTP" component={OTPScreen} />
    <AuthStack.Screen name="StoreSetup" component={StoreSetupScreen} />
  </AuthStack.Navigator>
);

const HomeNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
  </HomeStack.Navigator>
);

const InventoryNavigator = () => (
  <InventoryStack.Navigator screenOptions={{ headerShown: false }}>
    <InventoryStack.Screen name="InventoryList" component={InventoryListScreen} />
    <InventoryStack.Screen name="AddProduct" component={AddProductScreen} />
    <InventoryStack.Screen name="ProductDetail" component={ProductDetailScreen} />
  </InventoryStack.Navigator>
);

const CustomerNavigator = () => (
  <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
    <CustomerStack.Screen name="CustomerList" component={CustomerListScreen} />
    <CustomerStack.Screen name="AddCustomer" component={AddCustomerScreen} />
    <CustomerStack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
    <CustomerStack.Screen name="AddCreditRecord" component={AddCreditRecordScreen} />
  </CustomerStack.Navigator>
);

const MoreNavigator = () => (
  <MoreStack.Navigator screenOptions={{ headerShown: false }}>
    <MoreStack.Screen name="MoreMenu" component={MoreMenuScreen} />
    <MoreStack.Screen name="SupplierList" component={SupplierListScreen} />
    <MoreStack.Screen name="AddSupplier" component={AddSupplierScreen} />
    <MoreStack.Screen name="SupplierDetail" component={SupplierDetailScreen} />
    <MoreStack.Screen name="CreatePurchaseOrder" component={CreatePurchaseOrderScreen} />
    <MoreStack.Screen name="Analytics" component={AnalyticsScreen} />
  </MoreStack.Navigator>
);

const MainTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '600' as const,
          marginBottom: 2,
        },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
          height: 60,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          switch (route.name) {
            case 'HomeTab':
              iconName = 'home';
              break;
            case 'InventoryTab':
              iconName = 'cube';
              break;
            case 'BillingTab':
              iconName = 'receipt';
              break;
            case 'CustomersTab':
              iconName = 'people';
              break;
            case 'MoreTab':
              iconName = 'ellipsis-horizontal-circle';
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ tabBarLabel: t('nav.home') }} />
      <Tab.Screen name="InventoryTab" component={InventoryNavigator} options={{ tabBarLabel: t('nav.inventory') }} />
      <Tab.Screen name="BillingTab" component={BillingScreen} options={{ tabBarLabel: t('nav.billing') }} />
      <Tab.Screen name="CustomersTab" component={CustomerNavigator} options={{ tabBarLabel: t('nav.customers') }} />
      <Tab.Screen name="MoreTab" component={MoreNavigator} options={{ tabBarLabel: t('nav.more') }} />
    </Tab.Navigator>
  );
};

export const Navigation = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
