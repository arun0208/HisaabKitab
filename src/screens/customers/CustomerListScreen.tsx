import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar, Badge, EmptyState } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { formatCurrency } from '../../constants';
import { useCustomerStore } from '../../store/customerStore';
import { CustomerStackParamList } from '../../navigation/types';
import { Customer } from '../../types';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

export const CustomerListScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { customers, searchQuery, setSearchQuery, loadCustomers, getTotalOutstanding } = useCustomerStore();

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [])
  );

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const renderCustomer = ({ item }: { item: Customer }) => {
    const outstanding = item.totalCredit - item.totalPaid;

    return (
      <TouchableOpacity
        style={styles.customerCard}
        onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerPhone}>{item.phone}</Text>
        </View>
        <View style={styles.customerRight}>
          {outstanding > 0 ? (
            <>
              <Text style={styles.outstandingAmount}>{formatCurrency(outstanding)}</Text>
              <Badge label={t('customers.outstanding')} variant="error" />
            </>
          ) : (
            <Badge label={t('customers.noOutstanding')} variant="success" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('customers.title')}</Text>
          <Text style={styles.subtitle}>
            {t('customers.outstanding')}: {formatCurrency(getTotalOutstanding())}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddCustomer')}>
          <Ionicons name="person-add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder={`${t('common.search')}...`} />

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={t('common.noData')}
            actionLabel={t('customers.addCustomer')}
            onAction={() => navigation.navigate('AddCustomer')}
          />
        }
      />
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
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.error,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
    flexGrow: 1,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  customerPhone: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  customerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  outstandingAmount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.error,
  },
});
