import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, Button, ScreenHeader } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../constants';
import { useCustomerStore } from '../../store/customerStore';
import { CustomerStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;
type RouteType = RouteProp<CustomerStackParamList, 'CustomerDetail'>;

export const CustomerDetailScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { getCustomerById, creditRecords, loadCreditRecords, loadCustomers, deleteCustomer } = useCustomerStore();

  const customerId = route.params.customerId;

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
      loadCreditRecords(customerId);
    }, [customerId])
  );

  const customer = getCustomerById(customerId);
  if (!customer) return null;

  const outstanding = customer.totalCredit - customer.totalPaid;

  const sendWhatsAppReminder = () => {
    const message = `Namaste ${customer.name} ji, Aapka ${formatCurrency(outstanding)} udhaar baki hai. Kripya payment kare. - HisaabKitab`;
    const url = `whatsapp://send?phone=91${customer.phone}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed');
    });
  };

  const sendSMSReminder = () => {
    const message = `Namaste ${customer.name} ji, Aapka ${formatCurrency(outstanding)} udhaar baki hai. Kripya payment kare. - HisaabKitab`;
    const url = `sms:${customer.phone}?body=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  const handleDelete = () => {
    Alert.alert(t('common.delete'), `Delete ${customer.name}?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteCustomer(customer.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={customer.name}
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'create-outline',
          onPress: () => navigation.navigate('AddCustomer', { customerId: customer.id }),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Customer Info */}
        <Card style={styles.infoCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{customer.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerPhone}>{customer.phone}</Text>
          {customer.address && <Text style={styles.customerAddress}>{customer.address}</Text>}
        </Card>

        {/* Balance Summary */}
        <View style={styles.balanceRow}>
          <Card style={[styles.balanceCard, { backgroundColor: Colors.errorBg }]}>
            <Text style={styles.balanceLabel}>{t('customers.totalCredit')}</Text>
            <Text style={[styles.balanceValue, { color: Colors.error }]}>{formatCurrency(customer.totalCredit)}</Text>
          </Card>
          <Card style={[styles.balanceCard, { backgroundColor: Colors.successBg }]}>
            <Text style={styles.balanceLabel}>{t('customers.totalPaid')}</Text>
            <Text style={[styles.balanceValue, { color: Colors.success }]}>{formatCurrency(customer.totalPaid)}</Text>
          </Card>
        </View>

        {/* Outstanding */}
        <Card style={styles.outstandingCard}>
          <Text style={styles.outstandingLabel}>{t('customers.outstanding')}</Text>
          <Text style={[styles.outstandingValue, outstanding > 0 ? { color: Colors.error } : { color: Colors.success }]}>
            {formatCurrency(outstanding)}
          </Text>
        </Card>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Button
            title={t('customers.addCredit')}
            onPress={() => navigation.navigate('AddCreditRecord', { customerId: customer.id, type: 'credit' })}
            variant="secondary"
            size="md"
            icon={<Ionicons name="add-circle" size={18} color={Colors.white} />}
            style={{ flex: 1 }}
          />
          <Button
            title={t('customers.addPayment')}
            onPress={() => navigation.navigate('AddCreditRecord', { customerId: customer.id, type: 'payment' })}
            variant="primary"
            size="md"
            icon={<Ionicons name="cash" size={18} color={Colors.white} />}
            style={{ flex: 1 }}
          />
        </View>

        {/* Send Reminder */}
        {outstanding > 0 && (
          <View style={styles.reminderRow}>
            <TouchableOpacity style={styles.reminderButton} onPress={sendWhatsAppReminder}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <Text style={styles.reminderText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reminderButton} onPress={sendSMSReminder}>
              <Ionicons name="chatbubble" size={24} color={Colors.info} />
              <Text style={styles.reminderText}>SMS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reminderButton} onPress={() => Linking.openURL(`tel:${customer.phone}`)}>
              <Ionicons name="call" size={24} color={Colors.success} />
              <Text style={styles.reminderText}>Call</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>{t('customers.creditHistory')}</Text>
        {creditRecords.length === 0 ? (
          <Text style={styles.noRecords}>{t('common.noData')}</Text>
        ) : (
          creditRecords.map((record) => (
            <Card key={record.id} style={styles.recordCard}>
              <View style={styles.recordRow}>
                <View style={[styles.recordIcon, record.type === 'credit' ? styles.creditIcon : styles.paymentIcon]}>
                  <Ionicons
                    name={record.type === 'credit' ? 'arrow-up' : 'arrow-down'}
                    size={16}
                    color={record.type === 'credit' ? Colors.error : Colors.success}
                  />
                </View>
                <View style={styles.recordInfo}>
                  <Text style={styles.recordType}>
                    {record.type === 'credit' ? t('customers.creditEntry') : t('customers.payment')}
                  </Text>
                  {record.description && <Text style={styles.recordDesc}>{record.description}</Text>}
                  <Text style={styles.recordDate}>{new Date(record.date).toLocaleDateString('en-IN')}</Text>
                </View>
                <Text style={[styles.recordAmount, record.type === 'credit' ? styles.creditAmount : styles.paymentAmount]}>
                  {record.type === 'credit' ? '+' : '-'}{formatCurrency(record.amount)}
                </Text>
              </View>
            </Card>
          ))
        )}

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
  infoCard: {
    alignItems: 'center',
    padding: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarLargeText: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  customerName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  customerPhone: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  customerAddress: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  balanceCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
  },
  balanceLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  outstandingCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  outstandingLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  outstandingValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  reminderRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  reminderButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  reminderText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  noRecords: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: Spacing.xl,
  },
  recordCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  creditIcon: {
    backgroundColor: Colors.errorBg,
  },
  paymentIcon: {
    backgroundColor: Colors.successBg,
  },
  recordInfo: {
    flex: 1,
  },
  recordType: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  recordDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recordDate: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginTop: 2,
  },
  recordAmount: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  creditAmount: {
    color: Colors.error,
  },
  paymentAmount: {
    color: Colors.success,
  },
  deleteButton: {
    marginTop: Spacing.xxl,
  },
});
