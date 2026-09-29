# Deployment and Google Maps setup

## Local services

`docker compose -f infra/docker-compose.yml up -d` runs PostGIS and Redis. Redis is reserved for later caching/rate-limit needs. Keep local passwords in ignored `.env` files.

## Google Maps Platform setup

1. Create a Google Cloud project and enable billing.
2. Enable Maps JavaScript API and Places API (New) for the web client.
3. Create a browser API key, set HTTP referrer restrictions for localhost during development and exact production domains after deployment.
4. Restrict the key to Maps JavaScript API and Places API (New). Monitor quotas and billing alerts.
5. Place the browser key in `frontend/.env.local` as `VITE_GOOGLE_MAPS_API_KEY=...`; this key is public by design and protected by referrer/API restrictions.
6. Do not create a server credential unless a server-side Google API call is required. If needed, restrict it to only those APIs and the server environment, then store it in Secret Manager and expose it to Cloud Run at runtime.
7. Never commit real keys, service account JSON, database URLs, OAuth secrets, or JWT signing keys.

Places requests should use an autocomplete session and request only displayed fields. Do not query Places on each map movement. Cache only data permitted by current Google Maps Platform terms.

## Cloud Run path

Build the backend container from `backend/Dockerfile` with the repository root as build context, deploy to Cloud Run with a dedicated runtime service account, and connect to Cloud SQL using private IP/connector. Configure `DATABASE_URL`, `CORS_ORIGINS`, and signing/OAuth secrets through Secret Manager references. Set minimum instances only when latency requirements justify cost. Serve the Vite build via Vercel or Cloud Storage + Cloud CDN; configure exact origins in CORS.

Cloud SQL provides managed backups and PostGIS; Cloud Storage is for private media objects introduced later; Memorystore Redis is optional until cache/rate-limit load justifies it; Cloud Logging and Monitoring are required operational foundations.
