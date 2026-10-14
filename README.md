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

## Administrator setup

1. Set `ADMIN_EMAIL` in the environment **before registering the administrator account**.
2. Register that exact email address using the account page.
3. For an existing deployment, do not expose a public role-change route. Promote the chosen account through a secure database administration session after verifying the email. Example SQL: `UPDATE users SET role = 'admin' WHERE email = 'you@example.com';`
4. Open `/admin.html`. The APIs independently check the role in the database.

The app intentionally does not create a default admin password.

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

## Railway deployment outline

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
