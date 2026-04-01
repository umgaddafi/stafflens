import { useEffect, useState } from 'react'

const VIDEO_CONSTRAINTS = {
  audio: false,
  video: {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
}

export default function TrainingCamera({ videoRef, onReady, onError }) {
  const [cameraMessage, setCameraMessage] = useState(
    'Requesting webcam permission...',
  )

  useEffect(() => {
    const videoElement = videoRef.current
    let activeStream
    let isMounted = true

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('This browser does not support webcam access.')
        }

        activeStream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS)

        if (!isMounted || !videoElement) {
          return
        }

        videoElement.srcObject = activeStream
        setCameraMessage('Webcam connected. Starting stream...')
      } catch (error) {
        if (!isMounted) {
          return
        }

        setCameraMessage('Unable to access the webcam.')
        onError?.(error)
      }
    }

    startCamera()

    return () => {
      isMounted = false

      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop())
      }

      if (videoElement) {
        videoElement.srcObject = null
      }
    }
  }, [onError, onReady, videoRef])

  const handleLoadedMetadata = async () => {
    try {
      await videoRef.current?.play()
      setCameraMessage('Webcam ready')
      onReady?.()
    } catch (error) {
      setCameraMessage('Webcam stream could not start.')
      onError?.(error)
    }
  }

  return (
    <div className="training-camera-shell">
      <video
        ref={videoRef}
        autoPlay
        className="training-camera-video is-mirrored"
        muted
        onLoadedMetadata={handleLoadedMetadata}
        playsInline
      />
      <div className="training-camera-badge">{cameraMessage}</div>
    </div>
  )
}
