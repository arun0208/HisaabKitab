import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useSupplierStore } from '../../store/supplierStore';
import { MoreStackParamList } from '../../navigation/types';
import { Supplier } from '../../types';

type NavigationProp = NativeStackNavigationProp<MoreStackParamList>;

export const SupplierListScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { suppliers, loadSuppliers } = useSupplierStore();

  useFocusEffect(
    useCallback(() => {
      loadSuppliers();
    }, [])
  );

  const renderSupplier = ({ item }: { item: Supplier }) => (
    <TouchableOpacity
      style={styles.supplierCard}
      onPress={() => navigation.navigate('SupplierDetail', { supplierId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Ionicons name="business" size={22} color={Colors.accent} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.company && <Text style={styles.company}>{item.company}</Text>}
        <Text style={styles.phone}>{item.phone}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('suppliers.title')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddSupplier')}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={suppliers}
        keyExtractor={(item) => item.id}
        renderItem={renderSupplier}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title={t('common.noData')}
            actionLabel={t('suppliers.addSupplier')}
            onAction={() => navigation.navigate('AddSupplier')}
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
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
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
  supplierCard: {
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
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  company: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    marginTop: 2,
  },
  phone: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
