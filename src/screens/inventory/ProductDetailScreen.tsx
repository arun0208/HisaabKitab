import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, Button, ScreenHeader } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../constants';
import { useInventoryStore } from '../../store/inventoryStore';
import { InventoryStackParamList } from '../../navigation/types';
import { Product } from '../../types';

type NavigationProp = NativeStackNavigationProp<InventoryStackParamList>;
type RouteType = RouteProp<InventoryStackParamList, 'ProductDetail'>;

export const ProductDetailScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { getProductById, deleteProduct, updateStock, loadProducts } = useInventoryStore();
  const [product, setProduct] = useState<Product | undefined>();

  useEffect(() => {
    loadProducts().then(() => {
      setProduct(getProductById(route.params.productId));
    });
  }, [route.params.productId]);

  useEffect(() => {
    setProduct(getProductById(route.params.productId));
  }, [useInventoryStore.getState().products]);

  if (!product) return null;

  const isLowStock = product.quantity <= product.lowStockThreshold;
  const profit = product.price - product.costPrice;
  const margin = product.costPrice > 0 ? ((profit / product.costPrice) * 100).toFixed(1) : '0';

  const handleDelete = () => {
    Alert.alert(t('common.delete'), `Delete ${product.name}?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(product.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleStockChange = (change: number) => {
    if (product.quantity + change < 0) return;
    updateStock(product.id, change);
    setProduct({ ...product, quantity: product.quantity + change });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={product.name}
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'create-outline',
          onPress: () => navigation.navigate('AddProduct', { productId: product.id }),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status */}
        <View style={styles.statusRow}>
          <Badge
            label={product.category}
            variant="info"
            size="md"
          />
          <Badge
            label={isLowStock ? (product.quantity === 0 ? 'Out of Stock' : 'Low Stock') : 'In Stock'}
            variant={product.quantity === 0 ? 'error' : isLowStock ? 'warning' : 'success'}
            size="md"
          />
        </View>

        {/* Quick Stock Adjust */}
        <Card style={styles.stockCard}>
          <Text style={styles.stockLabel}>Current Stock</Text>
          <View style={styles.stockRow}>
            <Button title="-" onPress={() => handleStockChange(-1)} variant="outline" size="sm" style={styles.stockButton} />
            <Text style={styles.stockValue}>{product.quantity} {product.unit}</Text>
            <Button title="+" onPress={() => handleStockChange(1)} variant="primary" size="sm" style={styles.stockButton} />
          </View>
        </Card>

        {/* Price Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="pricetag" size={20} color={Colors.primary} />
              <Text style={styles.infoLabel}>{t('inventory.sellingPrice')}</Text>
              <Text style={styles.infoValue}>{formatCurrency(product.price)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="cart" size={20} color={Colors.accent} />
              <Text style={styles.infoLabel}>{t('inventory.costPrice')}</Text>
              <Text style={styles.infoValue}>{formatCurrency(product.costPrice)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="trending-up" size={20} color={Colors.success} />
              <Text style={styles.infoLabel}>Profit</Text>
              <Text style={[styles.infoValue, { color: Colors.success }]}>{formatCurrency(profit)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="analytics" size={20} color={Colors.info} />
              <Text style={styles.infoLabel}>Margin</Text>
              <Text style={styles.infoValue}>{margin}%</Text>
            </View>
          </View>
        </Card>

        {/* Details */}
        <Card style={styles.infoCard}>
          {product.barcode && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('inventory.barcode')}</Text>
              <Text style={styles.detailValue}>{product.barcode}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('inventory.lowStockThreshold')}</Text>
            <Text style={styles.detailValue}>{product.lowStockThreshold} {product.unit}</Text>
          </View>
        </Card>

        <Button
          title={t('common.delete')}
          onPress={handleDelete}
          variant="danger"
          fullWidth
          size="lg"
          style={styles.deleteButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.huge,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  stockCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
  },
  stockLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  stockButton: {
    width: 44,
    height: 44,
  },
  stockValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    minWidth: 100,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  detailLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  deleteButton: {
    marginTop: Spacing.xl,
  },
});
