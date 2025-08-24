import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function TabBarBackground() {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');

  return (
    <BlurView
      intensity={95}
      style={[
        StyleSheet.absoluteFillObject,
        styles.tabBarBackground,
        {
          backgroundColor: backgroundColor + 'F0', // 添加透明度
          borderTopColor: borderColor,
        }
      ]}
    />
  );
}

// 添加缺失的导出函数
export function useBottomTabOverflow() {
  // 对于非 iOS 平台，返回 0 或适当的默认值
  return 0;
}

const styles = StyleSheet.create({
  tabBarBackground: {
    borderTopWidth: 0.5,
  },
});