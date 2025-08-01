// src/components/OutwardStockModal.js
import React, { useState } from 'react';
import { MdClose, MdRemove, MdWarning, MdCheckCircle, MdNotes, MdPerson } from 'react-icons/md';
import api from '../utils/api';

const OutwardStockModal = ({ component, onClose, onStockUpdated, showNotification }) => {
  const [quantity, setQuantity] = useState('');
  const [reasonOrProject, setReasonOrProject] = useState('');
  const [notes, setNotes] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
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

    if (!reasonOrProject) {
      setFormError('Reason or Project is required for outward transactions.');
      setIsSubmitting(false);
      return;
    }

    if (quantity > component.quantity) {
      setFormError(`Insufficient stock. Available: ${component.quantity}, Requested: ${quantity}`);
      setIsSubmitting(false);
      return;
    }

    const needsApprovalHint = parseInt(quantity) >= 100;
    if (needsApprovalHint && !approvedBy) {
      setFormError('Approval is required for quantities of 100 or more.');
      setIsSubmitting(false);
      return;
    }

    try {
      const dataToSend = {
        quantity: parseInt(quantity),
        reasonOrProject,
        notes,
        approvedBy: needsApprovalHint ? approvedBy : undefined,
      };

      const response = await api.post(`/components/${component._id}/outward`, dataToSend);
      showNotification(`Stock of ${component.componentName} outwarded successfully!`, 'success');
      console.log('Outward successful:', response.data);
      onStockUpdated();
    } catch (err) {
      console.error('Error outwarding stock:', err.response?.data || err);
      setFormError(err.response?.data?.message || 'Failed to outward stock. Please try again.');
      showNotification(err.response?.data?.message || 'Failed to outward stock.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsApprovalHint = parseInt(quantity) >= 100;
  const isQuantityValid = quantity && quantity > 0 && quantity <= component.quantity;
  const stockPercentage = component.quantity > 0 ? ((component.quantity - quantity) / component.quantity) * 100 : 0;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <div style={styles.headerContent}>
            <div style={styles.headerIcon}>
              <MdRemove />
            </div>
            <div style={styles.headerText}>
              <h2 style={styles.modalTitle}>Outward Stock</h2>
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
                <MdRemove style={styles.labelIcon} />
                Quantity to Remove *
              </label>
              <div style={styles.inputWrapper}>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  max={component.quantity}
                  required
                  style={{
                    ...styles.input,
                    ...(isQuantityValid ? styles.inputValid : {}),
                    ...(quantity && !isQuantityValid ? styles.inputInvalid : {})
                  }}
                  placeholder="Enter quantity"
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
                        width: `${Math.max(stockPercentage, 0)}%`,
                        background: stockPercentage > 50 ? '#10b981' : stockPercentage > 20 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                  <span style={styles.stockText}>
                    Remaining: {component.quantity - quantity} units ({stockPercentage.toFixed(1)}%)
                  </span>
                </div>
              )}
              
              <p style={styles.hintText}>
                Maximum available: {component.quantity} units
              </p>
            </div>

            {/* Reason/Project Input */}
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="reasonOrProject">
                <MdNotes style={styles.labelIcon} />
                Reason / Project *
              </label>
              <input
                type="text"
                id="reasonOrProject"
                value={reasonOrProject}
                onChange={(e) => setReasonOrProject(e.target.value)}
                placeholder="e.g., Project Alpha, Maintenance Work, R&D Testing"
                required
                style={styles.input}
              />
              <p style={styles.hintText}>
                Specify the purpose for stock removal
              </p>
            </div>

            {/* Approval Field (Conditional) */}
            {needsApprovalHint && (
              <div style={styles.approvalSection}>
                <div style={styles.approvalAlert}>
                  <MdWarning style={styles.approvalIcon} />
                  <div>
                    <strong>Approval Required</strong>
                    <p>Large quantity transactions require supervisor approval</p>
                  </div>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="approvedBy">
                    <MdPerson style={styles.labelIcon} />
                    Approved By *
                  </label>
                  <input
                    type="text"
                    id="approvedBy"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    placeholder="Enter supervisor's name or ID"
                    required={needsApprovalHint}
                    style={styles.input}
                  />
                </div>
              </div>
            )}

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
                placeholder="Add any additional details about this transaction..."
                style={styles.textarea}
              />
            </div>

            {/* Transaction Summary */}
            {quantity && isQuantityValid && (
              <div style={styles.summaryCard}>
                <h4 style={styles.summaryTitle}>Transaction Summary</h4>
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Component:</span>
                    <span style={styles.summaryValue}>{component.componentName}</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Quantity:</span>
                    <span style={styles.summaryValue}>{quantity} units</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Estimated Value:</span>
                    <span style={styles.summaryValue}>₹{(quantity * (component.unitPrice || 0)).toFixed(2)}</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Remaining Stock:</span>
                    <span style={styles.summaryValue}>{component.quantity - quantity} units</span>
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
            form="outward-form"
            disabled={isSubmitting || !isQuantityValid || !reasonOrProject}
            style={{
              ...styles.submitButton,
              ...(isSubmitting || !isQuantityValid || !reasonOrProject ? styles.buttonDisabled : {})
            }}
            onClick={handleSubmit}
            onMouseEnter={(e) => {
              if (!isSubmitting && isQuantityValid && reasonOrProject) {
                e.target.style.background = styles.submitButtonHover.background;
                e.target.style.transform = styles.submitButtonHover.transform;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting && isQuantityValid && reasonOrProject) {
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
                <MdRemove style={{ marginRight: '8px' }} />
                Remove Stock
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Fixed Styles Object
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
    padding: '10px', // Reduced padding for better fit
    animation: 'fadeIn 0.3s ease-out'
  },
  
  modalContent: {
    background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
    borderRadius: '16px', // Slightly reduced for better fit
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '95vh', // Increased to use more viewport
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
    padding: '20px 24px', // Reduced padding
    borderBottom: '2px solid #f1f5f9',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    flexShrink: 0 // Prevent shrinking
  },

  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px' // Reduced gap
  },

  headerIcon: {
    width: '40px', // Slightly smaller
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem', // Slightly smaller
    backdropFilter: 'blur(10px)'
  },

  headerText: {
    display: 'flex',
    flexDirection: 'column'
  },

  modalTitle: {
    margin: 0,
    fontSize: '1.3rem', // Slightly smaller
    fontWeight: '700',
    color: 'white',
    lineHeight: '1.2'
  },

  modalSubtitle: {
    margin: '2px 0 0 0',
    fontSize: '0.85rem', // Slightly smaller
    opacity: '0.9',
    fontWeight: '500',
    lineHeight: '1.2'
  },

  closeButton: {
    width: '36px', // Slightly smaller
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
    minHeight: 0 // Important for proper scrolling
  },

  componentInfoCard: {
    margin: '20px 0', // Reduced margin
    padding: '16px', // Reduced padding
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    border: '1px solid #e2e8f0',
    borderRadius: '10px' // Slightly smaller radius
  },

  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', // Smaller min width
    gap: '12px' // Reduced gap
  },

  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },

  infoLabel: {
    fontSize: '0.75rem', // Slightly smaller
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '3px'
  },

  infoValue: {
    fontSize: '0.9rem', // Slightly smaller
    color: '#1f2937',
    fontWeight: '700'
  },

  form: {
    paddingBottom: '20px' // Add bottom padding
  },

  formGroup: {
    marginBottom: '20px' // Reduced margin
  },

  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px', // Reduced gap
    fontSize: '0.9rem', // Slightly smaller
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px' // Reduced margin
  },

  labelIcon: {
    fontSize: '1rem', // Slightly smaller
    color: '#667eea'
  },

  inputWrapper: {
    position: 'relative'
  },

  input: {
    width: '100%',
    padding: '12px 14px', // Reduced padding
    border: '2px solid #e2e8f0',
    borderRadius: '8px', // Slightly smaller radius
    fontSize: '0.95rem', // Slightly smaller
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
    padding: '12px 14px', // Reduced padding
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    background: '#ffffff',
    resize: 'vertical',
    minHeight: '70px', // Reduced height
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
    marginTop: '10px' // Reduced margin
  },

  stockBar: {
    height: '6px', // Slightly smaller
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
    fontSize: '0.8rem', // Slightly smaller
    color: '#6b7280',
    fontWeight: '500'
  },

  hintText: {
    fontSize: '0.8rem', // Slightly smaller
    color: '#6b7280',
    margin: '6px 0 0 0',
    fontStyle: 'italic'
  },

  approvalSection: {
    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    border: '1px solid #fde68a',
    borderRadius: '10px',
    padding: '16px', // Reduced padding
    marginBottom: '20px'
  },

  approvalAlert: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    marginBottom: '16px'
  },

  approvalIcon: {
    fontSize: '1.3rem',
    color: '#f59e0b',
    marginTop: '2px'
  },

  summaryCard: {
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    border: '1px solid #bae6fd',
    borderRadius: '10px',
    padding: '16px', // Reduced padding
    marginBottom: '20px'
  },

  summaryTitle: {
    margin: '0 0 12px 0',
    fontSize: '1rem', // Slightly smaller
    fontWeight: '700',
    color: '#0c4a6e'
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', // Smaller min width
    gap: '10px'
  },

  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },

  summaryLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
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
    padding: '12px', // Reduced padding
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
    padding: '16px 24px', // Reduced padding
    borderTop: '1px solid #f1f5f9',
    background: '#ffffff',
    flexShrink: 0 // Prevent shrinking
  },

  cancelButton: {
    padding: '10px 20px', // Reduced padding
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
    padding: '10px 20px', // Reduced padding
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
  },

  submitButtonHover: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
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

export default OutwardStockModal;
