export const Colors = {
  primary: '#1B6B3A',
  primaryLight: '#4CAF50',
  primaryDark: '#0D4F25',
  primaryBg: '#E8F5E9',

  accent: '#FF8F00',
  accentLight: '#FFB300',
  accentDark: '#E65100',
  accentBg: '#FFF3E0',

  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F2F5',

  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#FFFFFF',

  error: '#E53935',
  errorBg: '#FFEBEE',
  success: '#43A047',
  successBg: '#E8F5E9',
  warning: '#FB8C00',
  warningBg: '#FFF3E0',
  info: '#1E88E5',
  infoBg: '#E3F2FD',

  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E0E0E0',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',

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
