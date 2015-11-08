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

});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vY29uZmlnLmpzP2UyMmIiLCJ3ZWJwYWNrOi8vL2Fzc2V0LWxvYWRlci5qcz82N2UxIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OzttQkFFZTtBQUNiLFdBQVEsRUFBRSxlQUFvQixJQUFJLGFBQWE7QUFDL0MsZUFBWSxFQUFFLElBQUk7QUFDbEIsZ0JBQWEsRUFBRSxJQUFJO0VBQ3BCLEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNGRCxLQUFJLE1BQU0sR0FBRyxJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUU7O0FBQ3JDLE9BQU0sQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztBQUNwQyxLQUFJLEdBQUcsR0FBRyxpQkFBTyxRQUFRLEdBQUcsTUFBTSxHQUFHLEVBQUU7QUFDdkMsT0FBTSxDQUFDLFlBQVksQ0FBQyxDQUNsQixFQUFDLEdBQUcscUJBQW1CLEdBQUcsUUFBSyxFQUFDLEVBQ2hDLEVBQUMsR0FBRyxFQUFFLDBCQUEwQixFQUFDLEVBQ2pDLEVBQUMsR0FBRyxpQkFBZSxHQUFHLFFBQUssRUFBQyxFQUM1QixFQUFDLEVBQUUsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLHFCQUFxQixFQUFDLEVBQzdDLEVBQUMsRUFBRSxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsZUFBZSxFQUFDLEVBQ3hDLEVBQUMsR0FBRyxFQUFFLFFBQVEsRUFBQyxDQUNoQixFQUFFLEtBQUssQ0FBQzs7bUJBRU0sTUFBTSxDIiwiZmlsZSI6IjMuMy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBwcm9jZXNzICovXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgREVWX01PREU6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09ICdkZXZlbG9wbWVudCcsXG4gIFJFTkRFUl9XSURUSDogMTkyMCxcbiAgUkVOREVSX0hFSUdIVDogMTA4MFxufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogY29uZmlnLmpzXG4gKiovIiwiLyogZ2xvYmFsIGNyZWF0ZWpzICovXG5cbmltcG9ydCBDb25maWcgZnJvbSAnLi9jb25maWcnXG5cbmxldCBsb2FkZXIgPSBuZXcgY3JlYXRlanMuTG9hZFF1ZXVlKClcbmxvYWRlci5pbnN0YWxsUGx1Z2luKGNyZWF0ZWpzLlNvdW5kKVxubGV0IG1pbiA9IENvbmZpZy5ERVZfTU9ERSA/ICcubWluJyA6ICcnXG5sb2FkZXIubG9hZE1hbmlmZXN0KFtcbiAge3NyYzogYGxpYnMvY2xtdHJhY2tyJHttaW59LmpzYH0sXG4gIHtzcmM6ICdsaWJzL21vZGVsX3BjYV8yMF9zdm0uanMnfSxcbiAge3NyYzogYGxpYnMvdGhyZWUke21pbn0uanNgfSxcbiAge2lkOiAna2V5ZnJhbWVzJywgc3JjOiAnZGF0YS9rZXlmcmFtZXMuanNvbid9LFxuICB7aWQ6ICdtdXNpYy1tYWluJywgc3JjOiAnZGF0YS9tYWluLm1wMyd9LFxuICB7c3JjOiAnYXBwLmpzJ31cbl0sIGZhbHNlKVxuXG5leHBvcnQgZGVmYXVsdCBsb2FkZXJcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIGFzc2V0LWxvYWRlci5qc1xuICoqLyJdLCJzb3VyY2VSb290IjoiIn0=