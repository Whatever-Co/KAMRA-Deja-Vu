webpackJsonp([1,4],{

/***/ 29:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _config = __webpack_require__(8);
	
	var _config2 = _interopRequireDefault(_config);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var loader = new createjs.LoadQueue(); /* global createjs */
	
	loader.installPlugin(createjs.Sound);
	var min = _config2.default.DEV_MODE ? '.min' : '';
	loader.loadManifest([{ src: 'libs/clmtrackr' + min + '.js' }, { src: 'libs/model_pca_20_svm.js' }, { src: 'libs/three' + min + '.js' }, { id: 'keyframes', src: 'data/keyframes.json' }, { id: 'music-main', src: 'data/main.mp3' }, { src: 'app.js' }], false);
	
	exports.default = loader;

/***/ }

});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vYXNzZXQtbG9hZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSUEsS0FBSSxNQUFNLEdBQUcsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFOztBQUNyQyxPQUFNLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFDcEMsS0FBSSxHQUFHLEdBQUcsaUJBQU8sUUFBUSxHQUFHLE1BQU0sR0FBRyxFQUFFO0FBQ3ZDLE9BQU0sQ0FBQyxZQUFZLENBQUMsQ0FDbEIsRUFBQyxHQUFHLHFCQUFtQixHQUFHLFFBQUssRUFBQyxFQUNoQyxFQUFDLEdBQUcsRUFBRSwwQkFBMEIsRUFBQyxFQUNqQyxFQUFDLEdBQUcsaUJBQWUsR0FBRyxRQUFLLEVBQUMsRUFDNUIsRUFBQyxFQUFFLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxxQkFBcUIsRUFBQyxFQUM3QyxFQUFDLEVBQUUsRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLGVBQWUsRUFBQyxFQUN4QyxFQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUMsQ0FDZCxFQUFFLEtBQUssQ0FBQzs7bUJBRUksTUFBTSxDIiwiZmlsZSI6IjEuMS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBjcmVhdGVqcyAqL1xuXG5pbXBvcnQgQ29uZmlnIGZyb20gJy4vY29uZmlnJ1xuXG5sZXQgbG9hZGVyID0gbmV3IGNyZWF0ZWpzLkxvYWRRdWV1ZSgpXG5sb2FkZXIuaW5zdGFsbFBsdWdpbihjcmVhdGVqcy5Tb3VuZClcbmxldCBtaW4gPSBDb25maWcuREVWX01PREUgPyAnLm1pbicgOiAnJ1xubG9hZGVyLmxvYWRNYW5pZmVzdChbXG4gIHtzcmM6IGBsaWJzL2NsbXRyYWNrciR7bWlufS5qc2B9LFxuICB7c3JjOiAnbGlicy9tb2RlbF9wY2FfMjBfc3ZtLmpzJ30sXG4gIHtzcmM6IGBsaWJzL3RocmVlJHttaW59LmpzYH0sXG4gIHtpZDogJ2tleWZyYW1lcycsIHNyYzogJ2RhdGEva2V5ZnJhbWVzLmpzb24nfSxcbiAge2lkOiAnbXVzaWMtbWFpbicsIHNyYzogJ2RhdGEvbWFpbi5tcDMnfSxcbiAge3NyYzogJ2FwcC5qcyd9XG4gIF0sIGZhbHNlKVxuXG5leHBvcnQgZGVmYXVsdCBsb2FkZXJcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIGFzc2V0LWxvYWRlci5qc1xuICoqLyJdLCJzb3VyY2VSb290IjoiIn0=