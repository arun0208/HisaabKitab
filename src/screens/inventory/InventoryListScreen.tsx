import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar, Badge } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { formatCurrency, PRODUCT_CATEGORIES } from '../../constants';
import { useInventoryStore } from '../../store/inventoryStore';
import { InventoryStackParamList } from '../../navigation/types';
import { Product } from '../../types';

type NavigationProp = NativeStackNavigationProp<InventoryStackParamList>;

export const InventoryListScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const {
    products,
    isLoading,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    loadProducts,
    updateStock,
    deleteProduct,
  } = useInventoryStore();

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...PRODUCT_CATEGORIES];

  const lowStockCount = products.filter((p) => p.quantity <= p.lowStockThreshold && p.quantity > 0).length;
  const outOfStockCount = products.filter((p) => p.quantity === 0).length;

  const handleQuickStockChange = async (productId: string, change: number, currentQty: number) => {
    if (currentQty + change < 0) return;
    await updateStock(productId, change);
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      t('common.delete'),
      `${t('common.delete')} "${product.name}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(product.id);
          },
        },
      ]
    );
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const isLowStock = item.quantity <= item.lowStockThreshold;
    const isOutOfStock = item.quantity === 0;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.productTop}>
          <View style={styles.productIcon}>
            <Ionicons name="cube" size={22} color={Colors.primary} />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.productCategory}>{item.category}</Text>
          </View>
          <View style={styles.productActions}>
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={() => navigation.navigate('AddProduct', { productId: item.id })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={() => handleDeleteProduct(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.productBottom}>
          <View style={styles.priceSection}>
            <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
            {isOutOfStock ? (
              <Badge label={t('inventory.outOfStock')} variant="error" />
            ) : isLowStock ? (
              <Badge label="Low Stock" variant="warning" />
            ) : (
              <Badge label={t('inventory.inStock')} variant="success" />
            )}
          </View>

          <View style={styles.stockControl}>
            <TouchableOpacity
              style={[styles.stockButton, item.quantity === 0 && styles.stockButtonDisabled]}
              onPress={() => handleQuickStockChange(item.id, -1, item.quantity)}
              disabled={item.quantity === 0}
            >
              <Ionicons name="remove" size={16} color={item.quantity === 0 ? Colors.textLight : Colors.primary} />
            </TouchableOpacity>
            <View style={styles.stockDisplay}>
              <Text style={[styles.stockValue, isLowStock && styles.lowStockValue, isOutOfStock && styles.outOfStockValue]}>
                {item.quantity}
              </Text>
              <Text style={styles.stockUnit}>{item.unit}</Text>
            </View>
            <TouchableOpacity
              style={styles.stockButton}
              onPress={() => handleQuickStockChange(item.id, 1, item.quantity)}
            >
              <Ionicons name="add" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('inventory.title')}</Text>
          <Text style={styles.subtitle}>
            {products.length} {t('inventory.allProducts').toLowerCase()}
          </Text>
        </View>
      </View>

      {/* Stock Summary Badges */}
      {products.length > 0 && (lowStockCount > 0 || outOfStockCount > 0) && (
        <View style={styles.alertRow}>
          {outOfStockCount > 0 && (
            <View style={styles.alertBadge}>
              <View style={[styles.alertDot, { backgroundColor: Colors.error }]} />
              <Text style={styles.alertText}>{outOfStockCount} {t('inventory.outOfStock').toLowerCase()}</Text>
            </View>
          )}
          {lowStockCount > 0 && (
            <View style={styles.alertBadge}>
              <View style={[styles.alertDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.alertText}>{lowStockCount} low stock</Text>
            </View>
          )}
        </View>
      )}

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={t('common.search')}
      />

      {/* Category Filter */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === item && styles.categoryChipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="cube-outline" size={56} color={Colors.textLight} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery || selectedCategory !== 'All'
                ? t('common.noData')
                : 'Your inventory is empty'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || selectedCategory !== 'All'
                ? 'Try changing your search or filter'
                : 'Tap the + button below to add your first product'}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Alert Row
  alertRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },

  // Category Filter
  categoryList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },

  // Product List
  list: {
    padding: Spacing.lg,
    paddingBottom: 100,
    flexGrow: 1,
  },
  productCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  productTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  productCategory: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  productActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  priceSection: {
    gap: Spacing.xs,
  },
  productPrice: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },

  // Stock Control
  stockControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  stockButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockButtonDisabled: {
    opacity: 0.4,
  },
  stockDisplay: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    minWidth: 50,
  },
  stockValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  lowStockValue: {
    color: Colors.warning,
  },
  outOfStockValue: {
    color: Colors.error,
  },
  stockUnit: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: -2,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xxxl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
});
