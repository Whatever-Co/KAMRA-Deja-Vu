import {EventEmitter} from 'events'
import Modernizr from 'exports?Modernizr!modernizr-custom'


class WebcamManager extends EventEmitter {

  start(onSuccess, onError) {
    Modernizr.prefixed('getUserMedia', navigator)({
      video: {
        mandatory: {minWidth: 640},
        optional: [
          {minWidth: 1280},
          {minWidth: 1920}
        ]
      }
    }, (stream) => {
      this.stream = stream
      onSuccess()
    }, (error) => {
      console.warn(error)
      onError()
    })
  }


  stop() {
    if (this.stream) {
      this.stream.getVideoTracks()[0].stop()
    }
  }

}


export default new WebcamManager()
