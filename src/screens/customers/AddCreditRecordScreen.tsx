import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button, ScreenHeader } from '../../components/common';
import { Colors, Spacing } from '../../constants/theme';
import { useCustomerStore } from '../../store/customerStore';
import { CustomerStackParamList } from '../../navigation/types';

type RouteType = RouteProp<CustomerStackParamList, 'AddCreditRecord'>;

export const AddCreditRecordScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { addCreditRecord } = useCustomerStore();
  const { customerId, type } = route.params;

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await addCreditRecord({
        customerId,
        amount: amountNum,
        type,
        description: description.trim() || undefined,
        date: new Date().toISOString(),
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  const isCredit = type === 'credit';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={isCredit ? t('customers.addCredit') : t('customers.addPayment')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input
          label={t('customers.amount')}
          placeholder="0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          leftIcon={
            <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.text }}>₹</Text>
          }
        />
        <Input
          label={t('customers.description')}
          placeholder={isCredit ? 'e.g. Monthly groceries' : 'e.g. Cash payment'}
          value={description}
          onChangeText={setDescription}
        />
        <Button
          title={t('common.save')}
          onPress={handleSave}
          loading={loading}
          disabled={!amount || parseFloat(amount) <= 0}
          fullWidth
          size="lg"
          variant={isCredit ? 'secondary' : 'primary'}
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
  currencyIcon: {
    marginRight: 4,
  },
  saveButton: {
    marginTop: Spacing.xl,
  },
});
