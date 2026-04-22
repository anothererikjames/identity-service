# identity-service

KYC/KYB identity verification and short-lived auth token issuance for the Meridian platform.

- **Team:** identity (identity-platform)
- **Port:** 3001
- **Data classification:** Restricted · PII: true
- **SLA:** Tier-1
- **Regulatory scope:** SOC-2, GDPR
- **Upstream deps:** none

See `openapi.yaml` for the full spec and `docs/` for consumer-facing docs.

## Postman API Catalog integration

This service is registered in Postman API Catalog:
- Workspace: see `.postman/resources.yaml`
- Spec: `openapi.yaml` is the source of truth, pushed via `postman workspace push`
- CI emits collection run events via `postman collection run --integration-id`
