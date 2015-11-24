
const DEV = (process.env.NODE_ENV == 'development')

let click = (query, action) => {
  let elements = document.querySelectorAll(query)
  Array.from(elements).forEach((element) => {
    element.addEventListener('click', (e)=> {
      if(DEV) {
        console.log('GA send ' + action)
      }
      if (ga) {
        ga('send', 'event', 'button', 'click', action)
      }
    })
  })
}

let clickEvents = (config) => {
  for (let key in config) {
    click(key, config[key])
  }
}

let sendEvent = (name) => {
  if(DEV) {
    console.log('GA send event ' + name)
  }
  ga('send', 'event', 'event', name)
}

export default {clickEvents, sendEvent}
