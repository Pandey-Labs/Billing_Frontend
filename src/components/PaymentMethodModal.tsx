import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

interface PaymentMethodModalProps {
  show: boolean;
  onHide: () => void;
  onSelectPaymentMethod: (method: 'cash' | 'card' | 'online') => void;
  processing: boolean;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  show,
  onHide,
  onSelectPaymentMethod,
  processing,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'card' | 'online' | null>(null);

  const paymentMethods = [
    {
      key: 'cash',
      icon: 'bi-cash-stack',
      title: 'Cash',
      description: 'Customer pays with cash',
      color: 'success',
    },
    {
      key: 'card',
      icon: 'bi-credit-card',
      title: 'Card',
      description: 'Customer pays with debit/credit card',
      color: 'primary',
    },
    {
      key: 'online',
      icon: 'bi-wifi',
      title: 'Online',
      description: 'Customer pays via online transfer/UPI',
      color: 'info',
    },
  ];

  const handleMethodSelect = (method: 'cash' | 'card' | 'online') => {
    setSelectedMethod(method);
  };

  const handleCompletePayment = () => {
    if (selectedMethod) {
      onSelectPaymentMethod(selectedMethod);
    }
  };

  const handleModalHide = () => {
    setSelectedMethod(null);
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={handleModalHide}
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-credit-card me-2"></i>
          Select Payment Method
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted mb-4">
          Choose how the customer is paying for this order:
        </p>
        
        <div className="d-grid gap-3">
          {paymentMethods.map((method) => (
            <Button
              key={method.key}
              variant={selectedMethod === method.key ? method.color : `outline-${method.color}`}
              className="d-flex align-items-center gap-3 p-3 text-start"
              onClick={() => handleMethodSelect(method.key as 'cash' | 'card' | 'online')}
              disabled={processing}
            >
              <div
                className={`d-flex align-items-center justify-content-center rounded-circle bg-${method.color} bg-opacity-10`}
                style={{ width: '48px', height: '48px' }}
              >
                <i className={`bi ${method.icon} text-${method.color}`} style={{ fontSize: '1.25rem' }}></i>
              </div>
              <div className="flex-grow-1">
                <div className="fw-semibold">{method.title}</div>
                <div className="small text-muted">{method.description}</div>
              </div>
              {selectedMethod === method.key && (
                <i className="bi bi-check-circle-fill text-success"></i>
              )}
              {selectedMethod !== method.key && (
                <i className="bi bi-chevron-right text-muted"></i>
              )}
            </Button>
          ))}
        </div>

        {/* selectedMethod && (
          // <div className="mt-4 p-3 bg-light rounded">
          //   <div className="d-flex align-items-center">
          //     <i className="bi bi-check-circle-fill text-success me-2"></i>
          //     <span className="fw-semibold">Payment method selected: </span>
          //     <span className="ms-1 text-capitalize">{selectedMethod}</span>
          //   </div>
          // </div>
        // )*/}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleModalHide} disabled={processing}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleCompletePayment}
          disabled={!selectedMethod || processing}
          className="d-flex align-items-center"
        >
          {processing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing...
            </>
          ) : (
            <>
              <i className="bi bi-check-circle me-2"></i>
              Complete Payment
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentMethodModal;
