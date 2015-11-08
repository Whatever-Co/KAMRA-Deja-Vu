import {EventEmitter} from 'events'
import $ from 'jquery'


export default class PageManager extends EventEmitter {

  constructor(stateMachine) {
    super()
    this.stateMachine = stateMachine
    this.init()
  }


  init() {
    this.stateMachine.onleaveloadAssets = () => {
      $('#loading').hide()
    }

    this.stateMachine.onentertop = () => {
      $('#top').show()
    }
    this.stateMachine.onleavetop = () => {
      $('#top').hide() 
    }
    $('.with-webcam').click(() => this.stateMachine.start(true))
    $('.without-webcam').click(() => this.stateMachine.start(false))
  }

}
