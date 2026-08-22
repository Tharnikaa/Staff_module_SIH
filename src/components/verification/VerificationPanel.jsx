import React from 'react';
import { formatCurrency, maskCustomerId, formatDateTime } from '../../utils/formatters';
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertCircle, Lock, Loader2, ArrowRight } from 'lucide-react';

export const VerificationPanel = ({ 
  verificationState, // READY, VERIFYING, VERIFIED, INVALID, EXPIRED, ALREADY_USED
  verifiedData, 
  onConfirmClick,
  onResetScan
}) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '430px' }}>
      <div>
        <div className="card-title flex items-center justify-between">
          <span>Verification Workspace</span>
          <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Lock size={14} style={{ color: '#10B981' }} />
            <span>HMAC Active</span>
          </span>
        </div>
        <div className="card-subtitle">
          Backend security verification and staff authorization terminal.
        </div>

        {/* State 1: READY */}
        {verificationState === 'READY' && (
          <div className="flex flex-col items-center justify-center" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <div 
              style={{ 
                width: 56, 
                height: 56, 
                borderRadius: '50%', 
                backgroundColor: '#F1F5F9', 
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <Lock size={26} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#17212B', marginBottom: '0.35rem' }}>
              Waiting for Scan
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: 320 }}>
              Scan a customer QR token or select an entry from the active queue to initiate backend verification.
            </p>
          </div>
        )}

        {/* State 2: VERIFYING */}
        {verificationState === 'VERIFYING' && (
          <div className="flex flex-col items-center justify-center" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <Loader2 size={42} className="animate-spin" style={{ color: '#12355B', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#12355B', marginBottom: '0.35rem' }}>
              VERIFYING SECURITY TOKEN
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
              Authenticating HMAC signature and verifying token non-expiry with backend server...
            </p>
          </div>
        )}

        {/* State 3: VERIFIED */}
        {verificationState === 'VERIFIED' && verifiedData && (
          <div style={{ animation: 'fadeIn 0.25s ease' }}>
            <div 
              style={{ 
                backgroundColor: '#ECFDF5', 
                border: '1px solid #A7F3D0', 
                borderRadius: 'var(--radius-sm)', 
                padding: '0.85rem 1rem', 
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <CheckCircle2 size={22} style={{ color: '#059669' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#065F46', fontSize: '0.9rem' }}>
                  ✓ TOKEN VERIFIED SUCCESSFULLY
                </div>
                <div style={{ fontSize: '0.78rem', color: '#047857' }}>
                  Backend HMAC signature authenticated. Token is valid and unexpired.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                  Customer
                </div>
                <div style={{ fontWeight: 700, color: '#17212B' }}>
                  {maskCustomerId(verifiedData.customer_display_name)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                  Transaction
                </div>
                <div style={{ fontWeight: 700, color: '#17212B', textTransform: 'capitalize' }}>
                  {verifiedData.transaction_type || 'Withdrawal'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                  Amount
                </div>
                <div style={{ fontWeight: 700, color: '#12355B', fontSize: '1.1rem' }}>
                  {formatCurrency(verifiedData.amount)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                  Queue Position
                </div>
                <div style={{ fontWeight: 700, color: '#17212B' }}>
                  #{String(verifiedData.queue_position || 1).padStart(2, '0')}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem', marginBottom: '1.25rem' }}>
              <div>Token ID: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#17212B' }}>{verifiedData.token_id}</span></div>
              <div>Verified: {formatDateTime(new Date().toISOString())}</div>
            </div>
          </div>
        )}

        {/* State 4: INVALID / EXPIRED / ALREADY_USED */}
        {(verificationState === 'INVALID' || verificationState === 'EXPIRED' || verificationState === 'ALREADY_USED') && (
          <div>
            <div 
              style={{ 
                backgroundColor: '#FEF2F2', 
                border: '1px solid #FCA5A5', 
                borderRadius: 'var(--radius-sm)', 
                padding: '1rem', 
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <AlertCircle size={24} style={{ color: '#EF4444' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.95rem' }}>
                  ✕ VERIFICATION FAILED
                </div>
                <div style={{ fontSize: '0.82rem', color: '#B91C1C' }}>
                  {verificationState === 'EXPIRED' 
                    ? 'Security token has expired. Request customer to generate a fresh QR token.' 
                    : verificationState === 'ALREADY_USED'
                    ? 'This transaction token has already been completed.'
                    : 'Invalid security signature or tampered HMAC token.'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        {(verificationState === 'INVALID' || verificationState === 'EXPIRED' || verificationState === 'ALREADY_USED' || verificationState === 'VERIFIED') && (
          <button className="btn btn-secondary" onClick={onResetScan}>
            Scan Again
          </button>
        )}

        {verificationState === 'VERIFIED' && (
          <button className="btn btn-success" onClick={onConfirmClick}>
            <span>Confirm Transaction</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
