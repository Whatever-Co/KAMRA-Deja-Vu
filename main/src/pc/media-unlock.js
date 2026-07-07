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
      // the user-activation flag is granted by calling play() inside the
      // gesture, not by playback actually starting — pause synchronously.
      // Waiting for the play() promise instead would race the show: on a
      // slow connection it resolves after the FSM has started this video
      // as the master clock, and the deferred pause() would freeze it.
      let p = el.play()
      // set only AFTER play() returned without throwing — a synchronous
      // throw (missing src, invalid element) must not permanently latch
      // "unlocked"
      el.__djvUnlocked = true
      if (p && p.catch) {
        p.catch((err) => {
          // AbortError from the immediate pause() is expected — surface
          // anything else so a genuine autoplay/permission/codec failure
          // doesn't silently freeze the show later
          if (err && err.name === 'AbortError') return
          el.__djvUnlocked = false
          console.error('MediaUnlock: play() rejected on', el.src, err)
        })
      }
      el.pause()
      el.currentTime = 0
    })
  }

}
