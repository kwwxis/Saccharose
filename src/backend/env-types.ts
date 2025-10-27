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
  WSS_PORT: string;
  WSS_URL: string;
  LOGVIEW_FILE?: string;
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
  JWT_SECRET: string;
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
  GENSHIN_ARCHIVES: string;

  // Honkai Star Rail Data Configuration
  // --------------------------------------------------------------------------------------------------------------

  HSR_DATA_ROOT: string;
  HSR_ARCHIVES: string;

  // Zenless Zone Zero Data Configuration
  // --------------------------------------------------------------------------------------------------------------

  ZENLESS_DATA_ROOT: string;
  ZENLESS_ARCHIVES: string;

  // Wuthering Waves Data Configuration
  // --------------------------------------------------------------------------------------------------------------

  WUWA_DATA_ROOT: string;
  WUWA_ARCHIVES: string;

  // External Directory and Images Configuration
  // --------------------------------------------------------------------------------------------------------------

  EXT_PUBLIC_DIR: string;
  EXT_GENSHIN_IMAGES: string;
  EXT_GENSHIN_IMAGES_ARCHIVE: string;
  EXT_HSR_IMAGES: string;
  EXT_HSR_IMAGES_ARCHIVE: string;
  EXT_ZENLESS_IMAGES: string;
  EXT_WUWA_IMAGES: string;

  // PostgreSQL Configuration
  // --------------------------------------------------------------------------------------------------------------

  POSTGRES_SITE_HOST: string;
  POSTGRES_SITE_USER: string;
  POSTGRES_SITE_PASSWORD: string;
  POSTGRES_SITE_PORT?: string;
  POSTGRES_SITE_DATABASE: string;

  POSTGRES_GAMEDATA_HOST: string;
  POSTGRES_GAMEDATA_USER: string;
  POSTGRES_GAMEDATA_PASSWORD: string;
  POSTGRES_GAMEDATA_PORT?: string;

  POSTGRES_GAMEDATA_DATABASE_GENSHIN: string;
  POSTGRES_GAMEDATA_DATABASE_HSR: string;
  POSTGRES_GAMEDATA_DATABASE_ZENLESS: string;
  POSTGRES_GAMEDATA_DATABASE_WUWA: string;

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

  GENSHIN_DISABLED: string;
  HSR_DISABLED: string;
  ZENLESS_DISABLED: string;
  WUWA_DISABLED: string;

  // Discord Bot
  // --------------------------------------------------------------------------------------------------------------
  DISCORD_BOT_CLIENT_ID: string;
  DISCORD_BOT_CLIENT_SECRET: string;
}

declare var process: {
  env: ProcessEnv
}
