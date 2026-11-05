# Undertale Webport scaffold (`hmm`)

This scaffold is configured for the GitHub repository `sagaofowlz/hmm` and its
GitHub Pages project URL:

**https://sagaofowlz.github.io/hmm/**

The HTML, CSS, JavaScript, archive requests, and future runner imports all use
paths relative to the deployed page/script. That means they resolve under
`/hmm/` automatically; there is no hard-coded root-domain path to change.

## How archive loading works

The page automatically requests `game.unx` beside `index.html`. Visitors do
not select or upload a game file. For split archives, edit `ARCHIVE_PARTS` near
the top of `app.js` and list the archive parts in order.

The archive is not included in this scaffold. `.gitignore` excludes `game.unx`,
its split parts, and `data.win` to reduce accidental commits. A `.unx` archive
still contains the game's copyrighted material; only publish or host it if you
have permission to distribute it. Changing the extension or storing it in a
repo with an unrelated name does not change that.

## Install into `hmm` on Windows

1. Clone the new repository:

   ```powershell
   git clone https://github.com/sagaofowlz/hmm.git
   cd hmm
   ```

2. Extract this scaffold ZIP. From the extracted `hmm-webport-scaffold`
   folder, run:

   ```powershell
   .\apply-to-repo.ps1 -RepositoryPath "C:\path\to\hmm"
   ```

   Replace `C:\path\to\hmm` with the folder where you cloned the repo.

3. Back in the `hmm` folder, review and push the changes:

   ```powershell
   git status
   git add index.html styles.css app.js README.md .gitignore .github/workflows/pages.yml runtime/README.md
   git commit -m "Add automatic game.unx web loader"
   git push -u origin main
   ```

4. On GitHub, open **Settings → Pages** and choose **GitHub Actions** under
   Build and deployment. The workflow deploys on each push to `main`.

Your project page will be **https://sagaofowlz.github.io/hmm/** once the first
Pages deployment succeeds.

## Current status

- [x] Remove the old Butterscotch-specific upload flow.
- [x] Automatically fetch `game.unx` from the site.
- [x] Add IndexedDB-backed save storage for a future runner adapter.
- [x] Add keyboard, touch, and fullscreen input plumbing.
- [x] Use project-page-relative URLs that work under `/hmm/`.
- [ ] Add a compatible browser runner for Undertale's exact GameMaker build.
- [ ] Test title screen, audio, controls, and save persistence in real browsers.

**This scaffold is not playable yet.** It can fetch the archive and prepare save
storage, but it still needs a compatible game runner. Mollomm's public
repository does not include an explicit license, so this scaffold does not
copy its runner source or binaries. The adapter contract is documented in
`runtime/README.md`.

## Runner adapter contract

Implement `runtime/undertale-runner.js` and export
`createUndertaleRunner({ canvas, archive, saveStore, onStatus, onLog })`.
The function should return an object with `start()` and optional `input()` and
`stop()` methods. See `runtime/README.md` for the exact interface.

## GitHub Pages details

- Repository: `sagaofowlz/hmm`
- Pages project path: `/hmm/`
- Expected page URL: `https://sagaofowlz.github.io/hmm/`
- Deployment source: GitHub Actions (`.github/workflows/pages.yml`)
