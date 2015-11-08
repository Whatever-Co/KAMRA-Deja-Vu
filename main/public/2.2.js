webpackJsonp([2,3],{

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vYXNzZXQtbG9hZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSUEsS0FBSSxNQUFNLEdBQUcsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFOztBQUNyQyxPQUFNLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFDcEMsS0FBSSxHQUFHLEdBQUcsaUJBQU8sUUFBUSxHQUFHLE1BQU0sR0FBRyxFQUFFO0FBQ3ZDLE9BQU0sQ0FBQyxZQUFZLENBQUMsQ0FDbEIsRUFBQyxHQUFHLHFCQUFtQixHQUFHLFFBQUssRUFBQyxFQUNoQyxFQUFDLEdBQUcsRUFBRSwwQkFBMEIsRUFBQyxFQUNqQyxFQUFDLEdBQUcsaUJBQWUsR0FBRyxRQUFLLEVBQUMsRUFDNUIsRUFBQyxFQUFFLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxxQkFBcUIsRUFBQyxFQUM3QyxFQUFDLEVBQUUsRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLGVBQWUsRUFBQyxFQUN4QyxFQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUMsQ0FDaEIsRUFBRSxLQUFLLENBQUM7O21CQUVNLE1BQU0sQyIsImZpbGUiOiIyLjIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgY3JlYXRlanMgKi9cblxuaW1wb3J0IENvbmZpZyBmcm9tICcuL2NvbmZpZydcblxubGV0IGxvYWRlciA9IG5ldyBjcmVhdGVqcy5Mb2FkUXVldWUoKVxubG9hZGVyLmluc3RhbGxQbHVnaW4oY3JlYXRlanMuU291bmQpXG5sZXQgbWluID0gQ29uZmlnLkRFVl9NT0RFID8gJy5taW4nIDogJydcbmxvYWRlci5sb2FkTWFuaWZlc3QoW1xuICB7c3JjOiBgbGlicy9jbG10cmFja3Ike21pbn0uanNgfSxcbiAge3NyYzogJ2xpYnMvbW9kZWxfcGNhXzIwX3N2bS5qcyd9LFxuICB7c3JjOiBgbGlicy90aHJlZSR7bWlufS5qc2B9LFxuICB7aWQ6ICdrZXlmcmFtZXMnLCBzcmM6ICdkYXRhL2tleWZyYW1lcy5qc29uJ30sXG4gIHtpZDogJ211c2ljLW1haW4nLCBzcmM6ICdkYXRhL21haW4ubXAzJ30sXG4gIHtzcmM6ICdhcHAuanMnfVxuXSwgZmFsc2UpXG5cbmV4cG9ydCBkZWZhdWx0IGxvYWRlclxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogYXNzZXQtbG9hZGVyLmpzXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==