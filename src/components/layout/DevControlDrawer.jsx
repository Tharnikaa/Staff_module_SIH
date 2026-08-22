import React, { useState } from 'react';
import { useWs } from '../../state/WsContext';
import { useQueue } from '../../state/QueueContext';
import { Terminal, X, Play, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const DevControlDrawer = ({ onSimulateQrScan }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { status, connect, disconnect, emitDevEvent } = useWs();
  const { queueList } = useQueue();

  const handleEmitNewQueue = async () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const types = ['withdraw', 'deposit', 'transfer', 'document_collection'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomAmount = Math.floor(1 + Math.random() * 20) * 1000;

    const payload = {
      event: 'new_queue_entry',
      token_id: `uuid-${Date.now()}`,
      customer_display_name: `Customer #${randomId}`,
      transaction_type: randomType,
      amount: randomAmount,
      queue_position: queueList.length + 1,
      issued_at: new Date().toISOString()
    };

    await emitDevEvent(payload);
  };

  const handleEmitQueueCalled = async () => {
    const waiting = queueList.find((q) => q.ui_status === 'WAITING');
    if (!waiting) {
      alert('No WAITING queue entry found to call. Create a new queue entry first!');
      return;
    }

    const payload = {
      event: 'queue_called',
      token_id: waiting.token_id,
      teller_id: 't_02'
    };

    await emitDevEvent(payload);
  };

  const handleEmitTransactionCompleted = async () => {
    const called = queueList.find((q) => q.ui_status === 'CALLED' || q.ui_status === 'WAITING');
    if (!called) {
      alert('No active queue entry to complete.');
      return;
    }

    const payload = {
      event: 'transaction_completed',
      token_id: called.token_id
    };

    await emitDevEvent(payload);
  };

  const handleEmitTokenExpired = async () => {
    const active = queueList.find((q) => q.ui_status === 'WAITING' || q.ui_status === 'CALLED');
    if (!active) {
      alert('No active queue entry to expire.');
      return;
    }

    const payload = {
      event: 'token_expired',
      token_id: active.token_id
    };

    await emitDevEvent(payload);
  };

  return (
    <>
      <button 
        className="dev-drawer-toggle flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Terminal size={15} />
        <span>SIH Dev Controls</span>
      </button>

      {isOpen && (
        <div className="dev-drawer">
          <div className="flex items-center justify-between" style={{ marginBottom: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid #334155' }}>
            <div className="flex items-center gap-2" style={{ fontWeight: 700, color: '#38BDF8' }}>
              <Terminal size={16} />
              <span>WebSocket & Event Simulator</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ color: '#94A3B8' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: '0.35rem' }}>WEBSOCKET CONNECTION</div>
            <div className="flex gap-2">
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', flex: 1 }}
                onClick={() => status === 'CONNECTED' ? disconnect() : connect()}
              >
                {status === 'CONNECTED' ? 'Disconnect WS' : 'Connect WS'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: '0.35rem' }}>EMIT FIXED BACKEND EVENTS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem', fontSize: '0.72rem', justifyContent: 'flex-start' }}
                onClick={handleEmitNewQueue}
              >
                <Play size={12} style={{ color: '#10B981' }} />
                <span>New Queue</span>
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem', fontSize: '0.72rem', justifyContent: 'flex-start' }}
                onClick={handleEmitQueueCalled}
              >
                <Clock size={12} style={{ color: '#F59E0B' }} />
                <span>Call Queue</span>
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem', fontSize: '0.72rem', justifyContent: 'flex-start' }}
                onClick={handleEmitTransactionCompleted}
              >
                <CheckCircle size={12} style={{ color: '#3B82F6' }} />
                <span>Complete Txn</span>
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem', fontSize: '0.72rem', justifyContent: 'flex-start' }}
                onClick={handleEmitTokenExpired}
              >
                <AlertTriangle size={12} style={{ color: '#EF4444' }} />
                <span>Expire Token</span>
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: '0.35rem' }}>SIMULATE SCANNED QR TOKENS</div>
            <div className="flex flex-col gap-1">
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', justifyContent: 'flex-start' }}
                onClick={() => onSimulateQrScan && onSimulateQrScan(JSON.stringify({ token: 'VALID_HMAC_SIG_8821', token_id: 'TXN-2026-008821', customer_display_name: 'Customer #8821', transaction_type: 'withdraw', amount: 100000 }))}
              >
                ✓ Customer #8821 – Withdraw
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', justifyContent: 'flex-start' }}
                onClick={() => onSimulateQrScan && onSimulateQrScan(JSON.stringify({ token: 'VALID_HMAC_SIG_3277', token_id: 'TXN-2026-003277', customer_display_name: 'Customer #3277', transaction_type: 'transfer', amount: 50000 }))}
              >
                ✓ Customer #3277 – Transfer
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', justifyContent: 'flex-start' }}
                onClick={() => onSimulateQrScan && onSimulateQrScan(JSON.stringify({ token: 'VALID_HMAC_SIG_1104', token_id: 'TXN-2026-001104', customer_display_name: 'Customer #1104', transaction_type: 'deposit', amount: 25000 }))}
              >
                ✓ Customer #1104 – Deposit
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', justifyContent: 'flex-start', color: '#EF4444' }}
                onClick={() => onSimulateQrScan && onSimulateQrScan(JSON.stringify({ token: 'INVALID_HMAC_SIGNATURE_TAMPERED' }))}
              >
                ✕ Invalid / Tampered HMAC Token
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', justifyContent: 'flex-start', color: '#F59E0B' }}
                onClick={() => onSimulateQrScan && onSimulateQrScan(JSON.stringify({ token: 'EXPIRED_TOKEN_POLICY' }))}
              >
                ! Expired QR Token
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', justifyContent: 'flex-start', color: '#A855F7' }}
                onClick={() => onSimulateQrScan && onSimulateQrScan(JSON.stringify({ token: 'ALREADY_USED_TOKEN' }))}
              >
                ! Already Used QR Token
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
