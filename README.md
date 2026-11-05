# hmm

A minimalist Undertale browser shell deployed at:

**https://sagaofowlz.github.io/hmm/**

## Interface

The page is a game-only viewport: one centered 4:3 canvas, keyboard controls,
and a small **DBG** toggle. Press **F1** to open the debug log and **F2** to
request fullscreen. There is no visitor import/file-picker flow.

## Runner

The browser runner is **Starfait**, an open-source GameMaker runner reimplementation
that includes a Kotlin/Wasm browser target and specifically targets Undertale
v1.08 / WAD version 16. The Pages workflow checks out Starfait at a pinned commit,
applies a small browser-audio-unlock patch, builds its Wasm library, and copies
the generated module plus its Apache-2.0 license into the deployed site.

Source: https://github.com/MrPowerGamerBR/Starfait

## Game assets

The loader expects these game assets in the site build:

- `game.unx` at the repository root.
- External `.ogg` audio files inside `mus/`.

The Pages workflow generates a manifest from those files. The browser copies
them into OPFS once, then reuses the cached bundle. Starfait stores game saves
in a separate OPFS directory, so saves can persist across visits on the same
browser and site origin.

**No game assets are included in this scaffold.** A `.unx` file still contains
copyrighted Undertale content; its extension and the repository's name do not
change the rights attached to the contents. Only host or distribute the game
files if you have permission to do so. The `.gitignore` deliberately excludes
`game.unx` and `mus/` to prevent accidentally publishing them.

## Compatibility notes

This build targets Undertale v1.08 / WAD 16. Starfait's project reports that the
True Pacifist route is playable, with some minor graphical glitches from missing
built-ins. Other Undertale versions and other GameMaker games are not guaranteed.

## Current status

- [x] Mollomm-style game-only viewport and keyboard input
- [x] Compact debug panel
- [x] Starfait Kotlin/Wasm runner build in GitHub Actions
- [x] Automatic `game.unx` and external-audio loading into OPFS
- [x] OPFS save directory
- [ ] First real boot with the matching Undertale archive and `mus/` audio files
- [ ] Test audio, input, save persistence, and room transitions in browser

The code is prepared for the runner, but gameplay is not verified until a
permitted, matching game archive and its external audio files are available to
the Pages build.
