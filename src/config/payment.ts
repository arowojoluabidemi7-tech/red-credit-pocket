// ===== PAYMENT / BANK DETAILS =====
// The account users transfer money to on the Buy RPC payment page.
export const PAYMENT_ACCOUNT = {
  bankName: 'SMART CASH',                        // Bank name shown to users
  accountNumber: '2146335284',                   // Account number users pay into
  accountName: 'MONDAY OLUWAFEMI OLAGUNDOYE',    // Account holder name
};

// Link opened when users tap "Tap here to activate your account"
export const ACTIVATION_LINK = 'https://v0-red-pay-activation-app-tr.vercel.app/';

// RPC codes
export const RPC_CODES = {
  confirmedCode: 'RPC6097',   // Code displayed to users after "Payment Confirmed"
  validCode: 'RPC678910',     // Code that is accepted on the Withdraw page
  invalidCode: 'RPC708901',   // Example code that is always rejected
};
