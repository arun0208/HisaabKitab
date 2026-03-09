import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setLoading(true);

    // For demo: skip actual OTP and navigate directly
    // In production, use: await signInWithPhone(`+91${phone}`);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('OTP', { phone: `+91${phone}` });
    }, 1000);
  };

  // For quick demo access
  const handleDemoLogin = () => {
    const setUser = useAuthStore.getState().setUser;
    setUser({
      id: 'demo-user',
      phone: '+919999999999',
      name: 'Demo Owner',
      storeName: 'Gupta Kirana Store',
      storeAddress: 'Main Market, Delhi',
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../../../assets/icon.png')} style={styles.logoImage} />
          </View>
          <Text style={styles.appName}>{t('common.appName')}</Text>
          <Text style={styles.tagline}>{t('auth.tagline')}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.welcomeText}>{t('auth.welcome')}</Text>

          <Input
            label={t('auth.phoneNumber')}
            placeholder={t('auth.enterPhone')}
            value={phone}
            onChangeText={(text) => {
              setPhone(text.replace(/[^0-9]/g, '').slice(0, 10));
              setError('');
            }}
            keyboardType="phone-pad"
            maxLength={10}
            error={error}
            leftIcon={
              <Text style={styles.countryCode}>+91</Text>
            }
          />

          <Button
            title={t('auth.sendOtp')}
            onPress={handleSendOtp}
            loading={loading}
            disabled={phone.length < 10}
            fullWidth
            size="lg"
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Quick Demo Access"
            onPress={handleDemoLogin}
            variant="outline"
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: Spacing.xxxl,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  logoImage: {
    width: 88,
    height: 88,
    borderRadius: 22,
    resizeMode: 'cover',
  },
  appName: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: FontSize.lg,
    color: 'rgba(255,255,255,0.8)',
  },
  formCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.huge,
  },
  welcomeText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xxl,
  },
  countryCode: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.lg,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
});
