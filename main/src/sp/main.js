import $ from 'jquery'
import i18n from 'i18next-client'
import i18nextJquery from 'i18next-jquery'

const DEV = (process.env.NODE_ENV == 'development')

class App {
  constructor() {
    this.initLocalization()

    //
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      $('html').addClass('mobile')
    }


    // misc setting
    $('.footer button').click(() => {
      console.log('cccc')
      $('html,body').animate({scrollTop:0}, 500, 'swing')
      return false
    })
  }

  initLocalization() {
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

  initYoutube() {
    let youtube = $('#youtube')
    let videoId = youtube.data('videoid')
    youtube.css({
      width:youtube.width(),
      height:youtube.height()
    })
    youtube.click(() => this.startYoutube(videoId))
  }

  startYoutube(videoId) {
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
  app.initYoutube()
}
