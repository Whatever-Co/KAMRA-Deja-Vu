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
      console.log('hello3')
    })
  }
}

new App()