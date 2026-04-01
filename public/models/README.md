# face-api.js model files

Copy the following model folders from the official `face-api.js-models` repository into this directory:

- `tiny_face_detector`
- `face_landmark_68`
- `face_recognition`
- `face_expression`

After copying, `public/models` should contain files such as:

- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`
- `face_expression_model-weights_manifest.json`
- `face_expression_model-shard1`

The app loads these files from `/models` at runtime.
