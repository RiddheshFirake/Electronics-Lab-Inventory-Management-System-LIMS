// src/components/InwardStockModal.js
import React, { useState } from 'react';
import { MdClose, MdAdd, MdWarning, MdCheckCircle, MdNotes, MdPerson, MdLocalShipping } from 'react-icons/md';
import api from '../utils/api';

const InwardStockModal = ({ component, onClose, onStockUpdated, showNotification }) => {
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    if (quantity <= 0) {
      setFormError('Quantity must be a positive number.');
      setIsSubmitting(false);
      return;
    }

    if (!supplier) {
      setFormError('Supplier information is required for inward transactions.');
      setIsSubmitting(false);
      return;
    }

    if (purchasePrice && purchasePrice < 0) {
      setFormError('Purchase price cannot be negative.');
      setIsSubmitting(false);
      return;
    }

    try {
      const dataToSend = {
        quantity: parseInt(quantity),
        supplier: supplier.trim(),
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const response = await api.post(`/components/${component._id}/inward`, dataToSend);
      showNotification(`Stock of ${component.componentName} added successfully!`, 'success');
      console.log('Inward successful:', response.data);
      onStockUpdated();
    } catch (err) {
      console.error('Error adding stock:', err.response?.data || err);
      setFormError(err.response?.data?.message || 'Failed to add stock. Please try again.');
      showNotification(err.response?.data?.message || 'Failed to add stock.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isQuantityValid = quantity && quantity > 0;
  const newTotalStock = component.quantity + parseInt(quantity || 0);
  const stockIncrease = quantity ? ((parseInt(quantity) / component.quantity) * 100) : 0;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <div style={styles.headerContent}>
            <div style={styles.headerIcon}>
              <MdAdd />
            </div>
            <div style={styles.headerText}>
              <h2 style={styles.modalTitle}>Add Stock</h2>
              <p style={styles.modalSubtitle}>
                {component.componentName} ({component.partNumber})
              </p>
            </div>
          </div>
          <button 
            style={styles.closeButton} 
            onClick={onClose}
            onMouseEnter={(e) => e.target.style.background = styles.closeButtonHover.background}
            onMouseLeave={(e) => e.target.style.background = styles.closeButton.background}
          >
            <MdClose />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div style={styles.modalBody}>
          {/* Component Info Card */}
          <div style={styles.componentInfoCard}>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Current Stock</span>
                <span style={styles.infoValue}>{component.quantity} units</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Location</span>
                <span style={styles.infoValue}>{component.location || 'N/A'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Category</span>
                <span style={styles.infoValue}>{component.category || 'N/A'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Unit Price</span>
                <span style={styles.infoValue}>₹{component.unitPrice?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Error Message */}
            {formError && (
              <div style={styles.errorMessage}>
                <MdWarning style={styles.errorIcon} />
                <span>{formError}</span>
              </div>
            )}

            {/* Quantity Input */}
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="quantity">
                <MdAdd style={styles.labelIcon} />
                Quantity to Add *
              </label>
              <div style={styles.inputWrapper}>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  required
                  style={{
                    ...styles.input,
                    ...(isQuantityValid ? styles.inputValid : {}),
                    ...(quantity && !isQuantityValid ? styles.inputInvalid : {})
                  }}
                  placeholder="Enter quantity to add"
                />
                {quantity && (
                  <div style={styles.quantityIndicator}>
                    {isQuantityValid ? (
                      <MdCheckCircle style={styles.validIcon} />
                    ) : (
                      <MdWarning style={styles.invalidIcon} />
                    )}
                  </div>
                )}
              </div>
              
              {/* Stock Level Indicator */}
              {quantity && isQuantityValid && (
                <div style={styles.stockIndicator}>
                  <div style={styles.stockBar}>
                    <div 
                      style={{
                        ...styles.stockBarFill,
                        width: `100%`,
                        background: '#10b981'
                      }}
                    />
                  </div>
                  <span style={styles.stockText}>
                    New Total: {newTotalStock} units (+{stockIncrease.toFixed(1)}% increase)
                  </span>
                </div>
              )}
              
              <p style={styles.hintText}>
                Adding to current stock of {component.quantity} units
              </p>
            </div>

            {/* Supplier Input */}
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="supplier">
                <MdLocalShipping style={styles.labelIcon} />
                Supplier *
              </label>
              <input
                type="text"
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g., ABC Electronics, XYZ Components, Local Vendor"
                required
                style={styles.input}
              />
              <p style={styles.hintText}>
                Name of the supplier or vendor
              </p>
            </div>

            {/* Purchase Price Input */}
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="purchasePrice">
                <MdNotes style={styles.labelIcon} />
                Purchase Price per Unit (Optional)
              </label>
              <input
                type="number"
                id="purchasePrice"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0.00"
                style={styles.input}
              />
              <p style={styles.hintText}>
                Cost per unit for this purchase (for cost tracking)
              </p>
            </div>

            {/* Invoice Number Input */}
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="invoiceNumber">
                <MdNotes style={styles.labelIcon} />
                Invoice/PO Number (Optional)
              </label>
              <input
                type="text"
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g., INV-2024-001, PO-12345"
                style={styles.input}
              />
              <p style={styles.hintText}>
                Reference number for purchase documentation
              </p>
            </div>

            {/* Notes Input */}
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="notes">
                <MdNotes style={styles.labelIcon} />
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                placeholder="Add any additional details about this purchase..."
                style={styles.textarea}
              />
            </div>

            {/* Transaction Summary */}
            {quantity && isQuantityValid && (
              <div style={styles.summaryCard}>
                <h4 style={styles.summaryTitle}>Purchase Summary</h4>
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Component:</span>
                    <span style={styles.summaryValue}>{component.componentName}</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Adding Quantity:</span>
                    <span style={styles.summaryValue}>{quantity} units</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Total Cost:</span>
                    <span style={styles.summaryValue}>
                      ₹{purchasePrice ? (quantity * parseFloat(purchasePrice)).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>New Total Stock:</span>
                    <span style={styles.summaryValue}>{newTotalStock} units</span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div style={styles.modalFooter}>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSubmitting}
            style={{
              ...styles.cancelButton,
              ...(isSubmitting ? styles.buttonDisabled : {})
            }}
            onMouseEnter={(e) => !isSubmitting && (e.target.style.background = styles.cancelButtonHover.background)}
            onMouseLeave={(e) => !isSubmitting && (e.target.style.background = styles.cancelButton.background)}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="inward-form"
            disabled={isSubmitting || !isQuantityValid || !supplier}
            style={{
              ...styles.submitButton,
              ...(isSubmitting || !isQuantityValid || !supplier ? styles.buttonDisabled : {})
            }}
            onClick={handleSubmit}
            onMouseEnter={(e) => {
              if (!isSubmitting && isQuantityValid && supplier) {
                e.target.style.background = styles.submitButtonHover.background;
                e.target.style.transform = styles.submitButtonHover.transform;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting && isQuantityValid && supplier) {
                e.target.style.background = styles.submitButton.background;
                e.target.style.transform = 'none';
              }
            }}
          >
            {isSubmitting ? (
              <span style={styles.loadingContent}>
                <div style={styles.spinner} />
                Processing...
              </span>
            ) : (
              <>
                <MdAdd style={{ marginRight: '8px' }} />
                Add Stock
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Styles Object (adapted for inward/add theme)
const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '10px',
    animation: 'fadeIn 0.3s ease-out'
  },
  
  modalContent: {
    background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
    borderRadius: '16px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '95vh',
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '2px solid #f1f5f9',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Green gradient for add
    color: 'white',
    flexShrink: 0
  },

  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },

  headerIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    backdropFilter: 'blur(10px)'
  },

  headerText: {
    display: 'flex',
    flexDirection: 'column'
  },

  modalTitle: {
    margin: 0,
    fontSize: '1.3rem',
    fontWeight: '700',
    color: 'white',
    lineHeight: '1.2'
  },

  modalSubtitle: {
    margin: '2px 0 0 0',
    fontSize: '0.85rem',
    opacity: '0.9',
    fontWeight: '500',
    lineHeight: '1.2'
  },

  closeButton: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1.3rem',
    transition: 'all 0.2s ease'
  },

  closeButtonHover: {
    background: 'rgba(255, 255, 255, 0.3)'
  },

  modalBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 24px',
    minHeight: 0
  },

  componentInfoCard: {
    margin: '20px 0',
    padding: '16px',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', // Light green background
    border: '1px solid #bbf7d0',
    borderRadius: '10px'
  },

  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: '12px'
  },

  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },

  infoLabel: {
    fontSize: '0.75rem',
    color: '#166534', // Dark green for labels
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '3px'
  },

  infoValue: {
    fontSize: '0.9rem',
    color: '#1f2937',
    fontWeight: '700'
  },

  form: {
    paddingBottom: '20px'
  },

  formGroup: {
    marginBottom: '20px'
  },

  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  },

  labelIcon: {
    fontSize: '1rem',
    color: '#10b981' // Green icons
  },

  inputWrapper: {
    position: 'relative'
  },

  input: {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    background: '#ffffff',
    boxSizing: 'border-box'
  },

  inputValid: {
    borderColor: '#10b981',
    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
  },

  inputInvalid: {
    borderColor: '#ef4444',
    boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
  },

  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    background: '#ffffff',
    resize: 'vertical',
    minHeight: '70px',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },

  quantityIndicator: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)'
  },

  validIcon: {
    color: '#10b981',
    fontSize: '1.1rem'
  },

  invalidIcon: {
    color: '#ef4444',
    fontSize: '1.1rem'
  },

  stockIndicator: {
    marginTop: '10px'
  },

  stockBar: {
    height: '6px',
    background: '#f1f5f9',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '6px'
  },

  stockBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'all 0.3s ease'
  },

  stockText: {
    fontSize: '0.8rem',
    color: '#166534', // Dark green text
    fontWeight: '500'
  },

  hintText: {
    fontSize: '0.8rem',
    color: '#6b7280',
    margin: '6px 0 0 0',
    fontStyle: 'italic'
  },

  summaryCard: {
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', // Light green summary
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '20px'
  },

  summaryTitle: {
    margin: '0 0 12px 0',
    fontSize: '1rem',
    fontWeight: '700',
    color: '#166534' // Dark green title
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '10px'
  },

  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },

  summaryLabel: {
    fontSize: '0.75rem',
    color: '#166534',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  summaryValue: {
    fontSize: '0.9rem',
    color: '#1f2937',
    fontWeight: '700'
  },

  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '20px',
    color: '#dc2626'
  },

  errorIcon: {
    fontSize: '1.1rem',
    color: '#dc2626'
  },

  modalFooter: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    padding: '16px 24px',
    borderTop: '1px solid #f1f5f9',
    background: '#ffffff',
    flexShrink: 0
  },

  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#374151',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  cancelButtonHover: {
    background: '#f9fafb'
  },

  submitButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Green gradient for add
    color: 'white',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  },

  submitButtonHover: {
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    transform: 'translateY(-2px)'
  },

  buttonDisabled: {
    opacity: '0.5',
    cursor: 'not-allowed',
    transform: 'none !important'
  },

  loadingContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },

  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Custom scrollbar for modal body */
  .modal-body::-webkit-scrollbar {
    width: 6px;
  }
  
  .modal-body::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  .modal-body::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .modal-body::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Responsive adjustments */
  @media (max-height: 600px) {
    .modal-content {
      max-height: 98vh !important;
    }
  }

  @media (max-width: 640px) {
    .modal-content {
      margin: 5px;
      max-height: 98vh;
      border-radius: 12px;
    }
  }
`;
document.head.appendChild(styleSheet);

export default InwardStockModal;
