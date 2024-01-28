-- Run this on the "saccharose" database
-- Use "CREATE DATABASE saccharose;" if not already created.

-- TODO: built-in DB migrations

-- Create extension
----------------------------------------------------------------------------------------------------------------
CREATE EXTENSION bktree;
ALTER SYSTEM SET wal_level = 'minimal';
ALTER SYSTEM SET archive_mode = 'off';
ALTER SYSTEM SET max_wal_senders = 0;


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
CREATE TABLE genshin_hashes
(
	id SERIAL PRIMARY KEY,
	name text,
	hash bigint
);

CREATE INDEX bk_index_name ON genshin_hashes USING spgist (hash bktree_ops);

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
