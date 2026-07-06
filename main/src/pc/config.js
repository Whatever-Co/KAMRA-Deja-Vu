/* global process */

// iPadOS 13+ reports a Mac userAgent; the touch-points check catches it
const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  || (navigator.platform == 'MacIntel' && navigator.maxTouchPoints > 1)

export default {
  DEV_MODE: process.env.NODE_ENV == 'development',
  IS_MOBILE,
  RENDER_WIDTH: 1920,
  RENDER_HEIGHT: 1080,
  MIN_WINDOW_WIDTH: IS_MOBILE ? 0 : 1100,
  MIN_WINDOW_HEIGHT: 620,
  FACE_SUBDIVISION: 2,
  DATA: require('./data/config.json')
}
