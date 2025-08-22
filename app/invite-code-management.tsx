// CoC-App/app/invite-code-management.tsx - Expo兼容版本
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import type { InviteCodeData } from '../contexts/InviteCodeContext';
import { useInviteCode } from '../contexts/InviteCodeContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { UserRole } from '../contexts/UserRoleContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { useThemeColor } from '../hooks/useThemeColor';

interface GenerateCodeForm {
  role: UserRole;
  createdFor: string;
  description: string;
}

export default function InviteCodeManagementScreen() {
  const { t } = useLanguage();
  const { userRole: currentUserRole } = useUserRole();
  const {
    inviteCodes,
    generateInviteCode,
    revokeInviteCode,
    unbindDevice,
    refreshData,
    getCodesByRole,
    getUnusedCodes,
    getUsedCodes,
  } = useInviteCode();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'tint');

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unused' | 'used' | UserRole>('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generateForm, setGenerateForm] = useState<GenerateCodeForm>({
    role: 'core_member',
    createdFor: '',
    description: '',
  });

  // Check if current user has admin permissions
  React.useEffect(() => {
    if (currentUserRole.role !== 'admin') {
      Alert.alert(
        'Access Denied',
        'Only administrators can manage invite codes.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [currentUserRole, router]);

  if (currentUserRole.role !== 'admin') {
    return null; // Will redirect via useEffect
  }

  const getFilteredCodes = (): InviteCodeData[] => {
    switch (selectedFilter) {
      case 'unused':
        return getUnusedCodes();
      case 'used':
        return getUsedCodes();
      case 'admin':
      case 'core_member':
      case 'student':
        return getCodesByRole(selectedFilter);
      default:
        return inviteCodes;
    }
  };

  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'core_member': return 'Core Member';
      case 'student': return 'Student';
      default: return role;
    }
  };

  const getRoleIcon = (role: UserRole): string => {
    switch (role) {
      case 'admin': return '👑';
      case 'core_member': return '⭐';
      case 'student': return '👤';
      default: return '👤';
    }
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'admin': return '#e74c3c';
      case 'core_member': return '#f39c12';
      case 'student': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCodeExpired = (code: InviteCodeData): boolean => {
    return new Date(code.expiresAt) < new Date();
  };

  const handleGenerateCode = async () => {
    try {
      if (!generateForm.createdFor.trim()) {
        Alert.alert('Validation Error', 'Please enter who this code is for.');
        return;
      }

      const newCode = await generateInviteCode(
        generateForm.role,
        generateForm.createdFor.trim(),
        generateForm.description.trim() || undefined
      );

      setShowGenerateModal(false);
      setGenerateForm({
        role: 'core_member',
        createdFor: '',
        description: '',
      });

      Alert.alert(
        'Code Generated',
        `New ${getRoleDisplayName(generateForm.role)} invite code created:\n\n${newCode}`,
        [
          { text: 'Copy Code', onPress: () => handleCopyCode(newCode) },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate invite code. Please try again.');
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      Alert.alert('Copied', 'Invite code has been copied to clipboard.');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy invite code.');
    }
  };

  const handleRevokeCode = (codeData: InviteCodeData) => {
    Alert.alert(
      'Revoke Invite Code',
      `Are you sure you want to permanently delete this invite code?\n\nCode: ${codeData.code}\nFor: ${codeData.createdFor}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeInviteCode(codeData.code);
              Alert.alert('Success', 'Invite code has been deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete invite code. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleUnbindDevice = (codeData: InviteCodeData) => {
    if (!codeData.isUsed || !codeData.userInfo) return;

    Alert.alert(
      'Unbind Device',
      `Unbind device for ${codeData.userInfo.name}?\n\nThis will:\n• Reset the invite code to unused\n• Logout the user from their device\n• Allow them to re-register on a new device`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unbind',
          style: 'destructive',
          onPress: async () => {
            try {
              await unbindDevice(codeData.code);
              Alert.alert('Success', 'Device has been unbound. The user can now register on a new device.');
            } catch (error) {
              Alert.alert('Error', 'Failed to unbind device. Please try again.');
            }
          },
        },
      ]
    );
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const renderInviteCode = ({ item }: { item: InviteCodeData }) => (
    <TouchableOpacity
      style={[
        styles.codeCard,
        { backgroundColor: cardBackground, borderColor },
        isCodeExpired(item) && styles.expiredCard,
        !item.isUsed && styles.unusedCard,
      ]}
      onPress={() => handleCopyCode(item.code)}
    >
      <View style={styles.codeHeader}>
        <View style={styles.codeInfo}>
          <View style={styles.codeRow}>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
              <ThemedText style={styles.roleText}>
                {getRoleIcon(item.role)} {getRoleDisplayName(item.role)}
              </ThemedText>
            </View>
            
            {!item.isUsed && !isCodeExpired(item) && (
              <View style={styles.availableBadge}>
                <ThemedText style={styles.availableText}>AVAILABLE</ThemedText>
              </View>
            )}
            
            {item.isUsed && (
              <View style={styles.usedBadge}>
                <ThemedText style={styles.usedText}>USED</ThemedText>
              </View>
            )}
            
            {isCodeExpired(item) && (
              <View style={styles.expiredBadge}>
                <ThemedText style={styles.expiredText}>EXPIRED</ThemedText>
              </View>
            )}
          </View>
          
          <ThemedText style={styles.codeText}>{item.code}</ThemedText>
          <ThemedText style={styles.createdFor}>Created for: {item.createdFor}</ThemedText>
          
          {item.description && (
            <ThemedText style={styles.description}>{item.description}</ThemedText>
          )}
        </View>
      </View>

      <View style={styles.codeDetails}>
        <View style={styles.timestamps}>
          <ThemedText style={styles.timestamp}>
            Created: {formatDate(item.createdAt)}
          </ThemedText>
          {item.usedAt && (
            <ThemedText style={styles.timestamp}>
              Used: {formatDate(item.usedAt)}
            </ThemedText>
          )}
          <ThemedText style={styles.timestamp}>
            Expires: {formatDate(item.expiresAt)}
          </ThemedText>
        </View>

        {item.isUsed && item.userInfo && (
          <View style={styles.userInfo}>
            <ThemedText style={styles.userInfoTitle}>User:</ThemedText>
            <ThemedText style={styles.userInfoText}>
              {item.userInfo.name} • {item.userInfo.campus}
            </ThemedText>
            {item.deviceFingerprint && (
              <ThemedText style={styles.deviceInfo}>
                Device: {item.deviceFingerprint.brand} {item.deviceFingerprint.model}
              </ThemedText>
            )}
          </View>
        )}
      </View>

      <View style={styles.codeActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.copyButton]}
          onPress={() => handleCopyCode(item.code)}
        >
          <ThemedText style={styles.copyButtonText}>📋 Copy</ThemedText>
        </TouchableOpacity>

        {item.isUsed && (
          <TouchableOpacity
            style={[styles.actionButton, styles.unbindButton]}
            onPress={() => handleUnbindDevice(item)}
          >
            <ThemedText style={styles.unbindButtonText}>🔓 Unbind</ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleRevokeCode(item)}
        >
          <ThemedText style={styles.deleteButtonText}>🗑️ Delete</ThemedText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (
    filter: typeof selectedFilter,
    label: string,
    icon: string,
    count?: number
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: selectedFilter === filter ? accentColor : backgroundColor,
          borderColor,
        }
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <ThemedText style={[
        styles.filterButtonText,
        { color: selectedFilter === filter ? 'white' : textColor }
      ]}>
        {icon} {label} {count !== undefined ? `(${count})` : ''}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderGenerateModal = () => (
    <Modal
      visible={showGenerateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowGenerateModal(false)}
    >
      <ThemedView style={[styles.modalContainer, { backgroundColor }]}>
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>Generate Invite Code</ThemedText>
          <TouchableOpacity onPress={() => setShowGenerateModal(false)}>
            <ThemedText style={styles.closeButtonText}>×</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.formField}>
            <ThemedText style={styles.fieldLabel}>Role *</ThemedText>
            <View style={styles.roleButtons}>
              {[
                { role: 'core_member' as UserRole, label: 'Core Member', icon: '⭐' },
                { role: 'admin' as UserRole, label: 'Administrator', icon: '👑' },
              ].map(({ role, label, icon }) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleButton,
                    {
                      backgroundColor: generateForm.role === role ? accentColor : cardBackground,
                      borderColor,
                    }
                  ]}
                  onPress={() => setGenerateForm(prev => ({ ...prev, role }))}
                >
                  <ThemedText style={[
                    styles.roleButtonText,
                    { color: generateForm.role === role ? 'white' : textColor }
                  ]}>
                    {icon} {label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formField}>
            <ThemedText style={styles.fieldLabel}>Created For *</ThemedText>
            <TextInput
              style={[styles.textInput, { borderColor, color: textColor, backgroundColor: cardBackground }]}
              value={generateForm.createdFor}
              onChangeText={(text) => setGenerateForm(prev => ({ ...prev, createdFor: text }))}
              placeholder="Enter name or identifier"
              placeholderTextColor={borderColor}
              maxLength={100}
            />
          </View>

          <View style={styles.formField}>
            <ThemedText style={styles.fieldLabel}>Description (Optional)</ThemedText>
            <TextInput
              style={[styles.textAreaInput, { borderColor, color: textColor, backgroundColor: cardBackground }]}
              value={generateForm.description}
              onChangeText={(text) => setGenerateForm(prev => ({ ...prev, description: text }))}
              placeholder="Enter description or purpose"
              placeholderTextColor={borderColor}
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: accentColor }]}
            onPress={handleGenerateCode}
          >
            <ThemedText style={styles.generateButtonText}>Generate Code</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </Modal>
  );

  const filteredCodes = getFilteredCodes();

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Header 
        title="Invite Codes"
        showBackButton={true}
        showProfile={false}
      />

      {/* Generate Button */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.generateCodeButton, { backgroundColor: accentColor }]}
          onPress={() => setShowGenerateModal(true)}
        >
          <ThemedText style={styles.generateCodeButtonText}>+ Generate Code</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: cardBackground, borderColor }]}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{getUnusedCodes().length}</ThemedText>
          <ThemedText style={styles.statLabel}>Available</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{getUsedCodes().length}</ThemedText>
          <ThemedText style={styles.statLabel}>Used</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{inviteCodes.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Total</ThemedText>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'All', '📋')}
        {renderFilterButton('unused', 'Available', '✅')}
        {renderFilterButton('used', 'Used', '👥')}
        {renderFilterButton('admin', 'Admins', '👑')}
        {renderFilterButton('core_member', 'Core', '⭐')}
      </View>

      {/* Codes List */}
      <FlatList
        data={filteredCodes}
        keyExtractor={(item) => item.code}
        renderItem={renderInviteCode}
        style={styles.codesList}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No invite codes found</ThemedText>
            <ThemedText style={styles.emptySubtext}>Try adjusting your filters or generate a new code</ThemedText>
          </ThemedView>
        }
      />

      {/* Generate Modal */}
      {renderGenerateModal()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  generateCodeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  generateCodeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  codesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  codeCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  unusedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  expiredCard: {
    opacity: 0.6,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  codeHeader: {
    marginBottom: 12,
  },
  codeInfo: {
    flex: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  availableBadge: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  availableText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  usedBadge: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  usedText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  expiredBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expiredText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  codeText: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  createdFor: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  codeDetails: {
    marginBottom: 12,
  },
  timestamps: {
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.6,
    marginBottom: 2,
  },
  userInfo: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },
  userInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  userInfoText: {
    fontSize: 12,
    marginBottom: 2,
  },
  deviceInfo: {
    fontSize: 11,
    opacity: 0.7,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: '#3498db',
  },
  copyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  unbindButton: {
    backgroundColor: '#f39c12',
  },
  unbindButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    opacity: 0.6,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.4,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButtonText: {
    fontSize: 24,
    opacity: 0.6,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
  },
  roleButtons: {
    gap: 8,
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  generateButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});