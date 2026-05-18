# Backend

Production-ready Express/MongoDB backend scaffold for IOX Exchange.

Build your assets.

## Setup

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Fill `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and M3 Wallet credentials in `.env`.

## Notes

- Tokens are internal database balances only.
- INR settlement is delegated to M3 Wallet APIs.
- Public market APIs only expose admin-verified `pending` orders.
- Verification-stage, rejected, expired, cancelled, and processing orders are hidden from buyers.
- Fast Track sell uses platform merchant wallet liquidity.
- Auto sell requires connected and verified wallet plus OTP verification.
