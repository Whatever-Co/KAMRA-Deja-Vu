
const DEV = (process.env.NODE_ENV == 'development')

let click = (query, action) => {
  let elements = document.querySelectorAll(query)
  let len = elements.length

  for (let i=0; i<len; ++i) {
    elements[i].addEventListener('click', (e)=> {
      if (ga) {
        if(DEV) {
          console.log('send ' + action)
        }
        ga('send', 'event', 'click', action)
      }
    })
  }
}

export default function main(config) {
  for (let key in config) {
    click(key, config[key])
  }
}
