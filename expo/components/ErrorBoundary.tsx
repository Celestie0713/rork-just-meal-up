import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown): State {
    // Handle non-Error throws (e.g. empty objects, strings, undefined)
    const normalized: Error = error instanceof Error
      ? error
      : new Error(typeof error === 'string' ? error : 'Unexpected error');
    return { hasError: true, error: normalized };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[ErrorBoundary] Caught:', msg);
    // Auto-retry once after a short delay — many crashes are transient
    // race conditions in the cloud simulator that resolve on re-render
    this.retryTimer = setTimeout(() => {
      this.setState({ hasError: false, error: null });
    }, 600);
  }

  componentWillUnmount() {
    if (this.retryTimer !== null) clearTimeout(this.retryTimer);
  }

  handleRetry = () => {
    if (this.retryTimer !== null) clearTimeout(this.retryTimer);
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <AlertTriangle size={48} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <RefreshCw size={18} color={Colors.background} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    maxWidth: 360,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
});
