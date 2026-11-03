export interface SpeechLangConfig {
  bcp47: string
  shortCode: string
  name: string
  nativeName: string
  voiceKeywords: string[]
}

export const LANGUAGE_SPEECH_MAP: Record<string, SpeechLangConfig> = {
  English: {
    bcp47: 'en-IN',
    shortCode: 'en',
    name: 'English',
    nativeName: 'English',
    voiceKeywords: ['india', 'indian', 'en-in', 'english', 'zira', 'david'],
  },
  Hindi: {
    bcp47: 'hi-IN',
    shortCode: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    voiceKeywords: ['hindi', 'hi-in', 'hi', 'kalpana', 'hemant', 'swara', 'madhur'],
  },
  Tamil: {
    bcp47: 'ta-IN',
    shortCode: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    voiceKeywords: ['tamil', 'ta-in', 'ta', 'valluvar'],
  },
  Telugu: {
    bcp47: 'te-IN',
    shortCode: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    voiceKeywords: ['telugu', 'te-in', 'te', 'mohan'],
  },
  Malayalam: {
    bcp47: 'ml-IN',
    shortCode: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    voiceKeywords: ['malayalam', 'ml-in', 'ml'],
  },
  Kannada: {
    bcp47: 'kn-IN',
    shortCode: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    voiceKeywords: ['kannada', 'kn-in', 'kn'],
  },
  Marathi: {
    bcp47: 'mr-IN',
    shortCode: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    voiceKeywords: ['marathi', 'mr-in', 'mr'],
  },
  Bengali: {
    bcp47: 'bn-IN',
    shortCode: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    voiceKeywords: ['bengali', 'bangla', 'bn-in', 'bn', 'bashkar'],
  },
}

let cachedVoices: SpeechSynthesisVoice[] = []

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return []
  if (cachedVoices.length > 0) return cachedVoices
  cachedVoices = window.speechSynthesis.getVoices()
  return cachedVoices
}

// Pre-warm voices cache
if (typeof window !== 'undefined' && window.speechSynthesis) {
  cachedVoices = window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices()
  }
}

/**
 * Finds the best matching speech synthesis voice for an Indian language.
 */
export function findBestVoiceForLanguage(language: string): SpeechSynthesisVoice | null {
  const config = LANGUAGE_SPEECH_MAP[language] || LANGUAGE_SPEECH_MAP['English']
  const voices = getAvailableVoices()
  if (!voices || voices.length === 0) return null

  // 1. Exact BCP-47 match (e.g. 'hi-IN' or 'hi_IN')
  const exact = voices.find(
    (v) => v.lang.replace('_', '-').toLowerCase() === config.bcp47.toLowerCase()
  )
  if (exact) return exact

  // 2. Language prefix match (e.g. 'hi')
  const prefix = voices.find((v) =>
    v.lang.toLowerCase().startsWith(config.shortCode.toLowerCase())
  )
  if (prefix) return prefix

  // 3. Keyword search in voice name (e.g. 'Google हिन्दी' or 'Microsoft Kalpana')
  const byName = voices.find((v) => {
    const vName = v.name.toLowerCase()
    return config.voiceKeywords.some((kw) => vName.includes(kw))
  })
  if (byName) return byName

  return null
}

/**
 * Splits long text into speakable sentence chunks (< 160 chars) for TTS engines.
 */
function splitTextIntoSpeechChunks(text: string, maxLen = 150): string[] {
  const sentences = text.split(/(?<=[।!?.\n])\s+/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).trim().length <= maxLen) {
      currentChunk = (currentChunk + ' ' + sentence).trim()
    } else {
      if (currentChunk) chunks.push(currentChunk)
      if (sentence.length <= maxLen) {
        currentChunk = sentence
      } else {
        // Break long sentence by comma or words
        const words = sentence.split(' ')
        currentChunk = ''
        for (const word of words) {
          if ((currentChunk + ' ' + word).trim().length <= maxLen) {
            currentChunk = (currentChunk + ' ' + word).trim()
          } else {
            if (currentChunk) chunks.push(currentChunk)
            currentChunk = word
          }
        }
      }
    }
  }
  if (currentChunk) chunks.push(currentChunk)
  return chunks.filter((c) => c.trim().length > 0)
}

// Keep active utterance in memory to avoid garbage collection bug in Chromium
let activeUtterance: SpeechSynthesisUtterance | null = null
let activeAudioCleanup: (() => void) | null = null

/**
 * Plays emergency alert audio in the specified native Indian language.
 * Uses native SpeechSynthesis with language matching and voice selection,
 * and falls back to Google Neural TTS stream if the local OS lacks that voice.
 */
export function playAlertAudio(
  text: string,
  language: string,
  onStart: () => void,
  onEnd: () => void,
  onError: () => void
): () => void {
  // Stop any currently running speech
  stopAlertAudio()

  const config = LANGUAGE_SPEECH_MAP[language] || LANGUAGE_SPEECH_MAP['English']
  const matchedVoice = findBestVoiceForLanguage(language)

  // PATH A: Native Web SpeechSynthesis if voice or language engine is available
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    // If we have a voice or if it's English/Hindi (which browsers support out of the box)
    if (matchedVoice || config.shortCode === 'en' || config.shortCode === 'hi') {
      try {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = config.bcp47
        if (matchedVoice) {
          utterance.voice = matchedVoice
        }
        utterance.rate = 0.92
        utterance.pitch = 1.0

        utterance.onstart = () => {
          onStart()
        }

        utterance.onend = () => {
          activeUtterance = null
          onEnd()
        }

        utterance.onerror = () => {
          activeUtterance = null
          // Fall back to Audio fallback if speech synthesis errors out
          tryAudioFallback()
        }

        activeUtterance = utterance
        window.speechSynthesis.speak(utterance)

        return () => {
          stopAlertAudio()
          onEnd()
        }
      } catch {
        // Fallback to audio stream
      }
    }
  }

  // PATH B: High-fidelity Neural Audio stream for regional Indian languages without local voice
  function tryAudioFallback(): () => void {
    const chunks = splitTextIntoSpeechChunks(text, 140)
    if (chunks.length === 0) {
      onEnd()
      return () => {}
    }

    let chunkIdx = 0
    let isCancelled = false
    let currentAudio: HTMLAudioElement | null = null

    onStart()

    const playNext = () => {
      if (isCancelled) return
      if (chunkIdx >= chunks.length) {
        onEnd()
        return
      }

      const chunk = chunks[chunkIdx]
      chunkIdx++
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${config.shortCode}&q=${encodeURIComponent(chunk)}`
      const audio = new Audio(url)
      currentAudio = audio

      audio.onended = () => {
        playNext()
      }

      audio.onerror = () => {
        // If blocked or network error, attempt next chunk or complete
        if (chunkIdx >= chunks.length) {
          onEnd()
        } else {
          playNext()
        }
      }

      audio.play().catch(() => {
        // Autoplay policy or CORS fallback: try standard speech
        onError()
      })
    }

    playNext()

    activeAudioCleanup = () => {
      isCancelled = true
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
      }
    }

    return activeAudioCleanup
  }

  return tryAudioFallback()
}

/**
 * Stops any currently active speech synthesis or audio playback.
 */
export function stopAlertAudio(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel()
    } catch (_) {}
  }
  activeUtterance = null

  if (activeAudioCleanup) {
    try {
      activeAudioCleanup()
    } catch (_) {}
    activeAudioCleanup = null
  }
}
