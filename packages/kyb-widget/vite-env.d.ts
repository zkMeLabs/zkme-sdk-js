/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ZKME_WIDGET_ORIGIN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
