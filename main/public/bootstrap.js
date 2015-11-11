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
	
	var _assetLoader = __webpack_require__(31);
	
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

/***/ 31:
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMzAwZDQwMjBiZjEzYTEwY2RiMTU/ZmU4NCIsIndlYnBhY2s6Ly8vLi9zcmMvcGMvYm9vdHN0cmFwLmpzIiwid2VicGFjazovLy8uL3NyYy9wYy9jb25maWcuanM/Y2RjYyIsIndlYnBhY2s6Ly8vLi9zcmMvcGMvYXNzZXQtbG9hZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDcENBLHVCQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsVUFBQyxLQUFLLEVBQUs7QUFDL0IsVUFBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFFLEtBQUssQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBSSxHQUFHLENBQUMsQ0FBQztFQUM5RCxDQUFDO0FBQ0YsdUJBQU8sSUFBSSxFQUFFOztBQUViLE9BQU0sQ0FBQyxZQUFZLHdCQUFTLEM7Ozs7Ozs7Ozs7Ozs7O21CQ0xiO0FBQ2IsV0FBUSxFQUFFLGVBQW9CLElBQUksYUFBYTtBQUMvQyxlQUFZLEVBQUUsSUFBSTtBQUNsQixnQkFBYSxFQUFFLElBQUk7RUFDcEIsQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0ZELEtBQUksTUFBTSxHQUFHLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRTs7QUFDckMsT0FBTSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO0FBQ3BDLEtBQUksR0FBRyxHQUFHLGlCQUFPLFFBQVEsR0FBRyxNQUFNLEdBQUcsRUFBRTtBQUN2QyxPQUFNLENBQUMsWUFBWSxDQUFDLENBQ2xCLEVBQUMsR0FBRyxxQkFBbUIsR0FBRyxRQUFLLEVBQUMsRUFDaEMsRUFBQyxHQUFHLEVBQUUsMEJBQTBCLEVBQUMsRUFDakMsRUFBQyxHQUFHLGlCQUFlLEdBQUcsUUFBSyxFQUFDLEVBQzVCLEVBQUMsRUFBRSxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUscUJBQXFCLEVBQUMsRUFDN0MsRUFBQyxFQUFFLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxlQUFlLEVBQUMsRUFDeEMsRUFBQyxHQUFHLEVBQUUsUUFBUSxFQUFDLENBQ2hCLEVBQUUsS0FBSyxDQUFDOzttQkFFTSxNQUFNLEMiLCJmaWxlIjoiYm9vdHN0cmFwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL2Jvb3RzdHJhcCAzMDBkNDAyMGJmMTNhMTBjZGIxNVxuICoqLyIsImltcG9ydCBsb2FkZXIgZnJvbSAnLi9hc3NldC1sb2FkZXInXG5cbmxvYWRlci5vbigncHJvZ3Jlc3MnLCAoZXZlbnQpID0+IHtcbiAgY29uc29sZS5sb2coTWF0aC5yb3VuZCgoZXZlbnQucHJvZ3Jlc3MgLyBldmVudC50b3RhbCkgKiAxMDApKVxufSlcbmxvYWRlci5sb2FkKClcblxud2luZG93Ll9fZGp2X2xvYWRlciA9IGxvYWRlclxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcGMvYm9vdHN0cmFwLmpzXG4gKiovIiwiLyogZ2xvYmFsIHByb2Nlc3MgKi9cblxuZXhwb3J0IGRlZmF1bHQge1xuICBERVZfTU9ERTogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT0gJ2RldmVsb3BtZW50JyxcbiAgUkVOREVSX1dJRFRIOiAxOTIwLFxuICBSRU5ERVJfSEVJR0hUOiAxMDgwXG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9wYy9jb25maWcuanNcbiAqKi8iLCIvKiBnbG9iYWwgY3JlYXRlanMgKi9cblxuaW1wb3J0IENvbmZpZyBmcm9tICcuL2NvbmZpZydcblxubGV0IGxvYWRlciA9IG5ldyBjcmVhdGVqcy5Mb2FkUXVldWUoKVxubG9hZGVyLmluc3RhbGxQbHVnaW4oY3JlYXRlanMuU291bmQpXG5sZXQgbWluID0gQ29uZmlnLkRFVl9NT0RFID8gJy5taW4nIDogJydcbmxvYWRlci5sb2FkTWFuaWZlc3QoW1xuICB7c3JjOiBgbGlicy9jbG10cmFja3Ike21pbn0uanNgfSxcbiAge3NyYzogJ2xpYnMvbW9kZWxfcGNhXzIwX3N2bS5qcyd9LFxuICB7c3JjOiBgbGlicy90aHJlZSR7bWlufS5qc2B9LFxuICB7aWQ6ICdrZXlmcmFtZXMnLCBzcmM6ICdkYXRhL2tleWZyYW1lcy5qc29uJ30sXG4gIHtpZDogJ211c2ljLW1haW4nLCBzcmM6ICdkYXRhL21haW4ubXAzJ30sXG4gIHtzcmM6ICdhcHAuanMnfVxuXSwgZmFsc2UpXG5cbmV4cG9ydCBkZWZhdWx0IGxvYWRlclxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcGMvYXNzZXQtbG9hZGVyLmpzXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==