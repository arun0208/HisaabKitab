import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Linking,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Input, ScreenHeader, SearchBar } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { formatCurrency } from '../../constants';
import { useSupplierStore } from '../../store/supplierStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { MoreStackParamList } from '../../navigation/types';
import { PurchaseOrderItem } from '../../types';

type RouteType = RouteProp<MoreStackParamList, 'CreatePurchaseOrder'>;

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export const CreatePurchaseOrderScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { getSupplierById, createPurchaseOrder } = useSupplierStore();
  const { products, loadProducts } = useInventoryStore();

  const supplier = getSupplierById(route.params.supplierId);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  if (!supplier) return null;

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const addItem = (productId: string, productName: string, price: number) => {
    const existing = items.find((i) => i.productId === productId);
    if (existing) {
      setItems(items.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { productId, productName, quantity: 1, unitPrice: price }]);
    }
    setShowProductPicker(false);
    setProductSearch('');
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(items.filter((i) => i.productId !== productId));
    } else {
      setItems(items.map((i) => i.productId === productId ? { ...i, quantity } : i));
    }
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }
    setLoading(true);
    try {
      const order = await createPurchaseOrder(supplier.id, items, notes.trim() || undefined);

      // Build order message for SMS/WhatsApp
      const itemList = items.map((i) => `${i.productName} x ${i.quantity}`).join('\n');
      const message = `New Order from HisaabKitab:\n${itemList}\nTotal: ${formatCurrency(total)}\n${notes ? `Notes: ${notes}` : ''}`;

      Alert.alert(t('suppliers.orderSent'), 'Send order to supplier?', [
        { text: 'WhatsApp', onPress: () => {
          Linking.openURL(`whatsapp://send?phone=91${supplier.phone}&text=${encodeURIComponent(message)}`);
        }},
        { text: 'SMS', onPress: () => {
          Linking.openURL(`sms:${supplier.phone}?body=${encodeURIComponent(message)}`);
        }},
        { text: t('common.done'), style: 'cancel' },
      ]);

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('suppliers.createOrder')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.supplierInfo}>
          <Ionicons name="business" size={20} color={Colors.accent} />
          <Text style={styles.supplierName}>{supplier.name}</Text>
        </Card>

        {/* Order Items */}
        {items.map((item) => (
          <Card key={item.productId} style={styles.itemCard}>
            <View style={styles.itemTop}>
              <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
              <TouchableOpacity onPress={() => updateItemQuantity(item.productId, 0)}>
                <Ionicons name="close-circle" size={22} color={Colors.error} />
              </TouchableOpacity>
            </View>
            <View style={styles.itemBottom}>
              <View style={styles.qtyControl}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateItemQuantity(item.productId, item.quantity - 1)}>
                  <Ionicons name="remove" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateItemQuantity(item.productId, item.quantity + 1)}>
                  <Ionicons name="add" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.itemTotal}>{formatCurrency(item.quantity * item.unitPrice)}</Text>
            </View>
          </Card>
        ))}

        <Button
          title={t('suppliers.addItem')}
          onPress={() => setShowProductPicker(true)}
          variant="outline"
          size="md"
          icon={<Ionicons name="add" size={18} color={Colors.primary} />}
          fullWidth
          style={styles.addItemBtn}
        />

        <Input label={t('suppliers.notes')} placeholder="Optional notes..." value={notes} onChangeText={setNotes} multiline numberOfLines={2} />

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('suppliers.totalAmount')}</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>

        <Button title={t('suppliers.sendOrder')} onPress={handleSubmit} loading={loading} disabled={items.length === 0} fullWidth size="lg" />
      </ScrollView>

      {/* Product Picker Modal */}
      <Modal visible={showProductPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('suppliers.addItem')}</Text>
            <TouchableOpacity onPress={() => { setShowProductPicker(false); setProductSearch(''); }}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <SearchBar value={productSearch} onChangeText={setProductSearch} />
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: Spacing.lg }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productRow}
                onPress={() => addItem(item.id, item.name, item.costPrice)}
              >
                <View style={styles.productRowIcon}>
                  <Ionicons name="cube" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productRowName}>{item.name}</Text>
                  <Text style={styles.productRowSub}>{item.category} | Stock: {item.quantity}</Text>
                </View>
                <Text style={styles.productRowPrice}>{formatCurrency(item.costPrice)}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: Spacing.huge },
  supplierInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, marginBottom: Spacing.lg },
  supplierName: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  itemCard: { padding: Spacing.lg, marginBottom: Spacing.sm },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  itemName: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, marginRight: Spacing.sm },
  itemBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryBg, borderRadius: BorderRadius.md },
  qtyBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, minWidth: 30, textAlign: 'center', color: Colors.text },
  itemTotal: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  addItemBtn: { marginVertical: Spacing.lg },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, marginBottom: Spacing.lg },
  totalLabel: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  totalValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.primary },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  modalTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  productRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  productRowIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  productRowName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  productRowSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  productRowPrice: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
});
