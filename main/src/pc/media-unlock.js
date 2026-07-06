// Mobile browsers (and modern desktop autoplay policy) allow audible media
// playback only from a user-gesture call stack. Audible elements register
// here, and unlock() is called inside gesture handlers (the top-page start
// buttons): a play()+pause() pair marks the element user-activated so later
// programmatic play() calls (FSM transitions, keyframe events) succeed.
// Muted texture videos (curl_bg, slitscan, riri, webcam) don't need this —
// muted playback is never gated.
const elements = []

export default {

  register(el) {
    if (elements.indexOf(el) < 0) {
      elements.push(el)
    }
  },

  // must be called synchronously from a click/touch handler
  unlock() {
    elements.forEach((el) => {
      if (el.__djvUnlocked) {
        return
      }
      el.__djvUnlocked = true
      // the user-activation flag is granted by calling play() inside the
      // gesture, not by playback actually starting — pause synchronously.
      // Waiting for the play() promise instead would race the show: on a
      // slow connection it resolves after the FSM has started this video
      // as the master clock, and the deferred pause() would freeze it.
      let p = el.play()
      if (p && p.catch) {
        p.catch(() => {
          // AbortError from the immediate pause() — expected
        })
      }
      el.pause()
      el.currentTime = 0
    })
  }

}
