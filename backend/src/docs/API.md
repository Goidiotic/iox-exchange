# INR Internal Token Platform Backend API

Base path: `/api/v1`

This backend is intentionally centralized. Tokens are database balances only. There is no blockchain, smart contract, or live crypto market integration.

## Auth

- `POST /auth/register` starts mobile registration and sends OTP.
- `POST /auth/verify-registration` verifies OTP and activates account.
- `POST /auth/login` returns access and refresh tokens.
- `POST /auth/refresh` rotates access token from refresh token.
- `POST /auth/password/forgot` sends password reset OTP.
- `POST /auth/password/reset` verifies OTP and updates password.

## Market and Orders

- `GET /orders/market` returns only `pending` orders, meaning admin-verified pending market orders.
- `POST /orders/sell` creates a sell request. Auto mode starts in `pending_verification`; fast mode starts processing for platform liquidity.
- `POST /orders/:orderId/buy` verifies M3 transaction, transfers internal token balance, logs transaction, and emits notifications.

Hidden from public market: `pending_verification`, `rejected`, `cancelled`, `expired`, and `processing`.

## Wallet

- `POST /wallet/otp` sends platform OTP.
- `POST /wallet/connect` verifies platform OTP, wallet sync key, and wallet OTP through M3 Wallet APIs.
- `GET /wallet/me` returns connected wallet.
- `POST /wallet/extra-request` creates an admin approval request.

Only one wallet is allowed. Connected wallets cannot be removed.

## User Modules

- `GET /tokens`
- `GET /tokens/:tokenId/balance`
- `GET /coupons`
- `GET /referrals/stats`
- `GET /referrals/history`
- `GET /transactions`
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `POST /auto-sell/otp`
- `PATCH /auto-sell`
- `GET /tickets`
- `POST /tickets`
- `GET /tickets/:ticketId`
- `POST /tickets/:ticketId/replies`
- `PATCH /tickets/:ticketId/status` admin only

## Admin

All admin routes require `admin` or `super_admin`.

- `GET /admin/users`
- `POST /admin/tokens`
- `POST /admin/coupons`
- `GET /admin/orders/pending-verification`
- `PATCH /admin/orders/:orderId/approve`
- `PATCH /admin/orders/:orderId/reject`
- `GET /admin/transactions`

## Realtime Events

- `order:update`
- `notification:new`
- `reward:update`
- `market:refresh`
- `wallet:update`
