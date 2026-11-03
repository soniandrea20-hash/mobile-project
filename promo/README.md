# Promo video assets

Records real-app clips with Playwright (clips are regenerable, not versioned).

Prerequisites: backend (`:3000`) and web (`http://local1.localhost:8081`) running, `database/seeds/dev_local1.sql` applied.

```
npm install
npx playwright install chromium
npm run reset                   # dev DB: delete local1/palermo orders + "Promo hamburguesa" content, rewind order counter (sql/reset_demo_orders.sql)
npm run capture                 # reset, then all clips -> clips/ (.webm desktop, .mp4 phone, + .png of the final state)
npm run capture -- autopedido   # only clips whose name contains the filter
npm run stills [name]           # reset, then 4K PNG stills for Veo (phone 1215x2160, desktop/player 3840x2160) -> stills/
npm run scenes [name]           # reset, then one trimmed .mp4 per storyboard scene -> scenes/
```

`reset` reads the `DB_*` settings from `backend/.env` (dev only; uploaded files stay orphaned in the dev uploads dir). Each run starts with order #1.

Scene clips (and the phone clip) are CDP screencasts started once the screen is settled and stopped 0.5 s after the last action, so they need no trimming. Phone: 405x720 @3x (1215x2160) downscaled to 1080x1920; desktop: 1920x1080. All H.264, 30 fps. Requires `ffmpeg` on PATH.

## Presentation video (Remotion)

1080p / 30 fps product presentation built from `ai/*.mp4` (Veo) and `scenes/*.mp4` (real app).

```
npm run studio   # preview in Remotion Studio
npm run render   # -> out/mostrador-presentacion.mp4 (H.264, ~71 s)
```

Both scripts first copy the media into `public/` (gitignored) via `scripts/prepare-media.mjs`.

Optional soundtrack: drop `ai/musica.mp3`; it plays under the whole video at 0.3 volume with fades. The video renders fine without it.
