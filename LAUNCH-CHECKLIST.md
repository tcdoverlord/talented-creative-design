# TCD Store Launch Checklist

Use this checklist in a staging environment first. A checked box means you personally tested it, not simply that code exists.

## Product catalog and cart
- [ ] Product status draft/archived prevents purchase; published product appears in shop.
- [ ] Cart persists after refresh; quantities can be changed/removed.
- [ ] Invalid, inactive, unpublished, or altered price IDs are rejected server-side.
- [ ] Mixed recurring and one-time cart is rejected with a clear message; subscription is purchased separately.
- [ ] Displayed price and Stripe Price ID amounts/currency match exactly.

## Accounts and security
- [ ] Registration, login, logout and session rotation work.
- [ ] Passwords use Argon2id; minimum length and rate limits work.
- [ ] CSRF and origin checks reject invalid mutation requests.
- [ ] Email verification works on the real HTTPS domain.
- [ ] Password reset tokens expire and cannot be reused; reset email is not sent for nonexistent accounts.
- [ ] Unverified account cannot create checkout session.
- [ ] Admin endpoints reject customers even if they manually browse `/admin.html`.
- [ ] Session cookies are Secure/HttpOnly/SameSite in production.
- [ ] No `.env`, credentials, webhook secrets or installer files are in Git history.

## Payments and orders
- [ ] Successful one-time test payment creates exactly one paid order and entitlement.
- [ ] Customer cancellation does not grant access.
- [ ] Unpaid/failed asynchronous payment does not grant access.
- [ ] Invalid Stripe webhook signature is rejected.
- [ ] Duplicate webhook delivery is idempotent.
- [ ] Full refund revokes one-time entitlements and order is marked refunded.
- [ ] Subscription created/updated/deleted statuses update subscription and entitlement.
- [ ] Renewal failure, cancellation-at-period-end, immediate cancellation and refund/dispute behavior are documented and tested.
- [ ] Stripe billing portal is enabled and tested.
- [ ] Tax settings, receipts, refund policy and subscription terms are reviewed for the business.

## Software downloads
- [ ] Bucket blocks public access; installer cannot be fetched by guessing a URL.
- [ ] Entitled purchaser can download the correct published release.
- [ ] Non-purchaser, expired subscription and refunded purchaser are denied.
- [ ] Signed URL expires; download events are recorded.
- [ ] Release version and file checksum are recorded by the release process.

## Operations
- [ ] Production `GET /api/health` reports database connected and required integrations configured.
- [ ] HTTPS custom domain and redirects work.
- [ ] PostgreSQL backups are enabled; restore has been tested.
- [ ] Error logs contain no passwords, tokens or payment secrets.
- [ ] Rate limits and alerts are configured; admin email and support contact are valid.
- [ ] Privacy policy, terms, refund/cancellation policy, software license and contact information are published.
- [ ] Test on desktop and mobile; check keyboard access and form validation.
- [ ] Use Stripe test mode until every applicable check is passed; only then consider live mode.
