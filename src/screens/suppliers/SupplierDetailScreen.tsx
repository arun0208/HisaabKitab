import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, Button, ScreenHeader } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../constants';
import { useSupplierStore } from '../../store/supplierStore';
import { MoreStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<MoreStackParamList>;
type RouteType = RouteProp<MoreStackParamList, 'SupplierDetail'>;

const statusVariant = {
  pending: 'warning' as const,
  confirmed: 'info' as const,
  delivered: 'success' as const,
  cancelled: 'error' as const,
};

export const SupplierDetailScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { getSupplierById, orders, loadOrders, deleteSupplier } = useSupplierStore();

  const supplierId = route.params.supplierId;
  const supplier = getSupplierById(supplierId);

  useFocusEffect(
    useCallback(() => {
      loadOrders(supplierId);
    }, [supplierId])
  );

  if (!supplier) return null;

  const handleDelete = () => {
    Alert.alert(t('common.delete'), `Delete ${supplier.name}?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteSupplier(supplier.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={supplier.name}
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'create-outline',
          onPress: () => navigation.navigate('AddSupplier', { supplierId: supplier.id }),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>{supplier.phone}</Text>
          </View>
          {supplier.company && (
            <View style={styles.infoRow}>
              <Ionicons name="business" size={18} color={Colors.accent} />
              <Text style={styles.infoText}>{supplier.company}</Text>
            </View>
          )}
          {supplier.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={18} color={Colors.info} />
              <Text style={styles.infoText}>{supplier.address}</Text>
            </View>
          )}
        </Card>

        <View style={styles.actionRow}>
          <Button
            title={t('suppliers.createOrder')}
            onPress={() => navigation.navigate('CreatePurchaseOrder', { supplierId: supplier.id })}
            variant="primary"
            size="md"
            icon={<Ionicons name="cart" size={18} color={Colors.white} />}
            fullWidth
          />
        </View>

        <Text style={styles.sectionTitle}>{t('suppliers.orderHistory')}</Text>
        {orders.length === 0 ? (
          <Text style={styles.noData}>{t('common.noData')}</Text>
        ) : (
          orders.map((order) => (
            <Card key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
                <Badge label={t(`suppliers.${order.status}`)} variant={statusVariant[order.status]} size="md" />
              </View>
              {order.items.map((item) => (
                <Text key={item.id} style={styles.orderItem}>
                  {item.productName} x {item.quantity} @ {formatCurrency(item.unitPrice)}
                </Text>
              ))}
              <View style={styles.orderFooter}>
                <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</Text>
                <Text style={styles.orderTotal}>{formatCurrency(order.totalAmount)}</Text>
              </View>
            </Card>
          ))
        )}

        <Button title={t('common.delete')} onPress={handleDelete} variant="danger" fullWidth size="lg" style={styles.deleteButton} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: Spacing.huge },
  infoCard: { padding: Spacing.xl, marginBottom: Spacing.lg, gap: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  infoText: { fontSize: FontSize.md, color: Colors.text },
  actionRow: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.md },
  noData: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', padding: Spacing.xl },
  orderCard: { padding: Spacing.lg, marginBottom: Spacing.sm },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  orderId: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  orderItem: { fontSize: FontSize.sm, color: Colors.textSecondary, marginVertical: 2 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  orderDate: { fontSize: FontSize.sm, color: Colors.textLight },
  orderTotal: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  deleteButton: { marginTop: Spacing.xxl },
});
