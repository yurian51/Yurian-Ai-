# YURIAN AI OS Production Readiness

This document is the release gate for the first production vertical slice.

## Required gates

- [ ] Dependency lockfile committed and CI uses frozen installs
- [ ] Prisma migrations committed and `prisma migrate deploy` succeeds
- [ ] TypeScript typecheck passes
- [ ] API lint passes
- [ ] API build passes
- [ ] Web build passes
- [ ] API and Web production images build successfully
- [ ] Unit tests pass
- [ ] Integration tests pass against PostgreSQL + pgvector + Redis
- [ ] Authentication and refresh-token tests pass
- [ ] Cross-tenant authorization tests pass
- [ ] Tool permission and risk tests pass
- [ ] Approval state-transition tests pass
- [ ] RAG tenant-filtering and citation tests pass
- [ ] HTTPS and security headers verified
- [ ] Production secrets stored outside source control
- [ ] Database backups configured and restore procedure tested
- [ ] Health and readiness endpoints verified
- [ ] Application logs and error tracking configured
- [ ] Production deployment smoke test passes
- [ ] Rollback procedure tested

## Release rule

The product must not be labeled `PRODUCTION VERIFIED` until every required gate above is green.

## Current infrastructure blocker

The connected DigitalOcean account currently reports that the maximum Droplet allowance has been reached even though the Droplet listing is empty. Resolve the account-level limit in the DigitalOcean control panel before creating the production server.

Do not bypass the provider limit or destroy unrelated infrastructure to make room without explicit authorization.
