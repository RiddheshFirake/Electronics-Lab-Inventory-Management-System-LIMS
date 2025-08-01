// src/components/AddComponentModel.js
import React, { useState, useEffect } from 'react';
import { 
  MdClose, 
  MdAdd, 
  MdCategory, 
  MdDescription, 
  MdInventory, 
  MdLocationOn, 
  MdAttachMoney, 
  MdLink, 
  MdLabel,
  MdCheckCircle,
  MdError,
  MdWarning
} from 'react-icons/md';
import api from '../utils/api';
import './AddComponentModel.css';

const AddComponentModel = ({ onClose, onComponentAdded, showNotification }) => {
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
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState({});

  const formSections = [
    {
      title: 'Basic Information',
      icon: <MdCategory />,
      fields: ['componentName', 'manufacturer', 'partNumber', 'category']
    },
    {
      title: 'Details & Specifications',
      icon: <MdDescription />,
      fields: ['description', 'quantity', 'unitPrice', 'location']
    },
    {
      title: 'Additional Information',
      icon: <MdInventory />,
      fields: ['criticalLowThreshold', 'datasheetLink', 'tags', 'status']
    }
  ];

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

  const validateField = (name, value) => {
    const errors = { ...validationErrors };

    switch (name) {
      case 'componentName':
        if (!value.trim()) {
          errors[name] = 'Component name is required';
        } else if (value.length < 2) {
          errors[name] = 'Component name must be at least 2 characters';
        } else {
          delete errors[name];
        }
        break;
      case 'manufacturer':
        if (!value.trim()) {
          errors[name] = 'Manufacturer is required';
        } else {
          delete errors[name];
        }
        break;
      case 'partNumber':
        if (!value.trim()) {
          errors[name] = 'Part number is required';
        } else {
          delete errors[name];
        }
        break;
      case 'datasheetLink':
        if (value && !/^https?:\/\/.+/.test(value)) {
          errors[name] = 'Must be a valid URL (http:// or https://)';
        } else {
          delete errors[name];
        }
        break;
      case 'quantity':
        if (value < 0) {
          errors[name] = 'Quantity cannot be negative';
        } else {
          delete errors[name];
        }
        break;
      case 'unitPrice':
        if (value < 0) {
          errors[name] = 'Price cannot be negative';
        } else {
          delete errors[name];
        }
        break;
      case 'criticalLowThreshold':
        if (value < 0) {
          errors[name] = 'Threshold cannot be negative';
        } else {
          delete errors[name];
        }
        break;
      default:
        if (['description', 'location', 'category'].includes(name) && !value.trim()) {
          errors[name] = `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
        } else {
          delete errors[name];
        }
    }

    setValidationErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData((prevData) => ({
      ...prevData,
      [name]: newValue,
    }));

    // Real-time validation
    validateField(name, newValue);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only submit if we're on the last step
    if (currentStep !== formSections.length) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    // Comprehensive validation
    const requiredFields = ['componentName', 'manufacturer', 'partNumber', 'description', 'location', 'category'];
    const errors = {};

    requiredFields.forEach(field => {
      if (!formData[field] || !formData[field].toString().trim()) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    if (formData.quantity < 0) errors.quantity = 'Quantity cannot be negative';
    if (formData.unitPrice < 0) errors.unitPrice = 'Price cannot be negative';
    if (formData.criticalLowThreshold < 0) errors.criticalLowThreshold = 'Threshold cannot be negative';
    
    if (formData.datasheetLink && !/^https?:\/\/.+/.test(formData.datasheetLink)) {
      errors.datasheetLink = 'Must be a valid URL';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError('Please fix the validation errors before submitting.');
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
      showNotification('Component added successfully!', 'success');
      console.log('Component added:', response.data);
      onComponentAdded();
    } catch (err) {
      console.error('Error adding component:', err.response?.data || err);
      const errorMessage = err.response?.data?.message || 'Failed to add component. Please try again.';
      setFormError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = (e) => {
    e.preventDefault(); // Prevent form submission
    if (currentStep < formSections.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = (e) => {
    e.preventDefault(); // Prevent form submission
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = (stepNumber) => {
    const section = formSections[stepNumber - 1];
    return section.fields.every(field => {
      // Check required fields
      const requiredFields = ['componentName', 'manufacturer', 'partNumber', 'description', 'location', 'category'];
      if (requiredFields.includes(field)) {
        const hasValue = formData[field] && formData[field].toString().trim();
        const hasNoErrors = !validationErrors[field];
        return hasValue && hasNoErrors;
      }
      // For non-required fields, just check for validation errors
      return !validationErrors[field];
    });
  };

  const getProgressPercentage = () => {
    return (currentStep / formSections.length) * 100;
  };

  return (
    <div className="enhanced-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="enhanced-modal-content">
        {/* Enhanced Header */}
        <div className="enhanced-modal-header">
          <div className="header-content">
            <div className="header-icon">
              <MdAdd />
            </div>
            <div className="header-text">
              <h2>Add New Component</h2>
              <p>Step {currentStep} of {formSections.length}: {formSections[currentStep - 1].title}</p>
            </div>
          </div>
          <button className="enhanced-close-button" onClick={onClose} type="button">
            <MdClose />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="step-indicators">
            {formSections.map((section, index) => (
              <div 
                key={index}
                className={`step-indicator ${
                  currentStep > index + 1 ? 'completed' : 
                  currentStep === index + 1 ? 'active' : 'pending'
                }`}
              >
                {currentStep > index + 1 ? <MdCheckCircle /> : section.icon}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="enhanced-add-component-form">
          {formError && (
            <div className="enhanced-form-error">
              <MdError />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">{formSections[currentStep - 1].icon}</div>
              <h3>{formSections[currentStep - 1].title}</h3>
            </div>

            <div className="form-fields">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <>
                  <div className="enhanced-form-group">
                    <label htmlFor="componentName">
                      <MdLabel />
                      Component Name *
                    </label>
                    <input
                      type="text"
                      id="componentName"
                      name="componentName"
                      value={formData.componentName}
                      onChange={handleChange}
                      className={validationErrors.componentName ? 'error' : ''}
                      placeholder="Enter component name"
                      required
                    />
                    {validationErrors.componentName && (
                      <span className="field-error">{validationErrors.componentName}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="enhanced-form-group">
                      <label htmlFor="manufacturer">
                        <MdCategory />
                        Manufacturer *
                      </label>
                      <input
                        type="text"
                        id="manufacturer"
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={handleChange}
                        className={validationErrors.manufacturer ? 'error' : ''}
                        placeholder="Enter manufacturer name"
                        required
                      />
                      {validationErrors.manufacturer && (
                        <span className="field-error">{validationErrors.manufacturer}</span>
                      )}
                    </div>

                    <div className="enhanced-form-group">
                      <label htmlFor="partNumber">
                        <MdInventory />
                        Part Number *
                      </label>
                      <input
                        type="text"
                        id="partNumber"
                        name="partNumber"
                        value={formData.partNumber}
                        onChange={handleChange}
                        className={validationErrors.partNumber ? 'error' : ''}
                        placeholder="Enter part number"
                        required
                      />
                      {validationErrors.partNumber && (
                        <span className="field-error">{validationErrors.partNumber}</span>
                      )}
                    </div>
                  </div>

                  <div className="enhanced-form-group">
                    <label htmlFor="category">
                      <MdCategory />
                      Category *
                    </label>
                    {loadingCategories ? (
                      <div className="loading-spinner">
                        <div className="spinner"></div>
                        <span>Loading categories...</span>
                      </div>
                    ) : (
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className={validationErrors.category ? 'error' : ''}
                        required
                      >
                        <option value="">Select a category</option>
                        {predefinedCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    )}
                    {validationErrors.category && (
                      <span className="field-error">{validationErrors.category}</span>
                    )}
                  </div>
                </>
              )}

              {/* Step 2: Details & Specifications */}
              {currentStep === 2 && (
                <>
                  <div className="enhanced-form-group">
                    <label htmlFor="description">
                      <MdDescription />
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className={validationErrors.description ? 'error' : ''}
                      placeholder="Enter detailed component description"
                      rows="4"
                      required
                    />
                    {validationErrors.description && (
                      <span className="field-error">{validationErrors.description}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="enhanced-form-group">
                      <label htmlFor="quantity">
                        <MdInventory />
                        Quantity *
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        className={validationErrors.quantity ? 'error' : ''}
                        min="0"
                        placeholder="0"
                        required
                      />
                      {validationErrors.quantity && (
                        <span className="field-error">{validationErrors.quantity}</span>
                      )}
                    </div>

                    <div className="enhanced-form-group">
                      <label htmlFor="unitPrice">
                        <MdAttachMoney />
                        Unit Price (₹) *
                      </label>
                      <input
                        type="number"
                        id="unitPrice"
                        name="unitPrice"
                        value={formData.unitPrice}
                        onChange={handleChange}
                        className={validationErrors.unitPrice ? 'error' : ''}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        required
                      />
                      {validationErrors.unitPrice && (
                        <span className="field-error">{validationErrors.unitPrice}</span>
                      )}
                    </div>
                  </div>

                  <div className="enhanced-form-group">
                    <label htmlFor="location">
                      <MdLocationOn />
                      Location *
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className={validationErrors.location ? 'error' : ''}
                      placeholder="e.g., Shelf A, Drawer 1, Room 101"
                      required
                    />
                    {validationErrors.location && (
                      <span className="field-error">{validationErrors.location}</span>
                    )}
                  </div>
                </>
              )}

              {/* Step 3: Additional Information */}
              {currentStep === 3 && (
                <>
                  <div className="enhanced-form-group">
                    <label htmlFor="criticalLowThreshold">
                      <MdWarning />
                      Critical Low Threshold *
                    </label>
                    <input
                      type="number"
                      id="criticalLowThreshold"
                      name="criticalLowThreshold"
                      value={formData.criticalLowThreshold}
                      onChange={handleChange}
                      className={validationErrors.criticalLowThreshold ? 'error' : ''}
                      min="0"
                      placeholder="Minimum quantity before low stock alert"
                      required
                    />
                    {validationErrors.criticalLowThreshold && (
                      <span className="field-error">{validationErrors.criticalLowThreshold}</span>
                    )}
                    <small className="field-hint">
                      Set the minimum quantity threshold that triggers low stock alerts
                    </small>
                  </div>

                  <div className="enhanced-form-group">
                    <label htmlFor="datasheetLink">
                      <MdLink />
                      Datasheet Link
                    </label>
                    <input
                      type="url"
                      id="datasheetLink"
                      name="datasheetLink"
                      value={formData.datasheetLink}
                      onChange={handleChange}
                      className={validationErrors.datasheetLink ? 'error' : ''}
                      placeholder="https://example.com/datasheet.pdf"
                    />
                    {validationErrors.datasheetLink && (
                      <span className="field-error">{validationErrors.datasheetLink}</span>
                    )}
                    <small className="field-hint">Optional: Link to component datasheet or documentation</small>
                  </div>

                  <div className="enhanced-form-group">
                    <label htmlFor="tags">
                      <MdLabel />
                      Tags
                    </label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      placeholder="resistor, smd, 0805, high-precision"
                    />
                    <small className="field-hint">Separate multiple tags with commas</small>
                  </div>

                  <div className="enhanced-form-group">
                    <label htmlFor="status">
                      <MdCheckCircle />
                      Status *
                    </label>
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
                    <small className="field-hint">Current status of the component</small>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Enhanced Navigation */}
          <div className="enhanced-modal-actions">
            <div className="navigation-buttons">
              {currentStep > 1 && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  Previous
                </button>
              )}
              
              {currentStep < formSections.length ? (
                <button 
                  type="button" 
                  className={`btn btn-primary ${!isStepValid(currentStep) ? 'disabled' : ''}`}
                  onClick={nextStep}
                  disabled={!isStepValid(currentStep) || isSubmitting}
                >
                  Next
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="btn btn-success" 
                  disabled={isSubmitting || Object.keys(validationErrors).length > 0}
                >
                  {isSubmitting ? (
                    <>
                      <div className="button-spinner"></div>
                      Adding Component...
                    </>
                  ) : (
                    <>
                      <MdCheckCircle />
                      Add Component
                    </>
                  )}
                </button>
              )}
            </div>
            
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={onClose} 
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddComponentModel;
