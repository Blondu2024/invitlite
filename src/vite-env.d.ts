/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Where the photo worker lives, e.g. https://poze.invitlite.app. Unset: no upload button. */
  readonly VITE_PHOTO_API?: string;
}
