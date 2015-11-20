import $ from 'jquery'
import i18n from 'i18next-client'
import i18nextJquery from 'i18next-jquery'

const DEV = (process.env.NODE_ENV == 'development')

class App {
  constructor() {
    i18nextJquery(i18n, $, {
      tName: 't',
      i18nName: 'i18n',
      handleName: 'localize',
      selectorAttr: 'data-i18n',
      targetAttr: 'data-i18n-target',
      optionsAttr: 'data-i18n-options',
      useOptionsAttr: false,
      parseDefaultValueFromContent: true
    })
    $.i18n.init({
      lng: 'dev',
      resGetPath: '../locales/__lng__/__ns__.json',
      debug: DEV
    }, ()=>{
      console.log('TODO localize')
    })
  }

  setupYoutube() {

    let youtube = $('#youtube')
    youtube.click(() => this.startYoutube())
    youtube.css({
      width:youtube.width(),
      height:youtube.height()
    })

  }

  startYoutube() {
    console.log('start youtube2')
    const videoId = 'vwfNPtnPl4E'
    //let videoId = document.getElementById(id).getAttribute('data-video-id')
    this.player = new YT.Player('youtube',
      {
        width: '100%',
        height: '100%',
        videoId: videoId,
        playerVars: {
          autohide: 1,
          autoplay: 1,
          loop: 1,
          controls: 1
        }
      })
  }
}

let app = new App()
window.onYouTubeIframeAPIReady = () => {
  app.setupYoutube()
}
