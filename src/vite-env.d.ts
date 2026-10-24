/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Where the photo worker lives, e.g. https://invitlite-photos.x.workers.dev. Unset: no upload button. */
  readonly VITE_PHOTO_API?: string;
}
