/* global process */

const LOW_SPEC = screen.width < 1600

export default {
  DEV_MODE: process.env.NODE_ENV == 'development',
  LOW_SPEC,
  RENDER_WIDTH: LOW_SPEC ? 1280 : 1920,
  RENDER_HEIGHT: LOW_SPEC ? 720 : 1080,
  MIN_WINDOW_WIDTH: 1100,
  MIN_WINDOW_HEIGHT: 620,
  DATA: require('./data/config.json')
}
