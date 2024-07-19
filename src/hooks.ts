import { config } from "../package.json";
import { getString, initLocale } from "./modules/utils/locale";
import {getPref, setDefaultPrefs} from "./modules/utils/prefs";
import {waitUntil, waitUtilAsync} from "./modules/utils/wait";
import ZoteroToolkit from "zotero-plugin-toolkit/dist/index";
import { registerMenu } from "./modules/menu";
import { registerPrefsWindow } from "./modules/prefsWindow";
import { registerShortcuts } from "./modules/shortcuts";
import { registerReaderListeners } from "./modules/reader";
import MenuList = XUL.MenuList;

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  // TODO: implement locale initialization
  // initLocale();

  setDefaultPrefs();

  registerShortcuts();

  await registerReaderListeners();

  await onMainWindowLoad(window);
}

async function onMainWindowLoad(win: Window): Promise<void> {
  await new Promise((resolve) => {
    if (win.document.readyState !== "complete") {
      win.document.addEventListener("readystatechange", () => {
        if (win.document.readyState === "complete") {
          resolve(void 0);
        }
      });
    }
    resolve(void 0);
  });

  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  // TODO: optim - create custom toolkit to minify
  addon.data.ztoolkit = new ZoteroToolkit();

  // TODO: l10n - implement locale appending
  // (win as any).MozXULElement.insertFTLIfNeeded(
  //     `${config.addonRef}-mainWindow.ftl`,
  // );

  registerPrefsWindow();

  registerMenu();
}

async function onMainWindowUnload(win: Window): Promise<void> {
  ztoolkit.unregisterAll();

  // TODO: l10n - implement locale removal
  // win.document
  //     .querySelector(`[href="${config.addonRef}-mainWindow.ftl"]`)
  //     ?.remove();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  // Remove addon object
  addon.data.alive = false;
  delete Zotero[config.addonInstance];
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintian.

function onSpeak(text: string) {
  ztoolkit.log(`Speaking: ${text}`);

  addon.data.tts.engines[addon.data.tts.current].speak(text);
}

function onStop() {
  addon.data.tts.engines[addon.data.tts.current].stop();
}

// TODO: future - implement skipping to next as well as cancelling all

function onPause() {
  if (addon.data.tts.engines[addon.data.tts.current].canPause) {
    // @ts-ignore
    addon.data.tts.engines[addon.data.tts.current].pause();
  }
}

function onResume() {
  if (addon.data.tts.engines[addon.data.tts.current].canPause) {
    // @ts-ignore
    addon.data.tts.engines[addon.data.tts.current].resume();
  }
}

// for speaking using shortcuts and UI elements not specifically tied to any text (eg text selection popup)
// TODO: prefs - implement toggle between title/abstract and annotation/comment reading
function onContextualSpeak() {
  if (Zotero_Tabs.selectedType == "library") {
    // library tab context
    let items = Zotero.getActiveZoteroPane().getSelectedItems()
    // TODO: future - add extra handling for other item types?

    if (items.length === 0) {
      // if none selected, skip
      return
    } else if ((items.length === 1) ||
        (items.length > 1 && getPref("newItemBehaviour") === "cancel")) {
      // if single item, or if multiple items but queue disabled, just read first
      addon.hooks.onSpeak(items[0].getDisplayTitle())
    } else {
      // if multiple items and queue enabled, read all
      items.forEach((i) => addon.hooks.onSpeak(i.getDisplayTitle()))
    }
  } else {
    // reader tab context

    // if text selected, read
    // if annotation selected, read annotation
    // if multiple annotation and queue disabled, just read first
    // if multiple annotation and queue enabled, read all
  }
}

function onPrefsLoad(type: string, doc: Document) {
  ztoolkit.log("Prefs event: " + type);

  let voices = (addon.data.tts.engines.webSpeech.extras.getVoices() as Array<string>);
  let menu = (doc.getElementById("webspeech-voice") as MenuList);
  voices.forEach((v) => menu.appendItem(v, v))
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onSpeak,
  onStop,
  onPause,
  onResume,
  onPrefsLoad,
  onContextualSpeak
};
