import $ from 'jquery'
import i18n from 'i18next-client'
import i18nextJquery from 'i18next-jquery'

import StateMachine from 'javascript-state-machine'

import Config from './config'
import Ticker from './ticker'
import PreprocessWorker from 'worker!./preprocess-worker'
import App from './app'


if (Config.DEV_MODE) {
  $('head').append(`<script async src='/browser-sync/browser-sync-client.2.10.0.js'><\/script>`)
}


class PageManager {

  constructor() {
    this.fsm = StateMachine.create({
      initial: 'loadAssets',
      events: [
        {name: 'loadComplete', from: 'loadAssets', to: 'top'},
        {name: 'start', from: ['top', 'about'], to: 'playing'},
        {name: 'playCompleted', from: 'playing', to: 'share'},
        {name: 'goAbout', from: 'top', to: 'about'},
        {name: 'goHowto', from: 'top', to: 'howto'},
        {name: 'goTop', from: ['about', 'howto', 'share'], to: 'top'},
      ],
      callbacks: {
        onleaveloadAssets: () => {
          $('#loading').fadeOut(1000, () => {
            this.app = new App(this.keyframes)
            this.app.on('complete', () => {
              this.fsm.playCompleted()
            })
            this.fsm.transition()
          })
          return StateMachine.ASYNC
        },
        // top
        onentertop: () => {
          if (window.__djv_loader.getResult('shared-data')) {
            this.fsm.start('shared')
          } else {
            // this.fsm.start('webcam')
            $('#top').fadeIn(1000)
          }
        },
        onleavetop: () => {

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
        onbeforestart: () => {
          $('#top').fadeOut(1000)
          return StateMachine.ASYNC
        },
        onenterplaying: (e, f, t, sourceType) => {
          this.app.start(sourceType)
        },
        // share
        onentershare: () => {
          $('#share').fadeIn(1000)
        },
        onleaveshare: () => {
          $('#share').fadeOut(1000, () => {
            this.fsm.transition()
          })
          return StateMachine.ASYNC
        },
      }
    })
    $('.with-webcam').click(() => this.fsm.start('webcam'))
    $('.with-photo').click(() => console.warn('TODO upload page'))
    $('.without-webcam').click(() => this.fsm.start('video'))
    $('.button-top').click(() => location.reload())
    $('a[href="#about"]').click(() => this.fsm.goAbout())
    $('a[href="#howto"]').click(() => this.fsm.goHowto())
    $('button.close').click(() => {
      location.href = '#'
      this.fsm.goTop()
    })
    // smooth scroll
    //$('a[href^=#]').click(function() {
    //  let href= $(this).attr('href')
    //  let target = $(href == '#' || href == '' ? 'html' : href)
    //  var position = target.offset().top - 100
    //  $('html', 'body').animate({scrollTop:position}, 500, 'swing')
    //
    //  return false
    //});

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
      lng: 'dev',
      debug: Config.DEV_MODE
    }, ()=>{
      $('#about').localize()
      $('#howto').localize()
    })


    Ticker.start()

    this.preprocessKeyframes()
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

}


new PageManager()
