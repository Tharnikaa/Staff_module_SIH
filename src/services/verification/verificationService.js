/**
 * Backend HMAC Token Verification Service Abstraction
 * 
 * CRITICAL RULE:
 * The frontend NEVER performs local HMAC signature verification or stores secret HMAC keys.
 * All scanned tokens are passed directly to this service layer.
 * 
 * ONE-TIME USE ENFORCEMENT:
 * Once a token is confirmed by staff (markTokenUsed), any subsequent scan of the same
 * token_id is immediately rejected as ALREADY_USED — across the entire session.
 * 
 * TODO: Backend team must provide verification endpoint contract.
 */

/**
 * Persistent registry of spent token IDs — stored in sessionStorage so it
 * survives Vite HMR reloads (which re-execute the module and reset in-memory Sets).
 * Cleared automatically when the browser tab/session closes.
 */
const REGISTRY_KEY = 'nexa_used_tokens';

function _getRegistry() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(REGISTRY_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function _saveRegistry(set) {
  try {
    sessionStorage.setItem(REGISTRY_KEY, JSON.stringify([...set]));
  } catch {
    // sessionStorage unavailable — silently ignore
  }
}

/**
 * Called by VerificationPage AFTER staff confirms a transaction.
 * Marks the token as spent so any future scan of the same QR is rejected.
 */
export function markTokenUsed(token_id) {
  if (!token_id) return;
  const registry = _getRegistry();
  registry.add(String(token_id));
  _saveRegistry(registry);
}

/**
 * Returns true if the token_id has already been spent this session.
 */
export function isTokenUsed(token_id) {
  return token_id ? _getRegistry().has(String(token_id)) : false;
}

export async function verifyToken(scannedPayload) {
  // Simulate network latency for backend HMAC validation (600ms - 1000ms)
  await new Promise((resolve) => setTimeout(resolve, 800));

  try {
    let payload = scannedPayload;
    if (typeof scannedPayload === 'string') {
      try {
        payload = JSON.parse(scannedPayload);
      } catch (e) {
        // If string is raw token string, wrap it
        payload = { token: scannedPayload };
      }
    }

    const tokenStr = payload.token || payload.token_id || String(scannedPayload);
    const token_id = payload.token_id || tokenStr;

    // ── ONE-TIME USE CHECK (highest priority) ─────────────────────────────
    // Check sessionStorage registry — survives HMR reloads unlike in-memory Set.
    if (_getRegistry().has(String(token_id))) {
      return {
        status: 'ALREADY_USED',
        message: 'This QR token has already been scanned and the transaction completed. One-time use tokens cannot be reused.',
        token_id
      };
    }

    // Mock Backend HMAC verification rules for prototype testing:
    if (tokenStr.includes('EXPIRED')) {
      return {
        status: 'EXPIRED',
        message: 'Token has expired according to backend policy.'
      };
    }

    if (tokenStr.includes('INVALID') || tokenStr.includes('CORRUPT')) {
      return {
        status: 'INVALID',
        message: 'Invalid security signature or tampered HMAC token.'
      };
    }

    if (tokenStr.includes('USED') || tokenStr.includes('ALREADY')) {
      return {
        status: 'ALREADY_USED',
        message: 'Transaction token has already been completed.'
      };
    }

    // Extract account balance (bank-internal field — never printed on customer receipt)
    const account_balance = payload.account_balance !== undefined ? Number(payload.account_balance) : undefined;
    const transaction_type = payload.transaction_type;
    const amount = payload.amount !== undefined ? Number(payload.amount) : undefined;

    // Default Success Verification
    return {
      status: 'VERIFIED',
      verified_at: new Date().toISOString(),
      token_id,
      customer_display_name: payload.customer_display_name,
      transaction_type,
      amount,
      account_balance, // bank-internal field
      queue_position: payload.queue_position,
      signature_valid: true,
      hmac_verified: true,
      one_time_token_valid: true
    };
  } catch (err) {
    return {
      status: 'BACKEND_UNAVAILABLE',
      message: 'Failed to reach backend verification service.'
    };
  }
}
