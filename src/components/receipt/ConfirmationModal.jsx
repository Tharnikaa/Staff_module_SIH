import React from 'react';
import { formatCurrency, maskCustomerId } from '../../utils/formatters';
import { AlertTriangle, Check, X } from 'lucide-react';

export const ConfirmationModal = ({ isOpen, transactionData, onCancel, onConfirm }) => {
  if (!isOpen || !transactionData) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#12355B' }}>
            Confirm Transaction Execution?
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Staff authorization required prior to core banking ledger entry.
          </p>
        </div>

        <div className="modal-body">
          <div 
            style={{ 
              backgroundColor: '#FEF3C7', 
              border: '1px solid #FCD34D', 
              borderRadius: 'var(--radius-sm)', 
              padding: '0.75rem 1rem', 
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}
          >
            <AlertTriangle size={18} style={{ color: '#D97706' }} />
            <div style={{ fontSize: '0.82rem', color: '#92400E' }}>
              Warning: Confirming will mark transaction as completed and lock token against duplicate use.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
            <div className="flex justify-between" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748B' }}>Token ID:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{transactionData.token_id}</span>
            </div>

            <div className="flex justify-between" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748B' }}>Customer:</span>
              <span style={{ fontWeight: 700 }}>{maskCustomerId(transactionData.customer_display_name)}</span>
            </div>

            <div className="flex justify-between" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748B' }}>Service / Type:</span>
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{transactionData.transaction_type}</span>
            </div>

            <div className="flex justify-between" style={{ paddingBottom: '0.25rem' }}>
              <span style={{ color: '#64748B' }}>Amount:</span>
              <span style={{ fontWeight: 700, color: '#12355B', fontSize: '1.1rem' }}>{formatCurrency(transactionData.amount)}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            <X size={16} />
            <span>Cancel</span>
          </button>
          <button className="btn btn-success" onClick={onConfirm}>
            <Check size={16} />
            <span>Confirm & Complete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
