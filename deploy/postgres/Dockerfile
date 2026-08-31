FROM postgis/postgis:16-3.5

# postgis image already includes contrib (pg_trgm, pg_stat_statements, pgcrypto).
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       postgresql-16-pgvector \
       postgresql-16-cron \
  && rm -rf /var/lib/apt/lists/*

COPY init/ /docker-entrypoint-initdb.d/
