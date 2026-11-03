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

let activeUtterance: SpeechSynthesisUtterance | null = null
let activeAudioElement: HTMLAudioElement | null = null

/**
 * Plays emergency alert audio in the specified native Indian language.
 * Automatically selects the appropriate backend:
 * 1. Sarvam AI (Indian TTS for Tamil, Telugu, Hindi, Malayalam, Kannada, Bengali, Marathi)
 * 2. Google Cloud TTS
 * 3. ElevenLabs / OpenAI TTS
 * 4. Native Browser Web Speech API
 */
export async function playAlertAudio(
  text: string,
  language: string,
  onStart: () => void,
  onEnd: () => void,
  onError: () => void
): Promise<() => void> {
  stopAlertAudio()

  const config = LANGUAGE_SPEECH_MAP[language] || LANGUAGE_SPEECH_MAP['English']

  const sarvamKey = (import.meta.env.VITE_SARVAM_API_KEY as string | undefined)?.trim()
  const googleTtsKey = (import.meta.env.VITE_GOOGLE_TTS_KEY as string | undefined)?.trim()
  const elevenLabsKey = (import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined)?.trim()
  const openaiKey = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)?.trim()

  // 1. Check Sarvam AI (Built specifically for Indian Languages)
  if (sarvamKey) {
    try {
      onStart()
      const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'api-subscription-key': sarvamKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: [text.slice(0, 500)],
          target_language_code: config.bcp47,
          speaker: 'meera',
          pitch: 0,
          pace: 0.95,
          loudness: 1.5,
          speech_sample_rate: 16000,
          enable_preprocessing: true,
          model: 'bulbul:v1',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const base64Audio = data.audios?.[0]
        if (base64Audio) {
          const audio = new Audio(`data:audio/wav;base64,${base64Audio}`)
          activeAudioElement = audio
          audio.onended = () => {
            activeAudioElement = null
            onEnd()
          }
          audio.onerror = () => {
            activeAudioElement = null
            onError()
          }
          await audio.play()
          return () => stopAlertAudio()
        }
      }
    } catch (_) {}
  }

  // 2. Check Google Cloud Text-to-Speech API
  if (googleTtsKey) {
    try {
      onStart()
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleTtsKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: text.slice(0, 600) },
            voice: { languageCode: config.bcp47 },
            audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95 },
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.audioContent) {
          const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`)
          activeAudioElement = audio
          audio.onended = () => {
            activeAudioElement = null
            onEnd()
          }
          audio.onerror = () => {
            activeAudioElement = null
            onError()
          }
          await audio.play()
          return () => stopAlertAudio()
        }
      }
    } catch (_) {}
  }

  // 3. Check ElevenLabs API
  if (elevenLabsKey) {
    try {
      onStart()
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.slice(0, 500),
          model_id: 'eleven_multilingual_v2',
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        activeAudioElement = audio
        audio.onended = () => {
          URL.revokeObjectURL(url)
          activeAudioElement = null
          onEnd()
        }
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          activeAudioElement = null
          onError()
        }
        await audio.play()
        return () => stopAlertAudio()
      }
    } catch (_) {}
  }

  // 4. Check OpenAI Audio API
  if (openaiKey) {
    try {
      onStart()
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'alloy',
          input: text.slice(0, 500),
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        activeAudioElement = audio
        audio.onended = () => {
          URL.revokeObjectURL(url)
          activeAudioElement = null
          onEnd()
        }
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          activeAudioElement = null
          onError()
        }
        await audio.play()
        return () => stopAlertAudio()
      }
    } catch (_) {}
  }

  // 5. Browser Native SpeechSynthesis (Works out-of-the-box for English & Hindi on Windows, and all languages on Chrome/Android)
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    const matchedVoice = findBestVoiceForLanguage(language)
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
        onError()
      }

      activeUtterance = utterance
      window.speechSynthesis.speak(utterance)

      return () => {
        stopAlertAudio()
        onEnd()
      }
    } catch {
      onError()
    }
  }

  onError()
  return () => stopAlertAudio()
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

  if (activeAudioElement) {
    try {
      activeAudioElement.pause()
      activeAudioElement.currentTime = 0
    } catch (_) {}
    activeAudioElement = null
  }
}
