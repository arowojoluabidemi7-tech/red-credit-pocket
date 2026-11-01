# Website settings — edit these files on GitHub

Every detail shown on the website lives in this folder. Open a file on GitHub,
click the pencil (Edit) icon, change the value between the quotes or the number,
then click "Commit changes". The live site updates after you publish/deploy.

| File | What it controls |
|------|------------------|
| `site.ts` | Website name, description, tagline, currency symbol |
| `payment.ts` | Bank name, account number, account name, activation link, RPC codes |
| `prices.ts` | RPC code prices (online/offline), activation fee, Buy Online/Offline on/off |
| `rewards.ts` | Welcome bonus, claim amount, claim timer, referral bonus |
| `withdrawal.ts` | Minimum withdrawal and quick-amount buttons |
| `contacts.ts` | WhatsApp support, Telegram support, email, community group links |
| `banks.ts` | Bank list shown on the withdrawal page |
| `countries.ts` | Countries and their currency symbols |

Rules: keep quotes around text ('like this'), no quotes around numbers (8500),
and use `true` / `false` for on/off switches. Never put passwords or secret keys here —
everything in this folder is visible to the public.
