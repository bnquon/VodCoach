# VodCoach Deployment

## Recommended Order

1. Deploy the API as a Render Web Service.
2. Deploy the worker as a second Render Web Service using `vodcoach-api/Dockerfile.worker`.
3. Deploy the frontend on Vercel.
4. Update API CORS with the final frontend origin.
5. Test register/login, upload, processing, playback, and sharing.

## API Render Web Service

Use the backend service for HTTP API traffic.

- Root directory: `vodcoach-api`
- Service type: Web Service
- Environment: Docker or Go
- Health check path: `/health`

Required env vars:

```txt
DB_URL=
JWT_SECRET=
FRONTEND_ORIGIN=
R2_ACCOUNT_ID=
R2_BUCKET_NAME=vodcoach-vods
R2_THUMBNAIL_BUCKET_NAME=vodcoach-thumbnails
R2_AK_ID=
R2_SAK=
REDPANDA_BROKERS=
KAFKA_TLS_ENABLED=true
KAFKA_CA_CERT=
KAFKA_CLIENT_CERT=
KAFKA_CLIENT_KEY=
WORKER_HEALTH_URL=https://your-worker-service.onrender.com/health
```

Use the Supabase pooler connection string for `DB_URL` on Render.

## Worker Render Web Service

Render background workers are paid, so deploy the worker as a second Web Service on the free tier. The worker exposes only `/health`; its real job is still consuming Kafka events.

- Root directory: `vodcoach-api`
- Service type: Web Service
- Dockerfile: `Dockerfile.worker`
- Health check path: `/health`

Required env vars:

```txt
DB_URL=
R2_ACCOUNT_ID=
R2_BUCKET_NAME=vodcoach-vods
R2_THUMBNAIL_BUCKET_NAME=vodcoach-thumbnails
R2_AK_ID=
R2_SAK=
REDPANDA_BROKERS=
KAFKA_TLS_ENABLED=true
KAFKA_CA_CERT=
KAFKA_CLIENT_CERT=
KAFKA_CLIENT_KEY=
```

## Free-Tier Plan

Render free services spin down after about 15 minutes of inactivity. The API now supports `WORKER_HEALTH_URL`; after upload-complete or retry-processing, it pings the worker health URL to wake it.

This means:

- The API publishes the Kafka event.
- The API pings the worker `/health` endpoint.
- Render wakes the worker if it was asleep.
- The worker consumes the queued Kafka event and processes the VOD.

Do not keep both API and worker awake 24/7 on a single 750-hour free workspace. One always-awake service is roughly a full month of hours by itself. For free-tier usage, let the worker sleep and wake it only when there is upload work.

## Frontend Vercel App

Required env vars:

```txt
NEXT_PUBLIC_API_URL=https://your-api-service.onrender.com
NEXT_PUBLIC_THUMBNAIL_BASE_URL=
```

After Vercel deploys, update the API `FRONTEND_ORIGIN` to the Vercel URL.
