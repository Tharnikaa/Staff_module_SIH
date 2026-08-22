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
 * Module-level registry of spent token IDs.
 * In production this lives server-side; here it persists for the full browser session.
 */
const _usedTokenRegistry = new Set();

/**
 * Called by VerificationPage AFTER staff confirms a transaction.
 * Marks the token as spent so any future scan of the same QR is rejected.
 */
export function markTokenUsed(token_id) {
  if (token_id) {
    _usedTokenRegistry.add(String(token_id));
  }
}

/**
 * Returns true if the token_id has already been spent this session.
 */
export function isTokenUsed(token_id) {
  return token_id ? _usedTokenRegistry.has(String(token_id)) : false;
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
    // If this token was already confirmed by staff this session → reject immediately.
    if (_usedTokenRegistry.has(String(token_id))) {
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

    // Withdrawal guard: reject if requested amount exceeds current account balance
    if (
      transaction_type &&
      transaction_type.toLowerCase() === 'withdraw' &&
      account_balance !== undefined &&
      amount !== undefined &&
      amount > account_balance
    ) {
      return {
        status: 'INSUFFICIENT_FUNDS',
        message: `Withdrawal amount ${amount} exceeds available balance of ${account_balance}. Transaction blocked.`,
        token_id,
        customer_display_name: payload.customer_display_name,
        transaction_type,
        amount,
        account_balance
      };
    }

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
