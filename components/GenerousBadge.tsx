import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';

interface GenerousBadgeProps {
  size?: 'small' | 'medium' | 'large';
}

export function GenerousBadge({ size = 'medium' }: GenerousBadgeProps) {
  const dimensions = {
    small: { container: 28, heart: 28, dollar: 12 },
    medium: { container: 36, heart: 36, dollar: 16 },
    large: { container: 44, heart: 44, dollar: 20 },
  };

  const { container, heart, dollar } = dimensions[size];

  return (
    <View style={[styles.container, { width: container, height: container }]}>
      <Heart size={heart} color="#FF1493" fill="#FF1493" />
      <Text style={[styles.dollarSign, { fontSize: dollar }]}>$</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dollarSign: {
    position: 'absolute',
    color: '#FFFFFF',
    fontWeight: '900' as const,
  },
});
