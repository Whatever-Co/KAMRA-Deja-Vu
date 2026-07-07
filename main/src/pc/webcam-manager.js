import {EventEmitter} from 'events'


class WebcamManager extends EventEmitter {

  start(onSuccess, onError) {
    // 2015 called the legacy callback getUserMedia with Chrome-only
    // mandatory/optional constraints; iOS Safari only ever shipped
    // navigator.mediaDevices, so use the modern API everywhere
    navigator.mediaDevices.getUserMedia({
      video: {
        width: {ideal: 1920, min: 640},
        facingMode: 'user'
      }
    }).then((stream) => {
      this.stream = stream
      onSuccess()
    }).catch((error) => {
      console.error('WebcamManager.getUserMedia rejected', error && error.name, error && error.message)
      // pass the error through so the caller can branch on error.name
      // (NotAllowedError = permission denied, NotFoundError = no camera,
      // NotReadableError = in use by another app, etc.)
      onError(error)
    })
  }


  stop() {
    if (this.stream) {
      this.stream.getVideoTracks()[0].stop()
    }
  }

}


export default new WebcamManager()
