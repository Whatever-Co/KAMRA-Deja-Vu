

/**
 * Check WebGL support
 * @returns {boolean}
 */
export function checkWebGL() {
  let webGLContext;
  let webGLTestCanvas = document.createElement('canvas');
  if (window.WebGLRenderingContext) {
    webGLContext = webGLTestCanvas.getContext('webgl') || webGLTestCanvas.getContext('experimental-webgl');
    if (!webGLContext || !webGLContext.getExtension('OES_texture_float')) {
      webGLContext = null;
    }
  }
  return webGLContext != null;
}

/**
 * Setup webcamera
 * @param the video dom
 */
export function requestWebcam(video) {
  navigator.getUserMedia(
    {video : true},
    // Success
    (stream)=>{
      if (video.mozCaptureStream) {
        video.mozSrcObject = stream;
      } else {
        video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
      }
      video.play();
    },
    // Failue
    ()=>{
      // insertAltVideo(vid);
      alert("There was some problem trying to fetch video from your webcam, using a fallback video instead.");
    }
  );
}