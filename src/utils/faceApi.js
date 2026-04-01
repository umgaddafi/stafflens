import { normalizePfNumberForSearch } from './search.js'

const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

export const MODEL_URL = `${baseUrl}/models`
export const PASSPORT_MANIFEST_URL = `${baseUrl}/passports/manifest.json`
export const LABELED_IMAGES_MANIFEST_URL = `${baseUrl}/labeled-images/manifest.json`

const CUSTOM_DESCRIPTOR_STORAGE_KEY = 'face-api-custom-labels'

let faceApiScriptPromise
let faceApiModelsPromise

function resolvePublicPath(path) {
  if (!path) {
    return ''
  }

  if (
    /^https?:\/\//i.test(path) ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path
  }

  if (path.startsWith('/')) {
    return `${baseUrl}${path}`
  }

  return `${baseUrl}/${path.replace(/^\//, '')}`
}

function createLabelDetectorOptions(faceapi) {
  return new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,
    scoreThreshold: 0.45,
  })
}

function createLiveDetectorOptions(faceapi) {
  return new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5,
  })
}

function getFaceApi() {
  if (typeof window === 'undefined' || !window.faceapi) {
    throw new Error(
      'face-api.js is not loaded. Check public/vendor/face-api.min.js.',
    )
  }

  return window.faceapi
}

async function loadFaceApiScript() {
  if (typeof window === 'undefined') {
    throw new Error('face-api.js can only be loaded in the browser.')
  }

  if (window.faceapi) {
    return window.faceapi
  }

  if (!faceApiScriptPromise) {
    faceApiScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = resolvePublicPath('/vendor/face-api.min.js')
      script.async = true
      script.onload = () => {
        if (window.faceapi) {
          resolve(window.faceapi)
          return
        }

        reject(
          new Error(
            'face-api.js loaded, but the global faceapi object was not found.',
          ),
        )
      }
      script.onerror = () => {
        reject(
          new Error(
            'face-api.js could not be loaded. Check public/vendor/face-api.min.js.',
          ),
        )
      }
      document.head.appendChild(script)
    }).catch((error) => {
      faceApiScriptPromise = undefined
      throw error
    })
  }

  return faceApiScriptPromise
}

function normalizeDescriptor(descriptor) {
  return descriptor instanceof Float32Array
    ? descriptor
    : new Float32Array(descriptor)
}

function parseStoredFaces() {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const storedValue = window.localStorage.getItem(CUSTOM_DESCRIPTOR_STORAGE_KEY)
    return storedValue ? JSON.parse(storedValue) : {}
  } catch (error) {
    console.warn('Could not parse saved faces from localStorage.', error)
    return {}
  }
}

function writeStoredFaces(store) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(CUSTOM_DESCRIPTOR_STORAGE_KEY, JSON.stringify(store))
}

function mergeLabeledFaceDescriptors(labeledFaces) {
  const faceapi = getFaceApi()
  const facesByLabel = new Map()

  labeledFaces.forEach((face) => {
    if (!face?.label) {
      return
    }

    const currentDescriptors = facesByLabel.get(face.label) || []
    const nextDescriptors = face.descriptors.map(normalizeDescriptor)
    facesByLabel.set(face.label, [...currentDescriptors, ...nextDescriptors])
  })

  return Array.from(facesByLabel.entries()).map(
    ([label, descriptors]) =>
      new faceapi.LabeledFaceDescriptors(label, descriptors),
  )
}

async function readManifest(manifestUrl) {
  const response = await fetch(manifestUrl, { cache: 'no-store' })

  if (!response.ok) {
    if (response.status === 404) {
      return { people: [] }
    }

    throw new Error(`The face manifest could not be loaded (${response.status}).`)
  }

  return response.json()
}

async function detectSingleFaceDescriptor(imageSource) {
  const faceapi = getFaceApi()
  const image =
    typeof imageSource === 'string'
      ? await faceapi.fetchImage(resolvePublicPath(imageSource))
      : imageSource

  const detection = await faceapi
    .detectSingleFace(image, createLabelDetectorOptions(faceapi))
    .withFaceLandmarks()
    .withFaceDescriptor()

  return detection?.descriptor || null
}

async function loadManifestLabeledFaces(records, manifestUrl) {
  const faceapi = getFaceApi()
  const manifest = await readManifest(manifestUrl)
  const people = Array.isArray(manifest.people) ? manifest.people : []
  const recordsById = new Map(records.map((record) => [record.id, record]))
  const recordsByPfNumber = new Map(
    records.map((record) => [
      normalizePfNumberForSearch(record.pfNumber),
      record,
    ]),
  )
  const labeledFaces = []

  for (const person of people) {
    const label = String(person?.label || '').trim()
    const images = Array.isArray(person?.images) ? person.images : []

    if (!label || !images.length) {
      continue
    }

    const record =
      recordsById.get(label) ||
      recordsByPfNumber.get(normalizePfNumberForSearch(label))
    const actualLabel = record?.id || label
    const descriptors = []

    for (const imagePath of images) {
      try {
        const descriptor = await detectSingleFaceDescriptor(imagePath)

        if (descriptor) {
          descriptors.push(descriptor)
        }
      } catch (error) {
        console.warn(
          `Skipping invalid passport image "${imagePath}" for "${actualLabel}".`,
          error,
        )
      }
    }

    if (descriptors.length) {
      labeledFaces.push(new faceapi.LabeledFaceDescriptors(actualLabel, descriptors))
    }
  }

  return labeledFaces
}

async function loadGenericManifestLabeledFaces(manifestUrl) {
  const faceapi = getFaceApi()
  const manifest = await readManifest(manifestUrl)
  const people = Array.isArray(manifest.people) ? manifest.people : []
  const labeledFaces = []

  for (const person of people) {
    const label = String(person?.label || '').trim()
    const images = Array.isArray(person?.images) ? person.images : []

    if (!label || !images.length) {
      continue
    }

    const descriptors = []

    for (const imagePath of images) {
      try {
        const descriptor = await detectSingleFaceDescriptor(imagePath)

        if (descriptor) {
          descriptors.push(descriptor)
        }
      } catch (error) {
        console.warn(
          `Skipping invalid labeled image "${imagePath}" for "${label}".`,
          error,
        )
      }
    }

    if (descriptors.length) {
      labeledFaces.push(new faceapi.LabeledFaceDescriptors(label, descriptors))
    }
  }

  return labeledFaces
}

async function loadLocalOverrideLabeledFaces(records) {
  const faceapi = getFaceApi()
  const labeledFaces = []

  for (const record of records) {
    const imageSource = record?.localPassport?.dataUrl

    if (!imageSource) {
      continue
    }

    try {
      const descriptor = await detectSingleFaceDescriptor(imageSource)

      if (descriptor) {
        labeledFaces.push(
          new faceapi.LabeledFaceDescriptors(record.id, [descriptor]),
        )
      }
    } catch (error) {
      console.warn(
        `Skipping invalid browser-saved passport image for "${record.id}".`,
        error,
      )
    }
  }

  return labeledFaces
}

function loadStoredLabeledFaces() {
  const faceapi = getFaceApi()
  const storedFaces = parseStoredFaces()

  return Object.entries(storedFaces).map(
    ([label, descriptors]) =>
      new faceapi.LabeledFaceDescriptors(
        label,
        descriptors.map(normalizeDescriptor),
      ),
  )
}

function formatMatch(match) {
  if (!match) {
    return {
      label: 'Face detected',
      confidence: null,
      recognized: false,
    }
  }

  if (match.label === 'unknown') {
    return {
      label: 'Unknown',
      confidence: null,
      recognized: false,
    }
  }

  return {
    label: match.label,
    confidence: Math.max(0, Math.min(1, 1 - match.distance)),
    recognized: true,
  }
}

export function clearCanvas(canvasElement) {
  if (!canvasElement) {
    return
  }

  const context = canvasElement.getContext('2d')

  if (context) {
    context.clearRect(0, 0, canvasElement.width, canvasElement.height)
  }
}

function getDisplaySize(mediaElement) {
  if (!mediaElement) {
    return { width: 0, height: 0 }
  }

  if (mediaElement.videoWidth && mediaElement.videoHeight) {
    return {
      width: mediaElement.videoWidth,
      height: mediaElement.videoHeight,
    }
  }

  if (mediaElement.naturalWidth && mediaElement.naturalHeight) {
    return {
      width: mediaElement.naturalWidth,
      height: mediaElement.naturalHeight,
    }
  }

  return {
    width: mediaElement.width || mediaElement.clientWidth || 0,
    height: mediaElement.height || mediaElement.clientHeight || 0,
  }
}

function getTopExpression(expressions = {}) {
  const entries = Object.entries(expressions)

  if (!entries.length) {
    return null
  }

  const [expression, score] = entries.reduce((bestMatch, currentMatch) =>
    currentMatch[1] > bestMatch[1] ? currentMatch : bestMatch,
  )

  return score >= 0.35 ? expression : null
}

export async function loadFaceApiModels(modelUrl = MODEL_URL) {
  if (!faceApiModelsPromise) {
    faceApiModelsPromise = loadFaceApiScript()
      .then(async (faceapi) => {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
          faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
        ])

        return faceapi
      })
      .catch((error) => {
        faceApiModelsPromise = undefined
        throw error
      })
  }

  return faceApiModelsPromise
}

export async function loadStaffFaceDescriptors(
  records,
  manifestUrl = PASSPORT_MANIFEST_URL,
) {
  await loadFaceApiModels()

  const [manifestFaces, localOverrideFaces] = await Promise.all([
    loadManifestLabeledFaces(records, manifestUrl),
    loadLocalOverrideLabeledFaces(records),
  ])

  return mergeLabeledFaceDescriptors([...manifestFaces, ...localOverrideFaces])
}

export async function loadKnownFaces(
  manifestUrl = LABELED_IMAGES_MANIFEST_URL,
) {
  await loadFaceApiModels()

  const [manifestFaces, storedFaces] = await Promise.all([
    loadGenericManifestLabeledFaces(manifestUrl),
    Promise.resolve(loadStoredLabeledFaces()),
  ])

  return mergeLabeledFaceDescriptors([...manifestFaces, ...storedFaces])
}

export function summarizeKnownFaces(labeledFaces) {
  return labeledFaces
    .map((face) => ({
      label: face.label,
      samples: face.descriptors.length,
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

export function createFaceMatcher(labeledFaces, threshold = 0.5) {
  const faceapi = getFaceApi()

  return labeledFaces.length
    ? new faceapi.FaceMatcher(labeledFaces, threshold)
    : null
}

export async function detectFaces(mediaElement) {
  const faceapi = getFaceApi()

  return faceapi
    .detectAllFaces(mediaElement, createLiveDetectorOptions(faceapi))
    .withFaceLandmarks()
    .withFaceDescriptors()
    .withFaceExpressions()
}

export function drawFaceResults(
  canvasElement,
  mediaElement,
  detections,
  matcher,
) {
  const faceapi = getFaceApi()

  if (!canvasElement || !mediaElement) {
    return []
  }

  const displaySize = getDisplaySize(mediaElement)

  if (!displaySize.width || !displaySize.height) {
    clearCanvas(canvasElement)
    return []
  }

  faceapi.matchDimensions(canvasElement, displaySize)
  const resizedDetections = faceapi.resizeResults(detections, displaySize)
  const context = canvasElement.getContext('2d')

  if (context) {
    context.clearRect(0, 0, canvasElement.width, canvasElement.height)
  }

  return resizedDetections.map((detection, index) => {
    const match = matcher?.findBestMatch(detection.descriptor) || null
    const { label, confidence, recognized } = formatMatch(match)
    const emotion = getTopExpression(detection.expressions)
    const annotation = [label]

    if (emotion) {
      annotation.push(emotion)
    }

    const drawBox = new faceapi.draw.DrawBox(detection.detection.box, {
      boxColor: recognized ? '#10b981' : '#f97316',
      label: annotation.join(' • '),
    })

    drawBox.draw(canvasElement)

    return {
      id: `${label}-${index}-${Math.round(detection.detection.box.x)}`,
      label,
      confidence,
      emotion,
      recognized,
    }
  })
}

export async function captureDescriptorFromSource(mediaElement) {
  const faceapi = getFaceApi()
  const detections = await faceapi
    .detectAllFaces(mediaElement, createLabelDetectorOptions(faceapi))
    .withFaceLandmarks()
    .withFaceDescriptors()

  if (!detections.length) {
    throw new Error('No face detected. Move closer to the camera and try again.')
  }

  if (detections.length > 1) {
    throw new Error(
      'More than one face was detected. Keep only one person in the frame.',
    )
  }

  return detections[0].descriptor
}

export function saveCustomDescriptor(label, descriptor) {
  const trimmedLabel = label.trim()

  if (!trimmedLabel) {
    throw new Error('A name is required before saving a face.')
  }

  const storedFaces = parseStoredFaces()
  const currentDescriptors = Array.isArray(storedFaces[trimmedLabel])
    ? storedFaces[trimmedLabel]
    : []

  storedFaces[trimmedLabel] = [
    ...currentDescriptors,
    Array.from(normalizeDescriptor(descriptor)),
  ]

  writeStoredFaces(storedFaces)
}

export function clearCustomDescriptors() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(CUSTOM_DESCRIPTOR_STORAGE_KEY)
}

export async function findFaceMatchesInImage(imageSource, matcher) {
  await loadFaceApiModels()

  const faceapi = getFaceApi()
  const image =
    typeof imageSource === 'string'
      ? await faceapi.fetchImage(resolvePublicPath(imageSource))
      : imageSource

  const detections = await faceapi
    .detectAllFaces(image, createLabelDetectorOptions(faceapi))
    .withFaceLandmarks()
    .withFaceDescriptors()

  return detections.map((detection, index) => {
    const match = matcher?.findBestMatch(detection.descriptor) || null
    const { label, confidence, recognized } = formatMatch(match)

    return {
      id: `${label}-${index}`,
      label,
      confidence,
      recognized,
    }
  })
}
