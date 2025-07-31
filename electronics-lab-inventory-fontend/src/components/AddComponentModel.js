// src/components/AddComponentModel.js
import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import api from '../utils/api';
import './AddComponentModel.css';

const AddComponentModel = ({ onClose, onComponentAdded, showNotification }) => { // Added showNotification prop
  const [formData, setFormData] = useState({
    componentName: '',
    manufacturer: '',
    partNumber: '',
    description: '',
    quantity: 0,
    location: '',
    unitPrice: 0,
    datasheetLink: '',
    category: '',
    criticalLowThreshold: 0,
    tags: '',
    status: 'Active',
  });

  const [predefinedCategories, setPredefinedCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [formError, setFormError] = useState(null); // Keep for client-side validation errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed successMessage state as notifications will handle it

  useEffect(() => {
    const fetchPredefinedCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await api.get('/components/predefined-categories');
        setPredefinedCategories(response.data.data);
      } catch (err) {
        console.error('Error fetching predefined categories:', err);
        // showNotification('Failed to load categories for form.', 'error'); // Can also notify here
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
    // Removed setSuccessMessage

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

      const response = await api.post('/components', dataToSend);
      showNotification('Component added successfully!', 'success'); // Trigger success notification
      console.log('Component added:', response.data);
      onComponentAdded(); // Notify parent to refresh list and close modal
    } catch (err) {
      console.error('Error adding component:', err.response?.data || err);
      setFormError(err.response?.data?.message || 'Failed to add component. Please try again.'); // Keep form error for immediate feedback
      showNotification(err.response?.data?.message || 'Failed to add component.', 'error'); // Trigger error notification
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add New Component</h2>
          <button className="close-button" onClick={onClose}>
            <MdClose />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="add-component-form">
          {formError && <p className="form-error">{formError}</p>}
          {/* Removed successMessage display from here */}

          <div className="form-group">
            <label htmlFor="componentName">Component Name *</label>
            <input
              type="text"
              id="componentName"
              name="componentName"
              value={formData.componentName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="manufacturer">Manufacturer *</label>
            <input
              type="text"
              id="manufacturer"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="partNumber">Part Number *</label>
            <input
              type="text"
              id="partNumber"
              name="partNumber"
              value={formData.partNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            {loadingCategories ? (
                <p>Loading categories...</p>
            ) : (
                <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select a category</option>
                    {predefinedCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="unitPrice">Unit Price (INR) *</label>
              <input
                type="number"
                id="unitPrice"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="criticalLowThreshold">Critical Low Threshold *</label>
            <input
              type="number"
              id="criticalLowThreshold"
              name="criticalLowThreshold"
              value={formData.criticalLowThreshold}
              onChange={handleChange}
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="datasheetLink">Datasheet Link (URL)</label>
            <input
              type="url"
              id="datasheetLink"
              name="datasheetLink"
              value={formData.datasheetLink}
              onChange={handleChange}
              placeholder="e.g., https://example.com/datasheet.pdf"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., resistor, smd, 0805"
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status *</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="Active">Active</option>
              <option value="Discontinued">Discontinued</option>
              <option value="Obsolete">Obsolete</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Component'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddComponentModel;