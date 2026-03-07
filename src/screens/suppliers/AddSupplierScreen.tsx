import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button, ScreenHeader } from '../../components/common';
import { Colors, Spacing } from '../../constants/theme';
import { useSupplierStore } from '../../store/supplierStore';
import { MoreStackParamList } from '../../navigation/types';

type RouteType = RouteProp<MoreStackParamList, 'AddSupplier'>;

export const AddSupplierScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { addSupplier, updateSupplier, getSupplierById } = useSupplierStore();
  const editId = route.params?.supplierId;
  const isEdit = !!editId;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      const supplier = getSupplierById(editId);
      if (supplier) {
        setName(supplier.name);
        setPhone(supplier.phone);
        setCompany(supplier.company || '');
        setAddress(supplier.address || '');
      }
    }
  }, [editId]);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }
    setLoading(true);
    try {
      if (isEdit && editId) {
        const existing = getSupplierById(editId);
        if (existing) {
          await updateSupplier({
            ...existing,
            name: name.trim(),
            phone: phone.trim(),
            company: company.trim() || undefined,
            address: address.trim() || undefined,
          });
        }
      } else {
        await addSupplier({
          name: name.trim(),
          phone: phone.trim(),
          company: company.trim() || undefined,
          address: address.trim() || undefined,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={isEdit ? t('suppliers.editSupplier') : t('suppliers.addSupplier')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label={t('suppliers.name')} placeholder="e.g. Sharma Distributors" value={name} onChangeText={setName} autoCapitalize="words" />
        <Input label={t('suppliers.phone')} placeholder="e.g. 9876543210" value={phone} onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, '').slice(0, 10))} keyboardType="phone-pad" maxLength={10} />
        <Input label={t('suppliers.company')} placeholder="Optional" value={company} onChangeText={setCompany} />
        <Input label={t('suppliers.address')} placeholder="Optional" value={address} onChangeText={setAddress} multiline numberOfLines={2} />
        <Button title={t('common.save')} onPress={handleSave} loading={loading} disabled={!name.trim() || !phone.trim()} fullWidth size="lg" style={styles.saveButton} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: Spacing.huge },
  saveButton: { marginTop: Spacing.xl },
});
