import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { parseVoiceCommand } from '../../utils/voiceCommandParser';
import { VoiceCommand } from '../../types';
import { useCustomerStore } from '../../store/customerStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { Button } from './Button';

// Try to import speech recognition — will be null in Expo Go
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = null;
try {
  const speechModule = require('@jamsch/expo-speech-recognition');
  ExpoSpeechRecognitionModule = speechModule.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = speechModule.useSpeechRecognitionEvent;
} catch {
  // Native module not available (Expo Go) — will use text input fallback
}

interface VoiceFabProps {
  onCommandExecuted?: () => void;
}

// Wrapper for speech recognition event hooks (no-op when unavailable)
const useSpeechEvent = (event: string, handler: (data: any) => void) => {
  if (useSpeechRecognitionEvent) {
    useSpeechRecognitionEvent(event, handler);
  }
};

export const VoiceFab: React.FC<VoiceFabProps> = ({ onCommandExecuted }) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [parsedCommand, setParsedCommand] = useState<VoiceCommand | null>(null);
  const [language, setLanguage] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [executing, setExecuting] = useState(false);
  const [useTextMode, setUseTextMode] = useState(!ExpoSpeechRecognitionModule);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);

  const customers = useCustomerStore((s) => s.customers);
  const products = useInventoryStore((s) => s.products);
  const addCreditRecord = useCustomerStore((s) => s.addCreditRecord);
  const updateStock = useInventoryStore((s) => s.updateStock);

  const speechAvailable = !!ExpoSpeechRecognitionModule;

  // Pulse animation
  useEffect(() => {
    if (isListening) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  // Speech recognition events (no-op when unavailable)
  useSpeechEvent('start', () => {
    setIsListening(true);
  });

  useSpeechEvent('end', () => {
    setIsListening(false);
  });

  useSpeechEvent('result', (event: any) => {
    const text = event.results[0]?.transcript || '';
    setTranscript(text);

    if (event.isFinal) {
      setIsListening(false);
      const customerNames = customers.map((c) => c.name);
      const productNames = products.map((p) => p.name);
      const command = parseVoiceCommand(text, customerNames, productNames);
      setParsedCommand(command);
    }
  });

  useSpeechEvent('error', (event: any) => {
    console.error('Speech recognition error:', event.error);
    setIsListening(false);
    if (event.error === 'no-speech') {
      setTranscript(t('voice.noSpeechDetected'));
    }
  });

  const startListening = async () => {
    if (!ExpoSpeechRecognitionModule) {
      setUseTextMode(true);
      return;
    }

    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(t('voice.permissionTitle'), t('voice.permissionMessage'));
        return;
      }

      setTranscript('');
      setParsedCommand(null);

      ExpoSpeechRecognitionModule.start({
        lang: language,
        interimResults: true,
        maxAlternatives: 1,
      });
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      // Fallback to text mode
      setUseTextMode(true);
    }
  };

  const stopListening = () => {
    if (!ExpoSpeechRecognitionModule) return;
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
    setIsListening(false);
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    const text = textInput.trim();
    setTranscript(text);

    const customerNames = customers.map((c) => c.name);
    const productNames = products.map((p) => p.name);
    const command = parseVoiceCommand(text, customerNames, productNames);
    setParsedCommand(command);
  };

  const handleConfirm = async () => {
    if (!parsedCommand) return;

    setExecuting(true);
    try {
      if (parsedCommand.type === 'add_credit' || parsedCommand.type === 'add_payment') {
        const customer = customers.find(
          (c) => c.name.toLowerCase() === parsedCommand.name.toLowerCase()
        );
        if (!customer) {
          Alert.alert(t('voice.error'), t('voice.customerNotFound', { name: parsedCommand.name }));
          setExecuting(false);
          return;
        }
        await addCreditRecord({
          customerId: customer.id,
          amount: parsedCommand.amount || 0,
          type: parsedCommand.type === 'add_credit' ? 'credit' : 'payment',
          description: `Voice: ${transcript}`,
          date: new Date().toISOString(),
        });
        Alert.alert(
          t('voice.success'),
          parsedCommand.type === 'add_credit'
            ? t('voice.creditAdded', { name: parsedCommand.name, amount: parsedCommand.amount })
            : t('voice.paymentRecorded', { name: parsedCommand.name, amount: parsedCommand.amount })
        );
      } else if (parsedCommand.type === 'add_stock') {
        const product = products.find(
          (p) => p.name.toLowerCase() === parsedCommand.name.toLowerCase()
        );
        if (!product) {
          Alert.alert(t('voice.error'), t('voice.productNotFound', { name: parsedCommand.name }));
          setExecuting(false);
          return;
        }
        await updateStock(product.id, parsedCommand.quantity || 1);
        Alert.alert(
          t('voice.success'),
          t('voice.stockUpdated', { name: parsedCommand.name, quantity: parsedCommand.quantity })
        );
      }

      onCommandExecuted?.();
      setModalVisible(false);
      resetState();
    } catch (error) {
      Alert.alert(t('voice.error'), t('voice.executionFailed'));
    } finally {
      setExecuting(false);
    }
  };

  const resetState = () => {
    setTranscript('');
    setTextInput('');
    setParsedCommand(null);
    setIsListening(false);
  };

  const handleClose = () => {
    if (isListening) stopListening();
    setModalVisible(false);
    resetState();
  };

  const getCommandLabel = (cmd: VoiceCommand): string => {
    switch (cmd.type) {
      case 'add_credit':
        return t('voice.commandCredit', { name: cmd.name, amount: cmd.amount });
      case 'add_payment':
        return t('voice.commandPayment', { name: cmd.name, amount: cmd.amount });
      case 'add_stock':
        return t('voice.commandStock', { name: cmd.name, quantity: cmd.quantity });
      default:
        return '';
    }
  };

  const getCommandIcon = (cmd: VoiceCommand): keyof typeof Ionicons.glyphMap => {
    switch (cmd.type) {
      case 'add_credit': return 'document-text';
      case 'add_payment': return 'cash';
      case 'add_stock': return 'cube';
      default: return 'help';
    }
  };

  return (
    <>
      {/* Floating Mic Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setModalVisible(true);
          if (speechAvailable && !useTextMode) {
            setTimeout(() => startListening(), 500);
          } else {
            setTimeout(() => inputRef.current?.focus(), 500);
          }
        }}
        activeOpacity={0.8}
      >
        <Ionicons name={useTextMode ? 'chatbox-ellipses' : 'mic'} size={26} color={Colors.white} />
      </TouchableOpacity>

      {/* Voice/Text Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('voice.title')}</Text>
              <View style={styles.headerRight}>
                {/* Toggle between voice and text mode */}
                {speechAvailable && (
                  <TouchableOpacity
                    onPress={() => {
                      setUseTextMode(!useTextMode);
                      resetState();
                    }}
                    style={styles.modeToggle}
                  >
                    <Ionicons
                      name={useTextMode ? 'mic-outline' : 'chatbox-ellipses-outline'}
                      size={20}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Text Input Mode */}
              {useTextMode ? (
                <View style={styles.textInputArea}>
                  <Text style={styles.textInputLabel}>{t('voice.typeCommand')}</Text>
                  <View style={styles.textInputRow}>
                    <TextInput
                      ref={inputRef}
                      style={styles.textInputField}
                      placeholder={t('voice.textPlaceholder')}
                      placeholderTextColor={Colors.textLight}
                      value={textInput}
                      onChangeText={setTextInput}
                      onSubmitEditing={handleTextSubmit}
                      returnKeyType="send"
                      autoFocus
                    />
                    <TouchableOpacity
                      style={[styles.sendButton, !textInput.trim() && styles.sendButtonDisabled]}
                      onPress={handleTextSubmit}
                      disabled={!textInput.trim()}
                    >
                      <Ionicons name="send" size={20} color={textInput.trim() ? Colors.white : Colors.textLight} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  {/* Language Toggle */}
                  <View style={styles.langRow}>
                    <TouchableOpacity
                      style={[styles.langChip, language === 'hi-IN' && styles.langChipActive]}
                      onPress={() => setLanguage('hi-IN')}
                    >
                      <Text style={[styles.langChipText, language === 'hi-IN' && styles.langChipTextActive]}>
                        हिन्दी
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.langChip, language === 'en-IN' && styles.langChipActive]}
                      onPress={() => setLanguage('en-IN')}
                    >
                      <Text style={[styles.langChipText, language === 'en-IN' && styles.langChipTextActive]}>
                        English
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Mic Area */}
                  <View style={styles.micArea}>
                    <Animated.View style={[styles.micCircle, isListening && styles.micCircleActive, { transform: [{ scale: pulseAnim }] }]}>
                      <TouchableOpacity
                        onPress={isListening ? stopListening : startListening}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isListening ? 'mic' : 'mic-outline'}
                          size={48}
                          color={isListening ? Colors.white : Colors.primary}
                        />
                      </TouchableOpacity>
                    </Animated.View>
                    <Text style={styles.micHint}>
                      {isListening ? t('voice.listening') : t('voice.tapToSpeak')}
                    </Text>
                  </View>
                </>
              )}

              {/* Transcript */}
              {transcript ? (
                <View style={styles.transcriptBox}>
                  <Text style={styles.transcriptLabel}>{t('voice.youSaid')}</Text>
                  <Text style={styles.transcriptText}>"{transcript}"</Text>
                </View>
              ) : null}

              {/* Parsed Command */}
              {parsedCommand ? (
                <View style={styles.commandCard}>
                  <View style={styles.commandHeader}>
                    <Ionicons name={getCommandIcon(parsedCommand)} size={24} color={Colors.primary} />
                    <Text style={styles.commandTitle}>{t('voice.parsedCommand')}</Text>
                  </View>
                  <Text style={styles.commandText}>{getCommandLabel(parsedCommand)}</Text>
                  <View style={styles.commandActions}>
                    <Button
                      title={t('common.confirm')}
                      onPress={handleConfirm}
                      variant="primary"
                      size="md"
                      loading={executing}
                      style={styles.confirmButton}
                    />
                    <Button
                      title={t('common.retry')}
                      onPress={() => {
                        resetState();
                        if (useTextMode) {
                          setTimeout(() => inputRef.current?.focus(), 100);
                        } else {
                          startListening();
                        }
                      }}
                      variant="outline"
                      size="md"
                      style={styles.retryButton}
                    />
                  </View>
                </View>
              ) : (
                !isListening && transcript && !parsedCommand ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={24} color={Colors.error} />
                    <Text style={styles.errorText}>{t('voice.couldNotParse')}</Text>
                    <Button
                      title={t('common.retry')}
                      onPress={() => {
                        resetState();
                        if (useTextMode) {
                          setTimeout(() => inputRef.current?.focus(), 100);
                        } else {
                          startListening();
                        }
                      }}
                      variant="outline"
                      size="sm"
                      style={styles.retrySmall}
                    />
                  </View>
                ) : null
              )}

              {/* Helper hints */}
              {!transcript && !isListening && (
                <View style={styles.hintsBox}>
                  <Text style={styles.hintsTitle}>{t('voice.examples')}</Text>
                  <Text style={styles.hintText}>• "Ramesh ko 200 udhaar likh do"</Text>
                  <Text style={styles.hintText}>• "Ramesh ne 500 diye"</Text>
                  <Text style={styles.hintText}>• "Maggi 5 packet add karo"</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
    zIndex: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modeToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputArea: {
    marginBottom: Spacing.lg,
  },
  textInputLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  textInputField: {
    flex: 1,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 50,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surfaceVariant,
  },
  langRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  langChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceVariant,
  },
  langChipActive: {
    backgroundColor: Colors.primary,
  },
  langChipText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  langChipTextActive: {
    color: Colors.white,
  },
  micArea: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  micCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  micCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.accent,
  },
  micHint: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  transcriptBox: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  transcriptLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  transcriptText: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: FontWeight.medium,
    fontStyle: 'italic',
  },
  commandCard: {
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  commandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  commandTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  commandText: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.lg,
  },
  commandActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  confirmButton: {
    flex: 1,
  },
  retryButton: {
    flex: 1,
  },
  errorBox: {
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.error,
    textAlign: 'center',
  },
  retrySmall: {
    marginTop: Spacing.sm,
  },
  hintsBox: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  hintsTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  hintText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
