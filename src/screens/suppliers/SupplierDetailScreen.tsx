import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
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
  const {
    getSupplierById,
    orders,
    loadOrders,
    deleteSupplier,
    supplierCreditRecords,
    loadSupplierCreditRecords,
    loadSuppliers,
  } = useSupplierStore();

  const supplierId = route.params.supplierId;
  const supplier = getSupplierById(supplierId);

  useFocusEffect(
    useCallback(() => {
      loadSuppliers();
      loadOrders(supplierId);
      loadSupplierCreditRecords(supplierId);
    }, [supplierId])
  );

  if (!supplier) return null;

  const outstanding = supplier.totalCredit - supplier.totalPaid;

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
        {/* Contact Info */}
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

        {/* Credit Balance Summary */}
        <Card style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>{t('suppliers.totalCredit')}</Text>
              <Text style={[styles.balanceValue, { color: Colors.error }]}>
                {formatCurrency(supplier.totalCredit)}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>{t('suppliers.totalPaid')}</Text>
              <Text style={[styles.balanceValue, { color: Colors.success }]}>
                {formatCurrency(supplier.totalPaid)}
              </Text>
            </View>
          </View>
          <View style={styles.outstandingRow}>
            <Text style={styles.outstandingLabel}>{t('suppliers.outstanding')}</Text>
            <Text style={[styles.outstandingValue, { color: outstanding > 0 ? Colors.error : Colors.success }]}>
              {formatCurrency(Math.abs(outstanding))}
            </Text>
          </View>
        </Card>

        {/* Credit/Payment Actions */}
        <View style={styles.creditActions}>
          <Button
            title={t('suppliers.addCredit')}
            onPress={() => navigation.navigate('AddSupplierCreditRecord', { supplierId: supplier.id, type: 'credit' })}
            variant="secondary"
            size="md"
            icon={<Ionicons name="document-text" size={18} color={Colors.white} />}
            style={styles.creditButton}
          />
          <Button
            title={t('suppliers.recordPayment')}
            onPress={() => navigation.navigate('AddSupplierCreditRecord', { supplierId: supplier.id, type: 'payment' })}
            variant="primary"
            size="md"
            icon={<Ionicons name="cash" size={18} color={Colors.white} />}
            style={styles.creditButton}
          />
        </View>

        {/* Credit Transaction History */}
        {supplierCreditRecords.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('suppliers.creditHistory')}</Text>
            {supplierCreditRecords.map((record) => (
              <Card key={record.id} style={styles.recordCard}>
                <View style={styles.recordRow}>
                  <View style={styles.recordLeft}>
                    <View style={[styles.recordIcon, {
                      backgroundColor: record.type === 'credit' ? Colors.errorBg : Colors.successBg,
                    }]}>
                      <Ionicons
                        name={record.type === 'credit' ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={record.type === 'credit' ? Colors.error : Colors.success}
                      />
                    </View>
                    <View>
                      <Text style={styles.recordType}>
                        {record.type === 'credit' ? t('suppliers.purchaseOnCredit') : t('customers.payment')}
                      </Text>
                      {record.description && (
                        <Text style={styles.recordDesc}>{record.description}</Text>
                      )}
                      <Text style={styles.recordDate}>
                        {new Date(record.date).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.recordAmount, {
                    color: record.type === 'credit' ? Colors.error : Colors.success,
                  }]}>
                    {record.type === 'credit' ? '+' : '-'}{formatCurrency(record.amount)}
                  </Text>
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Create Order Button */}
        <View style={styles.actionRow}>
          <Button
            title={t('suppliers.createOrder')}
            onPress={() => navigation.navigate('CreatePurchaseOrder', { supplierId: supplier.id })}
            variant="outline"
            size="md"
            icon={<Ionicons name="cart" size={18} color={Colors.primary} />}
            fullWidth
          />
        </View>

        {/* Order History */}
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
  balanceCard: { padding: Spacing.xl, marginBottom: Spacing.lg },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs },
  balanceValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  balanceDivider: { width: 1, height: 40, backgroundColor: Colors.borderLight },
  outstandingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  outstandingLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  outstandingValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  creditActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  creditButton: { flex: 1 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.md },
  recordCard: { padding: Spacing.lg, marginBottom: Spacing.sm },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  recordIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordType: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.text },
  recordDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  recordDate: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  recordAmount: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  actionRow: { marginBottom: Spacing.xl },
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
