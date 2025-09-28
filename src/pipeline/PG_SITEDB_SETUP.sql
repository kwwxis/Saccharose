-- Run this on the "saccharose" database
-- Use "CREATE DATABASE saccharose;" if not already created.

-- TODO: built-in DB migrations

-- Create extension
----------------------------------------------------------------------------------------------------------------
CREATE EXTENSION bktree;
ALTER SYSTEM SET wal_level = 'minimal';
ALTER SYSTEM SET archive_mode = 'off';
ALTER SYSTEM SET max_wal_senders = 0;

CREATE EXTENSION pg_trgm;

-- Site User
----------------------------------------------------------------------------------------------------------------
CREATE TABLE site_user
(
    discord_id          TEXT NOT NULL PRIMARY KEY,
    discord_username    TEXT,
    wiki_id             BIGINT,
    wiki_username       TEXT,
    json_data           JSONB NOT NULL
);

CREATE TABLE site_user_wiki_bypass
(
    wiki_username       TEXT UNIQUE,
    discord_id          TEXT UNIQUE,
    comment             TEXT
);

CREATE TABLE site_user_banned
(
    wiki_username       TEXT UNIQUE,
    discord_id          TEXT UNIQUE,
    reason              TEXT,
    mod_note            TEXT
);

-- Site Notice
----------------------------------------------------------------------------------------------------------------
CREATE TYPE site_notice_type AS ENUM ('info', 'success', 'error', 'warning');

CREATE TABLE site_notice
(
	id              SERIAL PRIMARY KEY,
    notice_title    TEXT NOT NULL,
    notice_type     site_notice_type NOT NULL,
    notice_body     TEXT,
    notice_link     TEXT,
    notice_enabled  BOOLEAN DEFAULT TRUE,
    banner_enabled  BOOLEAN DEFAULT FALSE,
    site_mode       TEXT,
    exclude_site_modes TEXT[]
);

CREATE INDEX site_notice_enabled_idx ON site_notice (notice_enabled, banner_enabled);

CREATE TABLE site_notice_dismissed
(
    discord_id          TEXT NOT NULL,
    notice_id           INTEGER NOT NULL,
    PRIMARY KEY (discord_id, notice_id)
);

-- Site LogView
----------------------------------------------------------------------------------------------------------------
CREATE TYPE site_logview_type AS ENUM ('access', 'debug', 'other');

CREATE TABLE site_logview
(
    sha_hash        TEXT            NOT NULL PRIMARY KEY,
    log_type        site_logview_type NOT NULL,
    timestamp       TIMESTAMP WITH TIME ZONE NOT NULL,
    full_content    TEXT            NOT NULL,
    content         TEXT            NOT NULL,
    discord_user    TEXT,
    wiki_user       TEXT,
    lang_in         TEXT,
    lang_out        TEXT,
    search_mode     TEXT,
    http_status     SMALLINT,
    http_method     TEXT,
    http_uri        TEXT,
    http_runtime    NUMERIC
);

CREATE INDEX site_logview_content_trgm_idx ON site_logview USING GIN (content gin_trgm_ops);

CREATE INDEX site_logview_discord_user_idx ON site_logview (log_type, timestamp, discord_user);
CREATE INDEX site_logview_wiki_user_idx ON site_logview (log_type, timestamp, wiki_user);

-- Site Saved Searches
----------------------------------------------------------------------------------------------------------------
CREATE TYPE site_searches_usage_type AS ENUM ('recent', 'saved', 'public');

CREATE TABLE site_searches
(
    sha_hash        TEXT NOT NULL PRIMARY KEY,
    user_id         TEXT NOT NULL,
    usage_type      site_searches_usage_type NOT NULL,
    usage_time      TIMESTAMP WITH TIME ZONE NOT NULL,

    site_mode       TEXT NOT NULL,
    search_area     TEXT NOT NULL,
    search_mode     TEXT NOT NULL,
    search_query    TEXT NOT NULL,
    other_fields    JSONB NOT NULL DEFAULT '{}'::jsonb,

    meta_name       TEXT,
    meta_desc       TEXT
);

CREATE INDEX site_searches_query_trgm_idx ON site_searches USING GIN (search_query gin_trgm_ops);
CREATE INDEX site_searches_name_trgm_idx ON site_searches USING GIN (meta_name gin_trgm_ops);

CREATE INDEX site_searches_general_idx ON site_searches (site_mode, usage_type, search_area, usage_time);
CREATE INDEX site_searches_user_idx ON site_searches (user_id);

-- Script Jobs
----------------------------------------------------------------------------------------------------------------
CREATE TABLE api_keys
(
    api_key     TEXT    NOT NULL    PRIMARY KEY,
    expires     BIGINT,
    info        TEXT,
    owner_id    TEXT   NOT NULL,
    owner_name  TEXT   NOT NULL
);

-- GENSHIN IMAGE INDEX
----------------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS genshin_image_index;

CREATE TABLE genshin_image_index
(
    image_name      TEXT NOT NULL PRIMARY KEY,
    image_width     INTEGER NOT NULL,
    image_height    INTEGER NOT NULL,
    image_size      INTEGER NOT NULL,
    image_cats      JSONB,
    first_version   TEXT,
    excel_usages    TEXT[],
    excel_meta      JSONB,
    extra_info      JSONB
);

CREATE INDEX genshin_image_index_trgm_idx ON genshin_image_index USING GIN (image_name gin_trgm_ops);

CREATE INDEX genshin_image_index_cat_idx ON genshin_image_index USING GIN (image_cats);

-- HSR IMAGE INDEX
----------------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS hsr_image_index;

CREATE TABLE hsr_image_index
(
    image_name      TEXT NOT NULL PRIMARY KEY,
    image_width     INTEGER NOT NULL,
    image_height    INTEGER NOT NULL,
    image_size      INTEGER NOT NULL,
    image_cats      JSONB,
    first_version   TEXT,
    excel_usages    TEXT[],
    excel_meta      JSONB,
    extra_info      JSONB
);

CREATE INDEX hsr_image_index_trgm_idx ON hsr_image_index USING GIN (image_name gin_trgm_ops);

CREATE INDEX hsr_image_index_cat_idx ON hsr_image_index USING GIN (image_cats);

-- WUWA IMAGE INDEX
----------------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS wuwa_image_index;

CREATE TABLE wuwa_image_index
(
    image_name      TEXT NOT NULL PRIMARY KEY,
    image_width     INTEGER NOT NULL,
    image_height    INTEGER NOT NULL,
    image_size      INTEGER NOT NULL,
    image_cats      JSONB,
    first_version   TEXT,
    excel_usages    TEXT[],
    excel_meta      JSONB,
    extra_info      JSONB
);

CREATE INDEX wuwa_image_index_trgm_idx ON wuwa_image_index USING GIN (image_name gin_trgm_ops);

CREATE INDEX wuwa_image_index_cat_idx ON wuwa_image_index USING GIN (image_cats);

-- Script Jobs
----------------------------------------------------------------------------------------------------------------
CREATE TABLE script_jobs
(
    job_id          TEXT        NOT NULL    PRIMARY KEY,
    job_pid         INTEGER,
    job_exit_code   SMALLINT,
    run_ack         BOOLEAN     NOT NULL    DEFAULT FALSE,
    run_complete    BOOLEAN     NOT NULL    DEFAULT FALSE,

    run_start       BIGINT      NOT NULL,
    run_end         BIGINT,
    run_log         TEXT[]      NOT NULL    DEFAULT '{}',

    run_action      TEXT        NOT NULL,
    run_args        JSONB       NOT NULL,

    result_msg      TEXT,
    result_error    TEXT,
    result_data     JSONB
);

CREATE INDEX script_jobs_run_action ON script_jobs (run_action);
CREATE INDEX script_jobs_job_pid ON script_jobs (job_pid);
CREATE INDEX script_jobs_run_action_incomplete ON script_jobs (run_action) WHERE run_complete IS FALSE;
CREATE INDEX script_jobs_job_pid_complete ON script_jobs (job_pid) WHERE run_complete IS FALSE;

-- Genshin Wiki Revisions
----------------------------------------------------------------------------------------------------------------
CREATE TABLE genshin_wiki_revs
(
    pageid      bigint not null,
    revid       bigint not null primary key,
    parentid    bigint,
    json        jsonb,
    segments    jsonb
);

CREATE INDEX genshin_wiki_revs_pageid ON genshin_wiki_revs (pageid);

CREATE TABLE genshin_wiki_article_info
(
    pageid      bigint not null primary key,
    title       text not null unique,
    expires     bigint not null,
    json        jsonb not null
);

-- HSR Wiki Revisions
----------------------------------------------------------------------------------------------------------------
CREATE TABLE hsr_wiki_revs
(
    pageid      bigint not null,
    revid       bigint not null primary key,
    parentid    bigint,
    json        jsonb,
    segments    jsonb
);

CREATE INDEX hsr_wiki_revs_pageid ON hsr_wiki_revs (pageid);

CREATE TABLE hsr_wiki_article_info
(
    pageid      bigint not null primary key,
    title       text not null unique,
    expires     bigint not null,
    json        jsonb not null
);

-- Zenless Wiki Revisions
----------------------------------------------------------------------------------------------------------------
CREATE TABLE zenless_wiki_revs
(
    pageid      bigint not null,
    revid       bigint not null primary key,
    parentid    bigint,
    json        jsonb,
    segments    jsonb
);

CREATE INDEX zenless_wiki_revs_pageid ON zenless_wiki_revs (pageid);

CREATE TABLE zenless_wiki_article_info
(
    pageid      bigint not null primary key,
    title       text not null unique,
    expires     bigint not null,
    json        jsonb not null
);

-- Wuwa Wiki Revisions
----------------------------------------------------------------------------------------------------------------
CREATE TABLE wuwa_wiki_revs
(
    pageid      bigint not null,
    revid       bigint not null primary key,
    parentid    bigint,
    json        jsonb,
    segments    jsonb
);

CREATE INDEX wuwa_wiki_revs_pageid ON wuwa_wiki_revs (pageid);

CREATE TABLE wuwa_wiki_article_info
(
    pageid      bigint not null primary key,
    title       text not null unique,
    expires     bigint not null,
    json        jsonb not null
);
