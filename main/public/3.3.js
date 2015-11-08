webpackJsonp([3,1,4],{

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vY29uZmlnLmpzP2UyMmIiLCJ3ZWJwYWNrOi8vL2Fzc2V0LWxvYWRlci5qcz82N2UxIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OzttQkFFZTtBQUNiLFdBQVEsRUFBRSxlQUFvQixJQUFJLGFBQWE7QUFDL0MsZUFBWSxFQUFFLElBQUk7QUFDbEIsZ0JBQWEsRUFBRSxJQUFJO0VBQ3BCLEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNGRCxLQUFJLE1BQU0sR0FBRyxJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUU7O0FBQ3JDLE9BQU0sQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztBQUNwQyxLQUFJLEdBQUcsR0FBRyxpQkFBTyxRQUFRLEdBQUcsTUFBTSxHQUFHLEVBQUU7QUFDdkMsT0FBTSxDQUFDLFlBQVksQ0FBQyxDQUNsQixFQUFDLEdBQUcscUJBQW1CLEdBQUcsUUFBSyxFQUFDLEVBQ2hDLEVBQUMsR0FBRyxFQUFFLDBCQUEwQixFQUFDLEVBQ2pDLEVBQUMsR0FBRyxpQkFBZSxHQUFHLFFBQUssRUFBQyxFQUM1QixFQUFDLEVBQUUsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLHFCQUFxQixFQUFDLEVBQzdDLEVBQUMsRUFBRSxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsZUFBZSxFQUFDLEVBQ3hDLEVBQUMsR0FBRyxFQUFFLFFBQVEsRUFBQyxDQUNkLEVBQUUsS0FBSyxDQUFDOzttQkFFSSxNQUFNLEMiLCJmaWxlIjoiMy4zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFsIHByb2Nlc3MgKi9cblxuZXhwb3J0IGRlZmF1bHQge1xuICBERVZfTU9ERTogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT0gJ2RldmVsb3BtZW50JyxcbiAgUkVOREVSX1dJRFRIOiAxOTIwLFxuICBSRU5ERVJfSEVJR0hUOiAxMDgwXG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiBjb25maWcuanNcbiAqKi8iLCIvKiBnbG9iYWwgY3JlYXRlanMgKi9cblxuaW1wb3J0IENvbmZpZyBmcm9tICcuL2NvbmZpZydcblxubGV0IGxvYWRlciA9IG5ldyBjcmVhdGVqcy5Mb2FkUXVldWUoKVxubG9hZGVyLmluc3RhbGxQbHVnaW4oY3JlYXRlanMuU291bmQpXG5sZXQgbWluID0gQ29uZmlnLkRFVl9NT0RFID8gJy5taW4nIDogJydcbmxvYWRlci5sb2FkTWFuaWZlc3QoW1xuICB7c3JjOiBgbGlicy9jbG10cmFja3Ike21pbn0uanNgfSxcbiAge3NyYzogJ2xpYnMvbW9kZWxfcGNhXzIwX3N2bS5qcyd9LFxuICB7c3JjOiBgbGlicy90aHJlZSR7bWlufS5qc2B9LFxuICB7aWQ6ICdrZXlmcmFtZXMnLCBzcmM6ICdkYXRhL2tleWZyYW1lcy5qc29uJ30sXG4gIHtpZDogJ211c2ljLW1haW4nLCBzcmM6ICdkYXRhL21haW4ubXAzJ30sXG4gIHtzcmM6ICdhcHAuanMnfVxuICBdLCBmYWxzZSlcblxuZXhwb3J0IGRlZmF1bHQgbG9hZGVyXG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiBhc3NldC1sb2FkZXIuanNcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9