CREATE DATABASE saccharose;

CREATE EXTENSION bktree;

CREATE TABLE genshin_hashes (
	id SERIAL PRIMARY KEY,
	name text,
	hash bigint
);

CREATE INDEX bk_index_name ON genshin_hashes USING spgist (hash bktree_ops);
