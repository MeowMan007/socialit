# Database design

PostgreSQL is the system of record. Enable PostGIS in each environment. Spatial thread coordinates use `geography(POINT, 4326)` so distance and radius are expressed in meters and indexed by GiST. `locations.google_place_id` is nullable and unique; user-created areas can use a polygon boundary later.

Planned normalized entities: users, profiles, threads, comments (self-referencing `parent_id`), votes (unique user/target), saved_threads, locations, location_followers, reports, media, notifications. Add indexes for `(created_at, id)`, location ID, place ID, vote target and GiST geography. Keep derived score and counters rebuildable; avoid trusting client-supplied counts.

The GeoDjango models and Django migration cover locations and threads. Run `python manage.py migrate` after configuring the PostGIS database. Do not use `migrate --run-syncdb` or ad hoc schema creation as a production migration strategy.
