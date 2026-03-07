# Webhooks

Events emitted:

- `kyc.completed`
- `identity.updated`

## Signature verification

HMAC-SHA256 of the raw body with your webhook secret, hex-encoded in `X-Meridian-Signature`.
