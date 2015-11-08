/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _assetLoader = __webpack_require__(30);
	
	var _assetLoader2 = _interopRequireDefault(_assetLoader);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	_assetLoader2.default.on('progress', function (event) {
	  console.log(Math.round(event.progress / event.total * 100));
	});
	_assetLoader2.default.load();
	
	window.__djv_loader = _assetLoader2.default;

/***/ },

/***/ 8:
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	/* global process */
	
	exports.default = {
	  DEV_MODE: ("development") == 'development',
	  RENDER_WIDTH: 1920,
	  RENDER_HEIGHT: 1080
	};

/***/ },

/***/ 30:
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

/******/ });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMWUyMTU2YjQ1Njg1MzlmZTc1N2YiLCJ3ZWJwYWNrOi8vL2Jvb3RzdHJhcC5qcyIsIndlYnBhY2s6Ly8vY29uZmlnLmpzIiwid2VicGFjazovLy9hc3NldC1sb2FkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUNwQ0EsdUJBQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxVQUFDLEtBQUssRUFBSztBQUMvQixVQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUUsS0FBSyxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFJLEdBQUcsQ0FBQyxDQUFDO0VBQzlELENBQUM7QUFDRix1QkFBTyxJQUFJLEVBQUU7O0FBRWIsT0FBTSxDQUFDLFlBQVksd0JBQVMsQzs7Ozs7Ozs7Ozs7Ozs7bUJDTGI7QUFDYixXQUFRLEVBQUUsZUFBb0IsSUFBSSxhQUFhO0FBQy9DLGVBQVksRUFBRSxJQUFJO0FBQ2xCLGdCQUFhLEVBQUUsSUFBSTtFQUNwQixDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDRkQsS0FBSSxNQUFNLEdBQUcsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFOztBQUNyQyxPQUFNLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFDcEMsS0FBSSxHQUFHLEdBQUcsaUJBQU8sUUFBUSxHQUFHLE1BQU0sR0FBRyxFQUFFO0FBQ3ZDLE9BQU0sQ0FBQyxZQUFZLENBQUMsQ0FDbEIsRUFBQyxHQUFHLHFCQUFtQixHQUFHLFFBQUssRUFBQyxFQUNoQyxFQUFDLEdBQUcsRUFBRSwwQkFBMEIsRUFBQyxFQUNqQyxFQUFDLEdBQUcsaUJBQWUsR0FBRyxRQUFLLEVBQUMsRUFDNUIsRUFBQyxFQUFFLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxxQkFBcUIsRUFBQyxFQUM3QyxFQUFDLEVBQUUsRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLGVBQWUsRUFBQyxFQUN4QyxFQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUMsQ0FDaEIsRUFBRSxLQUFLLENBQUM7O21CQUVNLE1BQU0sQyIsImZpbGUiOiJib290c3RyYXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIDFlMjE1NmI0NTY4NTM5ZmU3NTdmXG4gKiovIiwiaW1wb3J0IGxvYWRlciBmcm9tICcuL2Fzc2V0LWxvYWRlcidcblxubG9hZGVyLm9uKCdwcm9ncmVzcycsIChldmVudCkgPT4ge1xuICBjb25zb2xlLmxvZyhNYXRoLnJvdW5kKChldmVudC5wcm9ncmVzcyAvIGV2ZW50LnRvdGFsKSAqIDEwMCkpXG59KVxubG9hZGVyLmxvYWQoKVxuXG53aW5kb3cuX19kanZfbG9hZGVyID0gbG9hZGVyXG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiBib290c3RyYXAuanNcbiAqKi8iLCIvKiBnbG9iYWwgcHJvY2VzcyAqL1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIERFVl9NT0RFOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PSAnZGV2ZWxvcG1lbnQnLFxuICBSRU5ERVJfV0lEVEg6IDE5MjAsXG4gIFJFTkRFUl9IRUlHSFQ6IDEwODBcbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIGNvbmZpZy5qc1xuICoqLyIsIi8qIGdsb2JhbCBjcmVhdGVqcyAqL1xuXG5pbXBvcnQgQ29uZmlnIGZyb20gJy4vY29uZmlnJ1xuXG5sZXQgbG9hZGVyID0gbmV3IGNyZWF0ZWpzLkxvYWRRdWV1ZSgpXG5sb2FkZXIuaW5zdGFsbFBsdWdpbihjcmVhdGVqcy5Tb3VuZClcbmxldCBtaW4gPSBDb25maWcuREVWX01PREUgPyAnLm1pbicgOiAnJ1xubG9hZGVyLmxvYWRNYW5pZmVzdChbXG4gIHtzcmM6IGBsaWJzL2NsbXRyYWNrciR7bWlufS5qc2B9LFxuICB7c3JjOiAnbGlicy9tb2RlbF9wY2FfMjBfc3ZtLmpzJ30sXG4gIHtzcmM6IGBsaWJzL3RocmVlJHttaW59LmpzYH0sXG4gIHtpZDogJ2tleWZyYW1lcycsIHNyYzogJ2RhdGEva2V5ZnJhbWVzLmpzb24nfSxcbiAge2lkOiAnbXVzaWMtbWFpbicsIHNyYzogJ2RhdGEvbWFpbi5tcDMnfSxcbiAge3NyYzogJ2FwcC5qcyd9XG5dLCBmYWxzZSlcblxuZXhwb3J0IGRlZmF1bHQgbG9hZGVyXG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiBhc3NldC1sb2FkZXIuanNcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9