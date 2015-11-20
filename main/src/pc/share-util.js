import qs from 'querystring'

let openCenteringWindow = (href, name, width = 550, height = 420) => {
  const winHeight = screen.height
  const winWidth = screen.width
  let left = Math.round((winWidth / 2) - (width / 2))
  let top = winHeight > height ? Math.round((winHeight / 2) - (height / 2)) : 0
  let options = `scrollbars=yes,resizable=yes,toolbar=no,location=yes,width=${width},height=${height},left=${left},top=${top}`
  window.open(href, name, options)
}

let twitter = (params) => {
  openCenteringWindow(`https://twitter.com/intent/tweet?${qs.stringify(params)}`, 'intent')
}

let facebook = (params) => {
  params.display = 'popup'
  openCenteringWindow(`https://www.facebook.com/dialog/share?${qs.stringify(params)}`, 'fbshare')
}

export default {twitter, facebook}
