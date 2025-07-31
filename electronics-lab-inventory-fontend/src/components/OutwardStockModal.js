// src/components/OutwardStockModal.js
import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';
import api from '../utils/api';
import './OutwardStockModal.css';

const OutwardStockModal = ({ component, onClose, onStockUpdated, showNotification }) => { // Added showNotification prop
  const [quantity, setQuantity] = useState('');
  const [reasonOrProject, setReasonOrProject] = useState('');
  const [notes, setNotes] = useState('');
  const [approvedBy, setApprovedBy] = useState('');

  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed successMessage state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    // Removed setSuccessMessage

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
      showNotification(`Stock of ${component.componentName} outwarded successfully!`, 'success'); // Trigger success notification
      console.log('Outward successful:', response.data);
      onStockUpdated();
    } catch (err) {
      console.error('Error outwarding stock:', err.response?.data || err);
      setFormError(err.response?.data?.message || 'Failed to outward stock. Please try again.');
      showNotification(err.response?.data?.message || 'Failed to outward stock.', 'error'); // Trigger error notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsApprovalHint = parseInt(quantity) >= 100;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Outward Stock for: {component.componentName} ({component.partNumber})</h2>
          <button className="close-button" onClick={onClose}>
            <MdClose />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="stock-modal-form">
          {formError && <p className="form-error">{formError}</p>}
          {/* Removed successMessage display from here */}

          <div className="form-group">
            <label htmlFor="quantity">Quantity to Deduct *</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max={component.quantity}
              required
            />
            <p className="hint-text">Current Stock: {component.quantity}</p>
          </div>

          <div className="form-group">
            <label htmlFor="reasonOrProject">Reason / Project *</label>
            <input
              type="text"
              id="reasonOrProject"
              value={reasonOrProject}
              onChange={(e) => setReasonOrProject(e.target.value)}
              placeholder="e.g., Project A, Repair Work"
              required
            />
          </div>

          {needsApprovalHint && (
            <div className="form-group approval-required">
              <label htmlFor="approvedBy">Approved By (User ID/Name) *</label>
              <input
                type="text"
                id="approvedBy"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                placeholder="Enter Approver's User ID or Name"
                required={needsApprovalHint}
              />
              <p className="hint-text approval-hint">Approval is required for quantities of 100 or more.</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
            ></textarea>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Outwarding...' : 'Outward Stock'}
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

export default OutwardStockModal;