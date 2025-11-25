/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_STORAGE_ACCOUNT: string
  readonly VITE_AZURE_CONTAINER_NAME: string
  readonly VITE_AZURE_ACCOUNT_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
