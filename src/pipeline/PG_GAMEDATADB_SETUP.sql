-- This must be run on each gamedata database (genshin, hsr, etc.)
ALTER SYSTEM SET wal_level = 'minimal';
ALTER SYSTEM SET archive_mode = 'off';
ALTER SYSTEM SET max_wal_senders = 0;

CREATE TABLE textmap_changes
(

    version         TEXT NOT NULL,
    lang_code       TEXT NOT NULL,
    hash            TEXT NOT NULL,
    change_type     TEXT NOT NULL,
    content         TEXT,
    prev_content    TEXT,
    PRIMARY KEY (version, lang_code, hash)
);

CREATE INDEX textmap_changes_version_lang_code_idx ON textmap_changes (version, lang_code);
CREATE INDEX textmap_changes_hash_change_type_idx ON textmap_changes (hash, change_type);
