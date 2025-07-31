// src/pages/InventoryPage.js
import React, { useState, useEffect } from 'react';
import { MdSearch, MdAddCircleOutline, MdDownload, MdEdit, MdInput, MdOutput, MdDelete } from 'react-icons/md';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AddComponentModel from '../components/AddComponentModel';
import EditComponentModel from '../components/EditComponentModel';
import InwardStockModal from '../components/InwardStockModal';
import OutwardStockModal from '../components/OutwardStockModal';
import api from '../utils/api';

import './InventoryPage.css';

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

    const [selectedComponent, setSelectedComponent] = useState(null); // To pass data to modals

    const [predefinedCategories, setPredefinedCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // Notification state
    const [notification, setNotification] = useState(null); // { message: '...', type: 'success' | 'error' }

    const showNotification = (message, type) => {
        setNotification({ message, type });
        const timer = setTimeout(() => {
            setNotification(null);
        }, 3000); // Hide after 3 seconds
        return () => clearTimeout(timer); // Cleanup timer if component unmounts
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

            Object.keys(params).forEach(key => params[key] === '' || params[key] === null || params[key] === undefined || (typeof params[key] === 'boolean' && params[key] === false && key !== 'lowStock' && key !== 'oldStock') && delete params[key]);

            const response = await api.get('/components', { params });
            setComponents(response.data.data);
            setTotalPages(response.data.pagination.total);
            setTotalComponentsCount(response.data.total);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch components:', err);
            setError('Failed to load inventory data. Please try again.');
            showNotification('Failed to load inventory data.', 'error'); // Notify on initial load error
            setLoading(false);
        }
    };

    // Fetch predefined categories when component mounts
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

    const handleExportComponents = async () => {
        try {
            const response = await api.get('/components/export', { responseType: 'json' });
            const data = response.data.data;
            const csvRows = [];
            
            const headers = Object.keys(data[0] || {});
            csvRows.push(headers.join(','));

            for (const row of data) {
                csvRows.push(headers.map(header => {
                    let value = row[header];
                    if (typeof value === 'string' && value.includes(',')) {
                        value = `"${value}"`;
                    }
                    return value;
                }).join(','));
            }

            const csvString = csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', 'components.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            showNotification('Components data exported successfully!', 'success');
        } catch (err) {
            console.error('Export components error:', err);
            showNotification('Failed to export components.', 'error');
        }
    };

    // --- New Modal Handlers ---
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
        setSelectedComponent(null); // Clear selected component
        fetchComponents(); // Refresh the component list
    };

    const statuses = ['all', 'Active', 'Discontinued', 'Obsolete'];

    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content-area">
                <Navbar />
                {notification && (
                    <div className={`app-notification ${notification.type}`}>
                        {notification.message}
                    </div>
                )}
                <div className="inventory-content">
                    <div className="inventory-header">
                        <h1 className="page-title">Inventory</h1>
                        <div className="inventory-actions">
                            <button className="btn btn-primary" onClick={handleAddComponent}>
                                <MdAddCircleOutline /> Add Component
                            </button>
                            <button className="btn btn-secondary" onClick={handleExportComponents}>
                                <MdDownload /> Export CSV
                            </button>
                        </div>
                    </div>

                    <div className="filter-bar">
                        <div className="search-input-group">
                            <MdSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by name or part number..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>

                        <select value={categoryFilter} onChange={handleCategoryChange}>
                            <option value="all">All Categories</option>
                            {loadingCategories ? (
                                <option disabled>Loading categories...</option>
                            ) : (
                                predefinedCategories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))
                            )}
                        </select>

                        <select value={statusFilter} onChange={handleStatusChange}>
                            {statuses.map((status) => (
                                <option key={status} value={status}>
                                    {status === 'all' ? 'All Statuses' : status}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            placeholder="Location"
                            value={locationFilter}
                            onChange={handleLocationChange}
                        />

                        <input
                            type="number"
                            placeholder="Min Qty"
                            value={minQuantity}
                            onChange={handleMinQuantityChange}
                            className="quantity-input"
                        />
                        <input
                            type="number"
                            placeholder="Max Qty"
                            value={maxQuantity}
                            onChange={handleMaxQuantityChange}
                            className="quantity-input"
                        />

                        <div className="checkbox-filter">
                            <input
                                type="checkbox"
                                id="lowStock"
                                checked={lowStockFilter}
                                onChange={handleLowStockFilterChange}
                            />
                            <label htmlFor="lowStock">Low Stock</label>
                        </div>

                        <div className="checkbox-filter">
                            <input
                                type="checkbox"
                                id="oldStock"
                                checked={oldStockFilter}
                                onChange={handleOldStockFilterChange}
                            />
                            <label htmlFor="oldStock">Old Stock</label>
                        </div>
                    </div>
                    {loading ? (
                        <div className="inventory-loading">Loading components...</div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : (
                        <div className="component-list-container">
                            <table className="component-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSortChange('componentName')}>Component Name {sortBy === 'componentName' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                                        <th onClick={() => handleSortChange('partNumber')}>Part Number {sortBy === 'partNumber' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                                        <th onClick={() => handleSortChange('category')}>Category {sortBy === 'category' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                                        <th onClick={() => handleSortChange('quantity')}>Quantity {sortBy === 'quantity' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                                        <th onClick={() => handleSortChange('unitPrice')}>Unit Price {sortBy === 'unitPrice' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                                        <th onClick={() => handleSortChange('location')}>Location {sortBy === 'location' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                                        <th onClick={() => handleSortChange('status')}>Status {sortBy === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {components.length > 0 ? (
                                        components.map((component) => (
                                            <tr key={component._id} className={component.isCriticallyLow ? 'low-stock-row' : ''}>
                                                <td>
                                                    {component.componentName}
                                                    {component.isCriticallyLow && <span className="low-stock-badge">LOW</span>}
                                                    {component.isOldStock && <span className="old-stock-badge">OLD</span>}
                                                </td>
                                                <td>{component.partNumber}</td>
                                                <td>{component.category}</td>
                                                <td>{component.quantity}</td>
                                                <td>INR {component.unitPrice.toFixed(2)}</td>
                                                <td>{component.location}</td>
                                                <td>{component.status}</td>
                                                <td className="action-buttons">
                                                    <button className="icon-btn edit-btn" onClick={() => handleEditComponent(component)} title="Edit Component"><MdEdit /></button>
                                                    <button className="icon-btn inward-btn" onClick={() => handleInwardStock(component)} title="Inward Stock"><MdInput /></button>
                                                    <button className="icon-btn outward-btn" onClick={() => handleOutwardStock(component)} title="Outward Stock"><MdOutput /></button>
                                                    <button className="icon-btn delete-btn" onClick={() => handleDeleteComponent(component._id)} title="Delete/Discontinue"><MdDelete /></button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="no-components-message">No components found matching your criteria.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}


                    <div className="pagination">
                        <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1}>
                            Previous
                        </button>
                        <span>Page {page} of {totalPages} ({totalComponentsCount} items)</span>
                        <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages}>
                            Next
                        </button>
                        <select value={limit} onChange={(e) => setLimit(parseInt(e.target.value))}>
                            <option value="10">10 per page</option>
                            <option value="20">20 per page</option>
                            <option value="50">50 per page</option>
                        </select>
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

export default InventoryPage;