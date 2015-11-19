var express = require('express')
var gzipStatic = require('connect-gzip-static')
var proxy = require('express-http-proxy')
var url = require('url')

var app = express()
app.use(gzipStatic(__dirname + '/public'))
app.use(express.static(__dirname + '/public'))
app.use(/\/api\/.*|\/[a-z0-9]{8}\/.+\.(jpg|json)/, proxy('https://kamra.invisi-dir.com', {
  forwardPath: function(req, res) {
    return req.originalUrl
  }
}))

app.get(/^\/[a-z0-9]{8}\/$/, function (req, res) {
  res.sendFile(__dirname + '/public/index.html')
})

var server = app.listen(4000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Dev server app listening at http://%s:%s', host, port)
})
