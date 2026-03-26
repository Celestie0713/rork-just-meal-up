import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { Mic, Send, X } from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/colors';

interface VoiceRecorderProps {
  onSend: (duration: number, audioUri?: string) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  React.useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => {
        clearInterval(interval);
        pulse.stop();
      };
    }
  }, [isRecording, pulseAnim]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web fallback - just simulate recording
        setIsRecording(true);
        setDuration(0);
        console.log('Starting voice recording (web simulation)...');
        return;
      }

      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        const permission = await requestPermission();
        if (!permission.granted) {
          Alert.alert('Permission required', 'Please grant microphone permission to record voice messages.');
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setDuration(0);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (Platform.OS === 'web') {
      setIsRecording(false);
      console.log('Stopping voice recording (web simulation)...');
      return null;
    }

    if (!recording) {
      return null;
    }

    try {
      console.log('Stopping recording..');
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      setRecording(null);
      console.log('Recording stopped and stored at', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording', error);
      return null;
    }
  };

  const handleSend = async () => {
    const audioUri = await stopRecording();
    onSend(duration, audioUri || undefined);
  };

  const handleCancel = async () => {
    await stopRecording();
    setDuration(0);
    onCancel();
  };

  if (!isRecording) {
    return (
      <TouchableOpacity 
        style={styles.recordButton} 
        onPress={startRecording}
        testID="start-recording"
      >
        <LinearGradient
          colors={Gradients.primary}
          style={styles.recordButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Mic size={24} color={Colors.background} />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.recordingContainer}>
      <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
        <X size={24} color={Colors.error} />
      </TouchableOpacity>
      <View style={styles.recordingInfo}>
        <Animated.View style={[styles.recordingIndicator, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.recordingDot} />
        </Animated.View>
        <Text style={styles.durationText}>{formatDuration(duration)}</Text>
      </View>
      <TouchableOpacity onPress={handleSend} style={styles.sendButton} testID="send-recording">
        <LinearGradient
          colors={Gradients.primary}
          style={styles.sendButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Send size={20} color={Colors.background} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  recordButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
    marginRight: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.background,
    alignSelf: 'center',
    marginTop: 2,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});