import React, { useState, useEffect } from 'react';
import { 
  MdAdd, 
  MdBarcodeReader, 
  MdSearch, 
  MdCheckCircle, 
  MdError,
  MdCameraAlt,
  MdEdit,
  MdSave,
  MdCancel,
  MdDelete,
  MdReplay,
  MdKeyboard,
  MdClose,
  MdWarning,
  MdUpdate
} from 'react-icons/md';
import BarcodeReader from 'react-barcode-reader';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import './ScanPage.css';

const ScanPage = () => {
  const [scanResult, setScanResult] = useState(null);
  const [formData, setFormData] = useState(null);
  const [status, setStatus] = useState('initial'); // initial, scanning, loading, success, error, duplicate-found
  const [scanMode, setScanMode] = useState('manual'); // 'camera' or 'manual'
  const [manualBarcode, setManualBarcode] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [predefinedCategories, setPredefinedCategories] = useState([]);
  const [notification, setNotification] = useState(null);
  const [savedComponent, setSavedComponent] = useState(null);
  const [existingComponent, setExistingComponent] = useState(null); // For duplicate handling
  const [updateMode, setUpdateMode] = useState('add'); // 'add' or 'replace'
  const [cameraPermission, setCameraPermission] = useState('unknown'); // 'unknown', 'granted', 'denied'

  // Fetch predefined categories on load for the form
  useEffect(() => {
    const fetchPredefinedCategories = async () => {
      try {
        const response = await api.get('/components/predefined-categories');
        setPredefinedCategories(response.data.data);
      } catch (err) {
        console.error('Error fetching predefined categories:', err);
      }
    };
    fetchPredefinedCategories();
  }, []);

  // Check camera permission status
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'camera' });
        setCameraPermission(result.state);
        
        result.addEventListener('change', () => {
          setCameraPermission(result.state);
        });
      } catch (err) {
        console.log('Permission API not supported');
      }
    };
    
    if (navigator.permissions) {
      checkCameraPermission();
    }
  }, []);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message, type, componentData = null) => {
    console.log(`Notification (${type}): ${message}`);
    setNotification({ message, type });
    if (componentData) {
      setSavedComponent(componentData);
    }
  };

  const checkIfComponentExists = async (barcode, partNumber) => {
    try {
      console.log('Frontend checking exists:', { barcode, partNumber }); // Debug log
      
      const response = await api.get(`/components/check-exists?barcode=${barcode}&partNumber=${partNumber}`);
      
      console.log('Check exists response:', response.data); // Debug log
      
      return response.data.exists ? response.data.component : null;
    } catch (err) {
      console.error('Error checking component existence:', err);
      
      // If check-exists endpoint fails, try search endpoint
      try {
        console.log('Fallback to search endpoint'); // Debug log
        
        const searchResponse = await api.get(`/components/search?partNumber=${partNumber}`);
        const components = searchResponse.data.data || [];
        
        console.log('Search response:', components.length, 'components found'); // Debug log
        
        return components.length > 0 ? components[0] : null;
      } catch (searchErr) {
        console.error('Error searching components:', searchErr);
        return null;
      }
    }
  };

  // Simplified camera permission check - don't request stream here
  const checkCameraAccess = async () => {
    try {
      // Just check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }
      return true;
    } catch (err) {
      console.error('Camera check failed:', err);
      setError('Camera not supported in this browser. Please use Chrome, Firefox, or Safari.');
      return false;
    }
  };

  const handleStartScan = async () => {
    if (scanMode === 'camera') {
      const hasCamera = await checkCameraAccess();
      if (hasCamera) {
        setStatus('scanning');
        setError(null);
      } else {
        setStatus('error');
      }
    }
  };

  const handleScan = async (barcode) => {
    if (status !== 'scanning' && status !== 'initial') return;

    setStatus('loading');
    setScanResult(barcode);
    setError(null);

    try {
      showNotification(`Barcode detected: ${barcode}`, 'info');
      // Call the new backend endpoint to fetch product data
      const response = await api.post('/components/scan', { barcode });

      if (response.data.success) {
        const scannedData = {
          ...response.data.data,
          status: 'Active',
          quantity: 1,
          tags: response.data.data.tags ? response.data.data.tags.join(', ') : ''
        };
        
        // Check if component already exists
        const existing = await checkIfComponentExists(barcode, scannedData.partNumber);
        
        if (existing) {
          setExistingComponent(existing);
          setFormData({
            ...scannedData,
            quantity: existing.quantity + 1 // Default to current + 1
          });
          setStatus('duplicate-found');
          showNotification(`Component already exists! Current quantity: ${existing.quantity}`, 'warning');
        } else {
          setFormData(scannedData);
          setStatus('success');
        }
      } else {
        setError(response.data.message || 'Product details not found.');
        setStatus('error');
      }
    } catch (err) {
      console.error('API error:', err);
      setError(err.response?.data?.message || 'Failed to fetch product details.');
      setStatus('error');
    }
  };

  const handleError = (err) => {
    console.error('Scanner error:', err);
    
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      setError('Camera permission denied. Please allow camera access in your browser settings and refresh the page.');
      setCameraPermission('denied');
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      setError('No camera found. Please make sure your device has a camera.');
    } else if (err.name === 'NotSupportedError') {
      setError('Camera not supported in this browser. Try using Chrome or Firefox.');
    } else if (err.name === 'NotReadableError') {
      setError('Camera is already in use by another application. Please close other apps using the camera.');
    } else {
      setError('Camera error: ' + (err.message || 'Unknown error') + '. Please try refreshing the page.');
    }
    
    setStatus('error');
  };
  
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleScan(manualBarcode.trim());
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const dataToSend = {
        ...formData,
        quantity: parseInt(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
        criticalLowThreshold: parseInt(formData.criticalLowThreshold),
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [],
      };

      let response;
      let actionType = 'added';

      if (existingComponent) {
        // Update existing component
        if (updateMode === 'add') {
          // Add to existing quantity
          const newQuantity = existingComponent.quantity + parseInt(formData.quantity);
          response = await api.put(`/components/${existingComponent._id}`, {
            ...dataToSend,
            quantity: newQuantity
          });
          actionType = 'updated (quantity added)';
        } else {
          // Replace entire component
          response = await api.put(`/components/${existingComponent._id}`, dataToSend);
          actionType = 'updated (replaced)';
        }
      } else {
        // Create new component
        response = await api.post('/components', dataToSend);
        actionType = 'added';
      }
      
      // Enhanced success notification with component details
      showNotification(`Component ${actionType} successfully!`, 'success', {
        name: dataToSend.componentName,
        partNumber: dataToSend.partNumber,
        quantity: dataToSend.quantity,
        location: dataToSend.location,
        action: actionType
      });
      
      // Set status to show success confirmation
      setStatus('component-saved');
      
      // Reset form after 3 seconds
      setTimeout(() => {
        handleReset();
      }, 3000);
      
    } catch (err) {
      console.error('Error saving component:', err);
      
      // Handle duplicate error specifically
      if (err.response?.data?.errorCode === 'DUPLICATE_COMPONENT') {
        // If we somehow missed the duplicate check, force a duplicate state
        try {
          const existing = await checkIfComponentExists(scanResult, formData.partNumber);
          if (existing) {
            setExistingComponent(existing);
            setStatus('duplicate-found');
            showNotification(`Component already exists! Current quantity: ${existing.quantity}`, 'warning');
            return;
          }
        } catch (checkErr) {
          console.error('Error re-checking component:', checkErr);
        }
      }
      
      setError(err.response?.data?.message || 'Failed to save component. Please try again.');
      showNotification('Failed to save component.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setFormData(null);
    setStatus('initial');
    setError(null);
    setManualBarcode('');
    setSavedComponent(null);
    setExistingComponent(null);
    setUpdateMode('add');
  };

  const renderContent = () => {
    switch (status) {
      case 'initial':
        return (
          <div className="scan-prompt">
            <div className="scan-options-toggle">
              <button 
                className={`scan-toggle-button ${scanMode === 'camera' ? 'active' : ''}`}
                onClick={() => { setScanMode('camera'); setError(null); }}
              >
                <MdCameraAlt /> Camera Scan
              </button>
              <button 
                className={`scan-toggle-button ${scanMode === 'manual' ? 'active' : ''}`}
                onClick={() => { setScanMode('manual'); setError(null); }}
              >
                <MdKeyboard /> Manual Entry
              </button>
            </div>
            
            {scanMode === 'camera' ? (
              <>
                <MdCameraAlt className="scan-icon" />
                <h3>Start Camera Scan</h3>
                <p>Click the button below to activate your camera and scan a barcode.</p>
                
                {cameraPermission === 'denied' && (
                  <div className="permission-warning">
                    <MdWarning />
                    <p style={{color: '#ff6b6b', marginTop: '10px'}}>
                      Camera permission denied. Please allow camera access in your browser settings and refresh the page.
                    </p>
                  </div>
                )}
                
                <button 
                  className="scan-button" 
                  onClick={handleStartScan}
                  disabled={cameraPermission === 'denied'}
                >
                  <MdSearch />
                  Start Scan
                </button>
                
                <div className="camera-instructions">
                  <h4>📱 Camera Permission Required</h4>
                  <p>This feature needs access to your camera to scan barcodes. Your browser will ask for permission when you start scanning.</p>
                  <ul style={{textAlign: 'left', marginTop: '10px'}}>
                    <li>Make sure your camera is not being used by other apps</li>
                    <li>Allow camera permission when prompted</li>
                    <li>Use good lighting for better scanning results</li>
                    <li>Hold the barcode steady within the scan area</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <MdKeyboard className="scan-icon" />
                <h3>Manual Barcode Entry</h3>
                <p>Enter the barcode number directly to fetch product details.</p>
                <form onSubmit={handleManualSubmit} className="manual-form">
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Enter barcode number"
                    className="manual-input"
                    required
                  />
                  <button type="submit" className="scan-button">
                    <MdSearch />
                    Search
                  </button>
                </form>
              </>
            )}
          </div>
        );
        
      case 'scanning':
        return (
          <div className="scanner-container">
            <div className="scanner-video-wrapper">
              <BarcodeReader
                onScan={handleScan}
                onError={handleError}
                style={{ 
                  width: '100%', 
                  height: '100%',
                  objectFit: 'cover'
                }}
                delay={300}
                facingMode="environment"
                resolution={600}
                showViewFinder={true}
              />
              <div className="scanner-overlay">
                <div className="scanner-line"></div>
                <div className="scanner-corner top-left"></div>
                <div className="scanner-corner top-right"></div>
                <div className="scanner-corner bottom-left"></div>
                <div className="scanner-corner bottom-right"></div>
              </div>
            </div>
            <p className="scan-instructions">
              Point your camera at a barcode to scan it.
            </p>
            <div className="scanner-tips">
              <p>💡 Tips for better scanning:</p>
              <ul>
                <li>Ensure good lighting</li>
                <li>Hold the camera steady</li>
                <li>Keep barcode within the scanning area</li>
                <li>Clean your camera lens if needed</li>
              </ul>
            </div>
            <button className="cancel-button" onClick={handleReset}>
              <MdCancel />
              Cancel Scan
            </button>
          </div>
        );
        
      case 'loading':
        return (
          <div className="status-message">
            <div className="loading-spinner"></div>
            <h3>Searching for product details...</h3>
            <p>Please wait a moment while we retrieve the data for barcode: {scanResult}</p>
          </div>
        );
        
      case 'duplicate-found':
        return (
          <div className="duplicate-form-container">
            <div className="duplicate-header">
              <MdWarning className="warning-icon" />
              <h3>Component Already Exists!</h3>
              <p>This component is already in your inventory. Choose how to proceed:</p>
            </div>
            
            <div className="existing-component-info">
              <h4>Current Component Details:</h4>
              <div className="existing-details">
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{existingComponent.componentName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Current Quantity:</span>
                  <span className="detail-value">{existingComponent.quantity} units</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{existingComponent.location}</span>
                </div>
              </div>
            </div>

            <div className="update-mode-selection">
              <h4>How would you like to proceed?</h4>
              <div className="mode-buttons">
                <button 
                  className={`mode-button ${updateMode === 'add' ? 'active' : ''}`}
                  onClick={() => setUpdateMode('add')}
                >
                  <MdAdd />
                  <div className="mode-content">
                    <strong>Add to Existing</strong>
                    <span>Add quantity to current stock</span>
                  </div>
                </button>
                <button 
                  className={`mode-button ${updateMode === 'replace' ? 'active' : ''}`}
                  onClick={() => setUpdateMode('replace')}
                >
                  <MdUpdate />
                  <div className="mode-content">
                    <strong>Replace Component</strong>
                    <span>Update all component details</span>
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="details-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Component Name *</label>
                  <input 
                    type="text" 
                    name="componentName" 
                    value={formData.componentName} 
                    onChange={handleChange} 
                    required 
                    disabled={updateMode === 'add'}
                  />
                </div>
                <div className="form-group">
                  <label>Manufacturer *</label>
                  <input 
                    type="text" 
                    name="manufacturer" 
                    value={formData.manufacturer} 
                    onChange={handleChange} 
                    required 
                    disabled={updateMode === 'add'}
                  />
                </div>
                <div className="form-group">
                  <label>Part Number *</label>
                  <input 
                    type="text" 
                    name="partNumber" 
                    value={formData.partNumber} 
                    onChange={handleChange} 
                    required 
                    disabled={updateMode === 'add'}
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange} 
                    required
                    disabled={updateMode === 'add'}
                  >
                    <option value="">Select a category</option>
                    {predefinedCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Description *</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    required 
                    rows="3"
                    disabled={updateMode === 'add'}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>
                    {updateMode === 'add' ? 'Quantity to Add *' : 'New Total Quantity *'}
                  </label>
                  <input 
                    type="number" 
                    name="quantity" 
                    value={formData.quantity} 
                    onChange={handleChange} 
                    required 
                    min="0" 
                  />
                  {updateMode === 'add' && (
                    <small className="quantity-help">
                      Current: {existingComponent.quantity} → New Total: {existingComponent.quantity + parseInt(formData.quantity || 0)}
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>Unit Price (₹) *</label>
                  <input 
                    type="number" 
                    name="unitPrice" 
                    value={formData.unitPrice} 
                    onChange={handleChange} 
                    required 
                    min="0" 
                    step="0.01"
                    disabled={updateMode === 'add'}
                  />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input 
                    type="text" 
                    name="location" 
                    value={formData.location} 
                    onChange={handleChange} 
                    required
                    disabled={updateMode === 'add'}
                  />
                </div>
                <div className="form-group">
                  <label>Low Stock Threshold *</label>
                  <input 
                    type="number" 
                    name="criticalLowThreshold" 
                    value={formData.criticalLowThreshold} 
                    onChange={handleChange} 
                    required 
                    min="0"
                    disabled={updateMode === 'add'}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Datasheet Link</label>
                  <input 
                    type="url" 
                    name="datasheetLink" 
                    value={formData.datasheetLink} 
                    onChange={handleChange}
                    disabled={updateMode === 'add'}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Tags (comma-separated)</label>
                  <input 
                    type="text" 
                    name="tags" 
                    value={formData.tags} 
                    onChange={handleChange}
                    disabled={updateMode === 'add'}
                  />
                </div>
              </div>

              <div className="details-actions">
                <button type="button" className="action-button-secondary" onClick={handleReset}>
                  <MdCancel />
                  Cancel
                </button>
                <button type="submit" className="action-button-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      {updateMode === 'add' ? 'Adding...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      {updateMode === 'add' ? <MdAdd /> : <MdUpdate />}
                      {updateMode === 'add' ? 'Add to Stock' : 'Update Component'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        );
        
      case 'success':
        return (
          <div className="details-form-container">
            <div className="details-header">
              <MdCheckCircle className="success-icon" />
              <h3>Details Found!</h3>
              <p>Review and confirm the product details before saving.</p>
            </div>
            <form onSubmit={handleSave} className="details-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Component Name *</label>
                  <input type="text" name="componentName" value={formData.componentName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Manufacturer *</label>
                  <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Part Number *</label>
                  <input type="text" name="partNumber" value={formData.partNumber} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange} required>
                    <option value="">Select a category</option>
                    {predefinedCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Description *</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} required rows="3"></textarea>
                </div>
                <div className="form-group">
                  <label>Initial Quantity *</label>
                  <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="0" />
                </div>
                <div className="form-group">
                  <label>Unit Price (₹) *</label>
                  <input type="number" name="unitPrice" value={formData.unitPrice} onChange={handleChange} required min="0" step="0.01" />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Low Stock Threshold *</label>
                  <input type="number" name="criticalLowThreshold" value={formData.criticalLowThreshold} onChange={handleChange} required min="0" />
                </div>
                <div className="form-group full-width">
                  <label>Datasheet Link</label>
                  <input type="url" name="datasheetLink" value={formData.datasheetLink} onChange={handleChange} />
                </div>
                <div className="form-group full-width">
                  <label>Tags (comma-separated)</label>
                  <input type="text" name="tags" value={formData.tags} onChange={handleChange} />
                </div>
              </div>

              <div className="details-actions">
                <button type="button" className="action-button-secondary" onClick={handleReset}>
                  <MdCancel />
                  Cancel
                </button>
                <button type="submit" className="action-button-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <MdSave />
                      Save Component
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        );
        
      case 'component-saved':
        return (
          <div className="component-saved-container">
            <div className="saved-animation">
              <div className="success-checkmark">
                <MdCheckCircle />
              </div>
              <div className="success-ripple"></div>
            </div>
            <h3>Component {savedComponent?.action || 'saved'} Successfully! 🎉</h3>
            <p>Your component has been {savedComponent?.action || 'added to'} the inventory.</p>
            
            {savedComponent && (
              <div className="saved-component-details">
                <div className="detail-row">
                  <span className="detail-label">Component:</span>
                  <span className="detail-value">{savedComponent.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Part Number:</span>
                  <span className="detail-value">{savedComponent.partNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Quantity:</span>
                  <span className="detail-value">{savedComponent.quantity} units</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{savedComponent.location}</span>
                </div>
              </div>
            )}
            
            <div className="saved-actions">
              <button className="action-button-primary" onClick={handleReset}>
                <MdAdd />
                Scan Another Component
              </button>
            </div>
            
            <p className="auto-reset-text">Automatically returning to scan mode in 3 seconds...</p>
          </div>
        );
        
      case 'error':
        return (
          <div className="status-message">
            <MdError className="error-icon" />
            <h3>Scan Failed</h3>
            <p>{error}</p>
            {cameraPermission === 'denied' && (
              <div className="error-help">
                <h4>To fix camera permission issues:</h4>
                <ol>
                  <li>Click the camera icon in your browser's address bar</li>
                  <li>Select "Allow" for camera access</li>
                  <li>Refresh the page and try again</li>
                </ol>
              </div>
            )}
            <button className="scan-button-error" onClick={handleReset}>
              <MdReplay />
              Try Again
            </button>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="scan-page-wrapper">
      
        <Sidebar />
      
      <div className="scan-main-content-area">
        <div className="scan-navbar-container">
          <Navbar />
        </div>
        
        {/* Enhanced Toast Notification */}
        {notification && (
          <div className={`scan-toast-notification scan-toast-${notification.type}`}>
            <div className="scan-toast-content">
              <div className="scan-toast-icon">
                {notification.type === 'success' && <MdCheckCircle />}
                {notification.type === 'error' && <MdError />}
                {notification.type === 'info' && <MdBarcodeReader />}
                {notification.type === 'warning' && <MdWarning />}
              </div>
              <div className="scan-toast-message">
                <span className="scan-toast-title">
                  {notification.type === 'success' && 'Success!'}
                  {notification.type === 'error' && 'Error!'}
                  {notification.type === 'info' && 'Info'}
                  {notification.type === 'warning' && 'Warning!'}
                </span>
                <span className="scan-toast-text">{notification.message}</span>
              </div>
              <button 
                className="scan-toast-close"
                onClick={() => setNotification(null)}
              >
                <MdClose />
              </button>
            </div>
            <div className="scan-toast-progress"></div>
          </div>
        )}
        
        <div className="scan-content-area">
          <div className="scan-page-content-wrapper">
            <div className="scan-page">
              <div className="scan-header">
                <div className="scan-header-icon">
                  <MdBarcodeReader />
                </div>
                <div className="scan-header-content">
                  <h2>Scan It</h2>
                  <p>Scan a product barcode or enter it manually to quickly add new components.</p>
                </div>
              </div>
              <div className="scan-content">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanPage;
