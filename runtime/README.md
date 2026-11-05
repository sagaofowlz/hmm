# Browser runner adapter (not implemented yet)

The web shell expects `runtime/undertale-runner.js` to export either a named
`createUndertaleRunner(options)` function or a default function with the same
signature.

```js
export async function createUndertaleRunner({
  canvas,
  archive,       // Uint8Array containing game.unx (or the joined archive parts)
  saveStore,     // async get(key), set(key, value), delete(key), keys()
  onStatus,      // optional status callback
  onLog          // optional log callback
}) {
  return {
    async start() {},
    input(type, key) {}, // type is "keydown" or "keyup"
    async stop() {}
  };
}
```

This file is an interface contract only. It is not a game engine and does not
contain Mollomm's code or binaries. A real runner must be separately sourced
under terms that permit this use and tested against Undertale's exact build.
