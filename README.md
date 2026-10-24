# INVITLITE: the invitation that lives inside the link

Free digital invitations for weddings, christenings, birthdays and 22 other occasions,
in Romanian. The whole invitation (names, date, places, programme, look) is compressed
into the URL fragment:

```
https://invitlite.app/i/#v1.<deflate, then base64url of the invitation's JSON>
```

The fragment never reaches a server. No account, no database, no cookies, no analytics.
Guests open an envelope, the invitation unfolds, and they confirm on the host's WhatsApp.

Live: **https://invitlite.app**

## What you get

- **25 occasions in 5 categories**, each with its own words, opening scene and photos.
- **Many versions of one invitation**: 5 photos per occasion, 7 colours, 7 typefaces,
  3 styles, background music composed for the project and played by the browser.
- **Your own photo** from phone or PC (see below).
- **Personal links** per guest, a QR code, a calendar file, printing.
- **RSVP on WhatsApp**: the answer goes from the guest's phone straight to the host.

## The one thing we keep: the host's photo

If the host uploads a photo, it is shrunk in the browser first (1600px, webp; drawing it
on a canvas drops EXIF and GPS), then stored by a small Cloudflare Worker
(`worker/`) in Workers KV with an expiry 30 days after the event (90 days when the
invitation has no date yet). Moving the event date moves the deletion day. The host can
delete it at once with a key kept only in their browser. Worker logs are off.
Only the photo's short address rides in the link. Details: https://invitlite.app/confidentialitate/

## Run it

```
npm install
npm run dev        # site on :5173
npm test           # vitest
npm run typecheck
```

Upload needs `VITE_PHOTO_API` (see `.env.production`); without it the upload button
simply does not appear. The worker: `cd worker && npx wrangler dev`.

## Credits

Stock photographs from Unsplash. Fonts are open-licensed and self-hosted.

## License

MIT. A free project of ELI-SAMI-TECH S.R.L., Romania.
