import $ from 'jquery'
import i18n from 'i18next-client'
import i18nextJquery from 'i18next-jquery'

import StateMachine from 'javascript-state-machine'

import Config from './config'
import Ticker from './ticker'
import PreprocessWorker from 'worker!./preprocess-worker'
import App from './app'
import WebcamManager from './webcam-manager'
import FaceDetector from './face-detector'
import ShareUtil from './share-util'


if (Config.DEV_MODE) {
  $('head').append(`<script async src='/browser-sync/browser-sync-client.2.10.0.js'><\/script>`)
}


class PageManager {

  constructor() {
    this.fsm = StateMachine.create({
      initial: 'loadAssets',
      events: [
        {name: 'loadComplete', from: 'loadAssets', to: 'top'},

        {name: 'selectWebcam', from: ['top', 'about'], to: 'webcam1'},
        {name: 'webcamOK', from: 'webcam1', to: 'webcam2'},
        
        {name: 'selectUpload', from: ['top', 'about'], to: 'upload1'},
        {name: 'skip', from: 'upload1', to: 'upload2'},
        {name: 'fileSelected', from: 'upload2', to: 'upload2process'},
        {name: 'detected', from: 'upload2process', to: 'upload3'},
        {name: 'failure', from: 'upload2process', to: 'upload2'},
        {name: 'retry', from: 'upload3', to: 'upload2'},

        {name: 'start', from: ['top', 'webcam2', 'upload3'], to: 'playing'},
        {name: 'playCompleted', from: 'playing', to: 'share'},
        {name: 'goAbout', from: 'top', to: 'about'},
        {name: 'goHowto', from: 'top', to: 'howto'},
        {name: 'goTop', from: ['webcam1', 'about', 'howto', 'share'], to: 'top'},
      ],
      callbacks: {
        onleaveloadAssets: () => {
          $('#loading').fadeOut(1000, () => {
            this.app = new App(this.keyframes)
            this.app.on('complete', this.fsm.playCompleted.bind(this.fsm))
            this.fsm.transition()
          })
          return StateMachine.ASYNC
        },
        // top
        onentertop: () => {
          if (window.__djv_loader.getResult('shared-data')) {
            $('#top .play_buttons').hide()
            $('#top .play-shared').show()
            this.app.prepareForImage(
              window.__djv_loader.getResult('shared-image'),
              window.__djv_loader.getResult('shared-data')
            )
          }
          $('#top').delay(500).fadeIn(1000)
        },
        onleavetop: (event, from, to) => {
          if (to == 'webcam1' || to == 'upload1' || to == 'playing') {
            $('#top').stop().fadeOut(1000, () => {
              this.fsm.transition()
            })
            return StateMachine.ASYNC
          }
        },

        // webcam
        onenterwebcam1: () => {
          $('#webcam-step1').fadeIn(1000)
          WebcamManager.start(() => {
            this.fsm.webcamOK()
          }, () => {
            this.fsm.goTop()
          })
        },
        onleavewebcam1: () => {
          $('#webcam-step1').stop().fadeOut(1000, () => {
            this.fsm.transition()
          })
          return StateMachine.ASYNC
        },
        onenterwebcam2: () => {
          $('#webcam-step2').css({display: 'flex'}).hide().fadeIn(1000)
        },
        onleavewebcam2: () => {
          $('#webcam-step2').stop().fadeOut(1000, () => {
            this.fsm.transition()
          })
          return StateMachine.ASYNC
        },

        // upload
        onenterupload1: () => {
          $('#upload-step1').css({display: 'flex'}).hide().fadeIn(1000)
        },
        onleaveupload1: () => {
          $('#upload-step1').stop().fadeOut(1000, () => {
            this.fsm.transition()
          })
          return StateMachine.ASYNC
        },
        onenterupload2: () => {
          $('#upload-step2').css({display: 'flex'}).hide().fadeIn(1000)
        },
        onleaveupload2: () => {
          $('#upload-step2').stop().fadeOut(1000)
        },
        onenterupload2process: (e, f, t, file) => {
          this.processImageFile(file)
        },
        onenterupload3: () => {
          $('#upload-step3').css({display: 'flex'}).hide().fadeIn(1000)
        },
        onleaveupload3: () => {
          $('#upload-step3').stop().fadeOut(1000, () => {
            this.fsm.transition()
          })
          return StateMachine.ASYNC
        },

        // about
        onenterabout: () => {
          $('#about').fadeIn(1000)
          $('#top,#canvas-clip').addClass('blur')
        },
        onleaveabout: () => {
          $('#about').fadeOut(1000)
          $('#top,#canvas-clip').removeClass('blur')
        },
        // howto
        onenterhowto: () => {
          $('#howto').fadeIn(1000)
          $('#top,#canvas-clip').addClass('blur')
        },
        onleavehowto: () => {
          $('#howto').fadeOut(1000)
          $('#top,#canvas-clip').removeClass('blur')
        },

        // play
        // onbeforestart: () => {
        //   $('#top').fadeOut(1000)
        //   return StateMachine.ASYNC
        // },
        onenterplaying: (e, f, t, sourceType) => {
          this.app.start(sourceType)
        },

        // share
        onentershare: (e, f, t, shareURL) => {
          this.setupShareButtons('#share .button-twitter', '#share .button-facebook', $.t('social.share_text'), shareURL || location.href)
          $('#share').fadeIn(1000)
        },
        onleaveshare: () => {
          $('#share').fadeOut(1000, () => {
            this.fsm.transition()
          })
          return StateMachine.ASYNC
        },
      },
      error: (eventName, from, to, args, errorCode, errorMessage) => {
        console.warn(eventName, from, to, args, errorCode, errorMessage)
        if (Config.DEV_MODE) debugger
      }
    })
    $('.with-webcam').click(() => this.fsm.selectWebcam())
    $('.with-photo').click(() => this.fsm.selectUpload())
    $('.without-webcam').click(() => this.fsm.start('video'))
    $('#top .play-shared button').click(() => this.fsm.start('shared'))
    $('#webcam-step2 button.skip').click(() => this.fsm.start('webcam'))
    $('#upload-step1 button.skip').click(() => this.fsm.skip())
    $('#upload-step3 button.ok').click(() => this.fsm.start('uploaded'))
    $('#upload-step3 button.retry').click(() => this.fsm.retry())
    $('.button-top').click(() => location.reload())
    $('a[href="#about"]').click(() => this.fsm.goAbout())
    $('a[href="#howto"]').click(() => this.fsm.goHowto())
    $('button.close').click(() => {
      location.href = '#'
      this.fsm.goTop()
    })

    this.initUploads()

    // smooth scroll
    //$('a[href^=#]').click(function() {
    //  let href= $(this).attr('href')
    //  let target = $(href == '#' || href == '' ? 'html' : href)
    //  var position = target.offset().top - 100
    //  $('html', 'body').animate({scrollTop:position}, 500, 'swing')
    //
    //  return false
    //});

    this.initLocales()

    Ticker.start()

    this.preprocessKeyframes()
  }


  initUploads() {
    let button = $('#upload-step2 .drop-area')
    let file = $('#upload-step2 .image-file')

    button.on('click', () => file.click())
    file.on('change', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.fsm.fileSelected(file[0].files[0])
    })
    window.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'copy'
    }, false)
    window.addEventListener('drop', (e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log(e.dataTransfer.files)
      this.fsm.fileSelected(e.dataTransfer.files[0])
    })
  }

  initLocales() {
    // localise
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
        if(Config.DEV_MODE) {
          return ''
        }
        return (navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0,2) == 'ja' ? 'ja' : 'en'
      })(),
      debug: Config.DEV_MODE
    }, () => {
      $('#about').localize()
      $('#howto').localize()

      this.setupShareButtons('a.button_twitter', 'a.button_facebook', $.t('social.top_text'), $.t('social.url'))
    })
  }


  setupShareButtons(twitter, facebook, text, url) {
    $(twitter).click((e) => {
      e.preventDefault()
      ShareUtil.twitter({
        text,
        url,
        hashtags: 'KAMRA',
      })
    })
    $(facebook).click((e) => {
      e.preventDefault()
      ShareUtil.facebook({
        app_id: '1487444688252775',
        href: url,
        redirect_uri: 'https://kamra.invisi-dir.com/#shared',
      })
    })
  }


  preprocessKeyframes() {
    let loader = window.__djv_loader

    this.keyframes = loader.getResult('keyframes')
    console.log(this.keyframes)

    console.time('morph data processing')
    let worker = new PreprocessWorker()

    let targetObject = [
      this.keyframes.user.property,
      this.keyframes.user_alt.property[0],
      this.keyframes.user_alt.property[1],
      this.keyframes.falling_children_mesh.property[0],
    ]
    .concat(this.keyframes.user_children.property.map((props) => props))
    .concat(this.keyframes.falling_children_mesh.property.map((props) => props))

    let transferList = []
    let objectVertices = targetObject.map((obj) => {
      return obj.face_vertices.map((v) => {
        if (v) {
          let a = new Float32Array(v)
          transferList.push(a.buffer)
          return a
        }
        return null
      })
    })

    worker.postMessage(objectVertices, transferList)
    worker.onmessage = (event) => {
      event.data.forEach((morph, i) => {
        targetObject[i].morph = morph
      })
      console.timeEnd('morph data processing')
      this.fsm.loadComplete()
    }
  }


  processImageFile(file) {
    this.readAsDataURL(file).then((url) => {
      let image = new Image()
      image.onload = () => {
        let detector = new FaceDetector()
        detector.once('detected', (points) => {
          this.app.prepareForImage(image, points, true)
          this.fsm.detected()
        })
        detector.detect(image)
      }
      image.src = url
    })
  }


  readAsDataURL(file) {
    return new Promise((resolve) => {
      let reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target.result)
      }
      reader.readAsDataURL(file)
    })
  }

}


window.__djv_loader.on('complete', () => {
  new PageManager()
})

window.onerror = (message, url, lineNumber, column, error) => {
  console.log({message, url, lineNumber, column, error, stack: error.stack})
  // debugger
}
