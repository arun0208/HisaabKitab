import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button, ScreenHeader } from '../../components/common';
import { Colors, Spacing } from '../../constants/theme';
import { useCustomerStore } from '../../store/customerStore';
import { CustomerStackParamList } from '../../navigation/types';

type RouteType = RouteProp<CustomerStackParamList, 'AddCustomer'>;

export const AddCustomerScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { addCustomer, updateCustomer, getCustomerById } = useCustomerStore();
  const editId = route.params?.customerId;
  const isEdit = !!editId;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      const customer = getCustomerById(editId);
      if (customer) {
        setName(customer.name);
        setPhone(customer.phone);
        setAddress(customer.address || '');
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
        const existing = getCustomerById(editId);
        if (existing) {
          await updateCustomer({
            ...existing,
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim() || undefined,
          });
        }
      } else {
        await addCustomer({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim() || undefined,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={isEdit ? t('customers.editCustomer') : t('customers.addCustomer')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input
          label={t('customers.name')}
          placeholder="e.g. Ramesh Kumar"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <Input
          label={t('customers.phone')}
          placeholder="e.g. 9876543210"
          value={phone}
          onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, '').slice(0, 10))}
          keyboardType="phone-pad"
          maxLength={10}
        />
        <Input
          label={t('customers.address')}
          placeholder="Optional"
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={2}
        />
        <Button
          title={t('common.save')}
          onPress={handleSave}
          loading={loading}
          disabled={!name.trim() || !phone.trim()}
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
  saveButton: {
    marginTop: Spacing.xl,
  },
});
