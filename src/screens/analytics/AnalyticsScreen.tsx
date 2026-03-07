import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, StatCard, ScreenHeader } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../constants';
import { useSalesStore } from '../../store/salesStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useCustomerStore } from '../../store/customerStore';
import { DashboardStats } from '../../types';

export const AnalyticsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const loadDashboardStats = useSalesStore((s) => s.loadDashboardStats);
  const { sales, loadSales } = useSalesStore();
  const { products } = useInventoryStore();
  const { customers, getTotalOutstanding } = useCustomerStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const data = await loadDashboardStats();
        setStats(data);
        await loadSales(100);
      };
      load();
    }, [])
  );

  const inventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);
  const inventoryRetailValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  // Payment type breakdown
  const paymentBreakdown = sales.reduce(
    (acc, s) => {
      acc[s.paymentType] = (acc[s.paymentType] || 0) + s.totalAmount;
      return acc;
    },
    { cash: 0, upi: 0, credit: 0 } as Record<string, number>
  );

  const maxWeeklySale = Math.max(...(stats?.weeklySales.map((s) => s.amount) || [1]));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('analytics.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            title={t('analytics.revenue')}
            value={formatCurrency(stats?.todayRevenue || 0)}
            icon="wallet"
            iconColor={Colors.primary}
            iconBg={Colors.primaryBg}
            style={styles.statCard}
          />
          <StatCard
            title={t('analytics.totalSales')}
            value={String(stats?.todaySales || 0)}
            icon="cart"
            iconColor={Colors.accent}
            iconBg={Colors.accentBg}
            style={styles.statCard}
          />
        </View>

        {/* Weekly Sales Chart (simple bar chart) */}
        {stats?.weeklySales && stats.weeklySales.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={styles.cardTitle}>{t('analytics.dailySales')}</Text>
            <View style={styles.barChart}>
              {stats.weeklySales.map((day, index) => {
                const height = maxWeeklySale > 0 ? (day.amount / maxWeeklySale) * 100 : 0;
                return (
                  <View key={index} style={styles.barColumn}>
                    <Text style={styles.barValue}>{day.amount > 0 ? formatCurrency(day.amount) : ''}</Text>
                    <View style={[styles.bar, { height: Math.max(height, 4) }]} />
                    <Text style={styles.barLabel}>{day.day.slice(8)}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Top Products */}
        {stats?.topProducts && stats.topProducts.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.cardTitle}>{t('analytics.topSellingProducts')}</Text>
            {stats.topProducts.map((product, index) => {
              const maxQty = stats.topProducts[0].quantity;
              const width = maxQty > 0 ? (product.quantity / maxQty) * 100 : 0;
              return (
                <View key={index} style={styles.topProductRow}>
                  <View style={styles.topProductInfo}>
                    <Text style={styles.topProductRank}>#{index + 1}</Text>
                    <Text style={styles.topProductName} numberOfLines={1}>{product.name}</Text>
                  </View>
                  <View style={styles.topProductBarContainer}>
                    <View style={[styles.topProductBar, { width: `${width}%` }]} />
                  </View>
                  <Text style={styles.topProductQty}>{product.quantity}</Text>
                </View>
              );
            })}
          </Card>
        )}

        {/* Payment Breakdown */}
        <Card style={styles.sectionCard}>
          <Text style={styles.cardTitle}>{t('analytics.salesByPayment')}</Text>
          <View style={styles.paymentRow}>
            {[
              { key: 'cash', label: t('billing.cash'), color: Colors.cashBlue, icon: 'cash' as const },
              { key: 'upi', label: t('billing.upi'), color: Colors.upiGreen, icon: 'phone-portrait' as const },
              { key: 'credit', label: t('billing.credit'), color: Colors.creditRed, icon: 'card' as const },
            ].map((item) => (
              <View key={item.key} style={styles.paymentItem}>
                <View style={[styles.paymentIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={styles.paymentLabel}>{item.label}</Text>
                <Text style={[styles.paymentValue, { color: item.color }]}>
                  {formatCurrency(paymentBreakdown[item.key] || 0)}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Inventory Value */}
        <Card style={styles.sectionCard}>
          <Text style={styles.cardTitle}>{t('analytics.inventoryValue')}</Text>
          <View style={styles.inventoryRow}>
            <View style={styles.inventoryItem}>
              <Text style={styles.inventoryLabel}>Cost Value</Text>
              <Text style={styles.inventoryValue}>{formatCurrency(inventoryValue)}</Text>
            </View>
            <View style={styles.inventoryDivider} />
            <View style={styles.inventoryItem}>
              <Text style={styles.inventoryLabel}>Retail Value</Text>
              <Text style={[styles.inventoryValue, { color: Colors.primary }]}>
                {formatCurrency(inventoryRetailValue)}
              </Text>
            </View>
          </View>
          <View style={styles.profitRow}>
            <Text style={styles.inventoryLabel}>Potential Profit</Text>
            <Text style={[styles.inventoryValue, { color: Colors.success }]}>
              {formatCurrency(inventoryRetailValue - inventoryValue)}
            </Text>
          </View>
        </Card>

        {/* Credit Summary */}
        <Card style={styles.sectionCard}>
          <Text style={styles.cardTitle}>{t('analytics.creditSummary')}</Text>
          <View style={styles.creditRow}>
            <View style={styles.creditItem}>
              <Text style={styles.creditLabel}>{t('analytics.totalOutstanding')}</Text>
              <Text style={[styles.creditValue, { color: Colors.error }]}>{formatCurrency(getTotalOutstanding())}</Text>
            </View>
            <View style={styles.creditItem}>
              <Text style={styles.creditLabel}>{t('customers.title')}</Text>
              <Text style={styles.creditValue}>{customers.filter((c) => c.totalCredit > c.totalPaid).length}</Text>
            </View>
          </View>
        </Card>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.huge },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { flex: 1 },
  chartCard: { padding: Spacing.xl, marginBottom: Spacing.lg },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.lg },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, height: 140 },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '80%', backgroundColor: Colors.primary, borderRadius: 4, minHeight: 4 },
  barValue: { fontSize: 8, color: Colors.textSecondary, marginBottom: 4, textAlign: 'center' },
  barLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },
  sectionCard: { padding: Spacing.xl, marginBottom: Spacing.lg },
  topProductRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
  topProductInfo: { flexDirection: 'row', alignItems: 'center', width: 120, gap: Spacing.sm },
  topProductRank: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary, width: 24 },
  topProductName: { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
  topProductBarContainer: { flex: 1, height: 12, backgroundColor: Colors.primaryBg, borderRadius: 6, overflow: 'hidden' },
  topProductBar: { height: '100%', backgroundColor: Colors.primary, borderRadius: 6 },
  topProductQty: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text, width: 30, textAlign: 'right' },
  paymentRow: { flexDirection: 'row', gap: Spacing.md },
  paymentItem: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  paymentIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  paymentLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  paymentValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  inventoryRow: { flexDirection: 'row', marginBottom: Spacing.md },
  inventoryItem: { flex: 1, alignItems: 'center' },
  inventoryDivider: { width: 1, backgroundColor: Colors.border },
  inventoryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  inventoryValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  profitRow: { alignItems: 'center', paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  creditRow: { flexDirection: 'row', gap: Spacing.lg },
  creditItem: { flex: 1, alignItems: 'center' },
  creditLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  creditValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
});
