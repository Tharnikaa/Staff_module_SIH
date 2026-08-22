/**
 * Backend HMAC Token Verification Service Abstraction
 * 
 * CRITICAL RULE:
 * The frontend NEVER performs local HMAC signature verification or stores secret HMAC keys.
 * All scanned tokens are passed directly to this service layer.
 * 
 * ONE-TIME USE ENFORCEMENT:
 * Once a token is confirmed by staff (markTokenUsed), any subsequent scan of the same
 * token_id or token signature is immediately rejected as ALREADY_USED.
 */

const REGISTRY_KEY = 'nexa_used_tokens';

// Known bank account balances database (mock core banking system integration)
const KNOWN_ACCOUNT_BALANCES = {
  'TXN-2026-008821': 285000,
  'TXN-2026-003277': 192500,
  'TXN-2026-001104': 48000,
  'TXN-2026-005590': 75000,
  '8821': 285000,
  '3277': 192500,
  '1104': 48000,
  '5590': 75000,
  'VALID_HMAC_SIG_8821_WITHDRAW': 285000,
  'VALID_HMAC_SIG_3277_TRANSFER': 192500,
  'VALID_HMAC_SIG_1104_DEPOSIT': 48000,
  'VALID_HMAC_SIG_5590_WITHDRAW': 75000,
};

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
    // sessionStorage unavailable
  }
}

/**
 * Called by VerificationPage AFTER staff confirms a transaction.
 * Marks token_id, token signature, and raw payload string as spent.
 */
export function markTokenUsed(data) {
  if (!data) return;
  const registry = _getRegistry();

  if (typeof data === 'string') {
    registry.add(String(data));
  } else if (typeof data === 'object') {
    if (data.token_id) registry.add(String(data.token_id));
    if (data.token) registry.add(String(data.token));
  }
  _saveRegistry(registry);
}

/**
 * Returns true if the token or token_id has already been spent.
 */
export function isTokenUsed(token_id) {
  if (!token_id) return false;
  return _getRegistry().has(String(token_id));
}

export async function verifyToken(scannedPayload) {
  // Simulate network latency for backend HMAC validation (600ms - 1000ms)
  await new Promise((resolve) => setTimeout(resolve, 800));

  try {
    let payload = scannedPayload;
    let isJson = false;

    if (typeof scannedPayload === 'string') {
      try {
        payload = JSON.parse(scannedPayload);
        isJson = true;
      } catch (e) {
        payload = { token: scannedPayload };
      }
    }

    const rawStr = typeof scannedPayload === 'string' ? scannedPayload : JSON.stringify(scannedPayload);
    const tokenStr = payload.token || payload.token_id || String(scannedPayload);
    const token_id = payload.token_id || (tokenStr.startsWith('TXN-') ? tokenStr : `TXN-2026-${(tokenStr.match(/\d+/) || ['4821'])[0]}`);

    const registry = _getRegistry();

    // ── ONE-TIME USE CHECK (highest priority) ─────────────────────────────
    // Check if token_id, token string, or raw string has been marked as used in sessionStorage
    if (
      registry.has(String(token_id)) ||
      registry.has(String(tokenStr)) ||
      (payload.token && registry.has(String(payload.token))) ||
      registry.has(String(rawStr))
    ) {
      return {
        status: 'ALREADY_USED',
        message: 'This QR token has already been scanned and completed. One-time security tokens cannot be reused.',
        token_id
      };
    }

    // Mock Backend HMAC verification rules for prototype testing:
    if (tokenStr.includes('EXPIRED')) {
      return {
        status: 'EXPIRED',
        message: 'Token has expired according to backend security policy.',
        token_id
      };
    }

    if (tokenStr.includes('INVALID') || tokenStr.includes('CORRUPT') || tokenStr.includes('TAMPERED')) {
      return {
        status: 'INVALID',
        message: 'Invalid security signature or tampered HMAC token detected.',
        token_id
      };
    }

    if (tokenStr.includes('USED') || tokenStr.includes('ALREADY')) {
      return {
        status: 'ALREADY_USED',
        message: 'Transaction token has already been completed.',
        token_id
      };
    }

    // Determine Account Balance (from QR payload, core banking lookup, or derived default)
    let account_balance = payload.account_balance;

    if (account_balance === undefined || account_balance === null) {
      // Lookup in known account balances table by token_id, token, or customer ID digits
      account_balance = KNOWN_ACCOUNT_BALANCES[token_id] ||
                        KNOWN_ACCOUNT_BALANCES[tokenStr] ||
                        KNOWN_ACCOUNT_BALANCES[(token_id.match(/\d+/) || [''])[0]];
    }

    // Fallback balance if not in lookup table
    if (account_balance === undefined || account_balance === null) {
      account_balance = 150000;
    } else {
      account_balance = Number(account_balance);
    }

    const transaction_type = payload.transaction_type || 'withdraw';
    const amount = payload.amount !== undefined ? Number(payload.amount) : 10000;

    // Default Success Verification
    return {
      status: 'VERIFIED',
      verified_at: new Date().toISOString(),
      token_id,
      token: payload.token || tokenStr,
      customer_display_name: payload.customer_display_name || `Customer #${(token_id.match(/\d+/) || ['4821'])[0]}`,
      transaction_type,
      amount,
      account_balance, // Guaranteed numeric balance for Bank Portal display
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
