import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { ThemedText } from './ThemedText';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export function Logo({ size = 'medium', showText = true }: LogoProps) {
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  
  const sizeStyles = {
    small: {
      container: { width: 60, height: 60 },
      circle: { width: 40, height: 40 },
      innerCircle1: { width: 30, height: 30 },
      innerCircle2: { width: 20, height: 20 },
      text: { fontSize: 6 },
      subtitle: { fontSize: 8 },
      chinese: { fontSize: 10 }
    },
    medium: {
      container: { width: 120, height: 120 },
      circle: { width: 80, height: 80 },
      innerCircle1: { width: 60, height: 60 },
      innerCircle2: { width: 40, height: 40 },
      text: { fontSize: 8 },
      subtitle: { fontSize: 12 },
      chinese: { fontSize: 14 }
    },
    large: {
      container: { width: 200, height: 200 },
      circle: { width: 140, height: 140 },
      innerCircle1: { width: 100, height: 100 },
      innerCircle2: { width: 70, height: 70 },
      text: { fontSize: 12 },
      subtitle: { fontSize: 16 },
      chinese: { fontSize: 20 }
    }
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, currentSize.container]}>
      {/* 装饰线条 */}
      <View style={[styles.decorativeLine, styles.topLeft, { borderColor: textColor }]} />
      <View style={[styles.decorativeLine, styles.topRight, { borderColor: textColor }]} />
      <View style={[styles.decorativeLine, styles.bottomLeft, { borderColor: textColor }]} />
      <View style={[styles.decorativeLine, styles.bottomRight, { borderColor: textColor }]} />
      
      {/* 同心圆 */}
      <View style={[styles.circle, currentSize.circle, { borderColor: textColor }]}>
        <View style={[styles.circle, currentSize.innerCircle1, { borderColor: textColor }]}>
          <View style={[styles.circle, currentSize.innerCircle2, { borderColor: textColor }]}>
            {showText && (
              <View style={styles.centerText}>
                <ThemedText style={[styles.mainText, currentSize.text, { color: textColor }]}>
                  CHRISTIANS
                </ThemedText>
                <ThemedText style={[styles.mainText, currentSize.text, { color: textColor }]}>
                  ON CAMPUS
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
      
      {/* 右侧文字 */}
      {showText && (
        <View style={styles.sideText}>
          <ThemedText style={[styles.chineseText, currentSize.chinese, { color: textColor }]}>
            校
          </ThemedText>
          <ThemedText style={[styles.chineseText, currentSize.chinese, { color: textColor }]}>
            园
          </ThemedText>
          <ThemedText style={[styles.chineseText, currentSize.chinese, { color: textColor }]}>
            基
          </ThemedText>
          <ThemedText style={[styles.chineseText, currentSize.chinese, { color: textColor }]}>
            督
          </ThemedText>
          <ThemedText style={[styles.chineseText, currentSize.chinese, { color: textColor }]}>
            徒
          </ThemedText>
        </View>
      )}
      
      {/* 底部 BERKELEY */}
      {showText && (
        <ThemedText style={[styles.berkeleyText, currentSize.subtitle, { color: textColor }]}>
          BERKELEY
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circle: {
    borderWidth: 2,
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  centerText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainText: {
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 12,
  },
  sideText: {
    position: 'absolute',
    right: -25,
    alignItems: 'center',
    justifyContent: 'center',
    height: '60%',
  },
  chineseText: {
    fontWeight: 'bold',
    lineHeight: 16,
  },
  berkeleyText: {
    position: 'absolute',
    bottom: -30,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  decorativeLine: {
    position: 'absolute',
    width: 20,
    height: 2,
    borderWidth: 1,
  },
  topLeft: {
    top: 10,
    left: 10,
    transform: [{ rotate: '45deg' }],
  },
  topRight: {
    top: 10,
    right: 10,
    transform: [{ rotate: '-45deg' }],
  },
  bottomLeft: {
    bottom: 10,
    left: 10,
    transform: [{ rotate: '-45deg' }],
  },
  bottomRight: {
    bottom: 10,
    right: 10,
    transform: [{ rotate: '45deg' }],
  },
});