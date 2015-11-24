
const DEV = (process.env.NODE_ENV == 'development')

let tracking = (query, action) => {
  let elements = document.querySelectorAll(query)
  Array.from(elements).forEach((element) => {
    element.addEventListener('click', (e)=> {
      if (ga) {
        if(DEV) {
          console.log('send ' + action)
        }
        ga('send', 'event', 'click', action)
      }
    })
  })
}

export default function main(config) {
  for (let key in config) {
    tracking(key, config[key])
  }
}
