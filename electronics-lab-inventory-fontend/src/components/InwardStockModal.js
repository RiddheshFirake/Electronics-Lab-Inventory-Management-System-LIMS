// src/components/InwardStockModal.js
import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';
import api from '../utils/api';
import './InwardStockModal.css';

const InwardStockModal = ({ component, onClose, onStockUpdated, showNotification }) => { // Added showNotification prop
  const [quantity, setQuantity] = useState('');
  const [reasonOrProject, setReasonOrProject] = useState('');
  const [notes, setNotes] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [supplierInvoice, setSupplierInvoice] = useState('');
  const [unitCost, setUnitCost] = useState('');

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

    try {
      const dataToSend = {
        quantity: parseInt(quantity),
        reasonOrProject: reasonOrProject || 'Stock replenishment',
        notes,
        batchNumber,
        supplierInvoice,
        unitCost: unitCost ? parseFloat(unitCost) : undefined,
      };

      const response = await api.post(`/components/${component._id}/inward`, dataToSend);
      showNotification(`Stock of ${component.componentName} inwarded successfully!`, 'success'); // Trigger success notification
      console.log('Inward successful:', response.data);
      onStockUpdated();
    } catch (err) {
      console.error('Error inwarding stock:', err.response?.data || err);
      setFormError(err.response?.data?.message || 'Failed to inward stock. Please try again.');
      showNotification(err.response?.data?.message || 'Failed to inward stock.', 'error'); // Trigger error notification
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Inward Stock for: {component.componentName} ({component.partNumber})</h2>
          <button className="close-button" onClick={onClose}>
            <MdClose />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="stock-modal-form">
          {formError && <p className="form-error">{formError}</p>}
          {/* Removed successMessage display from here */}

          <div className="form-group">
            <label htmlFor="quantity">Quantity to Add *</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reasonOrProject">Reason / Project</label>
            <input
              type="text"
              id="reasonOrProject"
              value={reasonOrProject}
              onChange={(e) => setReasonOrProject(e.target.value)}
              placeholder="e.g., Replenishment, Project X"
            />
          </div>

          <div className="form-group">
            <label htmlFor="unitCost">Unit Cost (Optional)</label>
            <input
              type="number"
              id="unitCost"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              min="0"
              step="0.01"
              placeholder="Cost per unit"
            />
          </div>

          <div className="form-group">
            <label htmlFor="batchNumber">Batch Number (Optional)</label>
            <input
              type="text"
              id="batchNumber"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="supplierInvoice">Supplier Invoice (Optional)</label>
            <input
              type="text"
              id="supplierInvoice"
              value={supplierInvoice}
              onChange={(e) => setSupplierInvoice(e.target.value)}
            />
          </div>

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
              {isSubmitting ? 'Inwarding...' : 'Inward Stock'}
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

export default InwardStockModal;