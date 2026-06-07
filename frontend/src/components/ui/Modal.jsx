import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal - Dialog modal component with backdrop
 * @param {Object} props - Component props
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
}) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (event) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const sizeStyles = {
    small: { maxWidth: '400px' },
    medium: { maxWidth: '560px' },
    large: { maxWidth: '720px' },
    fullscreen: { maxWidth: '100%', width: '100%', height: '100%' },
  };

  const backdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'modal-backdrop-enter 0.2s ease-out',
  };

  const modalStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    width: '100%',
    margin: '16px',
    maxHeight: 'calc(100vh - 32px)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'modal-enter 0.3s ease-out',
    ...sizeStyles[size],
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e0e0e0',
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333333',
    margin: 0,
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    color: '#757575',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  };

  const bodyStyle = {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  };

  const footerStyle = footer
    ? {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '8px',
        padding: '16px 20px',
        borderTop: '1px solid #e0e0e0',
      }
    : null;

  const handleBackdropClick = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <>
      <style>
        {`
          @keyframes modal-backdrop-enter {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes modal-enter {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
      <div style={backdropStyle} onClick={handleBackdropClick}>
        <div style={modalStyle} role="dialog" aria-modal="true">
          <div style={headerStyle}>
            <h2 style={titleStyle}>{title}</h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                style={closeButtonStyle}
                aria-label="Close modal"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>

          <div style={bodyStyle}>{children}</div>

          {footer && <div style={footerStyle}>{footer}</div>}
        </div>
      </div>
    </>
  );

  // Portal to body
  return createPortal(modalContent, document.body);
}

/**
 * ConfirmModal - Confirmation dialog modal
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const buttonVariantStyles = {
    danger: { backgroundColor: '#f44336', color: '#ffffff' },
    primary: { backgroundColor: '#1976d2', color: '#ffffff' },
    warning: { backgroundColor: '#ff9800', color: '#ffffff' },
  };

  const confirmButtonStyle = {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    transition: 'background-color 0.2s',
    ...buttonVariantStyles[variant],
  };

  const cancelButtonStyle = {
    padding: '10px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    color: '#333333',
    transition: 'background-color 0.2s',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      footer={
        <>
          <button
            onClick={onClose}
            style={cancelButtonStyle}
            disabled={loading}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={confirmButtonStyle}
            disabled={loading}
          >
            {loading ? 'Loading...' : confirmText}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, color: '#555555', lineHeight: 1.5 }}>{message}</p>
    </Modal>
  );
}

export default Modal;