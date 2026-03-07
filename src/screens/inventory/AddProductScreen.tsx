import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button, ScreenHeader } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { PRODUCT_CATEGORIES } from '../../constants';
import { useInventoryStore } from '../../store/inventoryStore';
import { InventoryStackParamList } from '../../navigation/types';

type RouteType = RouteProp<InventoryStackParamList, 'AddProduct'>;

const UNITS = ['Piece', 'Kg', 'Liter', 'Packet', 'Box', 'Dozen'];

export const AddProductScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { addProduct, updateProduct, getProductById } = useInventoryStore();
  const editId = route.params?.productId;
  const isEdit = !!editId;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Grocery');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Piece');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [showCategories, setShowCategories] = useState(false);
  const [showUnits, setShowUnits] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      const product = getProductById(editId);
      if (product) {
        setName(product.name);
        setCategory(product.category);
        setBarcode(product.barcode || '');
        setPrice(String(product.price));
        setCostPrice(String(product.costPrice));
        setQuantity(String(product.quantity));
        setUnit(product.unit);
        setLowStockThreshold(String(product.lowStockThreshold));
      }
    }
  }, [editId]);

  const handleSave = async () => {
    if (!name.trim() || !price) {
      Alert.alert('Error', 'Please fill in product name and price');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && editId) {
        await updateProduct({
          id: editId,
          name: name.trim(),
          category,
          barcode: barcode || undefined,
          price: parseFloat(price) || 0,
          costPrice: parseFloat(costPrice) || 0,
          quantity: parseInt(quantity) || 0,
          unit,
          lowStockThreshold: parseInt(lowStockThreshold) || 10,
          createdAt: '',
          updatedAt: '',
        });
      } else {
        await addProduct({
          name: name.trim(),
          category,
          barcode: barcode || undefined,
          price: parseFloat(price) || 0,
          costPrice: parseFloat(costPrice) || 0,
          quantity: parseInt(quantity) || 0,
          unit,
          lowStockThreshold: parseInt(lowStockThreshold) || 10,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={isEdit ? t('inventory.editProduct') : t('inventory.addProduct')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input
          label={t('inventory.productName')}
          placeholder="e.g. Tata Salt 1kg"
          value={name}
          onChangeText={setName}
        />

        {/* Category Selector */}
        <Text style={styles.label}>{t('inventory.category')}</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowCategories(!showCategories)}
        >
          <Text style={styles.selectorText}>{category}</Text>
          <Ionicons name={showCategories ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        {showCategories && (
          <View style={styles.dropdownList}>
            {PRODUCT_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.dropdownItem, category === cat && styles.dropdownItemActive]}
                onPress={() => { setCategory(cat); setShowCategories(false); }}
              >
                <Text style={[styles.dropdownText, category === cat && styles.dropdownTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Input
          label={t('inventory.barcode')}
          placeholder="Optional"
          value={barcode}
          onChangeText={setBarcode}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Input
              label={t('inventory.sellingPrice')}
              placeholder="0"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Input
              label={t('inventory.costPrice')}
              placeholder="0"
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Input
              label={t('inventory.quantity')}
              placeholder="0"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{t('inventory.unit')}</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowUnits(!showUnits)}
            >
              <Text style={styles.selectorText}>{unit}</Text>
              <Ionicons name={showUnits ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            {showUnits && (
              <View style={styles.dropdownList}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.dropdownItem, unit === u && styles.dropdownItemActive]}
                    onPress={() => { setUnit(u); setShowUnits(false); }}
                  >
                    <Text style={[styles.dropdownText, unit === u && styles.dropdownTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <Input
          label={t('inventory.lowStockThreshold')}
          placeholder="10"
          value={lowStockThreshold}
          onChangeText={setLowStockThreshold}
          keyboardType="numeric"
        />

        <Button
          title={t('common.save')}
          onPress={handleSave}
          loading={loading}
          fullWidth
          size="lg"
          style={styles.saveButton}
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
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    minHeight: 52,
  },
  selectorText: {
    fontSize: FontSize.lg,
    color: Colors.text,
  },
  dropdownList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownItemActive: {
    backgroundColor: Colors.primaryBg,
  },
  dropdownText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  dropdownTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  saveButton: {
    marginTop: Spacing.xl,
  },
});
