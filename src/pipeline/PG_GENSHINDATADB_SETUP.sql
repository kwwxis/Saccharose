-- Table for ReadableChangeEntity
CREATE TABLE readable_changes
(
    loc_path        TEXT NOT NULL,
    version         TEXT NOT NULL,
    lang_code       TEXT NOT NULL,
    name            TEXT NOT NULL,
    content_hash    TEXT NOT NULL,
    PRIMARY KEY (loc_path, version),
    CONSTRAINT readable_changes_lang_name_version_unique UNIQUE (lang_code, name, version)
);

-- Index on loc_path for fast lookups
CREATE INDEX readable_changes_loc_path_idx ON readable_changes (loc_path);

-- Table for ReadableContentEntity
CREATE TABLE readable_content
(
    loc_path        TEXT NOT NULL,
    content_hash    TEXT NOT NULL,
    content_text    TEXT NOT NULL,
    PRIMARY KEY (loc_path, content_hash)
);

-- Foreign key relationship: each change must point to existing content
ALTER TABLE readable_changes
    ADD CONSTRAINT readable_changes_content_fk
        FOREIGN KEY (loc_path, content_hash)
            REFERENCES readable_content (loc_path, content_hash)
            ON DELETE CASCADE;
