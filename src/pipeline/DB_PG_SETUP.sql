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
    wiki_username       TEXT NOT NULL PRIMARY KEY
);

CREATE TABLE site_user_banned
(
    wiki_username       TEXT UNIQUE,
    discord_id          TEXT UNIQUE
);

-- Site User
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
    banner_enabled  BOOLEAN DEFAULT FALSE
);

CREATE TABLE site_notice_dismissed
(
    discord_id          TEXT NOT NULL,
    notice_id           INTEGER NOT NULL,
    PRIMARY KEY (discord_id, notice_id)
);

-- Script Jobs
----------------------------------------------------------------------------------------------------------------
CREATE TABLE api_keys
(
    api_key     TEXT    NOT NULL    PRIMARY KEY,
    expires     BIGINT,
    info        TEXT
);

-- IMAGE HASHES
----------------------------------------------------------------------------------------------------------------
CREATE TABLE genshin_image_hashes
(
	id SERIAL PRIMARY KEY,
	name text,
	hash bigint
);

CREATE INDEX bk_index_name ON genshin_image_hashes USING spgist (hash bktree_ops);

-- GENSHIN IMAGE INDEX
----------------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS genshin_image_index;

CREATE TABLE genshin_image_index
(
    image_name      TEXT NOT NULL PRIMARY KEY,
    image_size      BIGINT NOT NULL,
    image_cat1      TEXT,
    image_cat2      TEXT,
    image_cat3      TEXT,
    image_cat4      TEXT,
    image_cat5      TEXT,
    image_cat6      TEXT,
    image_cat7      TEXT,
    image_cat8      TEXT,
    excel_usages    TEXT[],
    excel_meta      JSONB
);

CREATE INDEX genshin_image_index_trgm_idx ON genshin_image_index USING GIN (image_name gin_trgm_ops);

CREATE INDEX genshin_image_index_cat_idx ON genshin_image_index (image_cat1, image_cat2, image_cat3, image_cat4, image_cat5, image_cat6, image_cat7, image_cat8);

-- HSR IMAGE INDEX
----------------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS hsr_image_index;

CREATE TABLE hsr_image_index
(
    image_name      TEXT NOT NULL PRIMARY KEY,
    image_size      BIGINT NOT NULL,
    image_cat1      TEXT,
    image_cat2      TEXT,
    image_cat3      TEXT,
    image_cat4      TEXT,
    image_cat5      TEXT,
    image_cat6      TEXT,
    image_cat7      TEXT,
    image_cat8      TEXT,
    excel_usages    TEXT[],
    excel_meta      JSONB
);

CREATE INDEX hsr_image_index_trgm_idx ON hsr_image_index USING GIN (image_name gin_trgm_ops);

CREATE INDEX hsr_image_index_cat_idx ON hsr_image_index (image_cat1, image_cat2, image_cat3, image_cat4, image_cat5, image_cat6, image_cat7, image_cat8);

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
