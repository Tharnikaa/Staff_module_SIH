/**
 * Backend HMAC Token Verification Service Abstraction
 * 
 * CRITICAL RULE:
 * The frontend NEVER performs local HMAC signature verification or stores secret HMAC keys.
 * All scanned tokens are passed directly to this service layer.
 * 
 * TODO: Backend team must provide verification endpoint contract.
 */

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
        token_id: payload.token_id || tokenStr,
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
      token_id: payload.token_id || tokenStr,
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
