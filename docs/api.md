# API outline

Base path: `/api/v1`. The development API runs at `http://localhost:8000`; health is available at `/health`.

| Method | Path | Phase | Purpose |
|---|---|---:|---|
| GET | `/health` | 1 | Liveness and service version |
| GET | `/api/v1/threads` | 1 | Recent public feed, bounded limit |
| POST | `/api/v1/threads` | 1 | Create a thread with WGS84 pin coordinates |
| POST | `/api/v1/threads` | 1 | Create a thread with map-pin latitude/longitude and optional Place ID |
| GET | `/api/v1/nearby/threads?lat=&lng=&radius_m=` | 1 | Spatial feed, radius capped by service |
| GET | `/api/v1/locations/{id}/threads` | 1 | Threads for a known location |
| POST | `/api/v1/auth/register` | 2 | Register account, rate limited |
| POST | `/api/v1/auth/login` | 2 | Login, rate limited |
| GET/PATCH | `/api/v1/users/{id}` | 2 | Read/edit profile with ownership checks |
| POST | `/api/v1/threads` | 2 | Create thread and optional coordinates/place ID |
| GET/PATCH/DELETE | `/api/v1/threads/{id}` | 2 | Thread CRUD and author/admin authorization |
| POST | `/api/v1/threads/{id}/vote` | 2 | Upsert one vote per user |
| POST | `/api/v1/threads/{id}/save` | 2 | Save/unsave own collection |
| GET/POST | `/api/v1/threads/{id}/comments` | 2 | Read/create nested comments |

The local map composer stores posts in browser storage when the API/database is unavailable; with PostgreSQL/PostGIS connected, `POST /api/v1/threads` persists the pin as a geography point. The demo Friends and direct-message data stays local to that browser until account, friendship and messaging services are implemented. Do not treat prototype location-sharing markers as real users.
