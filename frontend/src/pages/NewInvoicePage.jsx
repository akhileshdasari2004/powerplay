import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { invoiceApi, mapFormToPayload } from '../services/invoiceApi';
import { customerApi } from '../services/customerApi';
import InvoiceForm from '../components/InvoiceForm';
import Button from '../components/ui/Button';

export function NewInvoicePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCustomers, setIsFetchingCustomers] = useState(true);
  const [customerError, setCustomerError] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setCustomerError(null);
        const customerList = await customerApi.getCustomers();
        setCustomers(customerList);
      } catch (error) {
        setCustomerError(error.message || 'Failed to load customers');
        toast.error('Failed to load customers');
      } finally {
        setIsFetchingCustomers(false);
      }
    };
    fetchCustomers();
  }, [toast]);

  const handleSubmit = useCallback(
    async (formData) => {
      try {
        setIsLoading(true);
        const payload = mapFormToPayload(formData);
        const invoice = await invoiceApi.createInvoice(payload);
        toast.success(`Invoice ${invoice.invoiceNumber || invoice.invoiceId} created successfully`);
        navigate('/dashboard');
      } catch (error) {
        toast.error(error.message || 'Failed to create invoice');
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, toast]
  );

  const handleCancel = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  if (isFetchingCustomers) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#757575' }}>
        Loading customers...
      </div>
    );
  }

  if (customerError) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <p style={{ color: '#f44336', marginBottom: '16px' }}>{customerError}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#333333', margin: 0 }}>
          Create New Invoice
        </h1>
      </div>
      <InvoiceForm
        customers={customers}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}

export default NewInvoicePage;
