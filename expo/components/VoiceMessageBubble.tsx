import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { Play, Pause, DollarSign } from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/colors';
import type { VoiceMessage } from '@/types/user';

interface VoiceMessageBubbleProps {
  message: VoiceMessage;
  isOwn: boolean;
  senderName?: string;
  onTipPress?: () => void;
}

export function VoiceMessageBubble({ message, isOwn, senderName, onTipPress }: VoiceMessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);

  const waveformHeights = useMemo(() => {
    const seed = message.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: 12 }, (_, i) => {
      const pseudoRandom = Math.sin(seed + i) * 10000;
      return (pseudoRandom - Math.floor(pseudoRandom)) * 20 + 8;
    });
  }, [message.id]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch((e) => console.error('unload error', e));
        soundRef.current = null;
      }
      if (webAudioRef.current) {
        try {
          webAudioRef.current.pause();
        } catch (e) {
          console.error('web pause error', e);
        }
        webAudioRef.current = null;
      }
    };
  }, []);

  const playAudio = async () => {
    const url = message.audioUrl;
    if (!url || url === 'mock-new-url' || url.startsWith('mock-')) {
      console.log('No real audio URL for message', message.id, url);
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), Math.max(500, message.duration * 1000));
      return;
    }

    try {
      if (Platform.OS === 'web') {
        if (!webAudioRef.current) {
          const audio = new window.Audio(url);
          audio.onended = () => setIsPlaying(false);
          audio.onerror = (e) => {
            console.error('web audio error', e);
            setIsPlaying(false);
          };
          webAudioRef.current = audio;
        }
        await webAudioRef.current.play();
        setIsPlaying(true);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(false);
              sound.setPositionAsync(0).catch((e) => console.error('reset position', e));
            }
          }
        );
        soundRef.current = sound;
      } else {
        await soundRef.current.replayAsync();
      }
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to play audio', err);
      setIsPlaying(false);
    }
  };

  const pauseAudio = async () => {
    try {
      if (Platform.OS === 'web') {
        webAudioRef.current?.pause();
      } else {
        await soundRef.current?.pauseAsync();
      }
    } catch (err) {
      console.error('Failed to pause audio', err);
    } finally {
      setIsPlaying(false);
    }
  };

  const handlePlayPause = async () => {
    if (message.requiresTip && !message.isPaid && !isOwn) {
      onTipPress?.();
      return;
    }
    if (isPlaying) {
      await pauseAudio();
    } else {
      await playAudio();
    }
  };

  const bubbleStyle = isOwn ? styles.ownBubble : styles.otherBubble;
  const contentStyle = isOwn ? styles.ownContent : styles.otherContent;

  return (
    <View style={[styles.container, isOwn && styles.ownContainer]}>
      {!isOwn && !!senderName && (
        <Text style={styles.senderName}>{senderName}</Text>
      )}
      <View style={[styles.bubble, bubbleStyle]}>
        {isOwn ? (
          <LinearGradient
            colors={Gradients.primary}
            style={styles.gradientBubble}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={contentStyle}>
              <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
                {isPlaying ? (
                  <Pause size={20} color={Colors.background} />
                ) : (
                  <Play size={20} color={Colors.background} />
                )}
              </TouchableOpacity>
              <View style={styles.waveform}>
                {waveformHeights.map((height, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      { 
                        height,
                        backgroundColor: Colors.background,
                        opacity: isPlaying && i < 6 ? 1 : 0.6
                      }
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.ownDuration}>{formatDuration(message.duration)}</Text>
            </View>
          </LinearGradient>
        ) : (
          <View style={contentStyle}>
            {message.requiresTip && !message.isPaid ? (
              <TouchableOpacity onPress={handlePlayPause} style={styles.tipContainer}>
                <DollarSign size={20} color={Colors.primary} />
                <View style={styles.tipTextContainer}>
                  <Text style={styles.tipTitle}>Tip us to view</Text>
                  <Text style={styles.tipSubtitle}>{formatDuration(message.duration)} message</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
                  {isPlaying ? (
                    <Pause size={20} color={Colors.primary} />
                  ) : (
                    <Play size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
                <View style={styles.waveform}>
                  {waveformHeights.map((height, i) => (
                    <View
                      key={i}
                      style={[
                        styles.waveBar,
                        { 
                          height,
                          backgroundColor: Colors.primary,
                          opacity: isPlaying && i < 6 ? 1 : 0.6
                        }
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.otherDuration}>{formatDuration(message.duration)}</Text>
              </>
            )}
          </View>
        )}
      </View>
      <Text style={[styles.timestamp, isOwn && styles.ownTimestamp]}>
        {message.timestamp.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
    marginLeft: 12,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  ownBubble: {
    alignSelf: 'flex-end',
  },
  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
  },
  gradientBubble: {
    padding: 12,
  },
  ownContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otherContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: 30,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
    marginHorizontal: 1,
  },
  ownDuration: {
    fontSize: 12,
    color: Colors.background,
    marginLeft: 8,
    opacity: 0.8,
  },
  otherDuration: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 8,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
    marginLeft: 12,
  },
  ownTimestamp: {
    marginLeft: 0,
    marginRight: 12,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  tipTextContainer: {
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  tipSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
});
