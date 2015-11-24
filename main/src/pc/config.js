/* global process */

export default {
  DEV_MODE: process.env.NODE_ENV == 'development',
  RENDER_WIDTH: 1920,
  RENDER_HEIGHT: 1080,
  MIN_WINDOW_WIDTH: 1100,
  MIN_WINDOW_HEIGHT: 620,
  DATA: require('./data/config.json')
}
