import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ScreenHeader } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../constants';
import { useSalesStore } from '../../store/salesStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useCustomerStore } from '../../store/customerStore';
import { AnalyticsData, DateRangeKey } from '../../types';

const getDateRange = (key: DateRangeKey): { start: string; end: string } => {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  let start = end;

  switch (key) {
    case 'today':
      break;
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      start = d.toISOString().split('T')[0];
      break;
    }
    case 'month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      start = d.toISOString().split('T')[0];
      break;
    }
    case 'year': {
      start = `${now.getFullYear()}-01-01`;
      break;
    }
    default:
      break;
  }

  return { start, end };
};

type GroupByType = 'product' | 'customer';

export const AnalyticsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { loadAnalytics } = useSalesStore();
  const { products } = useInventoryStore();
  const { customers, getTotalOutstanding } = useCustomerStore();

  const [dateRange, setDateRange] = useState<DateRangeKey>('today');
  const [groupBy, setGroupBy] = useState<GroupByType>('product');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Custom date inputs
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const fetchAnalytics = useCallback(async (rangeKey: DateRangeKey, startOverride?: string, endOverride?: string) => {
    setIsLoading(true);
    try {
      let start: string;
      let end: string;

      if (rangeKey === 'custom' && startOverride && endOverride) {
        start = startOverride;
        end = endOverride;
      } else {
        const range = getDateRange(rangeKey);
        start = range.start;
        end = range.end;
      }

      const data = await loadAnalytics(start, end);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadAnalytics]);

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics(dateRange);
    }, [])
  );

  const handleDateRangeChange = (key: DateRangeKey) => {
    setDateRange(key);
    if (key === 'custom') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    fetchAnalytics(key);
  };

  const handleApplyCustomRange = () => {
    if (customStart && customEnd) {
      fetchAnalytics('custom', customStart, customEnd);
    }
  };

  const dateRangeOptions: { key: DateRangeKey; label: string }[] = [
    { key: 'today', label: t('analytics.today') },
    { key: 'week', label: t('analytics.thisWeek') },
    { key: 'month', label: t('analytics.thisMonth') },
    { key: 'year', label: t('analytics.thisYear') },
    { key: 'custom', label: t('analytics.custom') },
  ];

  const inventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);
  const inventoryRetailValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const maxBarAmount = Math.max(...(analytics?.dailySales.map((s) => s.amount) || [1]));

  // Most demanding product
  const mostDemanding = analytics?.topProducts?.[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('analytics.title')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Range Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRangeContainer}
        >
          {dateRangeOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.dateRangeChip, dateRange === opt.key && styles.dateRangeChipActive]}
              onPress={() => handleDateRangeChange(opt.key)}
            >
              <Text style={[styles.dateRangeText, dateRange === opt.key && styles.dateRangeTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Custom Date Range Inputs */}
        {showCustom && (
          <Card style={styles.customDateCard}>
            <View style={styles.customDateRow}>
              <View style={styles.customDateInput}>
                <Text style={styles.customDateLabel}>{t('analytics.selectStartDate')}</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textLight}
                  value={customStart}
                  onChangeText={setCustomStart}
                />
              </View>
              <View style={styles.customDateInput}>
                <Text style={styles.customDateLabel}>{t('analytics.selectEndDate')}</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textLight}
                  value={customEnd}
                  onChangeText={setCustomEnd}
                />
              </View>
            </View>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyCustomRange}>
              <Text style={styles.applyButtonText}>{t('analytics.apply')}</Text>
            </TouchableOpacity>
          </Card>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Overview Stats Cards */}
            <View style={styles.statsRow}>
              <Card style={styles.statCardSmall}>
                <View style={[styles.statIconSmall, { backgroundColor: Colors.primaryBg }]}>
                  <Ionicons name="wallet" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.statValue}>{formatCurrency(analytics?.revenue || 0)}</Text>
                <Text style={styles.statLabel}>{t('analytics.revenue')}</Text>
              </Card>
              <Card style={styles.statCardSmall}>
                <View style={[styles.statIconSmall, { backgroundColor: Colors.successBg }]}>
                  <Ionicons name="trending-up" size={20} color={Colors.success} />
                </View>
                <Text style={styles.statValue}>{formatCurrency(analytics?.profit || 0)}</Text>
                <Text style={styles.statLabel}>{t('analytics.profit')}</Text>
              </Card>
            </View>

            <View style={styles.statsRow}>
              <Card style={styles.statCardSmall}>
                <View style={[styles.statIconSmall, { backgroundColor: Colors.accentBg }]}>
                  <Ionicons name="cart" size={20} color={Colors.accent} />
                </View>
                <Text style={styles.statValue}>{analytics?.salesCount || 0}</Text>
                <Text style={styles.statLabel}>{t('analytics.totalSales')}</Text>
              </Card>
              <Card style={styles.statCardSmall}>
                <View style={[styles.statIconSmall, { backgroundColor: Colors.infoBg }]}>
                  <Ionicons name="calculator" size={20} color={Colors.info} />
                </View>
                <Text style={styles.statValue}>{formatCurrency(analytics?.avgOrder || 0)}</Text>
                <Text style={styles.statLabel}>{t('analytics.averageOrder')}</Text>
              </Card>
            </View>

            {/* Most Demanding Product Highlight */}
            {mostDemanding && (
              <Card style={styles.highlightCard}>
                <View style={styles.highlightRow}>
                  <View style={styles.highlightIconContainer}>
                    <Ionicons name="flame" size={28} color={Colors.accent} />
                  </View>
                  <View style={styles.highlightInfo}>
                    <Text style={styles.highlightTitle}>{t('analytics.mostDemanding')}</Text>
                    <Text style={styles.highlightProduct}>{mostDemanding.name}</Text>
                    <Text style={styles.highlightSub}>
                      {mostDemanding.quantity} {t('analytics.units')} | {formatCurrency(mostDemanding.revenue)}
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Daily Sales Chart */}
            {analytics && analytics.dailySales.length > 0 && (
              <Card style={styles.chartCard}>
                <Text style={styles.cardTitle}>{t('analytics.dailySales')}</Text>
                <View style={styles.barChart}>
                  {analytics.dailySales.map((day, index) => {
                    const height = maxBarAmount > 0 ? (day.amount / maxBarAmount) * 100 : 0;
                    return (
                      <View key={index} style={styles.barColumn}>
                        <Text style={styles.barValue}>
                          {day.amount > 0 ? formatCurrency(day.amount) : ''}
                        </Text>
                        <View style={[styles.bar, { height: Math.max(height, 4) }]} />
                        <Text style={styles.barLabel}>{day.day.slice(5)}</Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
            )}

            {/* Group By Toggle */}
            <View style={styles.groupBySection}>
              <Text style={styles.groupByTitle}>{t('analytics.groupBy')}</Text>
              <View style={styles.groupByToggle}>
                <TouchableOpacity
                  style={[styles.groupByOption, groupBy === 'product' && styles.groupByOptionActive]}
                  onPress={() => setGroupBy('product')}
                >
                  <Ionicons name="cube" size={16} color={groupBy === 'product' ? Colors.white : Colors.primary} />
                  <Text style={[styles.groupByText, groupBy === 'product' && styles.groupByTextActive]}>
                    {t('analytics.product')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.groupByOption, groupBy === 'customer' && styles.groupByOptionActive]}
                  onPress={() => setGroupBy('customer')}
                >
                  <Ionicons name="people" size={16} color={groupBy === 'customer' ? Colors.white : Colors.primary} />
                  <Text style={[styles.groupByText, groupBy === 'customer' && styles.groupByTextActive]}>
                    {t('analytics.customer')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Group By Results */}
            {groupBy === 'product' && analytics?.salesByProduct && analytics.salesByProduct.length > 0 && (
              <Card style={styles.sectionCard}>
                <Text style={styles.cardTitle}>{t('analytics.salesByProduct')}</Text>
                {analytics.salesByProduct.map((item, index) => {
                  const maxAmount = analytics.salesByProduct[0].totalAmount;
                  const width = maxAmount > 0 ? (item.totalAmount / maxAmount) * 100 : 0;
                  return (
                    <View key={index} style={styles.groupRow}>
                      <View style={styles.groupRank}>
                        <Text style={styles.rankText}>#{index + 1}</Text>
                      </View>
                      <View style={styles.groupInfo}>
                        <View style={styles.groupNameRow}>
                          <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.groupAmount}>{formatCurrency(item.totalAmount)}</Text>
                        </View>
                        <View style={styles.groupBarContainer}>
                          <View style={[styles.groupBar, { width: `${width}%` }]} />
                        </View>
                        <Text style={styles.groupSub}>{item.quantity} {t('analytics.units')}</Text>
                      </View>
                    </View>
                  );
                })}
              </Card>
            )}

            {groupBy === 'customer' && analytics?.salesByCustomer && analytics.salesByCustomer.length > 0 && (
              <Card style={styles.sectionCard}>
                <Text style={styles.cardTitle}>{t('analytics.salesByCustomer')}</Text>
                {analytics.salesByCustomer.map((item, index) => {
                  const maxAmount = analytics.salesByCustomer[0].totalAmount;
                  const width = maxAmount > 0 ? (item.totalAmount / maxAmount) * 100 : 0;
                  return (
                    <View key={index} style={styles.groupRow}>
                      <View style={styles.groupRank}>
                        <Text style={styles.rankText}>#{index + 1}</Text>
                      </View>
                      <View style={styles.groupInfo}>
                        <View style={styles.groupNameRow}>
                          <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.groupAmount}>{formatCurrency(item.totalAmount)}</Text>
                        </View>
                        <View style={styles.groupBarContainer}>
                          <View style={[styles.groupBar, { width: `${width}%` }]} />
                        </View>
                        <Text style={styles.groupSub}>{item.salesCount} {t('analytics.orders')}</Text>
                      </View>
                    </View>
                  );
                })}
              </Card>
            )}

            {/* Top Products */}
            {analytics?.topProducts && analytics.topProducts.length > 0 && (
              <Card style={styles.sectionCard}>
                <Text style={styles.cardTitle}>{t('analytics.topSellingProducts')}</Text>
                {analytics.topProducts.slice(0, 5).map((product, index) => {
                  const maxQty = analytics.topProducts[0].quantity;
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
            {analytics && (
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
                        {formatCurrency((analytics.paymentBreakdown as any)[item.key] || 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

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

            {/* No data message */}
            {analytics && analytics.salesCount === 0 && (
              <View style={styles.noDataContainer}>
                <Ionicons name="analytics-outline" size={48} color={Colors.textLight} />
                <Text style={styles.noDataText}>{t('analytics.noSalesData')}</Text>
              </View>
            )}

            <View style={{ height: Spacing.xxxl }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.huge },

  // Date Range Selector
  dateRangeContainer: {
    marginBottom: Spacing.lg,
  },
  dateRangeChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  dateRangeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateRangeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  dateRangeTextActive: {
    color: Colors.white,
  },

  // Custom Date
  customDateCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  customDateRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  customDateInput: {
    flex: 1,
  },
  customDateLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: FontWeight.medium,
  },
  dateInput: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  applyButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },

  // Loading
  loadingContainer: {
    padding: Spacing.huge,
    alignItems: 'center',
  },

  // Stats Cards
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statCardSmall: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },

  // Highlight Card
  highlightCard: {
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.accentBg,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  highlightIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightInfo: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: FontSize.xs,
    color: Colors.accentDark,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  highlightProduct: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: 2,
  },
  highlightSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Chart
  chartCard: { padding: Spacing.xl, marginBottom: Spacing.lg },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.xs, height: 140 },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '80%', backgroundColor: Colors.primary, borderRadius: 4, minHeight: 4 },
  barValue: { fontSize: 8, color: Colors.textSecondary, marginBottom: 4, textAlign: 'center' },
  barLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },

  // Group By
  groupBySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  groupByTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  groupByToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  groupByOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  groupByOptionActive: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  groupByText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  groupByTextActive: {
    color: Colors.white,
  },

  // Group By Results
  sectionCard: { padding: Spacing.xl, marginBottom: Spacing.lg },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  groupRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  groupInfo: {
    flex: 1,
  },
  groupNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  groupAmount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  groupBarContainer: {
    height: 6,
    backgroundColor: Colors.primaryBg,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  groupBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  groupSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // Top Products
  topProductRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
  topProductInfo: { flexDirection: 'row', alignItems: 'center', width: 120, gap: Spacing.sm },
  topProductRank: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary, width: 24 },
  topProductName: { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
  topProductBarContainer: { flex: 1, height: 12, backgroundColor: Colors.primaryBg, borderRadius: 6, overflow: 'hidden' },
  topProductBar: { height: '100%', backgroundColor: Colors.primary, borderRadius: 6 },
  topProductQty: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text, width: 30, textAlign: 'right' },

  // Payment
  paymentRow: { flexDirection: 'row', gap: Spacing.md },
  paymentItem: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  paymentIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  paymentLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  paymentValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold },

  // Inventory
  inventoryRow: { flexDirection: 'row', marginBottom: Spacing.md },
  inventoryItem: { flex: 1, alignItems: 'center' },
  inventoryDivider: { width: 1, backgroundColor: Colors.border },
  inventoryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  inventoryValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  profitRow: { alignItems: 'center', paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight },

  // Credit
  creditRow: { flexDirection: 'row', gap: Spacing.lg },
  creditItem: { flex: 1, alignItems: 'center' },
  creditLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  creditValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },

  // No Data
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  noDataText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
});
