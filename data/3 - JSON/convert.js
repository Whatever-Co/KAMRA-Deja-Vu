var fs = require('fs')
var zlib = require('zlib')
var msgpack = require('msgpack')


var path = []
var vertices = []
function traverse(obj, margin) {
  for (var key in obj) {
    path.push(key)
    var value = obj[key]
    if (Array.isArray(value) && typeof(value[0]) == 'number') {
      obj[key] = normalizeToUInt16(value)
      vertices.push.apply(vertices, obj[key].values)
      console.log(path.join('.'), obj[key].min, obj[key].max, obj[key].values.length)
    } else if (typeof(value) == 'object') {
      traverse(value, margin + '    ')
    }
    path.pop()
  }
}


function mapToShort(v, imin, imax) {
  return Math.round((v - imin) / (imax - imin) * 0xffff)
}


function normalizeToUInt16(values) {
  var min = Number.MAX_VALUE
  var max = Number.MIN_VALUE
  for (var i = 0; i < values.length; i++) {
    var v = values[i]
    if (v < min) min = v
    if (v > max) max = v
  }
  return {
    min: min,
    max: max,
    values: values.map((v) => mapToShort(v, min, max))
  }
}


console.time('load')
var data = JSON.parse(zlib.gunzipSync(fs.readFileSync('keyframes.json.gz')))
console.timeEnd('load')

console.time('convert')
traverse(data, '')
console.timeEnd('convert')
console.log({total: vertices.length})

console.time('write bin')
var buffer = new Buffer(vertices.length * 2)
for (var i = 0; i < vertices.length; i++) {
  buffer.writeUInt16LE(vertices[i], i * 2)
}
// fs.writeFileSync('out/keyframes.bin', buffer)
fs.writeFileSync('out/keyframes.bin.gz', zlib.gzipSync(buffer, {level: zlib.Z_BEST_COMPRESSION}))
console.timeEnd('write bin')

console.time('write msgpack')
var packed = msgpack.pack(data)
// fs.writeFileSync('out/keyframes.pack', packed)
fs.writeFileSync('out/keyframes.pack.gz', zlib.gzipSync(packed, {level: zlib.Z_BEST_COMPRESSION}))
console.timeEnd('write msgpack')
