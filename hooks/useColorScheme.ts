import { useTheme } from '../contexts/ThemeContext';

/**
 * 返回当前的颜色方案，使用我们的主题系统
 */
export function useColorScheme() {
  const { isDark } = useTheme();
  return isDark ? 'dark' : 'light';
}