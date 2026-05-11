declare module "bun" {
  interface Env {
    AUTOSTART: string
    DB_NAME: string
    DB_PATH: string
    DEBUG: boolean
    DEBUG_SQL: string
    IS_DEBUG: string
    LOGO_URL: string
    MAX_LENGTH: string
    MIN_LENGTH: string
    NAME: string
    npm_package_version: string
    POINTS: string
    TOKEN: string
  }
}
