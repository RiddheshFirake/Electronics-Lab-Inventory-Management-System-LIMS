// src/components/EditComponentModel.js
import React, { useState, useEffect } from 'react';
import { MdClose, MdEdit, MdSave, MdCancel, MdInfo, MdWarning } from 'react-icons/md';
import api from '../utils/api';
import './EditComponentModel.css';

const EditComponentModel = ({ component, onClose, onComponentUpdated, showNotification }) => {
  const [formData, setFormData] = useState({
    componentName: component.componentName || '',
    manufacturer: component.manufacturer || '',
    partNumber: component.partNumber || '',
    description: component.description || '',
    quantity: component.quantity || 0,
    location: component.location || '',
    unitPrice: component.unitPrice || 0,
    datasheetLink: component.datasheetLink || '',
    category: component.category || '',
    criticalLowThreshold: component.criticalLowThreshold || 0,
    tags: component.tags ? component.tags.join(', ') : '',
    status: component.status || 'Active',
  });

  const [predefinedCategories, setPredefinedCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPredefinedCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await api.get('/components/predefined-categories');
        setPredefinedCategories(response.data.data);
      } catch (err) {
        console.error('Error fetching predefined categories:', err);
        setFormError('Failed to load categories.');
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchPredefinedCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    // Basic client-side validation
    if (!formData.componentName || !formData.manufacturer || !formData.partNumber ||
        !formData.description || !formData.location || !formData.category ||
        formData.quantity < 0 || formData.unitPrice < 0 || formData.criticalLowThreshold < 0) {
      setFormError('Please fill in all required fields and ensure quantities/prices are non-negative.');
      setIsSubmitting(false);
      return;
    }
    
    if (formData.datasheetLink && !/^https?:\/\/.+/.test(formData.datasheetLink)) {
        setFormError('Datasheet link must be a valid URL.');
        setIsSubmitting(false);
        return;
    }

    try {
      const dataToSend = {
        ...formData,
        quantity: parseInt(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
        criticalLowThreshold: parseInt(formData.criticalLowThreshold),
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [],
      };

      const response = await api.put(`/components/${component._id}`, dataToSend);
      showNotification('Component updated successfully!', 'success');
      console.log('Component updated:', response.data);
      onComponentUpdated();
    } catch (err) {
      console.error('Error updating component:', err.response?.data || err);
      setFormError(err.response?.data?.message || 'Failed to update component. Please try again.');
      showNotification(err.response?.data?.message || 'Failed to update component.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="edit-modal-overlay">
      <div className="edit-modal-backdrop" onClick={onClose}></div>
      <div className="edit-modal-container">
        <div className="edit-modal-content">
          {/* Enhanced Header */}
          <div className="edit-modal-header">
            <div className="edit-header-content">
              <div className="edit-header-icon">
                <MdEdit />
              </div>
              <div className="edit-header-text">
                <h2>Edit Component</h2>
                <p className="edit-component-name">{component.componentName}</p>
              </div>
            </div>
            <button className="edit-close-button" onClick={onClose}>
              <MdClose />
            </button>
          </div>

          {/* Form Content */}
          <div className="edit-modal-body">
            <form onSubmit={handleSubmit} className="edit-component-form">
              {formError && (
                <div className="edit-form-error">
                  <MdWarning className="error-icon" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Basic Information Section */}
              <div className="edit-form-section">
                <div className="edit-section-header">
                  <h3>Basic Information</h3>
                  <div className="edit-section-line"></div>
                </div>
                <div className="edit-form-grid">
                  <div className="edit-form-group">
                    <label htmlFor="componentName" className="edit-form-label">
                      Component Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="componentName"
                      name="componentName"
                      value={formData.componentName}
                      onChange={handleChange}
                      className="edit-form-input"
                      required
                    />
                  </div>

                  <div className="edit-form-group">
                    <label htmlFor="manufacturer" className="edit-form-label">
                      Manufacturer <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="manufacturer"
                      name="manufacturer"
                      value={formData.manufacturer}
                      onChange={handleChange}
                      className="edit-form-input"
                      required
                    />
                  </div>

                  <div className="edit-form-group">
                    <label htmlFor="partNumber" className="edit-form-label">
                      Part Number <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="partNumber"
                      name="partNumber"
                      value={formData.partNumber}
                      onChange={handleChange}
                      className="edit-form-input"
                      required
                    />
                  </div>

                  <div className="edit-form-group">
                    <label htmlFor="category" className="edit-form-label">
                      Category <span className="required">*</span>
                    </label>
                    {loadingCategories ? (
                      <div className="edit-loading-state">
                        <div className="edit-loading-spinner"></div>
                        <span>Loading categories...</span>
                      </div>
                    ) : (
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="edit-form-select"
                        required
                      >
                        <option value="">Select a category</option>
                        {predefinedCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="edit-form-group full-width">
                  <label htmlFor="description" className="edit-form-label">
                    Description <span className="required">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="edit-form-textarea"
                    rows="3"
                    required
                  ></textarea>
                </div>
              </div>

              {/* Inventory & Pricing Section */}
              <div className="edit-form-section">
                <div className="edit-section-header">
                  <h3>Inventory & Pricing</h3>
                  <div className="edit-section-line"></div>
                </div>
                <div className="edit-form-grid">
                  <div className="edit-form-group">
                    <label htmlFor="quantity" className="edit-form-label">
                      Current Quantity <span className="required">*</span>
                    </label>
                    <div className="edit-input-with-info">
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        className="edit-form-input"
                        min="0"
                        required
                        disabled
                      />
                      <div className="edit-input-info">
                        <MdInfo className="info-icon" />
                        <span className="info-tooltip">Updated via inward/outward transactions</span>
                      </div>
                    </div>
                  </div>

                  <div className="edit-form-group">
                    <label htmlFor="unitPrice" className="edit-form-label">
                      Unit Price (₹) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="unitPrice"
                      name="unitPrice"
                      value={formData.unitPrice}
                      onChange={handleChange}
                      className="edit-form-input"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="edit-form-group">
                    <label htmlFor="location" className="edit-form-label">
                      Storage Location <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="edit-form-input"
                      required
                    />
                  </div>

                  <div className="edit-form-group">
                    <label htmlFor="criticalLowThreshold" className="edit-form-label">
                      Low Stock Threshold <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="criticalLowThreshold"
                      name="criticalLowThreshold"
                      value={formData.criticalLowThreshold}
                      onChange={handleChange}
                      className="edit-form-input"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="edit-form-section">
                <div className="edit-section-header">
                  <h3>Additional Information</h3>
                  <div className="edit-section-line"></div>
                </div>
                <div className="edit-form-grid">
                  <div className="edit-form-group">
                    <label htmlFor="datasheetLink" className="edit-form-label">
                      Datasheet Link
                    </label>
                    <input
                      type="url"
                      id="datasheetLink"
                      name="datasheetLink"
                      value={formData.datasheetLink}
                      onChange={handleChange}
                      className="edit-form-input"
                      placeholder="https://example.com/datasheet.pdf"
                    />
                  </div>

                  <div className="edit-form-group">
                    <label htmlFor="status" className="edit-form-label">
                      Status <span className="required">*</span>
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="edit-form-select"
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Discontinued">Discontinued</option>
                      <option value="Obsolete">Obsolete</option>
                    </select>
                  </div>
                </div>

                <div className="edit-form-group full-width">
                  <label htmlFor="tags" className="edit-form-label">
                    Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="edit-form-input"
                    placeholder="resistor, smd, 0805 (comma-separated)"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Enhanced Footer */}
          <div className="edit-modal-footer">
            <button 
              type="button" 
              className="edit-btn edit-btn-secondary" 
              onClick={onClose} 
              disabled={isSubmitting}
            >
              <MdCancel />
              Cancel
            </button>
            <button 
              type="submit" 
              className="edit-btn edit-btn-primary" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="edit-btn-spinner"></div>
                  Updating...
                </>
              ) : (
                <>
                  <MdSave />
                  Update Component
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditComponentModel;
