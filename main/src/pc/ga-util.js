
const DEV = (process.env.NODE_ENV == 'development')

let click = (query, action) => {
  let elements = document.querySelectorAll(query)
  let len = elements.length

  for (let i=0; i<len; ++i) {
    elements[i].addEventListener('click', (e)=> {
      if (ga) {
        if(DEV) {
          console.log('GA send click: ' + action)
        }
        ga('send', 'event', 'click', action)
      }
    })
  }
}

let clickEvents = (config) => {
  for (let key in config) {
    click(key, config[key])
  }
}

let sendEvent = (name) => {
  if(DEV) {
    console.log('GA send event: ' + name)
  }
  ga('send', 'event', 'event', name)
}

let pageView = (name) => {
  if(DEV) {
    console.log('GA send pageview: ' + name)
  }
  ga('send', 'pageview', name)
}

export default {clickEvents, sendEvent, pageView}
