import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, SearchBar, EmptyState } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { formatCurrency } from '../../constants';
import { useSalesStore } from '../../store/salesStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useCustomerStore } from '../../store/customerStore';
import { Product, PaymentType } from '../../types';

export const BillingScreen = () => {
  const { t } = useTranslation();
  const { cart, discount, addToCart, removeFromCart, updateCartQuantity, setDiscount, clearCart, getCartTotal, getGrandTotal, completeSale } = useSalesStore();
  const { products, loadProducts } = useInventoryStore();
  const { customers, loadCustomers } = useCustomerStore();

  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentType>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
      loadCustomers();
    }, [])
  );

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) && p.quantity > 0
  );

  const handleAddProduct = (product: Product) => {
    addToCart({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      maxQuantity: product.quantity,
    });
    setShowProductSearch(false);
    setProductSearch('');
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    if (selectedPayment === 'credit' && !selectedCustomerId) {
      Alert.alert('Select Customer', 'Please select a customer for credit sale');
      return;
    }

    setLoading(true);
    try {
      await completeSale(selectedPayment, selectedCustomerId);
      setShowPayment(false);
      setSelectedCustomerId(undefined);
      Alert.alert(t('billing.billGenerated'));
    } catch (error) {
      Alert.alert('Error', 'Failed to generate bill');
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('billing.title')}</Text>
        {cart.length > 0 && (
          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>{t('common.delete')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cart Items */}
      {cart.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title={t('billing.emptyCart')}
          subtitle={t('billing.addItemsToCart')}
          actionLabel={t('billing.addItem')}
          onAction={() => setShowProductSearch(true)}
        />
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.productId}
            contentContainerStyle={styles.cartList}
            renderItem={({ item }) => (
              <Card style={styles.cartItem}>
                <View style={styles.cartItemTop}>
                  <Text style={styles.cartItemName} numberOfLines={1}>{item.productName}</Text>
                  <TouchableOpacity onPress={() => removeFromCart(item.productId)}>
                    <Ionicons name="close-circle" size={22} color={Colors.error} />
                  </TouchableOpacity>
                </View>
                <View style={styles.cartItemBottom}>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateCartQuantity(item.productId, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateCartQuantity(item.productId, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemPrice}>
                    {formatCurrency(item.price)} x {item.quantity} = {formatCurrency(item.price * item.quantity)}
                  </Text>
                </View>
              </Card>
            )}
          />

          {/* Bill Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('billing.subtotal')}</Text>
              <Text style={styles.summaryValue}>{formatCurrency(getCartTotal())}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('billing.discount')}</Text>
              <TextInput
                style={styles.discountInput}
                value={discount > 0 ? String(discount) : ''}
                onChangeText={(v) => setDiscount(parseFloat(v) || 0)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>{t('billing.grandTotal')}</Text>
              <Text style={styles.totalValue}>{formatCurrency(getGrandTotal())}</Text>
            </View>

            <View style={styles.actionRow}>
              <Button
                title={t('billing.addItem')}
                onPress={() => setShowProductSearch(true)}
                variant="outline"
                size="md"
                icon={<Ionicons name="add" size={18} color={Colors.primary} />}
                style={{ flex: 1 }}
              />
              <Button
                title={t('billing.generateBill')}
                onPress={() => setShowPayment(true)}
                variant="primary"
                size="md"
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </>
      )}

      {/* Product Search Modal */}
      <Modal visible={showProductSearch} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('billing.addItem')}</Text>
            <TouchableOpacity onPress={() => { setShowProductSearch(false); setProductSearch(''); }}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <SearchBar value={productSearch} onChangeText={setProductSearch} placeholder={t('billing.searchProduct')} />
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.productList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.productRow} onPress={() => handleAddProduct(item)}>
                <View style={styles.productRowIcon}>
                  <Ionicons name="cube" size={20} color={Colors.primary} />
                </View>
                <View style={styles.productRowInfo}>
                  <Text style={styles.productRowName}>{item.name}</Text>
                  <Text style={styles.productRowSub}>{item.category} | {item.quantity} {item.unit}</Text>
                </View>
                <Text style={styles.productRowPrice}>{formatCurrency(item.price)}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPayment} animationType="slide" transparent>
        <View style={styles.paymentOverlay}>
          <View style={styles.paymentSheet}>
            <Text style={styles.paymentTitle}>{t('billing.paymentMethod')}</Text>

            <View style={styles.paymentOptions}>
              {(['cash', 'upi', 'credit'] as PaymentType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.paymentOption, selectedPayment === type && styles.paymentOptionActive]}
                  onPress={() => setSelectedPayment(type)}
                >
                  <Ionicons
                    name={type === 'cash' ? 'cash' : type === 'upi' ? 'phone-portrait' : 'card'}
                    size={28}
                    color={selectedPayment === type ? Colors.white : Colors.primary}
                  />
                  <Text style={[styles.paymentOptionText, selectedPayment === type && styles.paymentOptionTextActive]}>
                    {t(`billing.${type}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedPayment === 'credit' && (
              <TouchableOpacity style={styles.customerSelect} onPress={() => setShowCustomerSelect(!showCustomerSelect)}>
                <Ionicons name="person" size={20} color={Colors.primary} />
                <Text style={styles.customerSelectText}>
                  {selectedCustomer ? selectedCustomer.name : t('billing.selectCustomer')}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}

            {showCustomerSelect && (
              <View style={styles.customerList}>
                {customers.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.customerItem}
                    onPress={() => { setSelectedCustomerId(c.id); setShowCustomerSelect(false); }}
                  >
                    <Text style={styles.customerItemName}>{c.name}</Text>
                    <Text style={styles.customerItemPhone}>{c.phone}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.paymentTotal}>
              <Text style={styles.paymentTotalLabel}>{t('billing.grandTotal')}</Text>
              <Text style={styles.paymentTotalValue}>{formatCurrency(getGrandTotal())}</Text>
            </View>

            <View style={styles.paymentActions}>
              <Button title={t('common.cancel')} onPress={() => setShowPayment(false)} variant="outline" size="lg" style={{ flex: 1 }} />
              <Button title={t('billing.generateBill')} onPress={handleCompleteSale} loading={loading} size="lg" style={{ flex: 1.5 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Add Button */}
      {cart.length === 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowProductSearch(true)}>
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  clearText: {
    fontSize: FontSize.md,
    color: Colors.error,
    fontWeight: FontWeight.semibold,
  },
  cartList: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  cartItem: {
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
  },
  cartItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cartItemName: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  cartItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  qtyButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  cartItemPrice: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  summary: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    ...Shadow.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  discountInput: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    padding: Spacing.xs,
    minWidth: 60,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  totalLabel: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  totalValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  productList: {
    padding: Spacing.lg,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  productRowIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  productRowInfo: {
    flex: 1,
  },
  productRowName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  productRowSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  productRowPrice: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  // Payment modal
  paymentOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  paymentSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xxl,
    paddingBottom: Spacing.huge,
  },
  paymentTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xl,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  paymentOption: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  paymentOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  paymentOptionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  paymentOptionTextActive: {
    color: Colors.white,
  },
  customerSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  customerSelectText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  customerList: {
    maxHeight: 150,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  customerItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  customerItemName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  customerItemPhone: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  paymentTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  paymentTotalLabel: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  paymentTotalValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});
