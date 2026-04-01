import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import './App.css'
import AuthPage from './features/auth/AuthPage.jsx'
import { isAuthenticated } from './features/auth/authStorage.js'
import DashboardPage from './features/dashboard/DashboardPage.jsx'
import { loadStaffDirectory } from './features/dashboard/staffDirectory.js'
import useVoiceSearch from './hooks/useVoiceSearch.js'
import {
  createFaceMatcher,
  findFaceMatchesInImage,
  loadFaceApiModels,
  loadStaffFaceDescriptors,
} from './utils/faceApi.js'
import { scoreSearchMatch } from './utils/search.js'

const PASSPORT_STORAGE_KEY = 'stafflens_passport_overrides_v1'
const CAMERA_FACING_MODES = {
  FRONT: 'user',
  BACK: 'environment',
}
const CAMERA_VIDEO_CONSTRAINTS = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
}

function buildCameraLabel(facingMode) {
  return facingMode === CAMERA_FACING_MODES.BACK
    ? 'Back camera'
    : 'Front camera'
}

function buildCameraReadyMessage(requestedFacingMode, activeFacingMode) {
  if (requestedFacingMode === activeFacingMode) {
    return `${buildCameraLabel(activeFacingMode)} ready. Capture to search.`
  }

  return `${buildCameraLabel(requestedFacingMode)} unavailable. ${buildCameraLabel(activeFacingMode)} is active instead.`
}

function buildCameraErrorMessage(error, facingMode) {
  if (error?.name === 'NotAllowedError') {
    return 'Camera access was blocked. Allow permission and try again.'
  }

  if (error?.name === 'NotFoundError') {
    return `${buildCameraLabel(facingMode)} is not available on this device.`
  }

  if (error?.name === 'NotReadableError') {
    return 'The camera is busy in another app or browser tab.'
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Camera access failed. Please try again.'
}

async function requestCameraStream(facingMode) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('This browser does not support camera access.')
  }

  const attempts = [
    {
      activeFacingMode: facingMode,
      constraints: {
        audio: false,
        video: {
          ...CAMERA_VIDEO_CONSTRAINTS,
          facingMode: { exact: facingMode },
        },
      },
    },
    {
      activeFacingMode: facingMode,
      constraints: {
        audio: false,
        video: {
          ...CAMERA_VIDEO_CONSTRAINTS,
          facingMode: { ideal: facingMode },
        },
      },
    },
    {
      activeFacingMode: CAMERA_FACING_MODES.FRONT,
      constraints: {
        audio: false,
        video: CAMERA_VIDEO_CONSTRAINTS,
      },
    },
  ]

  let lastError

  for (const attempt of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        attempt.constraints,
      )

      const detectedFacingMode =
        stream.getVideoTracks()[0]?.getSettings()?.facingMode

      return {
        stream,
        activeFacingMode:
          detectedFacingMode || attempt.activeFacingMode || facingMode,
      }
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('Unable to access the selected camera.')
}

async function captureVideoFrame(videoElement, canvasElement) {
  const width = videoElement.videoWidth || videoElement.clientWidth
  const height = videoElement.videoHeight || videoElement.clientHeight

  if (!width || !height) {
    throw new Error('The camera preview is not ready yet.')
  }

  canvasElement.width = width
  canvasElement.height = height

  const context = canvasElement.getContext('2d')

  if (!context) {
    throw new Error('Camera capture is not supported in this browser.')
  }

  context.drawImage(videoElement, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvasElement.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }

        reject(new Error('Unable to capture a photo from the camera.'))
      },
      'image/jpeg',
      0.92,
    )
  })
}

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

function readPassportOverrides() {
  const raw = localStorage.getItem(PASSPORT_STORAGE_KEY)

  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function buildDisplayName(record) {
  const parts = [record.surname, record.firstName, record.otherName].filter(
    (part) => part && part !== 'Not available',
  )

  return parts.join(' ') || record.name || 'Unnamed Staff'
}

function buildInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'NA'
}

function buildFaceSearchReadyMessage(indexedFaceCount) {
  if (!indexedFaceCount) {
    return 'Face search is unavailable. No indexed passport photos were found.'
  }

  return ''
}

function PassportPreviewImage({ record, candidates }) {
  const [candidateIndex, setCandidateIndex] = useState(0)
  const activeSource = candidates[candidateIndex] || ''

  if (activeSource) {
    return (
      <img
        className="passport-photo"
        src={activeSource}
        alt={`${record.name} passport`}
        onError={() => {
          setCandidateIndex((current) => current + 1)
        }}
      />
    )
  }

  return <div className="passport-avatar">{buildInitials(record.name)}</div>
}

function PassportPreview({ record }) {
  const localPassport = record?.localPassport
  const candidates = localPassport?.dataUrl
    ? [localPassport.dataUrl]
    : record?.passportCandidates ?? []

  return (
    <PassportPreviewImage
      key={`${record?.id || 'record'}-${localPassport?.dataUrl || 'default'}`}
      record={record}
      candidates={candidates}
    />
  )
}

function PublicHomePage() {
  const fileInputRef = useRef(null)
  const cameraVideoRef = useRef(null)
  const cameraCanvasRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const faceMatcherRef = useRef(null)
  const dragDepthRef = useRef(0)
  const faceSearchRequestIdRef = useRef(0)
  const [records, setRecords] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [faceSearchMessage, setFaceSearchMessage] = useState(
    'Loading facial recognition models...',
  )
  const [faceSearchError, setFaceSearchError] = useState('')
  const [faceSearchReady, setFaceSearchReady] = useState(false)
  const [indexedFaceCount, setIndexedFaceCount] = useState(0)
  const [isFaceSearching, setIsFaceSearching] = useState(false)
  const [faceSearchActive, setFaceSearchActive] = useState(false)
  const [faceMatchedRecordIds, setFaceMatchedRecordIds] = useState([])
  const [selectedFaceFileName, setSelectedFaceFileName] = useState('')
  const [isDragActive, setIsDragActive] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [cameraFacingMode, setCameraFacingMode] = useState(
    CAMERA_FACING_MODES.FRONT,
  )
  const [activeCameraFacingMode, setActiveCameraFacingMode] = useState(
    CAMERA_FACING_MODES.FRONT,
  )
  const [cameraMessage, setCameraMessage] = useState(
    'Open the camera to capture a face photo.',
  )
  const [cameraError, setCameraError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const {
    query: searchInput,
    voiceCandidates,
    speechSupported,
    isListening,
    status: voiceSearchStatus,
    error: voiceSearchError,
    handleQueryChange,
    startListening,
    stopListening,
  } = useVoiceSearch({
    idleMessage:
      'Type a PF number, name, phone number, or department, or tap the microphone to speak your search.',
    listeningMessage:
      'Listening... say a PF number, staff name, phone number, or department.',
    typedMessage: 'Searching the typed query across the staff directory.',
    capturedMessage: 'Voice captured. Ranking the closest staff records.',
  })

  useEffect(() => {
    let active = true

    async function loadRecords() {
      try {
        setLoading(true)
        setError('')
        const directory = await loadStaffDirectory()
        const passportOverrides = readPassportOverrides()
        const preparedRecords = directory.map((record) => ({
          ...record,
          name: buildDisplayName(record),
          glStep: `${record.gl || 'Not available'} / ${record.step || 'Not available'}`,
          localPassport: passportOverrides[record.id] ?? null,
        }))

        if (active) {
          setRecords(preparedRecords)
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load staff records.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadRecords()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (loading || error || !records.length) {
      return undefined
    }

    let active = true

    async function prepareFaceSearch() {
      try {
        setFaceSearchError('')
        setFaceSearchMessage('Loading facial recognition models...')
        await loadFaceApiModels()

        if (!active) {
          return
        }

        setFaceSearchMessage('Indexing passport photos for facial search...')
        const labeledFaces = await loadStaffFaceDescriptors(records)

        if (!active) {
          return
        }

        faceMatcherRef.current = createFaceMatcher(labeledFaces)
        setIndexedFaceCount(labeledFaces.length)
        setFaceSearchReady(Boolean(labeledFaces.length))
        setFaceSearchMessage(buildFaceSearchReadyMessage(labeledFaces.length))
      } catch (faceError) {
        if (!active) {
          return
        }

        faceMatcherRef.current = null
        setIndexedFaceCount(0)
        setFaceSearchReady(false)
        setFaceSearchError(
          faceError instanceof Error
            ? faceError.message
            : 'Facial recognition could not be prepared.',
        )
        setFaceSearchMessage(
          'Facial recognition could not be prepared. Check the face-api models and passport manifest.',
        )
      }
    }

    prepareFaceSearch()

    return () => {
      active = false
    }
  }, [error, loading, records])

  useEffect(() => {
    if (!isCameraOpen) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop())
        cameraStreamRef.current = null
      }

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = null
      }

      return undefined
    }

    let active = true

    const stopActiveStream = () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop())
        cameraStreamRef.current = null
      }

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = null
      }
    }

    async function startCamera() {
      setCameraError('')
      setCameraReady(false)
      setIsCameraLoading(true)
      setCameraMessage(
        `Starting ${buildCameraLabel(cameraFacingMode).toLowerCase()}...`,
      )
      stopActiveStream()

      try {
        const { stream, activeFacingMode } = await requestCameraStream(
          cameraFacingMode,
        )

        if (!active) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        if (!cameraVideoRef.current) {
          throw new Error('The camera preview could not be created.')
        }

        cameraStreamRef.current = stream
        cameraVideoRef.current.srcObject = stream
        await cameraVideoRef.current.play()

        if (!active) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        setActiveCameraFacingMode(activeFacingMode)
        setCameraMessage(
          buildCameraReadyMessage(cameraFacingMode, activeFacingMode),
        )
        setCameraReady(true)
      } catch (cameraStartError) {
        if (!active) {
          return
        }

        stopActiveStream()
        setCameraReady(false)
        setCameraError(buildCameraErrorMessage(cameraStartError, cameraFacingMode))
        setCameraMessage('Camera could not be started.')
      } finally {
        if (active) {
          setIsCameraLoading(false)
        }
      }
    }

    startCamera()

    return () => {
      active = false
      stopActiveStream()
    }
  }, [cameraFacingMode, isCameraOpen])

  const recordsById = useMemo(
    () => new Map(records.map((record) => [record.id, record])),
    [records],
  )

  const faceMatchedRecords = useMemo(() => {
    if (!faceSearchActive) {
      return []
    }

    const seenRecordIds = new Set()

    return faceMatchedRecordIds
      .map((recordId) => recordsById.get(recordId))
      .filter((record) => {
        if (!record || seenRecordIds.has(record.id)) {
          return false
        }

        seenRecordIds.add(record.id)
        return true
      })
  }, [faceMatchedRecordIds, faceSearchActive, recordsById])

  const searchCandidates = useMemo(
    () => (voiceCandidates.length ? voiceCandidates : searchInput),
    [searchInput, voiceCandidates],
  )

  const filteredRecords = useMemo(() => {
    const sourceRecords = faceSearchActive ? faceMatchedRecords : records

    if (!searchInput.trim()) {
      return sourceRecords
    }

    return sourceRecords
      .map((record, index) => ({
        record,
        index,
        match: scoreSearchMatch(
          searchCandidates,
          [record.pfNumber, record.name, record.phone, record.department],
          record.pfNumber,
        ),
      }))
      .filter(({ match }) => match.score > 0)
      .sort((left, right) => right.match.score - left.match.score || left.index - right.index)
      .map(({ record }) => record)
  }, [faceMatchedRecords, faceSearchActive, records, searchCandidates, searchInput])

  useEffect(() => {
    setCurrentIndex(0)
  }, [faceSearchActive, filteredRecords.length, searchInput, selectedFaceFileName])

  const activeRecord = filteredRecords[currentIndex] ?? null
  const hasTextQuery = searchInput.trim().length > 0

  function resetDragState() {
    dragDepthRef.current = 0
    setIsDragActive(false)
  }

  function resetFaceSearch() {
    faceSearchRequestIdRef.current += 1
    setIsFaceSearching(false)
    setFaceSearchActive(false)
    setFaceMatchedRecordIds([])
    setSelectedFaceFileName('')
    setFaceSearchError('')
    setFaceSearchMessage(buildFaceSearchReadyMessage(indexedFaceCount))
    resetDragState()

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function stopCameraStream() {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = null
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null
    }
  }

  function closeCameraPanel() {
    stopCameraStream()
    setIsCameraOpen(false)
    setCameraReady(false)
    setIsCameraLoading(false)
    setCameraError('')
    setCameraMessage('Open the camera to capture a face photo.')
  }

  async function runFaceSearch(imageSource, displayName = '') {
    if (!imageSource) {
      return
    }

    const isBlobSource = imageSource instanceof Blob
    const imageType = isBlobSource ? imageSource.type : ''
    const imageLabel =
      displayName ||
      (isBlobSource && imageSource instanceof File ? imageSource.name : '') ||
      'selected image'

    if (imageType && !imageType.startsWith('image/')) {
      setFaceSearchError('Only image files can be used for facial search.')
      setFaceSearchMessage(
        'Choose a JPG, PNG, WEBP, or another supported image file.',
      )
      return
    }

    if (!faceSearchReady || !faceMatcherRef.current) {
      setFaceSearchError('')
      setFaceSearchMessage(
        indexedFaceCount
          ? 'Facial search is still preparing passport photos. Please wait a moment and try again.'
          : buildFaceSearchReadyMessage(indexedFaceCount),
      )
      return
    }

    const requestId = faceSearchRequestIdRef.current + 1
    const imageUrl = isBlobSource ? URL.createObjectURL(imageSource) : imageSource

    faceSearchRequestIdRef.current = requestId
    setSelectedFaceFileName(imageLabel)
    setFaceSearchActive(true)
    setFaceMatchedRecordIds([])
    setIsFaceSearching(true)
    setFaceSearchError('')
    setFaceSearchMessage(`Analyzing ${imageLabel}...`)

    try {
      const faceMatches = await findFaceMatchesInImage(
        imageUrl,
        faceMatcherRef.current,
      )

      if (requestId !== faceSearchRequestIdRef.current) {
        return
      }

      const matchedRecordIds = Array.from(
        new Set(
          faceMatches
            .filter((match) => match.recognized)
            .map((match) => match.label),
        ),
      )

      setFaceMatchedRecordIds(matchedRecordIds)

      if (!faceMatches.length) {
        setFaceSearchMessage(`Analyzed ${imageLabel}. No face was detected.`)
        return
      }

      if (!matchedRecordIds.length) {
        setFaceSearchMessage(
          `Analyzed ${imageLabel}. No staff passport matched the detected face.`,
        )
        return
      }

      setFaceSearchMessage(
        `Analyzed ${imageLabel}. ${matchedRecordIds.length} staff match${matchedRecordIds.length === 1 ? '' : 'es'} found.`,
      )
    } catch (faceError) {
      if (requestId !== faceSearchRequestIdRef.current) {
        return
      }

      setFaceSearchError(
        faceError instanceof Error
          ? faceError.message
          : 'The selected image could not be analyzed.',
      )
      setFaceSearchMessage(
        'The selected image could not be analyzed. Try another clear face photo.',
      )
    } finally {
      if (isBlobSource) {
        URL.revokeObjectURL(imageUrl)
      }

      if (requestId === faceSearchRequestIdRef.current) {
        setIsFaceSearching(false)
      }
    }
  }

  function handleFaceInputChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (file) {
      runFaceSearch(file, file.name)
    }
  }

  function handleDragEnter(event) {
    event.preventDefault()
    event.stopPropagation()

    if (!faceSearchReady) {
      return
    }

    dragDepthRef.current += 1
    setIsDragActive(true)
  }

  function handleDragOver(event) {
    event.preventDefault()
    event.stopPropagation()

    if (faceSearchReady) {
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  function handleDragLeave(event) {
    event.preventDefault()
    event.stopPropagation()

    if (!faceSearchReady) {
      return
    }

    dragDepthRef.current = Math.max(dragDepthRef.current - 1, 0)

    if (!dragDepthRef.current) {
      setIsDragActive(false)
    }
  }

  function handleDrop(event) {
    event.preventDefault()
    event.stopPropagation()
    resetDragState()

    const file = event.dataTransfer.files?.[0]

    if (file) {
      runFaceSearch(file, file.name)
    }
  }

  function handleCameraPanelToggle() {
    if (!faceSearchReady) {
      return
    }

    if (isCameraOpen) {
      closeCameraPanel()
      return
    }

    setCameraError('')
    setCameraReady(false)
    setCameraMessage('Preparing camera...')
    setIsCameraOpen(true)
  }

  async function handleCaptureFromCamera() {
    if (!cameraReady || !cameraVideoRef.current || !cameraCanvasRef.current) {
      return
    }

    setCameraError('')
    setCameraMessage('Capturing photo for facial search...')

    try {
      const capturedImage = await captureVideoFrame(
        cameraVideoRef.current,
        cameraCanvasRef.current,
      )

      await runFaceSearch(
        capturedImage,
        `${buildCameraLabel(activeCameraFacingMode)} capture.jpg`,
      )
      setCameraMessage(
        `${buildCameraLabel(activeCameraFacingMode)} live. Capture again or switch camera.`,
      )
    } catch (cameraCaptureError) {
      setCameraError(
        cameraCaptureError instanceof Error
          ? cameraCaptureError.message
          : 'Unable to capture a photo from the camera.',
      )
      setCameraMessage('Camera capture failed.')
    }
  }

  const resultsHeading = useMemo(() => {
    if (loading) {
      return 'Loading staff records...'
    }

    if (error) {
      return 'Unable to load staff records'
    }

    if (isFaceSearching) {
      return `Analyzing ${selectedFaceFileName || 'selected image'}...`
    }

    if (faceSearchActive) {
      if (filteredRecords.length) {
        return `Showing ${currentIndex + 1} of ${filteredRecords.length.toLocaleString()} facial match${filteredRecords.length === 1 ? '' : 'es'}`
      }

      if (hasTextQuery && faceMatchedRecords.length) {
        return 'No facial matches fit the current text search'
      }

      if (faceSearchError) {
        return 'The uploaded image could not be analyzed'
      }

      return 'No staff matched the uploaded face'
    }

    if (filteredRecords.length) {
      return `Showing ${currentIndex + 1} of ${filteredRecords.length.toLocaleString()} matching staff records`
    }

    return 'No matching staff records found'
  }, [
    currentIndex,
    error,
    faceMatchedRecords.length,
    faceSearchActive,
    faceSearchError,
    filteredRecords.length,
    hasTextQuery,
    isFaceSearching,
    loading,
    selectedFaceFileName,
  ])

  const emptyStateHeading = faceSearchActive
    ? hasTextQuery && faceMatchedRecords.length
      ? 'No record matches both filters'
      : 'No facial match found'
    : 'No staff found'

  const emptyStateMessage = faceSearchActive
    ? faceSearchError ||
      (hasTextQuery && faceMatchedRecords.length
        ? 'Try broadening the text search or clear the uploaded image search.'
        : faceSearchMessage)
    : 'Try a PF number, a name, a phone number, or a department, or tap the microphone and speak your search.'

  function handleSearchSubmit(event) {
    event.preventDefault()
  }

  return (
    <main className="page-shell">
      <section className="app-card">
        <div className="hero-copy">
          <p className="eyebrow">Staff Records</p>
          <h1>JOSTUM STAFFS DIRECTORY</h1>
        </div>

        <form className="search-panel" onSubmit={handleSearchSubmit}>
          <label className="search-label" htmlFor="staff-search">
            Search Staff
          </label>
          <div className="search-row">
            <div className={`search-input-wrap${isListening ? ' is-listening' : ''}`}>
              <span className="search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              </span>
              <input
                id="staff-search"
                type="text"
                value={searchInput}
                onChange={handleQueryChange}
                placeholder="Enter PF Number, Name, Phone or Department"
              />
              <button
                className={`voice-search-button${isListening ? ' is-listening' : ''}${!speechSupported ? ' is-unsupported' : ''}`}
                type="button"
                onClick={isListening ? stopListening : startListening}
                aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
                aria-pressed={isListening}
                title={
                  speechSupported
                    ? isListening
                      ? 'Stop voice search'
                      : 'Start voice search'
                    : 'Voice search is not supported in this browser'
                }
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 15a3 3 0 0 0 3-3V8a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Z" />
                  <path d="M19 11a7 7 0 0 1-14 0" />
                  <path d="M12 18v3" />
                  <path d="M8 21h8" />
                </svg>
              </button>
            </div>
            <button className="search-button" type="submit">
              Search
            </button>
          </div>
          <p className={`search-status${voiceSearchError ? ' is-error' : ''}`}>
            {voiceSearchStatus}
          </p>

          <div
            className={`upload-dropzone${isDragActive ? ' is-drag-active' : ''}${!faceSearchReady ? ' is-disabled' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              className="sr-only-input"
              type="file"
              accept="image/*"
              onChange={handleFaceInputChange}
            />
            <p className="upload-eyebrow">Search by Facial Recognition</p>
            <div className="upload-zone-actions">
              <div className="upload-action-buttons">
                <button
                  className="upload-select-button"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!faceSearchReady}
                >
                  Select Image
                </button>
                <button
                  className="upload-secondary-button"
                  type="button"
                  onClick={handleCameraPanelToggle}
                  disabled={!faceSearchReady}
                >
                  {isCameraOpen ? 'Hide Camera' : 'Use Camera'}
                </button>
              </div>
              <span className="upload-divider">or</span>
              <p className="upload-helper">
                Drag & drop a clear face photo here
              </p>
            </div>

            {isCameraOpen && (
              <div className="camera-panel">
                <div className="camera-control-row">
                  <div className="camera-mode-group">
                    <button
                      className={`camera-mode-button${cameraFacingMode === CAMERA_FACING_MODES.FRONT ? ' is-active' : ''}`}
                      type="button"
                      onClick={() => setCameraFacingMode(CAMERA_FACING_MODES.FRONT)}
                      disabled={isCameraLoading || isFaceSearching}
                    >
                      Front Camera
                    </button>
                    <button
                      className={`camera-mode-button${cameraFacingMode === CAMERA_FACING_MODES.BACK ? ' is-active' : ''}`}
                      type="button"
                      onClick={() => setCameraFacingMode(CAMERA_FACING_MODES.BACK)}
                      disabled={isCameraLoading || isFaceSearching}
                    >
                      Back Camera
                    </button>
                  </div>
                </div>

                <div className="camera-preview-shell">
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`camera-preview${activeCameraFacingMode === CAMERA_FACING_MODES.FRONT ? ' is-mirrored' : ''}`}
                  />
                  {isCameraLoading && (
                    <div className="camera-overlay">
                      Starting {buildCameraLabel(cameraFacingMode).toLowerCase()}...
                    </div>
                  )}
                </div>

                <div className="camera-action-group">
                  <button
                    className="camera-capture-button"
                    type="button"
                    onClick={handleCaptureFromCamera}
                    disabled={!cameraReady || isFaceSearching}
                  >
                    Capture & Search
                  </button>
                  <button
                    className="camera-close-button"
                    type="button"
                    onClick={closeCameraPanel}
                  >
                    Close
                  </button>
                </div>

                <canvas ref={cameraCanvasRef} className="sr-only-input" />

                <p className={`camera-status${cameraError ? ' is-error' : ''}`}>
                  {cameraError || cameraMessage}
                </p>
              </div>
            )}

            <div className="search-assist">
              <span>
                {selectedFaceFileName
                  ? `Selected image: ${selectedFaceFileName}`
                  : 'Use a passport-style face photo for the best recognition result.'}
              </span>
              {faceSearchActive && (
                <button
                  className="face-search-clear"
                  type="button"
                  onClick={resetFaceSearch}
                >
                  Clear image search
                </button>
              )}
            </div>
          </div>

          {faceSearchError || faceSearchMessage ? (
            <p className={`face-search-status${faceSearchError ? ' is-error' : ''}`}>
              {faceSearchError || faceSearchMessage}
            </p>
          ) : null}
        </form>

        <div className="results-header">
          <div>
            <p className="section-label">Result Display</p>
            <h2>{resultsHeading}</h2>
          </div>
          {!loading && !error && (
            <span className="data-pill">
              {records.length.toLocaleString()} records loaded
              {indexedFaceCount ? ` | ${indexedFaceCount.toLocaleString()} face profiles indexed` : ''}
            </span>
          )}
        </div>

        {error ? (
          <div className="result-card empty-state">
            <div className="details-panel">
              <h3>Something went wrong</h3>
              <p>{error}</p>
            </div>
          </div>
        ) : loading ? (
          <div className="result-card empty-state">
            <div className="details-panel">
              <h3>Loading</h3>
              <p>Please wait while staff records are loaded from the workbook.</p>
            </div>
          </div>
        ) : activeRecord ? (
          <>
            <article className="result-card">
              <div className="passport-panel">
                <PassportPreview record={activeRecord} />
                <p className="passport-caption">Passport Photo</p>
              </div>

              <div className="details-panel">
                <div className="details-topline">
                  <div>
                    <p className="section-label">Staff Details</p>
                    <h3>{activeRecord.name}</h3>
                  </div>
                  <span className="status-pill">
                    {faceSearchActive ? 'Facial Match' : 'Match Ready'}
                  </span>
                </div>

                <div className="details-grid">
                  {[
                    ['Name', activeRecord.name],
                    ['PF Number', activeRecord.pfNumber],
                    ['Rank', activeRecord.rank],
                    ['Department', activeRecord.department],
                    ['Phone', activeRecord.phone],
                    ['GL / Step', activeRecord.glStep],
                  ].map(([label, value]) => (
                    <div className="detail-item" key={label}>
                      <span>{label}</span>
                      <strong>{value || 'Not available'}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <div className="navigation-bar">
              <p>
                {faceSearchActive
                  ? 'Use the navigation buttons to move through the detected facial matches one record at a time.'
                  : 'Use the navigation buttons to move through the current result set one record at a time.'}
              </p>
              <div className="nav-actions">
                <button
                  className="nav-button secondary"
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((current) => Math.max(current - 1, 0))}
                >
                  Prev
                </button>
                <button
                  className="nav-button primary"
                  type="button"
                  disabled={currentIndex >= filteredRecords.length - 1}
                  onClick={() =>
                    setCurrentIndex((current) =>
                      Math.min(current + 1, filteredRecords.length - 1),
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : isFaceSearching ? (
          <div className="result-card empty-state">
            <div className="details-panel">
              <h3>Analyzing face image</h3>
              <p>
                Please wait while the selected image is checked against the
                indexed staff passport photos.
              </p>
            </div>
          </div>
        ) : (
          <div className="result-card empty-state">
            <div className="details-panel">
              <h3>{emptyStateHeading}</h3>
              <p>{emptyStateMessage}</p>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicHomePage />} />
        <Route
          path="/login"
          element={
            <AuthPage
              mode="login"
              title="Sign In"
              subtitle="Access the StaffLens admin workspace to manage records, monitor staff updates, and review operational insights."
            />
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthPage
              mode="forgot"
              title="Forgot Password"
              subtitle="Enter your administrator email address and we will prepare a reset link for secure account recovery."
            />
          }
        />
        <Route
          path="/reset-password"
          element={
            <AuthPage
              mode="reset"
              title="Reset Password"
              subtitle="Set a fresh password for your admin account and return to the dashboard with updated credentials."
            />
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
