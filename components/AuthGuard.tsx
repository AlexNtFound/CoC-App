// CoC-App/components/AuthGuard.tsx - 认证守卫组件
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useIntegratedAuth } from '../contexts/IntegratedAuthContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export default function AuthGuard({ 
  children, 
  fallback, 
  redirectTo = '/login',
  requireAuth = true 
}: AuthGuardProps) {
  const { isAuthenticated, loading } = useIntegratedAuth();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'tint');

  useEffect(() => {
    if (!loading && requireAuth && !isAuthenticated) {
      // 用户未认证且需要认证，重定向到登录页面
      router.replace(redirectTo);
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo]);

  // 显示加载状态
  if (loading) {
    return (
      fallback || (
        <ThemedView style={[styles.loadingContainer, { backgroundColor }]}>
          <ActivityIndicator size="large" color={accentColor} />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </ThemedView>
      )
    );
  }

  // 如果需要认证但用户未认证，显示占位内容
  if (requireAuth && !isAuthenticated) {
    return (
      fallback || (
        <ThemedView style={[styles.loadingContainer, { backgroundColor }]}>
          <ThemedText style={styles.redirectText}>Redirecting to login...</ThemedText>
        </ThemedView>
      )
    );
  }

  // 用户已认证或不需要认证，显示子组件
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  redirectText: {
    fontSize: 16,
    textAlign: 'center',
  },
});