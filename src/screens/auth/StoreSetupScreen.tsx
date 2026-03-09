import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export const StoreSetupScreen = () => {
  const { t } = useTranslation();
  const setUser = useAuthStore((s) => s.setUser);
  const [ownerName, setOwnerName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!ownerName.trim() || !storeName.trim()) return;
    setLoading(true);

    setTimeout(() => {
      setUser({
        id: 'user-' + Date.now(),
        phone: '+919999999999',
        name: ownerName.trim(),
        storeName: storeName.trim(),
        storeAddress: storeAddress.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      setLoading(false);
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Image source={require('../../../assets/icon.png')} style={styles.logoImage} />
          </View>
          <Text style={styles.title}>{t('auth.setupStore')}</Text>
        </View>

        <Input
          label={t('auth.ownerName')}
          placeholder="e.g. Rajesh Gupta"
          value={ownerName}
          onChangeText={setOwnerName}
          autoCapitalize="words"
        />

        <Input
          label={t('auth.storeName')}
          placeholder="e.g. Gupta Kirana Store"
          value={storeName}
          onChangeText={setStoreName}
          autoCapitalize="words"
        />

        <Input
          label={t('auth.storeAddress')}
          placeholder="e.g. Main Market, Sector 5"
          value={storeAddress}
          onChangeText={setStoreAddress}
          multiline
          numberOfLines={2}
        />

        <Button
          title={t('auth.completeSetup')}
          onPress={handleComplete}
          loading={loading}
          disabled={!ownerName.trim() || !storeName.trim()}
          fullWidth
          size="lg"
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: 80,
    paddingBottom: Spacing.huge,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  button: {
    marginTop: Spacing.xl,
  },
});
