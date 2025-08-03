// src/pages/InventoryPage.js
import React, { useState, useEffect } from 'react';
import { 
    MdSearch, 
    MdAddCircleOutline, 
    MdDownload, 
    MdEdit, 
    MdInput, 
    MdOutput, 
    MdDelete,
    MdFilterList,
    MdClear,
    MdExpandMore,
    MdExpandLess
} from 'react-icons/md';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AddComponentModel from '../components/AddComponentModel';
import EditComponentModel from '../components/EditComponentModel';
import InwardStockModal from '../components/InwardStockModal';
import OutwardStockModal from '../components/OutwardStockModal';
import api from '../utils/api';

const InventoryPage = () => {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('');
    const [minQuantity, setMinQuantity] = useState('');
    const [maxQuantity, setMaxQuantity] = useState('');
    const [lowStockFilter, setLowStockFilter] = useState(false);
    const [oldStockFilter, setOldStockFilter] = useState(false);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalComponentsCount, setTotalComponentsCount] = useState(0);

    // Modal visibility states
    const [showAddComponentModal, setShowAddComponentModal] = useState(false);
    const [showEditComponentModal, setShowEditComponentModal] = useState(false);
    const [showInwardStockModal, setShowInwardStockModal] = useState(false);
    const [showOutwardStockModal, setShowOutwardStockModal] = useState(false);

    const [selectedComponent, setSelectedComponent] = useState(null);
    const [predefinedCategories, setPredefinedCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [notification, setNotification] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const showNotification = (message, type) => {
        setNotification({ message, type });
        const timer = setTimeout(() => {
            setNotification(null);
        }, 4000);
        return () => clearTimeout(timer);
    };

    // Fetch components based on filters and pagination
    const fetchComponents = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                limit,
                search: searchTerm,
                category: categoryFilter,
                status: statusFilter,
                location: locationFilter,
                minQuantity: minQuantity,
                maxQuantity: maxQuantity,
                lowStock: lowStockFilter,
                oldStock: oldStockFilter,
                sortBy: sortBy,
                sortOrder: sortOrder,
            };

            // Clean up empty parameters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined || 
                    (typeof params[key] === 'boolean' && params[key] === false && key !== 'lowStock' && key !== 'oldStock')) {
                    delete params[key];
                }
            });

            const response = await api.get('/components', { params });
            setComponents(response.data.data);
            setTotalPages(response.data.pagination.total);
            setTotalComponentsCount(response.data.total);
        } catch (err) {
            console.error('Failed to fetch components:', err);
            setError('Failed to load inventory data. Please try again.');
            showNotification('Failed to load inventory data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch predefined categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoadingCategories(true);
                const response = await api.get('/components/predefined-categories');
                setPredefinedCategories(response.data.data);
            } catch (err) {
                console.error('Error fetching predefined categories:', err);
                showNotification('Failed to load categories for filter.', 'error');
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    // Effect to re-fetch components when filters or pagination change
    useEffect(() => {
        fetchComponents();
    }, [page, limit, searchTerm, categoryFilter, statusFilter, locationFilter, minQuantity, maxQuantity, lowStockFilter, oldStockFilter, sortBy, sortOrder]);

    // Enhanced Export Function with Better CSV Formatting
    const handleExportComponents = async () => {
        setIsExporting(true);
        try {
            showNotification('Preparing export... Please wait.', 'info');

            let exportData = [];

            // Try the existing export endpoint first
            try {
                const response = await api.get('/components/export', { 
                    timeout: 30000
                });
                
                // Check if response is JSON (which seems to be the case)
                if (response.data && response.data.data) {
                    exportData = response.data.data;
                } else if (Array.isArray(response.data)) {
                    exportData = response.data;
                } else {
                    throw new Error('Invalid export data format');
                }
            } catch (apiError) {
                console.warn('Export endpoint returned JSON or failed, fetching components:', apiError);
                
                // Fallback: Fetch all components manually
                const allComponentsResponse = await api.get('/components', { 
                    params: { 
                        limit: 10000,
                        ...(searchTerm && { search: searchTerm }),
                        ...(categoryFilter !== 'all' && { category: categoryFilter }),
                        ...(statusFilter !== 'all' && { status: statusFilter }),
                        ...(locationFilter && { location: locationFilter }),
                        ...(minQuantity && { minQuantity }),
                        ...(maxQuantity && { maxQuantity }),
                        ...(lowStockFilter && { lowStock: true }),
                        ...(oldStockFilter && { oldStock: true })
                    }
                });

                exportData = allComponentsResponse.data.data;
            }

            if (!exportData || exportData.length === 0) {
                throw new Error('No data to export');
            }

            // Convert to proper CSV format
            const csvContent = convertToProperCSV(exportData);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Generate filename with current date and time
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
            const filename = `inventory-export-${dateStr}-${timeStr}.csv`;
            link.setAttribute('download', filename);
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            link.remove();
            window.URL.revokeObjectURL(url);
            
            showNotification(`Inventory exported successfully as ${filename}!`, 'success');
            
        } catch (err) {
            console.error('Export components error:', err);
            let errorMessage = 'Failed to export components. ';
            
            if (err.message === 'No data to export') {
                errorMessage = 'No components found to export with current filters.';
            } else if (err.code === 'ECONNABORTED') {
                errorMessage = 'Export timed out. Please try again or contact support.';
            } else if (err.response?.status === 404) {
                errorMessage = 'Export feature not available. Please contact system administrator.';
            } else if (err.response?.status === 500) {
                errorMessage = 'Server error during export. Please try again later.';
            } else {
                errorMessage += err.message || 'Please try again.';
            }
            
            showNotification(errorMessage, 'error');
        } finally {
            setIsExporting(false);
        }
    };

    // Enhanced CSV conversion with better formatting and readability
    const convertToProperCSV = (data) => {
        if (!data || data.length === 0) {
            throw new Error('No data to convert to CSV');
        }

        const csvRows = [];
        
        // Define headers based on the actual data structure from your JSON
        const headers = [
            'Component Name',
            'Part Number',
            'Manufacturer',
            'Category',
            'Description',
            'Quantity',
            'Unit Price (₹)',
            'Total Value (₹)',
            'Location',
            'Critical Low Threshold',
            'Status',
            'Tags',
            'Datasheet Link',
            'Added By',
            'Last Modified By',
            'Created At',
            'Updated At'
        ];

        // Add header row
        csvRows.push(headers.map(header => `"${header}"`).join(','));

        // Add data rows
        data.forEach(component => {
            const row = [
                component['Component Name'] || component.componentName || 'N/A',
                component['Part Number'] || component.partNumber || 'N/A',
                component['Manufacturer'] || component.manufacturer || 'N/A',
                component['Category'] || component.category || 'Uncategorized',
                component['Description'] || component.description || 'No description',
                component['Quantity'] || component.quantity || 0,
                component['Unit Price'] || component.unitPrice || 0,
                component['Total Value'] || component.totalValue || 0,
                component['Location'] || component.location || 'Not specified',
                component['Critical Low Threshold'] || component.criticalLowThreshold || component.minStockLevel || 'Not set',
                component['Status'] || component.status || 'Unknown',
                component['Tags'] || component.tags || '',
                component['Datasheet Link'] || component.datasheetLink || '',
                component['Added By'] || component.addedBy || 'Unknown',
                component['Last Modified By'] || component.lastModifiedBy || 'Unknown',
                component['Created At'] || component.createdAt ? formatDate(component['Created At'] || component.createdAt) : 'N/A',
                component['Updated At'] || component.updatedAt ? formatDate(component['Updated At'] || component.updatedAt) : 'N/A'
            ];
            
            // Properly escape each field
            const escapedRow = row.map(field => escapeCSV(field));
            csvRows.push(escapedRow.join(','));
        });

        return csvRows.join('\n');
    };

    // Enhanced CSV conversion with proper formatting
    const convertToEnhancedCSV = (data) => {
        if (!data || data.length === 0) {
            throw new Error('No data to convert to CSV');
        }

        const csvRows = [];
        
        // Define headers - simple and clean
        const headers = [
            'Component Name',
            'Part Number', 
            'Category',
            'Current Quantity',
            'Unit Price (₹)',
            'Total Value (₹)',
            'Location',
            'Status',
            'Stock Level',
            'Supplier',
            'Description',
            'Min Stock Level',
            'Date Added',
            'Last Updated',
            'Notes'
        ];

        // Add header row
        csvRows.push(headers.map(header => `"${header}"`).join(','));

        // Add data rows
        data.forEach(component => {
            const totalValue = (component.quantity || 0) * (component.unitPrice || 0);
            const stockLevel = component.isCriticallyLow ? 'LOW STOCK' : 
                              component.isOldStock ? 'OLD STOCK' : 'NORMAL';
            
            const row = [
                component.componentName || 'N/A',
                component.partNumber || 'N/A',
                component.category || 'Uncategorized',
                component.quantity || 0,
                (component.unitPrice || 0).toFixed(2),
                totalValue.toFixed(2),
                component.location || 'Not specified',
                component.status || 'Unknown',
                stockLevel,
                component.supplier || 'Not specified',
                component.description || 'No description',
                component.minStockLevel || 'Not set',
                component.createdAt ? formatDate(component.createdAt) : 'N/A',
                component.updatedAt ? formatDate(component.updatedAt) : 'N/A',
                generateNotes(component)
            ];
            
            // Properly escape each field
            const escapedRow = row.map(field => escapeCSV(field));
            csvRows.push(escapedRow.join(','));
        });

        return csvRows.join('\n');
    };

    // Helper functions for CSV
    const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        
        const stringValue = String(value);
        
        // If the value contains comma, quote, or newline, wrap it in quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
            // Escape existing quotes by doubling them, then wrap in quotes
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
    };

    // Helper function to format dates
    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString; // Return original if parsing fails
        }
    };

    const generateNotes = (component) => {
        const notes = [];
        if (component.isCriticallyLow) notes.push('LOW STOCK ALERT');
        if (component.isOldStock) notes.push('OLD STOCK');
        if (component.status === 'Discontinued') notes.push('DISCONTINUED ITEM');
        if ((component.quantity || 0) === 0) notes.push('OUT OF STOCK');
        return notes.join(' | ') || 'No special notes';
    };

    // Clear all filters
    const clearAllFilters = () => {
        setSearchTerm('');
        setCategoryFilter('all');
        setStatusFilter('all');
        setLocationFilter('');
        setMinQuantity('');
        setMaxQuantity('');
        setLowStockFilter(false);
        setOldStockFilter(false);
        setPage(1);
        showNotification('All filters cleared', 'info');
    };

    // Event handlers
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const handleCategoryChange = (e) => {
        setCategoryFilter(e.target.value);
        setPage(1);
    };

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
        setPage(1);
    };

    const handleLocationChange = (e) => {
        setLocationFilter(e.target.value);
        setPage(1);
    };

    const handleMinQuantityChange = (e) => {
        setMinQuantity(e.target.value);
        setPage(1);
    };

    const handleMaxQuantityChange = (e) => {
        setMaxQuantity(e.target.value);
        setPage(1);
    };

    const handleLowStockFilterChange = (e) => {
        setLowStockFilter(e.target.checked);
        setPage(1);
    };

    const handleOldStockFilterChange = (e) => {
        setOldStockFilter(e.target.checked);
        setPage(1);
    };

    const handleSortChange = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
        setPage(1);
    };

    const handleAddComponent = () => {
        setShowAddComponentModal(true);
    };

    const handleEditComponent = (component) => {
        setSelectedComponent(component);
        setShowEditComponentModal(true);
    };

    const handleInwardStock = (component) => {
        setSelectedComponent(component);
        setShowInwardStockModal(true);
    };

    const handleOutwardStock = (component) => {
        setSelectedComponent(component);
        setShowOutwardStockModal(true);
    };

    const handleDeleteComponent = async (componentId) => {
        if (window.confirm('Are you sure you want to delete or discontinue this component?')) {
            try {
                const response = await api.delete(`/components/${componentId}`);
                showNotification(response.data.message, 'success');
                fetchComponents();
            } catch (err) {
                console.error('Delete component error:', err);
                showNotification(err.response?.data?.message || 'Failed to delete/discontinue component.', 'error');
            }
        }
    };

    const handleModalCloseAndRefresh = () => {
        setShowAddComponentModal(false);
        setShowEditComponentModal(false);
        setShowInwardStockModal(false);
        setShowOutwardStockModal(false);
        setSelectedComponent(null);
        fetchComponents();
    };

    const statuses = ['all', 'Active', 'Discontinued', 'Obsolete'];

    // Count active filters
    const activeFiltersCount = [
        searchTerm,
        categoryFilter !== 'all' ? categoryFilter : null,
        statusFilter !== 'all' ? statusFilter : null,
        locationFilter,
        minQuantity,
        maxQuantity,
        lowStockFilter,
        oldStockFilter
    ].filter(Boolean).length;

    return (
        <div className="inventory-page-wrapper" style={inventoryStyles.appContainer}>
            
            
            <div style={inventoryStyles.mainContentArea}>
                {notification && (
                    <div className={`app-notification ${notification.type}`} style={inventoryStyles.notification}>
                        {notification.message}
                    </div>
                )}
                <div style={inventoryStyles.inventoryContent}>
                    {/* Enhanced Header */}
                    <div style={inventoryStyles.pageHeader}>
                        <div style={inventoryStyles.headerLeft}>
                            <div style={inventoryStyles.titleContainer}>
                                <div style={inventoryStyles.titleIcon}>
                                    <MdSearch />
                                </div>
                                <div>
                                    <h1 style={inventoryStyles.pageTitle}>Inventory Management</h1>
                                    <p style={inventoryStyles.pageSubtitle}>
                                        {totalComponentsCount} components • {components.filter(c => c.isCriticallyLow).length} low stock items
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div style={inventoryStyles.headerActions}>
                            <button 
                                style={{...inventoryStyles.primaryButton, ...(isExporting ? inventoryStyles.buttonDisabled : {})}}
                                onClick={handleExportComponents}
                                disabled={isExporting || components.length === 0}
                            >
                                {isExporting ? (
                                    <>
                                        <div style={inventoryStyles.spinner}></div>
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <MdDownload style={inventoryStyles.buttonIcon} />
                                        Export CSV
                                    </>
                                )}
                            </button>
                            <button style={inventoryStyles.addButton} onClick={handleAddComponent}>
                                <MdAddCircleOutline style={inventoryStyles.buttonIcon} />
                                Add Component
                            </button>
                        </div>
                    </div>

                    {/* Search and Filter Bar */}
                    <div style={inventoryStyles.searchAndFilterSection}>
                        {/* Search Bar */}
                        <div style={inventoryStyles.searchContainer}>
                            <MdSearch style={inventoryStyles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search components by name, part number, or description..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                style={inventoryStyles.searchInput}
                            />
                            {searchTerm && (
                                <button 
                                    style={inventoryStyles.clearSearchButton}
                                    onClick={() => setSearchTerm('')}
                                >
                                    <MdClear />
                                </button>
                            )}
                        </div>

                        {/* Filter Toggle Button */}
                        <div style={inventoryStyles.filterButtonContainer}>
                            <button 
                                style={inventoryStyles.filterToggleButton}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <MdFilterList style={inventoryStyles.filterIcon} />
                                <span>Filters</span>
                                {activeFiltersCount > 0 && (
                                    <span style={inventoryStyles.filterCount}>{activeFiltersCount}</span>
                                )}
                                {showFilters ? <MdExpandLess /> : <MdExpandMore />}
                            </button>
                            
                            {activeFiltersCount > 0 && (
                                <button style={inventoryStyles.clearFiltersButton} onClick={clearAllFilters}>
                                    <MdClear style={inventoryStyles.clearIcon} />
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Collapsible Filter Section */}
                    {showFilters && (
                        <div style={inventoryStyles.filterSection}>
                            <div style={inventoryStyles.filterGrid}>
                                <div style={inventoryStyles.filterGroup}>
                                    <label style={inventoryStyles.filterLabel}>Category</label>
                                    <select 
                                        value={categoryFilter} 
                                        onChange={handleCategoryChange}
                                        style={inventoryStyles.filterSelect}
                                    >
                                        <option value="all">All Categories</option>
                                        {loadingCategories ? (
                                            <option disabled>Loading categories...</option>
                                        ) : (
                                            predefinedCategories.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                <div style={inventoryStyles.filterGroup}>
                                    <label style={inventoryStyles.filterLabel}>Status</label>
                                    <select 
                                        value={statusFilter} 
                                        onChange={handleStatusChange}
                                        style={inventoryStyles.filterSelect}
                                    >
                                        {statuses.map((status) => (
                                            <option key={status} value={status}>
                                                {status === 'all' ? 'All Statuses' : status}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={inventoryStyles.filterGroup}>
                                    <label style={inventoryStyles.filterLabel}>Location</label>
                                    <input
                                        type="text"
                                        placeholder="Location"
                                        value={locationFilter}
                                        onChange={handleLocationChange}
                                        style={inventoryStyles.filterInput}
                                    />
                                </div>

                                <div style={inventoryStyles.quantityGroup}>
                                    <label style={inventoryStyles.filterLabel}>Quantity Range</label>
                                    <div style={inventoryStyles.quantityInputs}>
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={minQuantity}
                                            onChange={handleMinQuantityChange}
                                            style={inventoryStyles.quantityInput}
                                        />
                                        <span style={inventoryStyles.quantitySeparator}>to</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={maxQuantity}
                                            onChange={handleMaxQuantityChange}
                                            style={inventoryStyles.quantityInput}
                                        />
                                    </div>
                                </div>

                                <div style={inventoryStyles.checkboxGroup}>
                                    <label style={inventoryStyles.filterLabel}>Stock Alerts</label>
                                    <div style={inventoryStyles.checkboxContainer}>
                                        <label style={inventoryStyles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={lowStockFilter}
                                                onChange={handleLowStockFilterChange}
                                                style={inventoryStyles.checkbox}
                                            />
                                            <span>Low Stock</span>
                                        </label>
                                        <label style={inventoryStyles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={oldStockFilter}
                                                onChange={handleOldStockFilterChange}
                                                style={inventoryStyles.checkbox}
                                            />
                                            <span>Old Stock</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fixed Components Table */}
                    <div style={inventoryStyles.tableSection}>
                        {loading ? (
                            <div style={inventoryStyles.loadingState}>
                                <div style={inventoryStyles.loadingSpinner}></div>
                                <p>Loading components...</p>
                            </div>
                        ) : error ? (
                            <div style={inventoryStyles.errorState}>
                                <div style={inventoryStyles.errorMessage}>{error}</div>
                                <button style={inventoryStyles.retryButton} onClick={fetchComponents}>
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <>
                                <div style={inventoryStyles.tableWrapper}>
                                    <div style={inventoryStyles.tableContainer}>
                                        <table style={inventoryStyles.table}>
                                            <thead style={inventoryStyles.tableHead}>
                                                <tr>
                                                    <th 
                                                        style={{...inventoryStyles.tableHeader, width: '20%'}}
                                                        onClick={() => handleSortChange('componentName')}
                                                    >
                                                        <div style={inventoryStyles.headerContent}>
                                                            <span>Component Name</span>
                                                            {sortBy === 'componentName' && (
                                                                <span style={inventoryStyles.sortIndicator}>
                                                                    {sortOrder === 'asc' ? '▲' : '▼'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th 
                                                        style={{...inventoryStyles.tableHeader, width: '12%'}}
                                                        onClick={() => handleSortChange('partNumber')}
                                                    >
                                                        <div style={inventoryStyles.headerContent}>
                                                            <span>Part Number</span>
                                                            {sortBy === 'partNumber' && (
                                                                <span style={inventoryStyles.sortIndicator}>
                                                                    {sortOrder === 'asc' ? '▲' : '▼'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th 
                                                        style={{...inventoryStyles.tableHeader, width: '12%'}}
                                                        onClick={() => handleSortChange('category')}
                                                    >
                                                        <div style={inventoryStyles.headerContent}>
                                                            <span>Category</span>
                                                            {sortBy === 'category' && (
                                                                <span style={inventoryStyles.sortIndicator}>
                                                                    {sortOrder === 'asc' ? '▲' : '▼'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th 
                                                        style={{...inventoryStyles.tableHeader, width: '8%'}}
                                                        onClick={() => handleSortChange('quantity')}
                                                    >
                                                        <div style={inventoryStyles.headerContent}>
                                                            <span>Quantity</span>
                                                            {sortBy === 'quantity' && (
                                                                <span style={inventoryStyles.sortIndicator}>
                                                                    {sortOrder === 'asc' ? '▲' : '▼'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th 
                                                        style={{...inventoryStyles.tableHeader, width: '10%'}}
                                                        onClick={() => handleSortChange('unitPrice')}
                                                    >
                                                        <div style={inventoryStyles.headerContent}>
                                                            <span>Unit Price</span>
                                                            {sortBy === 'unitPrice' && (
                                                                <span style={inventoryStyles.sortIndicator}>
                                                                    {sortOrder === 'asc' ? '▲' : '▼'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th 
                                                        style={{...inventoryStyles.tableHeader, width: '12%'}}
                                                        onClick={() => handleSortChange('location')}
                                                    >
                                                        <div style={inventoryStyles.headerContent}>
                                                            <span>Location</span>
                                                            {sortBy === 'location' && (
                                                                <span style={inventoryStyles.sortIndicator}>
                                                                    {sortOrder === 'asc' ? '▲' : '▼'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th 
                                                        style={{...inventoryStyles.tableHeader, width: '10%'}}
                                                        onClick={() => handleSortChange('status')}
                                                    >
                                                        <div style={inventoryStyles.headerContent}>
                                                            <span>Status</span>
                                                            {sortBy === 'status' && (
                                                                <span style={inventoryStyles.sortIndicator}>
                                                                    {sortOrder === 'asc' ? '▲' : '▼'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th style={{...inventoryStyles.tableHeader, width: '16%'}}>Actions</th>
                                                </tr>
                                            </thead>
                                        </table>
                                    </div>
                                    
                                    {/* Scrollable Table Body */}
                                    <div style={inventoryStyles.scrollableTableBody}>
                                        <table style={inventoryStyles.bodyTable}>
                                            <tbody>
                                                {components.length > 0 ? (
                                                    components.map((component) => (
                                                        <tr 
                                                            key={component._id} 
                                                            style={{
                                                                ...inventoryStyles.tableRow,
                                                                ...(component.isCriticallyLow ? inventoryStyles.lowStockRow : {})
                                                            }}
                                                        >
                                                            <td style={{...inventoryStyles.tableCell, width: '20%'}}>
                                                                <div style={inventoryStyles.componentNameCell}>
                                                                    <span style={inventoryStyles.componentName}>
                                                                        {component.componentName}
                                                                    </span>
                                                                    <div style={inventoryStyles.badges}>
                                                                        {component.isCriticallyLow && (
                                                                            <span style={inventoryStyles.lowStockBadge}>LOW</span>
                                                                        )}
                                                                        {component.isOldStock && (
                                                                            <span style={inventoryStyles.oldStockBadge}>OLD</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{...inventoryStyles.tableCell, width: '12%'}}>{component.partNumber}</td>
                                                            <td style={{...inventoryStyles.tableCell, width: '12%'}}>{component.category}</td>
                                                            <td style={{...inventoryStyles.tableCell, width: '8%'}}>
                                                                <span style={component.isCriticallyLow ? inventoryStyles.lowQuantityText : {}}>
                                                                    {component.quantity}
                                                                </span>
                                                            </td>
                                                            <td style={{...inventoryStyles.tableCell, width: '10%'}}>₹{component.unitPrice?.toFixed(2) || '0.00'}</td>
                                                            <td style={{...inventoryStyles.tableCell, width: '12%'}}>{component.location}</td>
                                                            <td style={{...inventoryStyles.tableCell, width: '10%'}}>
                                                                <span style={{
                                                                    ...inventoryStyles.statusBadge,
                                                                    ...getStatusStyle(component.status)
                                                                }}>
                                                                    {component.status}
                                                                </span>
                                                            </td>
                                                            <td style={{...inventoryStyles.tableCell, width: '16%'}}>
                                                                <div style={inventoryStyles.actionButtons}>
                                                                    <button 
                                                                        style={{...inventoryStyles.actionButton, ...inventoryStyles.editButton}}
                                                                        onClick={() => handleEditComponent(component)} 
                                                                        title="Edit Component"
                                                                    >
                                                                        <MdEdit />
                                                                    </button>
                                                                    <button 
                                                                        style={{...inventoryStyles.actionButton, ...inventoryStyles.inwardButton}}
                                                                        onClick={() => handleInwardStock(component)} 
                                                                        title="Add Stock"
                                                                    >
                                                                        <MdInput />
                                                                    </button>
                                                                    <button 
                                                                        style={{...inventoryStyles.actionButton, ...inventoryStyles.outwardButton}}
                                                                        onClick={() => handleOutwardStock(component)} 
                                                                        title="Remove Stock"
                                                                    >
                                                                        <MdOutput />
                                                                    </button>
                                                                    <button 
                                                                        style={{...inventoryStyles.actionButton, ...inventoryStyles.deleteButton}}
                                                                        onClick={() => handleDeleteComponent(component._id)} 
                                                                        title="Delete Component"
                                                                    >
                                                                        <MdDelete />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="8" style={inventoryStyles.noDataCell}>
                                                            <div style={inventoryStyles.noDataContent}>
                                                                <MdSearch style={inventoryStyles.noDataIcon} />
                                                                <h3>No components found</h3>
                                                                <p>Try adjusting your filters or add new components</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Scroll indicator */}
                                    {components.length > 8 && (
                                        <div style={inventoryStyles.scrollIndicator}>
                                            <span>↑ Scroll to see more components ↓</span>
                                        </div>
                                    )}
                                </div>

                                {/* Enhanced Pagination */}
                                <div style={inventoryStyles.paginationContainer}>
                                    <div style={inventoryStyles.paginationWrapper}>
                                        <div style={inventoryStyles.paginationInfo}>
                                            <span style={inventoryStyles.paginationText}>
                                                Showing <strong>{((page - 1) * limit) + 1}</strong> to{' '}
                                                <strong>{Math.min(page * limit, totalComponentsCount)}</strong> of{' '}
                                                <strong>{totalComponentsCount}</strong> components
                                            </span>
                                        </div>
                                        <div style={inventoryStyles.paginationControls}>
                                            <button 
                                                style={{
                                                    ...inventoryStyles.paginationButton,
                                                    ...(page === 1 ? inventoryStyles.paginationButtonDisabled : {})
                                                }}
                                                onClick={() => setPage(prev => Math.max(prev - 1, 1))} 
                                                disabled={page === 1}
                                            >
                                                Previous
                                            </button>
                                            <div style={inventoryStyles.pageNumbers}>
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            style={{
                                                                ...inventoryStyles.pageNumberButton,
                                                                ...(page === pageNum ? inventoryStyles.pageNumberActive : {})
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
                                                    ...inventoryStyles.paginationButton,
                                                    ...(page === totalPages ? inventoryStyles.paginationButtonDisabled : {})
                                                }}
                                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} 
                                                disabled={page === totalPages}
                                            >
                                                Next
                                            </button>
                                            <select 
                                                value={limit} 
                                                onChange={(e) => setLimit(parseInt(e.target.value))}
                                                style={inventoryStyles.limitSelect}
                                            >
                                                <option value="10">10 per page</option>
                                                <option value="20">20 per page</option>
                                                <option value="50">50 per page</option>
                                                <option value="100">100 per page</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAddComponentModal && (
                <AddComponentModel
                    onClose={handleModalCloseAndRefresh}
                    onComponentAdded={handleModalCloseAndRefresh}
                    showNotification={showNotification}
                />
            )}

            {showEditComponentModal && selectedComponent && (
                <EditComponentModel
                    component={selectedComponent}
                    onClose={handleModalCloseAndRefresh}
                    onComponentUpdated={handleModalCloseAndRefresh}
                    showNotification={showNotification}
                />
            )}

            {showInwardStockModal && selectedComponent && (
                <InwardStockModal
                    component={selectedComponent}
                    onClose={handleModalCloseAndRefresh}
                    onStockUpdated={handleModalCloseAndRefresh}
                    showNotification={showNotification}
                />
            )}

            {showOutwardStockModal && selectedComponent && (
                <OutwardStockModal
                    component={selectedComponent}
                    onClose={handleModalCloseAndRefresh}
                    onStockUpdated={handleModalCloseAndRefresh}
                    showNotification={showNotification}
                />
            )}
        </div>
    );
};

// Helper function for status styling
const getStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
        case 'active':
            return { background: '#dcfce7', color: '#16a34a' };
        case 'discontinued':
            return { background: '#fef3c7', color: '#d97706' };
        case 'obsolete':
            return { background: '#fecaca', color: '#dc2626' };
        default:
            return { background: '#f3f4f6', color: '#374151' };
    }
};

// Unique styles object for inventory page only
const inventoryStyles = {
    // Main Layout Container - Unique to inventory page
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

    // Scrollable Inventory Content
    inventoryContent: {
        flex: 1,
        padding: '24px',
        background: '#f8fafc',
        overflowY: 'auto',
        overflowX: 'hidden',
        width: '100%',
        minHeight: 0,
        scrollBehavior: 'smooth',
        // Custom scrollbar for inventory content
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9'
    },

    // Notification styles - scoped to inventory
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

    // Header styles - unique variables
    pageHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
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

    headerActions: {
        display: 'flex',
        gap: '12px'
    },

    primaryButton: {
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

    addButton: {
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

    buttonIcon: {
        fontSize: '1.2rem'
    },

    buttonDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed'
    },

    spinner: {
        width: '16px',
        height: '16px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderTop: '2px solid white',
        borderRadius: '50%',
        animation: 'inventorySpinAnimation 1s linear infinite'
    },

    // Search and Filter Layout - unique variables
    searchAndFilterSection: {
        display: 'flex',
        gap: '16px',
        marginBottom: '16px',
        alignItems: 'center'
    },

    searchContainer: {
        position: 'relative',
        flex: 1,
        maxWidth: '600px',
        display: 'flex',
        alignItems: 'center',
        background: 'white',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        padding: '14px 18px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s ease'
    },

    searchIcon: {
        color: '#9ca3af',
        fontSize: '1.3rem',
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

    clearSearchButton: {
        background: '#e2e8f0',
        border: 'none',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#64748b',
        marginLeft: '8px',
        transition: 'all 0.2s ease'
    },

    filterButtonContainer: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
    },

    filterToggleButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'white',
        border: '2px solid #e2e8f0',
        padding: '14px 18px',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
        color: '#374151',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
    },

    filterIcon: {
        color: '#3b82f6',
        fontSize: '1.2rem'
    },

    filterCount: {
        background: '#3b82f6',
        color: 'white',
        fontSize: '0.75rem',
        fontWeight: '700',
        padding: '3px 7px',
        borderRadius: '10px',
        minWidth: '18px',
        textAlign: 'center'
    },

    clearFiltersButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: '#f3f4f6',
        border: '1px solid #d1d5db',
        padding: '12px 16px',
        borderRadius: '10px',
        color: '#374151',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '0.9rem',
        fontWeight: '500',
        whiteSpace: 'nowrap'
    },

    clearIcon: {
        fontSize: '1rem'
    },

    // Filter section styles - unique variables
    filterSection: {
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0',
        animation: 'inventorySlideDownAnimation 0.3s ease-out'
    },

    filterGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
    },

    filterGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },

    filterLabel: {
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#374151'
    },

    filterSelect: {
        width: '100%',
        padding: '10px 14px',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '0.9rem',
        background: 'white',
        cursor: 'pointer',
        boxSizing: 'border-box'
    },

    filterInput: {
        width: '100%',
        padding: '10px 14px',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '0.9rem',
        background: 'white',
        boxSizing: 'border-box'
    },

    quantityGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },

    quantityInputs: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },

    quantityInput: {
        flex: 1,
        padding: '10px 14px',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '0.9rem',
        background: 'white',
        boxSizing: 'border-box'
    },

    quantitySeparator: {
        color: '#6b7280',
        fontSize: '0.9rem',
        fontWeight: '500'
    },

    checkboxGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },

    checkboxContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },

    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        color: '#374151'
    },

    checkbox: {
        width: '16px',
        height: '16px',
        cursor: 'pointer'
    },

    // Table Section - unique variables
    tableSection: {
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '600px'
    },

    tableWrapper: {
        width: '100%',
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
    },

    // Fixed Header Table Container
    tableContainer: {
        width: '100%',
        overflowX: 'hidden',
        overflowY: 'hidden',
        backgroundColor: 'white',
        flexShrink: 0,
        borderBottom: '2px solid #e2e8f0'
    },

    // Header Table
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        background: 'white',
        tableLayout: 'fixed'
    },

    // Scrollable Body Container
    scrollableTableBody: {
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: 'white',
        flex: 1,
        minHeight: '400px',
        maxHeight: '500px',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9'
    },

    // Body Table (matches header widths)
    bodyTable: {
        width: '100%',
        borderCollapse: 'collapse',
        background: 'white',
        tableLayout: 'fixed'
    },

    // Table Head (Sticky)
    tableHead: {
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        position: 'sticky',
        top: 0,
        zIndex: 10
    },

    // Enhanced Table Header
    tableHeader: {
        padding: '16px 12px',
        textAlign: 'left',
        fontSize: '0.8rem',
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderRight: '1px solid #e2e8f0',
        cursor: 'pointer',
        userSelect: 'none',
        backgroundColor: '#f8fafc',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },

    headerContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        justifyContent: 'space-between'
    },

    sortIndicator: {
        color: '#3b82f6',
        fontSize: '0.8rem',
        flexShrink: 0
    },

    // Enhanced Table Row
    tableRow: {
        borderBottom: '1px solid #f1f5f9',
        transition: 'background-color 0.2s ease'
    },

    lowStockRow: {
        backgroundColor: '#fef2f2',
        borderLeft: '4px solid #ef4444'
    },

    // Enhanced Table Cell
    tableCell: {
        padding: '12px',
        verticalAlign: 'middle',
        fontSize: '0.85rem',
        color: '#374151',
        borderBottom: '1px solid #f1f5f9',
        borderRight: '1px solid #f1f5f9',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },

    // Component Name Cell
    componentNameCell: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },

    componentName: {
        fontWeight: '600',
        color: '#1f2937',
        lineHeight: '1.3',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },

    badges: {
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap'
    },

    lowStockBadge: {
        background: '#fef2f2',
        color: '#dc2626',
        fontSize: '0.6rem',
        fontWeight: '700',
        padding: '2px 4px',
        borderRadius: '3px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },

    oldStockBadge: {
        background: '#fef3c7',
        color: '#d97706',
        fontSize: '0.6rem',
        fontWeight: '700',
        padding: '2px 4px',
        borderRadius: '3px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },

    lowQuantityText: {
        color: '#dc2626',
        fontWeight: '700'
    },

    statusBadge: {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        minWidth: '60px'
    },

    // Action Buttons
    actionButtons: {
        display: 'flex',
        gap: '4px',
        justifyContent: 'center',
        flexWrap: 'wrap'
    },

    actionButton: {
        width: '28px',
        height: '28px',
        border: 'none',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '0.9rem',
        flexShrink: 0
    },

    editButton: {
        background: '#dbeafe',
        color: '#2563eb'
    },

    inwardButton: {
        background: '#dcfce7',
        color: '#16a34a'
    },

    outwardButton: {
        background: '#fef3c7',
        color: '#d97706'
    },

    deleteButton: {
        background: '#fef2f2',
        color: '#dc2626'
    },

    // Enhanced Scroll Indicator
    scrollIndicator: {
        textAlign: 'center',
        padding: '8px',
        backgroundColor: '#f8fafc',
        color: '#6b7280',
        fontSize: '0.8rem',
        fontWeight: '500',
        borderTop: '1px solid #e2e8f0',
        flexShrink: 0
    },

    // Enhanced Loading State
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
        animation: 'inventorySpinAnimation 1s linear infinite',
        marginBottom: '16px'
    },

    // Enhanced Error State
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

    // Enhanced No Data State
    noDataCell: {
        textAlign: 'center',
        padding: '60px 20px'
    },

    noDataContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: '#6b7280'
    },

    noDataIcon: {
        fontSize: '3rem',
        color: '#d1d5db',
        marginBottom: '16px'
    },

    // Enhanced Pagination Container  
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
    }
};

// Unique CSS animations and scrollbar styles for inventory page only
const inventoryStyleSheet = document.createElement('style');
inventoryStyleSheet.innerHTML = `
  /* Unique animations for inventory page */
  @keyframes inventorySpinAnimation {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes inventorySlideDownAnimation {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Inventory page specific scrollbar styles */
  .inventory-page-wrapper .inventoryContent::-webkit-scrollbar {
    width: 12px;
  }
  
  .inventory-page-wrapper .inventoryContent::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 6px;
  }
  
  .inventory-page-wrapper .inventoryContent::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #cbd5e1, #94a3b8);
    border-radius: 6px;
    border: 2px solid #f1f5f9;
  }
  
  .inventory-page-wrapper .inventoryContent::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #94a3b8, #64748b);
  }
  
  /* Table scrollbar styles */
  .inventory-page-wrapper .scrollableTableBody::-webkit-scrollbar {
    width: 8px;
  }
  
  .inventory-page-wrapper .scrollableTableBody::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  .inventory-page-wrapper .scrollableTableBody::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #cbd5e1, #94a3b8);
    border-radius: 4px;
    border: 1px solid #f1f5f9;
  }
  
  .inventory-page-wrapper .scrollableTableBody::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #94a3b8, #64748b);
  }
  
  /* Hover effects for inventory page only */
  .inventory-page-wrapper button:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  .inventory-page-wrapper .searchContainer:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12), 0 4px 20px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
  
  /* Responsive styles for inventory page only */
  @media (max-width: 768px) {
    .inventory-page-wrapper .inventoryContent {
      padding: 16px;
    }
    
    .inventory-page-wrapper .sidebarContainer {
      width: 240px;
    }
  }
  
  @media (max-width: 480px) {
    .inventory-page-wrapper .inventoryContent {
      padding: 12px;
    }
    
    .inventory-page-wrapper .sidebarContainer {
      width: 220px;
    }
  }
`;

// Only add stylesheet if it doesn't exist
if (!document.querySelector('#inventory-page-styles')) {
    inventoryStyleSheet.id = 'inventory-page-styles';
    document.head.appendChild(inventoryStyleSheet);
}

export default InventoryPage;
