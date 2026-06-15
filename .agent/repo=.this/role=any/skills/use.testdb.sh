#!/usr/bin/env bash
######################################################################
# .what = start local testdb (docker postgres with extensions)
#
# .why  = integration tests require a real postgres instance.
#         this skill provisions one locally via docker.
#
# .when = use before:
#         - npm run test:integration
#         - manual database exploration
#
# usage:
#   rhx use.testdb
#
# prerequisites:
#   - docker daemon active
#
# provides:
#   - postgres 13 at localhost:7821
#   - database: superimportantdb
#   - user: postgres (password: a-secure-password)
#   - extensions: uuid-ossp, pgcrypto
#
# guarantee:
#   - removes stale container if present
#   - starts fresh testdb via docker compose
#   - fail-fast on errors
######################################################################
set -euo pipefail

# remove stale container by name (docker:clear only removes by port)
echo "remove stale container if present..."
docker rm -f superimportantdb 2>/dev/null || true

# start the testdb
echo "start testdb..."
npm run start:testdb
