var express = require('express')
var formidable = require('formidable')
var util = require('util')
var fs = require('fs')
var path = require('path')

var app = express()


app.post('/save', function(req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    res.header('Access-Control-Allow-Origin', '*')
    res.send({url: 'hogehoge'})
    console.log(util.inspect({fields: fields, files: files}))
    fs.rename(files.image2.path, path.join(__dirname, 'uploads/image.jpg'))
    fs.writeFile(path.join(__dirname, 'uploads/data.json'), fields.data)
  });
})

var server = app.listen(3008, function () {
  console.log(server.address())
})
