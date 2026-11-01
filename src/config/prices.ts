// ===== PRICES =====
// Amounts are in Naira (numbers only — no commas, no ₦ sign).
export const PRICES = {
  onlinePrice: 8500,     // "Buy Online" RPC code price
  offlinePrice: 9009,    // "Buy Offline" RPC code price
  activationPrice: 0,    // Activation fee shown after payment (0 = hidden/free)
};

// Turn purchase methods on (true) or off (false)
export const PURCHASE_OPTIONS = {
  onlineEnabled: true,   // Show "Buy Online"
  offlineEnabled: true,  // Show "Buy Offline"
};
