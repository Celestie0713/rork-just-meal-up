import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';

interface GenerousBadgeProps {
  size?: 'small' | 'medium' | 'large';
}

export function GenerousBadge({ size = 'medium' }: GenerousBadgeProps) {
  const dimensions = {
    small: { container: 24, heart: 24, dollar: 10 },
    medium: { container: 32, heart: 32, dollar: 14 },
    large: { container: 40, heart: 40, dollar: 18 },
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
