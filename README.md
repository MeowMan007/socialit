# Socialit — Reddit for places

Socialit pairs an interactive geographic map with location-based community discussions. The app has a React map-first client and a Django REST Framework API backed by GeoDjango and PostGIS.

## Repository layout

- `frontend/` — React, TypeScript, Vite, Leaflet/OpenStreetMap map and optional Google Places search
- `backend/` — Django REST Framework API and GeoDjango models
- `socialit/`, `threads/` — Django project and spatial threads app
- `infra/` — local Docker Compose and Cloud Run container configuration
- `docs/` — system, component, database, API, security and deployment architecture

## Quick start

Requirements: Node.js 20+ and Docker Compose. Docker Compose includes the API and PostGIS database.

1. Copy `frontend/.env.example` to `frontend/.env.local`; optionally set a referrer-restricted Maps browser key.
2. Start PostGIS and the Django API: `docker compose -f infra/docker-compose.yml up --build`.
3. Start the UI from `frontend/`: `npm install`, then `npm run dev`.

For a local Python run, install `backend/requirements.txt` and the native GDAL, GEOS, and PROJ libraries required by GeoDjango, set `DATABASE_URL` from `backend/.env.example`, run `python manage.py migrate`, then `python manage.py runserver 0.0.0.0:8000`. Health is at `http://localhost:8000/health`. Docker is the simpler Windows setup.

The map uses OpenStreetMap tiles and works without a Google Maps key. Set `VITE_OSM_TILE_URL` to a compatible tile provider for deployments with higher traffic; configure Google Places separately if place autocomplete is needed.

## Maps credentials

Set `VITE_GOOGLE_MAPS_API_KEY` only to a browser key restricted by HTTP referrer and API. Enable Maps JavaScript API and Places API (New); do not use a server key in the browser. Full credential and billing setup is in [deployment.md](docs/deployment.md#google-maps-platform-setup).

## Delivery plan

The current foundation includes the map-first interface, Django health/thread/nearby endpoints, and PostGIS schema. Authentication and server-backed social interactions follow in Phase 2. See [architecture.md](docs/architecture.md#phase-by-phase-plan).
