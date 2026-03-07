export const Colors = {
  primary: '#7B4B2A',
  primaryLight: '#A0694A',
  primaryDark: '#5C3520',
  primaryBg: '#FDF2EA',

  accent: '#C68A2E',
  accentLight: '#DAA94A',
  accentDark: '#A67020',
  accentBg: '#FFF8ED',

  background: '#FAF6F0',
  surface: '#FFFFFF',
  surfaceVariant: '#F3EBE2',

  text: '#2C1810',
  textSecondary: '#6B5D52',
  textLight: '#9C8E82',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#FFFFFF',

  error: '#C0392B',
  errorBg: '#FDEDEB',
  success: '#27AE60',
  successBg: '#E8F8EF',
  warning: '#E67E22',
  warningBg: '#FEF5E7',
  info: '#2980B9',
  infoBg: '#EBF5FB',

  border: '#E0D5CA',
  borderLight: '#F0E8DF',
  divider: '#D9CFC4',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(44, 24, 16, 0.5)',

  upiGreen: '#00897B',
  cashBlue: '#1565C0',
  creditRed: '#C62828',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  hero: 34,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};
