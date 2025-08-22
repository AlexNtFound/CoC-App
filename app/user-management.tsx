// CoC-App/app/user-management.tsx
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
import { useLanguage } from '../contexts/LanguageContext';
import type { ManagedUser } from '../contexts/UserManagementContext';
import { useUserManagement } from '../contexts/UserManagementContext';
import type { UserRole } from '../contexts/UserRoleContext';
import { useUserRole } from '../contexts/UserRoleContext';
import { useThemeColor } from '../hooks/useThemeColor';

interface AddUserForm {
  name: string;
  email: string;
  campus: string;
  role: UserRole;
}

export default function UserManagementScreen() {
  const { t } = useLanguage();
  const { userRole: currentUserRole } = useUserRole();
  const {
    users,
    addUser,
    updateUserRole,
    deactivateUser,
    reactivateUser,
    searchUsers,
    getUsersByRole,
    refreshUsers,
  } = useUserManagement();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'tint');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | UserRole>('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [addUserForm, setAddUserForm] = useState<AddUserForm>({
    name: '',
    email: '',
    campus: '',
    role: 'student',
  });

  // Check if current user has admin permissions
  React.useEffect(() => {
    if (currentUserRole.role !== 'admin') {
      Alert.alert(
        'Access Denied',
        'Only administrators can manage users.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [currentUserRole, router]);

  if (currentUserRole.role !== 'admin') {
    return null; // Will redirect via useEffect
  }

  const getFilteredUsers = (): ManagedUser[] => {
    let filtered = users;

    // Filter by role
    if (selectedFilter !== 'all') {
      filtered = getUsersByRole(selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = searchUsers(searchQuery);
    }

    return filtered.sort((a, b) => {
      // Sort by role priority (admin > core_member > student), then by name
      const rolePriority = { admin: 3, core_member: 2, student: 1 };
      const roleDiff = rolePriority[b.role] - rolePriority[a.role];
      if (roleDiff !== 0) return roleDiff;
      return a.name.localeCompare(b.name);
    });
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

  const handleChangeUserRole = (user: ManagedUser) => {
    const roles: { role: UserRole; label: string }[] = [
      { role: 'student', label: '👤 Student' },
      { role: 'core_member', label: '⭐ Core Member' },
      { role: 'admin', label: '👑 Administrator' },
    ];

    Alert.alert(
      'Change User Role',
      `Change role for ${user.name}?\nCurrent: ${getRoleIcon(user.role)} ${getRoleDisplayName(user.role)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...roles
          .filter(r => r.role !== user.role) // Exclude current role
          .map(({ role, label }) => ({
            text: label,
            onPress: () => {
              Alert.alert(
                'Confirm Role Change',
                `Change ${user.name}'s role to ${getRoleDisplayName(role)}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Confirm',
                    onPress: async () => {
                      try {
                        await updateUserRole(user.id, role);
                        Alert.alert(
                          'Success',
                          `${user.name}'s role has been changed to ${getRoleDisplayName(role)}.`
                        );
                      } catch (error) {
                        Alert.alert('Error', 'Failed to update user role. Please try again.');
                      }
                    },
                  },
                ]
              );
            },
          })),
      ]
    );
  };

  const handleToggleUserStatus = (user: ManagedUser) => {
    const action = user.isActive ? 'deactivate' : 'reactivate';
    const actionName = user.isActive ? 'Deactivate' : 'Reactivate';
    
    Alert.alert(
      `${actionName} User`,
      `${actionName} ${user.name}? ${user.isActive ? 'They will no longer be able to access the app.' : 'They will regain access to the app.'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionName,
          style: user.isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (user.isActive) {
                await deactivateUser(user.id);
              } else {
                await reactivateUser(user.id);
              }
              Alert.alert('Success', `${user.name} has been ${action}d.`);
            } catch (error) {
              Alert.alert('Error', `Failed to ${action} user. Please try again.`);
            }
          },
        },
      ]
    );
  };

  const handleAddUser = async () => {
    try {
      // Validate form
      if (!addUserForm.name.trim() || !addUserForm.email.trim() || !addUserForm.campus.trim()) {
        Alert.alert('Validation Error', 'Please fill in all required fields.');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(addUserForm.email)) {
        Alert.alert('Validation Error', 'Please enter a valid email address.');
        return;
      }

      await addUser({
        name: addUserForm.name.trim(),
        email: addUserForm.email.trim().toLowerCase(),
        campus: addUserForm.campus.trim(),
        role: addUserForm.role,
      });

      setShowAddUserModal(false);
      setAddUserForm({ name: '', email: '', campus: '', role: 'student' });
      
      Alert.alert(
        'Success',
        `${addUserForm.name} has been added as a ${getRoleDisplayName(addUserForm.role)}.`
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add user. Please try again.');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUsers();
    } finally {
      setRefreshing(false);
    }
  }, [refreshUsers]);

  const renderUser = ({ item }: { item: ManagedUser }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        { backgroundColor: cardBackground, borderColor },
        !item.isActive && styles.deactivatedCard
      ]}
      onPress={() => handleChangeUserRole(item)}
    >
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <ThemedText style={styles.userName}>{item.name}</ThemedText>
            {!item.isActive && (
              <View style={styles.deactivatedBadge}>
                <ThemedText style={styles.deactivatedText}>INACTIVE</ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
          <ThemedText style={styles.userCampus}>📍 {item.campus}</ThemedText>
        </View>
        
        <View style={styles.userRole}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
            <ThemedText style={styles.roleText}>
              {getRoleIcon(item.role)} {getRoleDisplayName(item.role)}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.userActions}>
        <ThemedText style={styles.joinDate}>
          Joined: {new Date(item.joinDate).toLocaleDateString()}
        </ThemedText>
        
        <TouchableOpacity
          style={[
            styles.statusButton,
            { backgroundColor: item.isActive ? '#e74c3c' : '#27ae60' }
          ]}
          onPress={() => handleToggleUserStatus(item)}
        >
          <ThemedText style={styles.statusButtonText}>
            {item.isActive ? 'Deactivate' : 'Reactivate'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filter: 'all' | UserRole, label: string, icon: string) => (
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
        {icon} {label}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderAddUserModal = () => (
    <Modal
      visible={showAddUserModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAddUserModal(false)}
    >
      <ThemedView style={[styles.modalContainer, { backgroundColor }]}>
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>Add New User</ThemedText>
          <TouchableOpacity onPress={() => setShowAddUserModal(false)}>
            <ThemedText style={styles.closeButtonText}>×</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.formField}>
            <ThemedText style={styles.fieldLabel}>Full Name *</ThemedText>
            <TextInput
              style={[styles.textInput, { borderColor, color: textColor, backgroundColor: cardBackground }]}
              value={addUserForm.name}
              onChangeText={(text) => setAddUserForm(prev => ({ ...prev, name: text }))}
              placeholder="Enter full name"
              placeholderTextColor={borderColor}
            />
          </View>

          <View style={styles.formField}>
            <ThemedText style={styles.fieldLabel}>Email *</ThemedText>
            <TextInput
              style={[styles.textInput, { borderColor, color: textColor, backgroundColor: cardBackground }]}
              value={addUserForm.email}
              onChangeText={(text) => setAddUserForm(prev => ({ ...prev, email: text }))}
              placeholder="Enter email address"
              placeholderTextColor={borderColor}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formField}>
            <ThemedText style={styles.fieldLabel}>Campus *</ThemedText>
            <TextInput
              style={[styles.textInput, { borderColor, color: textColor, backgroundColor: cardBackground }]}
              value={addUserForm.campus}
              onChangeText={(text) => setAddUserForm(prev => ({ ...prev, campus: text }))}
              placeholder="Enter campus/university"
              placeholderTextColor={borderColor}
            />
          </View>

          <View style={styles.formField}>
            <ThemedText style={styles.fieldLabel}>Role *</ThemedText>
            <View style={styles.roleButtons}>
              {[
                { role: 'student' as UserRole, label: 'Student', icon: '👤' },
                { role: 'core_member' as UserRole, label: 'Core Member', icon: '⭐' },
                { role: 'admin' as UserRole, label: 'Administrator', icon: '👑' },
              ].map(({ role, label, icon }) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleButton,
                    {
                      backgroundColor: addUserForm.role === role ? accentColor : cardBackground,
                      borderColor,
                    }
                  ]}
                  onPress={() => setAddUserForm(prev => ({ ...prev, role }))}
                >
                  <ThemedText style={[
                    styles.roleButtonText,
                    { color: addUserForm.role === role ? 'white' : textColor }
                  ]}>
                    {icon} {label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: accentColor }]}
            onPress={handleAddUser}
          >
            <ThemedText style={styles.addButtonText}>Add User</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </Modal>
  );

  const filteredUsers = getFilteredUsers();

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Header 
        title="User Management"
        showBackButton={true}
        showProfile={false}
      />

      {/* Search and Add */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { borderColor, color: textColor, backgroundColor: cardBackground }]}
          placeholder="Search users..."
          placeholderTextColor={borderColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={[styles.addUserButton, { backgroundColor: accentColor }]}
          onPress={() => setShowAddUserModal(true)}
        >
          <ThemedText style={styles.addUserButtonText}>+ Add</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'All Users', '👥')}
        {renderFilterButton('admin', 'Admins', '👑')}
        {renderFilterButton('core_member', 'Core Members', '⭐')}
        {renderFilterButton('student', 'Students', '👤')}
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: cardBackground, borderColor }]}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{getUsersByRole('admin').length}</ThemedText>
          <ThemedText style={styles.statLabel}>Admins</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{getUsersByRole('core_member').length}</ThemedText>
          <ThemedText style={styles.statLabel}>Core Members</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{getUsersByRole('student').length}</ThemedText>
          <ThemedText style={styles.statLabel}>Students</ThemedText>
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        style={styles.usersList}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No users found</ThemedText>
            <ThemedText style={styles.emptySubtext}>Try adjusting your search or filters</ThemedText>
          </ThemedView>
        }
      />

      {/* Add User Modal */}
      {renderAddUserModal()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  addUserButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addUserButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
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
  usersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  deactivatedCard: {
    opacity: 0.6,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  deactivatedBadge: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deactivatedText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  userCampus: {
    fontSize: 14,
    opacity: 0.7,
  },
  userRole: {
    alignItems: 'flex-end',
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
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusButtonText: {
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
  addButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});