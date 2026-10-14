# Talented Creative Design — Digital Store Starter

This project expands the existing TCD website into a digital software-store application using Node.js, Express, PostgreSQL/Sequelize, Stripe Checkout, and optional S3-compatible private file storage.

## Feature scope

1. **Shop and cart:** database-backed published product catalog, price options, persistent browser cart, server-side product/price validation.
2. **One-time checkout:** Stripe-hosted Checkout session creation, signed webhooks, order records, purchase entitlements and refund revocation for one-time orders.
3. **Protected downloads:** private S3-compatible object keys, entitlement check, audit event, short-lived signed URL.
4. **Subscriptions:** monthly/yearly Stripe price support, subscription status synchronization, period/cancellation fields, and billing portal endpoint.
5. **Customer accounts:** Argon2id password hashes, sessions stored in PostgreSQL, CSRF protection, email verification and password reset token flows, orders/subscriptions/downloads dashboard.
6. **Admin:** database-role-protected product, price, release, order and customer views. Admin can create products and add price records / private release references.
7. **Launch checks:** health endpoint reports which integrations are configured; see `LAUNCH-CHECKLIST.md` before public launch.

## Important status

This is a **feature-complete integration scaffold, not a certified production-ready store**. The app cannot take payments until Stripe is configured, and cannot deliver private files until object storage is configured. SMTP is required for real email verification and password resets. You must run the full staging checklist, test with Stripe test-mode products/webhooks, review business/legal policies, and arrange backups before accepting real customer payments. The Stripe billing portal must be enabled in your Stripe account. Subscription refunds/disputes and tax rules need a business-specific policy and additional reconciliation testing.

## Local Docker run

1. Install Docker Desktop.
2. Copy `.env.example` to `.env`.
3. Set a strong unique `POSTGRES_PASSWORD` and `SESSION_SECRET` (at least 32 characters).
4. Keep `NODE_ENV=development` for local testing.
5. Run `docker compose up --build`.
6. Open `http://localhost:3000` and `http://localhost:3000/api/health`.
7. Stop with `docker compose down`. Do **not** add `-v` unless you intend to delete the local database volume.

Do not use production Stripe secrets locally or commit `.env`.

## Administrator setup (secure one-off promotion)

1. Register your account normally.
2. Configure SMTP and verify that account's email address.
3. Run the promotion script from a trusted terminal with database access. It requires the same email as both the command argument and explicit confirmation variable, and refuses to promote unverified accounts.

On Windows PowerShell, after dependencies are installed and `DATABASE_URL` points to the intended database:

```powershell
$env:CONFIRM_ADMIN_PROMOTION = "you@example.com"
npm run admin:promote -- you@example.com
Remove-Item Env:CONFIRM_ADMIN_PROMOTION
```

For a remote Railway database, run the command only from an authorized trusted environment with the correct Railway `DATABASE_URL` configured. Do not paste database credentials into chat or commit them to GitHub. After promotion, sign out and sign back in. Public registration always assigns the `customer` role; there is no public role-change endpoint.

The app intentionally does not create a default admin password. The promotion script is a one-off operational command, not an HTTP endpoint.

## Stripe setup (test mode first)

1. Create a Stripe account and switch to test mode.
2. Create a Product and recurring/one-time Prices in Stripe Dashboard for each product option.
3. In `/admin.html`, create a TCD product and add a price record. Enter the exact Stripe Price ID (`price_...`), amount in integer cents, currency and interval. The Stripe price is what Checkout actually charges; keep the local display amount and Stripe amount identical.
4. Set `STRIPE_SECRET_KEY` to the test secret key.
5. Create a webhook endpoint at `https://YOUR-HOST/api/stripe/webhook` (for local testing use Stripe CLI forwarding). Subscribe to at least:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.refunded`
6. Set `STRIPE_WEBHOOK_SECRET` from the endpoint/CLI.
7. Set `APP_BASE_URL`, `STRIPE_SUCCESS_URL`, and `STRIPE_CANCEL_URL` to the actual HTTPS site URLs.
8. Enable Stripe's customer billing portal before using subscription self-service.
9. Test completed, cancelled, failed and duplicate webhook events before switching to live mode.

Checkout requires a verified account email. Payment access is granted from signed webhook processing, not merely because a customer returned to the success page.

## Email setup

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, and `APP_BASE_URL`. Verify deliverability and link URLs in staging. If SMTP is not configured, development logs verification tokens to the server console; production refuses to send and logs an error. Do not launch without working email verification and reset emails.

## Private software storage

Use an S3-compatible bucket with public access blocked. Configure `S3_ENDPOINT` if required by your provider, plus `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`. Give the access key the minimum required permissions for the designated bucket, including PutObject/GetObject for the required prefixes. Do not put installers in `public/`. Download URLs expire after five minutes and are generated only after an entitlement check.

### Marketplace-style admin listing uploads

The admin listing form now supports selecting or dropping up to eight product photos (JPG, PNG, WebP, GIF; 12 MB each) and selecting a software installer (up to 2 GB). On Save listing, the server authorizes each upload and issues a five-minute, content-type-bound presigned upload URL. The browser sends the file directly to your private S3-compatible bucket. The server then stores the product image references in PostgreSQL and creates the software release record using the uploaded installer's object key. The first photo is used as the main shop image. Product images are served through a short-lived signed redirect; installers remain private and require a valid entitlement to download.

**Bucket CORS is required for browser uploads.** In your storage provider's CORS settings, allow the exact origin of your deployed website (and `http://localhost:3000` for local testing), method `PUT`, and request header `Content-Type`. Do not use wildcard origins for a production bucket. Ensure the bucket's API credentials are kept only in the server environment and never exposed to browser code. Browser uploads have not been verified against your specific storage provider yet; test one small image and one test installer before publishing a real listing.

## Railway staging deployment outline

**Use staging first. Do not enable live payments until the launch checklist passes.**

1. Commit this project to a private GitHub repository. Confirm `.env` and credentials are not tracked.
2. Create a Railway project and add a PostgreSQL service.
3. Deploy this repository as a service using its included `Dockerfile` (Railway should detect it automatically).
4. Set `DATABASE_URL` to the Railway Postgres reference variable, `NODE_ENV=production`, a unique `SESSION_SECRET` of at least 32 characters, `TRUST_PROXY=true`, and `APP_BASE_URL` to the Railway HTTPS URL.
5. Set `PORT` only if Railway does not supply it automatically. The application listens on `process.env.PORT`.
6. Set the health check path to `/api/health`. The route returns `503` if PostgreSQL is unavailable.
7. Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` empty until you are ready to configure Stripe **test mode**. Do not use live keys for initial staging.
8. Add SMTP credentials and private object-storage credentials only after creating those services. Do not expose the database publicly.
9. Verify registration creates a customer, verify email delivery, then use the one-off promotion script to grant admin access to the verified account.
10. Test product/service creation, image uploads, private installer uploads, test payments, webhook delivery, download authorization, subscription cancellation, and backups.

The included `railway.json` sets `/api/health` as the deployment health check. Railway configuration does not mean the external integrations have been configured or verified.


1. Push this repository to a private GitHub repo; verify `.env` is not tracked.
2. Create a Railway project and PostgreSQL service.
3. Deploy the Node service from the repo using the included Dockerfile.
4. Add Railway's PostgreSQL connection string as `DATABASE_URL` and set all secrets/integration variables in Railway's service variables.
5. Set `NODE_ENV=production`, `TRUST_PROXY=true` only when using Railway's trusted proxy setup, `APP_BASE_URL` to the HTTPS domain, and valid Stripe webhook URLs.
6. Add SMTP and private S3-compatible storage credentials.
7. Test `/api/health`; verify that the production endpoint reports payments, storage and email configured.
8. Complete `LAUNCH-CHECKLIST.md` in staging before accepting real payments.

Do not publish PostgreSQL directly to the internet. Enable database backups and test restoring one.


## Services listings and project inquiries

The site includes a public `services.html` page and an admin service-listing workflow. Admins can upload up to eight service photos using the existing private S3-compatible upload setup, write summaries/descriptions/features, choose quote / starting-at / fixed pricing, and publish or archive listings. Visitors can submit a service inquiry without checking out; inquiries are saved in PostgreSQL and appear in Store Admin, where their status can be updated. Service inquiries are not paid bookings and do not create a contract. Configure email/SMTP and add a notification workflow before relying on instant email alerts; the current flow stores inquiries for admin review.


## Authentication upgrades (v2.4.0)

- Railway HTTPS proxy is trusted in production so secure session cookies work behind Railway's TLS termination; this addresses the common cause of the CSRF/session-token error.
- Optional Google OAuth sign-in: configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `APP_BASE_URL`. Add this exact authorized redirect URI in Google Cloud: `${APP_BASE_URL}/auth/google/callback` (without a trailing slash in APP_BASE_URL).
- Admin TOTP authenticator endpoints are included: while signed in as a verified administrator, `GET /api/admin/2fa/setup` returns a QR data URL and secret; confirm enrollment using `POST /api/admin/2fa/enable` with `{ "code": "123456" }` and `X-CSRF-Token`. Disable with `POST /api/admin/2fa/disable` plus current code. Never expose the QR/secret publicly.
- Administrator role is still granted only using the existing `npm run admin:promote` script, requiring a verified account and an explicit email confirmation. No default admin password is embedded.
- Database startup adds the new Google and TOTP columns without dropping existing customer or order data.

### Important before production
Google sign-in requires OAuth credentials from Google Cloud Console. Authenticator enrollment API is present, but configure and test the admin enrollment UI before considering 2FA fully user-friendly. Email verification/reset still require working SMTP. Keep Stripe in test mode until checkout, webhook, and order fulfillment are tested end-to-end.


### Google Cloud setup checklist
1. Create/select a Google Cloud project and configure the OAuth consent screen.
2. Create an OAuth Client ID of type **Web application**.
3. Add your deployed origin (for example `https://talented-creative-design-production.up.railway.app`) as an authorized JavaScript origin.
4. Add the exact redirect URI `https://talented-creative-design-production.up.railway.app/auth/google/callback` as an authorized redirect URI.
5. Add the OAuth client ID and client secret to Railway variables as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; confirm `APP_BASE_URL` exactly matches the public origin, without a trailing slash.
6. Deploy this package to a separate staging service/branch first. Never paste OAuth secrets into chat or commit them to Git.

### Suggested safe deployment sequence
- Create a new Git branch and Railway staging service; do not replace the current production deployment yet.
- Keep the same database for testing only if you understand that the startup migration adds columns to the existing `users` table. Prefer a separate staging database for safer testing.
- Set `NODE_ENV=production`, `SESSION_SECRET` (32+ random characters), `DATABASE_URL`, `APP_BASE_URL`, and optional Google OAuth values in Railway. The app now trusts Railway's first proxy in production for HTTPS secure cookies.
- Test `/api/auth/csrf` and confirm a `tcd.sid` cookie is stored; test customer registration/login, Google sign-in, verified admin promotion, then enroll and test authenticator login.
- Only switch production after tests pass. Existing Stripe, SMTP, and private object-storage settings must be preserved/configured independently.
