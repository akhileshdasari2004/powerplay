import { useState, useCallback } from 'react';
import { Input, TextArea } from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * InvoiceForm - Form for creating and editing invoices
 * @param {Object} props - Component props
 */
export function InvoiceForm({
  initialData = {},
  customers = [],
  onSubmit,
  onCancel,
  isLoading = false,
  errors = {},
}) {
  const [formData, setFormData] = useState({
    customerId: initialData.customerId || '',
    invoiceNumber: initialData.invoiceNumber || '',
    date: initialData.date || new Date().toISOString().split('T')[0],
    dueDate: initialData.dueDate || '',
    notes: initialData.notes || '',
    items: initialData.items || [{ description: '', quantity: 1, amount: '' }],
    ...initialData,
  });

  const [validationErrors, setValidationErrors] = useState({});

  /**
   * Handle input change
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [validationErrors]);

  /**
   * Handle item change
   */
  const handleItemChange = useCallback((index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  }, []);

  /**
   * Add new line item
   */
  const addItem = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, amount: '' }],
    }));
  }, []);

  /**
   * Remove line item
   */
  const removeItem = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  /**
   * Calculate total
   */
  const calculateTotal = useCallback(() => {
    return formData.items.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + amount * quantity;
    }, 0);
  }, [formData.items]);

  /**
   * Validate form
   */
  const validate = useCallback(() => {
    const errors = {};

    if (!formData.customerId) {
      errors.customerId = 'Customer is required';
    }

    if (!formData.invoiceNumber || formData.invoiceNumber.trim().length < 3) {
      errors.invoiceNumber = 'Invoice number must be at least 3 characters';
    }

    if (!formData.dueDate) {
      errors.dueDate = 'Due date is required';
    }

    if (formData.items.length === 0) {
      errors.items = 'At least one line item is required';
    } else {
      formData.items.forEach((item, index) => {
        if (!item.description || item.description.trim() === '') {
          errors[`items.${index}.description`] = 'Description is required';
        }
        if (!item.amount || parseFloat(item.amount) <= 0) {
          errors[`items.${index}.amount`] = 'Valid amount is required';
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if (!validate()) {
        return;
      }

      const total = calculateTotal();
      onSubmit?.({
        ...formData,
        total,
        customerId: formData.customerId,
      });
    },
    [formData, validate, calculateTotal, onSubmit]
  );

  const containerStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    padding: '24px',
  };

  const sectionStyle = {
    marginBottom: '24px',
  };

  const sectionTitleStyle = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333333',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e0e0e0',
  };

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '16px',
  };

  const itemsContainerStyle = {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  };

  const itemRowStyle = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr auto',
    gap: '12px',
    marginBottom: '12px',
    alignItems: 'end',
  };

  const totalStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e0e0e0',
    marginTop: '16px',
  };

  const totalLabelStyle = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333333',
  };

  const totalValueStyle = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1976d2',
  };

  const buttonGroupStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #e0e0e0',
  };

  const customerOptions = customers.map((c) => ({
    value: String(c._id ?? c.id),
    label: c.company ? `${c.name} (${c.company})` : c.name,
  }));

  return (
    <form onSubmit={handleSubmit} style={containerStyle}>
      {/* Invoice Details */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Invoice Details</h3>

        <div style={rowStyle}>
          <Select
            label="Customer"
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
            options={customerOptions}
            placeholder="Select a customer"
            error={validationErrors.customerId || errors.customerId}
            required
          />

          <Input
            label="Invoice Number"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleChange}
            placeholder="INV-001"
            error={validationErrors.invoiceNumber || errors.invoiceNumber}
            required
          />
        </div>

        <div style={rowStyle}>
          <Input
            label="Invoice Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

          <Input
            label="Due Date"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleChange}
            error={validationErrors.dueDate || errors.dueDate}
            required
          />
        </div>
      </div>

      {/* Line Items */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Line Items</h3>

        <div style={itemsContainerStyle}>
          {/* Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr auto',
              gap: '12px',
              marginBottom: '12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#757575',
              textTransform: 'uppercase',
            }}
          >
            <span>Description</span>
            <span>Qty</span>
            <span>Amount</span>
            <span style={{ width: '40px' }}></span>
          </div>

          {/* Items */}
          {formData.items.map((item, index) => (
            <div key={index} style={itemRowStyle}>
              <Input
                name={`item-description-${index}`}
                value={item.description}
                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                placeholder="Item description"
                error={validationErrors[`items.${index}.description`]}
              />
              <Input
                name={`item-quantity-${index}`}
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                style={{ width: '100%' }}
              />
              <Input
                name={`item-amount-${index}`}
                type="number"
                min="0"
                step="0.01"
                value={item.amount}
                onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                placeholder="0.00"
                error={validationErrors[`items.${index}.amount`]}
              />
              {formData.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    background: '#ffffff',
                    cursor: 'pointer',
                    color: '#f44336',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {/* Add Item Button */}
          <button
            type="button"
            onClick={addItem}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px dashed #e0e0e0',
              borderRadius: '6px',
              background: 'transparent',
              cursor: 'pointer',
              color: '#1976d2',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            + Add Line Item
          </button>
        </div>

        {/* Total */}
        <div style={totalStyle}>
          <span style={totalLabelStyle}>Total:</span>
          <span style={totalValueStyle}>{formatCurrency(calculateTotal())}</span>
        </div>
      </div>

      {/* Notes */}
      <div style={sectionStyle}>
        <TextArea
          label="Notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional notes or terms..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div style={buttonGroupStyle}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {initialData.id ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}

export default InvoiceForm;