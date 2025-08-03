// src/pages/SettingsPage.js
import React, { useState, useEffect } from 'react';
import { MdEdit, MdSave, MdCancel, MdLock, MdPerson, MdEmail, MdBusiness, MdBadge } from 'react-icons/md';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

import './SettingsPage.css';

const SettingsPage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        name: '',
        department: '',
        employeeId: ''
    });

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Loading states
    const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
    const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);

    // Notification state
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type) => {
        setNotification({ message, type });
        const timer = setTimeout(() => {
            setNotification(null);
        }, 3000);
        return () => clearTimeout(timer);
    };

    // Fetch current user data
    const fetchUserData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/auth/me');
            const userData = response.data.data;
            setUser(userData);
            setProfileForm({
                name: userData.name || '',
                department: userData.department || '',
                employeeId: userData.employeeId || ''
            });
        } catch (err) {
            console.error('Failed to fetch user data:', err);
            setError('Failed to load user data. Please try again.');
            showNotification('Failed to load user data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    // Handle profile form changes
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle password form changes
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Start editing profile
    const handleEditProfile = () => {
        setIsEditingProfile(true);
    };

    // Cancel profile editing
    const handleCancelProfileEdit = () => {
        setIsEditingProfile(false);
        // Reset form to original values
        setProfileForm({
            name: user.name || '',
            department: user.department || '',
            employeeId: user.employeeId || ''
        });
    };

    // Update profile details
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileUpdateLoading(true);

        try {
            const response = await api.put('/auth/updatedetails', profileForm);
            
            if (response.data.success) {
                setUser(response.data.data);
                setIsEditingProfile(false);
                showNotification('Profile updated successfully!', 'success');
            }
        } catch (err) {
            console.error('Profile update error:', err);
            showNotification(
                err.response?.data?.message || 'Failed to update profile. Please try again.',
                'error'
            );
        } finally {
            setProfileUpdateLoading(false);
        }
    };

    // Start changing password
    const handleChangePassword = () => {
        setIsChangingPassword(true);
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    // Cancel password change
    const handleCancelPasswordChange = () => {
        setIsChangingPassword(false);
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    // Update password
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        // Validate passwords match
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showNotification('New passwords do not match.', 'error');
            return;
        }

        // Validate password length
        if (passwordForm.newPassword.length < 6) {
            showNotification('New password must be at least 6 characters long.', 'error');
            return;
        }

        setPasswordUpdateLoading(true);

        try {
            const response = await api.put('/auth/updatepassword', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });

            if (response.data.success) {
                setIsChangingPassword(false);
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                showNotification('Password updated successfully!', 'success');
            }
        } catch (err) {
            console.error('Password update error:', err);
            showNotification(
                err.response?.data?.message || 'Failed to update password. Please try again.',
                'error'
            );
        } finally {
            setPasswordUpdateLoading(false);
        }
    };

    return (
        <div className="app-container">
            
            <div className="main-content-area">
                
                {notification && (
                    <div className={`app-notification ${notification.type}`}>
                        {notification.message}
                    </div>
                )}
                <div className="settings-content">
                    <div className="settings-header">
                        <h1 className="page-title">Account Settings</h1>
                        <p className="page-subtitle">Manage your account information and security settings</p>
                    </div>

                    {loading ? (
                        <div className="settings-loading">Loading account information...</div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : (
                        <div className="settings-sections">
                            {/* Profile Information Section */}
                            <div className="settings-card">
                                <div className="card-header-settings">
                                    <div className="card-title">
                                        <MdPerson className="card-icon" />
                                        <h2>Profile Information</h2>
                                    </div>
                                    {!isEditingProfile && (
                                        <button 
                                            className="btn btn-secondary-settings" 
                                            onClick={handleEditProfile}
                                        >
                                            <MdEdit /> Edit Profile
                                        </button>
                                    )}
                                </div>

                                {isEditingProfile ? (
                                    <form onSubmit={handleUpdateProfile} className="settings-form">
                                        <div className="form-group">
                                            <label htmlFor="name">Full Name</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={profileForm.name}
                                                onChange={handleProfileChange}
                                                required
                                                placeholder="Enter your full name"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="employeeId">Employee ID</label>
                                            <input
                                                type="text"
                                                id="employeeId"
                                                name="employeeId"
                                                value={profileForm.employeeId}
                                                onChange={handleProfileChange}
                                                placeholder="Enter your employee ID"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="department">Department</label>
                                            <input
                                                type="text"
                                                id="department"
                                                name="department"
                                                value={profileForm.department}
                                                onChange={handleProfileChange}
                                                placeholder="Enter your department"
                                            />
                                        </div>

                                        <div className="form-actions">
                                            <button 
                                                type="submit" 
                                                className="btn btn-primary"
                                                disabled={profileUpdateLoading}
                                            >
                                                <MdSave />
                                                {profileUpdateLoading ? 'Updating...' : 'Save Changes'}
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn btn-cancel"
                                                onClick={handleCancelProfileEdit}
                                                disabled={profileUpdateLoading}
                                            >
                                                <MdCancel /> Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="profile-display">
                                        <div className="profile-field">
                                            <div className="field-label">
                                                <MdPerson className="field-icon" />
                                                Full Name
                                            </div>
                                            <div className="field-value">{user?.name || 'Not provided'}</div>
                                        </div>

                                        <div className="profile-field">
                                            <div className="field-label">
                                                <MdEmail className="field-icon" />
                                                Email Address
                                            </div>
                                            <div className="field-value">{user?.email}</div>
                                            <div className="field-note">Email cannot be changed</div>
                                        </div>

                                        <div className="profile-field">
                                            <div className="field-label">
                                                <MdBadge className="field-icon" />
                                                Employee ID
                                            </div>
                                            <div className="field-value">{user?.employeeId || 'Not provided'}</div>
                                        </div>

                                        <div className="profile-field">
                                            <div className="field-label">
                                                <MdBusiness className="field-icon" />
                                                Department
                                            </div>
                                            <div className="field-value">{user?.department || 'Not provided'}</div>
                                        </div>

                                        <div className="profile-field">
                                            <div className="field-label">
                                                <MdBadge className="field-icon" />
                                                Role
                                            </div>
                                            <div className="field-value">
                                                <span className={`role-badge role-${user?.role?.toLowerCase().replace(' ', '-')}`}>
                                                    {user?.role}
                                                </span>
                                            </div>
                                            <div className="field-note">Role can only be changed by an administrator</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Security Section */}
                            <div className="settings-card">
                                <div className="card-header-settings">
                                    <div className="card-title">
                                        <MdLock className="card-icon" />
                                        <h2>Security</h2>
                                    </div>
                                    {!isChangingPassword && (
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={handleChangePassword}
                                        >
                                            <MdLock /> Change Password
                                        </button>
                                    )}
                                </div>

                                {isChangingPassword ? (
                                    <form onSubmit={handleUpdatePassword} className="settings-form">
                                        <div className="form-group">
                                            <label htmlFor="currentPassword">Current Password</label>
                                            <input
                                                type="password"
                                                id="currentPassword"
                                                name="currentPassword"
                                                value={passwordForm.currentPassword}
                                                onChange={handlePasswordChange}
                                                required
                                                placeholder="Enter your current password"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="newPassword">New Password</label>
                                            <input
                                                type="password"
                                                id="newPassword"
                                                name="newPassword"
                                                value={passwordForm.newPassword}
                                                onChange={handlePasswordChange}
                                                required
                                                placeholder="Enter your new password"
                                                minLength="6"
                                            />
                                            <div className="hint-text">Password must be at least 6 characters long</div>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="confirmPassword">Confirm New Password</label>
                                            <input
                                                type="password"
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                value={passwordForm.confirmPassword}
                                                onChange={handlePasswordChange}
                                                required
                                                placeholder="Confirm your new password"
                                                minLength="6"
                                            />
                                        </div>

                                        <div className="form-actions">
                                            <button 
                                                type="submit" 
                                                className="btn btn-primary"
                                                disabled={passwordUpdateLoading}
                                            >
                                                <MdSave />
                                                {passwordUpdateLoading ? 'Updating...' : 'Update Password'}
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn btn-cancel"
                                                onClick={handleCancelPasswordChange}
                                                disabled={passwordUpdateLoading}
                                            >
                                                <MdCancel /> Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="security-display">
                                        <div className="security-field">
                                            <div className="field-label">
                                                <MdLock className="field-icon" />
                                                Password
                                            </div>
                                            <div className="field-value">••••••••••••</div>
                                            <div className="field-note">Last updated: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Unknown'}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Account Information Section */}
                            <div className="settings-card">
                                <div className="card-header-settings">
                                    <div className="card-title">
                                        <MdBadge className="card-icon" />
                                        <h2>Account Information</h2>
                                    </div>
                                </div>

                                <div className="account-display">
                                    <div className="account-field">
                                        <div className="field-label">Account Status</div>
                                        <div className="field-value">
                                            <span className={`status-badge ${user?.isActive ? 'active' : 'inactive'}`}>
                                                {user?.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="account-field">
                                        <div className="field-label">Member Since</div>
                                        <div className="field-value">
                                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'Unknown'}
                                        </div>
                                    </div>

                                    <div className="account-field">
                                        <div className="field-label">Last Login</div>
                                        <div className="field-value">
                                            {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : 'Never'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
