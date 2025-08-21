// components/ThemedProfileIcon.tsx
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';

interface ThemedProfileIconProps {
  size?: number;
  style?: ViewStyle;
}

export const ThemedProfileIcon: React.FC<ThemedProfileIconProps> = ({ 
  size = 80, 
  style 
}) => {
  const { isDark } = useTheme();
  const iconColor = useThemeColor({}, 'icon');
  const backgroundColor = useThemeColor({}, 'background');
  
  const radius = size / 2;
  
  // Light Theme - Abstract Style
  const AbstractIcon = () => (
    <View style={[
      styles.iconContainer,
      {
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#2c3e50',
      },
      style
    ]}>
      {/* Head circle */}
      <View style={[
        styles.abstractHead,
        {
          width: size * 0.31, // ~25px for 80px icon
          height: size * 0.31,
          borderRadius: (size * 0.31) / 2,
          backgroundColor: '#2c3e50',
          top: size * 0.225, // ~18px for 80px icon
          left: '50%',
          marginLeft: -(size * 0.31) / 2,
        }
      ]} />
      
      {/* Body/shoulders shape */}
      <View style={[
        styles.abstractBody,
        {
          width: size * 0.44, // ~35px for 80px icon
          height: size * 0.25, // ~20px for 80px icon
          backgroundColor: '#2c3e50',
          bottom: size * 0.1875, // ~15px for 80px icon
          borderTopLeftRadius: (size * 0.44) / 2,
          borderTopRightRadius: (size * 0.44) / 2,
          left: '50%',
          marginLeft: -(size * 0.44) / 2,
        }
      ]} />
    </View>
  );
  
  // Dark Theme - Modern Style
  const ModernIcon = () => (
    <View style={[
      styles.iconContainer,
      {
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: '#34495e',
        // Add subtle gradient effect with shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
      style
    ]}>
      {/* Head circle */}
      <View style={[
        styles.modernHead,
        {
          width: size * 0.25, // ~20px for 80px icon
          height: size * 0.25,
          borderRadius: (size * 0.25) / 2,
          backgroundColor: 'white',
          top: size * 0.25, // ~20px for 80px icon
          left: '50%',
          marginLeft: -(size * 0.25) / 2,
        }
      ]} />
      
      {/* Body/shoulders shape */}
      <View style={[
        styles.modernBody,
        {
          width: size * 0.375, // ~30px for 80px icon
          height: size * 0.1875, // ~15px for 80px icon
          backgroundColor: 'white',
          bottom: size * 0.225, // ~18px for 80px icon
          borderTopLeftRadius: (size * 0.375) / 2,
          borderTopRightRadius: (size * 0.375) / 2,
          left: '50%',
          marginLeft: -(size * 0.375) / 2,
        }
      ]} />
    </View>
  );
  
  return isDark ? <ModernIcon /> : <AbstractIcon />;
};

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  abstractHead: {
    position: 'absolute',
  },
  abstractBody: {
    position: 'absolute',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  modernHead: {
    position: 'absolute',
  },
  modernBody: {
    position: 'absolute',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
});

export default ThemedProfileIcon;