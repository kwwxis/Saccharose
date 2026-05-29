-- This file must be run on each gamedata database (genshin, hsr, etc.)

-- SETTINGS
--------------------------------------------------------------------------------------------------------------
ALTER SYSTEM SET wal_level = 'minimal';
ALTER SYSTEM SET archive_mode = 'off';
ALTER SYSTEM SET max_wal_senders = 0;

-- TEXTMAP CHANGES
--------------------------------------------------------------------------------------------------------------
CREATE TABLE textmap_hash_aggs
(
    hash        TEXT NOT NULL,
    agg_id      UUID NOT NULL DEFAULT gen_random_uuid(),
    PRIMARY KEY (hash)
);

CREATE TABLE textmap_changes
(
    version         TEXT NOT NULL,
    lang_code       TEXT NOT NULL,
    hash            TEXT NOT NULL,
    agg_id          UUID NOT NULL,

    change_type     TEXT NOT NULL,
    content         TEXT,
    prev_content    TEXT,
    prev_hash       TEXT,
    PRIMARY KEY (version, lang_code, hash)
);

CREATE INDEX textmap_changes_version_lang_code_idx ON textmap_changes (version, lang_code);
CREATE INDEX idx_textmap_changes_version_change_type ON textmap_changes (version, change_type);
CREATE INDEX idx_textmap_changes_lang_code_agg_id ON textmap_changes (lang_code, agg_id);
CREATE INDEX idx_textmap_changes_agg_id_lang_code ON textmap_changes (agg_id, lang_code);

-- EXCEL SCALARS
--------------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS excel_scalars CASCADE;

CREATE TABLE excel_scalars
(
    scalar_value    TEXT NOT NULL,
    file_usages     JSONB NOT NULL,
    PRIMARY KEY (scalar_value)
);

-- EXCEL CHANGES
--------------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS excel_changes CASCADE;

CREATE TABLE excel_changes
(
    excel_file      TEXT NOT NULL,
    version         TEXT NOT NULL,
    key             TEXT NOT NULL,
    change_type     TEXT NOT NULL,
    json            JSONB,
    PRIMARY KEY (excel_file, version, key)
);

-- Non-unique index on "version"
CREATE INDEX excel_changes_version_idx ON excel_changes (version);

-- Non-unique composite index on ("key", "excel_file")
CREATE INDEX idx_excel_change_entity_key_version ON excel_changes (key, excel_file);
