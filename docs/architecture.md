# System architecture

## 1. System context

```mermaid
flowchart LR
  Person[Community member] --> Web[React + TypeScript web client]
  Web -->|Maps JS + Places New| Maps[Google Maps Platform]
  Web -->|HTTPS REST /api/v1| API[Django REST Framework modular monolith on Cloud Run]
  API --> DB[(Cloud SQL PostgreSQL + PostGIS)]
  API -.optional cache.-> Redis[(Memorystore Redis)]
  API -.uploads, later phase.-> Storage[Cloud Storage]
  API --> Secrets[Secret Manager]
  API --> Obs[Cloud Logging + Monitoring]
  Web --> Edge[Vercel or Cloud CDN]
```

## 2. Component architecture

```mermaid
flowchart TB
  subgraph Browser
    Shell[App shell / responsive navigation]
    Search[Place search]
    Map[Map view + clustered discussion pins]
    Feed[Feed + location detail]
    ClientAPI[Typed REST client]
    Shell --> Search
    Shell --> Map
    Shell --> Feed
    Search --> Map
    Map --> Feed
    Feed --> ClientAPI
  end
  subgraph Django REST Framework modular monolith
    Router[Versioned API routers]
    Auth[Auth boundary - Phase 2]
    ThreadSvc[Thread service]
    GeoSvc[Geographic query service]
    Repo[Django ORM]
    Router --> Auth
    Router --> ThreadSvc
    ThreadSvc --> GeoSvc
    ThreadSvc --> Repo
  end
  ClientAPI --> Router
  Repo --> PostGIS[(PostgreSQL / PostGIS)]
  ThreadSvc -.later.-> Moderation[Moderation provider interface]
  ThreadSvc -.later.-> Cache[Redis cache]
```

## 3. Database ER diagram

```mermaid
erDiagram
  USERS ||--o| PROFILES : has
  USERS ||--o{ THREADS : authors
  LOCATIONS ||--o{ THREADS : contextualizes
  THREADS ||--o{ COMMENTS : contains
  USERS ||--o{ COMMENTS : authors
  USERS ||--o{ VOTES : casts
  THREADS ||--o{ VOTES : receives
  COMMENTS ||--o{ VOTES : receives
  USERS ||--o{ SAVED_THREADS : saves
  THREADS ||--o{ SAVED_THREADS : saved_as
  USERS ||--o{ LOCATION_FOLLOWERS : follows
  LOCATIONS ||--o{ LOCATION_FOLLOWERS : followed_by
  USERS ||--o{ REPORTS : submits
  THREADS ||--o{ REPORTS : reported
  USERS ||--o{ MEDIA : uploads
  USERS ||--o{ NOTIFICATIONS : receives
  USERS { uuid id PK string email UK string username UK }
  PROFILES { uuid user_id PK string avatar_url string bio }
  LOCATIONS { uuid id PK string google_place_id UK string name geometry boundary }
  THREADS { uuid id PK uuid author_id FK uuid location_id FK geography point position string title text body timestamp created_at }
  COMMENTS { uuid id PK uuid thread_id FK uuid parent_id FK uuid author_id FK text body }
  VOTES { uuid id PK uuid user_id FK uuid thread_id FK uuid comment_id FK smallint value }
  SAVED_THREADS { uuid user_id PK uuid thread_id PK }
  LOCATION_FOLLOWERS { uuid user_id PK uuid location_id PK }
  REPORTS { uuid id PK uuid reporter_id FK string target_type uuid target_id string reason }
  MEDIA { uuid id PK uuid owner_id FK string object_key string content_type }
  NOTIFICATIONS { uuid id PK uuid user_id FK string kind json payload timestamp created_at }
```

The initial migration-ready model focuses on `threads` and `locations`; the remaining entities are planned for Phase 2 onward. `geography(Point, 4326)` enables meter-based distance operations; GiST indexes support spatial filtering. Stable Google Place IDs are unique external identifiers, not substitutes for coordinates.

## 4. API architecture

```mermaid
flowchart LR
  Client[Web client] --> V1[/api/v1/]
  V1 --> Threads[/threads: cursor paginated/]
  V1 --> Nearby[/nearby/threads: radius + ranked/]
  V1 --> Locations[/locations/]
  V1 --> Search[/search: Places proxy only if needed/]
  V1 --> Auth[/auth: Phase 2/]
  Nearby --> Geo[Validated lat/lng/radius]
  Geo --> Query[ST_DWithin + indexed query]
  Query --> Rank[Distance + score + recency]
```

Public MVP endpoints: `GET /api/v1/threads`, `GET /api/v1/nearby/threads`, `GET /api/v1/locations/{id}/threads`, `GET /health`. Thread creation and mutations require authenticated identity and arrive with Phase 2. Feed endpoints use bounded page sizes and opaque cursor pagination as the feed grows.

## 5. Authentication flow (Phase 2)

```mermaid
sequenceDiagram
  actor U as User
  participant B as Browser
  participant API as Django REST Framework
  participant DB as PostgreSQL
  U->>B: Submit credentials or choose Google
  B->>API: Register/login or OAuth code + PKCE
  API->>API: Verify password / exchange OAuth code
  API->>DB: Find or create account
  API-->>B: Short-lived access JWT + rotating refresh cookie
  B->>API: Bearer access JWT for protected request
  API->>API: Verify signature, issuer, audience, expiry and scopes
```

Use Argon2id for passwords; keep refresh tokens in secure, HttpOnly, SameSite cookies and protect cookie-authenticated mutations with CSRF defenses. OAuth secrets and signing keys belong in Secret Manager. Never place credentials in Vite variables except the restricted public Maps browser key.

## 6. Google Maps integration

```mermaid
flowchart LR
  User[User types place] --> Auto[Places Autocomplete, session token]
  Auto --> Choice[Selected prediction + requested fields]
  Choice --> View[Pan/zoom map + selected place]
  View --> API[Fetch discussion feed by place ID or viewport]
  API --> Pins[Clustered discussion pins]
  Pins --> Panel[Location detail + thread feed]
```

Map movement updates local viewport state; fetch only after a deliberate idle/debounce and only when the viewport changes materially. Use Places field masks and autocomplete session tokens. The client uses a referrer/API-restricted browser key. A server key is unnecessary for this MVP; if server-side Places calls are introduced, isolate that credential in Secret Manager and restrict it by API and server identity.

## 7. Geographic search architecture

Requests validate finite WGS84 coordinates and clamp radius to a documented maximum. Django ORM binds values; PostGIS applies `ST_DWithin(position, origin, radius_meters)` against a GiST index. Distance is computed in meters and combined with upvotes, comment count, and recency for ranking. Place IDs and location IDs are exact indexed filters. City labels are descriptive metadata, never the geographic predicate.

## 8. Deployment architecture

```mermaid
flowchart LR
  Browser --> CDN[Cloud CDN or Vercel static hosting]
  CDN --> Assets[Hashed Vite assets]
  Browser -->|TLS| Run[Cloud Run Django REST Framework]
  Run -->|private IP / connector| SQL[(Cloud SQL PostgreSQL + PostGIS)]
  Run --> SM[Secret Manager]
  Run -.when cache justified.-> Memorystore[Memorystore Redis]
  Run -.uploaded media.-> GCS[Cloud Storage]
  Run --> Logs[Cloud Logging / Monitoring]
```

Start as one modular monolith on Cloud Run. Cloud SQL is the durable relational store; Redis is optional until measured load needs it; Cloud Storage is introduced with media uploads; Secret Manager holds runtime secrets; Logging and Monitoring capture structured logs, latency, error rates, and database health. Pub/Sub and AI services remain future adapters, not MVP microservices.

## 9. Security architecture

- Validate all input with Django REST Framework serializers and ORM expressions.
- Set explicit CORS origins; enforce TLS in production and secure response headers.
- Apply rate limits at the edge/API for login, registration, posting and search before public launch.
- Hash passwords, authorize mutations at the service boundary, and scope admin actions explicitly.
- Validate upload MIME, extension, decoded format and size; store objects privately and serve short-lived signed URLs.
- Escape user content at render time; moderate/report content through replaceable service interfaces.
- Store production secrets in Secret Manager; use separate restricted browser/server Google credentials.
- Use CSRF tokens for cookie-authenticated writes; bearer-only APIs need a matching-origin policy where browser credentials are attached.

## Phase-by-phase plan

1. **Foundation (implemented here):** responsive React shell, Maps loader and Places search hook, Django REST Framework service, PostGIS-ready models/query, local service configuration, architecture docs.
2. **Social core:** registration/login, profiles, thread CRUD, comments and nested replies, votes and saves, authorization, Django migrations.
3. **Geographic discovery:** indexed nearby feed, map markers/clustering, location feed/statistics, location search and cursor pagination.
4. **Operations:** Redis where measured useful, validated media uploads, notifications, moderation workflows, rate limiting and observability dashboards.
5. **AI adapters:** moderation, summaries, semantic search, recommendations and duplicate detection isolated behind provider interfaces.
6. **Production hardening:** Cloud Run/Cloud SQL deployment, secret rotation, load/abuse validation, backup and recovery drills, cost monitoring and security review.
