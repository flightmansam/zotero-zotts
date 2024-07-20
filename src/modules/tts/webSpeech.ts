import { getPref, setPref } from "../utils/prefs"

function speak(text: string) {
    // cancel is safe to call even when not speaking
    if (getPref("newItemBehaviour") === "cancel") {
      window.speechSynthesis.cancel()
    }

    let utt = new window.SpeechSynthesisUtterance(text)

    // set attributes for utterance
    utt.pitch = (getPref("webSpeech.pitch") as number)/100
    utt.rate = (getPref("webSpeech.rate") as number)/100
    utt.volume = (getPref("webSpeech.volume") as number)/100
    utt.voice = getVoice(getPref("webSpeech.voice") as string)

    // manage reflecting state into addon
    utt.onstart = () => {addon.data.tts.state = "playing"}
    utt.onend = () => {addon.data.tts.state = "idle"}
    utt.onpause = () => {addon.data.tts.state = "paused"}
    utt.onresume = () => {addon.data.tts.state = "playing"}

    // TODO: future - add "highlight as you hear" feature to highlight text as it's spoken?
    // utt.onmark triggers on word and sentence boundaries
    // text selection popup params contain rects used to draw selected text
    // very vaguely possible but might be quite janky...
    // currently deemed more work than it's worth, but happy to revisit

    window.speechSynthesis.speak(utt)
}

function stop() {
    window.speechSynthesis.cancel()
}

function pause() {
    window.speechSynthesis.pause()
}

function resume() {
    window.speechSynthesis.resume()
}

function setDefaultPrefs() {
    if (!getPref("webSpeech.pitch")) {
        setPref("webSpeech.pitch", 1)
    }

    if (!getPref("webSpeech.rate")) {
        setPref("webSpeech.rate", 1)
    }

    if (!getPref("webSpeech.volume")) {
        setPref("webSpeech.volume", 1)
    }

    if (!getPref("webSpeech.voice")) {
        let voice = window.speechSynthesis.getVoices()[0].name
        setPref("webSpeech.voice", voice)
    }
}

function getVoices() {
    return window.speechSynthesis.getVoices().map((v) => v.name)
}

export {
    speak,
    stop,
    pause,
    resume,
    setDefaultPrefs,
    getVoices
}

function getVoice(voiceName: string) {
    let voices = window.speechSynthesis.getVoices()
    let filteredVoices = voices.filter((v) => v.name === voiceName)

    // if voice is not found for some reason, default to first voice
    if (filteredVoices.length === 0) {
        setPref("webSpeech.voice", voices[0].name)
        return voices[0]
    }

    return filteredVoices[0]
}