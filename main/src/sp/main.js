import $ from 'jquery'
import i18n from 'i18next-client'
import i18nextJquery from 'i18next-jquery'
import Modernizr from 'exports?Modernizr!modernizr-custom'
import gaUtil from './ga-util'

const DEV = (process.env.NODE_ENV == 'development')


if (Modernizr.getusermedia
  && Modernizr.webgl
  && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) == false) {
  // No supported devices
  location.href = '/'
}


class App {
  constructor() {
    this.initLocalization()

    // is mobile?
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      $('html').addClass('mobile')
    }

    // smooth to top
    $('.footer button').click(() => {
      $('html,body').animate({scrollTop:0}, 500, 'swing')
      return false
    })


    gaUtil({
      '#youtube button':'SP_Play_Movie',
      '.link_itunes':'SP_Album_iTunes',
      '.link_amazon':'SP_Album_Amazon',
      '.link_cdbaby':'SP_Album_CDBaby',
      '.link_soundcloud':'SP_KAMRA_SoundCloud',
      '.link_kamratwitter':'SP_KAMRA_TW',
      '.link_invisidir':'SP_Link_invisi-dir',
      '.link_invisi':'SP_Link_invisi',
      '.button_twitter':'SP_Share_TW',
      '.button_facebook':'SP_Share_FB',
      '.button_line':'SP_Share_Line'
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
      lng:(()=>{
        if(DEV || location.search.startsWith('?setLng')) {
          return ''
        }
        return (navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0,2) == 'ja' ? 'ja' : 'en'
      })(),
      resGetPath: '../locales/__lng__/__ns__.json',
      debug: DEV
    }, ()=>{
      $('#page').localize()
      // build img src
      let imgs = $('img.i18n')
      imgs.each(function() {
        let img = $(this)
        img.attr('src', img.text()) // localize img src
      })

      // build twitter
      let twitter_href = $.t('social.twitter', {
        url: encodeURIComponent($.t('social.url')),
        text: encodeURIComponent($.t('social.top_text'))
      })
      $('a.button_twitter').attr('href', twitter_href)
    })
  }

  initYoutube() {
    let youtube = $('#youtube')
    let overlay = $('#youtube_overlay')
    let videoId = youtube.data('videoid')
    youtube.css({
      width:overlay.width(),
      height:overlay.height()
    })
    $('#youtube_container').css({
      width:overlay.width(),
      height:overlay.height()
    })

    this.player = new YT.Player('youtube',
      {
        width: '100%',
        height: '100%',
        videoId: videoId,
        playerVars: {
          autohide: 1,
          autoplay: 0,
          loop: 0,
          controls: 1
        },
        events: {
          onStateChange: (event) => {
            if (event.data == YT.PlayerState.BUFFERING) {
              overlay.hide()
            }
          }
        }
      })
  }

}

let app = new App()
window.onYouTubeIframeAPIReady = () => {
  app.initYoutube()
}
