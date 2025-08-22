import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause } from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/colors';
import type { VoiceMessage } from '@/types/user';

interface VoiceMessageBubbleProps {
  message: VoiceMessage;
  isOwn: boolean;
  senderName?: string;
}

export function VoiceMessageBubble({ message, isOwn, senderName }: VoiceMessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Generate stable waveform heights based on message ID
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

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In a real app, this would control audio playback
    console.log(`${isPlaying ? 'Pausing' : 'Playing'} voice message ${message.id}`);
  };

  const bubbleStyle = isOwn ? styles.ownBubble : styles.otherBubble;
  const contentStyle = isOwn ? styles.ownContent : styles.otherContent;

  return (
    <View style={[styles.container, isOwn && styles.ownContainer]}>
      {!isOwn && senderName && (
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
});