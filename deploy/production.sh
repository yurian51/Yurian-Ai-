#!/usr/bin/env sh
set -eu

COMPOSE="docker compose -f docker-compose.production.yml"

printf '%s\n' '[1/6] Pulling infrastructure images'
$COMPOSE pull postgres redis caddy

printf '%s\n' '[2/6] Building application images'
$COMPOSE build --pull api web

printf '%s\n' '[3/6] Starting database and cache'
$COMPOSE up -d postgres redis

printf '%s\n' '[4/6] Applying database migrations'
$COMPOSE run --rm api sh -c 'pnpm --filter @yurian/database deploy'

printf '%s\n' '[5/6] Starting application services'
$COMPOSE up -d api web caddy

printf '%s\n' '[6/6] Checking service health'
$COMPOSE ps

printf '%s\n' 'Deployment started. Verify HTTPS endpoints and /api/v1/health/ready before declaring production healthy.'
