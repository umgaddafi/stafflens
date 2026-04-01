import { useEffect, useRef, useState } from 'react'

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

function getSpeechErrorMessage(errorCode) {
  switch (errorCode) {
    case 'audio-capture':
      return 'No microphone was detected. Connect one and try again.'
    case 'network':
      return 'Speech recognition could not reach the service. Check your network and try again.'
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone permission was denied. Allow access and try again.'
    case 'no-speech':
      return 'No speech was detected. Speak clearly and try again.'
    case 'aborted':
      return 'Voice capture stopped before a transcript was returned.'
    default:
      return 'Speech recognition could not finish. Try again or type the search manually.'
  }
}

export default function useVoiceSearch({
  idleMessage = 'Type a search or tap the microphone to speak.',
  unsupportedMessage = 'This browser does not support live speech recognition. You can still type your search.',
  listeningMessage = 'Listening... say your search phrase.',
  typedMessage = 'Searching the typed query.',
  capturedMessage = 'Voice captured. Ranking the closest matches.',
} = {}) {
  const recognitionRef = useRef(null)
  const queryRef = useRef('')
  const speechSupportedRef = useRef(false)
  const [query, setQueryState] = useState('')
  const [voiceCandidates, setVoiceCandidates] = useState([])
  const [speechSupported, setSpeechSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [status, setStatus] = useState('Checking voice search...')
  const [error, setError] = useState('')

  function getIdleMessage() {
    return speechSupportedRef.current ? idleMessage : unsupportedMessage
  }

  function updateQuery(nextQuery, options = {}) {
    const { preserveVoiceCandidates = false, nextStatus } = options
    const normalizedQuery = String(nextQuery ?? '')

    queryRef.current = normalizedQuery
    setQueryState(normalizedQuery)

    if (!preserveVoiceCandidates) {
      setVoiceCandidates([])
    }

    setError('')
    setStatus(
      nextStatus ||
        (normalizedQuery.trim()
          ? typedMessage
          : getIdleMessage()),
    )
  }

  useEffect(() => {
    let active = true
    const SpeechRecognition = getSpeechRecognitionConstructor()
    const hasSpeechRecognition = Boolean(SpeechRecognition)

    speechSupportedRef.current = hasSpeechRecognition
    setSpeechSupported(hasSpeechRecognition)
    setStatus(hasSpeechRecognition ? idleMessage : unsupportedMessage)

    if (!SpeechRecognition) {
      return undefined
    }

    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 5
    recognition.lang =
      typeof navigator !== 'undefined' && navigator.language
        ? navigator.language
        : 'en-US'

    recognition.onstart = () => {
      if (!active) {
        return
      }

      setIsListening(true)
      setError('')
      setVoiceCandidates([])
      setStatus(listeningMessage)
    }

    recognition.onresult = (event) => {
      if (!active) {
        return
      }

      const primaryTranscript = Array.from(event.results)
        .map((result) => result[0]?.transcript?.trim() || '')
        .filter(Boolean)
        .join(' ')
        .trim()

      const candidates = Array.from(event.results)
        .flatMap((result) =>
          Array.from(result).map((alternative, alternativeIndex) => ({
            transcript: alternative.transcript.trim(),
            confidence:
              typeof alternative.confidence === 'number' && alternative.confidence > 0
                ? alternative.confidence
                : Math.max(0.45, 1 - alternativeIndex * 0.15),
          })),
        )
        .filter(({ transcript }) => Boolean(transcript))

      const dedupedCandidates = Array.from(
        new Map(
          [
            { transcript: primaryTranscript, confidence: 1 },
            ...candidates,
          ]
            .filter(({ transcript }) => Boolean(transcript))
            .map((candidate) => [candidate.transcript.toLowerCase(), candidate]),
        ).values(),
      )

      queryRef.current = primaryTranscript
      setQueryState(primaryTranscript)
      setVoiceCandidates(dedupedCandidates)
      setError('')

      if (primaryTranscript) {
        setStatus(capturedMessage)
      }
    }

    recognition.onerror = (event) => {
      if (!active) {
        return
      }

      const message = getSpeechErrorMessage(event.error)

      setIsListening(false)
      setError(message)
      setStatus(message)
    }

    recognition.onend = () => {
      if (!active) {
        return
      }

      setIsListening(false)
      setStatus((currentStatus) => {
        if (currentStatus.startsWith('Listening')) {
          return queryRef.current
            ? 'Voice capture finished. Showing the closest staff matches.'
            : 'Listening stopped. Try again or type your search.'
        }

        return currentStatus
      })
    }

    recognitionRef.current = recognition

    return () => {
      active = false

      if (recognitionRef.current) {
        recognitionRef.current.onstart = null
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [
    capturedMessage,
    idleMessage,
    listeningMessage,
    unsupportedMessage,
  ])

  function handleQueryChange(event) {
    updateQuery(event.target.value)
  }

  function startListening() {
    if (!recognitionRef.current) {
      setError(unsupportedMessage)
      setStatus(unsupportedMessage)
      return
    }

    if (isListening) {
      return
    }

    try {
      setVoiceCandidates([])
      setError('')
      recognitionRef.current.start()
    } catch {
      const message =
        'The microphone could not start. If another voice capture is active, stop it and try again.'

      setError(message)
      setStatus(message)
    }
  }

  function stopListening() {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  return {
    query,
    voiceCandidates,
    speechSupported,
    isListening,
    status,
    error,
    handleQueryChange,
    setQuery: updateQuery,
    startListening,
    stopListening,
  }
}
