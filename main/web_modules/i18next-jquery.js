// Local shim for i18next-jquery@0.0.2, which was unpublished from npm (Dec 2015).
// Implements the subset used by page-manager.js / sp/main.js:
//   $.t / $.i18n registration and $(sel).localize() over data-i18n attributes
//   with `[html]key`, `[attr]key` and plain `key` forms (`;`-separated).
module.exports = function (i18n, $, options) {
  options = options || {}
  var tName = options.tName || 't'
  var i18nName = options.i18nName || 'i18n'
  var handleName = options.handleName || 'localize'
  var selectorAttr = options.selectorAttr || 'data-i18n'
  var targetAttr = options.targetAttr || 'data-i18n-target'
  var parseDefaultValueFromContent = options.parseDefaultValueFromContent !== false

  $[tName] = function () { return i18n.t.apply(i18n, arguments) }
  $[i18nName] = i18n

  function parseKey(elem, key) {
    var attr = 'text'
    if (key.charAt(0) === '[') {
      var parts = key.split(']')
      attr = parts[0].substr(1)
      key = parts[1]
    }
    if (!key) return
    var opts = {}
    if (parseDefaultValueFromContent) {
      opts.defaultValue = attr === 'html' ? elem.html() : (attr === 'text' ? elem.text() : elem.attr(attr))
    }
    var content = i18n.t(key, opts)
    if (attr === 'html') elem.html(content)
    else if (attr === 'text') elem.text(content)
    else if (attr === 'prepend') elem.prepend(content)
    else if (attr === 'append') elem.append(content)
    else elem.attr(attr, content)
  }

  function localizeElement(elem) {
    var key = elem.attr(selectorAttr)
    if (!key) return
    var target = elem
    var targetSelector = elem.attr(targetAttr)
    if (targetSelector) target = elem.find(targetSelector)
    var keys = key.split(';')
    for (var i = 0; i < keys.length; i++) {
      if (keys[i]) parseKey(target, keys[i])
    }
  }

  $.fn[handleName] = function () {
    return this.each(function () {
      var elem = $(this)
      localizeElement(elem)
      elem.find('[' + selectorAttr + ']').each(function () {
        localizeElement($(this))
      })
    })
  }
}
