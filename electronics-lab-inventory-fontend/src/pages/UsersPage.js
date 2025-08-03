// src/pages/UsersPage.js
import React, { useEffect, useState, useContext } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import AuthContext from '../contexts/AuthContext';
import { MdEdit, MdCheckCircle, MdCancel, MdPersonAdd, MdSearch, MdRefresh, MdLock, MdSecurity, MdClose, MdVisibility, MdVisibilityOff } from 'react-icons/md';

const UsersPage = () => {
    const { user: currentUser } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editedRole, setEditedRole] = useState('');
    const [notification, setNotification] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsersCount, setTotalUsersCount] = useState(0);

    // Add User Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [addUserForm, setAddUserForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'User',
        employeeId: '',
        department: ''
    });
    const [addUserErrors, setAddUserErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmittingUser, setIsSubmittingUser] = useState(false);

    const allowedRoles = ['Admin', 'User', 'Lab Technician', 'Researcher', 'Manufacturing Engineer'];
    const statusOptions = ['all', 'active', 'inactive'];

    useEffect(() => {
        fetchUsers();
    }, [searchTerm, filterRole, filterStatus, page, limit]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                limit,
                search: searchTerm,
                role: filterRole,
                status: filterStatus
            };
            const res = await api.get('/auth/users', { params });
            setUsers(res.data.data);
            setTotalPages(res.data.pagination.total);
            setTotalUsersCount(res.data.pagination.totalCount);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError(err.response?.data?.message || 'Failed to load users. You might not have access.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (user) => {
        setEditingUserId(user._id);
        setEditedRole(user.role);
    };

    const handleSaveRole = async (userId) => {
        try {
            if (userId === currentUser.id) {
                setNotification({ type: 'error', message: 'You cannot change your own role.' });
                return;
            }

            const res = await api.put(`/auth/users/${userId}`, { role: editedRole });
            setUsers(users.map(user => (user._id === userId ? res.data.data : user)));
            setEditingUserId(null);
            setNotification({ type: 'success', message: `Role for ${res.data.data.name} updated successfully!` });
        } catch (err) {
            console.error('Failed to update role:', err);
            setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to update role.' });
        }
    };

    const handleToggleActiveStatus = async (userId, currentStatus) => {
        if (userId === currentUser.id) {
            setNotification({ type: 'error', message: 'You cannot deactivate your own account.' });
            return;
        }
        if (window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
            try {
                const res = await api.put(`/auth/users/${userId}`, { isActive: !currentStatus });
                setUsers(users.map(user => (user._id === userId ? res.data.data : user)));
                setNotification({ type: 'success', message: `User ${res.data.data.name} ${res.data.data.isActive ? 'activated' : 'deactivated'} successfully!` });
            } catch (err) {
                console.error('Failed to toggle user status:', err);
                setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to toggle user status.' });
            }
        }
    };

    // Add User Functions
    const handleAddUser = () => {
        setShowAddModal(true);
        setAddUserForm({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'User',
            employeeId: '',
            department: ''
        });
        setAddUserErrors({});
    };

    const handleAddUserInputChange = (e) => {
        const { name, value } = e.target;
        setAddUserForm(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear specific error when user starts typing
        if (addUserErrors[name]) {
            setAddUserErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateAddUserForm = () => {
        const errors = {};

        // Name validation
        if (!addUserForm.name.trim()) {
            errors.name = 'Name is required';
        } else if (addUserForm.name.trim().length > 100) {
            errors.name = 'Name cannot be more than 100 characters';
        }

        // Email validation
        if (!addUserForm.email.trim()) {
            errors.email = 'Email is required';
        } else {
            const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(addUserForm.email.trim())) {
                errors.email = 'Please provide a valid email address';
            }
        }

        // Password validation
        if (!addUserForm.password) {
            errors.password = 'Password is required';
        } else if (addUserForm.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        // Confirm password validation
        if (!addUserForm.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (addUserForm.password !== addUserForm.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        // Role validation
        if (!allowedRoles.includes(addUserForm.role)) {
            errors.role = 'Please select a valid role';
        }

        // Employee ID validation (optional but limited length)
        if (addUserForm.employeeId && addUserForm.employeeId.length > 20) {
            errors.employeeId = 'Employee ID cannot be more than 20 characters';
        }

        // Department validation (optional but limited length)
        if (addUserForm.department && addUserForm.department.length > 100) {
            errors.department = 'Department cannot be more than 100 characters';
        }

        return errors;
    };

    const handleAddUserSubmit = async (e) => {
        e.preventDefault();
        
        const errors = validateAddUserForm();
        if (Object.keys(errors).length > 0) {
            setAddUserErrors(errors);
            return;
        }

        setIsSubmittingUser(true);
        setAddUserErrors({});

        try {
            const userData = {
                name: addUserForm.name.trim(),
                email: addUserForm.email.trim().toLowerCase(),
                password: addUserForm.password,
                role: addUserForm.role,
                ...(addUserForm.employeeId && { employeeId: addUserForm.employeeId.trim() }),
                ...(addUserForm.department && { department: addUserForm.department.trim() })
            };

            const res = await api.post('/auth/register', userData);
            
            if (res.data.success) {
                setNotification({ type: 'success', message: `User ${userData.name} added successfully!` });
                setShowAddModal(false);
                fetchUsers(); // Refresh the users list
            } else {
                setNotification({ type: 'error', message: res.data.message || 'Failed to add user.' });
            }
        } catch (err) {
            console.error('Failed to add user:', err);
            const errorMessage = err.response?.data?.message || 'Failed to add user. Please try again.';
            
            // Handle specific validation errors from backend
            if (err.response?.data?.errors) {
                setAddUserErrors(err.response.data.errors);
            } else {
                setNotification({ type: 'error', message: errorMessage });
            }
        } finally {
            setIsSubmittingUser(false);
        }
    };

    const handleCloseAddModal = () => {
        setShowAddModal(false);
        setAddUserForm({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'User',
            employeeId: '',
            department: ''
        });
        setAddUserErrors({});
    };

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Only Admin can see this page, enforce it in frontend for UX
    if (currentUser?.role !== 'Admin') {
        return (
            <div className="users-page-wrapper" style={usersStyles.appContainer}>
                <div style={usersStyles.sidebarContainer}>
                    <Sidebar />
                </div>
                <div style={usersStyles.mainContentArea}>
                    <div style={usersStyles.navbarContainer}>
                        <Navbar />
                    </div>
                    <div style={usersStyles.usersContent}>
                        <div style={usersStyles.accessDeniedState}>
                            <div style={usersStyles.noDataIllustration}>
                                <MdLock style={usersStyles.noDataIcon} />
                                <div style={usersStyles.accessDeniedBadge}>
                                    <MdSecurity />
                                </div>
                            </div>
                            <div style={usersStyles.noDataContent}>
                                <h3>Access Denied</h3>
                                <p>You do not have the necessary permissions to view this page. Only administrators can manage users.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading && users.length === 0) {
        return (
            <div className="users-page-wrapper" style={usersStyles.appContainer}>
                <div style={usersStyles.sidebarContainer}>
                    <Sidebar />
                </div>
                <div style={usersStyles.mainContentArea}>
                    <div style={usersStyles.navbarContainer}>
                        <Navbar />
                    </div>
                    <div style={usersStyles.usersContent}>
                        <div style={usersStyles.loadingState}>
                            <div style={usersStyles.loadingSpinner}></div>
                            <p>Loading users...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && users.length === 0) {
        return (
            <div className="users-page-wrapper" style={usersStyles.appContainer}>
                <div style={usersStyles.sidebarContainer}>
                    <Sidebar />
                </div>
                <div style={usersStyles.mainContentArea}>
                    <div style={usersStyles.navbarContainer}>
                        <Navbar />
                    </div>
                    <div style={usersStyles.usersContent}>
                        <div style={usersStyles.errorState}>
                            <div style={usersStyles.errorMessage}>{error}</div>
                            <button style={usersStyles.retryButton} onClick={fetchUsers}>
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="users-page-wrapper" style={usersStyles.appContainer}>
            
                <Sidebar />
            
            <div style={usersStyles.mainContentArea}>
                <div style={usersStyles.navbarContainer}>
                    <Navbar />
                </div>
                {notification && (
                    <div style={{
                        ...usersStyles.notification,
                        ...(notification.type === 'success' ? usersStyles.notificationSuccess : {}),
                        ...(notification.type === 'error' ? usersStyles.notificationError : {})
                    }}>
                        {notification.message}
                    </div>
                )}
                <div style={usersStyles.usersContent}>
                    <div style={usersStyles.usersPageContent}>
                        {/* Enhanced Header */}
                        <header style={usersStyles.usersHeader}>
                            <div style={usersStyles.headerLeft}>
                                <div style={usersStyles.titleContainer}>
                                    <div style={usersStyles.titleIcon}>
                                        <MdPersonAdd />
                                    </div>
                                    <div>
                                        <h1 style={usersStyles.pageTitle}>User Management</h1>
                                        <p style={usersStyles.pageSubtitle}>
                                            {totalUsersCount} users • {users.filter(u => u.isActive).length} active members
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div style={usersStyles.usersActions}>
                                <button style={usersStyles.refreshButton} onClick={fetchUsers}>
                                    <MdRefresh style={usersStyles.buttonIcon} />
                                    Refresh
                                </button>
                                <button style={usersStyles.primaryButton} onClick={handleAddUser}>
                                    <MdPersonAdd style={usersStyles.buttonIcon} />
                                    Add New User
                                </button>
                            </div>
                        </header>

                        {/* Enhanced Filter Bar */}
                        <div style={usersStyles.filterBar}>
                            <div style={usersStyles.searchInputGroup}>
                                <MdSearch style={usersStyles.searchIcon} />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, employee ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={usersStyles.searchInput}
                                />
                            </div>

                            <select 
                                value={filterRole} 
                                onChange={(e) => setFilterRole(e.target.value)}
                                style={usersStyles.filterSelect}
                            >
                                <option value="all">All Roles</option>
                                {allowedRoles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>

                            <select 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={usersStyles.filterSelect}
                            >
                                {statusOptions.map(status => (
                                    <option key={status} value={status}>
                                        {status === 'all' ? 'All Statuses' : status === 'active' ? 'Active' : 'Inactive'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Enhanced User Table */}
                        <div style={usersStyles.userListContainer}>
                            <div style={usersStyles.tableWrapper}>
                                <div style={usersStyles.tableContainer}>
                                    <table style={usersStyles.table}>
                                        <thead style={usersStyles.tableHead}>
                                            <tr>
                                                <th style={usersStyles.tableHeaderName}>Name</th>
                                                <th style={usersStyles.tableHeaderEmail}>Email</th>
                                                <th style={usersStyles.tableHeaderRole}>Role</th>
                                                <th style={usersStyles.tableHeaderEmployeeId}>Employee ID</th>
                                                <th style={usersStyles.tableHeaderDepartment}>Department</th>
                                                <th style={usersStyles.tableHeaderStatus}>Status</th>
                                                <th style={usersStyles.tableHeaderLastLogin}>Last Login</th>
                                                <th style={usersStyles.tableHeaderActions}>Actions</th>
                                            </tr>
                                        </thead>
                                    </table>
                                </div>
                                
                                <div style={usersStyles.scrollableTableBody}>
                                    <table style={usersStyles.bodyTable}>
                                        <tbody>
                                            {users.length > 0 ? (
                                                users.map((user) => (
                                                    <tr key={user._id} style={usersStyles.tableRow}>
                                                        <td style={usersStyles.tableCellName}>{user.name}</td>
                                                        <td style={usersStyles.tableCellEmail}>
                                                            <div style={usersStyles.emailContainer}>
                                                                <span style={usersStyles.emailText} title={user.email}>
                                                                    {user.email}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td style={usersStyles.tableCellRole}>
                                                            {editingUserId === user._id ? (
                                                                <select
                                                                    value={editedRole}
                                                                    onChange={(e) => setEditedRole(e.target.value)}
                                                                    style={usersStyles.roleSelectInput}
                                                                    disabled={user._id === currentUser.id}
                                                                >
                                                                    {allowedRoles.map(role => (
                                                                        <option key={role} value={role}>{role}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <span style={{
                                                                    ...usersStyles.roleBadge,
                                                                    ...getRoleStyle(user.role)
                                                                }}>
                                                                    {user.role}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={usersStyles.tableCellEmployeeId}>{user.employeeId || 'N/A'}</td>
                                                        <td style={usersStyles.tableCellDepartment}>{user.department || 'N/A'}</td>
                                                        <td style={usersStyles.tableCellStatus}>
                                                            <span style={{
                                                                ...usersStyles.statusBadge,
                                                                ...getStatusStyle(user.isActive)
                                                            }}>
                                                                {user.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td style={usersStyles.tableCellLastLogin}>
                                                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                                                        </td>
                                                        <td style={usersStyles.tableCellActions}>
                                                            <div style={usersStyles.actionButtons}>
                                                                {editingUserId === user._id ? (
                                                                    <>
                                                                        <button
                                                                            style={{
                                                                                ...usersStyles.iconBtn,
                                                                                ...usersStyles.saveBtn
                                                                            }}
                                                                            onClick={() => handleSaveRole(user._id)}
                                                                            title="Save Role"
                                                                            disabled={user._id === currentUser.id}
                                                                        >
                                                                            <MdCheckCircle />
                                                                        </button>
                                                                        <button
                                                                            style={{
                                                                                ...usersStyles.iconBtn,
                                                                                ...usersStyles.cancelBtn
                                                                            }}
                                                                            onClick={() => setEditingUserId(null)}
                                                                            title="Cancel"
                                                                        >
                                                                            <MdCancel />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            style={{
                                                                                ...usersStyles.iconBtn,
                                                                                ...usersStyles.editBtn,
                                                                                ...(user._id === currentUser.id ? usersStyles.buttonDisabled : {})
                                                                            }}
                                                                            onClick={() => handleEditClick(user)}
                                                                            title="Edit User"
                                                                            disabled={user._id === currentUser.id}
                                                                        >
                                                                            <MdEdit />
                                                                        </button>
                                                                        <button
                                                                            style={{
                                                                                ...usersStyles.iconBtn,
                                                                                ...(user.isActive ? usersStyles.deactivateBtn : usersStyles.activateBtn),
                                                                                ...(user._id === currentUser.id ? usersStyles.buttonDisabled : {})
                                                                            }}
                                                                            onClick={() => handleToggleActiveStatus(user._id, user.isActive)}
                                                                            title={user.isActive ? 'Deactivate User' : 'Activate User'}
                                                                            disabled={user._id === currentUser.id}
                                                                        >
                                                                            {user.isActive ? <MdCancel /> : <MdCheckCircle />}
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" style={usersStyles.noDataCell}>
                                                        <div style={usersStyles.noUsersMessage}>
                                                            <MdSearch style={usersStyles.noDataIcon} />
                                                            <h3>No users found</h3>
                                                            <p>Try adjusting your search criteria or filters</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Pagination */}
                        <div style={usersStyles.paginationContainer}>
                            <div style={usersStyles.paginationWrapper}>
                                <div style={usersStyles.paginationInfo}>
                                    <span style={usersStyles.paginationText}>
                                        Showing <strong>{((page - 1) * limit) + 1}</strong> to{' '}
                                        <strong>{Math.min(page * limit, totalUsersCount)}</strong> of{' '}
                                        <strong>{totalUsersCount}</strong> users
                                    </span>
                                </div>
                                <div style={usersStyles.paginationControls}>
                                    <button 
                                        style={{
                                            ...usersStyles.paginationButton,
                                            ...(page === 1 ? usersStyles.paginationButtonDisabled : {})
                                        }}
                                        onClick={() => setPage(prev => Math.max(prev - 1, 1))} 
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </button>
                                    <div style={usersStyles.pageNumbers}>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                                            return (
                                                <button
                                                    key={pageNum}
                                                    style={{
                                                        ...usersStyles.pageNumberButton,
                                                        ...(page === pageNum ? usersStyles.pageNumberActive : {})
                                                    }}
                                                    onClick={() => setPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button 
                                        style={{
                                            ...usersStyles.paginationButton,
                                            ...(page === totalPages ? usersStyles.paginationButtonDisabled : {})
                                        }}
                                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} 
                                        disabled={page === totalPages}
                                    >
                                        Next
                                    </button>
                                    <select 
                                        value={limit} 
                                        onChange={(e) => setLimit(parseInt(e.target.value))}
                                        style={usersStyles.limitSelect}
                                    >
                                        <option value="10">10 per page</option>
                                        <option value="20">20 per page</option>
                                        <option value="50">50 per page</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div style={usersStyles.modalOverlay} onClick={handleCloseAddModal}>
                    <div style={usersStyles.modalContainer} onClick={(e) => e.stopPropagation()}>
                        <div style={usersStyles.modalHeader}>
                            <h2 style={usersStyles.modalTitle}>Add New User</h2>
                            <button style={usersStyles.modalCloseButton} onClick={handleCloseAddModal}>
                                <MdClose />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddUserSubmit} style={usersStyles.modalForm}>
                            <div style={usersStyles.modalFormGrid}>
                                {/* Name Field */}
                                <div style={usersStyles.modalFormGroup}>
                                    <label style={usersStyles.modalLabel}>Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={addUserForm.name}
                                        onChange={handleAddUserInputChange}
                                        style={{
                                            ...usersStyles.modalInput,
                                            ...(addUserErrors.name ? usersStyles.modalInputError : {})
                                        }}
                                        placeholder="Enter full name"
                                        maxLength={100}
                                    />
                                    {addUserErrors.name && (
                                        <span style={usersStyles.modalErrorText}>{addUserErrors.name}</span>
                                    )}
                                </div>

                                {/* Email Field */}
                                <div style={usersStyles.modalFormGroup}>
                                    <label style={usersStyles.modalLabel}>Email Address *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={addUserForm.email}
                                        onChange={handleAddUserInputChange}
                                        style={{
                                            ...usersStyles.modalInput,
                                            ...(addUserErrors.email ? usersStyles.modalInputError : {})
                                        }}
                                        placeholder="Enter email address"
                                    />
                                    {addUserErrors.email && (
                                        <span style={usersStyles.modalErrorText}>{addUserErrors.email}</span>
                                    )}
                                </div>

                                {/* Password Field */}
                                <div style={usersStyles.modalFormGroup}>
                                    <label style={usersStyles.modalLabel}>Password *</label>
                                    <div style={usersStyles.modalPasswordWrapper}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={addUserForm.password}
                                            onChange={handleAddUserInputChange}
                                            style={{
                                                ...usersStyles.modalPasswordInput,
                                                ...(addUserErrors.password ? usersStyles.modalInputError : {})
                                            }}
                                            placeholder="Enter password (min 6 characters)"
                                        />
                                        <button
                                            type="button"
                                            style={usersStyles.modalPasswordToggle}
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                                        </button>
                                    </div>
                                    {addUserErrors.password && (
                                        <span style={usersStyles.modalErrorText}>{addUserErrors.password}</span>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div style={usersStyles.modalFormGroup}>
                                    <label style={usersStyles.modalLabel}>Confirm Password *</label>
                                    <div style={usersStyles.modalPasswordWrapper}>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={addUserForm.confirmPassword}
                                            onChange={handleAddUserInputChange}
                                            style={{
                                                ...usersStyles.modalPasswordInput,
                                                ...(addUserErrors.confirmPassword ? usersStyles.modalInputError : {})
                                            }}
                                            placeholder="Confirm password"
                                        />
                                        <button
                                            type="button"
                                            style={usersStyles.modalPasswordToggle}
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
                                        </button>
                                    </div>
                                    {addUserErrors.confirmPassword && (
                                        <span style={usersStyles.modalErrorText}>{addUserErrors.confirmPassword}</span>
                                    )}
                                </div>

                                {/* Role Field */}
                                <div style={usersStyles.modalFormGroup}>
                                    <label style={usersStyles.modalLabel}>Role *</label>
                                    <select
                                        name="role"
                                        value={addUserForm.role}
                                        onChange={handleAddUserInputChange}
                                        style={{
                                            ...usersStyles.modalSelect,
                                            ...(addUserErrors.role ? usersStyles.modalInputError : {})
                                        }}
                                    >
                                        {allowedRoles.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                    {addUserErrors.role && (
                                        <span style={usersStyles.modalErrorText}>{addUserErrors.role}</span>
                                    )}
                                </div>

                                {/* Employee ID Field */}
                                <div style={usersStyles.modalFormGroup}>
                                    <label style={usersStyles.modalLabel}>Employee ID</label>
                                    <input
                                        type="text"
                                        name="employeeId"
                                        value={addUserForm.employeeId}
                                        onChange={handleAddUserInputChange}
                                        style={{
                                            ...usersStyles.modalInput,
                                            ...(addUserErrors.employeeId ? usersStyles.modalInputError : {})
                                        }}
                                        placeholder="Enter employee ID (optional)"
                                        maxLength={20}
                                    />
                                    {addUserErrors.employeeId && (
                                        <span style={usersStyles.modalErrorText}>{addUserErrors.employeeId}</span>
                                    )}
                                </div>

                                {/* Department Field */}
                                <div style={usersStyles.modalFormGroupFull}>
                                    <label style={usersStyles.modalLabel}>Department</label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={addUserForm.department}
                                        onChange={handleAddUserInputChange}
                                        style={{
                                            ...usersStyles.modalInput,
                                            ...(addUserErrors.department ? usersStyles.modalInputError : {})
                                        }}
                                        placeholder="Enter department (optional)"
                                        maxLength={100}
                                    />
                                    {addUserErrors.department && (
                                        <span style={usersStyles.modalErrorText}>{addUserErrors.department}</span>
                                    )}
                                </div>
                            </div>

                            <div style={usersStyles.modalActions}>
                                <button 
                                    type="button" 
                                    style={usersStyles.modalCancelButton}
                                    onClick={handleCloseAddModal}
                                    disabled={isSubmittingUser}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    style={{
                                        ...usersStyles.modalSubmitButton,
                                        ...(isSubmittingUser ? usersStyles.modalSubmitButtonDisabled : {})
                                    }}
                                    disabled={isSubmittingUser}
                                >
                                    {isSubmittingUser ? (
                                        <>
                                            <div style={usersStyles.modalSubmitSpinner}></div>
                                            Adding User...
                                        </>
                                    ) : (
                                        <>
                                            <MdPersonAdd />
                                            Add User
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CSS Styles */}
            <style>{usersPageCSS}</style>
        </div>
    );
};

// Helper functions for styling
const getRoleStyle = (role) => {
    const roleMap = {
        'Admin': { background: '#ffe0b2', color: '#e65100' },
        'User': { background: '#e0f2f7', color: '#00838f' },
        'Lab Technician': { background: '#e8f5e9', color: '#2e7d32' },
        'Researcher': { background: '#f3e5f5', color: '#6a1b9a' },
        'Manufacturing Engineer': { background: '#e3f2fd', color: '#1565c0' }
    };
    return roleMap[role] || { background: '#f3f4f6', color: '#374151' };
};

const getStatusStyle = (isActive) => {
    return isActive 
        ? { background: '#e8f5e9', color: '#2e7d32' }
        : { background: '#ffebee', color: '#c62828' };
};

// Updated styles object with modal styles added
const usersStyles = {
    // ... (keep all existing styles from previous version)
    // Main Layout Container - Unique to users page
    appContainer: {
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        backgroundColor: '#f8fafc'
    },

    // Sticky Sidebar Container
    sidebarContainer: {
        position: 'sticky',
        top: 0,
        left: 0,
        height: '100vh',
        width: '260px',
        flexShrink: 0,
        zIndex: 1000,
        backgroundColor: 'white',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        borderRight: '1px solid #e2e8f0'
    },

    // Main Content Area
    mainContentArea: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
        overflow: 'hidden'
    },

    // Sticky Navbar Container  
    navbarContainer: {
        position: 'sticky',
        top: 0,
        width: '100%',
        height: '64px',
        flexShrink: 0,
        zIndex: 999,
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)'
    },

    // Scrollable Users Content
    usersContent: {
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        width: '100%',
        minHeight: 0,
        scrollBehavior: 'smooth',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9'
    },

    // Notification styles
    notification: {
        position: 'fixed',
        top: '80px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600',
        zIndex: 10000,
        maxWidth: '400px',
        wordWrap: 'break-word'
    },

    notificationSuccess: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        border: '1px solid #34d399'
    },

    notificationError: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        border: '1px solid #f87171'
    },

    // Main Content Container
    usersPageContent: {
        padding: '24px',
        background: '#f8fafc',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },

    // Enhanced Header
    usersHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        background: 'white',
        padding: '28px',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0'
    },

    headerLeft: {
        display: 'flex',
        alignItems: 'center'
    },

    titleContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    },

    titleIcon: {
        width: '56px',
        height: '56px',
        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.8rem',
        boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
    },

    pageTitle: {
        fontSize: '2rem',
        fontWeight: '700',
        color: '#1f2937',
        margin: '0 0 4px 0'
    },

    pageSubtitle: {
        fontSize: '1rem',
        color: '#6b7280',
        margin: 0,
        fontWeight: '500'
    },

    usersActions: {
        display: 'flex',
        gap: '12px'
    },

    primaryButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
    },

    refreshButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
    },

    buttonIcon: {
        fontSize: '1.2rem'
    },

    // Enhanced Filter Bar
    filterBar: {
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0',
        flexWrap: 'wrap'
    },

    searchInputGroup: {
        position: 'relative',
        flex: 1,
        maxWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        background: '#f8fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        padding: '12px 16px',
        transition: 'all 0.3s ease'
    },

    searchIcon: {
        color: '#9ca3af',
        fontSize: '1.2rem',
        marginRight: '12px',
        flexShrink: 0
    },

    searchInput: {
        border: 'none',
        outline: 'none',
        background: 'transparent',
        fontSize: '1rem',
        width: '100%',
        color: '#1f2937',
        fontWeight: '500'
    },

    filterSelect: {
        padding: '12px 16px',
        border: '2px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '0.95rem',
        background: 'white',
        cursor: 'pointer',
        fontWeight: '500',
        color: '#374151',
        minWidth: '150px'
    },

    // Enhanced Table Section
    userListContainer: {
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
    },

    tableWrapper: {
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
    },

    tableContainer: {
        width: '100%',
        overflowX: 'hidden',
        overflowY: 'hidden',
        backgroundColor: 'white',
        flexShrink: 0,
        borderBottom: '2px solid #e2e8f0'
    },

    table: {
        width: '100%',
        borderCollapse: 'collapse',
        background: 'white',
        tableLayout: 'fixed'
    },

    scrollableTableBody: {
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: 'white',
        flex: 1,
        minHeight: '300px',
        maxHeight: '500px',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9'
    },

    bodyTable: {
        width: '100%',
        borderCollapse: 'collapse',
        background: 'white',
        tableLayout: 'fixed'
    },

    tableHead: {
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        position: 'sticky',
        top: 0,
        zIndex: 10
    },

    // Updated column-specific header styles with proper widths
    tableHeaderName: {
        padding: '16px 12px',
        textAlign: 'left',
        fontSize: '0.8rem',
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderRight: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        width: '15%'
    },

    tableHeaderEmail: {
        padding: '16px 12px',
        textAlign: 'left',
        fontSize: '0.8rem',
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderRight: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        width: '20%'
    },

    tableHeaderRole: {
        padding: '16px 12px',
        textAlign: 'left',
        fontSize: '0.8rem',
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderRight: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        width: '12%'
    },

    tableHeaderEmployeeId: {
        padding: '16px 12px',
        textAlign: 'left',
        fontSize: '0.8rem',
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderRight: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        width: '10%'
    },

    tableHeaderDepartment: {
        padding: '16px 12px',
        textAlign: 'left',
        fontSize: '0.8rem',
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderRight: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        width: '12%'
    },

    tableHeaderStatus: {
        padding: '16px 12px',
        textAlign: 'left',
        fontSize: '0.8rem',
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderRight: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        width: '8%'
    },

    tableHeaderLastLogin: {
        padding: '16px 12px',
        textAlign: 'left',
        fontSize: '0.8rem',
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderRight: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        width: '13%'
    },

    tableHeaderActions: {
        padding: '16px 12px',
        textAlign: 'left',
        fontSize: '0.8rem',
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        backgroundColor: '#f8fafc',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        width: '10%'
    },

    tableRow: {
        borderBottom: '1px solid #f1f5f9',
        transition: 'background-color 0.2s ease'
    },

    // Updated column-specific cell styles with proper widths and overflow handling
    tableCellName: {
        padding: '12px',
        verticalAlign: 'middle',
        fontSize: '0.9rem',
        color: '#374151',
        borderBottom: '1px solid #f1f5f9',
        borderRight: '1px solid #f1f5f9',
        width: '15%',
        wordBreak: 'break-word',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },

    tableCellEmail: {
        padding: '8px',
        verticalAlign: 'middle',
        borderBottom: '1px solid #f1f5f9',
        borderRight: '1px solid #f1f5f9',
        width: '20%'
    },

    emailContainer: {
        width: '100%',
        maxWidth: '200px',
        overflow: 'hidden'
    },

    emailText: {
        display: 'block',
        fontSize: '0.85rem',
        color: '#374151',
        wordBreak: 'break-all',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        cursor: 'help'
    },

    tableCellRole: {
        padding: '12px',
        verticalAlign: 'middle',
        fontSize: '0.9rem',
        color: '#374151',
        borderBottom: '1px solid #f1f5f9',
        borderRight: '1px solid #f1f5f9',
        width: '12%'
    },

    tableCellEmployeeId: {
        padding: '12px',
        verticalAlign: 'middle',
        fontSize: '0.9rem',
        color: '#374151',
        borderBottom: '1px solid #f1f5f9',
        borderRight: '1px solid #f1f5f9',
        width: '10%',
        wordBreak: 'break-word'
    },

    tableCellDepartment: {
        padding: '12px',
        verticalAlign: 'middle',
        fontSize: '0.9rem',
        color: '#374151',
        borderBottom: '1px solid #f1f5f9',
        borderRight: '1px solid #f1f5f9',
        width: '12%',
        wordBreak: 'break-word'
    },

    tableCellStatus: {
        padding: '12px',
        verticalAlign: 'middle',
        fontSize: '0.9rem',
        color: '#374151',
        borderBottom: '1px solid #f1f5f9',
        borderRight: '1px solid #f1f5f9',
        width: '8%'
    },

    tableCellLastLogin: {
        padding: '12px',
        verticalAlign: 'middle',
        fontSize: '0.85rem',
        color: '#374151',
        borderBottom: '1px solid #f1f5f9',
        borderRight: '1px solid #f1f5f9',
        width: '13%',
        wordBreak: 'break-word'
    },

    tableCellActions: {
        padding: '12px',
        verticalAlign: 'middle',
        fontSize: '0.9rem',
        color: '#374151',
        borderBottom: '1px solid #f1f5f9',
        width: '10%'
    },

    // Role and Status Badges
    roleBadge: {
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.8rem',
        fontWeight: '600',
        textTransform: 'capitalize',
        display: 'inline-block'
    },

    statusBadge: {
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.8rem',
        fontWeight: '600',
        textTransform: 'capitalize',
        display: 'inline-block'
    },

    roleSelectInput: {
        padding: '6px 10px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '0.85rem',
        color: '#374151',
        background: '#f8fafc',
        width: '100%',
        maxWidth: '180px',
        cursor: 'pointer'
    },

    // Enhanced Action Buttons
    actionButtons: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        justifyContent: 'flex-start'
    },

    iconBtn: {
        width: '32px',
        height: '32px',
        border: 'none',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '1rem',
        flexShrink: 0
    },

    editBtn: {
        background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
        color: '#2563eb',
        border: '1px solid #93c5fd'
    },

    saveBtn: {
        background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
        color: '#16a34a',
        border: '1px solid #86efac'
    },

    cancelBtn: {
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        color: '#d97706',
        border: '1px solid #fbbf24'
    },

    deactivateBtn: {
        background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
        color: '#dc2626',
        border: '1px solid #f87171'
    },

    activateBtn: {
        background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
        color: '#16a34a',
        border: '1px solid #86efac'
    },

    buttonDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed'
    },

    // Loading and Error States
    loadingState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        textAlign: 'center',
        minHeight: '400px'
    },

    loadingSpinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #f3f4f6',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'usersSpinAnimation 1s linear infinite',
        marginBottom: '16px'
    },

    errorState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        textAlign: 'center',
        minHeight: '400px'
    },

    errorMessage: {
        color: '#dc2626',
        fontSize: '1.1rem',
        marginBottom: '16px',
        fontWeight: '600'
    },

    retryButton: {
        padding: '12px 24px',
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '1rem',
        transition: 'all 0.2s ease'
    },

    // Access Denied State
    accessDeniedState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        textAlign: 'center',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        margin: '24px',
        minHeight: '400px'
    },

    noDataIllustration: {
        position: 'relative',
        marginBottom: '24px'
    },

    noDataIcon: {
        fontSize: '4rem',
        color: '#d1d5db',
        zIndex: 1,
        position: 'relative'
    },

    accessDeniedBadge: {
        position: 'absolute',
        bottom: '-8px',
        right: '-8px',
        width: '36px',
        height: '36px',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.2rem',
        border: '3px solid white',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
        animation: 'usersPulseDenied 2s infinite'
    },

    noDataContent: {
        color: '#6b7280'
    },

    // No Data State
    noDataCell: {
        textAlign: 'center',
        padding: '60px 20px'
    },

    noUsersMessage: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: '#6b7280'
    },

    // Enhanced Pagination
    paginationContainer: {
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '2px solid #e2e8f0'
    },

    paginationWrapper: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '16px 20px',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
    },

    paginationInfo: {
        display: 'flex',
        alignItems: 'center'
    },

    paginationText: {
        color: '#374151',
        fontSize: '0.9rem',
        fontWeight: '500'
    },

    paginationControls: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
    },

    paginationButton: {
        padding: '8px 16px',
        border: '1px solid #d1d5db',
        background: 'white',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        color: '#374151'
    },

    paginationButtonDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
        background: '#f3f4f6'
    },

    pageNumbers: {
        display: 'flex',
        gap: '4px'
    },

    pageNumberButton: {
        width: '36px',
        height: '36px',
        border: '1px solid #d1d5db',
        background: 'white',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        color: '#374151',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },

    pageNumberActive: {
        background: '#3b82f6',
        color: 'white',
        borderColor: '#3b82f6',
        fontWeight: '700'
    },

    limitSelect: {
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '0.9rem',
        cursor: 'pointer',
        background: 'white',
        color: '#374151',
        fontWeight: '500'
    },

    // ADD USER MODAL STYLES - Unique to users page
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
        backdropFilter: 'blur(4px)'
    },

    modalContainer: {
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'hidden',
        position: 'relative'
    },

    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 24px 0 24px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '20px',
        marginBottom: '24px'
    },

    modalTitle: {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#1f2937',
        margin: 0
    },

    modalCloseButton: {
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        color: '#6b7280',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },

    modalForm: {
        padding: '0 24px 24px 24px',
        maxHeight: 'calc(90vh - 140px)',
        overflowY: 'auto'
    },

    modalFormGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '24px'
    },

    modalFormGroup: {
        display: 'flex',
        flexDirection: 'column'
    },

    modalFormGroupFull: {
        display: 'flex',
        flexDirection: 'column',
        gridColumn: '1 / -1'
    },

    modalLabel: {
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '8px'
    },

    modalInput: {
        padding: '12px 16px',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '1rem',
        transition: 'all 0.2s ease',
        background: '#f8fafc'
    },

    modalInputError: {
        borderColor: '#ef4444',
        background: '#fef2f2'
    },

    modalSelect: {
        padding: '12px 16px',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '1rem',
        transition: 'all 0.2s ease',
        background: '#f8fafc',
        cursor: 'pointer'
    },

    modalPasswordWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },

    modalPasswordInput: {
        padding: '12px 50px 12px 16px',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '1rem',
        transition: 'all 0.2s ease',
        background: '#f8fafc',
        width: '100%'
    },

    modalPasswordToggle: {
        position: 'absolute',
        right: '12px',
        background: 'none',
        border: 'none',
        color: '#6b7280',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '4px',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        fontSize: '1.2rem'
    },

    modalErrorText: {
        color: '#dc2626',
        fontSize: '0.8rem',
        marginTop: '4px',
        fontWeight: '500'
    },

    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        paddingTop: '20px',
        borderTop: '1px solid #e2e8f0'
    },

    modalCancelButton: {
        padding: '12px 24px',
        background: '#f1f5f9',
        color: '#374151',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },

    modalSubmitButton: {
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
    },

    modalSubmitButtonDisabled: {
        opacity: 0.7,
        cursor: 'not-allowed'
    },

    modalSubmitSpinner: {
        width: '16px',
        height: '16px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderTop: '2px solid white',
        borderRadius: '50%',
        animation: 'usersSpinAnimation 1s linear infinite'
    }
};

// CSS Animations as a string - unique to users page with modal support
const usersPageCSS = `
  /* Unique animations for users page */
  @keyframes usersSpinAnimation {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes usersPulseDenied {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }
  
  /* Users page specific scrollbar styles */
  .users-page-wrapper .usersContent::-webkit-scrollbar {
    width: 12px;
  }
  
  .users-page-wrapper .usersContent::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 6px;
  }
  
  .users-page-wrapper .usersContent::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 6px;
    border: 2px solid #f1f5f9;
  }
  
  .users-page-wrapper .usersContent::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #2563eb, #1e40af);
  }
  
  /* Table scrollbar styles */
  .users-page-wrapper .scrollableTableBody::-webkit-scrollbar {
    width: 8px;
  }
  
  .users-page-wrapper .scrollableTableBody::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  .users-page-wrapper .scrollableTableBody::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 4px;
    border: 1px solid #f1f5f9;
  }
  
  .users-page-wrapper .scrollableTableBody::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #2563eb, #1e40af);
  }
  
  /* Modal scrollbar styles */
  .users-page-wrapper .modalForm::-webkit-scrollbar {
    width: 6px;
  }
  
  .users-page-wrapper .modalForm::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  .users-page-wrapper .modalForm::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 3px;
  }
  
  /* Enhanced email handling for users page only */
  .users-page-wrapper .emailContainer:hover .emailText {
    white-space: normal;
    word-break: break-all;
    overflow: visible;
    text-overflow: unset;
    background: #f8fafc;
    padding: 4px 8px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    position: relative;
    z-index: 100;
    max-width: none;
    width: max-content;
    max-width: 300px;
  }
  
  /* Modal focus styles for users page */
  .users-page-wrapper .modalInput:focus,
  .users-page-wrapper .modalSelect:focus,
  .users-page-wrapper .modalPasswordInput:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: white;
  }
  
  /* Hover effects for users page only */
  .users-page-wrapper button:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  .users-page-wrapper .modalCloseButton:hover {
    background: #f3f4f6;
    color: #374151;
  }
  
  .users-page-wrapper .modalPasswordToggle:hover {
    background: #f3f4f6;
    color: #374151;
  }
  
  .users-page-wrapper .modalCancelButton:hover {
    background: #e2e8f0;
    transform: translateY(-1px);
  }
  
  .users-page-wrapper .modalSubmitButton:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb, #1e40af);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
  }
  
  .users-page-wrapper .tableRow:hover {
    background-color: #f0f8ff;
  }
  
  .users-page-wrapper .searchInputGroup:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12), 0 4px 20px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
  
  /* Enhanced button hover effects */
  .users-page-wrapper .editBtn:hover:not(:disabled) {
    background: linear-gradient(135deg, #bfdbfe, #93c5fd);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }
  
  .users-page-wrapper .saveBtn:hover:not(:disabled) {
    background: linear-gradient(135deg, #bbf7d0, #86efac);
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
  }
  
  .users-page-wrapper .cancelBtn:hover:not(:disabled) {
    background: linear-gradient(135deg, #fde68a, #fbbf24);
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
  }
  
  .users-page-wrapper .deactivateBtn:hover:not(:disabled) {
    background: linear-gradient(135deg, #fecaca, #f87171);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }
  
  .users-page-wrapper .activateBtn:hover:not(:disabled) {
    background: linear-gradient(135deg, #bbf7d0, #86efac);
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
  }
  
  /* Email tooltip enhancement for users page only */
  .users-page-wrapper .emailText {
    position: relative;
  }
  
  .users-page-wrapper .emailText:hover::after {
    content: attr(title);
    position: absolute;
    top: -30px;
    left: 0;
    background: #1f2937;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    white-space: nowrap;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    max-width: 250px;
    word-break: break-all;
    white-space: normal;
  }
  
  /* Responsive styles for users page only */
  @media (max-width: 768px) {
    .users-page-wrapper .usersContent {
      padding: 16px;
    }
    
    .users-page-wrapper .sidebarContainer {
      width: 240px;
    }
    
    .users-page-wrapper .usersHeader {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    
    .users-page-wrapper .usersActions {
      width: 100%;
      justify-content: center;
    }
    
    .users-page-wrapper .filterBar {
      flex-direction: column;
      align-items: stretch;
    }
    
    .users-page-wrapper .searchInputGroup,
    .users-page-wrapper .filterSelect {
      width: 100%;
      max-width: unset;
    }
    
    .users-page-wrapper .emailContainer {
      max-width: 120px;
    }
    
    .users-page-wrapper .emailText {
      font-size: 0.8rem;
    }
    
    .users-page-wrapper .modalFormGrid {
      grid-template-columns: 1fr;
    }
    
    .users-page-wrapper .modalContainer {
      margin: 10px;
      max-width: calc(100vw - 20px);
    }
  }

  @media (max-width: 480px) {
    .users-page-wrapper .usersContent {
      padding: 12px;
    }
    
    .users-page-wrapper .sidebarContainer {
      width: 220px;
    }
    
    .users-page-wrapper .actionButtons {
      flex-direction: column;
      gap: 4px;
    }
    
    .users-page-wrapper .iconBtn {
      width: 28px;
      height: 28px;
      font-size: 0.9rem;
    }
    
    .users-page-wrapper .emailContainer {
      max-width: 100px;
    }
    
    .users-page-wrapper .emailText {
      font-size: 0.75rem;
    }
    
    .users-page-wrapper .modalActions {
      flex-direction: column;
      gap: 8px;
    }
    
    .users-page-wrapper .modalCancelButton,
    .users-page-wrapper .modalSubmitButton {
      width: 100%;
      justify-content: center;
    }
  }
`;

export default UsersPage;
