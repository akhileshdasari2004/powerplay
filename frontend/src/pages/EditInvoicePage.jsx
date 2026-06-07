import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { invoiceApi } from '../services/invoiceApi';
import { customerApi } from '../services/customerApi';
import InvoiceForm from '../components/InvoiceForm';
import Button from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/Modal';

export function EditInvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [invoice, setInvoice] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [invoiceData, customerList] = await Promise.all([
          invoiceApi.getInvoice(id),
          customerApi.getCustomers(),
        ]);
        setInvoice(invoiceData);
        setCustomers(customerList);
      } catch (error) {
        toast.error('Failed to load invoice');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, toast]);

  const handleSubmit = useCallback(
    async (formData) => {
      try {
        setIsSaving(true);
        await invoiceApi.updateInvoice(id, formData);
        toast.success('Invoice updated successfully');
      } catch (error) {
        toast.error(error.message || 'Failed to update invoice');
      } finally {
        setIsSaving(false);
      }
    },
    [id, toast]
  );

  const handleCancel = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      await invoiceApi.deleteInvoice(id);
      toast.success('Invoice deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Failed to delete invoice');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }, [id, navigate, toast]);

  const handleSend = useCallback(async () => {
    try {
      await invoiceApi.sendInvoice(id);
      toast.success('Invoice sent successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to send invoice');
    }
  }, [id, toast]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ color: '#757575' }}>Loading invoice...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#333333', margin: 0 }}>
          Edit Invoice {invoice?.invoiceNumber}
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="outline" onClick={handleSend} disabled={invoice?.status === 'paid'}>
            Send Invoice
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
        </div>
      </div>

      <InvoiceForm
        initialData={invoice}
        customers={customers}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSaving}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${invoice?.invoiceNumber}? This action cannot be undone.`}
        confirmText="Delete"
        loading={isDeleting}
      />
    </div>
  );
}

export default EditInvoicePage;