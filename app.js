"use strict";

// Resolve URLs relative to this script so the GitHub Pages project path (/hmm/) works.
// The archive is served by the site itself. Visitors are never asked to upload it.
// For split archives, list every part here in the correct order, e.g.
// ["game.unx.part001", "game.unx.part002"].
const ARCHIVE_PARTS = ["./game.unx"];
const RUNNER_MODULE = "./runtime/undertale-runner.js";

const $ = (id) => document.getElementById(id);
const canvas = $("game-canvas");
let runner = null;
let databasePromise = null;

function log(message) {
  const output = $("console-output");
  output.textContent += "\n" + String(message);
  output.scrollTop = output.scrollHeight;
}

function setStatus(message, kind = "") {
  $("status-text").textContent = message;
  $("loading-message").textContent = message;
  const dot = $("status-dot");
  dot.className = "status-dot" + (kind ? " " + kind : "");
  log(message);
}

function describeError(error) {
  if (!error) return "Unknown error";
  return [error.name, error.message].filter(Boolean).join(": ");
}

function openSaveDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("This browser does not support IndexedDB save storage."));
      return;
    }
    const request = indexedDB.open("hmm-webport-saves", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open save database."));
    request.onblocked = () => log("Save database upgrade is blocked by another open tab.");
  });
  return databasePromise;
}

function createSaveStore(db) {
  function request(mode, operation) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("files", mode);
      const store = tx.objectStore("files");
      let result;
      try { result = operation(store); }
      catch (error) { reject(error); return; }
      tx.oncomplete = () => resolve(result && "result" in result ? result.result : result);
      tx.onerror = () => reject(tx.error || new Error("Save database transaction failed."));
      tx.onabort = () => reject(tx.error || new Error("Save database transaction was aborted."));
    });
  }
  return Object.freeze({
    get: (key) => request("readonly", (store) => store.get(String(key))),
    set: (key, value) => request("readwrite", (store) => store.put(value, String(key))),
    delete: (key) => request("readwrite", (store) => store.delete(String(key))),
    keys: () => request("readonly", (store) => store.getAllKeys())
  });
}

async function readResponse(response, partIndex, partCount) {
  const declaredLength = Number(response.headers.get("content-length")) || 0;
  if (!response.body || !response.body.getReader) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    $("download-progress").removeAttribute("value");
    return bytes;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    chunks.push(result.value);
    loaded += result.value.byteLength;
    if (declaredLength > 0 && partCount === 1) {
      $("download-progress").value = Math.min(100, Math.round((loaded / declaredLength) * 100));
      setStatus("Downloading game archive… " + Math.round((loaded / declaredLength) * 100) + "%");
    } else {
      setStatus("Downloading archive part " + (partIndex + 1) + " of " + partCount + "…");
    }
  }
  const output = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

async function loadArchive() {
  const parts = [];
  let totalBytes = 0;
  for (let index = 0; index < ARCHIVE_PARTS.length; index += 1) {
    const path = ARCHIVE_PARTS[index];
    setStatus("Looking for " + path + "…");
    const url = new URL(path, import.meta.url);
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Game archive not found. The site expects " + path + " beside index.html.");
      }
      throw new Error("Could not fetch " + path + " (HTTP " + response.status + ").");
    }
    const bytes = await readResponse(response, index, ARCHIVE_PARTS.length);
    if (bytes.byteLength === 0) throw new Error(path + " is empty.");
    parts.push(bytes);
    totalBytes += bytes.byteLength;
    log("Loaded " + path + " (" + bytes.byteLength.toLocaleString() + " bytes).");
  }
  const archive = new Uint8Array(totalBytes);
  let offset = 0;
  for (const part of parts) {
    archive.set(part, offset);
    offset += part.byteLength;
  }
  $("download-progress").value = 100;
  return archive;
}

async function startGame() {
  try {
    setStatus("Checking for game archive…");
    const archive = await loadArchive();
    log("Game archive loaded: " + archive.byteLength.toLocaleString() + " bytes.");

    setStatus("Opening persistent save storage…");
    const db = await openSaveDatabase();
    const saveStore = createSaveStore(db);

    setStatus("Checking for compatible Undertale browser runner…");
    let runnerModule;
    try {
      runnerModule = await import(RUNNER_MODULE);
    } catch (error) {
      if (error && (error.code === "ERR_MODULE_NOT_FOUND" || error.message?.includes("Failed to fetch") || error.message?.includes("Importing a module script failed"))) {
        throw new Error("The game archive is present, but the compatible browser runner has not been added yet.");
      }
      throw error;
    }

    const createRunner = runnerModule.createUndertaleRunner || runnerModule.default;
    if (typeof createRunner !== "function") {
      throw new Error("runtime/undertale-runner.js must export createUndertaleRunner().");
    }

    runner = await createRunner({
      canvas,
      archive,
      saveStore,
      onStatus: (message) => setStatus(message),
      onLog: (message) => log(message)
    });
    if (!runner || typeof runner.start !== "function") {
      throw new Error("Runner adapter must return an object with start().");
    }
    await runner.start();
    $("loading-overlay").hidden = true;
    setStatus("Game running.", "good");
    canvas.focus();
  } catch (error) {
    const message = describeError(error);
    setStatus(message, "bad");
    log("BOOT ERROR: " + (error.stack || message));
    $("loading-message").textContent = message;
    $("loading-overlay").hidden = false;
    $("download-progress").hidden = true;
  }
}

function sendInput(type, key) {
  if (!runner) return;
  try {
    if (typeof runner.input === "function") runner.input(type, key);
    else if (type === "keydown" && typeof runner.keyDown === "function") runner.keyDown(key);
    else if (type === "keyup" && typeof runner.keyUp === "function") runner.keyUp(key);
  } catch (error) {
    log("Input error: " + describeError(error));
  }
}

function normaliseKey(key) {
  return key.length === 1 ? key.toLowerCase() : key;
}

window.addEventListener("keydown", (event) => {
  const key = normaliseKey(event.key);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
  sendInput("keydown", key);
});
window.addEventListener("keyup", (event) => sendInput("keyup", normaliseKey(event.key)));
window.addEventListener("blur", () => {
  ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "z", "x", "Enter", "Shift"].forEach((key) => sendInput("keyup", key));
});

document.querySelectorAll("[data-key]").forEach((button) => {
  const key = button.dataset.key;
  const release = (event) => {
    if (event) event.preventDefault();
    button.classList.remove("pressed");
    sendInput("keyup", key);
  };
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.classList.add("pressed");
    try { button.setPointerCapture(event.pointerId); } catch (_) {}
    sendInput("keydown", key);
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
  button.addEventListener("contextmenu", (event) => event.preventDefault());
});

$("fullscreen-button").addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) await $("game-canvas").parentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch (error) { log("Fullscreen unavailable: " + describeError(error)); }
});
$("console-button").addEventListener("click", () => {
  const panel = $("console-panel");
  panel.hidden = !panel.hidden;
  $("console-button").setAttribute("aria-expanded", String(!panel.hidden));
});

log("Automatic archive loading is enabled (game.unx).");
log("Save storage uses IndexedDB.");
log("Runner module expected at " + RUNNER_MODULE + ".");
startGame();
