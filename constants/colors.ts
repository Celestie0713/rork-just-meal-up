const Colors = {
  primary: '#FF6B35',
  secondary: '#FFF8E7',
  accent: '#8B0000',
  text: '#FFFFFF',
  textLight: '#AAAAAA',
  success: '#4CAF50',
  warning: '#FFA726',
  error: '#EF5350',
  background: '#000000',
  surface: '#1A1A1A',
  border: '#333333',
  premium: '#FFD700',
  organizer: '#8B0000',
} as const;

const Gradients = {
  primary: ['#FF6B35', '#FF8A50'],
  secondary: ['#FFF8E7', '#FFF0D4'],
  premium: ['#FFD700', '#FFA000'],
  organizer: ['#8B0000', '#A52A2A'],
} as const;

export { Colors, Gradients };