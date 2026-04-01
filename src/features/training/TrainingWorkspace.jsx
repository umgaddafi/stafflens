import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TrainingCamera from './TrainingCamera.jsx'
import './TrainingWorkspace.css'
import {
  captureDescriptorFromSource,
  clearCanvas,
  clearCustomDescriptors,
  createFaceMatcher,
  detectFaces,
  drawFaceResults,
  loadFaceApiModels,
  loadKnownFaces,
  saveCustomDescriptor,
  summarizeKnownFaces,
} from '../../utils/faceApi.js'

const DETECTION_INTERVAL = 180
const MATCH_THRESHOLD = 0.5
const INPUT_MODES = {
  CAMERA: 'camera',
  UPLOAD: 'upload',
}

function toTitleCase(value) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getDefaultStatusMessage({
  inputMode,
  modelsReady,
  cameraReady,
  imageReady,
  hasKnownFaces,
  hasUploadedImage,
}) {
  if (!modelsReady) {
    return 'Loading face-api.js models...'
  }

  if (inputMode === INPUT_MODES.CAMERA) {
    if (!cameraReady) {
      return hasKnownFaces
        ? 'Models loaded. Allow webcam access or switch to image upload.'
        : 'Models loaded. Allow webcam access or switch to image upload. Add labeled images or save a face to enable recognition.'
    }

    return hasKnownFaces
      ? 'Webcam ready. Live detection and recognition are running.'
      : 'Webcam ready. Live detection is running. Add labeled images or save a face to enable recognition.'
  }

  if (!hasUploadedImage) {
    return hasKnownFaces
      ? 'Upload an image from your device to analyze it.'
      : 'Upload an image from your device. Add labeled images or save a face to enable recognition.'
  }

  if (!imageReady) {
    return 'Image selected. Preparing it for face analysis...'
  }

  return hasKnownFaces
    ? 'Image ready. Running face detection and recognition.'
    : 'Image ready. Running detection. Add labeled faces to enable recognition.'
}

export default function TrainingWorkspace() {
  const videoRef = useRef(null)
  const imageRef = useRef(null)
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(0)
  const lastDetectionAtRef = useRef(0)
  const isDetectingRef = useRef(false)
  const matcherRef = useRef(null)

  const [inputMode, setInputMode] = useState(INPUT_MODES.CAMERA)
  const [modelsReady, setModelsReady] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [statusMessage, setStatusMessage] = useState(
    'Loading face-api.js models...',
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [recognizedFaces, setRecognizedFaces] = useState([])
  const [knownFaces, setKnownFaces] = useState([])
  const [knownFacesVersion, setKnownFacesVersion] = useState(0)
  const [registerName, setRegisterName] = useState('')
  const [isSavingFace, setIsSavingFace] = useState(false)
  const [isRefreshingKnownFaces, setIsRefreshingKnownFaces] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [imageReady, setImageReady] = useState(false)
  const [isAnalyzingUpload, setIsAnalyzingUpload] = useState(false)

  const updateStatusForMode = useCallback(
    (nextMode = inputMode, overrides = {}) => {
      setStatusMessage(
        getDefaultStatusMessage({
          inputMode: nextMode,
          modelsReady:
            overrides.modelsReady !== undefined
              ? overrides.modelsReady
              : modelsReady,
          cameraReady:
            overrides.cameraReady !== undefined
              ? overrides.cameraReady
              : cameraReady,
          imageReady:
            overrides.imageReady !== undefined ? overrides.imageReady : imageReady,
          hasKnownFaces:
            overrides.hasKnownFaces !== undefined
              ? overrides.hasKnownFaces
              : Boolean(matcherRef.current),
          hasUploadedImage:
            overrides.hasUploadedImage !== undefined
              ? overrides.hasUploadedImage
              : Boolean(uploadedImageUrl),
        }),
      )
    },
    [cameraReady, imageReady, inputMode, modelsReady, uploadedImageUrl],
  )

  const summaryText = useMemo(() => {
    if (!recognizedFaces.length) {
      return inputMode === INPUT_MODES.UPLOAD
        ? 'No faces detected in the selected image yet.'
        : 'No faces detected yet.'
    }

    const names = recognizedFaces.map((face) => face.label).join(', ')
    return `${recognizedFaces.length} face${
      recognizedFaces.length === 1 ? '' : 's'
    } ${inputMode === INPUT_MODES.UPLOAD ? 'in image' : 'in frame'}: ${names}`
  }, [inputMode, recognizedFaces])

  const refreshKnownFaces = useCallback(async (showStatus = true) => {
    setIsRefreshingKnownFaces(true)

    if (showStatus) {
      setStatusMessage('Refreshing labeled faces...')
    }

    try {
      const labeledFaces = await loadKnownFaces()
      matcherRef.current = createFaceMatcher(labeledFaces, MATCH_THRESHOLD)
      setKnownFaces(summarizeKnownFaces(labeledFaces))
      setKnownFacesVersion((currentVersion) => currentVersion + 1)
      return labeledFaces
    } finally {
      setIsRefreshingKnownFaces(false)
    }
  }, [])

  useEffect(() => {
    const canvasElement = canvasRef.current
    let isMounted = true

    const initialize = async () => {
      try {
        setErrorMessage('')
        setStatusMessage('Loading face-api.js models...')
        await loadFaceApiModels()

        if (!isMounted) {
          return
        }

        setModelsReady(true)
        const labeledFaces = await refreshKnownFaces(false)

        if (!isMounted) {
          return
        }

        setStatusMessage(
          labeledFaces.length
            ? 'Models loaded. Choose Live Camera or Upload Image to begin analysis.'
            : 'Models loaded. Choose Live Camera or Upload Image to begin analysis. Add labeled images or save a face to enable recognition.',
        )
      } catch (error) {
        console.error(error)

        if (!isMounted) {
          return
        }

        setErrorMessage(error.message)
        setStatusMessage(
          'The app could not load the required models. Check the public/models folder.',
        )
      }
    }

    initialize()

    return () => {
      isMounted = false
      cancelAnimationFrame(animationFrameRef.current)
      clearCanvas(canvasElement)
    }
  }, [refreshKnownFaces])

  useEffect(() => {
    if (inputMode !== INPUT_MODES.CAMERA || !modelsReady || !cameraReady) {
      return undefined
    }

    const canvasElement = canvasRef.current
    let isMounted = true

    const runDetectionLoop = async (timestamp) => {
      if (!isMounted) {
        return
      }

      animationFrameRef.current = requestAnimationFrame(runDetectionLoop)

      const videoElement = videoRef.current

      if (!videoElement || videoElement.readyState < 2) {
        return
      }

      if (
        isDetectingRef.current ||
        timestamp - lastDetectionAtRef.current < DETECTION_INTERVAL
      ) {
        return
      }

      lastDetectionAtRef.current = timestamp
      isDetectingRef.current = true

      try {
        const detections = await detectFaces(videoElement)

        if (!isMounted) {
          return
        }

        const nextFaces = drawFaceResults(
          canvasElement,
          videoElement,
          detections,
          matcherRef.current,
        )

        setRecognizedFaces(nextFaces)
      } catch (error) {
        console.error(error)

        if (isMounted) {
          setErrorMessage(error.message)
        }
      } finally {
        isDetectingRef.current = false
      }
    }

    animationFrameRef.current = requestAnimationFrame(runDetectionLoop)

    return () => {
      isMounted = false
      cancelAnimationFrame(animationFrameRef.current)
      isDetectingRef.current = false
      clearCanvas(canvasElement)
    }
  }, [cameraReady, inputMode, modelsReady])

  useEffect(() => {
    if (
      inputMode !== INPUT_MODES.UPLOAD ||
      !modelsReady ||
      !imageReady ||
      !imageRef.current
    ) {
      return undefined
    }

    let isMounted = true

    const analyzeUploadedImage = async () => {
      setIsAnalyzingUpload(true)
      setErrorMessage('')

      try {
        const detections = await detectFaces(imageRef.current)

        if (!isMounted) {
          return
        }

        const nextFaces = drawFaceResults(
          canvasRef.current,
          imageRef.current,
          detections,
          matcherRef.current,
        )

        setRecognizedFaces(nextFaces)
        setStatusMessage(
          nextFaces.length
            ? `Analyzed ${
                selectedFileName || 'selected image'
              }. ${nextFaces.length} face${
                nextFaces.length === 1 ? '' : 's'
              } found.`
            : `Analyzed ${
                selectedFileName || 'selected image'
              }. No face was detected.`,
        )
      } catch (error) {
        console.error(error)

        if (!isMounted) {
          return
        }

        setErrorMessage(error.message)
        setStatusMessage(
          'The selected image could not be analyzed. Try another clear face photo.',
        )
      } finally {
        if (isMounted) {
          setIsAnalyzingUpload(false)
        }
      }
    }

    analyzeUploadedImage()

    return () => {
      isMounted = false
    }
  }, [
    imageReady,
    inputMode,
    knownFacesVersion,
    modelsReady,
    selectedFileName,
    uploadedImageUrl,
  ])

  useEffect(
    () => () => {
      if (uploadedImageUrl) {
        URL.revokeObjectURL(uploadedImageUrl)
      }
    },
    [uploadedImageUrl],
  )

  const handleInputModeChange = (nextMode) => {
    if (nextMode === inputMode) {
      return
    }

    cancelAnimationFrame(animationFrameRef.current)
    clearCanvas(canvasRef.current)
    setRecognizedFaces([])
    setErrorMessage('')
    setInputMode(nextMode)
    setCameraReady(false)
    setImageReady(false)
    updateStatusForMode(nextMode, { cameraReady: false, imageReady: false })
  }

  const handleCameraReady = useCallback(() => {
    setCameraReady(true)
    setErrorMessage('')
    updateStatusForMode(INPUT_MODES.CAMERA, { cameraReady: true })
  }, [updateStatusForMode])

  const handleCameraError = useCallback((error) => {
    console.error(error)
    setErrorMessage(error.message)
    setStatusMessage(
      'Webcam access failed. Allow camera permission, or switch to image upload.',
    )
  }, [])

  const handleImageSelection = (event) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    if (uploadedImageUrl) {
      URL.revokeObjectURL(uploadedImageUrl)
    }

    const nextImageUrl = URL.createObjectURL(selectedFile)

    cancelAnimationFrame(animationFrameRef.current)
    clearCanvas(canvasRef.current)
    setRecognizedFaces([])
    setErrorMessage('')
    setImageReady(false)
    setUploadedImageUrl(nextImageUrl)
    setSelectedFileName(selectedFile.name)
    setInputMode(INPUT_MODES.UPLOAD)
    updateStatusForMode(INPUT_MODES.UPLOAD, {
      cameraReady: false,
      imageReady: false,
      hasUploadedImage: true,
    })

    event.target.value = ''
  }

  const handleUploadedImageReady = () => {
    setImageReady(true)
    setErrorMessage('')
    updateStatusForMode(INPUT_MODES.UPLOAD, {
      cameraReady: false,
      imageReady: true,
      hasUploadedImage: true,
    })
  }

  const handleClearSelectedImage = () => {
    if (uploadedImageUrl) {
      URL.revokeObjectURL(uploadedImageUrl)
    }

    clearCanvas(canvasRef.current)
    setRecognizedFaces([])
    setErrorMessage('')
    setImageReady(false)
    setSelectedFileName('')
    setUploadedImageUrl('')
    updateStatusForMode(INPUT_MODES.UPLOAD, {
      cameraReady: false,
      imageReady: false,
      hasUploadedImage: false,
    })
  }

  const handleReloadKnownFaces = async () => {
    try {
      setErrorMessage('')
      const labeledFaces = await refreshKnownFaces()
      setStatusMessage(
        labeledFaces.length
          ? `Reloaded ${labeledFaces.length} labeled face ${
              labeledFaces.length === 1 ? 'profile' : 'profiles'
            }.`
          : 'No labeled face images were found yet.',
      )
    } catch (error) {
      console.error(error)
      setErrorMessage(error.message)
      setStatusMessage(
        'Known faces could not be refreshed. Check the manifest and image paths.',
      )
    }
  }

  const handleRegisterFace = async (event) => {
    event.preventDefault()

    if (!registerName.trim()) {
      setErrorMessage('Enter a name before saving a new face.')
      return
    }

    const activeSourceElement =
      inputMode === INPUT_MODES.CAMERA ? videoRef.current : imageRef.current
    const sourceIsReady =
      inputMode === INPUT_MODES.CAMERA ? cameraReady : imageReady

    if (!modelsReady || !sourceIsReady || !activeSourceElement) {
      setErrorMessage(
        inputMode === INPUT_MODES.CAMERA
          ? 'Wait for the webcam and models to finish loading.'
          : 'Select an image and wait for it to finish loading before saving a face.',
      )
      return
    }

    setIsSavingFace(true)
    setErrorMessage('')

    try {
      const descriptor = await captureDescriptorFromSource(activeSourceElement)
      saveCustomDescriptor(registerName.trim(), descriptor)
      const labeledFaces = await refreshKnownFaces(false)

      setStatusMessage(
        `Saved "${registerName.trim()}". ${
          labeledFaces.length
        } labeled face ${labeledFaces.length === 1 ? 'profile is' : 'profiles are'} now available.`,
      )
      setRegisterName('')
    } catch (error) {
      console.error(error)
      setErrorMessage(error.message)
    } finally {
      setIsSavingFace(false)
    }
  }

  const handleClearSavedFaces = async () => {
    clearCustomDescriptors()

    try {
      const labeledFaces = await refreshKnownFaces(false)
      setStatusMessage(
        labeledFaces.length
          ? 'Cleared browser-saved faces. Preloaded labeled images are still available.'
          : 'Cleared browser-saved faces. No labeled images are configured yet.',
      )
      setErrorMessage('')
    } catch (error) {
      console.error(error)
      setErrorMessage(error.message)
    }
  }

  return (
    <section className="training-workspace">
      <div className="training-recognition-layout">
        <div className="training-panel training-stage-panel">
          <div className="training-panel-header">
            <div>
              <p className="training-panel-kicker">
                {inputMode === INPUT_MODES.CAMERA ? 'Live Camera' : 'Uploaded Image'}
              </p>
              <h2>Real-time face detection and recognition</h2>
            </div>
            <span className="training-status-chip">
              {modelsReady ? 'Models Ready' : 'Loading Models'}
            </span>
          </div>

          <div className="training-stage-toolbar">
            <div
              className="training-mode-switch"
              role="tablist"
              aria-label="Input source"
            >
              <button
                aria-pressed={inputMode === INPUT_MODES.CAMERA}
                className={`training-mode-button ${
                  inputMode === INPUT_MODES.CAMERA ? 'is-active' : ''
                }`}
                onClick={() => handleInputModeChange(INPUT_MODES.CAMERA)}
                type="button"
              >
                Live Camera
              </button>
              <button
                aria-pressed={inputMode === INPUT_MODES.UPLOAD}
                className={`training-mode-button ${
                  inputMode === INPUT_MODES.UPLOAD ? 'is-active' : ''
                }`}
                onClick={() => handleInputModeChange(INPUT_MODES.UPLOAD)}
                type="button"
              >
                Upload Image
              </button>
            </div>

            <div className="training-stage-actions">
              <label className="training-file-picker" htmlFor="trainingDeviceImage">
                Select Image
              </label>
              <input
                accept="image/*"
                className="training-file-input"
                id="trainingDeviceImage"
                onChange={handleImageSelection}
                type="file"
              />
              {inputMode === INPUT_MODES.UPLOAD && uploadedImageUrl ? (
                <button
                  className="training-secondary-button"
                  onClick={handleClearSelectedImage}
                  type="button"
                >
                  Clear Image
                </button>
              ) : null}
            </div>
          </div>

          <div className="training-stage-wrapper">
            {inputMode === INPUT_MODES.CAMERA ? (
              <>
                <TrainingCamera
                  onError={handleCameraError}
                  onReady={handleCameraReady}
                  videoRef={videoRef}
                />
                <canvas
                  ref={canvasRef}
                  aria-hidden="true"
                  className="training-overlay-canvas is-mirrored"
                />
              </>
            ) : (
              <>
                <div
                  className={`training-image-shell ${
                    uploadedImageUrl ? 'has-image' : ''
                  }`}
                >
                  {uploadedImageUrl ? (
                    <>
                      <img
                        alt="Selected for face recognition"
                        className="training-uploaded-image"
                        onLoad={handleUploadedImageReady}
                        ref={imageRef}
                        src={uploadedImageUrl}
                      />
                      <div className="training-camera-badge">
                        {isAnalyzingUpload
                          ? 'Analyzing image...'
                          : selectedFileName || 'Selected image'}
                      </div>
                    </>
                  ) : (
                    <div className="training-empty-stage">
                      <div>
                        <h3>Choose a photo from your device</h3>
                        <p>
                          Upload a clear front-facing image to run face detection
                          and recognition without using the webcam.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <canvas
                  ref={canvasRef}
                  aria-hidden="true"
                  className="training-overlay-canvas"
                />
              </>
            )}
          </div>

          <div className="training-status-banner">
            <p>{statusMessage}</p>
            <p className="training-muted-text">{summaryText}</p>
            {errorMessage ? (
              <p className="training-error-text">{errorMessage}</p>
            ) : null}
          </div>
        </div>

        <aside className="training-sidebar">
          <div className="training-panel">
            <div className="training-panel-header">
              <div>
                <p className="training-panel-kicker">Recognition Feed</p>
                <h2>Detected faces</h2>
              </div>
              <span className="training-status-chip">
                {recognizedFaces.length} Active
              </span>
            </div>

            <div className="training-face-result-list">
              {recognizedFaces.length ? (
                recognizedFaces.map((face) => (
                  <article className="training-face-result-card" key={face.id}>
                    <div>
                      <p
                        className={`training-result-pill ${
                          face.recognized ? 'recognized' : 'unknown'
                        }`}
                      >
                        {face.recognized ? 'Matched face' : 'Unmatched face'}
                      </p>
                      <h3>{face.label}</h3>
                      <p className="training-muted-text">
                        Emotion:{' '}
                        {face.emotion ? toTitleCase(face.emotion) : 'Not confident'}
                      </p>
                    </div>
                    <strong className="training-confidence-text">
                      {face.confidence
                        ? `${Math.round(face.confidence * 100)}%`
                        : '--'}
                    </strong>
                  </article>
                ))
              ) : (
                <p className="training-muted-text">
                  {inputMode === INPUT_MODES.CAMERA
                    ? 'No face is visible yet. Stand in front of the camera to begin.'
                    : 'Upload a face image to start analysis.'}
                </p>
              )}
            </div>
          </div>

          <div className="training-panel">
            <div className="training-panel-header">
              <div>
                <p className="training-panel-kicker">Known Faces</p>
                <h2>Training profiles</h2>
              </div>
              <button
                className="training-secondary-button"
                disabled={isRefreshingKnownFaces}
                onClick={handleReloadKnownFaces}
                type="button"
              >
                {isRefreshingKnownFaces ? 'Refreshing...' : 'Reload'}
              </button>
            </div>

            <div className="training-known-face-list">
              {knownFaces.length ? (
                knownFaces.map((face) => (
                  <div className="training-known-face-row" key={face.label}>
                    <div>
                      <h3>{face.label}</h3>
                      <p className="training-muted-text">
                        {face.samples} sample{face.samples === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span className="training-status-chip subtle">Ready</span>
                  </div>
                ))
              ) : (
                <p className="training-muted-text">
                  No labeled images loaded. Add photos to{' '}
                  <code>public/labeled-images</code> or save a face from the
                  current input source.
                </p>
              )}
            </div>
          </div>

          <div className="training-panel">
            <div className="training-panel-header">
              <div>
                <p className="training-panel-kicker">Bonus Feature</p>
                <h2>Save a new face</h2>
              </div>
            </div>

            <form className="training-capture-form" onSubmit={handleRegisterFace}>
              <label className="training-input-label" htmlFor="trainingRegisterName">
                Person name
              </label>
              <input
                className="training-text-input"
                id="trainingRegisterName"
                onChange={(event) => setRegisterName(event.target.value)}
                placeholder="e.g. Ada Lovelace"
                type="text"
                value={registerName}
              />

              <div className="training-button-row">
                <button
                  className="training-primary-button"
                  disabled={isSavingFace}
                  type="submit"
                >
                  {isSavingFace
                    ? 'Saving face...'
                    : inputMode === INPUT_MODES.CAMERA
                      ? 'Capture From Camera'
                      : 'Save Face From Image'}
                </button>
                <button
                  className="training-secondary-button"
                  onClick={handleClearSavedFaces}
                  type="button"
                >
                  Clear Saved Faces
                </button>
              </div>
            </form>

            <p className="training-muted-text">
              This stores face descriptors in your browser&apos;s local storage, so
              there is no backend or database required.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}
