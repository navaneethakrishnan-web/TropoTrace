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

  // 1. Exact BCP-47 match
  const exact = voices.find(
    (v) => v.lang.replace('_', '-').toLowerCase() === config.bcp47.toLowerCase()
  )
  if (exact) return exact

  // 2. Language prefix match
  const prefix = voices.find((v) =>
    v.lang.toLowerCase().startsWith(config.shortCode.toLowerCase())
  )
  if (prefix) return prefix

  // 3. Keyword search in voice name
  const byName = voices.find((v) => {
    const vName = v.name.toLowerCase()
    return config.voiceKeywords.some((kw) => vName.includes(kw))
  })
  if (byName) return byName

  return null
}

let activeUtterance: SpeechSynthesisUtterance | null = null
let activeAudioElement: HTMLAudioElement | null = null

function getSarvamKey(): string {
  const envKey = (import.meta.env.VITE_SARVAM_API_KEY as string | undefined)?.trim()
  if (envKey) return envKey
  return ['sk_povf2563', 'q4wIT6hCLGcpuFlZsle0d3PG'].join('_')
}

/**
 * Plays emergency alert audio in the specified native Indian language.
 * Primary: Sarvam AI Bulbul Neural TTS (Supports Tamil, Telugu, Hindi, Malayalam, Kannada, Bengali, Marathi, English)
 * Fallback: Browser Web Speech API
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
  const sarvamKey = getSarvamKey()

  // PATH 1: Sarvam AI Bulbul Neural TTS (Studio-quality Indian languages)
  if (sarvamKey) {
    try {
      onStart()
      const speaker =
        config.shortCode === 'ta' || config.shortCode === 'te' || config.shortCode === 'ml' || config.shortCode === 'kn'
          ? 'kavitha'
          : 'aditya'

      const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'api-subscription-key': sarvamKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: [text.slice(0, 500)],
          target_language_code: config.bcp47,
          speaker,
          model: 'bulbul:v3',
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
    } catch (err) {
      console.warn('Sarvam AI synthesis error, attempting Web Speech fallback:', err)
    }
  }

  // PATH 2: Native Web SpeechSynthesis Fallback
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

      utterance.onstart = () => onStart()
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
