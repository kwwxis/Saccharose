export interface ProcessEnv {
  NODE_ENV: 'development' | 'production';

  // Server Settings
  // --------------------------------------------------------------------------------------------------------------

  WEB_DOMAIN: string;
  WEB_ACCESS_LOG: string;
  VHOST: string;
  VHOSTED: string;
  HTTP_PORT: string;
  HTTPS_PORT: string;
  LOGVIEW_FILE: string;
  SITE_TITLE?: string;
  SITE_SHORT_TITLE?: string;

  // SSL Settings
  // --------------------------------------------------------------------------------------------------------------

  SSL_ENABLED: string;
  SSL_KEY: string;
  SSL_CERT: string;
  SSL_CA: string;
  SSL_CACERT: string;

  // Session and Auth Configuration
  // --------------------------------------------------------------------------------------------------------------

  SESSION_SECRET: string;
  CSRF_TOKEN_SECRET: string;
  DISCORD_APP_CLIENT_ID: string;
  DISCORD_APP_CLIENT_SECRET: string;

  // Shell Settings
  // --------------------------------------------------------------------------------------------------------------

  SHELL_PATH: string;
  SHELL_EXEC: string;
  PYTHON_COMMAND: string;
  NODE_COMMAND: string;

  // Redis Settings
  // --------------------------------------------------------------------------------------------------------------

  REDIS_ENABLED: string;
  REDIS_URL: string;

  // Genshin Data Configuration
  // --------------------------------------------------------------------------------------------------------------

  GENSHIN_DATA_ROOT: string;
  GENSHIN_CHANGELOGS: string;
  GENSHIN_ARCHIVES: string;

  // Honkai Star Rail Data Configuration
  // --------------------------------------------------------------------------------------------------------------

  HSR_DATA_ROOT: string;

  // Zenless Zone Zero Data Configuration
  // --------------------------------------------------------------------------------------------------------------

  ZENLESS_DATA_ROOT: string;

  // Wuthering Waves Data Configuration
  // --------------------------------------------------------------------------------------------------------------

  WUWA_DATA_ROOT: string;

  // External Directory and Images Configuration
  // --------------------------------------------------------------------------------------------------------------

  EXT_GENSHIN_IMAGES: string;
  EXT_GENSHIN_IMAGES_ARCHIVE: string;
  EXT_HSR_IMAGES: string;
  EXT_ZENLESS_IMAGES: string;
  EXT_WUWA_IMAGES: string;

  // PostgreSQL Configuration
  // --------------------------------------------------------------------------------------------------------------

  POSTGRES_HOST: string;
  POSTGRES_DATABASE: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;

  // Fandom MediaWiki API
  // --------------------------------------------------------------------------------------------------------------

  MW_USERNAME: string;
  MW_PASSWORD: string;

  // Misc Settings
  // --------------------------------------------------------------------------------------------------------------

  TMP_DIR: string;

  // Debug Flags
  // --------------------------------------------------------------------------------------------------------------

  DEBUG: string;
}

declare var process: {
  env: ProcessEnv
}
