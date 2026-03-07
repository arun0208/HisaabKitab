import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, StatCard, Badge } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { formatCurrency } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { useSalesStore } from '../../store/salesStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { DashboardStats } from '../../types';

export const DashboardScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const loadDashboardStats = useSalesStore((s) => s.loadDashboardStats);
  const loadProducts = useInventoryStore((s) => s.loadProducts);
  const getLowStockProducts = useInventoryStore((s) => s.getLowStockProducts);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    await loadProducts();
    const data = await loadDashboardStats();
    setStats(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const quickActions = [
    {
      icon: 'receipt' as const,
      label: t('dashboard.newSale'),
      color: Colors.primary,
      bg: Colors.primaryBg,
      onPress: () => navigation.navigate('BillingTab'),
    },
    {
      icon: 'add-circle' as const,
      label: t('dashboard.addProduct'),
      color: Colors.accent,
      bg: Colors.accentBg,
      onPress: () => navigation.navigate('InventoryTab', { screen: 'AddProduct' }),
    },
    {
      icon: 'person-add' as const,
      label: t('dashboard.addCustomer'),
      color: Colors.info,
      bg: Colors.infoBg,
      onPress: () => navigation.navigate('CustomersTab', { screen: 'AddCustomer' }),
    },
    {
      icon: 'bar-chart' as const,
      label: t('dashboard.viewReports'),
      color: '#7B1FA2',
      bg: '#F3E5F5',
      onPress: () => navigation.navigate('MoreTab', { screen: 'Analytics' }),
    },
  ];

  const lowStockProducts = getLowStockProducts().slice(0, 5);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('dashboard.greeting')}, {user?.name?.split(' ')[0]}!</Text>
            <Text style={styles.storeName}>{user?.storeName}</Text>
          </View>
          <TouchableOpacity
            style={styles.langButton}
            onPress={() => {
              const { i18n } = require('../../i18n');
              i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en');
            }}
          >
            <Text style={styles.langText}>
              {require('i18next').default.language === 'en' ? '\u0939\u093F' : 'EN'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title={t('dashboard.todayRevenue')}
            value={formatCurrency(stats?.todayRevenue || 0)}
            icon="wallet"
            iconColor={Colors.primary}
            iconBg={Colors.primaryBg}
            style={styles.statCard}
          />
          <StatCard
            title={t('dashboard.todaySales')}
            value={String(stats?.todaySales || 0)}
            icon="cart"
            iconColor={Colors.accent}
            iconBg={Colors.accentBg}
            style={styles.statCard}
          />
          <StatCard
            title={t('dashboard.lowStock')}
            value={String(stats?.lowStockCount || 0)}
            icon="alert-circle"
            iconColor={Colors.error}
            iconBg={Colors.errorBg}
            style={styles.statCard}
          />
          <StatCard
            title={t('dashboard.outstanding')}
            value={formatCurrency(stats?.totalOutstanding || 0)}
            icon="cash"
            iconColor={Colors.warning}
            iconBg={Colors.warningBg}
            style={styles.statCard}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.actionLabel} numberOfLines={2}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Top Products */}
        {stats?.topProducts && stats.topProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('dashboard.topProducts')}</Text>
            <Card>
              {stats.topProducts.map((product, index) => (
                <View
                  key={index}
                  style={[
                    styles.topProductRow,
                    index < stats.topProducts.length - 1 && styles.topProductBorder,
                  ]}
                >
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <Text style={styles.topProductName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.topProductQty}>{product.quantity} sold</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Low Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('dashboard.lowStockAlert')}</Text>
            <Card>
              {lowStockProducts.map((product, index) => (
                <View
                  key={product.id}
                  style={[
                    styles.lowStockRow,
                    index < lowStockProducts.length - 1 && styles.lowStockBorder,
                  ]}
                >
                  <View style={styles.lowStockInfo}>
                    <Text style={styles.lowStockName} numberOfLines={1}>{product.name}</Text>
                    <Text style={styles.lowStockCategory}>{product.category}</Text>
                  </View>
                  <Badge
                    label={product.quantity === 0 ? 'Out of Stock' : `${product.quantity} left`}
                    variant={product.quantity === 0 ? 'error' : 'warning'}
                  />
                </View>
              ))}
            </Card>
          </View>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  storeName: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  langButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
  topProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  topProductBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rankText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  topProductName: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
  topProductQty: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  lowStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  lowStockBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  lowStockInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  lowStockName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  lowStockCategory: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
