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
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _delaunayFast = __webpack_require__(1);
	
	var _delaunayFast2 = _interopRequireDefault(_delaunayFast);
	
	var _spatialhash = __webpack_require__(2);
	
	var _standardFaceData = __webpack_require__(3);
	
	var _standardFaceData2 = _interopRequireDefault(_standardFaceData);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	self.THREE = {};
	importScripts('libs/three.min.js');
	// http://zufallsgenerator.github.io/assets/code/2014-01-26/spatialhash/spatialhash.js
	
	var convertData = function convertData(vertices) {
	  var standardFace = new _standardFaceData2.default();
	
	  var standardFacePoints = [];
	  var position = standardFace.data.face.position;
	  for (var i = 0; i < position.length; i += 3) {
	    standardFacePoints.push([position[i], position[i + 1]]);
	  }
	  standardFacePoints.push([1, 1]);
	  standardFacePoints.push([1, -1]);
	  standardFacePoints.push([-1, -1]);
	  standardFacePoints.push([-1, 1]);
	
	  var triangleIndices = _delaunayFast2.default.triangulate(standardFacePoints);
	
	  var spatialHash = new _spatialhash.SpatialHash(5);
	  var scale = 1000;
	  for (var i = 0; i < triangleIndices.length; i += 3) {
	    var v0 = standardFacePoints[triangleIndices[i]];
	    var v1 = standardFacePoints[triangleIndices[i + 1]];
	    var v2 = standardFacePoints[triangleIndices[i + 2]];
	    var minX = Math.min(v0[0], v1[0], v2[0]);
	    var minY = Math.min(v0[1], v1[1], v2[1]);
	    var maxX = Math.max(v0[0], v1[0], v2[0]);
	    var maxY = Math.max(v0[1], v1[1], v2[1]);
	    spatialHash.insert({
	      x: minX * scale,
	      y: minY * scale,
	      width: (maxX - minX) * scale,
	      height: (maxY - minY) * scale,
	      index: i,
	      v0: v0,
	      v1: v1,
	      v2: v2
	    });
	  }
	
	  var contains = function contains(v0, v1, v2, x, y) {
	    var a = v1[0] - v0[0];
	    var b = v2[0] - v0[0];
	    var c = v1[1] - v0[1];
	    var d = v2[1] - v0[1];
	    var i = a * d - b * c;
	
	    /* Degenerate tri. */
	    if (i === 0.0) {
	      return null;
	    }
	
	    var u = (d * (x - v0[0]) - b * (y - v0[1])) / i;
	    var v = (a * (y - v0[1]) - c * (x - v0[0])) / i;
	
	    /* If we're outside the tri, fail. */
	    if (u < 0.0 || v < 0.0 || u + v > 1.0) {
	      return null;
	    }
	
	    return [1 - u - v, u, v];
	  };
	
	  var index = undefined;
	  var coord = undefined;
	  var getTriangleIndex = function getTriangleIndex(x, y) {
	    var candidate = spatialHash.retrieve({ x: x * scale, y: y * scale, width: 0, height: 0 });
	    for (var i = 0; i < candidate.length; i++) {
	      var node = candidate[i];
	      var uv = contains(node.v0, node.v1, node.v2, x, y);
	      if (uv) {
	        index = node.index;
	        coord = uv;
	        return;
	      }
	    }
	    console.warn('triangle not found');
	    index = 0;
	    coord = [0, 0, 0];
	  };
	
	  return vertices.map(function (vertices) {
	    if (!vertices) {
	      return null;
	    }
	
	    var weights = new Float32Array(vertices.length * 7);
	    for (var i = 0, j = 0; i < vertices.length; i += 3, j += 7) {
	      getTriangleIndex(vertices[i], vertices[i + 1]);
	      weights[j + 0] = triangleIndices[index + 0];
	      weights[j + 1] = triangleIndices[index + 1];
	      weights[j + 2] = triangleIndices[index + 2];
	      weights[j + 3] = coord[0];
	      weights[j + 4] = coord[1];
	      weights[j + 5] = coord[2];
	      weights[j + 6] = vertices[i + 2];
	    }
	    return weights;
	  });
	};
	
	onmessage = function (event) {
	  // console.log('start', performance.now())
	  var transferList = [];
	  var result = event.data.map(function (vertices) {
	    var v = convertData(vertices);
	    v.forEach(function (a) {
	      if (a) {
	        transferList.push(a.buffer);
	      }
	    });
	    return v;
	  });
	  // console.log('done', performance.now())
	  postMessage(result, transferList);
	};

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var Delaunay;
	
	(function() {
	  "use strict";
	
	  var EPSILON = 1.0 / 1048576.0;
	
	  function supertriangle(vertices) {
	    var xmin = Number.POSITIVE_INFINITY,
	        ymin = Number.POSITIVE_INFINITY,
	        xmax = Number.NEGATIVE_INFINITY,
	        ymax = Number.NEGATIVE_INFINITY,
	        i, dx, dy, dmax, xmid, ymid;
	
	    for(i = vertices.length; i--; ) {
	      if(vertices[i][0] < xmin) xmin = vertices[i][0];
	      if(vertices[i][0] > xmax) xmax = vertices[i][0];
	      if(vertices[i][1] < ymin) ymin = vertices[i][1];
	      if(vertices[i][1] > ymax) ymax = vertices[i][1];
	    }
	
	    dx = xmax - xmin;
	    dy = ymax - ymin;
	    dmax = Math.max(dx, dy);
	    xmid = xmin + dx * 0.5;
	    ymid = ymin + dy * 0.5;
	
	    return [
	      [xmid - 20 * dmax, ymid -      dmax],
	      [xmid            , ymid + 20 * dmax],
	      [xmid + 20 * dmax, ymid -      dmax]
	    ];
	  }
	
	  function circumcircle(vertices, i, j, k) {
	    var x1 = vertices[i][0],
	        y1 = vertices[i][1],
	        x2 = vertices[j][0],
	        y2 = vertices[j][1],
	        x3 = vertices[k][0],
	        y3 = vertices[k][1],
	        fabsy1y2 = Math.abs(y1 - y2),
	        fabsy2y3 = Math.abs(y2 - y3),
	        xc, yc, m1, m2, mx1, mx2, my1, my2, dx, dy;
	
	    /* Check for coincident points */
	    if(fabsy1y2 < EPSILON && fabsy2y3 < EPSILON)
	      throw new Error("Eek! Coincident points!");
	
	    if(fabsy1y2 < EPSILON) {
	      m2  = -((x3 - x2) / (y3 - y2));
	      mx2 = (x2 + x3) / 2.0;
	      my2 = (y2 + y3) / 2.0;
	      xc  = (x2 + x1) / 2.0;
	      yc  = m2 * (xc - mx2) + my2;
	    }
	
	    else if(fabsy2y3 < EPSILON) {
	      m1  = -((x2 - x1) / (y2 - y1));
	      mx1 = (x1 + x2) / 2.0;
	      my1 = (y1 + y2) / 2.0;
	      xc  = (x3 + x2) / 2.0;
	      yc  = m1 * (xc - mx1) + my1;
	    }
	
	    else {
	      m1  = -((x2 - x1) / (y2 - y1));
	      m2  = -((x3 - x2) / (y3 - y2));
	      mx1 = (x1 + x2) / 2.0;
	      mx2 = (x2 + x3) / 2.0;
	      my1 = (y1 + y2) / 2.0;
	      my2 = (y2 + y3) / 2.0;
	      xc  = (m1 * mx1 - m2 * mx2 + my2 - my1) / (m1 - m2);
	      yc  = (fabsy1y2 > fabsy2y3) ?
	        m1 * (xc - mx1) + my1 :
	        m2 * (xc - mx2) + my2;
	    }
	
	    dx = x2 - xc;
	    dy = y2 - yc;
	    return {i: i, j: j, k: k, x: xc, y: yc, r: dx * dx + dy * dy};
	  }
	
	  function dedup(edges) {
	    var i, j, a, b, m, n;
	
	    for(j = edges.length; j; ) {
	      b = edges[--j];
	      a = edges[--j];
	
	      for(i = j; i; ) {
	        n = edges[--i];
	        m = edges[--i];
	
	        if((a === m && b === n) || (a === n && b === m)) {
	          edges.splice(j, 2);
	          edges.splice(i, 2);
	          break;
	        }
	      }
	    }
	  }
	
	  Delaunay = {
	    triangulate: function(vertices, key) {
	      var n = vertices.length,
	          i, j, indices, st, open, closed, edges, dx, dy, a, b, c;
	
	      /* Bail if there aren't enough vertices to form any triangles. */
	      if(n < 3)
	        return [];
	
	      /* Slice out the actual vertices from the passed objects. (Duplicate the
	       * array even if we don't, though, since we need to make a supertriangle
	       * later on!) */
	      vertices = vertices.slice(0);
	
	      if(key)
	        for(i = n; i--; )
	          vertices[i] = vertices[i][key];
	
	      /* Make an array of indices into the vertex array, sorted by the
	       * vertices' x-position. */
	      indices = new Array(n);
	
	      for(i = n; i--; )
	        indices[i] = i;
	
	      indices.sort(function(i, j) {
	        return vertices[j][0] - vertices[i][0];
	      });
	
	      /* Next, find the vertices of the supertriangle (which contains all other
	       * triangles), and append them onto the end of a (copy of) the vertex
	       * array. */
	      st = supertriangle(vertices);
	      vertices.push(st[0], st[1], st[2]);
	      
	      /* Initialize the open list (containing the supertriangle and nothing
	       * else) and the closed list (which is empty since we havn't processed
	       * any triangles yet). */
	      open   = [circumcircle(vertices, n + 0, n + 1, n + 2)];
	      closed = [];
	      edges  = [];
	
	      /* Incrementally add each vertex to the mesh. */
	      for(i = indices.length; i--; edges.length = 0) {
	        c = indices[i];
	
	        /* For each open triangle, check to see if the current point is
	         * inside it's circumcircle. If it is, remove the triangle and add
	         * it's edges to an edge list. */
	        for(j = open.length; j--; ) {
	          /* If this point is to the right of this triangle's circumcircle,
	           * then this triangle should never get checked again. Remove it
	           * from the open list, add it to the closed list, and skip. */
	          dx = vertices[c][0] - open[j].x;
	          if(dx > 0.0 && dx * dx > open[j].r) {
	            closed.push(open[j]);
	            open.splice(j, 1);
	            continue;
	          }
	
	          /* If we're outside the circumcircle, skip this triangle. */
	          dy = vertices[c][1] - open[j].y;
	          if(dx * dx + dy * dy - open[j].r > EPSILON)
	            continue;
	
	          /* Remove the triangle and add it's edges to the edge list. */
	          edges.push(
	            open[j].i, open[j].j,
	            open[j].j, open[j].k,
	            open[j].k, open[j].i
	          );
	          open.splice(j, 1);
	        }
	
	        /* Remove any doubled edges. */
	        dedup(edges);
	
	        /* Add a new triangle for each edge. */
	        for(j = edges.length; j; ) {
	          b = edges[--j];
	          a = edges[--j];
	          open.push(circumcircle(vertices, a, b, c));
	        }
	      }
	
	      /* Copy any remaining open triangles to the closed list, and then
	       * remove any triangles that share a vertex with the supertriangle,
	       * building a list of triplets that represent triangles. */
	      for(i = open.length; i--; )
	        closed.push(open[i]);
	      open.length = 0;
	
	      for(i = closed.length; i--; )
	        if(closed[i].i < n && closed[i].j < n && closed[i].k < n)
	          open.push(closed[i].i, closed[i].j, closed[i].k);
	
	      /* Yay, we're done! */
	      return open;
	    },
	    contains: function(tri, p) {
	      /* Bounding box test first, for quick rejections. */
	      if((p[0] < tri[0][0] && p[0] < tri[1][0] && p[0] < tri[2][0]) ||
	         (p[0] > tri[0][0] && p[0] > tri[1][0] && p[0] > tri[2][0]) ||
	         (p[1] < tri[0][1] && p[1] < tri[1][1] && p[1] < tri[2][1]) ||
	         (p[1] > tri[0][1] && p[1] > tri[1][1] && p[1] > tri[2][1]))
	        return null;
	
	      var a = tri[1][0] - tri[0][0],
	          b = tri[2][0] - tri[0][0],
	          c = tri[1][1] - tri[0][1],
	          d = tri[2][1] - tri[0][1],
	          i = a * d - b * c;
	
	      /* Degenerate tri. */
	      if(i === 0.0)
	        return null;
	
	      var u = (d * (p[0] - tri[0][0]) - b * (p[1] - tri[0][1])) / i,
	          v = (a * (p[1] - tri[0][1]) - c * (p[0] - tri[0][0])) / i;
	
	      /* If we're outside the tri, fail. */
	      if(u < 0.0 || v < 0.0 || (u + v) > 1.0)
	        return null;
	
	      return [u, v];
	    }
	  };
	
	  if(true)
	    module.exports = Delaunay;
	})();


/***/ },
/* 2 */
/***/ function(module, exports) {

	/*
	
	The MIT License (MIT)
	
	Copyright (c) 2014 Christer Bystrom
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
	
	A spatial hash. For an explanation, see
	
	http://www.gamedev.net/page/resources/_/technical/game-programming/spatial-hashing-r2697
	
	For computational efficiency, the positions are bit-shifted n times. This means
	that they are divided by a factor of power of two. This factor is the
	only argument to the constructor.
	
	*/
	
	(function(w) {
	  'use strict';
	  
	  var DEFAULT_POWER_OF_TWO = 5;
	  
	  function makeKeysFn(shift) {
	    return function(obj) {
	      var sx = obj.x >> shift,
	        sy = obj.y >> shift,
	        ex = (obj.x + obj.width) >> shift,
	        ey = (obj.y + obj.height) >> shift,
	        x, y, keys = [];
	      for(y=sy;y<=ey;y++) {
	        for(x=sx;x<=ex;x++) {
	          keys.push("" + x + ":" + y);
	        }
	      }
	      return keys;
	    };
	  }  
	  
	  /**
	  * @param {number} power_of_two - how many times the rects should be shifted
	  *                                when hashing
	  */
	  function SpatialHash(power_of_two) {
	    if (!power_of_two) {
	      power_of_two = DEFAULT_POWER_OF_TWO;
	    }
	    this.getKeys = makeKeysFn(power_of_two);
	    this.hash = {};
	    this.list = [];
	    this._lastTotalCleared = 0;
	  }
	  
	  SpatialHash.prototype.clear = function() {
	    var key;
	    for (key in this.hash) {
	      if (this.hash[key].length === 0) {
	        delete this.hash[key];
	      } else {
	        this.hash[key].length = 0;
	      }
	    }
	    this.list.length = 0;
	  };
	  
	  SpatialHash.prototype.getNumBuckets = function() {
	    var key, count = 0;
	    for (key in this.hash) {
	      if (this.hash.hasOwnProperty(key)) {
	        if (this.hash[key].length > 0) {
	          count++;
	        }
	      }
	    }
	    return count;
	    
	  };
	  
	  SpatialHash.prototype.insert = function(obj, rect) {
	    var keys = this.getKeys(rect || obj), key, i;
	    this.list.push(obj);
	    for (i=0;i<keys.length;i++) {
	      key = keys[i];
	      if (this.hash[key]) {
	        this.hash[key].push(obj);
	      } else {
	        this.hash[key] = [obj];
	      }
	    }
	  };
	  
	  SpatialHash.prototype.retrieve = function(obj, rect) {
	    var ret = [], keys, i, key;
	    if (!obj && !rect) {
	      return this.list;
	    }
	    keys = this.getKeys(rect || obj);
	    for (i=0;i<keys.length;i++) {
	      key = keys[i];
	      if (this.hash[key]) {
	        ret = ret.concat(this.hash[key]);
	      }
	    }
	    return ret;
	  };
	  
	  w.SpatialHash = SpatialHash;
	})(this);

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })(); /* global THREE */
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _glMatrix = __webpack_require__(4);
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var StandardFaceData = (function () {
	  function StandardFaceData() {
	    _classCallCheck(this, StandardFaceData);
	
	    this.data = __webpack_require__(14);
	
	    var index = this.data.face.index.concat(this.data.rightEye.index, this.data.leftEye.index);
	    this.index = new THREE.Uint16Attribute(index, 1);
	    this.position = new THREE.Float32Attribute(this.data.face.position, 3);
	
	    this.bounds = this.getBounds();
	    this.size = _glMatrix.vec2.len(this.bounds.size);
	  }
	
	  _createClass(StandardFaceData, [{
	    key: 'getBounds',
	    value: function getBounds() {
	      var min = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
	      var max = [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE];
	      var position = this.data.face.position;
	      var n = position.length;
	      for (var i = 0; i < n; i += 3) {
	        var p = [position[i], position[i + 1], position[i + 2]];
	        _glMatrix.vec3.min(min, min, p);
	        _glMatrix.vec3.max(max, max, p);
	      }
	      return { min: min, max: max, size: _glMatrix.vec3.sub([], max, min), center: _glMatrix.vec3.lerp([], min, max, 0.5) };
	    }
	  }, {
	    key: 'getFeatureVertex',
	    value: function getFeatureVertex(index) {
	      var i = this.data.face.featurePoint[index] * 3;
	      var p = this.data.face.position;
	      return [p[i], p[i + 1], p[i + 2]];
	    }
	  }, {
	    key: 'getVertex',
	    value: function getVertex(index) {
	      var i = index * 3;
	      var p = this.data.face.position;
	      return [p[i], p[i + 1], p[i + 2]];
	    }
	  }]);
	
	  return StandardFaceData;
	})();
	
	exports.default = StandardFaceData;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @fileoverview gl-matrix - High performance matrix and vector operations
	 * @author Brandon Jones
	 * @author Colin MacKenzie IV
	 * @version 2.3.0
	 */
	
	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */
	// END HEADER
	
	exports.glMatrix = __webpack_require__(5);
	exports.mat2 = __webpack_require__(6);
	exports.mat2d = __webpack_require__(7);
	exports.mat3 = __webpack_require__(8);
	exports.mat4 = __webpack_require__(9);
	exports.quat = __webpack_require__(10);
	exports.vec2 = __webpack_require__(13);
	exports.vec3 = __webpack_require__(11);
	exports.vec4 = __webpack_require__(12);

/***/ },
/* 5 */
/***/ function(module, exports) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */
	
	/**
	 * @class Common utilities
	 * @name glMatrix
	 */
	var glMatrix = {};
	
	// Constants
	glMatrix.EPSILON = 0.000001;
	glMatrix.ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
	glMatrix.RANDOM = Math.random;
	
	/**
	 * Sets the type of array used when creating new vectors and matrices
	 *
	 * @param {Type} type Array type, such as Float32Array or Array
	 */
	glMatrix.setMatrixArrayType = function(type) {
	    GLMAT_ARRAY_TYPE = type;
	}
	
	var degree = Math.PI / 180;
	
	/**
	* Convert Degree To Radian
	*
	* @param {Number} Angle in Degrees
	*/
	glMatrix.toRadian = function(a){
	     return a * degree;
	}
	
	module.exports = glMatrix;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */
	
	var glMatrix = __webpack_require__(5);
	
	/**
	 * @class 2x2 Matrix
	 * @name mat2
	 */
	var mat2 = {};
	
	/**
	 * Creates a new identity mat2
	 *
	 * @returns {mat2} a new 2x2 matrix
	 */
	mat2.create = function() {
	    var out = new glMatrix.ARRAY_TYPE(4);
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 1;
	    return out;
	};
	
	/**
	 * Creates a new mat2 initialized with values from an existing matrix
	 *
	 * @param {mat2} a matrix to clone
	 * @returns {mat2} a new 2x2 matrix
	 */
	mat2.clone = function(a) {
	    var out = new glMatrix.ARRAY_TYPE(4);
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    return out;
	};
	
	/**
	 * Copy the values from one mat2 to another
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {mat2} a the source matrix
	 * @returns {mat2} out
	 */
	mat2.copy = function(out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    return out;
	};
	
	/**
	 * Set a mat2 to the identity matrix
	 *
	 * @param {mat2} out the receiving matrix
	 * @returns {mat2} out
	 */
	mat2.identity = function(out) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 1;
	    return out;
	};
	
	/**
	 * Transpose the values of a mat2
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {mat2} a the source matrix
	 * @returns {mat2} out
	 */
	mat2.transpose = function(out, a) {
	    // If we are transposing ourselves we can skip a few steps but have to cache some values
	    if (out === a) {
	        var a1 = a[1];
	        out[1] = a[2];
	        out[2] = a1;
	    } else {
	        out[0] = a[0];
	        out[1] = a[2];
	        out[2] = a[1];
	        out[3] = a[3];
	    }
	    
	    return out;
	};
	
	/**
	 * Inverts a mat2
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {mat2} a the source matrix
	 * @returns {mat2} out
	 */
	mat2.invert = function(out, a) {
	    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
	
	        // Calculate the determinant
	        det = a0 * a3 - a2 * a1;
	
	    if (!det) {
	        return null;
	    }
	    det = 1.0 / det;
	    
	    out[0] =  a3 * det;
	    out[1] = -a1 * det;
	    out[2] = -a2 * det;
	    out[3] =  a0 * det;
	
	    return out;
	};
	
	/**
	 * Calculates the adjugate of a mat2
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {mat2} a the source matrix
	 * @returns {mat2} out
	 */
	mat2.adjoint = function(out, a) {
	    // Caching this value is nessecary if out == a
	    var a0 = a[0];
	    out[0] =  a[3];
	    out[1] = -a[1];
	    out[2] = -a[2];
	    out[3] =  a0;
	
	    return out;
	};
	
	/**
	 * Calculates the determinant of a mat2
	 *
	 * @param {mat2} a the source matrix
	 * @returns {Number} determinant of a
	 */
	mat2.determinant = function (a) {
	    return a[0] * a[3] - a[2] * a[1];
	};
	
	/**
	 * Multiplies two mat2's
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {mat2} a the first operand
	 * @param {mat2} b the second operand
	 * @returns {mat2} out
	 */
	mat2.multiply = function (out, a, b) {
	    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
	    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
	    out[0] = a0 * b0 + a2 * b1;
	    out[1] = a1 * b0 + a3 * b1;
	    out[2] = a0 * b2 + a2 * b3;
	    out[3] = a1 * b2 + a3 * b3;
	    return out;
	};
	
	/**
	 * Alias for {@link mat2.multiply}
	 * @function
	 */
	mat2.mul = mat2.multiply;
	
	/**
	 * Rotates a mat2 by the given angle
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {mat2} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat2} out
	 */
	mat2.rotate = function (out, a, rad) {
	    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
	        s = Math.sin(rad),
	        c = Math.cos(rad);
	    out[0] = a0 *  c + a2 * s;
	    out[1] = a1 *  c + a3 * s;
	    out[2] = a0 * -s + a2 * c;
	    out[3] = a1 * -s + a3 * c;
	    return out;
	};
	
	/**
	 * Scales the mat2 by the dimensions in the given vec2
	 *
	 * @param {mat2} out the receiving matrix
	 * @param {mat2} a the matrix to rotate
	 * @param {vec2} v the vec2 to scale the matrix by
	 * @returns {mat2} out
	 **/
	mat2.scale = function(out, a, v) {
	    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
	        v0 = v[0], v1 = v[1];
	    out[0] = a0 * v0;
	    out[1] = a1 * v0;
	    out[2] = a2 * v1;
	    out[3] = a3 * v1;
	    return out;
	};
	
	/**
	 * Creates a matrix from a given angle
	 * This is equivalent to (but much faster than):
	 *
	 *     mat2.identity(dest);
	 *     mat2.rotate(dest, dest, rad);
	 *
	 * @param {mat2} out mat2 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat2} out
	 */
	mat2.fromRotation = function(out, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad);
	    out[0] = c;
	    out[1] = s;
	    out[2] = -s;
	    out[3] = c;
	    return out;
	}
	
	/**
	 * Creates a matrix from a vector scaling
	 * This is equivalent to (but much faster than):
	 *
	 *     mat2.identity(dest);
	 *     mat2.scale(dest, dest, vec);
	 *
	 * @param {mat2} out mat2 receiving operation result
	 * @param {vec2} v Scaling vector
	 * @returns {mat2} out
	 */
	mat2.fromScaling = function(out, v) {
	    out[0] = v[0];
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = v[1];
	    return out;
	}
	
	/**
	 * Returns a string representation of a mat2
	 *
	 * @param {mat2} mat matrix to represent as a string
	 * @returns {String} string representation of the matrix
	 */
	mat2.str = function (a) {
	    return 'mat2(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
	};
	
	/**
	 * Returns Frobenius norm of a mat2
	 *
	 * @param {mat2} a the matrix to calculate Frobenius norm of
	 * @returns {Number} Frobenius norm
	 */
	mat2.frob = function (a) {
	    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2)))
	};
	
	/**
	 * Returns L, D and U matrices (Lower triangular, Diagonal and Upper triangular) by factorizing the input matrix
	 * @param {mat2} L the lower triangular matrix 
	 * @param {mat2} D the diagonal matrix 
	 * @param {mat2} U the upper triangular matrix 
	 * @param {mat2} a the input matrix to factorize
	 */
	
	mat2.LDU = function (L, D, U, a) { 
	    L[2] = a[2]/a[0]; 
	    U[0] = a[0]; 
	    U[1] = a[1]; 
	    U[3] = a[3] - L[2] * U[1]; 
	    return [L, D, U];       
	}; 
	
	
	module.exports = mat2;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */
	
	var glMatrix = __webpack_require__(5);
	
	/**
	 * @class 2x3 Matrix
	 * @name mat2d
	 * 
	 * @description 
	 * A mat2d contains six elements defined as:
	 * <pre>
	 * [a, c, tx,
	 *  b, d, ty]
	 * </pre>
	 * This is a short form for the 3x3 matrix:
	 * <pre>
	 * [a, c, tx,
	 *  b, d, ty,
	 *  0, 0, 1]
	 * </pre>
	 * The last row is ignored so the array is shorter and operations are faster.
	 */
	var mat2d = {};
	
	/**
	 * Creates a new identity mat2d
	 *
	 * @returns {mat2d} a new 2x3 matrix
	 */
	mat2d.create = function() {
	    var out = new glMatrix.ARRAY_TYPE(6);
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 1;
	    out[4] = 0;
	    out[5] = 0;
	    return out;
	};
	
	/**
	 * Creates a new mat2d initialized with values from an existing matrix
	 *
	 * @param {mat2d} a matrix to clone
	 * @returns {mat2d} a new 2x3 matrix
	 */
	mat2d.clone = function(a) {
	    var out = new glMatrix.ARRAY_TYPE(6);
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    return out;
	};
	
	/**
	 * Copy the values from one mat2d to another
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {mat2d} a the source matrix
	 * @returns {mat2d} out
	 */
	mat2d.copy = function(out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    return out;
	};
	
	/**
	 * Set a mat2d to the identity matrix
	 *
	 * @param {mat2d} out the receiving matrix
	 * @returns {mat2d} out
	 */
	mat2d.identity = function(out) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 1;
	    out[4] = 0;
	    out[5] = 0;
	    return out;
	};
	
	/**
	 * Inverts a mat2d
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {mat2d} a the source matrix
	 * @returns {mat2d} out
	 */
	mat2d.invert = function(out, a) {
	    var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
	        atx = a[4], aty = a[5];
	
	    var det = aa * ad - ab * ac;
	    if(!det){
	        return null;
	    }
	    det = 1.0 / det;
	
	    out[0] = ad * det;
	    out[1] = -ab * det;
	    out[2] = -ac * det;
	    out[3] = aa * det;
	    out[4] = (ac * aty - ad * atx) * det;
	    out[5] = (ab * atx - aa * aty) * det;
	    return out;
	};
	
	/**
	 * Calculates the determinant of a mat2d
	 *
	 * @param {mat2d} a the source matrix
	 * @returns {Number} determinant of a
	 */
	mat2d.determinant = function (a) {
	    return a[0] * a[3] - a[1] * a[2];
	};
	
	/**
	 * Multiplies two mat2d's
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {mat2d} a the first operand
	 * @param {mat2d} b the second operand
	 * @returns {mat2d} out
	 */
	mat2d.multiply = function (out, a, b) {
	    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
	        b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
	    out[0] = a0 * b0 + a2 * b1;
	    out[1] = a1 * b0 + a3 * b1;
	    out[2] = a0 * b2 + a2 * b3;
	    out[3] = a1 * b2 + a3 * b3;
	    out[4] = a0 * b4 + a2 * b5 + a4;
	    out[5] = a1 * b4 + a3 * b5 + a5;
	    return out;
	};
	
	/**
	 * Alias for {@link mat2d.multiply}
	 * @function
	 */
	mat2d.mul = mat2d.multiply;
	
	/**
	 * Rotates a mat2d by the given angle
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {mat2d} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat2d} out
	 */
	mat2d.rotate = function (out, a, rad) {
	    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
	        s = Math.sin(rad),
	        c = Math.cos(rad);
	    out[0] = a0 *  c + a2 * s;
	    out[1] = a1 *  c + a3 * s;
	    out[2] = a0 * -s + a2 * c;
	    out[3] = a1 * -s + a3 * c;
	    out[4] = a4;
	    out[5] = a5;
	    return out;
	};
	
	/**
	 * Scales the mat2d by the dimensions in the given vec2
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {mat2d} a the matrix to translate
	 * @param {vec2} v the vec2 to scale the matrix by
	 * @returns {mat2d} out
	 **/
	mat2d.scale = function(out, a, v) {
	    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
	        v0 = v[0], v1 = v[1];
	    out[0] = a0 * v0;
	    out[1] = a1 * v0;
	    out[2] = a2 * v1;
	    out[3] = a3 * v1;
	    out[4] = a4;
	    out[5] = a5;
	    return out;
	};
	
	/**
	 * Translates the mat2d by the dimensions in the given vec2
	 *
	 * @param {mat2d} out the receiving matrix
	 * @param {mat2d} a the matrix to translate
	 * @param {vec2} v the vec2 to translate the matrix by
	 * @returns {mat2d} out
	 **/
	mat2d.translate = function(out, a, v) {
	    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
	        v0 = v[0], v1 = v[1];
	    out[0] = a0;
	    out[1] = a1;
	    out[2] = a2;
	    out[3] = a3;
	    out[4] = a0 * v0 + a2 * v1 + a4;
	    out[5] = a1 * v0 + a3 * v1 + a5;
	    return out;
	};
	
	/**
	 * Creates a matrix from a given angle
	 * This is equivalent to (but much faster than):
	 *
	 *     mat2d.identity(dest);
	 *     mat2d.rotate(dest, dest, rad);
	 *
	 * @param {mat2d} out mat2d receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat2d} out
	 */
	mat2d.fromRotation = function(out, rad) {
	    var s = Math.sin(rad), c = Math.cos(rad);
	    out[0] = c;
	    out[1] = s;
	    out[2] = -s;
	    out[3] = c;
	    out[4] = 0;
	    out[5] = 0;
	    return out;
	}
	
	/**
	 * Creates a matrix from a vector scaling
	 * This is equivalent to (but much faster than):
	 *
	 *     mat2d.identity(dest);
	 *     mat2d.scale(dest, dest, vec);
	 *
	 * @param {mat2d} out mat2d receiving operation result
	 * @param {vec2} v Scaling vector
	 * @returns {mat2d} out
	 */
	mat2d.fromScaling = function(out, v) {
	    out[0] = v[0];
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = v[1];
	    out[4] = 0;
	    out[5] = 0;
	    return out;
	}
	
	/**
	 * Creates a matrix from a vector translation
	 * This is equivalent to (but much faster than):
	 *
	 *     mat2d.identity(dest);
	 *     mat2d.translate(dest, dest, vec);
	 *
	 * @param {mat2d} out mat2d receiving operation result
	 * @param {vec2} v Translation vector
	 * @returns {mat2d} out
	 */
	mat2d.fromTranslation = function(out, v) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 1;
	    out[4] = v[0];
	    out[5] = v[1];
	    return out;
	}
	
	/**
	 * Returns a string representation of a mat2d
	 *
	 * @param {mat2d} a matrix to represent as a string
	 * @returns {String} string representation of the matrix
	 */
	mat2d.str = function (a) {
	    return 'mat2d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
	                    a[3] + ', ' + a[4] + ', ' + a[5] + ')';
	};
	
	/**
	 * Returns Frobenius norm of a mat2d
	 *
	 * @param {mat2d} a the matrix to calculate Frobenius norm of
	 * @returns {Number} Frobenius norm
	 */
	mat2d.frob = function (a) { 
	    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + 1))
	}; 
	
	module.exports = mat2d;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */
	
	var glMatrix = __webpack_require__(5);
	
	/**
	 * @class 3x3 Matrix
	 * @name mat3
	 */
	var mat3 = {};
	
	/**
	 * Creates a new identity mat3
	 *
	 * @returns {mat3} a new 3x3 matrix
	 */
	mat3.create = function() {
	    var out = new glMatrix.ARRAY_TYPE(9);
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 1;
	    out[5] = 0;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 1;
	    return out;
	};
	
	/**
	 * Copies the upper-left 3x3 values into the given mat3.
	 *
	 * @param {mat3} out the receiving 3x3 matrix
	 * @param {mat4} a   the source 4x4 matrix
	 * @returns {mat3} out
	 */
	mat3.fromMat4 = function(out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[4];
	    out[4] = a[5];
	    out[5] = a[6];
	    out[6] = a[8];
	    out[7] = a[9];
	    out[8] = a[10];
	    return out;
	};
	
	/**
	 * Creates a new mat3 initialized with values from an existing matrix
	 *
	 * @param {mat3} a matrix to clone
	 * @returns {mat3} a new 3x3 matrix
	 */
	mat3.clone = function(a) {
	    var out = new glMatrix.ARRAY_TYPE(9);
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    out[6] = a[6];
	    out[7] = a[7];
	    out[8] = a[8];
	    return out;
	};
	
	/**
	 * Copy the values from one mat3 to another
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the source matrix
	 * @returns {mat3} out
	 */
	mat3.copy = function(out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    out[6] = a[6];
	    out[7] = a[7];
	    out[8] = a[8];
	    return out;
	};
	
	/**
	 * Set a mat3 to the identity matrix
	 *
	 * @param {mat3} out the receiving matrix
	 * @returns {mat3} out
	 */
	mat3.identity = function(out) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 1;
	    out[5] = 0;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 1;
	    return out;
	};
	
	/**
	 * Transpose the values of a mat3
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the source matrix
	 * @returns {mat3} out
	 */
	mat3.transpose = function(out, a) {
	    // If we are transposing ourselves we can skip a few steps but have to cache some values
	    if (out === a) {
	        var a01 = a[1], a02 = a[2], a12 = a[5];
	        out[1] = a[3];
	        out[2] = a[6];
	        out[3] = a01;
	        out[5] = a[7];
	        out[6] = a02;
	        out[7] = a12;
	    } else {
	        out[0] = a[0];
	        out[1] = a[3];
	        out[2] = a[6];
	        out[3] = a[1];
	        out[4] = a[4];
	        out[5] = a[7];
	        out[6] = a[2];
	        out[7] = a[5];
	        out[8] = a[8];
	    }
	    
	    return out;
	};
	
	/**
	 * Inverts a mat3
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the source matrix
	 * @returns {mat3} out
	 */
	mat3.invert = function(out, a) {
	    var a00 = a[0], a01 = a[1], a02 = a[2],
	        a10 = a[3], a11 = a[4], a12 = a[5],
	        a20 = a[6], a21 = a[7], a22 = a[8],
	
	        b01 = a22 * a11 - a12 * a21,
	        b11 = -a22 * a10 + a12 * a20,
	        b21 = a21 * a10 - a11 * a20,
	
	        // Calculate the determinant
	        det = a00 * b01 + a01 * b11 + a02 * b21;
	
	    if (!det) { 
	        return null; 
	    }
	    det = 1.0 / det;
	
	    out[0] = b01 * det;
	    out[1] = (-a22 * a01 + a02 * a21) * det;
	    out[2] = (a12 * a01 - a02 * a11) * det;
	    out[3] = b11 * det;
	    out[4] = (a22 * a00 - a02 * a20) * det;
	    out[5] = (-a12 * a00 + a02 * a10) * det;
	    out[6] = b21 * det;
	    out[7] = (-a21 * a00 + a01 * a20) * det;
	    out[8] = (a11 * a00 - a01 * a10) * det;
	    return out;
	};
	
	/**
	 * Calculates the adjugate of a mat3
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the source matrix
	 * @returns {mat3} out
	 */
	mat3.adjoint = function(out, a) {
	    var a00 = a[0], a01 = a[1], a02 = a[2],
	        a10 = a[3], a11 = a[4], a12 = a[5],
	        a20 = a[6], a21 = a[7], a22 = a[8];
	
	    out[0] = (a11 * a22 - a12 * a21);
	    out[1] = (a02 * a21 - a01 * a22);
	    out[2] = (a01 * a12 - a02 * a11);
	    out[3] = (a12 * a20 - a10 * a22);
	    out[4] = (a00 * a22 - a02 * a20);
	    out[5] = (a02 * a10 - a00 * a12);
	    out[6] = (a10 * a21 - a11 * a20);
	    out[7] = (a01 * a20 - a00 * a21);
	    out[8] = (a00 * a11 - a01 * a10);
	    return out;
	};
	
	/**
	 * Calculates the determinant of a mat3
	 *
	 * @param {mat3} a the source matrix
	 * @returns {Number} determinant of a
	 */
	mat3.determinant = function (a) {
	    var a00 = a[0], a01 = a[1], a02 = a[2],
	        a10 = a[3], a11 = a[4], a12 = a[5],
	        a20 = a[6], a21 = a[7], a22 = a[8];
	
	    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
	};
	
	/**
	 * Multiplies two mat3's
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the first operand
	 * @param {mat3} b the second operand
	 * @returns {mat3} out
	 */
	mat3.multiply = function (out, a, b) {
	    var a00 = a[0], a01 = a[1], a02 = a[2],
	        a10 = a[3], a11 = a[4], a12 = a[5],
	        a20 = a[6], a21 = a[7], a22 = a[8],
	
	        b00 = b[0], b01 = b[1], b02 = b[2],
	        b10 = b[3], b11 = b[4], b12 = b[5],
	        b20 = b[6], b21 = b[7], b22 = b[8];
	
	    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
	    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
	    out[2] = b00 * a02 + b01 * a12 + b02 * a22;
	
	    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
	    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
	    out[5] = b10 * a02 + b11 * a12 + b12 * a22;
	
	    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
	    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
	    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
	    return out;
	};
	
	/**
	 * Alias for {@link mat3.multiply}
	 * @function
	 */
	mat3.mul = mat3.multiply;
	
	/**
	 * Translate a mat3 by the given vector
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the matrix to translate
	 * @param {vec2} v vector to translate by
	 * @returns {mat3} out
	 */
	mat3.translate = function(out, a, v) {
	    var a00 = a[0], a01 = a[1], a02 = a[2],
	        a10 = a[3], a11 = a[4], a12 = a[5],
	        a20 = a[6], a21 = a[7], a22 = a[8],
	        x = v[0], y = v[1];
	
	    out[0] = a00;
	    out[1] = a01;
	    out[2] = a02;
	
	    out[3] = a10;
	    out[4] = a11;
	    out[5] = a12;
	
	    out[6] = x * a00 + y * a10 + a20;
	    out[7] = x * a01 + y * a11 + a21;
	    out[8] = x * a02 + y * a12 + a22;
	    return out;
	};
	
	/**
	 * Rotates a mat3 by the given angle
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat3} out
	 */
	mat3.rotate = function (out, a, rad) {
	    var a00 = a[0], a01 = a[1], a02 = a[2],
	        a10 = a[3], a11 = a[4], a12 = a[5],
	        a20 = a[6], a21 = a[7], a22 = a[8],
	
	        s = Math.sin(rad),
	        c = Math.cos(rad);
	
	    out[0] = c * a00 + s * a10;
	    out[1] = c * a01 + s * a11;
	    out[2] = c * a02 + s * a12;
	
	    out[3] = c * a10 - s * a00;
	    out[4] = c * a11 - s * a01;
	    out[5] = c * a12 - s * a02;
	
	    out[6] = a20;
	    out[7] = a21;
	    out[8] = a22;
	    return out;
	};
	
	/**
	 * Scales the mat3 by the dimensions in the given vec2
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat3} a the matrix to rotate
	 * @param {vec2} v the vec2 to scale the matrix by
	 * @returns {mat3} out
	 **/
	mat3.scale = function(out, a, v) {
	    var x = v[0], y = v[1];
	
	    out[0] = x * a[0];
	    out[1] = x * a[1];
	    out[2] = x * a[2];
	
	    out[3] = y * a[3];
	    out[4] = y * a[4];
	    out[5] = y * a[5];
	
	    out[6] = a[6];
	    out[7] = a[7];
	    out[8] = a[8];
	    return out;
	};
	
	/**
	 * Creates a matrix from a vector translation
	 * This is equivalent to (but much faster than):
	 *
	 *     mat3.identity(dest);
	 *     mat3.translate(dest, dest, vec);
	 *
	 * @param {mat3} out mat3 receiving operation result
	 * @param {vec2} v Translation vector
	 * @returns {mat3} out
	 */
	mat3.fromTranslation = function(out, v) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 1;
	    out[5] = 0;
	    out[6] = v[0];
	    out[7] = v[1];
	    out[8] = 1;
	    return out;
	}
	
	/**
	 * Creates a matrix from a given angle
	 * This is equivalent to (but much faster than):
	 *
	 *     mat3.identity(dest);
	 *     mat3.rotate(dest, dest, rad);
	 *
	 * @param {mat3} out mat3 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat3} out
	 */
	mat3.fromRotation = function(out, rad) {
	    var s = Math.sin(rad), c = Math.cos(rad);
	
	    out[0] = c;
	    out[1] = s;
	    out[2] = 0;
	
	    out[3] = -s;
	    out[4] = c;
	    out[5] = 0;
	
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 1;
	    return out;
	}
	
	/**
	 * Creates a matrix from a vector scaling
	 * This is equivalent to (but much faster than):
	 *
	 *     mat3.identity(dest);
	 *     mat3.scale(dest, dest, vec);
	 *
	 * @param {mat3} out mat3 receiving operation result
	 * @param {vec2} v Scaling vector
	 * @returns {mat3} out
	 */
	mat3.fromScaling = function(out, v) {
	    out[0] = v[0];
	    out[1] = 0;
	    out[2] = 0;
	
	    out[3] = 0;
	    out[4] = v[1];
	    out[5] = 0;
	
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 1;
	    return out;
	}
	
	/**
	 * Copies the values from a mat2d into a mat3
	 *
	 * @param {mat3} out the receiving matrix
	 * @param {mat2d} a the matrix to copy
	 * @returns {mat3} out
	 **/
	mat3.fromMat2d = function(out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = 0;
	
	    out[3] = a[2];
	    out[4] = a[3];
	    out[5] = 0;
	
	    out[6] = a[4];
	    out[7] = a[5];
	    out[8] = 1;
	    return out;
	};
	
	/**
	* Calculates a 3x3 matrix from the given quaternion
	*
	* @param {mat3} out mat3 receiving operation result
	* @param {quat} q Quaternion to create matrix from
	*
	* @returns {mat3} out
	*/
	mat3.fromQuat = function (out, q) {
	    var x = q[0], y = q[1], z = q[2], w = q[3],
	        x2 = x + x,
	        y2 = y + y,
	        z2 = z + z,
	
	        xx = x * x2,
	        yx = y * x2,
	        yy = y * y2,
	        zx = z * x2,
	        zy = z * y2,
	        zz = z * z2,
	        wx = w * x2,
	        wy = w * y2,
	        wz = w * z2;
	
	    out[0] = 1 - yy - zz;
	    out[3] = yx - wz;
	    out[6] = zx + wy;
	
	    out[1] = yx + wz;
	    out[4] = 1 - xx - zz;
	    out[7] = zy - wx;
	
	    out[2] = zx - wy;
	    out[5] = zy + wx;
	    out[8] = 1 - xx - yy;
	
	    return out;
	};
	
	/**
	* Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
	*
	* @param {mat3} out mat3 receiving operation result
	* @param {mat4} a Mat4 to derive the normal matrix from
	*
	* @returns {mat3} out
	*/
	mat3.normalFromMat4 = function (out, a) {
	    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
	        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
	        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
	        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],
	
	        b00 = a00 * a11 - a01 * a10,
	        b01 = a00 * a12 - a02 * a10,
	        b02 = a00 * a13 - a03 * a10,
	        b03 = a01 * a12 - a02 * a11,
	        b04 = a01 * a13 - a03 * a11,
	        b05 = a02 * a13 - a03 * a12,
	        b06 = a20 * a31 - a21 * a30,
	        b07 = a20 * a32 - a22 * a30,
	        b08 = a20 * a33 - a23 * a30,
	        b09 = a21 * a32 - a22 * a31,
	        b10 = a21 * a33 - a23 * a31,
	        b11 = a22 * a33 - a23 * a32,
	
	        // Calculate the determinant
	        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
	
	    if (!det) { 
	        return null; 
	    }
	    det = 1.0 / det;
	
	    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
	    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
	    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
	
	    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
	    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
	    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
	
	    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
	    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
	    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
	
	    return out;
	};
	
	/**
	 * Returns a string representation of a mat3
	 *
	 * @param {mat3} mat matrix to represent as a string
	 * @returns {String} string representation of the matrix
	 */
	mat3.str = function (a) {
	    return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
	                    a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + 
	                    a[6] + ', ' + a[7] + ', ' + a[8] + ')';
	};
	
	/**
	 * Returns Frobenius norm of a mat3
	 *
	 * @param {mat3} a the matrix to calculate Frobenius norm of
	 * @returns {Number} Frobenius norm
	 */
	mat3.frob = function (a) {
	    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2)))
	};
	
	
	module.exports = mat3;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */
	
	var glMatrix = __webpack_require__(5);
	
	/**
	 * @class 4x4 Matrix
	 * @name mat4
	 */
	var mat4 = {};
	
	/**
	 * Creates a new identity mat4
	 *
	 * @returns {mat4} a new 4x4 matrix
	 */
	mat4.create = function() {
	    var out = new glMatrix.ARRAY_TYPE(16);
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = 1;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 1;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	};
	
	/**
	 * Creates a new mat4 initialized with values from an existing matrix
	 *
	 * @param {mat4} a matrix to clone
	 * @returns {mat4} a new 4x4 matrix
	 */
	mat4.clone = function(a) {
	    var out = new glMatrix.ARRAY_TYPE(16);
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    out[6] = a[6];
	    out[7] = a[7];
	    out[8] = a[8];
	    out[9] = a[9];
	    out[10] = a[10];
	    out[11] = a[11];
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	    return out;
	};
	
	/**
	 * Copy the values from one mat4 to another
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the source matrix
	 * @returns {mat4} out
	 */
	mat4.copy = function(out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    out[4] = a[4];
	    out[5] = a[5];
	    out[6] = a[6];
	    out[7] = a[7];
	    out[8] = a[8];
	    out[9] = a[9];
	    out[10] = a[10];
	    out[11] = a[11];
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	    return out;
	};
	
	/**
	 * Set a mat4 to the identity matrix
	 *
	 * @param {mat4} out the receiving matrix
	 * @returns {mat4} out
	 */
	mat4.identity = function(out) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = 1;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 1;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	};
	
	/**
	 * Transpose the values of a mat4
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the source matrix
	 * @returns {mat4} out
	 */
	mat4.transpose = function(out, a) {
	    // If we are transposing ourselves we can skip a few steps but have to cache some values
	    if (out === a) {
	        var a01 = a[1], a02 = a[2], a03 = a[3],
	            a12 = a[6], a13 = a[7],
	            a23 = a[11];
	
	        out[1] = a[4];
	        out[2] = a[8];
	        out[3] = a[12];
	        out[4] = a01;
	        out[6] = a[9];
	        out[7] = a[13];
	        out[8] = a02;
	        out[9] = a12;
	        out[11] = a[14];
	        out[12] = a03;
	        out[13] = a13;
	        out[14] = a23;
	    } else {
	        out[0] = a[0];
	        out[1] = a[4];
	        out[2] = a[8];
	        out[3] = a[12];
	        out[4] = a[1];
	        out[5] = a[5];
	        out[6] = a[9];
	        out[7] = a[13];
	        out[8] = a[2];
	        out[9] = a[6];
	        out[10] = a[10];
	        out[11] = a[14];
	        out[12] = a[3];
	        out[13] = a[7];
	        out[14] = a[11];
	        out[15] = a[15];
	    }
	    
	    return out;
	};
	
	/**
	 * Inverts a mat4
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the source matrix
	 * @returns {mat4} out
	 */
	mat4.invert = function(out, a) {
	    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
	        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
	        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
	        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],
	
	        b00 = a00 * a11 - a01 * a10,
	        b01 = a00 * a12 - a02 * a10,
	        b02 = a00 * a13 - a03 * a10,
	        b03 = a01 * a12 - a02 * a11,
	        b04 = a01 * a13 - a03 * a11,
	        b05 = a02 * a13 - a03 * a12,
	        b06 = a20 * a31 - a21 * a30,
	        b07 = a20 * a32 - a22 * a30,
	        b08 = a20 * a33 - a23 * a30,
	        b09 = a21 * a32 - a22 * a31,
	        b10 = a21 * a33 - a23 * a31,
	        b11 = a22 * a33 - a23 * a32,
	
	        // Calculate the determinant
	        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
	
	    if (!det) { 
	        return null; 
	    }
	    det = 1.0 / det;
	
	    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
	    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
	    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
	    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
	    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
	    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
	    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
	    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
	    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
	    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
	    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
	    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
	    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
	    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
	    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
	    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
	
	    return out;
	};
	
	/**
	 * Calculates the adjugate of a mat4
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the source matrix
	 * @returns {mat4} out
	 */
	mat4.adjoint = function(out, a) {
	    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
	        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
	        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
	        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
	
	    out[0]  =  (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
	    out[1]  = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
	    out[2]  =  (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
	    out[3]  = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
	    out[4]  = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
	    out[5]  =  (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
	    out[6]  = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
	    out[7]  =  (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
	    out[8]  =  (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
	    out[9]  = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
	    out[10] =  (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
	    out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
	    out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
	    out[13] =  (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
	    out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
	    out[15] =  (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
	    return out;
	};
	
	/**
	 * Calculates the determinant of a mat4
	 *
	 * @param {mat4} a the source matrix
	 * @returns {Number} determinant of a
	 */
	mat4.determinant = function (a) {
	    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
	        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
	        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
	        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],
	
	        b00 = a00 * a11 - a01 * a10,
	        b01 = a00 * a12 - a02 * a10,
	        b02 = a00 * a13 - a03 * a10,
	        b03 = a01 * a12 - a02 * a11,
	        b04 = a01 * a13 - a03 * a11,
	        b05 = a02 * a13 - a03 * a12,
	        b06 = a20 * a31 - a21 * a30,
	        b07 = a20 * a32 - a22 * a30,
	        b08 = a20 * a33 - a23 * a30,
	        b09 = a21 * a32 - a22 * a31,
	        b10 = a21 * a33 - a23 * a31,
	        b11 = a22 * a33 - a23 * a32;
	
	    // Calculate the determinant
	    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
	};
	
	/**
	 * Multiplies two mat4's
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the first operand
	 * @param {mat4} b the second operand
	 * @returns {mat4} out
	 */
	mat4.multiply = function (out, a, b) {
	    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
	        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
	        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
	        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
	
	    // Cache only the current line of the second matrix
	    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];  
	    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
	    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
	    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
	    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
	
	    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
	    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
	    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
	    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
	    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
	
	    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
	    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
	    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
	    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
	    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
	
	    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
	    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
	    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
	    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
	    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
	    return out;
	};
	
	/**
	 * Alias for {@link mat4.multiply}
	 * @function
	 */
	mat4.mul = mat4.multiply;
	
	/**
	 * Translate a mat4 by the given vector
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to translate
	 * @param {vec3} v vector to translate by
	 * @returns {mat4} out
	 */
	mat4.translate = function (out, a, v) {
	    var x = v[0], y = v[1], z = v[2],
	        a00, a01, a02, a03,
	        a10, a11, a12, a13,
	        a20, a21, a22, a23;
	
	    if (a === out) {
	        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
	        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
	        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
	        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
	    } else {
	        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
	        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
	        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];
	
	        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
	        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
	        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;
	
	        out[12] = a00 * x + a10 * y + a20 * z + a[12];
	        out[13] = a01 * x + a11 * y + a21 * z + a[13];
	        out[14] = a02 * x + a12 * y + a22 * z + a[14];
	        out[15] = a03 * x + a13 * y + a23 * z + a[15];
	    }
	
	    return out;
	};
	
	/**
	 * Scales the mat4 by the dimensions in the given vec3
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to scale
	 * @param {vec3} v the vec3 to scale the matrix by
	 * @returns {mat4} out
	 **/
	mat4.scale = function(out, a, v) {
	    var x = v[0], y = v[1], z = v[2];
	
	    out[0] = a[0] * x;
	    out[1] = a[1] * x;
	    out[2] = a[2] * x;
	    out[3] = a[3] * x;
	    out[4] = a[4] * y;
	    out[5] = a[5] * y;
	    out[6] = a[6] * y;
	    out[7] = a[7] * y;
	    out[8] = a[8] * z;
	    out[9] = a[9] * z;
	    out[10] = a[10] * z;
	    out[11] = a[11] * z;
	    out[12] = a[12];
	    out[13] = a[13];
	    out[14] = a[14];
	    out[15] = a[15];
	    return out;
	};
	
	/**
	 * Rotates a mat4 by the given angle around the given axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @param {vec3} axis the axis to rotate around
	 * @returns {mat4} out
	 */
	mat4.rotate = function (out, a, rad, axis) {
	    var x = axis[0], y = axis[1], z = axis[2],
	        len = Math.sqrt(x * x + y * y + z * z),
	        s, c, t,
	        a00, a01, a02, a03,
	        a10, a11, a12, a13,
	        a20, a21, a22, a23,
	        b00, b01, b02,
	        b10, b11, b12,
	        b20, b21, b22;
	
	    if (Math.abs(len) < glMatrix.EPSILON) { return null; }
	    
	    len = 1 / len;
	    x *= len;
	    y *= len;
	    z *= len;
	
	    s = Math.sin(rad);
	    c = Math.cos(rad);
	    t = 1 - c;
	
	    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
	    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
	    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];
	
	    // Construct the elements of the rotation matrix
	    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
	    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
	    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;
	
	    // Perform rotation-specific matrix multiplication
	    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
	    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
	    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
	    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
	    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
	    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
	    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
	    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
	    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
	    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
	    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
	    out[11] = a03 * b20 + a13 * b21 + a23 * b22;
	
	    if (a !== out) { // If the source and destination differ, copy the unchanged last row
	        out[12] = a[12];
	        out[13] = a[13];
	        out[14] = a[14];
	        out[15] = a[15];
	    }
	    return out;
	};
	
	/**
	 * Rotates a matrix by the given angle around the X axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	mat4.rotateX = function (out, a, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad),
	        a10 = a[4],
	        a11 = a[5],
	        a12 = a[6],
	        a13 = a[7],
	        a20 = a[8],
	        a21 = a[9],
	        a22 = a[10],
	        a23 = a[11];
	
	    if (a !== out) { // If the source and destination differ, copy the unchanged rows
	        out[0]  = a[0];
	        out[1]  = a[1];
	        out[2]  = a[2];
	        out[3]  = a[3];
	        out[12] = a[12];
	        out[13] = a[13];
	        out[14] = a[14];
	        out[15] = a[15];
	    }
	
	    // Perform axis-specific matrix multiplication
	    out[4] = a10 * c + a20 * s;
	    out[5] = a11 * c + a21 * s;
	    out[6] = a12 * c + a22 * s;
	    out[7] = a13 * c + a23 * s;
	    out[8] = a20 * c - a10 * s;
	    out[9] = a21 * c - a11 * s;
	    out[10] = a22 * c - a12 * s;
	    out[11] = a23 * c - a13 * s;
	    return out;
	};
	
	/**
	 * Rotates a matrix by the given angle around the Y axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	mat4.rotateY = function (out, a, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad),
	        a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a03 = a[3],
	        a20 = a[8],
	        a21 = a[9],
	        a22 = a[10],
	        a23 = a[11];
	
	    if (a !== out) { // If the source and destination differ, copy the unchanged rows
	        out[4]  = a[4];
	        out[5]  = a[5];
	        out[6]  = a[6];
	        out[7]  = a[7];
	        out[12] = a[12];
	        out[13] = a[13];
	        out[14] = a[14];
	        out[15] = a[15];
	    }
	
	    // Perform axis-specific matrix multiplication
	    out[0] = a00 * c - a20 * s;
	    out[1] = a01 * c - a21 * s;
	    out[2] = a02 * c - a22 * s;
	    out[3] = a03 * c - a23 * s;
	    out[8] = a00 * s + a20 * c;
	    out[9] = a01 * s + a21 * c;
	    out[10] = a02 * s + a22 * c;
	    out[11] = a03 * s + a23 * c;
	    return out;
	};
	
	/**
	 * Rotates a matrix by the given angle around the Z axis
	 *
	 * @param {mat4} out the receiving matrix
	 * @param {mat4} a the matrix to rotate
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	mat4.rotateZ = function (out, a, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad),
	        a00 = a[0],
	        a01 = a[1],
	        a02 = a[2],
	        a03 = a[3],
	        a10 = a[4],
	        a11 = a[5],
	        a12 = a[6],
	        a13 = a[7];
	
	    if (a !== out) { // If the source and destination differ, copy the unchanged last row
	        out[8]  = a[8];
	        out[9]  = a[9];
	        out[10] = a[10];
	        out[11] = a[11];
	        out[12] = a[12];
	        out[13] = a[13];
	        out[14] = a[14];
	        out[15] = a[15];
	    }
	
	    // Perform axis-specific matrix multiplication
	    out[0] = a00 * c + a10 * s;
	    out[1] = a01 * c + a11 * s;
	    out[2] = a02 * c + a12 * s;
	    out[3] = a03 * c + a13 * s;
	    out[4] = a10 * c - a00 * s;
	    out[5] = a11 * c - a01 * s;
	    out[6] = a12 * c - a02 * s;
	    out[7] = a13 * c - a03 * s;
	    return out;
	};
	
	/**
	 * Creates a matrix from a vector translation
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, dest, vec);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {vec3} v Translation vector
	 * @returns {mat4} out
	 */
	mat4.fromTranslation = function(out, v) {
	    out[0] = 1;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = 1;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 1;
	    out[11] = 0;
	    out[12] = v[0];
	    out[13] = v[1];
	    out[14] = v[2];
	    out[15] = 1;
	    return out;
	}
	
	/**
	 * Creates a matrix from a vector scaling
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.scale(dest, dest, vec);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {vec3} v Scaling vector
	 * @returns {mat4} out
	 */
	mat4.fromScaling = function(out, v) {
	    out[0] = v[0];
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = v[1];
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = v[2];
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	}
	
	/**
	 * Creates a matrix from a given angle around a given axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotate(dest, dest, rad, axis);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @param {vec3} axis the axis to rotate around
	 * @returns {mat4} out
	 */
	mat4.fromRotation = function(out, rad, axis) {
	    var x = axis[0], y = axis[1], z = axis[2],
	        len = Math.sqrt(x * x + y * y + z * z),
	        s, c, t;
	    
	    if (Math.abs(len) < glMatrix.EPSILON) { return null; }
	    
	    len = 1 / len;
	    x *= len;
	    y *= len;
	    z *= len;
	    
	    s = Math.sin(rad);
	    c = Math.cos(rad);
	    t = 1 - c;
	    
	    // Perform rotation-specific matrix multiplication
	    out[0] = x * x * t + c;
	    out[1] = y * x * t + z * s;
	    out[2] = z * x * t - y * s;
	    out[3] = 0;
	    out[4] = x * y * t - z * s;
	    out[5] = y * y * t + c;
	    out[6] = z * y * t + x * s;
	    out[7] = 0;
	    out[8] = x * z * t + y * s;
	    out[9] = y * z * t - x * s;
	    out[10] = z * z * t + c;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	}
	
	/**
	 * Creates a matrix from the given angle around the X axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotateX(dest, dest, rad);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	mat4.fromXRotation = function(out, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad);
	    
	    // Perform axis-specific matrix multiplication
	    out[0]  = 1;
	    out[1]  = 0;
	    out[2]  = 0;
	    out[3]  = 0;
	    out[4] = 0;
	    out[5] = c;
	    out[6] = s;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = -s;
	    out[10] = c;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	}
	
	/**
	 * Creates a matrix from the given angle around the Y axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotateY(dest, dest, rad);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	mat4.fromYRotation = function(out, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad);
	    
	    // Perform axis-specific matrix multiplication
	    out[0]  = c;
	    out[1]  = 0;
	    out[2]  = -s;
	    out[3]  = 0;
	    out[4] = 0;
	    out[5] = 1;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = s;
	    out[9] = 0;
	    out[10] = c;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	}
	
	/**
	 * Creates a matrix from the given angle around the Z axis
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.rotateZ(dest, dest, rad);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {Number} rad the angle to rotate the matrix by
	 * @returns {mat4} out
	 */
	mat4.fromZRotation = function(out, rad) {
	    var s = Math.sin(rad),
	        c = Math.cos(rad);
	    
	    // Perform axis-specific matrix multiplication
	    out[0]  = c;
	    out[1]  = s;
	    out[2]  = 0;
	    out[3]  = 0;
	    out[4] = -s;
	    out[5] = c;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 1;
	    out[11] = 0;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	    return out;
	}
	
	/**
	 * Creates a matrix from a quaternion rotation and vector translation
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, vec);
	 *     var quatMat = mat4.create();
	 *     quat4.toMat4(quat, quatMat);
	 *     mat4.multiply(dest, quatMat);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {quat4} q Rotation quaternion
	 * @param {vec3} v Translation vector
	 * @returns {mat4} out
	 */
	mat4.fromRotationTranslation = function (out, q, v) {
	    // Quaternion math
	    var x = q[0], y = q[1], z = q[2], w = q[3],
	        x2 = x + x,
	        y2 = y + y,
	        z2 = z + z,
	
	        xx = x * x2,
	        xy = x * y2,
	        xz = x * z2,
	        yy = y * y2,
	        yz = y * z2,
	        zz = z * z2,
	        wx = w * x2,
	        wy = w * y2,
	        wz = w * z2;
	
	    out[0] = 1 - (yy + zz);
	    out[1] = xy + wz;
	    out[2] = xz - wy;
	    out[3] = 0;
	    out[4] = xy - wz;
	    out[5] = 1 - (xx + zz);
	    out[6] = yz + wx;
	    out[7] = 0;
	    out[8] = xz + wy;
	    out[9] = yz - wx;
	    out[10] = 1 - (xx + yy);
	    out[11] = 0;
	    out[12] = v[0];
	    out[13] = v[1];
	    out[14] = v[2];
	    out[15] = 1;
	    
	    return out;
	};
	
	/**
	 * Creates a matrix from a quaternion rotation, vector translation and vector scale
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, vec);
	 *     var quatMat = mat4.create();
	 *     quat4.toMat4(quat, quatMat);
	 *     mat4.multiply(dest, quatMat);
	 *     mat4.scale(dest, scale)
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {quat4} q Rotation quaternion
	 * @param {vec3} v Translation vector
	 * @param {vec3} s Scaling vector
	 * @returns {mat4} out
	 */
	mat4.fromRotationTranslationScale = function (out, q, v, s) {
	    // Quaternion math
	    var x = q[0], y = q[1], z = q[2], w = q[3],
	        x2 = x + x,
	        y2 = y + y,
	        z2 = z + z,
	
	        xx = x * x2,
	        xy = x * y2,
	        xz = x * z2,
	        yy = y * y2,
	        yz = y * z2,
	        zz = z * z2,
	        wx = w * x2,
	        wy = w * y2,
	        wz = w * z2,
	        sx = s[0],
	        sy = s[1],
	        sz = s[2];
	
	    out[0] = (1 - (yy + zz)) * sx;
	    out[1] = (xy + wz) * sx;
	    out[2] = (xz - wy) * sx;
	    out[3] = 0;
	    out[4] = (xy - wz) * sy;
	    out[5] = (1 - (xx + zz)) * sy;
	    out[6] = (yz + wx) * sy;
	    out[7] = 0;
	    out[8] = (xz + wy) * sz;
	    out[9] = (yz - wx) * sz;
	    out[10] = (1 - (xx + yy)) * sz;
	    out[11] = 0;
	    out[12] = v[0];
	    out[13] = v[1];
	    out[14] = v[2];
	    out[15] = 1;
	    
	    return out;
	};
	
	/**
	 * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
	 * This is equivalent to (but much faster than):
	 *
	 *     mat4.identity(dest);
	 *     mat4.translate(dest, vec);
	 *     mat4.translate(dest, origin);
	 *     var quatMat = mat4.create();
	 *     quat4.toMat4(quat, quatMat);
	 *     mat4.multiply(dest, quatMat);
	 *     mat4.scale(dest, scale)
	 *     mat4.translate(dest, negativeOrigin);
	 *
	 * @param {mat4} out mat4 receiving operation result
	 * @param {quat4} q Rotation quaternion
	 * @param {vec3} v Translation vector
	 * @param {vec3} s Scaling vector
	 * @param {vec3} o The origin vector around which to scale and rotate
	 * @returns {mat4} out
	 */
	mat4.fromRotationTranslationScaleOrigin = function (out, q, v, s, o) {
	  // Quaternion math
	  var x = q[0], y = q[1], z = q[2], w = q[3],
	      x2 = x + x,
	      y2 = y + y,
	      z2 = z + z,
	
	      xx = x * x2,
	      xy = x * y2,
	      xz = x * z2,
	      yy = y * y2,
	      yz = y * z2,
	      zz = z * z2,
	      wx = w * x2,
	      wy = w * y2,
	      wz = w * z2,
	      
	      sx = s[0],
	      sy = s[1],
	      sz = s[2],
	
	      ox = o[0],
	      oy = o[1],
	      oz = o[2];
	      
	  out[0] = (1 - (yy + zz)) * sx;
	  out[1] = (xy + wz) * sx;
	  out[2] = (xz - wy) * sx;
	  out[3] = 0;
	  out[4] = (xy - wz) * sy;
	  out[5] = (1 - (xx + zz)) * sy;
	  out[6] = (yz + wx) * sy;
	  out[7] = 0;
	  out[8] = (xz + wy) * sz;
	  out[9] = (yz - wx) * sz;
	  out[10] = (1 - (xx + yy)) * sz;
	  out[11] = 0;
	  out[12] = v[0] + ox - (out[0] * ox + out[4] * oy + out[8] * oz);
	  out[13] = v[1] + oy - (out[1] * ox + out[5] * oy + out[9] * oz);
	  out[14] = v[2] + oz - (out[2] * ox + out[6] * oy + out[10] * oz);
	  out[15] = 1;
	        
	  return out;
	};
	
	mat4.fromQuat = function (out, q) {
	    var x = q[0], y = q[1], z = q[2], w = q[3],
	        x2 = x + x,
	        y2 = y + y,
	        z2 = z + z,
	
	        xx = x * x2,
	        yx = y * x2,
	        yy = y * y2,
	        zx = z * x2,
	        zy = z * y2,
	        zz = z * z2,
	        wx = w * x2,
	        wy = w * y2,
	        wz = w * z2;
	
	    out[0] = 1 - yy - zz;
	    out[1] = yx + wz;
	    out[2] = zx - wy;
	    out[3] = 0;
	
	    out[4] = yx - wz;
	    out[5] = 1 - xx - zz;
	    out[6] = zy + wx;
	    out[7] = 0;
	
	    out[8] = zx + wy;
	    out[9] = zy - wx;
	    out[10] = 1 - xx - yy;
	    out[11] = 0;
	
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = 0;
	    out[15] = 1;
	
	    return out;
	};
	
	/**
	 * Generates a frustum matrix with the given bounds
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {Number} left Left bound of the frustum
	 * @param {Number} right Right bound of the frustum
	 * @param {Number} bottom Bottom bound of the frustum
	 * @param {Number} top Top bound of the frustum
	 * @param {Number} near Near bound of the frustum
	 * @param {Number} far Far bound of the frustum
	 * @returns {mat4} out
	 */
	mat4.frustum = function (out, left, right, bottom, top, near, far) {
	    var rl = 1 / (right - left),
	        tb = 1 / (top - bottom),
	        nf = 1 / (near - far);
	    out[0] = (near * 2) * rl;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = (near * 2) * tb;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = (right + left) * rl;
	    out[9] = (top + bottom) * tb;
	    out[10] = (far + near) * nf;
	    out[11] = -1;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = (far * near * 2) * nf;
	    out[15] = 0;
	    return out;
	};
	
	/**
	 * Generates a perspective projection matrix with the given bounds
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {number} fovy Vertical field of view in radians
	 * @param {number} aspect Aspect ratio. typically viewport width/height
	 * @param {number} near Near bound of the frustum
	 * @param {number} far Far bound of the frustum
	 * @returns {mat4} out
	 */
	mat4.perspective = function (out, fovy, aspect, near, far) {
	    var f = 1.0 / Math.tan(fovy / 2),
	        nf = 1 / (near - far);
	    out[0] = f / aspect;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = f;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = (far + near) * nf;
	    out[11] = -1;
	    out[12] = 0;
	    out[13] = 0;
	    out[14] = (2 * far * near) * nf;
	    out[15] = 0;
	    return out;
	};
	
	/**
	 * Generates a perspective projection matrix with the given field of view.
	 * This is primarily useful for generating projection matrices to be used
	 * with the still experiemental WebVR API.
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {number} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
	 * @param {number} near Near bound of the frustum
	 * @param {number} far Far bound of the frustum
	 * @returns {mat4} out
	 */
	mat4.perspectiveFromFieldOfView = function (out, fov, near, far) {
	    var upTan = Math.tan(fov.upDegrees * Math.PI/180.0),
	        downTan = Math.tan(fov.downDegrees * Math.PI/180.0),
	        leftTan = Math.tan(fov.leftDegrees * Math.PI/180.0),
	        rightTan = Math.tan(fov.rightDegrees * Math.PI/180.0),
	        xScale = 2.0 / (leftTan + rightTan),
	        yScale = 2.0 / (upTan + downTan);
	
	    out[0] = xScale;
	    out[1] = 0.0;
	    out[2] = 0.0;
	    out[3] = 0.0;
	    out[4] = 0.0;
	    out[5] = yScale;
	    out[6] = 0.0;
	    out[7] = 0.0;
	    out[8] = -((leftTan - rightTan) * xScale * 0.5);
	    out[9] = ((upTan - downTan) * yScale * 0.5);
	    out[10] = far / (near - far);
	    out[11] = -1.0;
	    out[12] = 0.0;
	    out[13] = 0.0;
	    out[14] = (far * near) / (near - far);
	    out[15] = 0.0;
	    return out;
	}
	
	/**
	 * Generates a orthogonal projection matrix with the given bounds
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {number} left Left bound of the frustum
	 * @param {number} right Right bound of the frustum
	 * @param {number} bottom Bottom bound of the frustum
	 * @param {number} top Top bound of the frustum
	 * @param {number} near Near bound of the frustum
	 * @param {number} far Far bound of the frustum
	 * @returns {mat4} out
	 */
	mat4.ortho = function (out, left, right, bottom, top, near, far) {
	    var lr = 1 / (left - right),
	        bt = 1 / (bottom - top),
	        nf = 1 / (near - far);
	    out[0] = -2 * lr;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    out[4] = 0;
	    out[5] = -2 * bt;
	    out[6] = 0;
	    out[7] = 0;
	    out[8] = 0;
	    out[9] = 0;
	    out[10] = 2 * nf;
	    out[11] = 0;
	    out[12] = (left + right) * lr;
	    out[13] = (top + bottom) * bt;
	    out[14] = (far + near) * nf;
	    out[15] = 1;
	    return out;
	};
	
	/**
	 * Generates a look-at matrix with the given eye position, focal point, and up axis
	 *
	 * @param {mat4} out mat4 frustum matrix will be written into
	 * @param {vec3} eye Position of the viewer
	 * @param {vec3} center Point the viewer is looking at
	 * @param {vec3} up vec3 pointing up
	 * @returns {mat4} out
	 */
	mat4.lookAt = function (out, eye, center, up) {
	    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
	        eyex = eye[0],
	        eyey = eye[1],
	        eyez = eye[2],
	        upx = up[0],
	        upy = up[1],
	        upz = up[2],
	        centerx = center[0],
	        centery = center[1],
	        centerz = center[2];
	
	    if (Math.abs(eyex - centerx) < glMatrix.EPSILON &&
	        Math.abs(eyey - centery) < glMatrix.EPSILON &&
	        Math.abs(eyez - centerz) < glMatrix.EPSILON) {
	        return mat4.identity(out);
	    }
	
	    z0 = eyex - centerx;
	    z1 = eyey - centery;
	    z2 = eyez - centerz;
	
	    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
	    z0 *= len;
	    z1 *= len;
	    z2 *= len;
	
	    x0 = upy * z2 - upz * z1;
	    x1 = upz * z0 - upx * z2;
	    x2 = upx * z1 - upy * z0;
	    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
	    if (!len) {
	        x0 = 0;
	        x1 = 0;
	        x2 = 0;
	    } else {
	        len = 1 / len;
	        x0 *= len;
	        x1 *= len;
	        x2 *= len;
	    }
	
	    y0 = z1 * x2 - z2 * x1;
	    y1 = z2 * x0 - z0 * x2;
	    y2 = z0 * x1 - z1 * x0;
	
	    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
	    if (!len) {
	        y0 = 0;
	        y1 = 0;
	        y2 = 0;
	    } else {
	        len = 1 / len;
	        y0 *= len;
	        y1 *= len;
	        y2 *= len;
	    }
	
	    out[0] = x0;
	    out[1] = y0;
	    out[2] = z0;
	    out[3] = 0;
	    out[4] = x1;
	    out[5] = y1;
	    out[6] = z1;
	    out[7] = 0;
	    out[8] = x2;
	    out[9] = y2;
	    out[10] = z2;
	    out[11] = 0;
	    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
	    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
	    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
	    out[15] = 1;
	
	    return out;
	};
	
	/**
	 * Returns a string representation of a mat4
	 *
	 * @param {mat4} mat matrix to represent as a string
	 * @returns {String} string representation of the matrix
	 */
	mat4.str = function (a) {
	    return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
	                    a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
	                    a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + 
	                    a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
	};
	
	/**
	 * Returns Frobenius norm of a mat4
	 *
	 * @param {mat4} a the matrix to calculate Frobenius norm of
	 * @returns {Number} Frobenius norm
	 */
	mat4.frob = function (a) {
	    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2) + Math.pow(a[9], 2) + Math.pow(a[10], 2) + Math.pow(a[11], 2) + Math.pow(a[12], 2) + Math.pow(a[13], 2) + Math.pow(a[14], 2) + Math.pow(a[15], 2) ))
	};
	
	
	module.exports = mat4;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */
	
	var glMatrix = __webpack_require__(5);
	var mat3 = __webpack_require__(8);
	var vec3 = __webpack_require__(11);
	var vec4 = __webpack_require__(12);
	
	/**
	 * @class Quaternion
	 * @name quat
	 */
	var quat = {};
	
	/**
	 * Creates a new identity quat
	 *
	 * @returns {quat} a new quaternion
	 */
	quat.create = function() {
	    var out = new glMatrix.ARRAY_TYPE(4);
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 1;
	    return out;
	};
	
	/**
	 * Sets a quaternion to represent the shortest rotation from one
	 * vector to another.
	 *
	 * Both vectors are assumed to be unit length.
	 *
	 * @param {quat} out the receiving quaternion.
	 * @param {vec3} a the initial vector
	 * @param {vec3} b the destination vector
	 * @returns {quat} out
	 */
	quat.rotationTo = (function() {
	    var tmpvec3 = vec3.create();
	    var xUnitVec3 = vec3.fromValues(1,0,0);
	    var yUnitVec3 = vec3.fromValues(0,1,0);
	
	    return function(out, a, b) {
	        var dot = vec3.dot(a, b);
	        if (dot < -0.999999) {
	            vec3.cross(tmpvec3, xUnitVec3, a);
	            if (vec3.length(tmpvec3) < 0.000001)
	                vec3.cross(tmpvec3, yUnitVec3, a);
	            vec3.normalize(tmpvec3, tmpvec3);
	            quat.setAxisAngle(out, tmpvec3, Math.PI);
	            return out;
	        } else if (dot > 0.999999) {
	            out[0] = 0;
	            out[1] = 0;
	            out[2] = 0;
	            out[3] = 1;
	            return out;
	        } else {
	            vec3.cross(tmpvec3, a, b);
	            out[0] = tmpvec3[0];
	            out[1] = tmpvec3[1];
	            out[2] = tmpvec3[2];
	            out[3] = 1 + dot;
	            return quat.normalize(out, out);
	        }
	    };
	})();
	
	/**
	 * Sets the specified quaternion with values corresponding to the given
	 * axes. Each axis is a vec3 and is expected to be unit length and
	 * perpendicular to all other specified axes.
	 *
	 * @param {vec3} view  the vector representing the viewing direction
	 * @param {vec3} right the vector representing the local "right" direction
	 * @param {vec3} up    the vector representing the local "up" direction
	 * @returns {quat} out
	 */
	quat.setAxes = (function() {
	    var matr = mat3.create();
	
	    return function(out, view, right, up) {
	        matr[0] = right[0];
	        matr[3] = right[1];
	        matr[6] = right[2];
	
	        matr[1] = up[0];
	        matr[4] = up[1];
	        matr[7] = up[2];
	
	        matr[2] = -view[0];
	        matr[5] = -view[1];
	        matr[8] = -view[2];
	
	        return quat.normalize(out, quat.fromMat3(out, matr));
	    };
	})();
	
	/**
	 * Creates a new quat initialized with values from an existing quaternion
	 *
	 * @param {quat} a quaternion to clone
	 * @returns {quat} a new quaternion
	 * @function
	 */
	quat.clone = vec4.clone;
	
	/**
	 * Creates a new quat initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @param {Number} w W component
	 * @returns {quat} a new quaternion
	 * @function
	 */
	quat.fromValues = vec4.fromValues;
	
	/**
	 * Copy the values from one quat to another
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the source quaternion
	 * @returns {quat} out
	 * @function
	 */
	quat.copy = vec4.copy;
	
	/**
	 * Set the components of a quat to the given values
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @param {Number} w W component
	 * @returns {quat} out
	 * @function
	 */
	quat.set = vec4.set;
	
	/**
	 * Set a quat to the identity quaternion
	 *
	 * @param {quat} out the receiving quaternion
	 * @returns {quat} out
	 */
	quat.identity = function(out) {
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 1;
	    return out;
	};
	
	/**
	 * Sets a quat from the given angle and rotation axis,
	 * then returns it.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {vec3} axis the axis around which to rotate
	 * @param {Number} rad the angle in radians
	 * @returns {quat} out
	 **/
	quat.setAxisAngle = function(out, axis, rad) {
	    rad = rad * 0.5;
	    var s = Math.sin(rad);
	    out[0] = s * axis[0];
	    out[1] = s * axis[1];
	    out[2] = s * axis[2];
	    out[3] = Math.cos(rad);
	    return out;
	};
	
	/**
	 * Adds two quat's
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @returns {quat} out
	 * @function
	 */
	quat.add = vec4.add;
	
	/**
	 * Multiplies two quat's
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @returns {quat} out
	 */
	quat.multiply = function(out, a, b) {
	    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
	        bx = b[0], by = b[1], bz = b[2], bw = b[3];
	
	    out[0] = ax * bw + aw * bx + ay * bz - az * by;
	    out[1] = ay * bw + aw * by + az * bx - ax * bz;
	    out[2] = az * bw + aw * bz + ax * by - ay * bx;
	    out[3] = aw * bw - ax * bx - ay * by - az * bz;
	    return out;
	};
	
	/**
	 * Alias for {@link quat.multiply}
	 * @function
	 */
	quat.mul = quat.multiply;
	
	/**
	 * Scales a quat by a scalar number
	 *
	 * @param {quat} out the receiving vector
	 * @param {quat} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {quat} out
	 * @function
	 */
	quat.scale = vec4.scale;
	
	/**
	 * Rotates a quaternion by the given angle about the X axis
	 *
	 * @param {quat} out quat receiving operation result
	 * @param {quat} a quat to rotate
	 * @param {number} rad angle (in radians) to rotate
	 * @returns {quat} out
	 */
	quat.rotateX = function (out, a, rad) {
	    rad *= 0.5; 
	
	    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
	        bx = Math.sin(rad), bw = Math.cos(rad);
	
	    out[0] = ax * bw + aw * bx;
	    out[1] = ay * bw + az * bx;
	    out[2] = az * bw - ay * bx;
	    out[3] = aw * bw - ax * bx;
	    return out;
	};
	
	/**
	 * Rotates a quaternion by the given angle about the Y axis
	 *
	 * @param {quat} out quat receiving operation result
	 * @param {quat} a quat to rotate
	 * @param {number} rad angle (in radians) to rotate
	 * @returns {quat} out
	 */
	quat.rotateY = function (out, a, rad) {
	    rad *= 0.5; 
	
	    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
	        by = Math.sin(rad), bw = Math.cos(rad);
	
	    out[0] = ax * bw - az * by;
	    out[1] = ay * bw + aw * by;
	    out[2] = az * bw + ax * by;
	    out[3] = aw * bw - ay * by;
	    return out;
	};
	
	/**
	 * Rotates a quaternion by the given angle about the Z axis
	 *
	 * @param {quat} out quat receiving operation result
	 * @param {quat} a quat to rotate
	 * @param {number} rad angle (in radians) to rotate
	 * @returns {quat} out
	 */
	quat.rotateZ = function (out, a, rad) {
	    rad *= 0.5; 
	
	    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
	        bz = Math.sin(rad), bw = Math.cos(rad);
	
	    out[0] = ax * bw + ay * bz;
	    out[1] = ay * bw - ax * bz;
	    out[2] = az * bw + aw * bz;
	    out[3] = aw * bw - az * bz;
	    return out;
	};
	
	/**
	 * Calculates the W component of a quat from the X, Y, and Z components.
	 * Assumes that quaternion is 1 unit in length.
	 * Any existing W component will be ignored.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a quat to calculate W component of
	 * @returns {quat} out
	 */
	quat.calculateW = function (out, a) {
	    var x = a[0], y = a[1], z = a[2];
	
	    out[0] = x;
	    out[1] = y;
	    out[2] = z;
	    out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
	    return out;
	};
	
	/**
	 * Calculates the dot product of two quat's
	 *
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @returns {Number} dot product of a and b
	 * @function
	 */
	quat.dot = vec4.dot;
	
	/**
	 * Performs a linear interpolation between two quat's
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {quat} out
	 * @function
	 */
	quat.lerp = vec4.lerp;
	
	/**
	 * Performs a spherical linear interpolation between two quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {quat} out
	 */
	quat.slerp = function (out, a, b, t) {
	    // benchmarks:
	    //    http://jsperf.com/quaternion-slerp-implementations
	
	    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
	        bx = b[0], by = b[1], bz = b[2], bw = b[3];
	
	    var        omega, cosom, sinom, scale0, scale1;
	
	    // calc cosine
	    cosom = ax * bx + ay * by + az * bz + aw * bw;
	    // adjust signs (if necessary)
	    if ( cosom < 0.0 ) {
	        cosom = -cosom;
	        bx = - bx;
	        by = - by;
	        bz = - bz;
	        bw = - bw;
	    }
	    // calculate coefficients
	    if ( (1.0 - cosom) > 0.000001 ) {
	        // standard case (slerp)
	        omega  = Math.acos(cosom);
	        sinom  = Math.sin(omega);
	        scale0 = Math.sin((1.0 - t) * omega) / sinom;
	        scale1 = Math.sin(t * omega) / sinom;
	    } else {        
	        // "from" and "to" quaternions are very close 
	        //  ... so we can do a linear interpolation
	        scale0 = 1.0 - t;
	        scale1 = t;
	    }
	    // calculate final values
	    out[0] = scale0 * ax + scale1 * bx;
	    out[1] = scale0 * ay + scale1 * by;
	    out[2] = scale0 * az + scale1 * bz;
	    out[3] = scale0 * aw + scale1 * bw;
	    
	    return out;
	};
	
	/**
	 * Performs a spherical linear interpolation with two control points
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a the first operand
	 * @param {quat} b the second operand
	 * @param {quat} c the third operand
	 * @param {quat} d the fourth operand
	 * @param {Number} t interpolation amount
	 * @returns {quat} out
	 */
	quat.sqlerp = (function () {
	  var temp1 = quat.create();
	  var temp2 = quat.create();
	  
	  return function (out, a, b, c, d, t) {
	    quat.slerp(temp1, a, d, t);
	    quat.slerp(temp2, b, c, t);
	    quat.slerp(out, temp1, temp2, 2 * t * (1 - t));
	    
	    return out;
	  };
	}());
	
	/**
	 * Calculates the inverse of a quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a quat to calculate inverse of
	 * @returns {quat} out
	 */
	quat.invert = function(out, a) {
	    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
	        dot = a0*a0 + a1*a1 + a2*a2 + a3*a3,
	        invDot = dot ? 1.0/dot : 0;
	    
	    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0
	
	    out[0] = -a0*invDot;
	    out[1] = -a1*invDot;
	    out[2] = -a2*invDot;
	    out[3] = a3*invDot;
	    return out;
	};
	
	/**
	 * Calculates the conjugate of a quat
	 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a quat to calculate conjugate of
	 * @returns {quat} out
	 */
	quat.conjugate = function (out, a) {
	    out[0] = -a[0];
	    out[1] = -a[1];
	    out[2] = -a[2];
	    out[3] = a[3];
	    return out;
	};
	
	/**
	 * Calculates the length of a quat
	 *
	 * @param {quat} a vector to calculate length of
	 * @returns {Number} length of a
	 * @function
	 */
	quat.length = vec4.length;
	
	/**
	 * Alias for {@link quat.length}
	 * @function
	 */
	quat.len = quat.length;
	
	/**
	 * Calculates the squared length of a quat
	 *
	 * @param {quat} a vector to calculate squared length of
	 * @returns {Number} squared length of a
	 * @function
	 */
	quat.squaredLength = vec4.squaredLength;
	
	/**
	 * Alias for {@link quat.squaredLength}
	 * @function
	 */
	quat.sqrLen = quat.squaredLength;
	
	/**
	 * Normalize a quat
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {quat} a quaternion to normalize
	 * @returns {quat} out
	 * @function
	 */
	quat.normalize = vec4.normalize;
	
	/**
	 * Creates a quaternion from the given 3x3 rotation matrix.
	 *
	 * NOTE: The resultant quaternion is not normalized, so you should be sure
	 * to renormalize the quaternion yourself where necessary.
	 *
	 * @param {quat} out the receiving quaternion
	 * @param {mat3} m rotation matrix
	 * @returns {quat} out
	 * @function
	 */
	quat.fromMat3 = function(out, m) {
	    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
	    // article "Quaternion Calculus and Fast Animation".
	    var fTrace = m[0] + m[4] + m[8];
	    var fRoot;
	
	    if ( fTrace > 0.0 ) {
	        // |w| > 1/2, may as well choose w > 1/2
	        fRoot = Math.sqrt(fTrace + 1.0);  // 2w
	        out[3] = 0.5 * fRoot;
	        fRoot = 0.5/fRoot;  // 1/(4w)
	        out[0] = (m[5]-m[7])*fRoot;
	        out[1] = (m[6]-m[2])*fRoot;
	        out[2] = (m[1]-m[3])*fRoot;
	    } else {
	        // |w| <= 1/2
	        var i = 0;
	        if ( m[4] > m[0] )
	          i = 1;
	        if ( m[8] > m[i*3+i] )
	          i = 2;
	        var j = (i+1)%3;
	        var k = (i+2)%3;
	        
	        fRoot = Math.sqrt(m[i*3+i]-m[j*3+j]-m[k*3+k] + 1.0);
	        out[i] = 0.5 * fRoot;
	        fRoot = 0.5 / fRoot;
	        out[3] = (m[j*3+k] - m[k*3+j]) * fRoot;
	        out[j] = (m[j*3+i] + m[i*3+j]) * fRoot;
	        out[k] = (m[k*3+i] + m[i*3+k]) * fRoot;
	    }
	    
	    return out;
	};
	
	/**
	 * Returns a string representation of a quatenion
	 *
	 * @param {quat} vec vector to represent as a string
	 * @returns {String} string representation of the vector
	 */
	quat.str = function (a) {
	    return 'quat(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
	};
	
	module.exports = quat;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */
	
	var glMatrix = __webpack_require__(5);
	
	/**
	 * @class 3 Dimensional Vector
	 * @name vec3
	 */
	var vec3 = {};
	
	/**
	 * Creates a new, empty vec3
	 *
	 * @returns {vec3} a new 3D vector
	 */
	vec3.create = function() {
	    var out = new glMatrix.ARRAY_TYPE(3);
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	    return out;
	};
	
	/**
	 * Creates a new vec3 initialized with values from an existing vector
	 *
	 * @param {vec3} a vector to clone
	 * @returns {vec3} a new 3D vector
	 */
	vec3.clone = function(a) {
	    var out = new glMatrix.ARRAY_TYPE(3);
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    return out;
	};
	
	/**
	 * Creates a new vec3 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @returns {vec3} a new 3D vector
	 */
	vec3.fromValues = function(x, y, z) {
	    var out = new glMatrix.ARRAY_TYPE(3);
	    out[0] = x;
	    out[1] = y;
	    out[2] = z;
	    return out;
	};
	
	/**
	 * Copy the values from one vec3 to another
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the source vector
	 * @returns {vec3} out
	 */
	vec3.copy = function(out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    return out;
	};
	
	/**
	 * Set the components of a vec3 to the given values
	 *
	 * @param {vec3} out the receiving vector
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @returns {vec3} out
	 */
	vec3.set = function(out, x, y, z) {
	    out[0] = x;
	    out[1] = y;
	    out[2] = z;
	    return out;
	};
	
	/**
	 * Adds two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	vec3.add = function(out, a, b) {
	    out[0] = a[0] + b[0];
	    out[1] = a[1] + b[1];
	    out[2] = a[2] + b[2];
	    return out;
	};
	
	/**
	 * Subtracts vector b from vector a
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	vec3.subtract = function(out, a, b) {
	    out[0] = a[0] - b[0];
	    out[1] = a[1] - b[1];
	    out[2] = a[2] - b[2];
	    return out;
	};
	
	/**
	 * Alias for {@link vec3.subtract}
	 * @function
	 */
	vec3.sub = vec3.subtract;
	
	/**
	 * Multiplies two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	vec3.multiply = function(out, a, b) {
	    out[0] = a[0] * b[0];
	    out[1] = a[1] * b[1];
	    out[2] = a[2] * b[2];
	    return out;
	};
	
	/**
	 * Alias for {@link vec3.multiply}
	 * @function
	 */
	vec3.mul = vec3.multiply;
	
	/**
	 * Divides two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	vec3.divide = function(out, a, b) {
	    out[0] = a[0] / b[0];
	    out[1] = a[1] / b[1];
	    out[2] = a[2] / b[2];
	    return out;
	};
	
	/**
	 * Alias for {@link vec3.divide}
	 * @function
	 */
	vec3.div = vec3.divide;
	
	/**
	 * Returns the minimum of two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	vec3.min = function(out, a, b) {
	    out[0] = Math.min(a[0], b[0]);
	    out[1] = Math.min(a[1], b[1]);
	    out[2] = Math.min(a[2], b[2]);
	    return out;
	};
	
	/**
	 * Returns the maximum of two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	vec3.max = function(out, a, b) {
	    out[0] = Math.max(a[0], b[0]);
	    out[1] = Math.max(a[1], b[1]);
	    out[2] = Math.max(a[2], b[2]);
	    return out;
	};
	
	/**
	 * Scales a vec3 by a scalar number
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {vec3} out
	 */
	vec3.scale = function(out, a, b) {
	    out[0] = a[0] * b;
	    out[1] = a[1] * b;
	    out[2] = a[2] * b;
	    return out;
	};
	
	/**
	 * Adds two vec3's after scaling the second operand by a scalar value
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @param {Number} scale the amount to scale b by before adding
	 * @returns {vec3} out
	 */
	vec3.scaleAndAdd = function(out, a, b, scale) {
	    out[0] = a[0] + (b[0] * scale);
	    out[1] = a[1] + (b[1] * scale);
	    out[2] = a[2] + (b[2] * scale);
	    return out;
	};
	
	/**
	 * Calculates the euclidian distance between two vec3's
	 *
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {Number} distance between a and b
	 */
	vec3.distance = function(a, b) {
	    var x = b[0] - a[0],
	        y = b[1] - a[1],
	        z = b[2] - a[2];
	    return Math.sqrt(x*x + y*y + z*z);
	};
	
	/**
	 * Alias for {@link vec3.distance}
	 * @function
	 */
	vec3.dist = vec3.distance;
	
	/**
	 * Calculates the squared euclidian distance between two vec3's
	 *
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {Number} squared distance between a and b
	 */
	vec3.squaredDistance = function(a, b) {
	    var x = b[0] - a[0],
	        y = b[1] - a[1],
	        z = b[2] - a[2];
	    return x*x + y*y + z*z;
	};
	
	/**
	 * Alias for {@link vec3.squaredDistance}
	 * @function
	 */
	vec3.sqrDist = vec3.squaredDistance;
	
	/**
	 * Calculates the length of a vec3
	 *
	 * @param {vec3} a vector to calculate length of
	 * @returns {Number} length of a
	 */
	vec3.length = function (a) {
	    var x = a[0],
	        y = a[1],
	        z = a[2];
	    return Math.sqrt(x*x + y*y + z*z);
	};
	
	/**
	 * Alias for {@link vec3.length}
	 * @function
	 */
	vec3.len = vec3.length;
	
	/**
	 * Calculates the squared length of a vec3
	 *
	 * @param {vec3} a vector to calculate squared length of
	 * @returns {Number} squared length of a
	 */
	vec3.squaredLength = function (a) {
	    var x = a[0],
	        y = a[1],
	        z = a[2];
	    return x*x + y*y + z*z;
	};
	
	/**
	 * Alias for {@link vec3.squaredLength}
	 * @function
	 */
	vec3.sqrLen = vec3.squaredLength;
	
	/**
	 * Negates the components of a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a vector to negate
	 * @returns {vec3} out
	 */
	vec3.negate = function(out, a) {
	    out[0] = -a[0];
	    out[1] = -a[1];
	    out[2] = -a[2];
	    return out;
	};
	
	/**
	 * Returns the inverse of the components of a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a vector to invert
	 * @returns {vec3} out
	 */
	vec3.inverse = function(out, a) {
	  out[0] = 1.0 / a[0];
	  out[1] = 1.0 / a[1];
	  out[2] = 1.0 / a[2];
	  return out;
	};
	
	/**
	 * Normalize a vec3
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a vector to normalize
	 * @returns {vec3} out
	 */
	vec3.normalize = function(out, a) {
	    var x = a[0],
	        y = a[1],
	        z = a[2];
	    var len = x*x + y*y + z*z;
	    if (len > 0) {
	        //TODO: evaluate use of glm_invsqrt here?
	        len = 1 / Math.sqrt(len);
	        out[0] = a[0] * len;
	        out[1] = a[1] * len;
	        out[2] = a[2] * len;
	    }
	    return out;
	};
	
	/**
	 * Calculates the dot product of two vec3's
	 *
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {Number} dot product of a and b
	 */
	vec3.dot = function (a, b) {
	    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	};
	
	/**
	 * Computes the cross product of two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @returns {vec3} out
	 */
	vec3.cross = function(out, a, b) {
	    var ax = a[0], ay = a[1], az = a[2],
	        bx = b[0], by = b[1], bz = b[2];
	
	    out[0] = ay * bz - az * by;
	    out[1] = az * bx - ax * bz;
	    out[2] = ax * by - ay * bx;
	    return out;
	};
	
	/**
	 * Performs a linear interpolation between two vec3's
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {vec3} out
	 */
	vec3.lerp = function (out, a, b, t) {
	    var ax = a[0],
	        ay = a[1],
	        az = a[2];
	    out[0] = ax + t * (b[0] - ax);
	    out[1] = ay + t * (b[1] - ay);
	    out[2] = az + t * (b[2] - az);
	    return out;
	};
	
	/**
	 * Performs a hermite interpolation with two control points
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @param {vec3} c the third operand
	 * @param {vec3} d the fourth operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {vec3} out
	 */
	vec3.hermite = function (out, a, b, c, d, t) {
	  var factorTimes2 = t * t,
	      factor1 = factorTimes2 * (2 * t - 3) + 1,
	      factor2 = factorTimes2 * (t - 2) + t,
	      factor3 = factorTimes2 * (t - 1),
	      factor4 = factorTimes2 * (3 - 2 * t);
	  
	  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
	  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
	  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
	  
	  return out;
	};
	
	/**
	 * Performs a bezier interpolation with two control points
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the first operand
	 * @param {vec3} b the second operand
	 * @param {vec3} c the third operand
	 * @param {vec3} d the fourth operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {vec3} out
	 */
	vec3.bezier = function (out, a, b, c, d, t) {
	  var inverseFactor = 1 - t,
	      inverseFactorTimesTwo = inverseFactor * inverseFactor,
	      factorTimes2 = t * t,
	      factor1 = inverseFactorTimesTwo * inverseFactor,
	      factor2 = 3 * t * inverseFactorTimesTwo,
	      factor3 = 3 * factorTimes2 * inverseFactor,
	      factor4 = factorTimes2 * t;
	  
	  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
	  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
	  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
	  
	  return out;
	};
	
	/**
	 * Generates a random vector with the given scale
	 *
	 * @param {vec3} out the receiving vector
	 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
	 * @returns {vec3} out
	 */
	vec3.random = function (out, scale) {
	    scale = scale || 1.0;
	
	    var r = glMatrix.RANDOM() * 2.0 * Math.PI;
	    var z = (glMatrix.RANDOM() * 2.0) - 1.0;
	    var zScale = Math.sqrt(1.0-z*z) * scale;
	
	    out[0] = Math.cos(r) * zScale;
	    out[1] = Math.sin(r) * zScale;
	    out[2] = z * scale;
	    return out;
	};
	
	/**
	 * Transforms the vec3 with a mat4.
	 * 4th vector component is implicitly '1'
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the vector to transform
	 * @param {mat4} m matrix to transform with
	 * @returns {vec3} out
	 */
	vec3.transformMat4 = function(out, a, m) {
	    var x = a[0], y = a[1], z = a[2],
	        w = m[3] * x + m[7] * y + m[11] * z + m[15];
	    w = w || 1.0;
	    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
	    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
	    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
	    return out;
	};
	
	/**
	 * Transforms the vec3 with a mat3.
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the vector to transform
	 * @param {mat4} m the 3x3 matrix to transform with
	 * @returns {vec3} out
	 */
	vec3.transformMat3 = function(out, a, m) {
	    var x = a[0], y = a[1], z = a[2];
	    out[0] = x * m[0] + y * m[3] + z * m[6];
	    out[1] = x * m[1] + y * m[4] + z * m[7];
	    out[2] = x * m[2] + y * m[5] + z * m[8];
	    return out;
	};
	
	/**
	 * Transforms the vec3 with a quat
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec3} a the vector to transform
	 * @param {quat} q quaternion to transform with
	 * @returns {vec3} out
	 */
	vec3.transformQuat = function(out, a, q) {
	    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations
	
	    var x = a[0], y = a[1], z = a[2],
	        qx = q[0], qy = q[1], qz = q[2], qw = q[3],
	
	        // calculate quat * vec
	        ix = qw * x + qy * z - qz * y,
	        iy = qw * y + qz * x - qx * z,
	        iz = qw * z + qx * y - qy * x,
	        iw = -qx * x - qy * y - qz * z;
	
	    // calculate result * inverse quat
	    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
	    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
	    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
	    return out;
	};
	
	/**
	 * Rotate a 3D vector around the x-axis
	 * @param {vec3} out The receiving vec3
	 * @param {vec3} a The vec3 point to rotate
	 * @param {vec3} b The origin of the rotation
	 * @param {Number} c The angle of rotation
	 * @returns {vec3} out
	 */
	vec3.rotateX = function(out, a, b, c){
	   var p = [], r=[];
		  //Translate point to the origin
		  p[0] = a[0] - b[0];
		  p[1] = a[1] - b[1];
	  	p[2] = a[2] - b[2];
	
		  //perform rotation
		  r[0] = p[0];
		  r[1] = p[1]*Math.cos(c) - p[2]*Math.sin(c);
		  r[2] = p[1]*Math.sin(c) + p[2]*Math.cos(c);
	
		  //translate to correct position
		  out[0] = r[0] + b[0];
		  out[1] = r[1] + b[1];
		  out[2] = r[2] + b[2];
	
	  	return out;
	};
	
	/**
	 * Rotate a 3D vector around the y-axis
	 * @param {vec3} out The receiving vec3
	 * @param {vec3} a The vec3 point to rotate
	 * @param {vec3} b The origin of the rotation
	 * @param {Number} c The angle of rotation
	 * @returns {vec3} out
	 */
	vec3.rotateY = function(out, a, b, c){
	  	var p = [], r=[];
	  	//Translate point to the origin
	  	p[0] = a[0] - b[0];
	  	p[1] = a[1] - b[1];
	  	p[2] = a[2] - b[2];
	  
	  	//perform rotation
	  	r[0] = p[2]*Math.sin(c) + p[0]*Math.cos(c);
	  	r[1] = p[1];
	  	r[2] = p[2]*Math.cos(c) - p[0]*Math.sin(c);
	  
	  	//translate to correct position
	  	out[0] = r[0] + b[0];
	  	out[1] = r[1] + b[1];
	  	out[2] = r[2] + b[2];
	  
	  	return out;
	};
	
	/**
	 * Rotate a 3D vector around the z-axis
	 * @param {vec3} out The receiving vec3
	 * @param {vec3} a The vec3 point to rotate
	 * @param {vec3} b The origin of the rotation
	 * @param {Number} c The angle of rotation
	 * @returns {vec3} out
	 */
	vec3.rotateZ = function(out, a, b, c){
	  	var p = [], r=[];
	  	//Translate point to the origin
	  	p[0] = a[0] - b[0];
	  	p[1] = a[1] - b[1];
	  	p[2] = a[2] - b[2];
	  
	  	//perform rotation
	  	r[0] = p[0]*Math.cos(c) - p[1]*Math.sin(c);
	  	r[1] = p[0]*Math.sin(c) + p[1]*Math.cos(c);
	  	r[2] = p[2];
	  
	  	//translate to correct position
	  	out[0] = r[0] + b[0];
	  	out[1] = r[1] + b[1];
	  	out[2] = r[2] + b[2];
	  
	  	return out;
	};
	
	/**
	 * Perform some operation over an array of vec3s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */
	vec3.forEach = (function() {
	    var vec = vec3.create();
	
	    return function(a, stride, offset, count, fn, arg) {
	        var i, l;
	        if(!stride) {
	            stride = 3;
	        }
	
	        if(!offset) {
	            offset = 0;
	        }
	        
	        if(count) {
	            l = Math.min((count * stride) + offset, a.length);
	        } else {
	            l = a.length;
	        }
	
	        for(i = offset; i < l; i += stride) {
	            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2];
	            fn(vec, vec, arg);
	            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2];
	        }
	        
	        return a;
	    };
	})();
	
	/**
	 * Get the angle between two 3D vectors
	 * @param {vec3} a The first operand
	 * @param {vec3} b The second operand
	 * @returns {Number} The angle in radians
	 */
	vec3.angle = function(a, b) {
	   
	    var tempA = vec3.fromValues(a[0], a[1], a[2]);
	    var tempB = vec3.fromValues(b[0], b[1], b[2]);
	 
	    vec3.normalize(tempA, tempA);
	    vec3.normalize(tempB, tempB);
	 
	    var cosine = vec3.dot(tempA, tempB);
	
	    if(cosine > 1.0){
	        return 0;
	    } else {
	        return Math.acos(cosine);
	    }     
	};
	
	/**
	 * Returns a string representation of a vector
	 *
	 * @param {vec3} vec vector to represent as a string
	 * @returns {String} string representation of the vector
	 */
	vec3.str = function (a) {
	    return 'vec3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
	};
	
	module.exports = vec3;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */
	
	var glMatrix = __webpack_require__(5);
	
	/**
	 * @class 4 Dimensional Vector
	 * @name vec4
	 */
	var vec4 = {};
	
	/**
	 * Creates a new, empty vec4
	 *
	 * @returns {vec4} a new 4D vector
	 */
	vec4.create = function() {
	    var out = new glMatrix.ARRAY_TYPE(4);
	    out[0] = 0;
	    out[1] = 0;
	    out[2] = 0;
	    out[3] = 0;
	    return out;
	};
	
	/**
	 * Creates a new vec4 initialized with values from an existing vector
	 *
	 * @param {vec4} a vector to clone
	 * @returns {vec4} a new 4D vector
	 */
	vec4.clone = function(a) {
	    var out = new glMatrix.ARRAY_TYPE(4);
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    return out;
	};
	
	/**
	 * Creates a new vec4 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @param {Number} w W component
	 * @returns {vec4} a new 4D vector
	 */
	vec4.fromValues = function(x, y, z, w) {
	    var out = new glMatrix.ARRAY_TYPE(4);
	    out[0] = x;
	    out[1] = y;
	    out[2] = z;
	    out[3] = w;
	    return out;
	};
	
	/**
	 * Copy the values from one vec4 to another
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the source vector
	 * @returns {vec4} out
	 */
	vec4.copy = function(out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    out[2] = a[2];
	    out[3] = a[3];
	    return out;
	};
	
	/**
	 * Set the components of a vec4 to the given values
	 *
	 * @param {vec4} out the receiving vector
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @param {Number} z Z component
	 * @param {Number} w W component
	 * @returns {vec4} out
	 */
	vec4.set = function(out, x, y, z, w) {
	    out[0] = x;
	    out[1] = y;
	    out[2] = z;
	    out[3] = w;
	    return out;
	};
	
	/**
	 * Adds two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	vec4.add = function(out, a, b) {
	    out[0] = a[0] + b[0];
	    out[1] = a[1] + b[1];
	    out[2] = a[2] + b[2];
	    out[3] = a[3] + b[3];
	    return out;
	};
	
	/**
	 * Subtracts vector b from vector a
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	vec4.subtract = function(out, a, b) {
	    out[0] = a[0] - b[0];
	    out[1] = a[1] - b[1];
	    out[2] = a[2] - b[2];
	    out[3] = a[3] - b[3];
	    return out;
	};
	
	/**
	 * Alias for {@link vec4.subtract}
	 * @function
	 */
	vec4.sub = vec4.subtract;
	
	/**
	 * Multiplies two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	vec4.multiply = function(out, a, b) {
	    out[0] = a[0] * b[0];
	    out[1] = a[1] * b[1];
	    out[2] = a[2] * b[2];
	    out[3] = a[3] * b[3];
	    return out;
	};
	
	/**
	 * Alias for {@link vec4.multiply}
	 * @function
	 */
	vec4.mul = vec4.multiply;
	
	/**
	 * Divides two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	vec4.divide = function(out, a, b) {
	    out[0] = a[0] / b[0];
	    out[1] = a[1] / b[1];
	    out[2] = a[2] / b[2];
	    out[3] = a[3] / b[3];
	    return out;
	};
	
	/**
	 * Alias for {@link vec4.divide}
	 * @function
	 */
	vec4.div = vec4.divide;
	
	/**
	 * Returns the minimum of two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	vec4.min = function(out, a, b) {
	    out[0] = Math.min(a[0], b[0]);
	    out[1] = Math.min(a[1], b[1]);
	    out[2] = Math.min(a[2], b[2]);
	    out[3] = Math.min(a[3], b[3]);
	    return out;
	};
	
	/**
	 * Returns the maximum of two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {vec4} out
	 */
	vec4.max = function(out, a, b) {
	    out[0] = Math.max(a[0], b[0]);
	    out[1] = Math.max(a[1], b[1]);
	    out[2] = Math.max(a[2], b[2]);
	    out[3] = Math.max(a[3], b[3]);
	    return out;
	};
	
	/**
	 * Scales a vec4 by a scalar number
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {vec4} out
	 */
	vec4.scale = function(out, a, b) {
	    out[0] = a[0] * b;
	    out[1] = a[1] * b;
	    out[2] = a[2] * b;
	    out[3] = a[3] * b;
	    return out;
	};
	
	/**
	 * Adds two vec4's after scaling the second operand by a scalar value
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @param {Number} scale the amount to scale b by before adding
	 * @returns {vec4} out
	 */
	vec4.scaleAndAdd = function(out, a, b, scale) {
	    out[0] = a[0] + (b[0] * scale);
	    out[1] = a[1] + (b[1] * scale);
	    out[2] = a[2] + (b[2] * scale);
	    out[3] = a[3] + (b[3] * scale);
	    return out;
	};
	
	/**
	 * Calculates the euclidian distance between two vec4's
	 *
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {Number} distance between a and b
	 */
	vec4.distance = function(a, b) {
	    var x = b[0] - a[0],
	        y = b[1] - a[1],
	        z = b[2] - a[2],
	        w = b[3] - a[3];
	    return Math.sqrt(x*x + y*y + z*z + w*w);
	};
	
	/**
	 * Alias for {@link vec4.distance}
	 * @function
	 */
	vec4.dist = vec4.distance;
	
	/**
	 * Calculates the squared euclidian distance between two vec4's
	 *
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {Number} squared distance between a and b
	 */
	vec4.squaredDistance = function(a, b) {
	    var x = b[0] - a[0],
	        y = b[1] - a[1],
	        z = b[2] - a[2],
	        w = b[3] - a[3];
	    return x*x + y*y + z*z + w*w;
	};
	
	/**
	 * Alias for {@link vec4.squaredDistance}
	 * @function
	 */
	vec4.sqrDist = vec4.squaredDistance;
	
	/**
	 * Calculates the length of a vec4
	 *
	 * @param {vec4} a vector to calculate length of
	 * @returns {Number} length of a
	 */
	vec4.length = function (a) {
	    var x = a[0],
	        y = a[1],
	        z = a[2],
	        w = a[3];
	    return Math.sqrt(x*x + y*y + z*z + w*w);
	};
	
	/**
	 * Alias for {@link vec4.length}
	 * @function
	 */
	vec4.len = vec4.length;
	
	/**
	 * Calculates the squared length of a vec4
	 *
	 * @param {vec4} a vector to calculate squared length of
	 * @returns {Number} squared length of a
	 */
	vec4.squaredLength = function (a) {
	    var x = a[0],
	        y = a[1],
	        z = a[2],
	        w = a[3];
	    return x*x + y*y + z*z + w*w;
	};
	
	/**
	 * Alias for {@link vec4.squaredLength}
	 * @function
	 */
	vec4.sqrLen = vec4.squaredLength;
	
	/**
	 * Negates the components of a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a vector to negate
	 * @returns {vec4} out
	 */
	vec4.negate = function(out, a) {
	    out[0] = -a[0];
	    out[1] = -a[1];
	    out[2] = -a[2];
	    out[3] = -a[3];
	    return out;
	};
	
	/**
	 * Returns the inverse of the components of a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a vector to invert
	 * @returns {vec4} out
	 */
	vec4.inverse = function(out, a) {
	  out[0] = 1.0 / a[0];
	  out[1] = 1.0 / a[1];
	  out[2] = 1.0 / a[2];
	  out[3] = 1.0 / a[3];
	  return out;
	};
	
	/**
	 * Normalize a vec4
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a vector to normalize
	 * @returns {vec4} out
	 */
	vec4.normalize = function(out, a) {
	    var x = a[0],
	        y = a[1],
	        z = a[2],
	        w = a[3];
	    var len = x*x + y*y + z*z + w*w;
	    if (len > 0) {
	        len = 1 / Math.sqrt(len);
	        out[0] = x * len;
	        out[1] = y * len;
	        out[2] = z * len;
	        out[3] = w * len;
	    }
	    return out;
	};
	
	/**
	 * Calculates the dot product of two vec4's
	 *
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @returns {Number} dot product of a and b
	 */
	vec4.dot = function (a, b) {
	    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
	};
	
	/**
	 * Performs a linear interpolation between two vec4's
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the first operand
	 * @param {vec4} b the second operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {vec4} out
	 */
	vec4.lerp = function (out, a, b, t) {
	    var ax = a[0],
	        ay = a[1],
	        az = a[2],
	        aw = a[3];
	    out[0] = ax + t * (b[0] - ax);
	    out[1] = ay + t * (b[1] - ay);
	    out[2] = az + t * (b[2] - az);
	    out[3] = aw + t * (b[3] - aw);
	    return out;
	};
	
	/**
	 * Generates a random vector with the given scale
	 *
	 * @param {vec4} out the receiving vector
	 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
	 * @returns {vec4} out
	 */
	vec4.random = function (out, scale) {
	    scale = scale || 1.0;
	
	    //TODO: This is a pretty awful way of doing this. Find something better.
	    out[0] = glMatrix.RANDOM();
	    out[1] = glMatrix.RANDOM();
	    out[2] = glMatrix.RANDOM();
	    out[3] = glMatrix.RANDOM();
	    vec4.normalize(out, out);
	    vec4.scale(out, out, scale);
	    return out;
	};
	
	/**
	 * Transforms the vec4 with a mat4.
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the vector to transform
	 * @param {mat4} m matrix to transform with
	 * @returns {vec4} out
	 */
	vec4.transformMat4 = function(out, a, m) {
	    var x = a[0], y = a[1], z = a[2], w = a[3];
	    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
	    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
	    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
	    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
	    return out;
	};
	
	/**
	 * Transforms the vec4 with a quat
	 *
	 * @param {vec4} out the receiving vector
	 * @param {vec4} a the vector to transform
	 * @param {quat} q quaternion to transform with
	 * @returns {vec4} out
	 */
	vec4.transformQuat = function(out, a, q) {
	    var x = a[0], y = a[1], z = a[2],
	        qx = q[0], qy = q[1], qz = q[2], qw = q[3],
	
	        // calculate quat * vec
	        ix = qw * x + qy * z - qz * y,
	        iy = qw * y + qz * x - qx * z,
	        iz = qw * z + qx * y - qy * x,
	        iw = -qx * x - qy * y - qz * z;
	
	    // calculate result * inverse quat
	    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
	    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
	    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
	    out[3] = a[3];
	    return out;
	};
	
	/**
	 * Perform some operation over an array of vec4s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */
	vec4.forEach = (function() {
	    var vec = vec4.create();
	
	    return function(a, stride, offset, count, fn, arg) {
	        var i, l;
	        if(!stride) {
	            stride = 4;
	        }
	
	        if(!offset) {
	            offset = 0;
	        }
	        
	        if(count) {
	            l = Math.min((count * stride) + offset, a.length);
	        } else {
	            l = a.length;
	        }
	
	        for(i = offset; i < l; i += stride) {
	            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2]; vec[3] = a[i+3];
	            fn(vec, vec, arg);
	            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2]; a[i+3] = vec[3];
	        }
	        
	        return a;
	    };
	})();
	
	/**
	 * Returns a string representation of a vector
	 *
	 * @param {vec4} vec vector to represent as a string
	 * @returns {String} string representation of the vector
	 */
	vec4.str = function (a) {
	    return 'vec4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
	};
	
	module.exports = vec4;


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE. */
	
	var glMatrix = __webpack_require__(5);
	
	/**
	 * @class 2 Dimensional Vector
	 * @name vec2
	 */
	var vec2 = {};
	
	/**
	 * Creates a new, empty vec2
	 *
	 * @returns {vec2} a new 2D vector
	 */
	vec2.create = function() {
	    var out = new glMatrix.ARRAY_TYPE(2);
	    out[0] = 0;
	    out[1] = 0;
	    return out;
	};
	
	/**
	 * Creates a new vec2 initialized with values from an existing vector
	 *
	 * @param {vec2} a vector to clone
	 * @returns {vec2} a new 2D vector
	 */
	vec2.clone = function(a) {
	    var out = new glMatrix.ARRAY_TYPE(2);
	    out[0] = a[0];
	    out[1] = a[1];
	    return out;
	};
	
	/**
	 * Creates a new vec2 initialized with the given values
	 *
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @returns {vec2} a new 2D vector
	 */
	vec2.fromValues = function(x, y) {
	    var out = new glMatrix.ARRAY_TYPE(2);
	    out[0] = x;
	    out[1] = y;
	    return out;
	};
	
	/**
	 * Copy the values from one vec2 to another
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the source vector
	 * @returns {vec2} out
	 */
	vec2.copy = function(out, a) {
	    out[0] = a[0];
	    out[1] = a[1];
	    return out;
	};
	
	/**
	 * Set the components of a vec2 to the given values
	 *
	 * @param {vec2} out the receiving vector
	 * @param {Number} x X component
	 * @param {Number} y Y component
	 * @returns {vec2} out
	 */
	vec2.set = function(out, x, y) {
	    out[0] = x;
	    out[1] = y;
	    return out;
	};
	
	/**
	 * Adds two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {vec2} out
	 */
	vec2.add = function(out, a, b) {
	    out[0] = a[0] + b[0];
	    out[1] = a[1] + b[1];
	    return out;
	};
	
	/**
	 * Subtracts vector b from vector a
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {vec2} out
	 */
	vec2.subtract = function(out, a, b) {
	    out[0] = a[0] - b[0];
	    out[1] = a[1] - b[1];
	    return out;
	};
	
	/**
	 * Alias for {@link vec2.subtract}
	 * @function
	 */
	vec2.sub = vec2.subtract;
	
	/**
	 * Multiplies two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {vec2} out
	 */
	vec2.multiply = function(out, a, b) {
	    out[0] = a[0] * b[0];
	    out[1] = a[1] * b[1];
	    return out;
	};
	
	/**
	 * Alias for {@link vec2.multiply}
	 * @function
	 */
	vec2.mul = vec2.multiply;
	
	/**
	 * Divides two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {vec2} out
	 */
	vec2.divide = function(out, a, b) {
	    out[0] = a[0] / b[0];
	    out[1] = a[1] / b[1];
	    return out;
	};
	
	/**
	 * Alias for {@link vec2.divide}
	 * @function
	 */
	vec2.div = vec2.divide;
	
	/**
	 * Returns the minimum of two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {vec2} out
	 */
	vec2.min = function(out, a, b) {
	    out[0] = Math.min(a[0], b[0]);
	    out[1] = Math.min(a[1], b[1]);
	    return out;
	};
	
	/**
	 * Returns the maximum of two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {vec2} out
	 */
	vec2.max = function(out, a, b) {
	    out[0] = Math.max(a[0], b[0]);
	    out[1] = Math.max(a[1], b[1]);
	    return out;
	};
	
	/**
	 * Scales a vec2 by a scalar number
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the vector to scale
	 * @param {Number} b amount to scale the vector by
	 * @returns {vec2} out
	 */
	vec2.scale = function(out, a, b) {
	    out[0] = a[0] * b;
	    out[1] = a[1] * b;
	    return out;
	};
	
	/**
	 * Adds two vec2's after scaling the second operand by a scalar value
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @param {Number} scale the amount to scale b by before adding
	 * @returns {vec2} out
	 */
	vec2.scaleAndAdd = function(out, a, b, scale) {
	    out[0] = a[0] + (b[0] * scale);
	    out[1] = a[1] + (b[1] * scale);
	    return out;
	};
	
	/**
	 * Calculates the euclidian distance between two vec2's
	 *
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {Number} distance between a and b
	 */
	vec2.distance = function(a, b) {
	    var x = b[0] - a[0],
	        y = b[1] - a[1];
	    return Math.sqrt(x*x + y*y);
	};
	
	/**
	 * Alias for {@link vec2.distance}
	 * @function
	 */
	vec2.dist = vec2.distance;
	
	/**
	 * Calculates the squared euclidian distance between two vec2's
	 *
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {Number} squared distance between a and b
	 */
	vec2.squaredDistance = function(a, b) {
	    var x = b[0] - a[0],
	        y = b[1] - a[1];
	    return x*x + y*y;
	};
	
	/**
	 * Alias for {@link vec2.squaredDistance}
	 * @function
	 */
	vec2.sqrDist = vec2.squaredDistance;
	
	/**
	 * Calculates the length of a vec2
	 *
	 * @param {vec2} a vector to calculate length of
	 * @returns {Number} length of a
	 */
	vec2.length = function (a) {
	    var x = a[0],
	        y = a[1];
	    return Math.sqrt(x*x + y*y);
	};
	
	/**
	 * Alias for {@link vec2.length}
	 * @function
	 */
	vec2.len = vec2.length;
	
	/**
	 * Calculates the squared length of a vec2
	 *
	 * @param {vec2} a vector to calculate squared length of
	 * @returns {Number} squared length of a
	 */
	vec2.squaredLength = function (a) {
	    var x = a[0],
	        y = a[1];
	    return x*x + y*y;
	};
	
	/**
	 * Alias for {@link vec2.squaredLength}
	 * @function
	 */
	vec2.sqrLen = vec2.squaredLength;
	
	/**
	 * Negates the components of a vec2
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a vector to negate
	 * @returns {vec2} out
	 */
	vec2.negate = function(out, a) {
	    out[0] = -a[0];
	    out[1] = -a[1];
	    return out;
	};
	
	/**
	 * Returns the inverse of the components of a vec2
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a vector to invert
	 * @returns {vec2} out
	 */
	vec2.inverse = function(out, a) {
	  out[0] = 1.0 / a[0];
	  out[1] = 1.0 / a[1];
	  return out;
	};
	
	/**
	 * Normalize a vec2
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a vector to normalize
	 * @returns {vec2} out
	 */
	vec2.normalize = function(out, a) {
	    var x = a[0],
	        y = a[1];
	    var len = x*x + y*y;
	    if (len > 0) {
	        //TODO: evaluate use of glm_invsqrt here?
	        len = 1 / Math.sqrt(len);
	        out[0] = a[0] * len;
	        out[1] = a[1] * len;
	    }
	    return out;
	};
	
	/**
	 * Calculates the dot product of two vec2's
	 *
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {Number} dot product of a and b
	 */
	vec2.dot = function (a, b) {
	    return a[0] * b[0] + a[1] * b[1];
	};
	
	/**
	 * Computes the cross product of two vec2's
	 * Note that the cross product must by definition produce a 3D vector
	 *
	 * @param {vec3} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @returns {vec3} out
	 */
	vec2.cross = function(out, a, b) {
	    var z = a[0] * b[1] - a[1] * b[0];
	    out[0] = out[1] = 0;
	    out[2] = z;
	    return out;
	};
	
	/**
	 * Performs a linear interpolation between two vec2's
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the first operand
	 * @param {vec2} b the second operand
	 * @param {Number} t interpolation amount between the two inputs
	 * @returns {vec2} out
	 */
	vec2.lerp = function (out, a, b, t) {
	    var ax = a[0],
	        ay = a[1];
	    out[0] = ax + t * (b[0] - ax);
	    out[1] = ay + t * (b[1] - ay);
	    return out;
	};
	
	/**
	 * Generates a random vector with the given scale
	 *
	 * @param {vec2} out the receiving vector
	 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
	 * @returns {vec2} out
	 */
	vec2.random = function (out, scale) {
	    scale = scale || 1.0;
	    var r = glMatrix.RANDOM() * 2.0 * Math.PI;
	    out[0] = Math.cos(r) * scale;
	    out[1] = Math.sin(r) * scale;
	    return out;
	};
	
	/**
	 * Transforms the vec2 with a mat2
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the vector to transform
	 * @param {mat2} m matrix to transform with
	 * @returns {vec2} out
	 */
	vec2.transformMat2 = function(out, a, m) {
	    var x = a[0],
	        y = a[1];
	    out[0] = m[0] * x + m[2] * y;
	    out[1] = m[1] * x + m[3] * y;
	    return out;
	};
	
	/**
	 * Transforms the vec2 with a mat2d
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the vector to transform
	 * @param {mat2d} m matrix to transform with
	 * @returns {vec2} out
	 */
	vec2.transformMat2d = function(out, a, m) {
	    var x = a[0],
	        y = a[1];
	    out[0] = m[0] * x + m[2] * y + m[4];
	    out[1] = m[1] * x + m[3] * y + m[5];
	    return out;
	};
	
	/**
	 * Transforms the vec2 with a mat3
	 * 3rd vector component is implicitly '1'
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the vector to transform
	 * @param {mat3} m matrix to transform with
	 * @returns {vec2} out
	 */
	vec2.transformMat3 = function(out, a, m) {
	    var x = a[0],
	        y = a[1];
	    out[0] = m[0] * x + m[3] * y + m[6];
	    out[1] = m[1] * x + m[4] * y + m[7];
	    return out;
	};
	
	/**
	 * Transforms the vec2 with a mat4
	 * 3rd vector component is implicitly '0'
	 * 4th vector component is implicitly '1'
	 *
	 * @param {vec2} out the receiving vector
	 * @param {vec2} a the vector to transform
	 * @param {mat4} m matrix to transform with
	 * @returns {vec2} out
	 */
	vec2.transformMat4 = function(out, a, m) {
	    var x = a[0], 
	        y = a[1];
	    out[0] = m[0] * x + m[4] * y + m[12];
	    out[1] = m[1] * x + m[5] * y + m[13];
	    return out;
	};
	
	/**
	 * Perform some operation over an array of vec2s.
	 *
	 * @param {Array} a the array of vectors to iterate over
	 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
	 * @param {Number} offset Number of elements to skip at the beginning of the array
	 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
	 * @param {Function} fn Function to call for each vector in the array
	 * @param {Object} [arg] additional argument to pass to fn
	 * @returns {Array} a
	 * @function
	 */
	vec2.forEach = (function() {
	    var vec = vec2.create();
	
	    return function(a, stride, offset, count, fn, arg) {
	        var i, l;
	        if(!stride) {
	            stride = 2;
	        }
	
	        if(!offset) {
	            offset = 0;
	        }
	        
	        if(count) {
	            l = Math.min((count * stride) + offset, a.length);
	        } else {
	            l = a.length;
	        }
	
	        for(i = offset; i < l; i += stride) {
	            vec[0] = a[i]; vec[1] = a[i+1];
	            fn(vec, vec, arg);
	            a[i] = vec[0]; a[i+1] = vec[1];
	        }
	        
	        return a;
	    };
	})();
	
	/**
	 * Returns a string representation of a vector
	 *
	 * @param {vec2} vec vector to represent as a string
	 * @returns {String} string representation of the vector
	 */
	vec2.str = function (a) {
	    return 'vec2(' + a[0] + ', ' + a[1] + ')';
	};
	
	module.exports = vec2;


/***/ },
/* 14 */
/***/ function(module, exports) {

	module.exports = {
		"face": {
			"position": [
				0.0382,
				-0.0637,
				0.2898,
				0,
				-0.0595,
				0.3059,
				0,
				-0.1035,
				0.3367,
				0.0385,
				-0.1046,
				0.3195,
				0.0362,
				0.0816,
				0.2139,
				0,
				0.0884,
				0.2264,
				0,
				0,
				0.2667,
				0.0424,
				-0.0086,
				0.2526,
				0.075,
				0.0458,
				0.1699,
				0.0768,
				-0.0414,
				0.1949,
				0,
				-0.1535,
				0.3383,
				0.0385,
				-0.149,
				0.3228,
				0.0915,
				-0.1514,
				0.2556,
				0.093,
				-0.1199,
				0.2456,
				0,
				-0.1848,
				0.3138,
				0.0339,
				-0.1775,
				0.3015,
				0.0803,
				-0.1711,
				0.2587,
				0.0147,
				-0.1903,
				0.2761,
				0,
				-0.1953,
				0.2777,
				0.0308,
				-0.201,
				0.243,
				0,
				-0.2085,
				0.2497,
				0.1212,
				-0.0547,
				0.166,
				0.1832,
				-0.0105,
				0.1372,
				0.2343,
				-0.0855,
				0.1284,
				0.1761,
				-0.1329,
				0.1536,
				0.2219,
				-0.2308,
				0.1225,
				0.242,
				-0.2794,
				0.1088,
				0.3065,
				-0.2407,
				0.04117,
				0.2906,
				-0.1915,
				0.07037,
				0.173,
				-0.2579,
				0.1533,
				0.1935,
				-0.3033,
				0.1475,
				0.2683,
				-0.1395,
				0.1034,
				0.2002,
				-0.1803,
				0.1381,
				0.1532,
				-0.2071,
				0.1599,
				0.316,
				-0.2869,
				0.01847,
				0.2565,
				-0.3244,
				0.09657,
				0.2062,
				-0.3399,
				0.1401,
				0.3208,
				-0.3585,
				-0.01213,
				0.2384,
				-0.4121,
				0.09887,
				0.1942,
				-0.398,
				0.1441,
				0.1389,
				-0.3195,
				0.1937,
				0.1494,
				-0.3394,
				0.1621,
				0.1675,
				-0.3243,
				0.1634,
				0.1441,
				-0.2947,
				0.187,
				0.0772,
				-0.4293,
				0.2032,
				0,
				-0.4403,
				0.2312,
				0,
				-0.4751,
				0.2171,
				0.0958,
				-0.4704,
				0.1916,
				0.1266,
				-0.4083,
				0.182,
				0.1474,
				-0.3538,
				0.1525,
				0.116,
				-0.385,
				0.1854,
				0.1679,
				-0.3756,
				0.1552,
				0.0893,
				-0.2892,
				0.2304,
				0.0756,
				-0.3043,
				0.2452,
				0.166,
				-0.3478,
				0.1502,
				0.1813,
				-0.3445,
				0.1496,
				0.1542,
				-0.346,
				0.1483,
				0.1419,
				-0.3524,
				0.1462,
				0.1219,
				-0.3365,
				0.174,
				0.1411,
				-0.342,
				0.1533,
				0.1325,
				-0.3287,
				0.1877,
				0.0726,
				-0.321,
				0.238,
				0.0665,
				-0.3302,
				0.2175,
				0,
				-0.3067,
				0.2613,
				0,
				-0.3211,
				0.2579,
				0,
				-0.3293,
				0.2364,
				0.125,
				-0.2197,
				0.1805,
				0.0554,
				-0.2347,
				0.2291,
				0.0403,
				-0.282,
				0.2461,
				0,
				-0.2889,
				0.253,
				0.1074,
				-0.1759,
				0.1806,
				0.1349,
				-0.1632,
				0.1647,
				0,
				-0.2425,
				0.2392,
				0.1186,
				-0.1511,
				0.18,
				0,
				-0.5273,
				0.2274,
				0.1136,
				-0.5194,
				0.1897,
				0.229,
				-0.5102,
				0.05837,
				0.3185,
				-0.4287,
				-0.04543,
				0.3501,
				-0.3836,
				-0.1004,
				0.3452,
				-0.3205,
				-0.06533,
				0.3822,
				-0.3111,
				-0.1797,
				0.3749,
				-0.2628,
				-0.1356,
				0.4374,
				0.1364,
				-0.3125,
				0.4293,
				0.2308,
				-0.3058,
				0.3968,
				0.2382,
				-0.09793,
				0.4166,
				0.0456,
				-0.1325,
				0.4383,
				0.0538,
				-0.3135,
				0.4146,
				-0.0275,
				-0.1609,
				0.4097,
				-0.0817,
				-0.189,
				0.4087,
				-0.1254,
				-0.2122,
				0.4289,
				-0.0892,
				-0.2921,
				0.4362,
				-0.014,
				-0.3057,
				0.4104,
				-0.1863,
				-0.2633,
				0.3564,
				0.3587,
				-0.09863,
				0.4126,
				0.345,
				-0.2828,
				0.3908,
				0.447,
				-0.2492,
				0.3253,
				0.4758,
				-0.1218,
				0.1182,
				-0.5897,
				0.1615,
				0.1384,
				0.1366,
				0.1099,
				0.122,
				0.1457,
				0.1383,
				0.0892,
				0.1102,
				0.1243,
				0.1102,
				0.1075,
				0.1067,
				0.1891,
				0.0405,
				0.1217,
				0.1861,
				0.0672,
				0.115,
				0.1363,
				0.0889,
				0.1094,
				0.1201,
				0.0699,
				0.1233,
				0.2323,
				0.0618,
				0.1057,
				0.2381,
				0.0356,
				0.1045,
				0.2843,
				0.0776,
				0.07607,
				0.2947,
				0.0567,
				0.06887,
				0.3367,
				0.1024,
				0.02337,
				0.3215,
				0.1103,
				0.03567,
				0.3318,
				0.1421,
				0.06617,
				0.3184,
				0.1346,
				0.06177,
				0.3099,
				0.263,
				0.1161,
				0.1514,
				0.1273,
				0.1042,
				0.1288,
				0.1081,
				0.09887,
				0.1857,
				0.0927,
				0.11,
				0.1511,
				0.1068,
				0.1015,
				0.2297,
				0.0869,
				0.1048,
				0.3097,
				0.1162,
				0.04417,
				0.2797,
				0.096,
				0.07777,
				0.1422,
				0.1135,
				0.09127,
				0.2335,
				0.1701,
				0.1107,
				0.1823,
				0.16,
				0.1103,
				0.1831,
				0.148,
				0.1068,
				0.2322,
				0.1568,
				0.1093,
				0.2523,
				0.217,
				0.1621,
				0.1852,
				0.2017,
				0.1782,
				0.1813,
				0.1643,
				0.1353,
				0.2398,
				0.174,
				0.1326,
				0.1087,
				0.1725,
				0.1857,
				0.0656,
				0.1195,
				0.1657,
				0.2538,
				-0.0034,
				0.1122,
				0.3189,
				0.0274,
				0.05967,
				0.3622,
				0.0862,
				0.007567,
				0.3523,
				0.1768,
				0.07357,
				0.3045,
				0.2032,
				0.1256,
				0.2539,
				0.288,
				0.165,
				0.0341,
				0.1289,
				0.2043,
				0.0728,
				0.2393,
				0.219,
				0.3701,
				0.2128,
				0.01807,
				0,
				0.1313,
				0.2148,
				0,
				0.2437,
				0.2235,
				0.2511,
				0.3352,
				0.1467,
				0.2533,
				0.3979,
				0.1037,
				0.12,
				0.4175,
				0.1628,
				0.1189,
				0.3357,
				0.1988,
				0,
				0.4192,
				0.1748,
				0,
				0.3326,
				0.2055,
				0.1235,
				0.5276,
				0.07787,
				0.2449,
				0.5119,
				0.01657,
				0,
				0.5359,
				0.09307,
				0.3286,
				0.5511,
				-0.172,
				0.2381,
				0.6051,
				-0.1011,
				0,
				0.6365,
				-0.02883,
				0.1195,
				0.6298,
				-0.05053,
				0.3888,
				0.0584,
				-0.02123,
				0.3496,
				-0.0227,
				0.04617,
				0.285,
				-0.0644,
				0.1039,
				0.309,
				-0.1166,
				0.07537,
				0.3245,
				-0.1683,
				0.03587,
				0.3338,
				-0.2148,
				0.0006667,
				0.3385,
				-0.2569,
				-0.02873,
				0.3632,
				-0.0696,
				0.01547,
				0.367,
				-0.1213,
				-0.02653,
				0.3705,
				-0.1653,
				-0.06503,
				0.3719,
				-0.2045,
				-0.09703,
				0.3052,
				0.1258,
				0.06487,
				0.125,
				-0.1272,
				0.1702,
				0.088,
				-0.0903,
				0.2305,
				0.111,
				-0.3732,
				0.1805,
				0.1795,
				0.2777,
				0.1918,
				0.2905,
				0.1615,
				0.09957,
				0.2798,
				0.1583,
				0.08717,
				0.2772,
				0.1459,
				0.08567,
				0.1066,
				-0.3661,
				0.1724,
				0,
				-0.6053,
				0.1965,
				0.0711,
				-0.4087,
				0.2161,
				0.0677,
				-0.3893,
				0.2112,
				0,
				-0.4152,
				0.244,
				0,
				-0.392,
				0.2396,
				0.0663,
				-0.3813,
				0.1991,
				0,
				-0.3829,
				0.2279,
				-0.0382,
				-0.0637,
				0.2898,
				-0.0385,
				-0.1046,
				0.3195,
				-0.0362,
				0.0816,
				0.2139,
				-0.0424,
				-0.0086,
				0.2526,
				-0.075,
				0.0458,
				0.1699,
				-0.0768,
				-0.0414,
				0.1949,
				-0.0385,
				-0.149,
				0.3228,
				-0.0915,
				-0.1514,
				0.2556,
				-0.093,
				-0.1199,
				0.2456,
				-0.0339,
				-0.1775,
				0.3015,
				-0.0803,
				-0.1711,
				0.2587,
				-0.0147,
				-0.1903,
				0.2761,
				-0.0308,
				-0.201,
				0.243,
				-0.1212,
				-0.0547,
				0.166,
				-0.1832,
				-0.0105,
				0.1372,
				-0.2343,
				-0.0855,
				0.1284,
				-0.1761,
				-0.1329,
				0.1536,
				-0.2219,
				-0.2308,
				0.1225,
				-0.3065,
				-0.2407,
				0.04117,
				-0.242,
				-0.2794,
				0.1088,
				-0.2906,
				-0.1915,
				0.07037,
				-0.173,
				-0.2579,
				0.1533,
				-0.1935,
				-0.3033,
				0.1475,
				-0.2002,
				-0.1803,
				0.1381,
				-0.2683,
				-0.1395,
				0.1034,
				-0.1532,
				-0.2071,
				0.1599,
				-0.316,
				-0.2869,
				0.01847,
				-0.2565,
				-0.3244,
				0.09657,
				-0.2062,
				-0.3399,
				0.1401,
				-0.3208,
				-0.3585,
				-0.01213,
				-0.2384,
				-0.4121,
				0.09887,
				-0.1942,
				-0.398,
				0.1441,
				-0.1389,
				-0.3195,
				0.1937,
				-0.1441,
				-0.2947,
				0.187,
				-0.1675,
				-0.3243,
				0.1634,
				-0.1494,
				-0.3394,
				0.1621,
				-0.0772,
				-0.4293,
				0.2032,
				-0.0958,
				-0.4704,
				0.1916,
				-0.1266,
				-0.4083,
				0.182,
				-0.1474,
				-0.3538,
				0.1525,
				-0.1679,
				-0.3756,
				0.1552,
				-0.116,
				-0.385,
				0.1854,
				-0.0756,
				-0.3043,
				0.2452,
				-0.0893,
				-0.2892,
				0.2304,
				-0.166,
				-0.3478,
				0.1502,
				-0.1813,
				-0.3445,
				0.1496,
				-0.1542,
				-0.346,
				0.1483,
				-0.1419,
				-0.3524,
				0.1462,
				-0.1219,
				-0.3365,
				0.174,
				-0.1325,
				-0.3287,
				0.1877,
				-0.1411,
				-0.342,
				0.1533,
				-0.0726,
				-0.321,
				0.238,
				-0.0665,
				-0.3302,
				0.2175,
				-0.125,
				-0.2197,
				0.1805,
				-0.0554,
				-0.2347,
				0.2291,
				-0.0403,
				-0.282,
				0.2461,
				-0.1074,
				-0.1759,
				0.1806,
				-0.1349,
				-0.1632,
				0.1647,
				-0.1186,
				-0.1511,
				0.18,
				-0.1136,
				-0.5194,
				0.1897,
				-0.229,
				-0.5102,
				0.05837,
				-0.3185,
				-0.4287,
				-0.04543,
				-0.3452,
				-0.3205,
				-0.06533,
				-0.3501,
				-0.3836,
				-0.1004,
				-0.3822,
				-0.3111,
				-0.1797,
				-0.3749,
				-0.2628,
				-0.1356,
				-0.4374,
				0.1364,
				-0.3125,
				-0.3968,
				0.2382,
				-0.09793,
				-0.4293,
				0.2308,
				-0.3058,
				-0.4166,
				0.0456,
				-0.1325,
				-0.4383,
				0.0538,
				-0.3135,
				-0.4146,
				-0.0275,
				-0.1609,
				-0.4097,
				-0.0817,
				-0.189,
				-0.4289,
				-0.0892,
				-0.2921,
				-0.4087,
				-0.1254,
				-0.2122,
				-0.4362,
				-0.014,
				-0.3057,
				-0.4104,
				-0.1863,
				-0.2633,
				-0.3564,
				0.3587,
				-0.09863,
				-0.4126,
				0.345,
				-0.2828,
				-0.3908,
				0.447,
				-0.2492,
				-0.3253,
				0.4758,
				-0.1218,
				-0.1182,
				-0.5897,
				0.1615,
				-0.1384,
				0.1366,
				0.1099,
				-0.0892,
				0.1102,
				0.1243,
				-0.122,
				0.1457,
				0.1383,
				-0.1102,
				0.1075,
				0.1067,
				-0.1891,
				0.0405,
				0.1217,
				-0.1363,
				0.0889,
				0.1094,
				-0.1861,
				0.0672,
				0.115,
				-0.1201,
				0.0699,
				0.1233,
				-0.2323,
				0.0618,
				0.1057,
				-0.2381,
				0.0356,
				0.1045,
				-0.2843,
				0.0776,
				0.07607,
				-0.3367,
				0.1024,
				0.02337,
				-0.2947,
				0.0567,
				0.06887,
				-0.3215,
				0.1103,
				0.03567,
				-0.3318,
				0.1421,
				0.06617,
				-0.3184,
				0.1346,
				0.06177,
				-0.3099,
				0.263,
				0.1161,
				-0.1514,
				0.1273,
				0.1042,
				-0.1288,
				0.1081,
				0.09887,
				-0.1511,
				0.1068,
				0.1015,
				-0.1857,
				0.0927,
				0.11,
				-0.2297,
				0.0869,
				0.1048,
				-0.3097,
				0.1162,
				0.04417,
				-0.2797,
				0.096,
				0.07777,
				-0.1422,
				0.1135,
				0.09127,
				-0.2335,
				0.1701,
				0.1107,
				-0.2322,
				0.1568,
				0.1093,
				-0.1831,
				0.148,
				0.1068,
				-0.1823,
				0.16,
				0.1103,
				-0.2523,
				0.217,
				0.1621,
				-0.2398,
				0.174,
				0.1326,
				-0.1813,
				0.1643,
				0.1353,
				-0.1852,
				0.2017,
				0.1782,
				-0.1087,
				0.1725,
				0.1857,
				-0.0656,
				0.1195,
				0.1657,
				-0.2538,
				-0.0034,
				0.1122,
				-0.3189,
				0.0274,
				0.05967,
				-0.3622,
				0.0862,
				0.007567,
				-0.3523,
				0.1768,
				0.07357,
				-0.2539,
				0.288,
				0.165,
				-0.3045,
				0.2032,
				0.1256,
				-0.0341,
				0.1289,
				0.2043,
				-0.0728,
				0.2393,
				0.219,
				-0.3701,
				0.2128,
				0.01807,
				-0.2511,
				0.3352,
				0.1467,
				-0.12,
				0.4175,
				0.1628,
				-0.2533,
				0.3979,
				0.1037,
				-0.1189,
				0.3357,
				0.1988,
				-0.1235,
				0.5276,
				0.07787,
				-0.2449,
				0.5119,
				0.01657,
				-0.3286,
				0.5511,
				-0.172,
				-0.2381,
				0.6051,
				-0.1011,
				-0.1195,
				0.6298,
				-0.05053,
				-0.3888,
				0.0584,
				-0.02123,
				-0.3496,
				-0.0227,
				0.04617,
				-0.285,
				-0.0644,
				0.1039,
				-0.309,
				-0.1166,
				0.07537,
				-0.3245,
				-0.1683,
				0.03587,
				-0.3338,
				-0.2148,
				0.0006667,
				-0.3385,
				-0.2569,
				-0.02873,
				-0.3632,
				-0.0696,
				0.01547,
				-0.367,
				-0.1213,
				-0.02653,
				-0.3705,
				-0.1653,
				-0.06503,
				-0.3719,
				-0.2045,
				-0.09703,
				-0.3052,
				0.1258,
				0.06487,
				-0.125,
				-0.1272,
				0.1702,
				-0.088,
				-0.0903,
				0.2305,
				-0.111,
				-0.3732,
				0.1805,
				-0.1795,
				0.2777,
				0.1918,
				-0.2905,
				0.1615,
				0.09957,
				-0.2798,
				0.1583,
				0.08717,
				-0.2772,
				0.1459,
				0.08567,
				-0.1066,
				-0.3661,
				0.1724,
				-0.0711,
				-0.4087,
				0.2161,
				-0.0677,
				-0.3893,
				0.2112,
				-0.0663,
				-0.3813,
				0.1991
			],
			"index": [
				2,
				0,
				1,
				0,
				2,
				3,
				6,
				4,
				5,
				4,
				6,
				7,
				7,
				8,
				4,
				8,
				7,
				9,
				10,
				3,
				2,
				3,
				10,
				11,
				12,
				3,
				11,
				3,
				12,
				13,
				15,
				10,
				14,
				10,
				15,
				11,
				16,
				11,
				15,
				11,
				16,
				12,
				14,
				17,
				15,
				17,
				14,
				18,
				18,
				19,
				17,
				19,
				18,
				20,
				17,
				16,
				15,
				16,
				17,
				19,
				0,
				6,
				1,
				6,
				0,
				7,
				9,
				21,
				8,
				21,
				22,
				8,
				21,
				23,
				22,
				23,
				21,
				24,
				27,
				25,
				26,
				25,
				27,
				28,
				26,
				29,
				30,
				29,
				26,
				25,
				32,
				28,
				31,
				28,
				32,
				25,
				33,
				25,
				32,
				25,
				33,
				29,
				26,
				34,
				27,
				34,
				26,
				35,
				30,
				35,
				26,
				35,
				30,
				36,
				35,
				37,
				34,
				37,
				35,
				38,
				36,
				38,
				35,
				38,
				36,
				39,
				43,
				40,
				41,
				43,
				41,
				42,
				47,
				44,
				45,
				47,
				45,
				46,
				48,
				44,
				47,
				51,
				49,
				50,
				51,
				50,
				48,
				53,
				40,
				43,
				53,
				43,
				52,
				41,
				54,
				55,
				41,
				55,
				42,
				56,
				49,
				54,
				56,
				57,
				49,
				60,
				58,
				59,
				60,
				59,
				41,
				56,
				41,
				59,
				61,
				60,
				40,
				61,
				40,
				53,
				60,
				41,
				40,
				41,
				56,
				54,
				62,
				58,
				60,
				62,
				60,
				61,
				55,
				54,
				49,
				55,
				49,
				51,
				64,
				61,
				53,
				64,
				53,
				63,
				65,
				62,
				61,
				65,
				61,
				64,
				36,
				51,
				39,
				51,
				36,
				55,
				36,
				42,
				55,
				42,
				36,
				30,
				30,
				43,
				42,
				43,
				30,
				29,
				66,
				29,
				33,
				29,
				66,
				43,
				66,
				67,
				52,
				66,
				52,
				43,
				68,
				63,
				53,
				69,
				63,
				68,
				33,
				70,
				66,
				70,
				33,
				71,
				70,
				67,
				66,
				67,
				70,
				19,
				67,
				20,
				72,
				20,
				67,
				19,
				32,
				71,
				33,
				71,
				32,
				24,
				31,
				24,
				32,
				24,
				31,
				23,
				16,
				70,
				12,
				70,
				16,
				19,
				71,
				73,
				70,
				46,
				74,
				75,
				46,
				75,
				47,
				72,
				69,
				68,
				37,
				76,
				77,
				76,
				37,
				38,
				79,
				77,
				78,
				77,
				79,
				37,
				79,
				80,
				81,
				80,
				79,
				78,
				84,
				82,
				83,
				82,
				84,
				85,
				85,
				86,
				82,
				86,
				85,
				87,
				90,
				88,
				89,
				88,
				90,
				91,
				92,
				81,
				80,
				83,
				93,
				84,
				93,
				83,
				94,
				95,
				93,
				94,
				93,
				95,
				96,
				48,
				47,
				39,
				13,
				12,
				73,
				12,
				70,
				73,
				68,
				53,
				52,
				97,
				38,
				75,
				38,
				97,
				76,
				100,
				98,
				99,
				98,
				100,
				101,
				104,
				102,
				103,
				102,
				104,
				105,
				102,
				106,
				103,
				106,
				102,
				107,
				110,
				108,
				109,
				108,
				110,
				111,
				112,
				111,
				110,
				111,
				112,
				113,
				84,
				93,
				114,
				101,
				115,
				98,
				115,
				101,
				116,
				118,
				103,
				117,
				103,
				118,
				104,
				103,
				119,
				117,
				119,
				103,
				106,
				108,
				120,
				121,
				120,
				108,
				111,
				122,
				115,
				116,
				126,
				123,
				124,
				126,
				124,
				125,
				130,
				127,
				128,
				130,
				128,
				129,
				105,
				101,
				100,
				101,
				105,
				104,
				104,
				116,
				101,
				116,
				104,
				118,
				106,
				109,
				108,
				109,
				106,
				107,
				119,
				108,
				121,
				108,
				119,
				106,
				125,
				124,
				98,
				125,
				98,
				115,
				124,
				123,
				130,
				124,
				130,
				129,
				131,
				100,
				99,
				100,
				131,
				132,
				8,
				102,
				105,
				102,
				8,
				22,
				22,
				107,
				102,
				107,
				22,
				133,
				134,
				110,
				109,
				110,
				134,
				135,
				135,
				112,
				110,
				112,
				135,
				136,
				98,
				124,
				129,
				98,
				129,
				99,
				138,
				127,
				137,
				138,
				137,
				114,
				132,
				105,
				100,
				105,
				132,
				8,
				133,
				109,
				107,
				109,
				133,
				134,
				8,
				139,
				4,
				139,
				8,
				132,
				132,
				140,
				139,
				140,
				132,
				131,
				114,
				137,
				136,
				114,
				136,
				141,
				114,
				141,
				84,
				4,
				142,
				5,
				142,
				4,
				139,
				139,
				143,
				142,
				143,
				139,
				140,
				146,
				144,
				145,
				144,
				146,
				147,
				145,
				114,
				93,
				114,
				145,
				144,
				148,
				147,
				146,
				147,
				148,
				149,
				145,
				150,
				146,
				150,
				145,
				151,
				93,
				151,
				145,
				151,
				93,
				96,
				150,
				148,
				146,
				148,
				150,
				152,
				151,
				153,
				154,
				151,
				96,
				153,
				150,
				155,
				152,
				155,
				150,
				156,
				157,
				136,
				135,
				136,
				157,
				141,
				135,
				158,
				157,
				158,
				135,
				134,
				134,
				159,
				158,
				159,
				134,
				133,
				133,
				23,
				159,
				23,
				133,
				22,
				31,
				159,
				23,
				159,
				31,
				160,
				27,
				161,
				28,
				161,
				27,
				162,
				28,
				160,
				31,
				160,
				28,
				161,
				34,
				162,
				27,
				162,
				34,
				163,
				79,
				34,
				37,
				34,
				79,
				163,
				160,
				158,
				159,
				158,
				160,
				164,
				162,
				165,
				161,
				165,
				162,
				166,
				161,
				164,
				160,
				164,
				161,
				165,
				163,
				166,
				162,
				166,
				163,
				167,
				81,
				163,
				79,
				163,
				81,
				167,
				164,
				157,
				158,
				157,
				164,
				85,
				166,
				87,
				165,
				87,
				166,
				88,
				165,
				85,
				164,
				85,
				165,
				87,
				167,
				88,
				166,
				88,
				167,
				89,
				92,
				167,
				81,
				167,
				92,
				89,
				85,
				141,
				157,
				141,
				85,
				84,
				120,
				113,
				168,
				113,
				120,
				111,
				170,
				169,
				9,
				91,
				87,
				88,
				87,
				91,
				86,
				154,
				150,
				151,
				150,
				154,
				156,
				153,
				96,
				95,
				50,
				49,
				171,
				47,
				38,
				39,
				38,
				47,
				75,
				52,
				67,
				68,
				72,
				68,
				67,
				118,
				122,
				116,
				143,
				147,
				149,
				147,
				143,
				140,
				172,
				147,
				140,
				140,
				131,
				128,
				140,
				128,
				172,
				129,
				128,
				131,
				129,
				131,
				99,
				112,
				136,
				137,
				112,
				137,
				173,
				112,
				173,
				174,
				112,
				174,
				113,
				174,
				175,
				168,
				174,
				168,
				113,
				173,
				137,
				127,
				173,
				127,
				130,
				173,
				130,
				123,
				173,
				123,
				174,
				123,
				126,
				175,
				123,
				175,
				174,
				144,
				147,
				172,
				144,
				138,
				114,
				172,
				138,
				144,
				172,
				128,
				127,
				172,
				127,
				138,
				48,
				39,
				51,
				90,
				89,
				92,
				49,
				57,
				176,
				49,
				176,
				171,
				74,
				177,
				97,
				74,
				97,
				75,
				3,
				170,
				0,
				170,
				3,
				13,
				170,
				7,
				0,
				7,
				170,
				9,
				21,
				9,
				169,
				169,
				24,
				21,
				24,
				169,
				71,
				50,
				178,
				44,
				50,
				44,
				48,
				171,
				179,
				178,
				171,
				178,
				50,
				44,
				178,
				180,
				44,
				180,
				45,
				181,
				180,
				178,
				181,
				178,
				179,
				183,
				181,
				179,
				183,
				179,
				182,
				73,
				71,
				169,
				169,
				13,
				73,
				13,
				169,
				170,
				182,
				179,
				171,
				182,
				171,
				176,
				1,
				184,
				2,
				185,
				2,
				184,
				5,
				186,
				6,
				187,
				6,
				186,
				186,
				188,
				187,
				189,
				187,
				188,
				2,
				185,
				10,
				190,
				10,
				185,
				190,
				185,
				191,
				192,
				191,
				185,
				14,
				10,
				193,
				190,
				193,
				10,
				193,
				190,
				194,
				191,
				194,
				190,
				193,
				195,
				14,
				18,
				14,
				195,
				195,
				196,
				18,
				20,
				18,
				196,
				193,
				194,
				195,
				196,
				195,
				194,
				1,
				6,
				184,
				187,
				184,
				6,
				188,
				197,
				189,
				188,
				198,
				197,
				198,
				199,
				197,
				200,
				197,
				199,
				203,
				201,
				202,
				204,
				202,
				201,
				206,
				205,
				203,
				201,
				203,
				205,
				208,
				204,
				207,
				201,
				207,
				204,
				207,
				201,
				209,
				205,
				209,
				201,
				202,
				210,
				203,
				211,
				203,
				210,
				203,
				211,
				206,
				212,
				206,
				211,
				210,
				213,
				211,
				214,
				211,
				213,
				211,
				214,
				212,
				215,
				212,
				214,
				219,
				216,
				217,
				219,
				217,
				218,
				45,
				220,
				221,
				45,
				221,
				46,
				221,
				220,
				222,
				225,
				223,
				224,
				225,
				224,
				222,
				217,
				216,
				226,
				217,
				226,
				227,
				229,
				228,
				219,
				229,
				219,
				218,
				223,
				230,
				228,
				231,
				230,
				223,
				234,
				232,
				233,
				234,
				233,
				219,
				234,
				219,
				230,
				216,
				233,
				235,
				216,
				235,
				226,
				219,
				233,
				216,
				228,
				230,
				219,
				233,
				232,
				236,
				233,
				236,
				235,
				223,
				228,
				229,
				223,
				229,
				224,
				226,
				235,
				64,
				226,
				64,
				63,
				235,
				236,
				65,
				235,
				65,
				64,
				215,
				224,
				212,
				229,
				212,
				224,
				229,
				218,
				212,
				206,
				212,
				218,
				218,
				217,
				206,
				205,
				206,
				217,
				209,
				205,
				237,
				217,
				237,
				205,
				227,
				238,
				237,
				217,
				227,
				237,
				226,
				63,
				239,
				239,
				63,
				69,
				237,
				240,
				209,
				241,
				209,
				240,
				237,
				238,
				240,
				196,
				240,
				238,
				72,
				20,
				238,
				196,
				238,
				20,
				209,
				241,
				207,
				200,
				207,
				241,
				207,
				200,
				208,
				199,
				208,
				200,
				191,
				240,
				194,
				196,
				194,
				240,
				240,
				242,
				241,
				243,
				74,
				46,
				243,
				46,
				221,
				239,
				69,
				72,
				245,
				244,
				213,
				214,
				213,
				244,
				247,
				245,
				246,
				213,
				246,
				245,
				249,
				248,
				246,
				247,
				246,
				248,
				252,
				250,
				251,
				253,
				251,
				250,
				250,
				254,
				253,
				255,
				253,
				254,
				258,
				256,
				257,
				259,
				257,
				256,
				248,
				249,
				260,
				251,
				261,
				252,
				262,
				252,
				261,
				262,
				261,
				263,
				264,
				263,
				261,
				215,
				221,
				222,
				242,
				191,
				192,
				242,
				240,
				191,
				227,
				226,
				239,
				243,
				214,
				265,
				244,
				265,
				214,
				268,
				266,
				267,
				269,
				267,
				266,
				272,
				270,
				271,
				273,
				271,
				270,
				272,
				274,
				270,
				275,
				270,
				274,
				278,
				276,
				277,
				279,
				277,
				276,
				277,
				279,
				280,
				281,
				280,
				279,
				282,
				261,
				251,
				266,
				283,
				269,
				284,
				269,
				283,
				286,
				272,
				285,
				271,
				285,
				272,
				286,
				287,
				272,
				274,
				272,
				287,
				289,
				288,
				276,
				279,
				276,
				288,
				284,
				283,
				290,
				294,
				291,
				292,
				294,
				292,
				293,
				298,
				295,
				296,
				298,
				296,
				297,
				267,
				269,
				273,
				271,
				273,
				269,
				269,
				284,
				271,
				285,
				271,
				284,
				276,
				278,
				274,
				275,
				274,
				278,
				289,
				276,
				287,
				274,
				287,
				276,
				266,
				294,
				293,
				266,
				293,
				283,
				296,
				291,
				294,
				296,
				294,
				297,
				268,
				267,
				299,
				300,
				299,
				267,
				273,
				270,
				188,
				198,
				188,
				270,
				270,
				275,
				198,
				301,
				198,
				275,
				278,
				277,
				302,
				303,
				302,
				277,
				277,
				280,
				303,
				304,
				303,
				280,
				297,
				294,
				266,
				297,
				266,
				268,
				306,
				295,
				305,
				306,
				305,
				282,
				267,
				273,
				300,
				188,
				300,
				273,
				275,
				278,
				301,
				302,
				301,
				278,
				186,
				307,
				188,
				300,
				188,
				307,
				307,
				308,
				300,
				299,
				300,
				308,
				304,
				306,
				282,
				304,
				282,
				309,
				251,
				309,
				282,
				5,
				142,
				186,
				307,
				186,
				142,
				142,
				143,
				307,
				308,
				307,
				143,
				312,
				310,
				311,
				313,
				311,
				310,
				261,
				282,
				312,
				310,
				312,
				282,
				311,
				313,
				148,
				149,
				148,
				313,
				311,
				314,
				312,
				315,
				312,
				314,
				312,
				315,
				261,
				264,
				261,
				315,
				311,
				148,
				314,
				152,
				314,
				148,
				317,
				316,
				315,
				316,
				264,
				315,
				152,
				155,
				314,
				318,
				314,
				155,
				303,
				304,
				319,
				309,
				319,
				304,
				319,
				320,
				303,
				302,
				303,
				320,
				320,
				321,
				302,
				301,
				302,
				321,
				321,
				199,
				301,
				198,
				301,
				199,
				199,
				321,
				208,
				322,
				208,
				321,
				204,
				323,
				202,
				324,
				202,
				323,
				208,
				322,
				204,
				323,
				204,
				322,
				202,
				324,
				210,
				325,
				210,
				324,
				213,
				210,
				246,
				325,
				246,
				210,
				321,
				320,
				322,
				326,
				322,
				320,
				323,
				327,
				324,
				328,
				324,
				327,
				322,
				326,
				323,
				327,
				323,
				326,
				324,
				328,
				325,
				329,
				325,
				328,
				246,
				325,
				249,
				329,
				249,
				325,
				320,
				319,
				326,
				253,
				326,
				319,
				327,
				255,
				328,
				256,
				328,
				255,
				326,
				253,
				327,
				255,
				327,
				253,
				328,
				256,
				329,
				258,
				329,
				256,
				249,
				329,
				260,
				258,
				260,
				329,
				319,
				309,
				253,
				251,
				253,
				309,
				330,
				281,
				288,
				279,
				288,
				281,
				189,
				331,
				332,
				256,
				255,
				259,
				254,
				259,
				255,
				315,
				314,
				317,
				318,
				317,
				314,
				263,
				264,
				316,
				223,
				225,
				333,
				215,
				214,
				221,
				243,
				221,
				214,
				239,
				238,
				227,
				238,
				239,
				72,
				284,
				290,
				285,
				149,
				313,
				143,
				308,
				143,
				313,
				308,
				313,
				334,
				298,
				299,
				308,
				298,
				308,
				334,
				299,
				298,
				297,
				299,
				297,
				268,
				306,
				304,
				280,
				306,
				280,
				335,
				336,
				335,
				280,
				336,
				280,
				281,
				330,
				337,
				336,
				330,
				336,
				281,
				295,
				306,
				335,
				295,
				335,
				296,
				291,
				296,
				335,
				291,
				335,
				336,
				337,
				292,
				291,
				337,
				291,
				336,
				334,
				313,
				310,
				282,
				305,
				310,
				310,
				305,
				334,
				295,
				298,
				334,
				295,
				334,
				305,
				224,
				215,
				222,
				260,
				258,
				257,
				338,
				231,
				223,
				338,
				223,
				333,
				265,
				177,
				74,
				265,
				74,
				243,
				184,
				332,
				185,
				192,
				185,
				332,
				184,
				187,
				332,
				189,
				332,
				187,
				331,
				189,
				197,
				197,
				200,
				331,
				241,
				331,
				200,
				220,
				339,
				225,
				220,
				225,
				222,
				339,
				340,
				333,
				339,
				333,
				225,
				180,
				339,
				220,
				180,
				220,
				45,
				339,
				180,
				181,
				339,
				181,
				340,
				340,
				181,
				183,
				340,
				183,
				341,
				331,
				241,
				242,
				242,
				192,
				331,
				332,
				331,
				192,
				333,
				340,
				341,
				333,
				341,
				338
			],
			"featurePoint": [
				250,
				259,
				260,
				248,
				245,
				244,
				265,
				177,
				97,
				76,
				77,
				80,
				92,
				91,
				82,
				141,
				114,
				172,
				140,
				309,
				282,
				334,
				308,
				288,
				292,
				290,
				287,
				-1,
				120,
				126,
				122,
				119,
				-1,
				5,
				189,
				331,
				240,
				20,
				70,
				169,
				9,
				6,
				193,
				15,
				230,
				227,
				239,
				69,
				68,
				52,
				56,
				48,
				44,
				45,
				220,
				222,
				341,
				183,
				182,
				62,
				65,
				236,
				2,
				337,
				293,
				286,
				289,
				175,
				125,
				117,
				121,
				83,
				95,
				153,
				156,
				155,
				318,
				316,
				263,
				252
			],
			"weight": [
				[
					[
						62,
						183.9
					],
					[
						41,
						158.4
					],
					[
						43,
						51.58
					],
					[
						40,
						43.31
					]
				],
				[
					[
						62,
						306.5
					],
					[
						41,
						157.4
					],
					[
						42,
						5.064
					],
					[
						43,
						5.064
					]
				],
				[
					[
						62,
						1
					]
				],
				[
					[
						62,
						557.6
					],
					[
						43,
						150.3
					],
					[
						42,
						64.46
					],
					[
						41,
						56.33
					]
				],
				[
					[
						33,
						650
					],
					[
						41,
						82.21
					],
					[
						40,
						28.86
					],
					[
						18,
						25.77
					]
				],
				[
					[
						33,
						1
					]
				],
				[
					[
						41,
						1
					]
				],
				[
					[
						41,
						464.8
					],
					[
						40,
						160.9
					],
					[
						33,
						35.79
					],
					[
						62,
						34.47
					]
				],
				[
					[
						40,
						119.5
					],
					[
						33,
						84.4
					],
					[
						30,
						51.17
					],
					[
						41,
						42.68
					]
				],
				[
					[
						40,
						1
					]
				],
				[
					[
						62,
						397.1
					],
					[
						43,
						322.3
					],
					[
						42,
						322.3
					],
					[
						37,
						82.82
					]
				],
				[
					[
						43,
						759.2
					],
					[
						62,
						115.6
					],
					[
						42,
						88.44
					],
					[
						37,
						56.25
					]
				],
				[
					[
						38,
						118.9
					],
					[
						43,
						98.95
					],
					[
						39,
						53.08
					],
					[
						37,
						41.36
					]
				],
				[
					[
						39,
						119.7
					],
					[
						40,
						82.66
					],
					[
						38,
						64.41
					],
					[
						43,
						42.97
					]
				],
				[
					[
						42,
						662.7
					],
					[
						43,
						662.7
					],
					[
						37,
						140.1
					],
					[
						62,
						54.47
					]
				],
				[
					[
						43,
						1
					]
				],
				[
					[
						43,
						246.5
					],
					[
						38,
						143.9
					],
					[
						37,
						115.4
					],
					[
						39,
						57.44
					]
				],
				[
					[
						43,
						839.4
					],
					[
						37,
						451.4
					],
					[
						42,
						223.1
					],
					[
						47,
						49.14
					]
				],
				[
					[
						37,
						959.7
					],
					[
						42,
						319.1
					],
					[
						43,
						319.1
					],
					[
						47,
						5.405
					]
				],
				[
					[
						37,
						905.3
					],
					[
						43,
						143.8
					],
					[
						48,
						63.21
					],
					[
						42,
						62.75
					]
				],
				[
					[
						37,
						1
					]
				],
				[
					[
						40,
						332.6
					],
					[
						39,
						186.5
					],
					[
						38,
						59.85
					],
					[
						41,
						30.12
					]
				],
				[
					[
						69,
						82.85
					],
					[
						31,
						55.53
					],
					[
						40,
						50.07
					],
					[
						30,
						39.91
					]
				],
				[
					[
						39,
						50.43
					],
					[
						38,
						30.54
					],
					[
						40,
						25.82
					],
					[
						31,
						24.76
					]
				],
				[
					[
						39,
						339.1
					],
					[
						38,
						130.1
					],
					[
						40,
						40.47
					],
					[
						37,
						17.14
					]
				],
				[
					[
						38,
						45.31
					],
					[
						39,
						31.02
					],
					[
						50,
						23.01
					],
					[
						49,
						22.24
					]
				],
				[
					[
						50,
						46.59
					],
					[
						38,
						24.03
					],
					[
						49,
						22.69
					],
					[
						51,
						18.55
					]
				],
				[
					[
						10,
						20.77
					],
					[
						50,
						14.45
					],
					[
						38,
						12.65
					],
					[
						11,
						11.65
					]
				],
				[
					[
						38,
						17.01
					],
					[
						39,
						16.52
					],
					[
						10,
						10.43
					],
					[
						50,
						8.89
					]
				],
				[
					[
						38,
						70.14
					],
					[
						50,
						57.18
					],
					[
						49,
						54.56
					],
					[
						39,
						44.03
					]
				],
				[
					[
						50,
						167.4
					],
					[
						49,
						52.98
					],
					[
						51,
						39.95
					],
					[
						38,
						34.34
					]
				],
				[
					[
						39,
						36.06
					],
					[
						38,
						23.83
					],
					[
						31,
						13.92
					],
					[
						40,
						13.17
					]
				],
				[
					[
						38,
						84.04
					],
					[
						39,
						79.84
					],
					[
						49,
						24.61
					],
					[
						40,
						19.87
					]
				],
				[
					[
						38,
						280.6
					],
					[
						39,
						131.5
					],
					[
						49,
						54.22
					],
					[
						48,
						27.31
					]
				],
				[
					[
						10,
						39.44
					],
					[
						11,
						19.76
					],
					[
						50,
						17.43
					],
					[
						9,
						12.08
					]
				],
				[
					[
						50,
						61.09
					],
					[
						51,
						25.38
					],
					[
						9,
						21.17
					],
					[
						10,
						18.18
					]
				],
				[
					[
						50,
						324.9
					],
					[
						51,
						69.45
					],
					[
						58,
						31.15
					],
					[
						49,
						30.01
					]
				],
				[
					[
						10,
						162.9
					],
					[
						11,
						25.02
					],
					[
						9,
						24.89
					],
					[
						50,
						12.97
					]
				],
				[
					[
						9,
						86.59
					],
					[
						50,
						47.9
					],
					[
						51,
						47.44
					],
					[
						52,
						23.34
					]
				],
				[
					[
						50,
						149.5
					],
					[
						51,
						146.6
					],
					[
						52,
						37.72
					],
					[
						58,
						23.03
					]
				],
				[
					[
						50,
						309.1
					],
					[
						59,
						114.7
					],
					[
						49,
						84.76
					],
					[
						48,
						41.8
					]
				],
				[
					[
						50,
						3866
					],
					[
						59,
						67.83
					],
					[
						51,
						62.51
					],
					[
						49,
						45.01
					]
				],
				[
					[
						50,
						634.3
					],
					[
						49,
						74.02
					],
					[
						51,
						65.64
					],
					[
						59,
						58.45
					]
				],
				[
					[
						50,
						210.4
					],
					[
						49,
						194.2
					],
					[
						59,
						71.54
					],
					[
						48,
						58.04
					]
				],
				[
					[
						52,
						1
					]
				],
				[
					[
						53,
						1
					]
				],
				[
					[
						53,
						679.4
					],
					[
						57,
						63.66
					],
					[
						52,
						40.99
					],
					[
						54,
						40.99
					]
				],
				[
					[
						52,
						438.1
					],
					[
						51,
						181.7
					],
					[
						58,
						66.17
					],
					[
						53,
						63.87
					]
				],
				[
					[
						51,
						1
					]
				],
				[
					[
						50,
						7917
					],
					[
						51,
						61.9
					],
					[
						58,
						18.73
					]
				],
				[
					[
						51,
						1498
					],
					[
						52,
						262.1
					],
					[
						58,
						251.4
					],
					[
						50,
						225.2
					]
				],
				[
					[
						50,
						571.9
					],
					[
						51,
						269.5
					],
					[
						52,
						57.01
					],
					[
						58,
						49.27
					]
				],
				[
					[
						49,
						1
					]
				],
				[
					[
						49,
						1564
					],
					[
						59,
						563.6
					],
					[
						48,
						562.3
					],
					[
						47,
						133.4
					]
				],
				[
					[
						50,
						6837
					],
					[
						51,
						90.31
					],
					[
						58,
						64.22
					],
					[
						59,
						54.51
					]
				],
				[
					[
						50,
						1290
					],
					[
						51,
						106.4
					],
					[
						58,
						48.48
					],
					[
						59,
						43.29
					]
				],
				[
					[
						50,
						1
					]
				],
				[
					[
						50,
						5080
					],
					[
						51,
						120.4
					],
					[
						58,
						102.3
					],
					[
						52,
						59.29
					]
				],
				[
					[
						50,
						488.9
					],
					[
						59,
						157.6
					],
					[
						49,
						22.07
					],
					[
						51,
						16.12
					]
				],
				[
					[
						50,
						4688
					],
					[
						59,
						85.84
					],
					[
						51,
						72.65
					],
					[
						58,
						50.62
					]
				],
				[
					[
						50,
						376.4
					],
					[
						59,
						143.4
					],
					[
						49,
						39.44
					],
					[
						48,
						10.81
					]
				],
				[
					[
						59,
						1796
					],
					[
						49,
						477.2
					],
					[
						48,
						228.4
					],
					[
						60,
						140.3
					]
				],
				[
					[
						59,
						1
					]
				],
				[
					[
						47,
						2588
					],
					[
						60,
						695
					],
					[
						48,
						401.1
					],
					[
						46,
						401.1
					]
				],
				[
					[
						60,
						1851
					],
					[
						47,
						805.7
					],
					[
						46,
						203.8
					],
					[
						48,
						203.8
					]
				],
				[
					[
						60,
						1
					]
				],
				[
					[
						38,
						427.2
					],
					[
						49,
						95.22
					],
					[
						39,
						76.96
					],
					[
						48,
						31.67
					]
				],
				[
					[
						48,
						358.4
					],
					[
						49,
						237.9
					],
					[
						37,
						234.5
					],
					[
						38,
						112.8
					]
				],
				[
					[
						48,
						1
					]
				],
				[
					[
						47,
						1
					]
				],
				[
					[
						38,
						1
					]
				],
				[
					[
						38,
						852
					],
					[
						39,
						699.7
					],
					[
						40,
						49.17
					],
					[
						37,
						32.77
					]
				],
				[
					[
						37,
						785.7
					],
					[
						47,
						422.7
					],
					[
						46,
						305.3
					],
					[
						48,
						305.3
					]
				],
				[
					[
						39,
						1388
					],
					[
						38,
						1326
					],
					[
						40,
						38.55
					],
					[
						37,
						16.77
					]
				],
				[
					[
						7,
						139.9
					],
					[
						53,
						119.2
					],
					[
						8,
						42.85
					],
					[
						6,
						42.85
					]
				],
				[
					[
						8,
						169.1
					],
					[
						52,
						97.99
					],
					[
						51,
						62.48
					],
					[
						58,
						35.21
					]
				],
				[
					[
						9,
						1
					]
				],
				[
					[
						10,
						1
					]
				],
				[
					[
						10,
						147.9
					],
					[
						11,
						62.68
					],
					[
						9,
						2.972
					],
					[
						12,
						0.0633
					]
				],
				[
					[
						10,
						76.45
					],
					[
						11,
						67.18
					],
					[
						12,
						14.61
					],
					[
						9,
						13.17
					]
				],
				[
					[
						11,
						1
					]
				],
				[
					[
						11,
						226.6
					],
					[
						12,
						38.44
					],
					[
						10,
						18.72
					],
					[
						13,
						5.037
					]
				],
				[
					[
						14,
						1
					]
				],
				[
					[
						71,
						1
					]
				],
				[
					[
						15,
						57.5
					],
					[
						71,
						13.05
					],
					[
						16,
						9.187
					],
					[
						14,
						7.945
					]
				],
				[
					[
						14,
						22.25
					],
					[
						13,
						17.59
					],
					[
						15,
						16.86
					],
					[
						28,
						16.13
					]
				],
				[
					[
						13,
						183.9
					],
					[
						14,
						116.2
					],
					[
						71,
						5.166
					]
				],
				[
					[
						13,
						42.83
					],
					[
						12,
						24.23
					],
					[
						14,
						11.78
					],
					[
						15,
						7.239
					]
				],
				[
					[
						12,
						56.21
					],
					[
						13,
						49.02
					],
					[
						11,
						8.866
					],
					[
						14,
						8.31
					]
				],
				[
					[
						12,
						154.3
					],
					[
						13,
						32.1
					],
					[
						11,
						14.74
					],
					[
						14,
						6.242
					]
				],
				[
					[
						13,
						151.1
					],
					[
						12,
						76.03
					],
					[
						14,
						3.259
					]
				],
				[
					[
						13,
						1
					]
				],
				[
					[
						12,
						1
					]
				],
				[
					[
						72,
						26.94
					],
					[
						73,
						17.26
					],
					[
						16,
						12.86
					],
					[
						15,
						11.62
					]
				],
				[
					[
						72,
						67.45
					],
					[
						71,
						56.45
					],
					[
						14,
						7.672
					],
					[
						73,
						1.892
					]
				],
				[
					[
						72,
						1
					]
				],
				[
					[
						73,
						118.8
					],
					[
						72,
						43.76
					],
					[
						74,
						5.296
					],
					[
						16,
						4.685
					]
				],
				[
					[
						8,
						1
					]
				],
				[
					[
						30,
						667.9
					],
					[
						68,
						442.6
					],
					[
						69,
						95.11
					],
					[
						29,
						83.61
					]
				],
				[
					[
						30,
						176.9
					],
					[
						68,
						139.4
					],
					[
						69,
						48.1
					],
					[
						29,
						43.57
					]
				],
				[
					[
						30,
						233.1
					],
					[
						68,
						82.03
					],
					[
						69,
						74.33
					],
					[
						31,
						32.24
					]
				],
				[
					[
						30,
						738.8
					],
					[
						69,
						140.9
					],
					[
						68,
						131
					],
					[
						31,
						51.92
					]
				],
				[
					[
						69,
						343
					],
					[
						31,
						169.1
					],
					[
						30,
						101.5
					],
					[
						70,
						53.69
					]
				],
				[
					[
						69,
						1477
					],
					[
						31,
						413.9
					],
					[
						30,
						202.1
					],
					[
						70,
						84.23
					]
				],
				[
					[
						30,
						631.3
					],
					[
						69,
						242.2
					],
					[
						68,
						109.3
					],
					[
						31,
						82.44
					]
				],
				[
					[
						30,
						206.2
					],
					[
						69,
						109.9
					],
					[
						68,
						60.05
					],
					[
						31,
						47.71
					]
				],
				[
					[
						31,
						1566
					],
					[
						69,
						202.1
					],
					[
						70,
						150.4
					],
					[
						30,
						70.64
					]
				],
				[
					[
						31,
						365.1
					],
					[
						69,
						103.6
					],
					[
						70,
						82.91
					],
					[
						30,
						45.11
					]
				],
				[
					[
						70,
						2755
					],
					[
						28,
						314.2
					],
					[
						31,
						254
					],
					[
						69,
						84.31
					]
				],
				[
					[
						70,
						525.1
					],
					[
						28,
						150
					],
					[
						31,
						128.7
					],
					[
						69,
						53.84
					]
				],
				[
					[
						28,
						733.8
					],
					[
						70,
						129.4
					],
					[
						67,
						94.12
					],
					[
						31,
						45.25
					]
				],
				[
					[
						28,
						4055
					],
					[
						70,
						230.9
					],
					[
						67,
						154.1
					],
					[
						31,
						61.26
					]
				],
				[
					[
						28,
						502.7
					],
					[
						67,
						157.5
					],
					[
						70,
						78.29
					],
					[
						15,
						45.15
					]
				],
				[
					[
						28,
						1357
					],
					[
						67,
						290.3
					],
					[
						70,
						148.3
					],
					[
						29,
						62.11
					]
				],
				[
					[
						16,
						1
					]
				],
				[
					[
						30,
						2208
					],
					[
						68,
						637.7
					],
					[
						69,
						126
					],
					[
						29,
						76.08
					]
				],
				[
					[
						30,
						3741
					],
					[
						69,
						259
					],
					[
						68,
						204.3
					],
					[
						31,
						78.52
					]
				],
				[
					[
						69,
						1
					]
				],
				[
					[
						30,
						4160
					],
					[
						69,
						468
					]
				],
				[
					[
						31,
						1
					]
				],
				[
					[
						28,
						1
					]
				],
				[
					[
						70,
						1
					]
				],
				[
					[
						30,
						1
					]
				],
				[
					[
						29,
						5532
					],
					[
						67,
						313.2
					],
					[
						68,
						241.7
					],
					[
						28,
						62.99
					]
				],
				[
					[
						68,
						6366
					],
					[
						29,
						391.9
					],
					[
						30,
						187.8
					],
					[
						67,
						88.29
					]
				],
				[
					[
						68,
						1
					]
				],
				[
					[
						29,
						1
					]
				],
				[
					[
						29,
						89.3
					],
					[
						17,
						68.03
					],
					[
						67,
						35.54
					],
					[
						16,
						30.88
					]
				],
				[
					[
						17,
						165
					],
					[
						68,
						109.1
					],
					[
						29,
						76.65
					],
					[
						18,
						61.84
					]
				],
				[
					[
						68,
						661.9
					],
					[
						29,
						142.9
					],
					[
						30,
						78.36
					],
					[
						67,
						30.55
					]
				],
				[
					[
						29,
						713.3
					],
					[
						68,
						140.1
					],
					[
						67,
						126.3
					],
					[
						30,
						23.42
					]
				],
				[
					[
						18,
						144
					],
					[
						68,
						60.6
					],
					[
						30,
						59.25
					],
					[
						17,
						37.52
					]
				],
				[
					[
						30,
						65.17
					],
					[
						33,
						44.79
					],
					[
						18,
						44.42
					],
					[
						68,
						29.65
					]
				],
				[
					[
						31,
						108
					],
					[
						70,
						57.8
					],
					[
						69,
						48.21
					],
					[
						28,
						33.51
					]
				],
				[
					[
						70,
						142.6
					],
					[
						28,
						65.8
					],
					[
						31,
						59.07
					],
					[
						69,
						30.39
					]
				],
				[
					[
						28,
						193.8
					],
					[
						70,
						63.91
					],
					[
						67,
						50.13
					],
					[
						31,
						27.54
					]
				],
				[
					[
						15,
						210.6
					],
					[
						28,
						139.7
					],
					[
						16,
						88.13
					],
					[
						67,
						77.07
					]
				],
				[
					[
						16,
						269.2
					],
					[
						67,
						152.8
					],
					[
						29,
						64.49
					],
					[
						28,
						55.72
					]
				],
				[
					[
						16,
						136.3
					],
					[
						17,
						131
					],
					[
						29,
						14.46
					],
					[
						67,
						5.617
					]
				],
				[
					[
						33,
						151.8
					],
					[
						18,
						68.32
					],
					[
						41,
						39.68
					],
					[
						30,
						33.92
					]
				],
				[
					[
						18,
						1
					]
				],
				[
					[
						15,
						1
					]
				],
				[
					[
						33,
						503.6
					],
					[
						41,
						47.13
					],
					[
						22,
						39.61
					],
					[
						18,
						39.61
					]
				],
				[
					[
						18,
						158.4
					],
					[
						22,
						158.4
					],
					[
						33,
						14.29
					],
					[
						17,
						3.062
					]
				],
				[
					[
						16,
						100.6
					],
					[
						17,
						92
					],
					[
						29,
						18.79
					],
					[
						18,
						17.4
					]
				],
				[
					[
						16,
						41.77
					],
					[
						17,
						26.84
					],
					[
						15,
						9.05
					],
					[
						29,
						7.65
					]
				],
				[
					[
						17,
						29.16
					],
					[
						18,
						21.46
					],
					[
						16,
						11.6
					],
					[
						74,
						7.005
					]
				],
				[
					[
						17,
						137.1
					],
					[
						18,
						80.5
					],
					[
						22,
						15.72
					],
					[
						16,
						13.41
					]
				],
				[
					[
						17,
						16.04
					],
					[
						21,
						16.04
					],
					[
						22,
						12.68
					],
					[
						18,
						12.68
					]
				],
				[
					[
						22,
						34.79
					],
					[
						18,
						34.79
					],
					[
						21,
						21.71
					],
					[
						17,
						21.71
					]
				],
				[
					[
						74,
						32.07
					],
					[
						75,
						20.99
					],
					[
						17,
						5.493
					],
					[
						76,
						5.173
					]
				],
				[
					[
						73,
						19.22
					],
					[
						74,
						9.235
					],
					[
						16,
						8.48
					],
					[
						72,
						7.049
					]
				],
				[
					[
						75,
						35.77
					],
					[
						76,
						8.687
					],
					[
						74,
						8.687
					],
					[
						17,
						3.238
					]
				],
				[
					[
						73,
						1
					]
				],
				[
					[
						73,
						50.19
					],
					[
						74,
						46.24
					],
					[
						75,
						4.943
					],
					[
						72,
						3.158
					]
				],
				[
					[
						75,
						1
					]
				],
				[
					[
						74,
						1
					]
				],
				[
					[
						28,
						65.44
					],
					[
						15,
						33.66
					],
					[
						70,
						30.11
					],
					[
						67,
						24.87
					]
				],
				[
					[
						70,
						45
					],
					[
						28,
						26.91
					],
					[
						31,
						24.88
					],
					[
						69,
						14.85
					]
				],
				[
					[
						31,
						34.1
					],
					[
						70,
						24.59
					],
					[
						39,
						23.63
					],
					[
						69,
						19.88
					]
				],
				[
					[
						39,
						19.17
					],
					[
						31,
						16.51
					],
					[
						38,
						13.79
					],
					[
						70,
						13.39
					]
				],
				[
					[
						38,
						10.54
					],
					[
						39,
						10.29
					],
					[
						10,
						9.713
					],
					[
						11,
						9.153
					]
				],
				[
					[
						11,
						15.44
					],
					[
						10,
						15.18
					],
					[
						50,
						7.83
					],
					[
						12,
						6.95
					]
				],
				[
					[
						11,
						28.35
					],
					[
						10,
						25.73
					],
					[
						12,
						11.5
					],
					[
						50,
						9.191
					]
				],
				[
					[
						70,
						20.91
					],
					[
						28,
						13.8
					],
					[
						31,
						12.91
					],
					[
						69,
						8.172
					]
				],
				[
					[
						11,
						12.91
					],
					[
						70,
						10.28
					],
					[
						12,
						8.974
					],
					[
						28,
						7.124
					]
				],
				[
					[
						11,
						24.96
					],
					[
						12,
						16.46
					],
					[
						10,
						8.161
					],
					[
						13,
						8.033
					]
				],
				[
					[
						11,
						50.38
					],
					[
						12,
						30.11
					],
					[
						10,
						9.153
					],
					[
						13,
						7.768
					]
				],
				[
					[
						28,
						1805
					],
					[
						67,
						574
					],
					[
						70,
						147.7
					],
					[
						29,
						76.67
					]
				],
				[
					[
						39,
						1
					]
				],
				[
					[
						40,
						245.4
					],
					[
						39,
						138.3
					],
					[
						38,
						37.96
					],
					[
						41,
						31.93
					]
				],
				[
					[
						51,
						637.4
					],
					[
						58,
						412.9
					],
					[
						50,
						266.4
					],
					[
						52,
						174.5
					]
				],
				[
					[
						17,
						1
					]
				],
				[
					[
						67,
						1110
					],
					[
						29,
						150.5
					],
					[
						28,
						91.68
					],
					[
						16,
						40.41
					]
				],
				[
					[
						67,
						6134
					],
					[
						29,
						229.4
					],
					[
						28,
						194
					],
					[
						68,
						66.89
					]
				],
				[
					[
						67,
						1
					]
				],
				[
					[
						58,
						377.7
					],
					[
						51,
						370
					],
					[
						50,
						283.5
					],
					[
						52,
						120.9
					]
				],
				[
					[
						7,
						1
					]
				],
				[
					[
						52,
						1587
					],
					[
						58,
						817.4
					],
					[
						51,
						140.9
					],
					[
						57,
						117.5
					]
				],
				[
					[
						58,
						4579
					],
					[
						52,
						361.4
					],
					[
						57,
						86.79
					],
					[
						51,
						3.976
					]
				],
				[
					[
						53,
						1256
					],
					[
						57,
						673.2
					],
					[
						52,
						124.1
					],
					[
						54,
						124.1
					]
				],
				[
					[
						57,
						4490
					],
					[
						53,
						313.1
					],
					[
						56,
						75
					],
					[
						58,
						75
					]
				],
				[
					[
						58,
						1
					]
				],
				[
					[
						57,
						1
					]
				],
				[
					[
						62,
						183.9
					],
					[
						41,
						158.4
					],
					[
						42,
						51.58
					],
					[
						34,
						43.31
					]
				],
				[
					[
						62,
						557.6
					],
					[
						42,
						150.3
					],
					[
						43,
						64.46
					],
					[
						41,
						56.33
					]
				],
				[
					[
						33,
						650
					],
					[
						41,
						82.21
					],
					[
						34,
						28.86
					],
					[
						22,
						25.77
					]
				],
				[
					[
						41,
						464.8
					],
					[
						34,
						160.9
					],
					[
						33,
						35.79
					],
					[
						62,
						34.47
					]
				],
				[
					[
						34,
						119.5
					],
					[
						33,
						84.4
					],
					[
						25,
						51.17
					],
					[
						41,
						42.68
					]
				],
				[
					[
						34,
						1
					]
				],
				[
					[
						42,
						759.2
					],
					[
						62,
						115.6
					],
					[
						43,
						88.44
					],
					[
						37,
						56.25
					]
				],
				[
					[
						36,
						118.9
					],
					[
						42,
						98.95
					],
					[
						35,
						53.08
					],
					[
						37,
						41.36
					]
				],
				[
					[
						35,
						119.7
					],
					[
						34,
						82.66
					],
					[
						36,
						64.41
					],
					[
						42,
						42.97
					]
				],
				[
					[
						42,
						1
					]
				],
				[
					[
						42,
						246.5
					],
					[
						36,
						143.9
					],
					[
						37,
						115.4
					],
					[
						35,
						57.44
					]
				],
				[
					[
						42,
						839.4
					],
					[
						37,
						451.4
					],
					[
						43,
						223.1
					],
					[
						47,
						49.14
					]
				],
				[
					[
						37,
						905.3
					],
					[
						42,
						143.8
					],
					[
						46,
						63.21
					],
					[
						43,
						62.75
					]
				],
				[
					[
						34,
						332.6
					],
					[
						35,
						186.5
					],
					[
						36,
						59.85
					],
					[
						41,
						30.12
					]
				],
				[
					[
						65,
						82.85
					],
					[
						26,
						55.53
					],
					[
						34,
						50.07
					],
					[
						25,
						39.91
					]
				],
				[
					[
						35,
						50.43
					],
					[
						36,
						30.54
					],
					[
						34,
						25.82
					],
					[
						26,
						24.76
					]
				],
				[
					[
						35,
						339.1
					],
					[
						36,
						130.1
					],
					[
						34,
						40.47
					],
					[
						37,
						17.14
					]
				],
				[
					[
						36,
						45.31
					],
					[
						35,
						31.02
					],
					[
						44,
						23.01
					],
					[
						45,
						22.24
					]
				],
				[
					[
						4,
						20.77
					],
					[
						44,
						14.45
					],
					[
						36,
						12.65
					],
					[
						3,
						11.65
					]
				],
				[
					[
						44,
						46.59
					],
					[
						36,
						24.03
					],
					[
						45,
						22.69
					],
					[
						55,
						18.55
					]
				],
				[
					[
						36,
						17.01
					],
					[
						35,
						16.52
					],
					[
						4,
						10.43
					],
					[
						44,
						8.89
					]
				],
				[
					[
						36,
						70.14
					],
					[
						44,
						57.18
					],
					[
						45,
						54.56
					],
					[
						35,
						44.03
					]
				],
				[
					[
						44,
						167.4
					],
					[
						45,
						52.98
					],
					[
						55,
						39.95
					],
					[
						36,
						34.34
					]
				],
				[
					[
						36,
						84.04
					],
					[
						35,
						79.84
					],
					[
						45,
						24.61
					],
					[
						34,
						19.87
					]
				],
				[
					[
						35,
						36.06
					],
					[
						36,
						23.83
					],
					[
						26,
						13.92
					],
					[
						34,
						13.17
					]
				],
				[
					[
						36,
						280.6
					],
					[
						35,
						131.5
					],
					[
						45,
						54.22
					],
					[
						46,
						27.31
					]
				],
				[
					[
						4,
						39.44
					],
					[
						3,
						19.76
					],
					[
						44,
						17.43
					],
					[
						5,
						12.08
					]
				],
				[
					[
						44,
						61.09
					],
					[
						55,
						25.38
					],
					[
						5,
						21.17
					],
					[
						4,
						18.18
					]
				],
				[
					[
						44,
						324.9
					],
					[
						55,
						69.45
					],
					[
						56,
						31.15
					],
					[
						45,
						30.01
					]
				],
				[
					[
						4,
						162.9
					],
					[
						3,
						25.02
					],
					[
						5,
						24.89
					],
					[
						44,
						12.97
					]
				],
				[
					[
						5,
						86.59
					],
					[
						44,
						47.9
					],
					[
						55,
						47.44
					],
					[
						54,
						23.34
					]
				],
				[
					[
						44,
						149.5
					],
					[
						55,
						146.6
					],
					[
						54,
						37.72
					],
					[
						56,
						23.03
					]
				],
				[
					[
						44,
						309.1
					],
					[
						61,
						114.7
					],
					[
						45,
						84.76
					],
					[
						46,
						41.8
					]
				],
				[
					[
						44,
						210.4
					],
					[
						45,
						194.2
					],
					[
						61,
						71.54
					],
					[
						46,
						58.04
					]
				],
				[
					[
						44,
						634.3
					],
					[
						45,
						74.02
					],
					[
						55,
						65.64
					],
					[
						61,
						58.45
					]
				],
				[
					[
						44,
						3866
					],
					[
						61,
						67.83
					],
					[
						55,
						62.51
					],
					[
						45,
						45.01
					]
				],
				[
					[
						54,
						1
					]
				],
				[
					[
						54,
						438.1
					],
					[
						55,
						181.7
					],
					[
						56,
						66.17
					],
					[
						53,
						63.87
					]
				],
				[
					[
						55,
						1
					]
				],
				[
					[
						44,
						7917
					],
					[
						55,
						61.9
					],
					[
						56,
						18.73
					]
				],
				[
					[
						44,
						571.9
					],
					[
						55,
						269.5
					],
					[
						54,
						57.01
					],
					[
						56,
						49.27
					]
				],
				[
					[
						55,
						1498
					],
					[
						54,
						262.1
					],
					[
						56,
						251.4
					],
					[
						44,
						225.2
					]
				],
				[
					[
						45,
						1564
					],
					[
						61,
						563.6
					],
					[
						46,
						562.3
					],
					[
						47,
						133.4
					]
				],
				[
					[
						45,
						1
					]
				],
				[
					[
						44,
						6837
					],
					[
						55,
						90.31
					],
					[
						56,
						64.22
					],
					[
						61,
						54.51
					]
				],
				[
					[
						44,
						1290
					],
					[
						55,
						106.4
					],
					[
						56,
						48.48
					],
					[
						61,
						43.29
					]
				],
				[
					[
						44,
						1
					]
				],
				[
					[
						44,
						5080
					],
					[
						55,
						120.4
					],
					[
						56,
						102.3
					],
					[
						54,
						59.29
					]
				],
				[
					[
						44,
						488.9
					],
					[
						61,
						157.6
					],
					[
						45,
						22.07
					],
					[
						55,
						16.12
					]
				],
				[
					[
						44,
						376.4
					],
					[
						61,
						143.4
					],
					[
						45,
						39.44
					],
					[
						46,
						10.81
					]
				],
				[
					[
						44,
						4688
					],
					[
						61,
						85.84
					],
					[
						55,
						72.65
					],
					[
						56,
						50.62
					]
				],
				[
					[
						61,
						1796
					],
					[
						45,
						477.2
					],
					[
						46,
						228.4
					],
					[
						60,
						140.3
					]
				],
				[
					[
						61,
						1
					]
				],
				[
					[
						36,
						427.2
					],
					[
						45,
						95.22
					],
					[
						35,
						76.96
					],
					[
						46,
						31.67
					]
				],
				[
					[
						46,
						358.4
					],
					[
						45,
						237.9
					],
					[
						37,
						234.5
					],
					[
						36,
						112.8
					]
				],
				[
					[
						46,
						1
					]
				],
				[
					[
						36,
						1
					]
				],
				[
					[
						36,
						852
					],
					[
						35,
						699.7
					],
					[
						34,
						49.17
					],
					[
						37,
						32.77
					]
				],
				[
					[
						35,
						1388
					],
					[
						36,
						1326
					],
					[
						34,
						38.55
					],
					[
						37,
						16.77
					]
				],
				[
					[
						6,
						169.1
					],
					[
						54,
						97.99
					],
					[
						55,
						62.48
					],
					[
						56,
						35.21
					]
				],
				[
					[
						5,
						1
					]
				],
				[
					[
						4,
						1
					]
				],
				[
					[
						4,
						76.45
					],
					[
						3,
						67.18
					],
					[
						2,
						14.61
					],
					[
						5,
						13.17
					]
				],
				[
					[
						4,
						147.9
					],
					[
						3,
						62.68
					],
					[
						5,
						2.972
					],
					[
						2,
						0.0633
					]
				],
				[
					[
						3,
						1
					]
				],
				[
					[
						3,
						226.6
					],
					[
						2,
						38.44
					],
					[
						4,
						18.72
					],
					[
						1,
						5.037
					]
				],
				[
					[
						0,
						1
					]
				],
				[
					[
						19,
						57.5
					],
					[
						79,
						13.05
					],
					[
						20,
						9.187
					],
					[
						0,
						7.945
					]
				],
				[
					[
						79,
						1
					]
				],
				[
					[
						0,
						22.25
					],
					[
						1,
						17.59
					],
					[
						19,
						16.86
					],
					[
						23,
						16.13
					]
				],
				[
					[
						1,
						183.9
					],
					[
						0,
						116.2
					],
					[
						79,
						5.166
					]
				],
				[
					[
						1,
						42.83
					],
					[
						2,
						24.23
					],
					[
						0,
						11.78
					],
					[
						19,
						7.239
					]
				],
				[
					[
						2,
						56.21
					],
					[
						1,
						49.02
					],
					[
						3,
						8.866
					],
					[
						0,
						8.31
					]
				],
				[
					[
						1,
						151.1
					],
					[
						2,
						76.03
					],
					[
						0,
						3.259
					]
				],
				[
					[
						2,
						154.3
					],
					[
						1,
						32.1
					],
					[
						3,
						14.74
					],
					[
						0,
						6.242
					]
				],
				[
					[
						1,
						1
					]
				],
				[
					[
						2,
						1
					]
				],
				[
					[
						78,
						26.94
					],
					[
						77,
						17.26
					],
					[
						20,
						12.86
					],
					[
						19,
						11.62
					]
				],
				[
					[
						78,
						67.45
					],
					[
						79,
						56.45
					],
					[
						0,
						7.672
					],
					[
						77,
						1.892
					]
				],
				[
					[
						78,
						1
					]
				],
				[
					[
						77,
						118.8
					],
					[
						78,
						43.76
					],
					[
						76,
						5.296
					],
					[
						20,
						4.685
					]
				],
				[
					[
						6,
						1
					]
				],
				[
					[
						25,
						667.9
					],
					[
						64,
						442.6
					],
					[
						65,
						95.11
					],
					[
						24,
						83.61
					]
				],
				[
					[
						25,
						233.1
					],
					[
						64,
						82.03
					],
					[
						65,
						74.33
					],
					[
						26,
						32.24
					]
				],
				[
					[
						25,
						176.9
					],
					[
						64,
						139.4
					],
					[
						65,
						48.1
					],
					[
						24,
						43.57
					]
				],
				[
					[
						25,
						738.8
					],
					[
						65,
						140.9
					],
					[
						64,
						131
					],
					[
						26,
						51.92
					]
				],
				[
					[
						65,
						343
					],
					[
						26,
						169.1
					],
					[
						25,
						101.5
					],
					[
						66,
						53.69
					]
				],
				[
					[
						25,
						631.3
					],
					[
						65,
						242.2
					],
					[
						64,
						109.3
					],
					[
						26,
						82.44
					]
				],
				[
					[
						65,
						1477
					],
					[
						26,
						413.9
					],
					[
						25,
						202.1
					],
					[
						66,
						84.23
					]
				],
				[
					[
						25,
						206.2
					],
					[
						65,
						109.9
					],
					[
						64,
						60.05
					],
					[
						26,
						47.71
					]
				],
				[
					[
						26,
						1566
					],
					[
						65,
						202.1
					],
					[
						66,
						150.4
					],
					[
						25,
						70.64
					]
				],
				[
					[
						26,
						365.1
					],
					[
						65,
						103.6
					],
					[
						66,
						82.91
					],
					[
						25,
						45.11
					]
				],
				[
					[
						66,
						2755
					],
					[
						23,
						314.2
					],
					[
						26,
						254
					],
					[
						65,
						84.31
					]
				],
				[
					[
						23,
						733.8
					],
					[
						66,
						129.4
					],
					[
						63,
						94.12
					],
					[
						26,
						45.25
					]
				],
				[
					[
						66,
						525.1
					],
					[
						23,
						150
					],
					[
						26,
						128.7
					],
					[
						65,
						53.84
					]
				],
				[
					[
						23,
						4055
					],
					[
						66,
						230.9
					],
					[
						63,
						154.1
					],
					[
						26,
						61.26
					]
				],
				[
					[
						23,
						502.7
					],
					[
						63,
						157.5
					],
					[
						66,
						78.29
					],
					[
						19,
						45.15
					]
				],
				[
					[
						23,
						1357
					],
					[
						63,
						290.3
					],
					[
						66,
						148.3
					],
					[
						24,
						62.11
					]
				],
				[
					[
						20,
						1
					]
				],
				[
					[
						25,
						2208
					],
					[
						64,
						637.7
					],
					[
						65,
						126
					],
					[
						24,
						76.08
					]
				],
				[
					[
						25,
						3741
					],
					[
						65,
						259
					],
					[
						64,
						204.3
					],
					[
						26,
						78.52
					]
				],
				[
					[
						25,
						4160
					],
					[
						65,
						468
					]
				],
				[
					[
						65,
						1
					]
				],
				[
					[
						26,
						1
					]
				],
				[
					[
						23,
						1
					]
				],
				[
					[
						66,
						1
					]
				],
				[
					[
						25,
						1
					]
				],
				[
					[
						24,
						5532
					],
					[
						63,
						313.2
					],
					[
						64,
						241.7
					],
					[
						23,
						62.99
					]
				],
				[
					[
						24,
						1
					]
				],
				[
					[
						64,
						1
					]
				],
				[
					[
						64,
						6366
					],
					[
						24,
						391.9
					],
					[
						25,
						187.8
					],
					[
						63,
						88.29
					]
				],
				[
					[
						24,
						89.3
					],
					[
						21,
						68.03
					],
					[
						63,
						35.54
					],
					[
						20,
						30.88
					]
				],
				[
					[
						24,
						713.3
					],
					[
						64,
						140.1
					],
					[
						63,
						126.3
					],
					[
						25,
						23.42
					]
				],
				[
					[
						64,
						661.9
					],
					[
						24,
						142.9
					],
					[
						25,
						78.36
					],
					[
						63,
						30.55
					]
				],
				[
					[
						21,
						165
					],
					[
						64,
						109.1
					],
					[
						24,
						76.65
					],
					[
						22,
						61.84
					]
				],
				[
					[
						22,
						144
					],
					[
						64,
						60.6
					],
					[
						25,
						59.25
					],
					[
						21,
						37.52
					]
				],
				[
					[
						25,
						65.17
					],
					[
						33,
						44.79
					],
					[
						22,
						44.42
					],
					[
						64,
						29.65
					]
				],
				[
					[
						26,
						108
					],
					[
						66,
						57.8
					],
					[
						65,
						48.21
					],
					[
						23,
						33.51
					]
				],
				[
					[
						66,
						142.6
					],
					[
						23,
						65.8
					],
					[
						26,
						59.07
					],
					[
						65,
						30.39
					]
				],
				[
					[
						23,
						193.8
					],
					[
						66,
						63.91
					],
					[
						63,
						50.13
					],
					[
						26,
						27.54
					]
				],
				[
					[
						19,
						210.6
					],
					[
						23,
						139.7
					],
					[
						20,
						88.13
					],
					[
						63,
						77.07
					]
				],
				[
					[
						20,
						136.3
					],
					[
						21,
						131
					],
					[
						24,
						14.46
					],
					[
						63,
						5.617
					]
				],
				[
					[
						20,
						269.2
					],
					[
						63,
						152.8
					],
					[
						24,
						64.49
					],
					[
						23,
						55.72
					]
				],
				[
					[
						33,
						151.8
					],
					[
						22,
						68.32
					],
					[
						41,
						39.68
					],
					[
						25,
						33.92
					]
				],
				[
					[
						22,
						1
					]
				],
				[
					[
						19,
						1
					]
				],
				[
					[
						20,
						100.6
					],
					[
						21,
						92
					],
					[
						24,
						18.79
					],
					[
						22,
						17.4
					]
				],
				[
					[
						21,
						29.16
					],
					[
						22,
						21.46
					],
					[
						20,
						11.6
					],
					[
						76,
						7.005
					]
				],
				[
					[
						20,
						41.77
					],
					[
						21,
						26.84
					],
					[
						19,
						9.05
					],
					[
						24,
						7.65
					]
				],
				[
					[
						21,
						137.1
					],
					[
						22,
						80.5
					],
					[
						18,
						15.72
					],
					[
						20,
						13.41
					]
				],
				[
					[
						76,
						32.07
					],
					[
						75,
						20.99
					],
					[
						21,
						5.493
					],
					[
						74,
						5.173
					]
				],
				[
					[
						77,
						19.22
					],
					[
						76,
						9.235
					],
					[
						20,
						8.48
					],
					[
						78,
						7.049
					]
				],
				[
					[
						77,
						1
					]
				],
				[
					[
						77,
						50.19
					],
					[
						76,
						46.24
					],
					[
						75,
						4.943
					],
					[
						78,
						3.158
					]
				],
				[
					[
						76,
						1
					]
				],
				[
					[
						23,
						65.44
					],
					[
						19,
						33.66
					],
					[
						66,
						30.11
					],
					[
						63,
						24.87
					]
				],
				[
					[
						66,
						45
					],
					[
						23,
						26.91
					],
					[
						26,
						24.88
					],
					[
						65,
						14.85
					]
				],
				[
					[
						26,
						34.1
					],
					[
						66,
						24.59
					],
					[
						35,
						23.63
					],
					[
						65,
						19.88
					]
				],
				[
					[
						35,
						19.17
					],
					[
						26,
						16.51
					],
					[
						36,
						13.79
					],
					[
						66,
						13.39
					]
				],
				[
					[
						36,
						10.54
					],
					[
						35,
						10.29
					],
					[
						4,
						9.713
					],
					[
						3,
						9.153
					]
				],
				[
					[
						3,
						15.44
					],
					[
						4,
						15.18
					],
					[
						44,
						7.83
					],
					[
						2,
						6.95
					]
				],
				[
					[
						3,
						28.35
					],
					[
						4,
						25.73
					],
					[
						2,
						11.5
					],
					[
						44,
						9.191
					]
				],
				[
					[
						66,
						20.91
					],
					[
						23,
						13.8
					],
					[
						26,
						12.91
					],
					[
						65,
						8.172
					]
				],
				[
					[
						3,
						12.91
					],
					[
						66,
						10.28
					],
					[
						2,
						8.974
					],
					[
						23,
						7.124
					]
				],
				[
					[
						3,
						24.96
					],
					[
						2,
						16.46
					],
					[
						4,
						8.161
					],
					[
						1,
						8.033
					]
				],
				[
					[
						3,
						50.38
					],
					[
						2,
						30.11
					],
					[
						4,
						9.153
					],
					[
						1,
						7.768
					]
				],
				[
					[
						23,
						1805
					],
					[
						63,
						574
					],
					[
						66,
						147.7
					],
					[
						24,
						76.67
					]
				],
				[
					[
						35,
						1
					]
				],
				[
					[
						34,
						245.4
					],
					[
						35,
						138.3
					],
					[
						36,
						37.96
					],
					[
						41,
						31.93
					]
				],
				[
					[
						55,
						637.4
					],
					[
						56,
						412.9
					],
					[
						44,
						266.4
					],
					[
						54,
						174.5
					]
				],
				[
					[
						21,
						1
					]
				],
				[
					[
						63,
						1110
					],
					[
						24,
						150.5
					],
					[
						23,
						91.68
					],
					[
						20,
						40.41
					]
				],
				[
					[
						63,
						6134
					],
					[
						24,
						229.4
					],
					[
						23,
						194
					],
					[
						64,
						66.89
					]
				],
				[
					[
						63,
						1
					]
				],
				[
					[
						56,
						377.7
					],
					[
						55,
						370
					],
					[
						44,
						283.5
					],
					[
						54,
						120.9
					]
				],
				[
					[
						54,
						1587
					],
					[
						56,
						817.4
					],
					[
						55,
						140.9
					],
					[
						57,
						117.5
					]
				],
				[
					[
						56,
						4579
					],
					[
						54,
						361.4
					],
					[
						57,
						86.79
					],
					[
						55,
						3.976
					]
				],
				[
					[
						56,
						1
					]
				]
			]
		},
		"rightEye": {
			"index": [
				293,
				286,
				283,
				288,
				289,
				330,
				285,
				290,
				283,
				289,
				337,
				330,
				287,
				292,
				337,
				287,
				286,
				293,
				286,
				285,
				283,
				289,
				287,
				337,
				292,
				287,
				293
			]
		},
		"leftEye": {
			"index": [
				175,
				119,
				121,
				125,
				119,
				126,
				115,
				117,
				125,
				168,
				121,
				120,
				115,
				122,
				118,
				168,
				175,
				121,
				175,
				126,
				119,
				125,
				117,
				119,
				115,
				118,
				117
			]
		},
		"back": {
			"index": [
				91,
				90,
				257,
				254,
				86,
				91,
				250,
				83,
				82,
				154,
				95,
				94,
				95,
				154,
				153,
				83,
				155,
				156,
				262,
				317,
				318,
				317,
				263,
				316,
				318,
				252,
				262,
				86,
				254,
				250,
				91,
				257,
				259,
				80,
				248,
				260,
				77,
				245,
				247,
				177,
				265,
				244,
				76,
				97,
				177,
				245,
				77,
				76,
				248,
				80,
				78,
				260,
				90,
				92,
				250,
				82,
				86,
				156,
				154,
				94,
				83,
				252,
				155,
				317,
				262,
				263,
				91,
				259,
				254,
				78,
				247,
				248,
				76,
				177,
				244,
				247,
				78,
				77,
				260,
				257,
				90,
				83,
				156,
				94,
				318,
				155,
				252,
				76,
				244,
				245,
				260,
				92,
				80,
				83,
				250,
				252
			]
		}
	};

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgODQ0NzI5NzczMDZkYTg1Y2M4MzYiLCJ3ZWJwYWNrOi8vLy4vc3JjL3BjL3ByZXByb2Nlc3Mtd29ya2VyLmpzIiwid2VicGFjazovLy8uL34vZGVsYXVuYXktZmFzdC9kZWxhdW5heS5qcyIsIndlYnBhY2s6Ly8vLi93ZWJfbW9kdWxlcy9zcGF0aWFsaGFzaC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvcGMvc3RhbmRhcmQtZmFjZS1kYXRhLmpzIiwid2VicGFjazovLy8uL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC9jb21tb24uanMiLCJ3ZWJwYWNrOi8vLy4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC9tYXQyLmpzIiwid2VicGFjazovLy8uL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvbWF0MmQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC9tYXQzLmpzIiwid2VicGFjazovLy8uL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvbWF0NC5qcyIsIndlYnBhY2s6Ly8vLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L3F1YXQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC92ZWMzLmpzIiwid2VicGFjazovLy8uL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvdmVjNC5qcyIsIndlYnBhY2s6Ly8vLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L3ZlYzIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3BjL2RhdGEvZmFjZTIuanNvbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVB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LEVBQUUsQ0FBQztBQUNSLFNBQUUsRUFBRixFQUFFO0FBQ0YsU0FBRSxFQUFGLEVBQUU7QUFDRixTQUFFLEVBQUYsRUFBRTtNQUNILENBQUM7SUFDSDs7QUFFRCxPQUFNLFFBQVEsR0FBRyxTQUFYLFFBQVEsQ0FBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFLO0FBQ3JDLFNBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLFNBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLFNBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLFNBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLFNBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7OztBQUdyQixTQUFJLENBQUMsS0FBSyxHQUFHLEVBQUU7QUFDYixjQUFPLElBQUk7TUFDWjs7QUFFRCxTQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQy9DLFNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7OztBQUcvQyxTQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSyxDQUFDLEdBQUcsQ0FBQyxHQUFJLEdBQUcsRUFBRTtBQUN2QyxjQUFPLElBQUk7TUFDWjs7QUFFRCxZQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN6Qjs7QUFFRCxPQUFJLEtBQUs7QUFDVCxPQUFJLEtBQUs7QUFDVCxPQUFNLGdCQUFnQixHQUFHLFNBQW5CLGdCQUFnQixDQUFJLENBQUMsRUFBRSxDQUFDLEVBQUs7QUFDakMsU0FBSSxTQUFTLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBQyxDQUFDO0FBQ3ZGLFVBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3pDLFdBQUksSUFBSSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDdkIsV0FBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDbEQsV0FBSSxFQUFFLEVBQUU7QUFDTixjQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUs7QUFDbEIsY0FBSyxHQUFHLEVBQUU7QUFDVixnQkFBTTtRQUNQO01BQ0Y7QUFDRCxZQUFPLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDO0FBQ2xDLFVBQUssR0FBRyxDQUFDO0FBQ1QsVUFBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbEI7O0FBRUQsVUFBTyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQUMsUUFBUSxFQUFLO0FBQ2hDLFNBQUksQ0FBQyxRQUFRLEVBQUU7QUFDYixjQUFPLElBQUk7TUFDWjs7QUFFRCxTQUFJLE9BQU8sR0FBRyxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUNuRCxVQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUMxRCx1QkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM5QyxjQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLGVBQWUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQzNDLGNBQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsZUFBZSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDM0MsY0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxlQUFlLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUMzQyxjQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDekIsY0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLGNBQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUN6QixjQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO01BQ2pDO0FBQ0QsWUFBTyxPQUFPO0lBQ2YsQ0FBQztFQUNIOztBQUdELFVBQVMsR0FBRyxVQUFDLEtBQUssRUFBSzs7QUFFckIsT0FBSSxZQUFZLEdBQUcsRUFBRTtBQUNyQixPQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFDLFFBQVEsRUFBSztBQUN4QyxTQUFJLENBQUMsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDO0FBQzdCLE1BQUMsQ0FBQyxPQUFPLENBQUMsVUFBQyxDQUFDLEVBQUs7QUFDZixXQUFJLENBQUMsRUFBRTtBQUNMLHFCQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDNUI7TUFDRixDQUFDO0FBQ0YsWUFBTyxDQUFDO0lBQ1QsQ0FBQzs7QUFFRixjQUFXLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQztFQUNsQyxDOzs7Ozs7QUMzSEQ7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsNkJBQTRCLEtBQUs7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxhQUFZO0FBQ1o7O0FBRUE7QUFDQTs7QUFFQSwwQkFBeUIsR0FBRztBQUM1QjtBQUNBOztBQUVBLGlCQUFnQixHQUFHO0FBQ25CO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxtQkFBa0IsS0FBSztBQUN2Qjs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsaUJBQWdCLEtBQUs7QUFDckI7O0FBRUE7QUFDQTtBQUNBLFFBQU87O0FBRVA7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4QkFBNkIsS0FBSztBQUNsQzs7QUFFQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNEIsS0FBSztBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsOEJBQTZCLEdBQUc7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMEIsS0FBSztBQUMvQjtBQUNBOztBQUVBLDZCQUE0QixLQUFLO0FBQ2pDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEVBQUM7Ozs7Ozs7QUN6T0Q7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZSxNQUFNO0FBQ3JCLGtCQUFpQixNQUFNO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJOztBQUVBO0FBQ0EsYUFBWSxPQUFPO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGNBQWEsY0FBYztBQUMzQjtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYSxjQUFjO0FBQzNCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsRUFBQyxROzs7Ozs7Ozs7Ozs7Ozs7Ozs7S0N0SG9CLGdCQUFnQjtBQUVuQyxZQUZtQixnQkFBZ0IsR0FFckI7MkJBRkssZ0JBQWdCOztBQUdqQyxTQUFJLENBQUMsSUFBSSxHQUFHLG1CQUFPLENBQUMsRUFBbUIsQ0FBQzs7QUFFeEMsU0FBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0FBQzFGLFNBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7QUFDaEQsU0FBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDOztBQUV0RSxTQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDOUIsU0FBSSxDQUFDLElBQUksR0FBRyxVQWJSLElBQUksQ0FhUyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDdkM7O2dCQVhrQixnQkFBZ0I7O2lDQWN2QjtBQUNWLFdBQUksR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUM7QUFDaEUsV0FBSSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUNoRSxXQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRO0FBQ3RDLFdBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNO0FBQ3ZCLFlBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM3QixhQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDdkQsbUJBeEJRLElBQUksQ0F3QlAsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQ3JCLG1CQXpCUSxJQUFJLENBeUJQLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUN0QjtBQUNELGNBQU8sRUFBQyxHQUFHLEVBQUgsR0FBRyxFQUFFLEdBQUcsRUFBSCxHQUFHLEVBQUUsSUFBSSxFQUFFLFVBM0JkLElBQUksQ0EyQmUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFLFVBM0I5QyxJQUFJLENBMkIrQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUM7TUFDdEY7OztzQ0FHZ0IsS0FBSyxFQUFFO0FBQ3RCLFdBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzlDLFdBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVE7QUFDL0IsY0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDbEM7OzsrQkFHUyxLQUFLLEVBQUU7QUFDZixXQUFJLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQztBQUNqQixXQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRO0FBQy9CLGNBQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQ2xDOzs7VUF2Q2tCLGdCQUFnQjs7O21CQUFoQixnQkFBZ0IsQzs7Ozs7O0FDTHJDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3Qzs7Ozs7O0FDcENBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVUsT0FBTztBQUNqQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7OztBQ25EQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixjQUFhLE9BQU87QUFDcEI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsZUFBYztBQUNkO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsT0FBTztBQUNwQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsY0FBYSxPQUFPO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEI7O0FBRUEsbUM7QUFDQSxzQjtBQUNBLGlCO0FBQ0EsaUI7QUFDQSwrQjtBQUNBLHNCO0FBQ0EsRzs7O0FBR0E7Ozs7Ozs7QUM3U0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsY0FBYSxNQUFNO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxNQUFNO0FBQ2pCLGNBQWEsTUFBTTtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsTUFBTTtBQUNqQixZQUFXLE1BQU07QUFDakIsY0FBYSxNQUFNO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsTUFBTTtBQUNqQixjQUFhLE1BQU07QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxNQUFNO0FBQ2pCLFlBQVcsTUFBTTtBQUNqQixjQUFhLE1BQU07QUFDbkI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsTUFBTTtBQUNqQixjQUFhLE9BQU87QUFDcEI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxNQUFNO0FBQ2pCLFlBQVcsTUFBTTtBQUNqQixZQUFXLE1BQU07QUFDakIsY0FBYSxNQUFNO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsTUFBTTtBQUNqQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFVLEtBQUs7QUFDZixXQUFVLEtBQUs7QUFDZjtBQUNBLGFBQVksS0FBSztBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVSxLQUFLO0FBQ2YsV0FBVSxLQUFLO0FBQ2Y7QUFDQSxhQUFZLEtBQUs7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBLGdCO0FBQ0EscUI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsT0FBTztBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsT0FBTztBQUNwQjtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7Ozs7Ozs7QUNwakJBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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WUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLHFCQUFvQjtBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLHFCQUFvQjtBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLHFCQUFvQjtBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsNENBQTJDLGFBQWE7O0FBRXhEO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLE1BQU07QUFDakIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsTUFBTTtBQUNqQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLE1BQU07QUFDakIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0EsZ0I7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQSxnQjs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBLGdCOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxPQUFPO0FBQ3BCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFD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QTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsZUFBYztBQUNkO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxlQUFjO0FBQ2Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGVBQWM7QUFDZDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsT0FBTztBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGVBQWM7QUFDZDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLE9BQU87QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxlQUFjO0FBQ2Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixjQUFhLE9BQU87QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxlQUFjO0FBQ2Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixjQUFhLE9BQU87QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxlQUFjO0FBQ2Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsT0FBTztBQUNwQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxL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QUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxlQUFjO0FBQ2Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxlQUFjO0FBQ2Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxlQUFjO0FBQ2Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxPQUFPO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGVBQWM7QUFDZDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLE9BQU87QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsZUFBYztBQUNkO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsY0FBYSxPQUFPO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGVBQWM7QUFDZDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsT0FBTztBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxlQUFjO0FBQ2Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLE9BQU87QUFDcEI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLE1BQU07QUFDakIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxNQUFNO0FBQ2pCLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLFlBQVcsU0FBUztBQUNwQixZQUFXLE9BQU87QUFDbEIsY0FBYSxNQUFNO0FBQ25CO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQTs7QUFFQSx3QkFBdUIsT0FBTztBQUM5QiwyQkFBMEI7QUFDMUI7QUFDQSwyQkFBMEI7QUFDMUI7O0FBRUE7QUFDQTtBQUNBLEVBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsT0FBTztBQUNwQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7OztBQzFnQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRyIsImZpbGUiOiIwLndvcmtlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgODQ0NzI5NzczMDZkYTg1Y2M4MzZcbiAqKi8iLCJzZWxmLlRIUkVFID0ge31cbmltcG9ydFNjcmlwdHMoJ2xpYnMvdGhyZWUubWluLmpzJylcblxuaW1wb3J0IERlbGF1bmF5IGZyb20gJ2RlbGF1bmF5LWZhc3QnXG4vLyBodHRwOi8venVmYWxsc2dlbmVyYXRvci5naXRodWIuaW8vYXNzZXRzL2NvZGUvMjAxNC0wMS0yNi9zcGF0aWFsaGFzaC9zcGF0aWFsaGFzaC5qc1xuaW1wb3J0IHtTcGF0aWFsSGFzaH0gZnJvbSAnc3BhdGlhbGhhc2gnXG5cbmltcG9ydCBTdGFuZGFyZEZhY2VEYXRhIGZyb20gJy4vc3RhbmRhcmQtZmFjZS1kYXRhJ1xuXG5cbmNvbnN0IGNvbnZlcnREYXRhID0gKHZlcnRpY2VzKSA9PiB7XG4gIGxldCBzdGFuZGFyZEZhY2UgPSBuZXcgU3RhbmRhcmRGYWNlRGF0YSgpXG5cbiAgbGV0IHN0YW5kYXJkRmFjZVBvaW50cyA9IFtdXG4gIGxldCBwb3NpdGlvbiA9IHN0YW5kYXJkRmFjZS5kYXRhLmZhY2UucG9zaXRpb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb3NpdGlvbi5sZW5ndGg7IGkgKz0gMykge1xuICAgIHN0YW5kYXJkRmFjZVBvaW50cy5wdXNoKFtwb3NpdGlvbltpXSwgcG9zaXRpb25baSArIDFdXSlcbiAgfVxuICBzdGFuZGFyZEZhY2VQb2ludHMucHVzaChbMSwgMV0pXG4gIHN0YW5kYXJkRmFjZVBvaW50cy5wdXNoKFsxLCAtMV0pXG4gIHN0YW5kYXJkRmFjZVBvaW50cy5wdXNoKFstMSwgLTFdKVxuICBzdGFuZGFyZEZhY2VQb2ludHMucHVzaChbLTEsIDFdKVxuXG4gIGxldCB0cmlhbmdsZUluZGljZXMgPSBEZWxhdW5heS50cmlhbmd1bGF0ZShzdGFuZGFyZEZhY2VQb2ludHMpXG5cbiAgbGV0IHNwYXRpYWxIYXNoID0gbmV3IFNwYXRpYWxIYXNoKDUpXG4gIGNvbnN0IHNjYWxlID0gMTAwMFxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRyaWFuZ2xlSW5kaWNlcy5sZW5ndGg7IGkgKz0gMykge1xuICAgIGxldCB2MCA9IHN0YW5kYXJkRmFjZVBvaW50c1t0cmlhbmdsZUluZGljZXNbaV1dXG4gICAgbGV0IHYxID0gc3RhbmRhcmRGYWNlUG9pbnRzW3RyaWFuZ2xlSW5kaWNlc1tpICsgMV1dXG4gICAgbGV0IHYyID0gc3RhbmRhcmRGYWNlUG9pbnRzW3RyaWFuZ2xlSW5kaWNlc1tpICsgMl1dXG4gICAgbGV0IG1pblggPSBNYXRoLm1pbih2MFswXSwgdjFbMF0sIHYyWzBdKVxuICAgIGxldCBtaW5ZID0gTWF0aC5taW4odjBbMV0sIHYxWzFdLCB2MlsxXSlcbiAgICBsZXQgbWF4WCA9IE1hdGgubWF4KHYwWzBdLCB2MVswXSwgdjJbMF0pXG4gICAgbGV0IG1heFkgPSBNYXRoLm1heCh2MFsxXSwgdjFbMV0sIHYyWzFdKVxuICAgIHNwYXRpYWxIYXNoLmluc2VydCh7XG4gICAgICB4OiBtaW5YICogc2NhbGUsXG4gICAgICB5OiBtaW5ZICogc2NhbGUsXG4gICAgICB3aWR0aDogKG1heFggLSBtaW5YKSAqIHNjYWxlLFxuICAgICAgaGVpZ2h0OiAobWF4WSAtIG1pblkpICogc2NhbGUsXG4gICAgICBpbmRleDogaSxcbiAgICAgIHYwLFxuICAgICAgdjEsXG4gICAgICB2MiAgICAgIFxuICAgIH0pXG4gIH1cblxuICBjb25zdCBjb250YWlucyA9ICh2MCwgdjEsIHYyLCB4LCB5KSA9PiB7XG4gICAgbGV0IGEgPSB2MVswXSAtIHYwWzBdXG4gICAgbGV0IGIgPSB2MlswXSAtIHYwWzBdXG4gICAgbGV0IGMgPSB2MVsxXSAtIHYwWzFdXG4gICAgbGV0IGQgPSB2MlsxXSAtIHYwWzFdXG4gICAgbGV0IGkgPSBhICogZCAtIGIgKiBjXG5cbiAgICAvKiBEZWdlbmVyYXRlIHRyaS4gKi9cbiAgICBpZiAoaSA9PT0gMC4wKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cblxuICAgIGxldCB1ID0gKGQgKiAoeCAtIHYwWzBdKSAtIGIgKiAoeSAtIHYwWzFdKSkgLyBpXG4gICAgbGV0IHYgPSAoYSAqICh5IC0gdjBbMV0pIC0gYyAqICh4IC0gdjBbMF0pKSAvIGlcblxuICAgIC8qIElmIHdlJ3JlIG91dHNpZGUgdGhlIHRyaSwgZmFpbC4gKi9cbiAgICBpZiAodSA8IDAuMCB8fCB2IDwgMC4wIHx8ICh1ICsgdikgPiAxLjApIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuXG4gICAgcmV0dXJuIFsxIC0gdSAtIHYsIHUsIHZdXG4gIH1cblxuICBsZXQgaW5kZXhcbiAgbGV0IGNvb3JkXG4gIGNvbnN0IGdldFRyaWFuZ2xlSW5kZXggPSAoeCwgeSkgPT4ge1xuICAgIGxldCBjYW5kaWRhdGUgPSBzcGF0aWFsSGFzaC5yZXRyaWV2ZSh7eDogeCAqIHNjYWxlLCB5OiB5ICogc2NhbGUsIHdpZHRoOiAwLCBoZWlnaHQ6IDB9KVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2FuZGlkYXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgbm9kZSA9IGNhbmRpZGF0ZVtpXVxuICAgICAgbGV0IHV2ID0gY29udGFpbnMobm9kZS52MCwgbm9kZS52MSwgbm9kZS52MiwgeCwgeSlcbiAgICAgIGlmICh1dikge1xuICAgICAgICBpbmRleCA9IG5vZGUuaW5kZXhcbiAgICAgICAgY29vcmQgPSB1dlxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc29sZS53YXJuKCd0cmlhbmdsZSBub3QgZm91bmQnKVxuICAgIGluZGV4ID0gMFxuICAgIGNvb3JkID0gWzAsIDAsIDBdXG4gIH1cblxuICByZXR1cm4gdmVydGljZXMubWFwKCh2ZXJ0aWNlcykgPT4ge1xuICAgIGlmICghdmVydGljZXMpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuXG4gICAgbGV0IHdlaWdodHMgPSBuZXcgRmxvYXQzMkFycmF5KHZlcnRpY2VzLmxlbmd0aCAqIDcpXG4gICAgZm9yIChsZXQgaSA9IDAsIGogPSAwOyBpIDwgdmVydGljZXMubGVuZ3RoOyBpICs9IDMsIGogKz0gNykge1xuICAgICAgZ2V0VHJpYW5nbGVJbmRleCh2ZXJ0aWNlc1tpXSwgdmVydGljZXNbaSArIDFdKVxuICAgICAgd2VpZ2h0c1tqICsgMF0gPSB0cmlhbmdsZUluZGljZXNbaW5kZXggKyAwXVxuICAgICAgd2VpZ2h0c1tqICsgMV0gPSB0cmlhbmdsZUluZGljZXNbaW5kZXggKyAxXVxuICAgICAgd2VpZ2h0c1tqICsgMl0gPSB0cmlhbmdsZUluZGljZXNbaW5kZXggKyAyXVxuICAgICAgd2VpZ2h0c1tqICsgM10gPSBjb29yZFswXVxuICAgICAgd2VpZ2h0c1tqICsgNF0gPSBjb29yZFsxXVxuICAgICAgd2VpZ2h0c1tqICsgNV0gPSBjb29yZFsyXVxuICAgICAgd2VpZ2h0c1tqICsgNl0gPSB2ZXJ0aWNlc1tpICsgMl1cbiAgICB9XG4gICAgcmV0dXJuIHdlaWdodHNcbiAgfSlcbn1cblxuXG5vbm1lc3NhZ2UgPSAoZXZlbnQpID0+IHtcbiAgLy8gY29uc29sZS5sb2coJ3N0YXJ0JywgcGVyZm9ybWFuY2Uubm93KCkpXG4gIGxldCB0cmFuc2Zlckxpc3QgPSBbXVxuICBsZXQgcmVzdWx0ID0gZXZlbnQuZGF0YS5tYXAoKHZlcnRpY2VzKSA9PiB7XG4gICAgbGV0IHYgPSBjb252ZXJ0RGF0YSh2ZXJ0aWNlcylcbiAgICB2LmZvckVhY2goKGEpID0+IHtcbiAgICAgIGlmIChhKSB7XG4gICAgICAgIHRyYW5zZmVyTGlzdC5wdXNoKGEuYnVmZmVyKVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIHZcbiAgfSlcbiAgLy8gY29uc29sZS5sb2coJ2RvbmUnLCBwZXJmb3JtYW5jZS5ub3coKSlcbiAgcG9zdE1lc3NhZ2UocmVzdWx0LCB0cmFuc2Zlckxpc3QpXG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9wYy9wcmVwcm9jZXNzLXdvcmtlci5qc1xuICoqLyIsInZhciBEZWxhdW5heTtcblxuKGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgRVBTSUxPTiA9IDEuMCAvIDEwNDg1NzYuMDtcblxuICBmdW5jdGlvbiBzdXBlcnRyaWFuZ2xlKHZlcnRpY2VzKSB7XG4gICAgdmFyIHhtaW4gPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXG4gICAgICAgIHltaW4gPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXG4gICAgICAgIHhtYXggPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXG4gICAgICAgIHltYXggPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXG4gICAgICAgIGksIGR4LCBkeSwgZG1heCwgeG1pZCwgeW1pZDtcblxuICAgIGZvcihpID0gdmVydGljZXMubGVuZ3RoOyBpLS07ICkge1xuICAgICAgaWYodmVydGljZXNbaV1bMF0gPCB4bWluKSB4bWluID0gdmVydGljZXNbaV1bMF07XG4gICAgICBpZih2ZXJ0aWNlc1tpXVswXSA+IHhtYXgpIHhtYXggPSB2ZXJ0aWNlc1tpXVswXTtcbiAgICAgIGlmKHZlcnRpY2VzW2ldWzFdIDwgeW1pbikgeW1pbiA9IHZlcnRpY2VzW2ldWzFdO1xuICAgICAgaWYodmVydGljZXNbaV1bMV0gPiB5bWF4KSB5bWF4ID0gdmVydGljZXNbaV1bMV07XG4gICAgfVxuXG4gICAgZHggPSB4bWF4IC0geG1pbjtcbiAgICBkeSA9IHltYXggLSB5bWluO1xuICAgIGRtYXggPSBNYXRoLm1heChkeCwgZHkpO1xuICAgIHhtaWQgPSB4bWluICsgZHggKiAwLjU7XG4gICAgeW1pZCA9IHltaW4gKyBkeSAqIDAuNTtcblxuICAgIHJldHVybiBbXG4gICAgICBbeG1pZCAtIDIwICogZG1heCwgeW1pZCAtICAgICAgZG1heF0sXG4gICAgICBbeG1pZCAgICAgICAgICAgICwgeW1pZCArIDIwICogZG1heF0sXG4gICAgICBbeG1pZCArIDIwICogZG1heCwgeW1pZCAtICAgICAgZG1heF1cbiAgICBdO1xuICB9XG5cbiAgZnVuY3Rpb24gY2lyY3VtY2lyY2xlKHZlcnRpY2VzLCBpLCBqLCBrKSB7XG4gICAgdmFyIHgxID0gdmVydGljZXNbaV1bMF0sXG4gICAgICAgIHkxID0gdmVydGljZXNbaV1bMV0sXG4gICAgICAgIHgyID0gdmVydGljZXNbal1bMF0sXG4gICAgICAgIHkyID0gdmVydGljZXNbal1bMV0sXG4gICAgICAgIHgzID0gdmVydGljZXNba11bMF0sXG4gICAgICAgIHkzID0gdmVydGljZXNba11bMV0sXG4gICAgICAgIGZhYnN5MXkyID0gTWF0aC5hYnMoeTEgLSB5MiksXG4gICAgICAgIGZhYnN5MnkzID0gTWF0aC5hYnMoeTIgLSB5MyksXG4gICAgICAgIHhjLCB5YywgbTEsIG0yLCBteDEsIG14MiwgbXkxLCBteTIsIGR4LCBkeTtcblxuICAgIC8qIENoZWNrIGZvciBjb2luY2lkZW50IHBvaW50cyAqL1xuICAgIGlmKGZhYnN5MXkyIDwgRVBTSUxPTiAmJiBmYWJzeTJ5MyA8IEVQU0lMT04pXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFZWshIENvaW5jaWRlbnQgcG9pbnRzIVwiKTtcblxuICAgIGlmKGZhYnN5MXkyIDwgRVBTSUxPTikge1xuICAgICAgbTIgID0gLSgoeDMgLSB4MikgLyAoeTMgLSB5MikpO1xuICAgICAgbXgyID0gKHgyICsgeDMpIC8gMi4wO1xuICAgICAgbXkyID0gKHkyICsgeTMpIC8gMi4wO1xuICAgICAgeGMgID0gKHgyICsgeDEpIC8gMi4wO1xuICAgICAgeWMgID0gbTIgKiAoeGMgLSBteDIpICsgbXkyO1xuICAgIH1cblxuICAgIGVsc2UgaWYoZmFic3kyeTMgPCBFUFNJTE9OKSB7XG4gICAgICBtMSAgPSAtKCh4MiAtIHgxKSAvICh5MiAtIHkxKSk7XG4gICAgICBteDEgPSAoeDEgKyB4MikgLyAyLjA7XG4gICAgICBteTEgPSAoeTEgKyB5MikgLyAyLjA7XG4gICAgICB4YyAgPSAoeDMgKyB4MikgLyAyLjA7XG4gICAgICB5YyAgPSBtMSAqICh4YyAtIG14MSkgKyBteTE7XG4gICAgfVxuXG4gICAgZWxzZSB7XG4gICAgICBtMSAgPSAtKCh4MiAtIHgxKSAvICh5MiAtIHkxKSk7XG4gICAgICBtMiAgPSAtKCh4MyAtIHgyKSAvICh5MyAtIHkyKSk7XG4gICAgICBteDEgPSAoeDEgKyB4MikgLyAyLjA7XG4gICAgICBteDIgPSAoeDIgKyB4MykgLyAyLjA7XG4gICAgICBteTEgPSAoeTEgKyB5MikgLyAyLjA7XG4gICAgICBteTIgPSAoeTIgKyB5MykgLyAyLjA7XG4gICAgICB4YyAgPSAobTEgKiBteDEgLSBtMiAqIG14MiArIG15MiAtIG15MSkgLyAobTEgLSBtMik7XG4gICAgICB5YyAgPSAoZmFic3kxeTIgPiBmYWJzeTJ5MykgP1xuICAgICAgICBtMSAqICh4YyAtIG14MSkgKyBteTEgOlxuICAgICAgICBtMiAqICh4YyAtIG14MikgKyBteTI7XG4gICAgfVxuXG4gICAgZHggPSB4MiAtIHhjO1xuICAgIGR5ID0geTIgLSB5YztcbiAgICByZXR1cm4ge2k6IGksIGo6IGosIGs6IGssIHg6IHhjLCB5OiB5YywgcjogZHggKiBkeCArIGR5ICogZHl9O1xuICB9XG5cbiAgZnVuY3Rpb24gZGVkdXAoZWRnZXMpIHtcbiAgICB2YXIgaSwgaiwgYSwgYiwgbSwgbjtcblxuICAgIGZvcihqID0gZWRnZXMubGVuZ3RoOyBqOyApIHtcbiAgICAgIGIgPSBlZGdlc1stLWpdO1xuICAgICAgYSA9IGVkZ2VzWy0tal07XG5cbiAgICAgIGZvcihpID0gajsgaTsgKSB7XG4gICAgICAgIG4gPSBlZGdlc1stLWldO1xuICAgICAgICBtID0gZWRnZXNbLS1pXTtcblxuICAgICAgICBpZigoYSA9PT0gbSAmJiBiID09PSBuKSB8fCAoYSA9PT0gbiAmJiBiID09PSBtKSkge1xuICAgICAgICAgIGVkZ2VzLnNwbGljZShqLCAyKTtcbiAgICAgICAgICBlZGdlcy5zcGxpY2UoaSwgMik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBEZWxhdW5heSA9IHtcbiAgICB0cmlhbmd1bGF0ZTogZnVuY3Rpb24odmVydGljZXMsIGtleSkge1xuICAgICAgdmFyIG4gPSB2ZXJ0aWNlcy5sZW5ndGgsXG4gICAgICAgICAgaSwgaiwgaW5kaWNlcywgc3QsIG9wZW4sIGNsb3NlZCwgZWRnZXMsIGR4LCBkeSwgYSwgYiwgYztcblxuICAgICAgLyogQmFpbCBpZiB0aGVyZSBhcmVuJ3QgZW5vdWdoIHZlcnRpY2VzIHRvIGZvcm0gYW55IHRyaWFuZ2xlcy4gKi9cbiAgICAgIGlmKG4gPCAzKVxuICAgICAgICByZXR1cm4gW107XG5cbiAgICAgIC8qIFNsaWNlIG91dCB0aGUgYWN0dWFsIHZlcnRpY2VzIGZyb20gdGhlIHBhc3NlZCBvYmplY3RzLiAoRHVwbGljYXRlIHRoZVxuICAgICAgICogYXJyYXkgZXZlbiBpZiB3ZSBkb24ndCwgdGhvdWdoLCBzaW5jZSB3ZSBuZWVkIHRvIG1ha2UgYSBzdXBlcnRyaWFuZ2xlXG4gICAgICAgKiBsYXRlciBvbiEpICovXG4gICAgICB2ZXJ0aWNlcyA9IHZlcnRpY2VzLnNsaWNlKDApO1xuXG4gICAgICBpZihrZXkpXG4gICAgICAgIGZvcihpID0gbjsgaS0tOyApXG4gICAgICAgICAgdmVydGljZXNbaV0gPSB2ZXJ0aWNlc1tpXVtrZXldO1xuXG4gICAgICAvKiBNYWtlIGFuIGFycmF5IG9mIGluZGljZXMgaW50byB0aGUgdmVydGV4IGFycmF5LCBzb3J0ZWQgYnkgdGhlXG4gICAgICAgKiB2ZXJ0aWNlcycgeC1wb3NpdGlvbi4gKi9cbiAgICAgIGluZGljZXMgPSBuZXcgQXJyYXkobik7XG5cbiAgICAgIGZvcihpID0gbjsgaS0tOyApXG4gICAgICAgIGluZGljZXNbaV0gPSBpO1xuXG4gICAgICBpbmRpY2VzLnNvcnQoZnVuY3Rpb24oaSwgaikge1xuICAgICAgICByZXR1cm4gdmVydGljZXNbal1bMF0gLSB2ZXJ0aWNlc1tpXVswXTtcbiAgICAgIH0pO1xuXG4gICAgICAvKiBOZXh0LCBmaW5kIHRoZSB2ZXJ0aWNlcyBvZiB0aGUgc3VwZXJ0cmlhbmdsZSAod2hpY2ggY29udGFpbnMgYWxsIG90aGVyXG4gICAgICAgKiB0cmlhbmdsZXMpLCBhbmQgYXBwZW5kIHRoZW0gb250byB0aGUgZW5kIG9mIGEgKGNvcHkgb2YpIHRoZSB2ZXJ0ZXhcbiAgICAgICAqIGFycmF5LiAqL1xuICAgICAgc3QgPSBzdXBlcnRyaWFuZ2xlKHZlcnRpY2VzKTtcbiAgICAgIHZlcnRpY2VzLnB1c2goc3RbMF0sIHN0WzFdLCBzdFsyXSk7XG4gICAgICBcbiAgICAgIC8qIEluaXRpYWxpemUgdGhlIG9wZW4gbGlzdCAoY29udGFpbmluZyB0aGUgc3VwZXJ0cmlhbmdsZSBhbmQgbm90aGluZ1xuICAgICAgICogZWxzZSkgYW5kIHRoZSBjbG9zZWQgbGlzdCAod2hpY2ggaXMgZW1wdHkgc2luY2Ugd2UgaGF2bid0IHByb2Nlc3NlZFxuICAgICAgICogYW55IHRyaWFuZ2xlcyB5ZXQpLiAqL1xuICAgICAgb3BlbiAgID0gW2NpcmN1bWNpcmNsZSh2ZXJ0aWNlcywgbiArIDAsIG4gKyAxLCBuICsgMildO1xuICAgICAgY2xvc2VkID0gW107XG4gICAgICBlZGdlcyAgPSBbXTtcblxuICAgICAgLyogSW5jcmVtZW50YWxseSBhZGQgZWFjaCB2ZXJ0ZXggdG8gdGhlIG1lc2guICovXG4gICAgICBmb3IoaSA9IGluZGljZXMubGVuZ3RoOyBpLS07IGVkZ2VzLmxlbmd0aCA9IDApIHtcbiAgICAgICAgYyA9IGluZGljZXNbaV07XG5cbiAgICAgICAgLyogRm9yIGVhY2ggb3BlbiB0cmlhbmdsZSwgY2hlY2sgdG8gc2VlIGlmIHRoZSBjdXJyZW50IHBvaW50IGlzXG4gICAgICAgICAqIGluc2lkZSBpdCdzIGNpcmN1bWNpcmNsZS4gSWYgaXQgaXMsIHJlbW92ZSB0aGUgdHJpYW5nbGUgYW5kIGFkZFxuICAgICAgICAgKiBpdCdzIGVkZ2VzIHRvIGFuIGVkZ2UgbGlzdC4gKi9cbiAgICAgICAgZm9yKGogPSBvcGVuLmxlbmd0aDsgai0tOyApIHtcbiAgICAgICAgICAvKiBJZiB0aGlzIHBvaW50IGlzIHRvIHRoZSByaWdodCBvZiB0aGlzIHRyaWFuZ2xlJ3MgY2lyY3VtY2lyY2xlLFxuICAgICAgICAgICAqIHRoZW4gdGhpcyB0cmlhbmdsZSBzaG91bGQgbmV2ZXIgZ2V0IGNoZWNrZWQgYWdhaW4uIFJlbW92ZSBpdFxuICAgICAgICAgICAqIGZyb20gdGhlIG9wZW4gbGlzdCwgYWRkIGl0IHRvIHRoZSBjbG9zZWQgbGlzdCwgYW5kIHNraXAuICovXG4gICAgICAgICAgZHggPSB2ZXJ0aWNlc1tjXVswXSAtIG9wZW5bal0ueDtcbiAgICAgICAgICBpZihkeCA+IDAuMCAmJiBkeCAqIGR4ID4gb3BlbltqXS5yKSB7XG4gICAgICAgICAgICBjbG9zZWQucHVzaChvcGVuW2pdKTtcbiAgICAgICAgICAgIG9wZW4uc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLyogSWYgd2UncmUgb3V0c2lkZSB0aGUgY2lyY3VtY2lyY2xlLCBza2lwIHRoaXMgdHJpYW5nbGUuICovXG4gICAgICAgICAgZHkgPSB2ZXJ0aWNlc1tjXVsxXSAtIG9wZW5bal0ueTtcbiAgICAgICAgICBpZihkeCAqIGR4ICsgZHkgKiBkeSAtIG9wZW5bal0uciA+IEVQU0lMT04pXG4gICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgIC8qIFJlbW92ZSB0aGUgdHJpYW5nbGUgYW5kIGFkZCBpdCdzIGVkZ2VzIHRvIHRoZSBlZGdlIGxpc3QuICovXG4gICAgICAgICAgZWRnZXMucHVzaChcbiAgICAgICAgICAgIG9wZW5bal0uaSwgb3BlbltqXS5qLFxuICAgICAgICAgICAgb3BlbltqXS5qLCBvcGVuW2pdLmssXG4gICAgICAgICAgICBvcGVuW2pdLmssIG9wZW5bal0uaVxuICAgICAgICAgICk7XG4gICAgICAgICAgb3Blbi5zcGxpY2UoaiwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBSZW1vdmUgYW55IGRvdWJsZWQgZWRnZXMuICovXG4gICAgICAgIGRlZHVwKGVkZ2VzKTtcblxuICAgICAgICAvKiBBZGQgYSBuZXcgdHJpYW5nbGUgZm9yIGVhY2ggZWRnZS4gKi9cbiAgICAgICAgZm9yKGogPSBlZGdlcy5sZW5ndGg7IGo7ICkge1xuICAgICAgICAgIGIgPSBlZGdlc1stLWpdO1xuICAgICAgICAgIGEgPSBlZGdlc1stLWpdO1xuICAgICAgICAgIG9wZW4ucHVzaChjaXJjdW1jaXJjbGUodmVydGljZXMsIGEsIGIsIGMpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvKiBDb3B5IGFueSByZW1haW5pbmcgb3BlbiB0cmlhbmdsZXMgdG8gdGhlIGNsb3NlZCBsaXN0LCBhbmQgdGhlblxuICAgICAgICogcmVtb3ZlIGFueSB0cmlhbmdsZXMgdGhhdCBzaGFyZSBhIHZlcnRleCB3aXRoIHRoZSBzdXBlcnRyaWFuZ2xlLFxuICAgICAgICogYnVpbGRpbmcgYSBsaXN0IG9mIHRyaXBsZXRzIHRoYXQgcmVwcmVzZW50IHRyaWFuZ2xlcy4gKi9cbiAgICAgIGZvcihpID0gb3Blbi5sZW5ndGg7IGktLTsgKVxuICAgICAgICBjbG9zZWQucHVzaChvcGVuW2ldKTtcbiAgICAgIG9wZW4ubGVuZ3RoID0gMDtcblxuICAgICAgZm9yKGkgPSBjbG9zZWQubGVuZ3RoOyBpLS07IClcbiAgICAgICAgaWYoY2xvc2VkW2ldLmkgPCBuICYmIGNsb3NlZFtpXS5qIDwgbiAmJiBjbG9zZWRbaV0uayA8IG4pXG4gICAgICAgICAgb3Blbi5wdXNoKGNsb3NlZFtpXS5pLCBjbG9zZWRbaV0uaiwgY2xvc2VkW2ldLmspO1xuXG4gICAgICAvKiBZYXksIHdlJ3JlIGRvbmUhICovXG4gICAgICByZXR1cm4gb3BlbjtcbiAgICB9LFxuICAgIGNvbnRhaW5zOiBmdW5jdGlvbih0cmksIHApIHtcbiAgICAgIC8qIEJvdW5kaW5nIGJveCB0ZXN0IGZpcnN0LCBmb3IgcXVpY2sgcmVqZWN0aW9ucy4gKi9cbiAgICAgIGlmKChwWzBdIDwgdHJpWzBdWzBdICYmIHBbMF0gPCB0cmlbMV1bMF0gJiYgcFswXSA8IHRyaVsyXVswXSkgfHxcbiAgICAgICAgIChwWzBdID4gdHJpWzBdWzBdICYmIHBbMF0gPiB0cmlbMV1bMF0gJiYgcFswXSA+IHRyaVsyXVswXSkgfHxcbiAgICAgICAgIChwWzFdIDwgdHJpWzBdWzFdICYmIHBbMV0gPCB0cmlbMV1bMV0gJiYgcFsxXSA8IHRyaVsyXVsxXSkgfHxcbiAgICAgICAgIChwWzFdID4gdHJpWzBdWzFdICYmIHBbMV0gPiB0cmlbMV1bMV0gJiYgcFsxXSA+IHRyaVsyXVsxXSkpXG4gICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICB2YXIgYSA9IHRyaVsxXVswXSAtIHRyaVswXVswXSxcbiAgICAgICAgICBiID0gdHJpWzJdWzBdIC0gdHJpWzBdWzBdLFxuICAgICAgICAgIGMgPSB0cmlbMV1bMV0gLSB0cmlbMF1bMV0sXG4gICAgICAgICAgZCA9IHRyaVsyXVsxXSAtIHRyaVswXVsxXSxcbiAgICAgICAgICBpID0gYSAqIGQgLSBiICogYztcblxuICAgICAgLyogRGVnZW5lcmF0ZSB0cmkuICovXG4gICAgICBpZihpID09PSAwLjApXG4gICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICB2YXIgdSA9IChkICogKHBbMF0gLSB0cmlbMF1bMF0pIC0gYiAqIChwWzFdIC0gdHJpWzBdWzFdKSkgLyBpLFxuICAgICAgICAgIHYgPSAoYSAqIChwWzFdIC0gdHJpWzBdWzFdKSAtIGMgKiAocFswXSAtIHRyaVswXVswXSkpIC8gaTtcblxuICAgICAgLyogSWYgd2UncmUgb3V0c2lkZSB0aGUgdHJpLCBmYWlsLiAqL1xuICAgICAgaWYodSA8IDAuMCB8fCB2IDwgMC4wIHx8ICh1ICsgdikgPiAxLjApXG4gICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICByZXR1cm4gW3UsIHZdO1xuICAgIH1cbiAgfTtcblxuICBpZih0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiKVxuICAgIG1vZHVsZS5leHBvcnRzID0gRGVsYXVuYXk7XG59KSgpO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vZGVsYXVuYXktZmFzdC9kZWxhdW5heS5qc1xuICoqIG1vZHVsZSBpZCA9IDFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qXG5cblRoZSBNSVQgTGljZW5zZSAoTUlUKVxuXG5Db3B5cmlnaHQgKGMpIDIwMTQgQ2hyaXN0ZXIgQnlzdHJvbVxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuXG5cbkEgc3BhdGlhbCBoYXNoLiBGb3IgYW4gZXhwbGFuYXRpb24sIHNlZVxuXG5odHRwOi8vd3d3LmdhbWVkZXYubmV0L3BhZ2UvcmVzb3VyY2VzL18vdGVjaG5pY2FsL2dhbWUtcHJvZ3JhbW1pbmcvc3BhdGlhbC1oYXNoaW5nLXIyNjk3XG5cbkZvciBjb21wdXRhdGlvbmFsIGVmZmljaWVuY3ksIHRoZSBwb3NpdGlvbnMgYXJlIGJpdC1zaGlmdGVkIG4gdGltZXMuIFRoaXMgbWVhbnNcbnRoYXQgdGhleSBhcmUgZGl2aWRlZCBieSBhIGZhY3RvciBvZiBwb3dlciBvZiB0d28uIFRoaXMgZmFjdG9yIGlzIHRoZVxub25seSBhcmd1bWVudCB0byB0aGUgY29uc3RydWN0b3IuXG5cbiovXG5cbihmdW5jdGlvbih3KSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgXG4gIHZhciBERUZBVUxUX1BPV0VSX09GX1RXTyA9IDU7XG4gIFxuICBmdW5jdGlvbiBtYWtlS2V5c0ZuKHNoaWZ0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuICAgICAgdmFyIHN4ID0gb2JqLnggPj4gc2hpZnQsXG4gICAgICAgIHN5ID0gb2JqLnkgPj4gc2hpZnQsXG4gICAgICAgIGV4ID0gKG9iai54ICsgb2JqLndpZHRoKSA+PiBzaGlmdCxcbiAgICAgICAgZXkgPSAob2JqLnkgKyBvYmouaGVpZ2h0KSA+PiBzaGlmdCxcbiAgICAgICAgeCwgeSwga2V5cyA9IFtdO1xuICAgICAgZm9yKHk9c3k7eTw9ZXk7eSsrKSB7XG4gICAgICAgIGZvcih4PXN4O3g8PWV4O3grKykge1xuICAgICAgICAgIGtleXMucHVzaChcIlwiICsgeCArIFwiOlwiICsgeSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBrZXlzO1xuICAgIH07XG4gIH0gIFxuICBcbiAgLyoqXG4gICogQHBhcmFtIHtudW1iZXJ9IHBvd2VyX29mX3R3byAtIGhvdyBtYW55IHRpbWVzIHRoZSByZWN0cyBzaG91bGQgYmUgc2hpZnRlZFxuICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGVuIGhhc2hpbmdcbiAgKi9cbiAgZnVuY3Rpb24gU3BhdGlhbEhhc2gocG93ZXJfb2ZfdHdvKSB7XG4gICAgaWYgKCFwb3dlcl9vZl90d28pIHtcbiAgICAgIHBvd2VyX29mX3R3byA9IERFRkFVTFRfUE9XRVJfT0ZfVFdPO1xuICAgIH1cbiAgICB0aGlzLmdldEtleXMgPSBtYWtlS2V5c0ZuKHBvd2VyX29mX3R3byk7XG4gICAgdGhpcy5oYXNoID0ge307XG4gICAgdGhpcy5saXN0ID0gW107XG4gICAgdGhpcy5fbGFzdFRvdGFsQ2xlYXJlZCA9IDA7XG4gIH1cbiAgXG4gIFNwYXRpYWxIYXNoLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBrZXk7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5oYXNoKSB7XG4gICAgICBpZiAodGhpcy5oYXNoW2tleV0ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmhhc2hba2V5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaGFzaFtrZXldLmxlbmd0aCA9IDA7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubGlzdC5sZW5ndGggPSAwO1xuICB9O1xuICBcbiAgU3BhdGlhbEhhc2gucHJvdG90eXBlLmdldE51bUJ1Y2tldHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIga2V5LCBjb3VudCA9IDA7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5oYXNoKSB7XG4gICAgICBpZiAodGhpcy5oYXNoLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgaWYgKHRoaXMuaGFzaFtrZXldLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb3VudDtcbiAgICBcbiAgfTtcbiAgXG4gIFNwYXRpYWxIYXNoLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbihvYmosIHJlY3QpIHtcbiAgICB2YXIga2V5cyA9IHRoaXMuZ2V0S2V5cyhyZWN0IHx8IG9iaiksIGtleSwgaTtcbiAgICB0aGlzLmxpc3QucHVzaChvYmopO1xuICAgIGZvciAoaT0wO2k8a2V5cy5sZW5ndGg7aSsrKSB7XG4gICAgICBrZXkgPSBrZXlzW2ldO1xuICAgICAgaWYgKHRoaXMuaGFzaFtrZXldKSB7XG4gICAgICAgIHRoaXMuaGFzaFtrZXldLnB1c2gob2JqKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaGFzaFtrZXldID0gW29ial07XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBcbiAgU3BhdGlhbEhhc2gucHJvdG90eXBlLnJldHJpZXZlID0gZnVuY3Rpb24ob2JqLCByZWN0KSB7XG4gICAgdmFyIHJldCA9IFtdLCBrZXlzLCBpLCBrZXk7XG4gICAgaWYgKCFvYmogJiYgIXJlY3QpIHtcbiAgICAgIHJldHVybiB0aGlzLmxpc3Q7XG4gICAgfVxuICAgIGtleXMgPSB0aGlzLmdldEtleXMocmVjdCB8fCBvYmopO1xuICAgIGZvciAoaT0wO2k8a2V5cy5sZW5ndGg7aSsrKSB7XG4gICAgICBrZXkgPSBrZXlzW2ldO1xuICAgICAgaWYgKHRoaXMuaGFzaFtrZXldKSB7XG4gICAgICAgIHJldCA9IHJldC5jb25jYXQodGhpcy5oYXNoW2tleV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9O1xuICBcbiAgdy5TcGF0aWFsSGFzaCA9IFNwYXRpYWxIYXNoO1xufSkodGhpcyk7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3dlYl9tb2R1bGVzL3NwYXRpYWxoYXNoLmpzXG4gKiogbW9kdWxlIGlkID0gMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyogZ2xvYmFsIFRIUkVFICovXG5cbmltcG9ydCB7dmVjMiwgdmVjM30gZnJvbSAnZ2wtbWF0cml4J1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN0YW5kYXJkRmFjZURhdGEge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZGF0YSA9IHJlcXVpcmUoJy4vZGF0YS9mYWNlMi5qc29uJylcblxuICAgIGxldCBpbmRleCA9IHRoaXMuZGF0YS5mYWNlLmluZGV4LmNvbmNhdCh0aGlzLmRhdGEucmlnaHRFeWUuaW5kZXgsIHRoaXMuZGF0YS5sZWZ0RXllLmluZGV4KVxuICAgIHRoaXMuaW5kZXggPSBuZXcgVEhSRUUuVWludDE2QXR0cmlidXRlKGluZGV4LCAxKVxuICAgIHRoaXMucG9zaXRpb24gPSBuZXcgVEhSRUUuRmxvYXQzMkF0dHJpYnV0ZSh0aGlzLmRhdGEuZmFjZS5wb3NpdGlvbiwgMylcblxuICAgIHRoaXMuYm91bmRzID0gdGhpcy5nZXRCb3VuZHMoKVxuICAgIHRoaXMuc2l6ZSA9IHZlYzIubGVuKHRoaXMuYm91bmRzLnNpemUpXG4gIH1cblxuXG4gIGdldEJvdW5kcygpIHtcbiAgICBsZXQgbWluID0gW051bWJlci5NQVhfVkFMVUUsIE51bWJlci5NQVhfVkFMVUUsIE51bWJlci5NQVhfVkFMVUVdXG4gICAgbGV0IG1heCA9IFtOdW1iZXIuTUlOX1ZBTFVFLCBOdW1iZXIuTUlOX1ZBTFVFLCBOdW1iZXIuTUlOX1ZBTFVFXVxuICAgIGxldCBwb3NpdGlvbiA9IHRoaXMuZGF0YS5mYWNlLnBvc2l0aW9uXG4gICAgbGV0IG4gPSBwb3NpdGlvbi5sZW5ndGhcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkgKz0gMykge1xuICAgICAgbGV0IHAgPSBbcG9zaXRpb25baV0sIHBvc2l0aW9uW2kgKyAxXSwgcG9zaXRpb25baSArIDJdXVxuICAgICAgdmVjMy5taW4obWluLCBtaW4sIHApXG4gICAgICB2ZWMzLm1heChtYXgsIG1heCwgcClcbiAgICB9XG4gICAgcmV0dXJuIHttaW4sIG1heCwgc2l6ZTogdmVjMy5zdWIoW10sIG1heCwgbWluKSwgY2VudGVyOiB2ZWMzLmxlcnAoW10sIG1pbiwgbWF4LCAwLjUpfVxuICB9XG5cblxuICBnZXRGZWF0dXJlVmVydGV4KGluZGV4KSB7XG4gICAgbGV0IGkgPSB0aGlzLmRhdGEuZmFjZS5mZWF0dXJlUG9pbnRbaW5kZXhdICogM1xuICAgIGxldCBwID0gdGhpcy5kYXRhLmZhY2UucG9zaXRpb25cbiAgICByZXR1cm4gW3BbaV0sIHBbaSArIDFdLCBwW2kgKyAyXV1cbiAgfVxuXG5cbiAgZ2V0VmVydGV4KGluZGV4KSB7XG4gICAgbGV0IGkgPSBpbmRleCAqIDNcbiAgICBsZXQgcCA9IHRoaXMuZGF0YS5mYWNlLnBvc2l0aW9uXG4gICAgcmV0dXJuIFtwW2ldLCBwW2kgKyAxXSwgcFtpICsgMl1dXG4gIH1cbiBcbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3BjL3N0YW5kYXJkLWZhY2UtZGF0YS5qc1xuICoqLyIsIi8qKlxuICogQGZpbGVvdmVydmlldyBnbC1tYXRyaXggLSBIaWdoIHBlcmZvcm1hbmNlIG1hdHJpeCBhbmQgdmVjdG9yIG9wZXJhdGlvbnNcbiAqIEBhdXRob3IgQnJhbmRvbiBKb25lc1xuICogQGF1dGhvciBDb2xpbiBNYWNLZW56aWUgSVZcbiAqIEB2ZXJzaW9uIDIuMy4wXG4gKi9cblxuLyogQ29weXJpZ2h0IChjKSAyMDE1LCBCcmFuZG9uIEpvbmVzLCBDb2xpbiBNYWNLZW56aWUgSVYuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS4gKi9cbi8vIEVORCBIRUFERVJcblxuZXhwb3J0cy5nbE1hdHJpeCA9IHJlcXVpcmUoXCIuL2dsLW1hdHJpeC9jb21tb24uanNcIik7XG5leHBvcnRzLm1hdDIgPSByZXF1aXJlKFwiLi9nbC1tYXRyaXgvbWF0Mi5qc1wiKTtcbmV4cG9ydHMubWF0MmQgPSByZXF1aXJlKFwiLi9nbC1tYXRyaXgvbWF0MmQuanNcIik7XG5leHBvcnRzLm1hdDMgPSByZXF1aXJlKFwiLi9nbC1tYXRyaXgvbWF0My5qc1wiKTtcbmV4cG9ydHMubWF0NCA9IHJlcXVpcmUoXCIuL2dsLW1hdHJpeC9tYXQ0LmpzXCIpO1xuZXhwb3J0cy5xdWF0ID0gcmVxdWlyZShcIi4vZ2wtbWF0cml4L3F1YXQuanNcIik7XG5leHBvcnRzLnZlYzIgPSByZXF1aXJlKFwiLi9nbC1tYXRyaXgvdmVjMi5qc1wiKTtcbmV4cG9ydHMudmVjMyA9IHJlcXVpcmUoXCIuL2dsLW1hdHJpeC92ZWMzLmpzXCIpO1xuZXhwb3J0cy52ZWM0ID0gcmVxdWlyZShcIi4vZ2wtbWF0cml4L3ZlYzQuanNcIik7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXguanNcbiAqKiBtb2R1bGUgaWQgPSA0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiBDb3B5cmlnaHQgKGMpIDIwMTUsIEJyYW5kb24gSm9uZXMsIENvbGluIE1hY0tlbnppZSBJVi5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLiAqL1xuXG4vKipcbiAqIEBjbGFzcyBDb21tb24gdXRpbGl0aWVzXG4gKiBAbmFtZSBnbE1hdHJpeFxuICovXG52YXIgZ2xNYXRyaXggPSB7fTtcblxuLy8gQ29uc3RhbnRzXG5nbE1hdHJpeC5FUFNJTE9OID0gMC4wMDAwMDE7XG5nbE1hdHJpeC5BUlJBWV9UWVBFID0gKHR5cGVvZiBGbG9hdDMyQXJyYXkgIT09ICd1bmRlZmluZWQnKSA/IEZsb2F0MzJBcnJheSA6IEFycmF5O1xuZ2xNYXRyaXguUkFORE9NID0gTWF0aC5yYW5kb207XG5cbi8qKlxuICogU2V0cyB0aGUgdHlwZSBvZiBhcnJheSB1c2VkIHdoZW4gY3JlYXRpbmcgbmV3IHZlY3RvcnMgYW5kIG1hdHJpY2VzXG4gKlxuICogQHBhcmFtIHtUeXBlfSB0eXBlIEFycmF5IHR5cGUsIHN1Y2ggYXMgRmxvYXQzMkFycmF5IG9yIEFycmF5XG4gKi9cbmdsTWF0cml4LnNldE1hdHJpeEFycmF5VHlwZSA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICBHTE1BVF9BUlJBWV9UWVBFID0gdHlwZTtcbn1cblxudmFyIGRlZ3JlZSA9IE1hdGguUEkgLyAxODA7XG5cbi8qKlxuKiBDb252ZXJ0IERlZ3JlZSBUbyBSYWRpYW5cbipcbiogQHBhcmFtIHtOdW1iZXJ9IEFuZ2xlIGluIERlZ3JlZXNcbiovXG5nbE1hdHJpeC50b1JhZGlhbiA9IGZ1bmN0aW9uKGEpe1xuICAgICByZXR1cm4gYSAqIGRlZ3JlZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnbE1hdHJpeDtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L2NvbW1vbi5qc1xuICoqIG1vZHVsZSBpZCA9IDVcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qIENvcHlyaWdodCAoYykgMjAxNSwgQnJhbmRvbiBKb25lcywgQ29saW4gTWFjS2VuemllIElWLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuICovXG5cbnZhciBnbE1hdHJpeCA9IHJlcXVpcmUoXCIuL2NvbW1vbi5qc1wiKTtcblxuLyoqXG4gKiBAY2xhc3MgMngyIE1hdHJpeFxuICogQG5hbWUgbWF0MlxuICovXG52YXIgbWF0MiA9IHt9O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaWRlbnRpdHkgbWF0MlxuICpcbiAqIEByZXR1cm5zIHttYXQyfSBhIG5ldyAyeDIgbWF0cml4XG4gKi9cbm1hdDIuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDQpO1xuICAgIG91dFswXSA9IDE7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBtYXQyIGluaXRpYWxpemVkIHdpdGggdmFsdWVzIGZyb20gYW4gZXhpc3RpbmcgbWF0cml4XG4gKlxuICogQHBhcmFtIHttYXQyfSBhIG1hdHJpeCB0byBjbG9uZVxuICogQHJldHVybnMge21hdDJ9IGEgbmV3IDJ4MiBtYXRyaXhcbiAqL1xubWF0Mi5jbG9uZSA9IGZ1bmN0aW9uKGEpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoNCk7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDb3B5IHRoZSB2YWx1ZXMgZnJvbSBvbmUgbWF0MiB0byBhbm90aGVyXG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDJ9IG91dFxuICovXG5tYXQyLmNvcHkgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNldCBhIG1hdDIgdG8gdGhlIGlkZW50aXR5IG1hdHJpeFxuICpcbiAqIEBwYXJhbSB7bWF0Mn0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIuaWRlbnRpdHkgPSBmdW5jdGlvbihvdXQpIHtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zcG9zZSB0aGUgdmFsdWVzIG9mIGEgbWF0MlxuICpcbiAqIEBwYXJhbSB7bWF0Mn0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJ9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQyfSBvdXRcbiAqL1xubWF0Mi50cmFuc3Bvc2UgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICAvLyBJZiB3ZSBhcmUgdHJhbnNwb3Npbmcgb3Vyc2VsdmVzIHdlIGNhbiBza2lwIGEgZmV3IHN0ZXBzIGJ1dCBoYXZlIHRvIGNhY2hlIHNvbWUgdmFsdWVzXG4gICAgaWYgKG91dCA9PT0gYSkge1xuICAgICAgICB2YXIgYTEgPSBhWzFdO1xuICAgICAgICBvdXRbMV0gPSBhWzJdO1xuICAgICAgICBvdXRbMl0gPSBhMTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBvdXRbMF0gPSBhWzBdO1xuICAgICAgICBvdXRbMV0gPSBhWzJdO1xuICAgICAgICBvdXRbMl0gPSBhWzFdO1xuICAgICAgICBvdXRbM10gPSBhWzNdO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBJbnZlcnRzIGEgbWF0MlxuICpcbiAqIEBwYXJhbSB7bWF0Mn0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJ9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQyfSBvdXRcbiAqL1xubWF0Mi5pbnZlcnQgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICB2YXIgYTAgPSBhWzBdLCBhMSA9IGFbMV0sIGEyID0gYVsyXSwgYTMgPSBhWzNdLFxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnRcbiAgICAgICAgZGV0ID0gYTAgKiBhMyAtIGEyICogYTE7XG5cbiAgICBpZiAoIWRldCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZGV0ID0gMS4wIC8gZGV0O1xuICAgIFxuICAgIG91dFswXSA9ICBhMyAqIGRldDtcbiAgICBvdXRbMV0gPSAtYTEgKiBkZXQ7XG4gICAgb3V0WzJdID0gLWEyICogZGV0O1xuICAgIG91dFszXSA9ICBhMCAqIGRldDtcblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGFkanVnYXRlIG9mIGEgbWF0MlxuICpcbiAqIEBwYXJhbSB7bWF0Mn0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJ9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQyfSBvdXRcbiAqL1xubWF0Mi5hZGpvaW50ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgLy8gQ2FjaGluZyB0aGlzIHZhbHVlIGlzIG5lc3NlY2FyeSBpZiBvdXQgPT0gYVxuICAgIHZhciBhMCA9IGFbMF07XG4gICAgb3V0WzBdID0gIGFbM107XG4gICAgb3V0WzFdID0gLWFbMV07XG4gICAgb3V0WzJdID0gLWFbMl07XG4gICAgb3V0WzNdID0gIGEwO1xuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgYSBtYXQyXG4gKlxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkZXRlcm1pbmFudCBvZiBhXG4gKi9cbm1hdDIuZGV0ZXJtaW5hbnQgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiBhWzBdICogYVszXSAtIGFbMl0gKiBhWzFdO1xufTtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byBtYXQyJ3NcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge21hdDJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIubXVsdGlwbHkgPSBmdW5jdGlvbiAob3V0LCBhLCBiKSB7XG4gICAgdmFyIGEwID0gYVswXSwgYTEgPSBhWzFdLCBhMiA9IGFbMl0sIGEzID0gYVszXTtcbiAgICB2YXIgYjAgPSBiWzBdLCBiMSA9IGJbMV0sIGIyID0gYlsyXSwgYjMgPSBiWzNdO1xuICAgIG91dFswXSA9IGEwICogYjAgKyBhMiAqIGIxO1xuICAgIG91dFsxXSA9IGExICogYjAgKyBhMyAqIGIxO1xuICAgIG91dFsyXSA9IGEwICogYjIgKyBhMiAqIGIzO1xuICAgIG91dFszXSA9IGExICogYjIgKyBhMyAqIGIzO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgbWF0Mi5tdWx0aXBseX1cbiAqIEBmdW5jdGlvblxuICovXG5tYXQyLm11bCA9IG1hdDIubXVsdGlwbHk7XG5cbi8qKlxuICogUm90YXRlcyBhIG1hdDIgYnkgdGhlIGdpdmVuIGFuZ2xlXG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQyfSBvdXRcbiAqL1xubWF0Mi5yb3RhdGUgPSBmdW5jdGlvbiAob3V0LCBhLCByYWQpIHtcbiAgICB2YXIgYTAgPSBhWzBdLCBhMSA9IGFbMV0sIGEyID0gYVsyXSwgYTMgPSBhWzNdLFxuICAgICAgICBzID0gTWF0aC5zaW4ocmFkKSxcbiAgICAgICAgYyA9IE1hdGguY29zKHJhZCk7XG4gICAgb3V0WzBdID0gYTAgKiAgYyArIGEyICogcztcbiAgICBvdXRbMV0gPSBhMSAqICBjICsgYTMgKiBzO1xuICAgIG91dFsyXSA9IGEwICogLXMgKyBhMiAqIGM7XG4gICAgb3V0WzNdID0gYTEgKiAtcyArIGEzICogYztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTY2FsZXMgdGhlIG1hdDIgYnkgdGhlIGRpbWVuc2lvbnMgaW4gdGhlIGdpdmVuIHZlYzJcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge3ZlYzJ9IHYgdGhlIHZlYzIgdG8gc2NhbGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDJ9IG91dFxuICoqL1xubWF0Mi5zY2FsZSA9IGZ1bmN0aW9uKG91dCwgYSwgdikge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXSwgYTIgPSBhWzJdLCBhMyA9IGFbM10sXG4gICAgICAgIHYwID0gdlswXSwgdjEgPSB2WzFdO1xuICAgIG91dFswXSA9IGEwICogdjA7XG4gICAgb3V0WzFdID0gYTEgKiB2MDtcbiAgICBvdXRbMl0gPSBhMiAqIHYxO1xuICAgIG91dFszXSA9IGEzICogdjE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgZ2l2ZW4gYW5nbGVcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQyLmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDIucm90YXRlKGRlc3QsIGRlc3QsIHJhZCk7XG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgbWF0MiByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQyfSBvdXRcbiAqL1xubWF0Mi5mcm9tUm90YXRpb24gPSBmdW5jdGlvbihvdXQsIHJhZCkge1xuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKSxcbiAgICAgICAgYyA9IE1hdGguY29zKHJhZCk7XG4gICAgb3V0WzBdID0gYztcbiAgICBvdXRbMV0gPSBzO1xuICAgIG91dFsyXSA9IC1zO1xuICAgIG91dFszXSA9IGM7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSB2ZWN0b3Igc2NhbGluZ1xuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDIuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0Mi5zY2FsZShkZXN0LCBkZXN0LCB2ZWMpO1xuICpcbiAqIEBwYXJhbSB7bWF0Mn0gb3V0IG1hdDIgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7dmVjMn0gdiBTY2FsaW5nIHZlY3RvclxuICogQHJldHVybnMge21hdDJ9IG91dFxuICovXG5tYXQyLmZyb21TY2FsaW5nID0gZnVuY3Rpb24ob3V0LCB2KSB7XG4gICAgb3V0WzBdID0gdlswXTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gdlsxXTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBtYXQyXG4gKlxuICogQHBhcmFtIHttYXQyfSBtYXQgbWF0cml4IHRvIHJlcHJlc2VudCBhcyBhIHN0cmluZ1xuICogQHJldHVybnMge1N0cmluZ30gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBtYXRyaXhcbiAqL1xubWF0Mi5zdHIgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiAnbWF0MignICsgYVswXSArICcsICcgKyBhWzFdICsgJywgJyArIGFbMl0gKyAnLCAnICsgYVszXSArICcpJztcbn07XG5cbi8qKlxuICogUmV0dXJucyBGcm9iZW5pdXMgbm9ybSBvZiBhIG1hdDJcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IGEgdGhlIG1hdHJpeCB0byBjYWxjdWxhdGUgRnJvYmVuaXVzIG5vcm0gb2ZcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IEZyb2Jlbml1cyBub3JtXG4gKi9cbm1hdDIuZnJvYiA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuKE1hdGguc3FydChNYXRoLnBvdyhhWzBdLCAyKSArIE1hdGgucG93KGFbMV0sIDIpICsgTWF0aC5wb3coYVsyXSwgMikgKyBNYXRoLnBvdyhhWzNdLCAyKSkpXG59O1xuXG4vKipcbiAqIFJldHVybnMgTCwgRCBhbmQgVSBtYXRyaWNlcyAoTG93ZXIgdHJpYW5ndWxhciwgRGlhZ29uYWwgYW5kIFVwcGVyIHRyaWFuZ3VsYXIpIGJ5IGZhY3Rvcml6aW5nIHRoZSBpbnB1dCBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0Mn0gTCB0aGUgbG93ZXIgdHJpYW5ndWxhciBtYXRyaXggXG4gKiBAcGFyYW0ge21hdDJ9IEQgdGhlIGRpYWdvbmFsIG1hdHJpeCBcbiAqIEBwYXJhbSB7bWF0Mn0gVSB0aGUgdXBwZXIgdHJpYW5ndWxhciBtYXRyaXggXG4gKiBAcGFyYW0ge21hdDJ9IGEgdGhlIGlucHV0IG1hdHJpeCB0byBmYWN0b3JpemVcbiAqL1xuXG5tYXQyLkxEVSA9IGZ1bmN0aW9uIChMLCBELCBVLCBhKSB7IFxuICAgIExbMl0gPSBhWzJdL2FbMF07IFxuICAgIFVbMF0gPSBhWzBdOyBcbiAgICBVWzFdID0gYVsxXTsgXG4gICAgVVszXSA9IGFbM10gLSBMWzJdICogVVsxXTsgXG4gICAgcmV0dXJuIFtMLCBELCBVXTsgICAgICAgXG59OyBcblxuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdDI7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC9tYXQyLmpzXG4gKiogbW9kdWxlIGlkID0gNlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyogQ29weXJpZ2h0IChjKSAyMDE1LCBCcmFuZG9uIEpvbmVzLCBDb2xpbiBNYWNLZW56aWUgSVYuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS4gKi9cblxudmFyIGdsTWF0cml4ID0gcmVxdWlyZShcIi4vY29tbW9uLmpzXCIpO1xuXG4vKipcbiAqIEBjbGFzcyAyeDMgTWF0cml4XG4gKiBAbmFtZSBtYXQyZFxuICogXG4gKiBAZGVzY3JpcHRpb24gXG4gKiBBIG1hdDJkIGNvbnRhaW5zIHNpeCBlbGVtZW50cyBkZWZpbmVkIGFzOlxuICogPHByZT5cbiAqIFthLCBjLCB0eCxcbiAqICBiLCBkLCB0eV1cbiAqIDwvcHJlPlxuICogVGhpcyBpcyBhIHNob3J0IGZvcm0gZm9yIHRoZSAzeDMgbWF0cml4OlxuICogPHByZT5cbiAqIFthLCBjLCB0eCxcbiAqICBiLCBkLCB0eSxcbiAqICAwLCAwLCAxXVxuICogPC9wcmU+XG4gKiBUaGUgbGFzdCByb3cgaXMgaWdub3JlZCBzbyB0aGUgYXJyYXkgaXMgc2hvcnRlciBhbmQgb3BlcmF0aW9ucyBhcmUgZmFzdGVyLlxuICovXG52YXIgbWF0MmQgPSB7fTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGlkZW50aXR5IG1hdDJkXG4gKlxuICogQHJldHVybnMge21hdDJkfSBhIG5ldyAyeDMgbWF0cml4XG4gKi9cbm1hdDJkLmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSg2KTtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAxO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gMDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IG1hdDJkIGluaXRpYWxpemVkIHdpdGggdmFsdWVzIGZyb20gYW4gZXhpc3RpbmcgbWF0cml4XG4gKlxuICogQHBhcmFtIHttYXQyZH0gYSBtYXRyaXggdG8gY2xvbmVcbiAqIEByZXR1cm5zIHttYXQyZH0gYSBuZXcgMngzIG1hdHJpeFxuICovXG5tYXQyZC5jbG9uZSA9IGZ1bmN0aW9uKGEpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoNik7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICBvdXRbNF0gPSBhWzRdO1xuICAgIG91dFs1XSA9IGFbNV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ29weSB0aGUgdmFsdWVzIGZyb20gb25lIG1hdDJkIHRvIGFub3RoZXJcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQyZH0gb3V0XG4gKi9cbm1hdDJkLmNvcHkgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIG91dFs0XSA9IGFbNF07XG4gICAgb3V0WzVdID0gYVs1XTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTZXQgYSBtYXQyZCB0byB0aGUgaWRlbnRpdHkgbWF0cml4XG4gKlxuICogQHBhcmFtIHttYXQyZH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0MmR9IG91dFxuICovXG5tYXQyZC5pZGVudGl0eSA9IGZ1bmN0aW9uKG91dCkge1xuICAgIG91dFswXSA9IDE7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDE7XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSAwO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEludmVydHMgYSBtYXQyZFxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDJkfSBvdXRcbiAqL1xubWF0MmQuaW52ZXJ0ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgdmFyIGFhID0gYVswXSwgYWIgPSBhWzFdLCBhYyA9IGFbMl0sIGFkID0gYVszXSxcbiAgICAgICAgYXR4ID0gYVs0XSwgYXR5ID0gYVs1XTtcblxuICAgIHZhciBkZXQgPSBhYSAqIGFkIC0gYWIgKiBhYztcbiAgICBpZighZGV0KXtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGRldCA9IDEuMCAvIGRldDtcblxuICAgIG91dFswXSA9IGFkICogZGV0O1xuICAgIG91dFsxXSA9IC1hYiAqIGRldDtcbiAgICBvdXRbMl0gPSAtYWMgKiBkZXQ7XG4gICAgb3V0WzNdID0gYWEgKiBkZXQ7XG4gICAgb3V0WzRdID0gKGFjICogYXR5IC0gYWQgKiBhdHgpICogZGV0O1xuICAgIG91dFs1XSA9IChhYiAqIGF0eCAtIGFhICogYXR5KSAqIGRldDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBkZXRlcm1pbmFudCBvZiBhIG1hdDJkXG4gKlxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge051bWJlcn0gZGV0ZXJtaW5hbnQgb2YgYVxuICovXG5tYXQyZC5kZXRlcm1pbmFudCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuIGFbMF0gKiBhWzNdIC0gYVsxXSAqIGFbMl07XG59O1xuXG4vKipcbiAqIE11bHRpcGxpZXMgdHdvIG1hdDJkJ3NcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7bWF0MmR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7bWF0MmR9IG91dFxuICovXG5tYXQyZC5tdWx0aXBseSA9IGZ1bmN0aW9uIChvdXQsIGEsIGIpIHtcbiAgICB2YXIgYTAgPSBhWzBdLCBhMSA9IGFbMV0sIGEyID0gYVsyXSwgYTMgPSBhWzNdLCBhNCA9IGFbNF0sIGE1ID0gYVs1XSxcbiAgICAgICAgYjAgPSBiWzBdLCBiMSA9IGJbMV0sIGIyID0gYlsyXSwgYjMgPSBiWzNdLCBiNCA9IGJbNF0sIGI1ID0gYls1XTtcbiAgICBvdXRbMF0gPSBhMCAqIGIwICsgYTIgKiBiMTtcbiAgICBvdXRbMV0gPSBhMSAqIGIwICsgYTMgKiBiMTtcbiAgICBvdXRbMl0gPSBhMCAqIGIyICsgYTIgKiBiMztcbiAgICBvdXRbM10gPSBhMSAqIGIyICsgYTMgKiBiMztcbiAgICBvdXRbNF0gPSBhMCAqIGI0ICsgYTIgKiBiNSArIGE0O1xuICAgIG91dFs1XSA9IGExICogYjQgKyBhMyAqIGI1ICsgYTU7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayBtYXQyZC5tdWx0aXBseX1cbiAqIEBmdW5jdGlvblxuICovXG5tYXQyZC5tdWwgPSBtYXQyZC5tdWx0aXBseTtcblxuLyoqXG4gKiBSb3RhdGVzIGEgbWF0MmQgYnkgdGhlIGdpdmVuIGFuZ2xlXG4gKlxuICogQHBhcmFtIHttYXQyZH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJkfSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDJkfSBvdXRcbiAqL1xubWF0MmQucm90YXRlID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkKSB7XG4gICAgdmFyIGEwID0gYVswXSwgYTEgPSBhWzFdLCBhMiA9IGFbMl0sIGEzID0gYVszXSwgYTQgPSBhWzRdLCBhNSA9IGFbNV0sXG4gICAgICAgIHMgPSBNYXRoLnNpbihyYWQpLFxuICAgICAgICBjID0gTWF0aC5jb3MocmFkKTtcbiAgICBvdXRbMF0gPSBhMCAqICBjICsgYTIgKiBzO1xuICAgIG91dFsxXSA9IGExICogIGMgKyBhMyAqIHM7XG4gICAgb3V0WzJdID0gYTAgKiAtcyArIGEyICogYztcbiAgICBvdXRbM10gPSBhMSAqIC1zICsgYTMgKiBjO1xuICAgIG91dFs0XSA9IGE0O1xuICAgIG91dFs1XSA9IGE1O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlcyB0aGUgbWF0MmQgYnkgdGhlIGRpbWVuc2lvbnMgaW4gdGhlIGdpdmVuIHZlYzJcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIG1hdHJpeCB0byB0cmFuc2xhdGVcbiAqIEBwYXJhbSB7dmVjMn0gdiB0aGUgdmVjMiB0byBzY2FsZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0MmR9IG91dFxuICoqL1xubWF0MmQuc2NhbGUgPSBmdW5jdGlvbihvdXQsIGEsIHYpIHtcbiAgICB2YXIgYTAgPSBhWzBdLCBhMSA9IGFbMV0sIGEyID0gYVsyXSwgYTMgPSBhWzNdLCBhNCA9IGFbNF0sIGE1ID0gYVs1XSxcbiAgICAgICAgdjAgPSB2WzBdLCB2MSA9IHZbMV07XG4gICAgb3V0WzBdID0gYTAgKiB2MDtcbiAgICBvdXRbMV0gPSBhMSAqIHYwO1xuICAgIG91dFsyXSA9IGEyICogdjE7XG4gICAgb3V0WzNdID0gYTMgKiB2MTtcbiAgICBvdXRbNF0gPSBhNDtcbiAgICBvdXRbNV0gPSBhNTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2xhdGVzIHRoZSBtYXQyZCBieSB0aGUgZGltZW5zaW9ucyBpbiB0aGUgZ2l2ZW4gdmVjMlxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgbWF0cml4IHRvIHRyYW5zbGF0ZVxuICogQHBhcmFtIHt2ZWMyfSB2IHRoZSB2ZWMyIHRvIHRyYW5zbGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0MmR9IG91dFxuICoqL1xubWF0MmQudHJhbnNsYXRlID0gZnVuY3Rpb24ob3V0LCBhLCB2KSB7XG4gICAgdmFyIGEwID0gYVswXSwgYTEgPSBhWzFdLCBhMiA9IGFbMl0sIGEzID0gYVszXSwgYTQgPSBhWzRdLCBhNSA9IGFbNV0sXG4gICAgICAgIHYwID0gdlswXSwgdjEgPSB2WzFdO1xuICAgIG91dFswXSA9IGEwO1xuICAgIG91dFsxXSA9IGExO1xuICAgIG91dFsyXSA9IGEyO1xuICAgIG91dFszXSA9IGEzO1xuICAgIG91dFs0XSA9IGEwICogdjAgKyBhMiAqIHYxICsgYTQ7XG4gICAgb3V0WzVdID0gYTEgKiB2MCArIGEzICogdjEgKyBhNTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSBnaXZlbiBhbmdsZVxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDJkLmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDJkLnJvdGF0ZShkZXN0LCBkZXN0LCByYWQpO1xuICpcbiAqIEBwYXJhbSB7bWF0MmR9IG91dCBtYXQyZCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQyZH0gb3V0XG4gKi9cbm1hdDJkLmZyb21Sb3RhdGlvbiA9IGZ1bmN0aW9uKG91dCwgcmFkKSB7XG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpLCBjID0gTWF0aC5jb3MocmFkKTtcbiAgICBvdXRbMF0gPSBjO1xuICAgIG91dFsxXSA9IHM7XG4gICAgb3V0WzJdID0gLXM7XG4gICAgb3V0WzNdID0gYztcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IDA7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSB2ZWN0b3Igc2NhbGluZ1xuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDJkLmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDJkLnNjYWxlKGRlc3QsIGRlc3QsIHZlYyk7XG4gKlxuICogQHBhcmFtIHttYXQyZH0gb3V0IG1hdDJkIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3ZlYzJ9IHYgU2NhbGluZyB2ZWN0b3JcbiAqIEByZXR1cm5zIHttYXQyZH0gb3V0XG4gKi9cbm1hdDJkLmZyb21TY2FsaW5nID0gZnVuY3Rpb24ob3V0LCB2KSB7XG4gICAgb3V0WzBdID0gdlswXTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gdlsxXTtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IDA7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSB2ZWN0b3IgdHJhbnNsYXRpb25cbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQyZC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQyZC50cmFuc2xhdGUoZGVzdCwgZGVzdCwgdmVjKTtcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBvdXQgbWF0MmQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7dmVjMn0gdiBUcmFuc2xhdGlvbiB2ZWN0b3JcbiAqIEByZXR1cm5zIHttYXQyZH0gb3V0XG4gKi9cbm1hdDJkLmZyb21UcmFuc2xhdGlvbiA9IGZ1bmN0aW9uKG91dCwgdikge1xuICAgIG91dFswXSA9IDE7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDE7XG4gICAgb3V0WzRdID0gdlswXTtcbiAgICBvdXRbNV0gPSB2WzFdO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIG1hdDJkXG4gKlxuICogQHBhcmFtIHttYXQyZH0gYSBtYXRyaXggdG8gcmVwcmVzZW50IGFzIGEgc3RyaW5nXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hdHJpeFxuICovXG5tYXQyZC5zdHIgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiAnbWF0MmQoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcsICcgKyBhWzJdICsgJywgJyArIFxuICAgICAgICAgICAgICAgICAgICBhWzNdICsgJywgJyArIGFbNF0gKyAnLCAnICsgYVs1XSArICcpJztcbn07XG5cbi8qKlxuICogUmV0dXJucyBGcm9iZW5pdXMgbm9ybSBvZiBhIG1hdDJkXG4gKlxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgbWF0cml4IHRvIGNhbGN1bGF0ZSBGcm9iZW5pdXMgbm9ybSBvZlxuICogQHJldHVybnMge051bWJlcn0gRnJvYmVuaXVzIG5vcm1cbiAqL1xubWF0MmQuZnJvYiA9IGZ1bmN0aW9uIChhKSB7IFxuICAgIHJldHVybihNYXRoLnNxcnQoTWF0aC5wb3coYVswXSwgMikgKyBNYXRoLnBvdyhhWzFdLCAyKSArIE1hdGgucG93KGFbMl0sIDIpICsgTWF0aC5wb3coYVszXSwgMikgKyBNYXRoLnBvdyhhWzRdLCAyKSArIE1hdGgucG93KGFbNV0sIDIpICsgMSkpXG59OyBcblxubW9kdWxlLmV4cG9ydHMgPSBtYXQyZDtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L21hdDJkLmpzXG4gKiogbW9kdWxlIGlkID0gN1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyogQ29weXJpZ2h0IChjKSAyMDE1LCBCcmFuZG9uIEpvbmVzLCBDb2xpbiBNYWNLZW56aWUgSVYuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS4gKi9cblxudmFyIGdsTWF0cml4ID0gcmVxdWlyZShcIi4vY29tbW9uLmpzXCIpO1xuXG4vKipcbiAqIEBjbGFzcyAzeDMgTWF0cml4XG4gKiBAbmFtZSBtYXQzXG4gKi9cbnZhciBtYXQzID0ge307XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpZGVudGl0eSBtYXQzXG4gKlxuICogQHJldHVybnMge21hdDN9IGEgbmV3IDN4MyBtYXRyaXhcbiAqL1xubWF0My5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoOSk7XG4gICAgb3V0WzBdID0gMTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAxO1xuICAgIG91dFs1XSA9IDA7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ29waWVzIHRoZSB1cHBlci1sZWZ0IDN4MyB2YWx1ZXMgaW50byB0aGUgZ2l2ZW4gbWF0My5cbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIDN4MyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSAgIHRoZSBzb3VyY2UgNHg0IG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLmZyb21NYXQ0ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgb3V0WzNdID0gYVs0XTtcbiAgICBvdXRbNF0gPSBhWzVdO1xuICAgIG91dFs1XSA9IGFbNl07XG4gICAgb3V0WzZdID0gYVs4XTtcbiAgICBvdXRbN10gPSBhWzldO1xuICAgIG91dFs4XSA9IGFbMTBdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgbWF0MyBpbml0aWFsaXplZCB3aXRoIHZhbHVlcyBmcm9tIGFuIGV4aXN0aW5nIG1hdHJpeFxuICpcbiAqIEBwYXJhbSB7bWF0M30gYSBtYXRyaXggdG8gY2xvbmVcbiAqIEByZXR1cm5zIHttYXQzfSBhIG5ldyAzeDMgbWF0cml4XG4gKi9cbm1hdDMuY2xvbmUgPSBmdW5jdGlvbihhKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDkpO1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgb3V0WzRdID0gYVs0XTtcbiAgICBvdXRbNV0gPSBhWzVdO1xuICAgIG91dFs2XSA9IGFbNl07XG4gICAgb3V0WzddID0gYVs3XTtcbiAgICBvdXRbOF0gPSBhWzhdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSBtYXQzIHRvIGFub3RoZXJcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMuY29weSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgb3V0WzRdID0gYVs0XTtcbiAgICBvdXRbNV0gPSBhWzVdO1xuICAgIG91dFs2XSA9IGFbNl07XG4gICAgb3V0WzddID0gYVs3XTtcbiAgICBvdXRbOF0gPSBhWzhdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNldCBhIG1hdDMgdG8gdGhlIGlkZW50aXR5IG1hdHJpeFxuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMuaWRlbnRpdHkgPSBmdW5jdGlvbihvdXQpIHtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDE7XG4gICAgb3V0WzVdID0gMDtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc3Bvc2UgdGhlIHZhbHVlcyBvZiBhIG1hdDNcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMudHJhbnNwb3NlID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgLy8gSWYgd2UgYXJlIHRyYW5zcG9zaW5nIG91cnNlbHZlcyB3ZSBjYW4gc2tpcCBhIGZldyBzdGVwcyBidXQgaGF2ZSB0byBjYWNoZSBzb21lIHZhbHVlc1xuICAgIGlmIChvdXQgPT09IGEpIHtcbiAgICAgICAgdmFyIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sIGExMiA9IGFbNV07XG4gICAgICAgIG91dFsxXSA9IGFbM107XG4gICAgICAgIG91dFsyXSA9IGFbNl07XG4gICAgICAgIG91dFszXSA9IGEwMTtcbiAgICAgICAgb3V0WzVdID0gYVs3XTtcbiAgICAgICAgb3V0WzZdID0gYTAyO1xuICAgICAgICBvdXRbN10gPSBhMTI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgb3V0WzBdID0gYVswXTtcbiAgICAgICAgb3V0WzFdID0gYVszXTtcbiAgICAgICAgb3V0WzJdID0gYVs2XTtcbiAgICAgICAgb3V0WzNdID0gYVsxXTtcbiAgICAgICAgb3V0WzRdID0gYVs0XTtcbiAgICAgICAgb3V0WzVdID0gYVs3XTtcbiAgICAgICAgb3V0WzZdID0gYVsyXTtcbiAgICAgICAgb3V0WzddID0gYVs1XTtcbiAgICAgICAgb3V0WzhdID0gYVs4XTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogSW52ZXJ0cyBhIG1hdDNcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMuaW52ZXJ0ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sXG4gICAgICAgIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV0sXG4gICAgICAgIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF0sXG5cbiAgICAgICAgYjAxID0gYTIyICogYTExIC0gYTEyICogYTIxLFxuICAgICAgICBiMTEgPSAtYTIyICogYTEwICsgYTEyICogYTIwLFxuICAgICAgICBiMjEgPSBhMjEgKiBhMTAgLSBhMTEgKiBhMjAsXG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudFxuICAgICAgICBkZXQgPSBhMDAgKiBiMDEgKyBhMDEgKiBiMTEgKyBhMDIgKiBiMjE7XG5cbiAgICBpZiAoIWRldCkgeyBcbiAgICAgICAgcmV0dXJuIG51bGw7IFxuICAgIH1cbiAgICBkZXQgPSAxLjAgLyBkZXQ7XG5cbiAgICBvdXRbMF0gPSBiMDEgKiBkZXQ7XG4gICAgb3V0WzFdID0gKC1hMjIgKiBhMDEgKyBhMDIgKiBhMjEpICogZGV0O1xuICAgIG91dFsyXSA9IChhMTIgKiBhMDEgLSBhMDIgKiBhMTEpICogZGV0O1xuICAgIG91dFszXSA9IGIxMSAqIGRldDtcbiAgICBvdXRbNF0gPSAoYTIyICogYTAwIC0gYTAyICogYTIwKSAqIGRldDtcbiAgICBvdXRbNV0gPSAoLWExMiAqIGEwMCArIGEwMiAqIGExMCkgKiBkZXQ7XG4gICAgb3V0WzZdID0gYjIxICogZGV0O1xuICAgIG91dFs3XSA9ICgtYTIxICogYTAwICsgYTAxICogYTIwKSAqIGRldDtcbiAgICBvdXRbOF0gPSAoYTExICogYTAwIC0gYTAxICogYTEwKSAqIGRldDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBhZGp1Z2F0ZSBvZiBhIG1hdDNcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMuYWRqb2ludCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLFxuICAgICAgICBhMTAgPSBhWzNdLCBhMTEgPSBhWzRdLCBhMTIgPSBhWzVdLFxuICAgICAgICBhMjAgPSBhWzZdLCBhMjEgPSBhWzddLCBhMjIgPSBhWzhdO1xuXG4gICAgb3V0WzBdID0gKGExMSAqIGEyMiAtIGExMiAqIGEyMSk7XG4gICAgb3V0WzFdID0gKGEwMiAqIGEyMSAtIGEwMSAqIGEyMik7XG4gICAgb3V0WzJdID0gKGEwMSAqIGExMiAtIGEwMiAqIGExMSk7XG4gICAgb3V0WzNdID0gKGExMiAqIGEyMCAtIGExMCAqIGEyMik7XG4gICAgb3V0WzRdID0gKGEwMCAqIGEyMiAtIGEwMiAqIGEyMCk7XG4gICAgb3V0WzVdID0gKGEwMiAqIGExMCAtIGEwMCAqIGExMik7XG4gICAgb3V0WzZdID0gKGExMCAqIGEyMSAtIGExMSAqIGEyMCk7XG4gICAgb3V0WzddID0gKGEwMSAqIGEyMCAtIGEwMCAqIGEyMSk7XG4gICAgb3V0WzhdID0gKGEwMCAqIGExMSAtIGEwMSAqIGExMCk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgYSBtYXQzXG4gKlxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkZXRlcm1pbmFudCBvZiBhXG4gKi9cbm1hdDMuZGV0ZXJtaW5hbnQgPSBmdW5jdGlvbiAoYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLFxuICAgICAgICBhMTAgPSBhWzNdLCBhMTEgPSBhWzRdLCBhMTIgPSBhWzVdLFxuICAgICAgICBhMjAgPSBhWzZdLCBhMjEgPSBhWzddLCBhMjIgPSBhWzhdO1xuXG4gICAgcmV0dXJuIGEwMCAqIChhMjIgKiBhMTEgLSBhMTIgKiBhMjEpICsgYTAxICogKC1hMjIgKiBhMTAgKyBhMTIgKiBhMjApICsgYTAyICogKGEyMSAqIGExMCAtIGExMSAqIGEyMCk7XG59O1xuXG4vKipcbiAqIE11bHRpcGxpZXMgdHdvIG1hdDMnc1xuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7bWF0M30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My5tdWx0aXBseSA9IGZ1bmN0aW9uIChvdXQsIGEsIGIpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSxcbiAgICAgICAgYTEwID0gYVszXSwgYTExID0gYVs0XSwgYTEyID0gYVs1XSxcbiAgICAgICAgYTIwID0gYVs2XSwgYTIxID0gYVs3XSwgYTIyID0gYVs4XSxcblxuICAgICAgICBiMDAgPSBiWzBdLCBiMDEgPSBiWzFdLCBiMDIgPSBiWzJdLFxuICAgICAgICBiMTAgPSBiWzNdLCBiMTEgPSBiWzRdLCBiMTIgPSBiWzVdLFxuICAgICAgICBiMjAgPSBiWzZdLCBiMjEgPSBiWzddLCBiMjIgPSBiWzhdO1xuXG4gICAgb3V0WzBdID0gYjAwICogYTAwICsgYjAxICogYTEwICsgYjAyICogYTIwO1xuICAgIG91dFsxXSA9IGIwMCAqIGEwMSArIGIwMSAqIGExMSArIGIwMiAqIGEyMTtcbiAgICBvdXRbMl0gPSBiMDAgKiBhMDIgKyBiMDEgKiBhMTIgKyBiMDIgKiBhMjI7XG5cbiAgICBvdXRbM10gPSBiMTAgKiBhMDAgKyBiMTEgKiBhMTAgKyBiMTIgKiBhMjA7XG4gICAgb3V0WzRdID0gYjEwICogYTAxICsgYjExICogYTExICsgYjEyICogYTIxO1xuICAgIG91dFs1XSA9IGIxMCAqIGEwMiArIGIxMSAqIGExMiArIGIxMiAqIGEyMjtcblxuICAgIG91dFs2XSA9IGIyMCAqIGEwMCArIGIyMSAqIGExMCArIGIyMiAqIGEyMDtcbiAgICBvdXRbN10gPSBiMjAgKiBhMDEgKyBiMjEgKiBhMTEgKyBiMjIgKiBhMjE7XG4gICAgb3V0WzhdID0gYjIwICogYTAyICsgYjIxICogYTEyICsgYjIyICogYTIyO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgbWF0My5tdWx0aXBseX1cbiAqIEBmdW5jdGlvblxuICovXG5tYXQzLm11bCA9IG1hdDMubXVsdGlwbHk7XG5cbi8qKlxuICogVHJhbnNsYXRlIGEgbWF0MyBieSB0aGUgZ2l2ZW4gdmVjdG9yXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgbWF0cml4IHRvIHRyYW5zbGF0ZVxuICogQHBhcmFtIHt2ZWMyfSB2IHZlY3RvciB0byB0cmFuc2xhdGUgYnlcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My50cmFuc2xhdGUgPSBmdW5jdGlvbihvdXQsIGEsIHYpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSxcbiAgICAgICAgYTEwID0gYVszXSwgYTExID0gYVs0XSwgYTEyID0gYVs1XSxcbiAgICAgICAgYTIwID0gYVs2XSwgYTIxID0gYVs3XSwgYTIyID0gYVs4XSxcbiAgICAgICAgeCA9IHZbMF0sIHkgPSB2WzFdO1xuXG4gICAgb3V0WzBdID0gYTAwO1xuICAgIG91dFsxXSA9IGEwMTtcbiAgICBvdXRbMl0gPSBhMDI7XG5cbiAgICBvdXRbM10gPSBhMTA7XG4gICAgb3V0WzRdID0gYTExO1xuICAgIG91dFs1XSA9IGExMjtcblxuICAgIG91dFs2XSA9IHggKiBhMDAgKyB5ICogYTEwICsgYTIwO1xuICAgIG91dFs3XSA9IHggKiBhMDEgKyB5ICogYTExICsgYTIxO1xuICAgIG91dFs4XSA9IHggKiBhMDIgKyB5ICogYTEyICsgYTIyO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBtYXQzIGJ5IHRoZSBnaXZlbiBhbmdsZVxuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMucm90YXRlID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sXG4gICAgICAgIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV0sXG4gICAgICAgIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF0sXG5cbiAgICAgICAgcyA9IE1hdGguc2luKHJhZCksXG4gICAgICAgIGMgPSBNYXRoLmNvcyhyYWQpO1xuXG4gICAgb3V0WzBdID0gYyAqIGEwMCArIHMgKiBhMTA7XG4gICAgb3V0WzFdID0gYyAqIGEwMSArIHMgKiBhMTE7XG4gICAgb3V0WzJdID0gYyAqIGEwMiArIHMgKiBhMTI7XG5cbiAgICBvdXRbM10gPSBjICogYTEwIC0gcyAqIGEwMDtcbiAgICBvdXRbNF0gPSBjICogYTExIC0gcyAqIGEwMTtcbiAgICBvdXRbNV0gPSBjICogYTEyIC0gcyAqIGEwMjtcblxuICAgIG91dFs2XSA9IGEyMDtcbiAgICBvdXRbN10gPSBhMjE7XG4gICAgb3V0WzhdID0gYTIyO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlcyB0aGUgbWF0MyBieSB0aGUgZGltZW5zaW9ucyBpbiB0aGUgZ2l2ZW4gdmVjMlxuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcbiAqIEBwYXJhbSB7dmVjMn0gdiB0aGUgdmVjMiB0byBzY2FsZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKiovXG5tYXQzLnNjYWxlID0gZnVuY3Rpb24ob3V0LCBhLCB2KSB7XG4gICAgdmFyIHggPSB2WzBdLCB5ID0gdlsxXTtcblxuICAgIG91dFswXSA9IHggKiBhWzBdO1xuICAgIG91dFsxXSA9IHggKiBhWzFdO1xuICAgIG91dFsyXSA9IHggKiBhWzJdO1xuXG4gICAgb3V0WzNdID0geSAqIGFbM107XG4gICAgb3V0WzRdID0geSAqIGFbNF07XG4gICAgb3V0WzVdID0geSAqIGFbNV07XG5cbiAgICBvdXRbNl0gPSBhWzZdO1xuICAgIG91dFs3XSA9IGFbN107XG4gICAgb3V0WzhdID0gYVs4XTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSB2ZWN0b3IgdHJhbnNsYXRpb25cbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQzLmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDMudHJhbnNsYXRlKGRlc3QsIGRlc3QsIHZlYyk7XG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgbWF0MyByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHt2ZWMyfSB2IFRyYW5zbGF0aW9uIHZlY3RvclxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLmZyb21UcmFuc2xhdGlvbiA9IGZ1bmN0aW9uKG91dCwgdikge1xuICAgIG91dFswXSA9IDE7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0gMTtcbiAgICBvdXRbNV0gPSAwO1xuICAgIG91dFs2XSA9IHZbMF07XG4gICAgb3V0WzddID0gdlsxXTtcbiAgICBvdXRbOF0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgZ2l2ZW4gYW5nbGVcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQzLmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDMucm90YXRlKGRlc3QsIGRlc3QsIHJhZCk7XG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgbWF0MyByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My5mcm9tUm90YXRpb24gPSBmdW5jdGlvbihvdXQsIHJhZCkge1xuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKSwgYyA9IE1hdGguY29zKHJhZCk7XG5cbiAgICBvdXRbMF0gPSBjO1xuICAgIG91dFsxXSA9IHM7XG4gICAgb3V0WzJdID0gMDtcblxuICAgIG91dFszXSA9IC1zO1xuICAgIG91dFs0XSA9IGM7XG4gICAgb3V0WzVdID0gMDtcblxuICAgIG91dFs2XSA9IDA7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgdmVjdG9yIHNjYWxpbmdcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQzLmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDMuc2NhbGUoZGVzdCwgZGVzdCwgdmVjKTtcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCBtYXQzIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3ZlYzJ9IHYgU2NhbGluZyB2ZWN0b3JcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My5mcm9tU2NhbGluZyA9IGZ1bmN0aW9uKG91dCwgdikge1xuICAgIG91dFswXSA9IHZbMF07XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuXG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSB2WzFdO1xuICAgIG91dFs1XSA9IDA7XG5cbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENvcGllcyB0aGUgdmFsdWVzIGZyb20gYSBtYXQyZCBpbnRvIGEgbWF0M1xuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJkfSBhIHRoZSBtYXRyaXggdG8gY29weVxuICogQHJldHVybnMge21hdDN9IG91dFxuICoqL1xubWF0My5mcm9tTWF0MmQgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gMDtcblxuICAgIG91dFszXSA9IGFbMl07XG4gICAgb3V0WzRdID0gYVszXTtcbiAgICBvdXRbNV0gPSAwO1xuXG4gICAgb3V0WzZdID0gYVs0XTtcbiAgICBvdXRbN10gPSBhWzVdO1xuICAgIG91dFs4XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuKiBDYWxjdWxhdGVzIGEgM3gzIG1hdHJpeCBmcm9tIHRoZSBnaXZlbiBxdWF0ZXJuaW9uXG4qXG4qIEBwYXJhbSB7bWF0M30gb3V0IG1hdDMgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiogQHBhcmFtIHtxdWF0fSBxIFF1YXRlcm5pb24gdG8gY3JlYXRlIG1hdHJpeCBmcm9tXG4qXG4qIEByZXR1cm5zIHttYXQzfSBvdXRcbiovXG5tYXQzLmZyb21RdWF0ID0gZnVuY3Rpb24gKG91dCwgcSkge1xuICAgIHZhciB4ID0gcVswXSwgeSA9IHFbMV0sIHogPSBxWzJdLCB3ID0gcVszXSxcbiAgICAgICAgeDIgPSB4ICsgeCxcbiAgICAgICAgeTIgPSB5ICsgeSxcbiAgICAgICAgejIgPSB6ICsgeixcblxuICAgICAgICB4eCA9IHggKiB4MixcbiAgICAgICAgeXggPSB5ICogeDIsXG4gICAgICAgIHl5ID0geSAqIHkyLFxuICAgICAgICB6eCA9IHogKiB4MixcbiAgICAgICAgenkgPSB6ICogeTIsXG4gICAgICAgIHp6ID0geiAqIHoyLFxuICAgICAgICB3eCA9IHcgKiB4MixcbiAgICAgICAgd3kgPSB3ICogeTIsXG4gICAgICAgIHd6ID0gdyAqIHoyO1xuXG4gICAgb3V0WzBdID0gMSAtIHl5IC0geno7XG4gICAgb3V0WzNdID0geXggLSB3ejtcbiAgICBvdXRbNl0gPSB6eCArIHd5O1xuXG4gICAgb3V0WzFdID0geXggKyB3ejtcbiAgICBvdXRbNF0gPSAxIC0geHggLSB6ejtcbiAgICBvdXRbN10gPSB6eSAtIHd4O1xuXG4gICAgb3V0WzJdID0genggLSB3eTtcbiAgICBvdXRbNV0gPSB6eSArIHd4O1xuICAgIG91dFs4XSA9IDEgLSB4eCAtIHl5O1xuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuKiBDYWxjdWxhdGVzIGEgM3gzIG5vcm1hbCBtYXRyaXggKHRyYW5zcG9zZSBpbnZlcnNlKSBmcm9tIHRoZSA0eDQgbWF0cml4XG4qXG4qIEBwYXJhbSB7bWF0M30gb3V0IG1hdDMgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiogQHBhcmFtIHttYXQ0fSBhIE1hdDQgdG8gZGVyaXZlIHRoZSBub3JtYWwgbWF0cml4IGZyb21cbipcbiogQHJldHVybnMge21hdDN9IG91dFxuKi9cbm1hdDMubm9ybWFsRnJvbU1hdDQgPSBmdW5jdGlvbiAob3V0LCBhKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sIGEwMyA9IGFbM10sXG4gICAgICAgIGExMCA9IGFbNF0sIGExMSA9IGFbNV0sIGExMiA9IGFbNl0sIGExMyA9IGFbN10sXG4gICAgICAgIGEyMCA9IGFbOF0sIGEyMSA9IGFbOV0sIGEyMiA9IGFbMTBdLCBhMjMgPSBhWzExXSxcbiAgICAgICAgYTMwID0gYVsxMl0sIGEzMSA9IGFbMTNdLCBhMzIgPSBhWzE0XSwgYTMzID0gYVsxNV0sXG5cbiAgICAgICAgYjAwID0gYTAwICogYTExIC0gYTAxICogYTEwLFxuICAgICAgICBiMDEgPSBhMDAgKiBhMTIgLSBhMDIgKiBhMTAsXG4gICAgICAgIGIwMiA9IGEwMCAqIGExMyAtIGEwMyAqIGExMCxcbiAgICAgICAgYjAzID0gYTAxICogYTEyIC0gYTAyICogYTExLFxuICAgICAgICBiMDQgPSBhMDEgKiBhMTMgLSBhMDMgKiBhMTEsXG4gICAgICAgIGIwNSA9IGEwMiAqIGExMyAtIGEwMyAqIGExMixcbiAgICAgICAgYjA2ID0gYTIwICogYTMxIC0gYTIxICogYTMwLFxuICAgICAgICBiMDcgPSBhMjAgKiBhMzIgLSBhMjIgKiBhMzAsXG4gICAgICAgIGIwOCA9IGEyMCAqIGEzMyAtIGEyMyAqIGEzMCxcbiAgICAgICAgYjA5ID0gYTIxICogYTMyIC0gYTIyICogYTMxLFxuICAgICAgICBiMTAgPSBhMjEgKiBhMzMgLSBhMjMgKiBhMzEsXG4gICAgICAgIGIxMSA9IGEyMiAqIGEzMyAtIGEyMyAqIGEzMixcblxuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGRldGVybWluYW50XG4gICAgICAgIGRldCA9IGIwMCAqIGIxMSAtIGIwMSAqIGIxMCArIGIwMiAqIGIwOSArIGIwMyAqIGIwOCAtIGIwNCAqIGIwNyArIGIwNSAqIGIwNjtcblxuICAgIGlmICghZGV0KSB7IFxuICAgICAgICByZXR1cm4gbnVsbDsgXG4gICAgfVxuICAgIGRldCA9IDEuMCAvIGRldDtcblxuICAgIG91dFswXSA9IChhMTEgKiBiMTEgLSBhMTIgKiBiMTAgKyBhMTMgKiBiMDkpICogZGV0O1xuICAgIG91dFsxXSA9IChhMTIgKiBiMDggLSBhMTAgKiBiMTEgLSBhMTMgKiBiMDcpICogZGV0O1xuICAgIG91dFsyXSA9IChhMTAgKiBiMTAgLSBhMTEgKiBiMDggKyBhMTMgKiBiMDYpICogZGV0O1xuXG4gICAgb3V0WzNdID0gKGEwMiAqIGIxMCAtIGEwMSAqIGIxMSAtIGEwMyAqIGIwOSkgKiBkZXQ7XG4gICAgb3V0WzRdID0gKGEwMCAqIGIxMSAtIGEwMiAqIGIwOCArIGEwMyAqIGIwNykgKiBkZXQ7XG4gICAgb3V0WzVdID0gKGEwMSAqIGIwOCAtIGEwMCAqIGIxMCAtIGEwMyAqIGIwNikgKiBkZXQ7XG5cbiAgICBvdXRbNl0gPSAoYTMxICogYjA1IC0gYTMyICogYjA0ICsgYTMzICogYjAzKSAqIGRldDtcbiAgICBvdXRbN10gPSAoYTMyICogYjAyIC0gYTMwICogYjA1IC0gYTMzICogYjAxKSAqIGRldDtcbiAgICBvdXRbOF0gPSAoYTMwICogYjA0IC0gYTMxICogYjAyICsgYTMzICogYjAwKSAqIGRldDtcblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBtYXQzXG4gKlxuICogQHBhcmFtIHttYXQzfSBtYXQgbWF0cml4IHRvIHJlcHJlc2VudCBhcyBhIHN0cmluZ1xuICogQHJldHVybnMge1N0cmluZ30gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBtYXRyaXhcbiAqL1xubWF0My5zdHIgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiAnbWF0MygnICsgYVswXSArICcsICcgKyBhWzFdICsgJywgJyArIGFbMl0gKyAnLCAnICsgXG4gICAgICAgICAgICAgICAgICAgIGFbM10gKyAnLCAnICsgYVs0XSArICcsICcgKyBhWzVdICsgJywgJyArIFxuICAgICAgICAgICAgICAgICAgICBhWzZdICsgJywgJyArIGFbN10gKyAnLCAnICsgYVs4XSArICcpJztcbn07XG5cbi8qKlxuICogUmV0dXJucyBGcm9iZW5pdXMgbm9ybSBvZiBhIG1hdDNcbiAqXG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIG1hdHJpeCB0byBjYWxjdWxhdGUgRnJvYmVuaXVzIG5vcm0gb2ZcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IEZyb2Jlbml1cyBub3JtXG4gKi9cbm1hdDMuZnJvYiA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuKE1hdGguc3FydChNYXRoLnBvdyhhWzBdLCAyKSArIE1hdGgucG93KGFbMV0sIDIpICsgTWF0aC5wb3coYVsyXSwgMikgKyBNYXRoLnBvdyhhWzNdLCAyKSArIE1hdGgucG93KGFbNF0sIDIpICsgTWF0aC5wb3coYVs1XSwgMikgKyBNYXRoLnBvdyhhWzZdLCAyKSArIE1hdGgucG93KGFbN10sIDIpICsgTWF0aC5wb3coYVs4XSwgMikpKVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdDM7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC9tYXQzLmpzXG4gKiogbW9kdWxlIGlkID0gOFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyogQ29weXJpZ2h0IChjKSAyMDE1LCBCcmFuZG9uIEpvbmVzLCBDb2xpbiBNYWNLZW56aWUgSVYuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS4gKi9cblxudmFyIGdsTWF0cml4ID0gcmVxdWlyZShcIi4vY29tbW9uLmpzXCIpO1xuXG4vKipcbiAqIEBjbGFzcyA0eDQgTWF0cml4XG4gKiBAbmFtZSBtYXQ0XG4gKi9cbnZhciBtYXQ0ID0ge307XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpZGVudGl0eSBtYXQ0XG4gKlxuICogQHJldHVybnMge21hdDR9IGEgbmV3IDR4NCBtYXRyaXhcbiAqL1xubWF0NC5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMTYpO1xuICAgIG91dFswXSA9IDE7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSAxO1xuICAgIG91dFs2XSA9IDA7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSAwO1xuICAgIG91dFs5XSA9IDA7XG4gICAgb3V0WzEwXSA9IDE7XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IDA7XG4gICAgb3V0WzEzXSA9IDA7XG4gICAgb3V0WzE0XSA9IDA7XG4gICAgb3V0WzE1XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBtYXQ0IGluaXRpYWxpemVkIHdpdGggdmFsdWVzIGZyb20gYW4gZXhpc3RpbmcgbWF0cml4XG4gKlxuICogQHBhcmFtIHttYXQ0fSBhIG1hdHJpeCB0byBjbG9uZVxuICogQHJldHVybnMge21hdDR9IGEgbmV3IDR4NCBtYXRyaXhcbiAqL1xubWF0NC5jbG9uZSA9IGZ1bmN0aW9uKGEpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMTYpO1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgb3V0WzRdID0gYVs0XTtcbiAgICBvdXRbNV0gPSBhWzVdO1xuICAgIG91dFs2XSA9IGFbNl07XG4gICAgb3V0WzddID0gYVs3XTtcbiAgICBvdXRbOF0gPSBhWzhdO1xuICAgIG91dFs5XSA9IGFbOV07XG4gICAgb3V0WzEwXSA9IGFbMTBdO1xuICAgIG91dFsxMV0gPSBhWzExXTtcbiAgICBvdXRbMTJdID0gYVsxMl07XG4gICAgb3V0WzEzXSA9IGFbMTNdO1xuICAgIG91dFsxNF0gPSBhWzE0XTtcbiAgICBvdXRbMTVdID0gYVsxNV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ29weSB0aGUgdmFsdWVzIGZyb20gb25lIG1hdDQgdG8gYW5vdGhlclxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5jb3B5ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICBvdXRbNF0gPSBhWzRdO1xuICAgIG91dFs1XSA9IGFbNV07XG4gICAgb3V0WzZdID0gYVs2XTtcbiAgICBvdXRbN10gPSBhWzddO1xuICAgIG91dFs4XSA9IGFbOF07XG4gICAgb3V0WzldID0gYVs5XTtcbiAgICBvdXRbMTBdID0gYVsxMF07XG4gICAgb3V0WzExXSA9IGFbMTFdO1xuICAgIG91dFsxMl0gPSBhWzEyXTtcbiAgICBvdXRbMTNdID0gYVsxM107XG4gICAgb3V0WzE0XSA9IGFbMTRdO1xuICAgIG91dFsxNV0gPSBhWzE1XTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTZXQgYSBtYXQ0IHRvIHRoZSBpZGVudGl0eSBtYXRyaXhcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmlkZW50aXR5ID0gZnVuY3Rpb24ob3V0KSB7XG4gICAgb3V0WzBdID0gMTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IDE7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDA7XG4gICAgb3V0WzldID0gMDtcbiAgICBvdXRbMTBdID0gMTtcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gMDtcbiAgICBvdXRbMTNdID0gMDtcbiAgICBvdXRbMTRdID0gMDtcbiAgICBvdXRbMTVdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc3Bvc2UgdGhlIHZhbHVlcyBvZiBhIG1hdDRcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQudHJhbnNwb3NlID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgLy8gSWYgd2UgYXJlIHRyYW5zcG9zaW5nIG91cnNlbHZlcyB3ZSBjYW4gc2tpcCBhIGZldyBzdGVwcyBidXQgaGF2ZSB0byBjYWNoZSBzb21lIHZhbHVlc1xuICAgIGlmIChvdXQgPT09IGEpIHtcbiAgICAgICAgdmFyIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sIGEwMyA9IGFbM10sXG4gICAgICAgICAgICBhMTIgPSBhWzZdLCBhMTMgPSBhWzddLFxuICAgICAgICAgICAgYTIzID0gYVsxMV07XG5cbiAgICAgICAgb3V0WzFdID0gYVs0XTtcbiAgICAgICAgb3V0WzJdID0gYVs4XTtcbiAgICAgICAgb3V0WzNdID0gYVsxMl07XG4gICAgICAgIG91dFs0XSA9IGEwMTtcbiAgICAgICAgb3V0WzZdID0gYVs5XTtcbiAgICAgICAgb3V0WzddID0gYVsxM107XG4gICAgICAgIG91dFs4XSA9IGEwMjtcbiAgICAgICAgb3V0WzldID0gYTEyO1xuICAgICAgICBvdXRbMTFdID0gYVsxNF07XG4gICAgICAgIG91dFsxMl0gPSBhMDM7XG4gICAgICAgIG91dFsxM10gPSBhMTM7XG4gICAgICAgIG91dFsxNF0gPSBhMjM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgb3V0WzBdID0gYVswXTtcbiAgICAgICAgb3V0WzFdID0gYVs0XTtcbiAgICAgICAgb3V0WzJdID0gYVs4XTtcbiAgICAgICAgb3V0WzNdID0gYVsxMl07XG4gICAgICAgIG91dFs0XSA9IGFbMV07XG4gICAgICAgIG91dFs1XSA9IGFbNV07XG4gICAgICAgIG91dFs2XSA9IGFbOV07XG4gICAgICAgIG91dFs3XSA9IGFbMTNdO1xuICAgICAgICBvdXRbOF0gPSBhWzJdO1xuICAgICAgICBvdXRbOV0gPSBhWzZdO1xuICAgICAgICBvdXRbMTBdID0gYVsxMF07XG4gICAgICAgIG91dFsxMV0gPSBhWzE0XTtcbiAgICAgICAgb3V0WzEyXSA9IGFbM107XG4gICAgICAgIG91dFsxM10gPSBhWzddO1xuICAgICAgICBvdXRbMTRdID0gYVsxMV07XG4gICAgICAgIG91dFsxNV0gPSBhWzE1XTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogSW52ZXJ0cyBhIG1hdDRcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuaW52ZXJ0ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sIGEwMyA9IGFbM10sXG4gICAgICAgIGExMCA9IGFbNF0sIGExMSA9IGFbNV0sIGExMiA9IGFbNl0sIGExMyA9IGFbN10sXG4gICAgICAgIGEyMCA9IGFbOF0sIGEyMSA9IGFbOV0sIGEyMiA9IGFbMTBdLCBhMjMgPSBhWzExXSxcbiAgICAgICAgYTMwID0gYVsxMl0sIGEzMSA9IGFbMTNdLCBhMzIgPSBhWzE0XSwgYTMzID0gYVsxNV0sXG5cbiAgICAgICAgYjAwID0gYTAwICogYTExIC0gYTAxICogYTEwLFxuICAgICAgICBiMDEgPSBhMDAgKiBhMTIgLSBhMDIgKiBhMTAsXG4gICAgICAgIGIwMiA9IGEwMCAqIGExMyAtIGEwMyAqIGExMCxcbiAgICAgICAgYjAzID0gYTAxICogYTEyIC0gYTAyICogYTExLFxuICAgICAgICBiMDQgPSBhMDEgKiBhMTMgLSBhMDMgKiBhMTEsXG4gICAgICAgIGIwNSA9IGEwMiAqIGExMyAtIGEwMyAqIGExMixcbiAgICAgICAgYjA2ID0gYTIwICogYTMxIC0gYTIxICogYTMwLFxuICAgICAgICBiMDcgPSBhMjAgKiBhMzIgLSBhMjIgKiBhMzAsXG4gICAgICAgIGIwOCA9IGEyMCAqIGEzMyAtIGEyMyAqIGEzMCxcbiAgICAgICAgYjA5ID0gYTIxICogYTMyIC0gYTIyICogYTMxLFxuICAgICAgICBiMTAgPSBhMjEgKiBhMzMgLSBhMjMgKiBhMzEsXG4gICAgICAgIGIxMSA9IGEyMiAqIGEzMyAtIGEyMyAqIGEzMixcblxuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGRldGVybWluYW50XG4gICAgICAgIGRldCA9IGIwMCAqIGIxMSAtIGIwMSAqIGIxMCArIGIwMiAqIGIwOSArIGIwMyAqIGIwOCAtIGIwNCAqIGIwNyArIGIwNSAqIGIwNjtcblxuICAgIGlmICghZGV0KSB7IFxuICAgICAgICByZXR1cm4gbnVsbDsgXG4gICAgfVxuICAgIGRldCA9IDEuMCAvIGRldDtcblxuICAgIG91dFswXSA9IChhMTEgKiBiMTEgLSBhMTIgKiBiMTAgKyBhMTMgKiBiMDkpICogZGV0O1xuICAgIG91dFsxXSA9IChhMDIgKiBiMTAgLSBhMDEgKiBiMTEgLSBhMDMgKiBiMDkpICogZGV0O1xuICAgIG91dFsyXSA9IChhMzEgKiBiMDUgLSBhMzIgKiBiMDQgKyBhMzMgKiBiMDMpICogZGV0O1xuICAgIG91dFszXSA9IChhMjIgKiBiMDQgLSBhMjEgKiBiMDUgLSBhMjMgKiBiMDMpICogZGV0O1xuICAgIG91dFs0XSA9IChhMTIgKiBiMDggLSBhMTAgKiBiMTEgLSBhMTMgKiBiMDcpICogZGV0O1xuICAgIG91dFs1XSA9IChhMDAgKiBiMTEgLSBhMDIgKiBiMDggKyBhMDMgKiBiMDcpICogZGV0O1xuICAgIG91dFs2XSA9IChhMzIgKiBiMDIgLSBhMzAgKiBiMDUgLSBhMzMgKiBiMDEpICogZGV0O1xuICAgIG91dFs3XSA9IChhMjAgKiBiMDUgLSBhMjIgKiBiMDIgKyBhMjMgKiBiMDEpICogZGV0O1xuICAgIG91dFs4XSA9IChhMTAgKiBiMTAgLSBhMTEgKiBiMDggKyBhMTMgKiBiMDYpICogZGV0O1xuICAgIG91dFs5XSA9IChhMDEgKiBiMDggLSBhMDAgKiBiMTAgLSBhMDMgKiBiMDYpICogZGV0O1xuICAgIG91dFsxMF0gPSAoYTMwICogYjA0IC0gYTMxICogYjAyICsgYTMzICogYjAwKSAqIGRldDtcbiAgICBvdXRbMTFdID0gKGEyMSAqIGIwMiAtIGEyMCAqIGIwNCAtIGEyMyAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0WzEyXSA9IChhMTEgKiBiMDcgLSBhMTAgKiBiMDkgLSBhMTIgKiBiMDYpICogZGV0O1xuICAgIG91dFsxM10gPSAoYTAwICogYjA5IC0gYTAxICogYjA3ICsgYTAyICogYjA2KSAqIGRldDtcbiAgICBvdXRbMTRdID0gKGEzMSAqIGIwMSAtIGEzMCAqIGIwMyAtIGEzMiAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0WzE1XSA9IChhMjAgKiBiMDMgLSBhMjEgKiBiMDEgKyBhMjIgKiBiMDApICogZGV0O1xuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgYWRqdWdhdGUgb2YgYSBtYXQ0XG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmFkam9pbnQgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTAzID0gYVszXSxcbiAgICAgICAgYTEwID0gYVs0XSwgYTExID0gYVs1XSwgYTEyID0gYVs2XSwgYTEzID0gYVs3XSxcbiAgICAgICAgYTIwID0gYVs4XSwgYTIxID0gYVs5XSwgYTIyID0gYVsxMF0sIGEyMyA9IGFbMTFdLFxuICAgICAgICBhMzAgPSBhWzEyXSwgYTMxID0gYVsxM10sIGEzMiA9IGFbMTRdLCBhMzMgPSBhWzE1XTtcblxuICAgIG91dFswXSAgPSAgKGExMSAqIChhMjIgKiBhMzMgLSBhMjMgKiBhMzIpIC0gYTIxICogKGExMiAqIGEzMyAtIGExMyAqIGEzMikgKyBhMzEgKiAoYTEyICogYTIzIC0gYTEzICogYTIyKSk7XG4gICAgb3V0WzFdICA9IC0oYTAxICogKGEyMiAqIGEzMyAtIGEyMyAqIGEzMikgLSBhMjEgKiAoYTAyICogYTMzIC0gYTAzICogYTMyKSArIGEzMSAqIChhMDIgKiBhMjMgLSBhMDMgKiBhMjIpKTtcbiAgICBvdXRbMl0gID0gIChhMDEgKiAoYTEyICogYTMzIC0gYTEzICogYTMyKSAtIGExMSAqIChhMDIgKiBhMzMgLSBhMDMgKiBhMzIpICsgYTMxICogKGEwMiAqIGExMyAtIGEwMyAqIGExMikpO1xuICAgIG91dFszXSAgPSAtKGEwMSAqIChhMTIgKiBhMjMgLSBhMTMgKiBhMjIpIC0gYTExICogKGEwMiAqIGEyMyAtIGEwMyAqIGEyMikgKyBhMjEgKiAoYTAyICogYTEzIC0gYTAzICogYTEyKSk7XG4gICAgb3V0WzRdICA9IC0oYTEwICogKGEyMiAqIGEzMyAtIGEyMyAqIGEzMikgLSBhMjAgKiAoYTEyICogYTMzIC0gYTEzICogYTMyKSArIGEzMCAqIChhMTIgKiBhMjMgLSBhMTMgKiBhMjIpKTtcbiAgICBvdXRbNV0gID0gIChhMDAgKiAoYTIyICogYTMzIC0gYTIzICogYTMyKSAtIGEyMCAqIChhMDIgKiBhMzMgLSBhMDMgKiBhMzIpICsgYTMwICogKGEwMiAqIGEyMyAtIGEwMyAqIGEyMikpO1xuICAgIG91dFs2XSAgPSAtKGEwMCAqIChhMTIgKiBhMzMgLSBhMTMgKiBhMzIpIC0gYTEwICogKGEwMiAqIGEzMyAtIGEwMyAqIGEzMikgKyBhMzAgKiAoYTAyICogYTEzIC0gYTAzICogYTEyKSk7XG4gICAgb3V0WzddICA9ICAoYTAwICogKGExMiAqIGEyMyAtIGExMyAqIGEyMikgLSBhMTAgKiAoYTAyICogYTIzIC0gYTAzICogYTIyKSArIGEyMCAqIChhMDIgKiBhMTMgLSBhMDMgKiBhMTIpKTtcbiAgICBvdXRbOF0gID0gIChhMTAgKiAoYTIxICogYTMzIC0gYTIzICogYTMxKSAtIGEyMCAqIChhMTEgKiBhMzMgLSBhMTMgKiBhMzEpICsgYTMwICogKGExMSAqIGEyMyAtIGExMyAqIGEyMSkpO1xuICAgIG91dFs5XSAgPSAtKGEwMCAqIChhMjEgKiBhMzMgLSBhMjMgKiBhMzEpIC0gYTIwICogKGEwMSAqIGEzMyAtIGEwMyAqIGEzMSkgKyBhMzAgKiAoYTAxICogYTIzIC0gYTAzICogYTIxKSk7XG4gICAgb3V0WzEwXSA9ICAoYTAwICogKGExMSAqIGEzMyAtIGExMyAqIGEzMSkgLSBhMTAgKiAoYTAxICogYTMzIC0gYTAzICogYTMxKSArIGEzMCAqIChhMDEgKiBhMTMgLSBhMDMgKiBhMTEpKTtcbiAgICBvdXRbMTFdID0gLShhMDAgKiAoYTExICogYTIzIC0gYTEzICogYTIxKSAtIGExMCAqIChhMDEgKiBhMjMgLSBhMDMgKiBhMjEpICsgYTIwICogKGEwMSAqIGExMyAtIGEwMyAqIGExMSkpO1xuICAgIG91dFsxMl0gPSAtKGExMCAqIChhMjEgKiBhMzIgLSBhMjIgKiBhMzEpIC0gYTIwICogKGExMSAqIGEzMiAtIGExMiAqIGEzMSkgKyBhMzAgKiAoYTExICogYTIyIC0gYTEyICogYTIxKSk7XG4gICAgb3V0WzEzXSA9ICAoYTAwICogKGEyMSAqIGEzMiAtIGEyMiAqIGEzMSkgLSBhMjAgKiAoYTAxICogYTMyIC0gYTAyICogYTMxKSArIGEzMCAqIChhMDEgKiBhMjIgLSBhMDIgKiBhMjEpKTtcbiAgICBvdXRbMTRdID0gLShhMDAgKiAoYTExICogYTMyIC0gYTEyICogYTMxKSAtIGExMCAqIChhMDEgKiBhMzIgLSBhMDIgKiBhMzEpICsgYTMwICogKGEwMSAqIGExMiAtIGEwMiAqIGExMSkpO1xuICAgIG91dFsxNV0gPSAgKGEwMCAqIChhMTEgKiBhMjIgLSBhMTIgKiBhMjEpIC0gYTEwICogKGEwMSAqIGEyMiAtIGEwMiAqIGEyMSkgKyBhMjAgKiAoYTAxICogYTEyIC0gYTAyICogYTExKSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgYSBtYXQ0XG4gKlxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkZXRlcm1pbmFudCBvZiBhXG4gKi9cbm1hdDQuZGV0ZXJtaW5hbnQgPSBmdW5jdGlvbiAoYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMDMgPSBhWzNdLFxuICAgICAgICBhMTAgPSBhWzRdLCBhMTEgPSBhWzVdLCBhMTIgPSBhWzZdLCBhMTMgPSBhWzddLFxuICAgICAgICBhMjAgPSBhWzhdLCBhMjEgPSBhWzldLCBhMjIgPSBhWzEwXSwgYTIzID0gYVsxMV0sXG4gICAgICAgIGEzMCA9IGFbMTJdLCBhMzEgPSBhWzEzXSwgYTMyID0gYVsxNF0sIGEzMyA9IGFbMTVdLFxuXG4gICAgICAgIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMCxcbiAgICAgICAgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwLFxuICAgICAgICBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTAsXG4gICAgICAgIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMSxcbiAgICAgICAgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExLFxuICAgICAgICBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTIsXG4gICAgICAgIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMCxcbiAgICAgICAgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwLFxuICAgICAgICBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzAsXG4gICAgICAgIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMSxcbiAgICAgICAgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxLFxuICAgICAgICBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzI7XG5cbiAgICAvLyBDYWxjdWxhdGUgdGhlIGRldGVybWluYW50XG4gICAgcmV0dXJuIGIwMCAqIGIxMSAtIGIwMSAqIGIxMCArIGIwMiAqIGIwOSArIGIwMyAqIGIwOCAtIGIwNCAqIGIwNyArIGIwNSAqIGIwNjtcbn07XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gbWF0NCdzXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHttYXQ0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0Lm11bHRpcGx5ID0gZnVuY3Rpb24gKG91dCwgYSwgYikge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMDMgPSBhWzNdLFxuICAgICAgICBhMTAgPSBhWzRdLCBhMTEgPSBhWzVdLCBhMTIgPSBhWzZdLCBhMTMgPSBhWzddLFxuICAgICAgICBhMjAgPSBhWzhdLCBhMjEgPSBhWzldLCBhMjIgPSBhWzEwXSwgYTIzID0gYVsxMV0sXG4gICAgICAgIGEzMCA9IGFbMTJdLCBhMzEgPSBhWzEzXSwgYTMyID0gYVsxNF0sIGEzMyA9IGFbMTVdO1xuXG4gICAgLy8gQ2FjaGUgb25seSB0aGUgY3VycmVudCBsaW5lIG9mIHRoZSBzZWNvbmQgbWF0cml4XG4gICAgdmFyIGIwICA9IGJbMF0sIGIxID0gYlsxXSwgYjIgPSBiWzJdLCBiMyA9IGJbM107ICBcbiAgICBvdXRbMF0gPSBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzA7XG4gICAgb3V0WzFdID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dFsyXSA9IGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMjtcbiAgICBvdXRbM10gPSBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG5cbiAgICBiMCA9IGJbNF07IGIxID0gYls1XTsgYjIgPSBiWzZdOyBiMyA9IGJbN107XG4gICAgb3V0WzRdID0gYjAqYTAwICsgYjEqYTEwICsgYjIqYTIwICsgYjMqYTMwO1xuICAgIG91dFs1XSA9IGIwKmEwMSArIGIxKmExMSArIGIyKmEyMSArIGIzKmEzMTtcbiAgICBvdXRbNl0gPSBiMCphMDIgKyBiMSphMTIgKyBiMiphMjIgKyBiMyphMzI7XG4gICAgb3V0WzddID0gYjAqYTAzICsgYjEqYTEzICsgYjIqYTIzICsgYjMqYTMzO1xuXG4gICAgYjAgPSBiWzhdOyBiMSA9IGJbOV07IGIyID0gYlsxMF07IGIzID0gYlsxMV07XG4gICAgb3V0WzhdID0gYjAqYTAwICsgYjEqYTEwICsgYjIqYTIwICsgYjMqYTMwO1xuICAgIG91dFs5XSA9IGIwKmEwMSArIGIxKmExMSArIGIyKmEyMSArIGIzKmEzMTtcbiAgICBvdXRbMTBdID0gYjAqYTAyICsgYjEqYTEyICsgYjIqYTIyICsgYjMqYTMyO1xuICAgIG91dFsxMV0gPSBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG5cbiAgICBiMCA9IGJbMTJdOyBiMSA9IGJbMTNdOyBiMiA9IGJbMTRdOyBiMyA9IGJbMTVdO1xuICAgIG91dFsxMl0gPSBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzA7XG4gICAgb3V0WzEzXSA9IGIwKmEwMSArIGIxKmExMSArIGIyKmEyMSArIGIzKmEzMTtcbiAgICBvdXRbMTRdID0gYjAqYTAyICsgYjEqYTEyICsgYjIqYTIyICsgYjMqYTMyO1xuICAgIG91dFsxNV0gPSBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayBtYXQ0Lm11bHRpcGx5fVxuICogQGZ1bmN0aW9uXG4gKi9cbm1hdDQubXVsID0gbWF0NC5tdWx0aXBseTtcblxuLyoqXG4gKiBUcmFuc2xhdGUgYSBtYXQ0IGJ5IHRoZSBnaXZlbiB2ZWN0b3JcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gdHJhbnNsYXRlXG4gKiBAcGFyYW0ge3ZlYzN9IHYgdmVjdG9yIHRvIHRyYW5zbGF0ZSBieVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LnRyYW5zbGF0ZSA9IGZ1bmN0aW9uIChvdXQsIGEsIHYpIHtcbiAgICB2YXIgeCA9IHZbMF0sIHkgPSB2WzFdLCB6ID0gdlsyXSxcbiAgICAgICAgYTAwLCBhMDEsIGEwMiwgYTAzLFxuICAgICAgICBhMTAsIGExMSwgYTEyLCBhMTMsXG4gICAgICAgIGEyMCwgYTIxLCBhMjIsIGEyMztcblxuICAgIGlmIChhID09PSBvdXQpIHtcbiAgICAgICAgb3V0WzEyXSA9IGFbMF0gKiB4ICsgYVs0XSAqIHkgKyBhWzhdICogeiArIGFbMTJdO1xuICAgICAgICBvdXRbMTNdID0gYVsxXSAqIHggKyBhWzVdICogeSArIGFbOV0gKiB6ICsgYVsxM107XG4gICAgICAgIG91dFsxNF0gPSBhWzJdICogeCArIGFbNl0gKiB5ICsgYVsxMF0gKiB6ICsgYVsxNF07XG4gICAgICAgIG91dFsxNV0gPSBhWzNdICogeCArIGFbN10gKiB5ICsgYVsxMV0gKiB6ICsgYVsxNV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYTAwID0gYVswXTsgYTAxID0gYVsxXTsgYTAyID0gYVsyXTsgYTAzID0gYVszXTtcbiAgICAgICAgYTEwID0gYVs0XTsgYTExID0gYVs1XTsgYTEyID0gYVs2XTsgYTEzID0gYVs3XTtcbiAgICAgICAgYTIwID0gYVs4XTsgYTIxID0gYVs5XTsgYTIyID0gYVsxMF07IGEyMyA9IGFbMTFdO1xuXG4gICAgICAgIG91dFswXSA9IGEwMDsgb3V0WzFdID0gYTAxOyBvdXRbMl0gPSBhMDI7IG91dFszXSA9IGEwMztcbiAgICAgICAgb3V0WzRdID0gYTEwOyBvdXRbNV0gPSBhMTE7IG91dFs2XSA9IGExMjsgb3V0WzddID0gYTEzO1xuICAgICAgICBvdXRbOF0gPSBhMjA7IG91dFs5XSA9IGEyMTsgb3V0WzEwXSA9IGEyMjsgb3V0WzExXSA9IGEyMztcblxuICAgICAgICBvdXRbMTJdID0gYTAwICogeCArIGExMCAqIHkgKyBhMjAgKiB6ICsgYVsxMl07XG4gICAgICAgIG91dFsxM10gPSBhMDEgKiB4ICsgYTExICogeSArIGEyMSAqIHogKyBhWzEzXTtcbiAgICAgICAgb3V0WzE0XSA9IGEwMiAqIHggKyBhMTIgKiB5ICsgYTIyICogeiArIGFbMTRdO1xuICAgICAgICBvdXRbMTVdID0gYTAzICogeCArIGExMyAqIHkgKyBhMjMgKiB6ICsgYVsxNV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2NhbGVzIHRoZSBtYXQ0IGJ5IHRoZSBkaW1lbnNpb25zIGluIHRoZSBnaXZlbiB2ZWMzXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgbWF0cml4IHRvIHNjYWxlXG4gKiBAcGFyYW0ge3ZlYzN9IHYgdGhlIHZlYzMgdG8gc2NhbGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDR9IG91dFxuICoqL1xubWF0NC5zY2FsZSA9IGZ1bmN0aW9uKG91dCwgYSwgdikge1xuICAgIHZhciB4ID0gdlswXSwgeSA9IHZbMV0sIHogPSB2WzJdO1xuXG4gICAgb3V0WzBdID0gYVswXSAqIHg7XG4gICAgb3V0WzFdID0gYVsxXSAqIHg7XG4gICAgb3V0WzJdID0gYVsyXSAqIHg7XG4gICAgb3V0WzNdID0gYVszXSAqIHg7XG4gICAgb3V0WzRdID0gYVs0XSAqIHk7XG4gICAgb3V0WzVdID0gYVs1XSAqIHk7XG4gICAgb3V0WzZdID0gYVs2XSAqIHk7XG4gICAgb3V0WzddID0gYVs3XSAqIHk7XG4gICAgb3V0WzhdID0gYVs4XSAqIHo7XG4gICAgb3V0WzldID0gYVs5XSAqIHo7XG4gICAgb3V0WzEwXSA9IGFbMTBdICogejtcbiAgICBvdXRbMTFdID0gYVsxMV0gKiB6O1xuICAgIG91dFsxMl0gPSBhWzEyXTtcbiAgICBvdXRbMTNdID0gYVsxM107XG4gICAgb3V0WzE0XSA9IGFbMTRdO1xuICAgIG91dFsxNV0gPSBhWzE1XTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSb3RhdGVzIGEgbWF0NCBieSB0aGUgZ2l2ZW4gYW5nbGUgYXJvdW5kIHRoZSBnaXZlbiBheGlzXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEBwYXJhbSB7dmVjM30gYXhpcyB0aGUgYXhpcyB0byByb3RhdGUgYXJvdW5kXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQucm90YXRlID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkLCBheGlzKSB7XG4gICAgdmFyIHggPSBheGlzWzBdLCB5ID0gYXhpc1sxXSwgeiA9IGF4aXNbMl0sXG4gICAgICAgIGxlbiA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopLFxuICAgICAgICBzLCBjLCB0LFxuICAgICAgICBhMDAsIGEwMSwgYTAyLCBhMDMsXG4gICAgICAgIGExMCwgYTExLCBhMTIsIGExMyxcbiAgICAgICAgYTIwLCBhMjEsIGEyMiwgYTIzLFxuICAgICAgICBiMDAsIGIwMSwgYjAyLFxuICAgICAgICBiMTAsIGIxMSwgYjEyLFxuICAgICAgICBiMjAsIGIyMSwgYjIyO1xuXG4gICAgaWYgKE1hdGguYWJzKGxlbikgPCBnbE1hdHJpeC5FUFNJTE9OKSB7IHJldHVybiBudWxsOyB9XG4gICAgXG4gICAgbGVuID0gMSAvIGxlbjtcbiAgICB4ICo9IGxlbjtcbiAgICB5ICo9IGxlbjtcbiAgICB6ICo9IGxlbjtcblxuICAgIHMgPSBNYXRoLnNpbihyYWQpO1xuICAgIGMgPSBNYXRoLmNvcyhyYWQpO1xuICAgIHQgPSAxIC0gYztcblxuICAgIGEwMCA9IGFbMF07IGEwMSA9IGFbMV07IGEwMiA9IGFbMl07IGEwMyA9IGFbM107XG4gICAgYTEwID0gYVs0XTsgYTExID0gYVs1XTsgYTEyID0gYVs2XTsgYTEzID0gYVs3XTtcbiAgICBhMjAgPSBhWzhdOyBhMjEgPSBhWzldOyBhMjIgPSBhWzEwXTsgYTIzID0gYVsxMV07XG5cbiAgICAvLyBDb25zdHJ1Y3QgdGhlIGVsZW1lbnRzIG9mIHRoZSByb3RhdGlvbiBtYXRyaXhcbiAgICBiMDAgPSB4ICogeCAqIHQgKyBjOyBiMDEgPSB5ICogeCAqIHQgKyB6ICogczsgYjAyID0geiAqIHggKiB0IC0geSAqIHM7XG4gICAgYjEwID0geCAqIHkgKiB0IC0geiAqIHM7IGIxMSA9IHkgKiB5ICogdCArIGM7IGIxMiA9IHogKiB5ICogdCArIHggKiBzO1xuICAgIGIyMCA9IHggKiB6ICogdCArIHkgKiBzOyBiMjEgPSB5ICogeiAqIHQgLSB4ICogczsgYjIyID0geiAqIHogKiB0ICsgYztcblxuICAgIC8vIFBlcmZvcm0gcm90YXRpb24tc3BlY2lmaWMgbWF0cml4IG11bHRpcGxpY2F0aW9uXG4gICAgb3V0WzBdID0gYTAwICogYjAwICsgYTEwICogYjAxICsgYTIwICogYjAyO1xuICAgIG91dFsxXSA9IGEwMSAqIGIwMCArIGExMSAqIGIwMSArIGEyMSAqIGIwMjtcbiAgICBvdXRbMl0gPSBhMDIgKiBiMDAgKyBhMTIgKiBiMDEgKyBhMjIgKiBiMDI7XG4gICAgb3V0WzNdID0gYTAzICogYjAwICsgYTEzICogYjAxICsgYTIzICogYjAyO1xuICAgIG91dFs0XSA9IGEwMCAqIGIxMCArIGExMCAqIGIxMSArIGEyMCAqIGIxMjtcbiAgICBvdXRbNV0gPSBhMDEgKiBiMTAgKyBhMTEgKiBiMTEgKyBhMjEgKiBiMTI7XG4gICAgb3V0WzZdID0gYTAyICogYjEwICsgYTEyICogYjExICsgYTIyICogYjEyO1xuICAgIG91dFs3XSA9IGEwMyAqIGIxMCArIGExMyAqIGIxMSArIGEyMyAqIGIxMjtcbiAgICBvdXRbOF0gPSBhMDAgKiBiMjAgKyBhMTAgKiBiMjEgKyBhMjAgKiBiMjI7XG4gICAgb3V0WzldID0gYTAxICogYjIwICsgYTExICogYjIxICsgYTIxICogYjIyO1xuICAgIG91dFsxMF0gPSBhMDIgKiBiMjAgKyBhMTIgKiBiMjEgKyBhMjIgKiBiMjI7XG4gICAgb3V0WzExXSA9IGEwMyAqIGIyMCArIGExMyAqIGIyMSArIGEyMyAqIGIyMjtcblxuICAgIGlmIChhICE9PSBvdXQpIHsgLy8gSWYgdGhlIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gZGlmZmVyLCBjb3B5IHRoZSB1bmNoYW5nZWQgbGFzdCByb3dcbiAgICAgICAgb3V0WzEyXSA9IGFbMTJdO1xuICAgICAgICBvdXRbMTNdID0gYVsxM107XG4gICAgICAgIG91dFsxNF0gPSBhWzE0XTtcbiAgICAgICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSb3RhdGVzIGEgbWF0cml4IGJ5IHRoZSBnaXZlbiBhbmdsZSBhcm91bmQgdGhlIFggYXhpc1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQucm90YXRlWCA9IGZ1bmN0aW9uIChvdXQsIGEsIHJhZCkge1xuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKSxcbiAgICAgICAgYyA9IE1hdGguY29zKHJhZCksXG4gICAgICAgIGExMCA9IGFbNF0sXG4gICAgICAgIGExMSA9IGFbNV0sXG4gICAgICAgIGExMiA9IGFbNl0sXG4gICAgICAgIGExMyA9IGFbN10sXG4gICAgICAgIGEyMCA9IGFbOF0sXG4gICAgICAgIGEyMSA9IGFbOV0sXG4gICAgICAgIGEyMiA9IGFbMTBdLFxuICAgICAgICBhMjMgPSBhWzExXTtcblxuICAgIGlmIChhICE9PSBvdXQpIHsgLy8gSWYgdGhlIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gZGlmZmVyLCBjb3B5IHRoZSB1bmNoYW5nZWQgcm93c1xuICAgICAgICBvdXRbMF0gID0gYVswXTtcbiAgICAgICAgb3V0WzFdICA9IGFbMV07XG4gICAgICAgIG91dFsyXSAgPSBhWzJdO1xuICAgICAgICBvdXRbM10gID0gYVszXTtcbiAgICAgICAgb3V0WzEyXSA9IGFbMTJdO1xuICAgICAgICBvdXRbMTNdID0gYVsxM107XG4gICAgICAgIG91dFsxNF0gPSBhWzE0XTtcbiAgICAgICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIH1cblxuICAgIC8vIFBlcmZvcm0gYXhpcy1zcGVjaWZpYyBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICBvdXRbNF0gPSBhMTAgKiBjICsgYTIwICogcztcbiAgICBvdXRbNV0gPSBhMTEgKiBjICsgYTIxICogcztcbiAgICBvdXRbNl0gPSBhMTIgKiBjICsgYTIyICogcztcbiAgICBvdXRbN10gPSBhMTMgKiBjICsgYTIzICogcztcbiAgICBvdXRbOF0gPSBhMjAgKiBjIC0gYTEwICogcztcbiAgICBvdXRbOV0gPSBhMjEgKiBjIC0gYTExICogcztcbiAgICBvdXRbMTBdID0gYTIyICogYyAtIGExMiAqIHM7XG4gICAgb3V0WzExXSA9IGEyMyAqIGMgLSBhMTMgKiBzO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBtYXRyaXggYnkgdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgWSBheGlzXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5yb3RhdGVZID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkKSB7XG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpLFxuICAgICAgICBjID0gTWF0aC5jb3MocmFkKSxcbiAgICAgICAgYTAwID0gYVswXSxcbiAgICAgICAgYTAxID0gYVsxXSxcbiAgICAgICAgYTAyID0gYVsyXSxcbiAgICAgICAgYTAzID0gYVszXSxcbiAgICAgICAgYTIwID0gYVs4XSxcbiAgICAgICAgYTIxID0gYVs5XSxcbiAgICAgICAgYTIyID0gYVsxMF0sXG4gICAgICAgIGEyMyA9IGFbMTFdO1xuXG4gICAgaWYgKGEgIT09IG91dCkgeyAvLyBJZiB0aGUgc291cmNlIGFuZCBkZXN0aW5hdGlvbiBkaWZmZXIsIGNvcHkgdGhlIHVuY2hhbmdlZCByb3dzXG4gICAgICAgIG91dFs0XSAgPSBhWzRdO1xuICAgICAgICBvdXRbNV0gID0gYVs1XTtcbiAgICAgICAgb3V0WzZdICA9IGFbNl07XG4gICAgICAgIG91dFs3XSAgPSBhWzddO1xuICAgICAgICBvdXRbMTJdID0gYVsxMl07XG4gICAgICAgIG91dFsxM10gPSBhWzEzXTtcbiAgICAgICAgb3V0WzE0XSA9IGFbMTRdO1xuICAgICAgICBvdXRbMTVdID0gYVsxNV07XG4gICAgfVxuXG4gICAgLy8gUGVyZm9ybSBheGlzLXNwZWNpZmljIG1hdHJpeCBtdWx0aXBsaWNhdGlvblxuICAgIG91dFswXSA9IGEwMCAqIGMgLSBhMjAgKiBzO1xuICAgIG91dFsxXSA9IGEwMSAqIGMgLSBhMjEgKiBzO1xuICAgIG91dFsyXSA9IGEwMiAqIGMgLSBhMjIgKiBzO1xuICAgIG91dFszXSA9IGEwMyAqIGMgLSBhMjMgKiBzO1xuICAgIG91dFs4XSA9IGEwMCAqIHMgKyBhMjAgKiBjO1xuICAgIG91dFs5XSA9IGEwMSAqIHMgKyBhMjEgKiBjO1xuICAgIG91dFsxMF0gPSBhMDIgKiBzICsgYTIyICogYztcbiAgICBvdXRbMTFdID0gYTAzICogcyArIGEyMyAqIGM7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUm90YXRlcyBhIG1hdHJpeCBieSB0aGUgZ2l2ZW4gYW5nbGUgYXJvdW5kIHRoZSBaIGF4aXNcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LnJvdGF0ZVogPSBmdW5jdGlvbiAob3V0LCBhLCByYWQpIHtcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCksXG4gICAgICAgIGMgPSBNYXRoLmNvcyhyYWQpLFxuICAgICAgICBhMDAgPSBhWzBdLFxuICAgICAgICBhMDEgPSBhWzFdLFxuICAgICAgICBhMDIgPSBhWzJdLFxuICAgICAgICBhMDMgPSBhWzNdLFxuICAgICAgICBhMTAgPSBhWzRdLFxuICAgICAgICBhMTEgPSBhWzVdLFxuICAgICAgICBhMTIgPSBhWzZdLFxuICAgICAgICBhMTMgPSBhWzddO1xuXG4gICAgaWYgKGEgIT09IG91dCkgeyAvLyBJZiB0aGUgc291cmNlIGFuZCBkZXN0aW5hdGlvbiBkaWZmZXIsIGNvcHkgdGhlIHVuY2hhbmdlZCBsYXN0IHJvd1xuICAgICAgICBvdXRbOF0gID0gYVs4XTtcbiAgICAgICAgb3V0WzldICA9IGFbOV07XG4gICAgICAgIG91dFsxMF0gPSBhWzEwXTtcbiAgICAgICAgb3V0WzExXSA9IGFbMTFdO1xuICAgICAgICBvdXRbMTJdID0gYVsxMl07XG4gICAgICAgIG91dFsxM10gPSBhWzEzXTtcbiAgICAgICAgb3V0WzE0XSA9IGFbMTRdO1xuICAgICAgICBvdXRbMTVdID0gYVsxNV07XG4gICAgfVxuXG4gICAgLy8gUGVyZm9ybSBheGlzLXNwZWNpZmljIG1hdHJpeCBtdWx0aXBsaWNhdGlvblxuICAgIG91dFswXSA9IGEwMCAqIGMgKyBhMTAgKiBzO1xuICAgIG91dFsxXSA9IGEwMSAqIGMgKyBhMTEgKiBzO1xuICAgIG91dFsyXSA9IGEwMiAqIGMgKyBhMTIgKiBzO1xuICAgIG91dFszXSA9IGEwMyAqIGMgKyBhMTMgKiBzO1xuICAgIG91dFs0XSA9IGExMCAqIGMgLSBhMDAgKiBzO1xuICAgIG91dFs1XSA9IGExMSAqIGMgLSBhMDEgKiBzO1xuICAgIG91dFs2XSA9IGExMiAqIGMgLSBhMDIgKiBzO1xuICAgIG91dFs3XSA9IGExMyAqIGMgLSBhMDMgKiBzO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHZlY3RvciB0cmFuc2xhdGlvblxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0NC50cmFuc2xhdGUoZGVzdCwgZGVzdCwgdmVjKTtcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3ZlYzN9IHYgVHJhbnNsYXRpb24gdmVjdG9yXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuZnJvbVRyYW5zbGF0aW9uID0gZnVuY3Rpb24ob3V0LCB2KSB7XG4gICAgb3V0WzBdID0gMTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IDE7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDA7XG4gICAgb3V0WzldID0gMDtcbiAgICBvdXRbMTBdID0gMTtcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gdlswXTtcbiAgICBvdXRbMTNdID0gdlsxXTtcbiAgICBvdXRbMTRdID0gdlsyXTtcbiAgICBvdXRbMTVdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHZlY3RvciBzY2FsaW5nXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0NC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQ0LnNjYWxlKGRlc3QsIGRlc3QsIHZlYyk7XG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHt2ZWMzfSB2IFNjYWxpbmcgdmVjdG9yXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuZnJvbVNjYWxpbmcgPSBmdW5jdGlvbihvdXQsIHYpIHtcbiAgICBvdXRbMF0gPSB2WzBdO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gdlsxXTtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMDtcbiAgICBvdXRbOV0gPSAwO1xuICAgIG91dFsxMF0gPSB2WzJdO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAwO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgZ2l2ZW4gYW5nbGUgYXJvdW5kIGEgZ2l2ZW4gYXhpc1xuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0NC5yb3RhdGUoZGVzdCwgZGVzdCwgcmFkLCBheGlzKTtcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHBhcmFtIHt2ZWMzfSBheGlzIHRoZSBheGlzIHRvIHJvdGF0ZSBhcm91bmRcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5mcm9tUm90YXRpb24gPSBmdW5jdGlvbihvdXQsIHJhZCwgYXhpcykge1xuICAgIHZhciB4ID0gYXhpc1swXSwgeSA9IGF4aXNbMV0sIHogPSBheGlzWzJdLFxuICAgICAgICBsZW4gPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KSxcbiAgICAgICAgcywgYywgdDtcbiAgICBcbiAgICBpZiAoTWF0aC5hYnMobGVuKSA8IGdsTWF0cml4LkVQU0lMT04pIHsgcmV0dXJuIG51bGw7IH1cbiAgICBcbiAgICBsZW4gPSAxIC8gbGVuO1xuICAgIHggKj0gbGVuO1xuICAgIHkgKj0gbGVuO1xuICAgIHogKj0gbGVuO1xuICAgIFxuICAgIHMgPSBNYXRoLnNpbihyYWQpO1xuICAgIGMgPSBNYXRoLmNvcyhyYWQpO1xuICAgIHQgPSAxIC0gYztcbiAgICBcbiAgICAvLyBQZXJmb3JtIHJvdGF0aW9uLXNwZWNpZmljIG1hdHJpeCBtdWx0aXBsaWNhdGlvblxuICAgIG91dFswXSA9IHggKiB4ICogdCArIGM7XG4gICAgb3V0WzFdID0geSAqIHggKiB0ICsgeiAqIHM7XG4gICAgb3V0WzJdID0geiAqIHggKiB0IC0geSAqIHM7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSB4ICogeSAqIHQgLSB6ICogcztcbiAgICBvdXRbNV0gPSB5ICogeSAqIHQgKyBjO1xuICAgIG91dFs2XSA9IHogKiB5ICogdCArIHggKiBzO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0geCAqIHogKiB0ICsgeSAqIHM7XG4gICAgb3V0WzldID0geSAqIHogKiB0IC0geCAqIHM7XG4gICAgb3V0WzEwXSA9IHogKiB6ICogdCArIGM7XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IDA7XG4gICAgb3V0WzEzXSA9IDA7XG4gICAgb3V0WzE0XSA9IDA7XG4gICAgb3V0WzE1XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgWCBheGlzXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0NC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQ0LnJvdGF0ZVgoZGVzdCwgZGVzdCwgcmFkKTtcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmZyb21YUm90YXRpb24gPSBmdW5jdGlvbihvdXQsIHJhZCkge1xuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKSxcbiAgICAgICAgYyA9IE1hdGguY29zKHJhZCk7XG4gICAgXG4gICAgLy8gUGVyZm9ybSBheGlzLXNwZWNpZmljIG1hdHJpeCBtdWx0aXBsaWNhdGlvblxuICAgIG91dFswXSAgPSAxO1xuICAgIG91dFsxXSAgPSAwO1xuICAgIG91dFsyXSAgPSAwO1xuICAgIG91dFszXSAgPSAwO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gYztcbiAgICBvdXRbNl0gPSBzO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMDtcbiAgICBvdXRbOV0gPSAtcztcbiAgICBvdXRbMTBdID0gYztcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gMDtcbiAgICBvdXRbMTNdID0gMDtcbiAgICBvdXRbMTRdID0gMDtcbiAgICBvdXRbMTVdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSB0aGUgZ2l2ZW4gYW5nbGUgYXJvdW5kIHRoZSBZIGF4aXNcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQ0LmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDQucm90YXRlWShkZXN0LCBkZXN0LCByYWQpO1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuZnJvbVlSb3RhdGlvbiA9IGZ1bmN0aW9uKG91dCwgcmFkKSB7XG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpLFxuICAgICAgICBjID0gTWF0aC5jb3MocmFkKTtcbiAgICBcbiAgICAvLyBQZXJmb3JtIGF4aXMtc3BlY2lmaWMgbWF0cml4IG11bHRpcGxpY2F0aW9uXG4gICAgb3V0WzBdICA9IGM7XG4gICAgb3V0WzFdICA9IDA7XG4gICAgb3V0WzJdICA9IC1zO1xuICAgIG91dFszXSAgPSAwO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gMTtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gcztcbiAgICBvdXRbOV0gPSAwO1xuICAgIG91dFsxMF0gPSBjO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAwO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIHRoZSBnaXZlbiBhbmdsZSBhcm91bmQgdGhlIFogYXhpc1xuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0NC5yb3RhdGVaKGRlc3QsIGRlc3QsIHJhZCk7XG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5mcm9tWlJvdGF0aW9uID0gZnVuY3Rpb24ob3V0LCByYWQpIHtcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCksXG4gICAgICAgIGMgPSBNYXRoLmNvcyhyYWQpO1xuICAgIFxuICAgIC8vIFBlcmZvcm0gYXhpcy1zcGVjaWZpYyBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICBvdXRbMF0gID0gYztcbiAgICBvdXRbMV0gID0gcztcbiAgICBvdXRbMl0gID0gMDtcbiAgICBvdXRbM10gID0gMDtcbiAgICBvdXRbNF0gPSAtcztcbiAgICBvdXRbNV0gPSBjO1xuICAgIG91dFs2XSA9IDA7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSAwO1xuICAgIG91dFs5XSA9IDA7XG4gICAgb3V0WzEwXSA9IDE7XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IDA7XG4gICAgb3V0WzEzXSA9IDA7XG4gICAgb3V0WzE0XSA9IDA7XG4gICAgb3V0WzE1XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSBxdWF0ZXJuaW9uIHJvdGF0aW9uIGFuZCB2ZWN0b3IgdHJhbnNsYXRpb25cbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQ0LmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDQudHJhbnNsYXRlKGRlc3QsIHZlYyk7XG4gKiAgICAgdmFyIHF1YXRNYXQgPSBtYXQ0LmNyZWF0ZSgpO1xuICogICAgIHF1YXQ0LnRvTWF0NChxdWF0LCBxdWF0TWF0KTtcbiAqICAgICBtYXQ0Lm11bHRpcGx5KGRlc3QsIHF1YXRNYXQpO1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7cXVhdDR9IHEgUm90YXRpb24gcXVhdGVybmlvblxuICogQHBhcmFtIHt2ZWMzfSB2IFRyYW5zbGF0aW9uIHZlY3RvclxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmZyb21Sb3RhdGlvblRyYW5zbGF0aW9uID0gZnVuY3Rpb24gKG91dCwgcSwgdikge1xuICAgIC8vIFF1YXRlcm5pb24gbWF0aFxuICAgIHZhciB4ID0gcVswXSwgeSA9IHFbMV0sIHogPSBxWzJdLCB3ID0gcVszXSxcbiAgICAgICAgeDIgPSB4ICsgeCxcbiAgICAgICAgeTIgPSB5ICsgeSxcbiAgICAgICAgejIgPSB6ICsgeixcblxuICAgICAgICB4eCA9IHggKiB4MixcbiAgICAgICAgeHkgPSB4ICogeTIsXG4gICAgICAgIHh6ID0geCAqIHoyLFxuICAgICAgICB5eSA9IHkgKiB5MixcbiAgICAgICAgeXogPSB5ICogejIsXG4gICAgICAgIHp6ID0geiAqIHoyLFxuICAgICAgICB3eCA9IHcgKiB4MixcbiAgICAgICAgd3kgPSB3ICogeTIsXG4gICAgICAgIHd6ID0gdyAqIHoyO1xuXG4gICAgb3V0WzBdID0gMSAtICh5eSArIHp6KTtcbiAgICBvdXRbMV0gPSB4eSArIHd6O1xuICAgIG91dFsyXSA9IHh6IC0gd3k7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSB4eSAtIHd6O1xuICAgIG91dFs1XSA9IDEgLSAoeHggKyB6eik7XG4gICAgb3V0WzZdID0geXogKyB3eDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IHh6ICsgd3k7XG4gICAgb3V0WzldID0geXogLSB3eDtcbiAgICBvdXRbMTBdID0gMSAtICh4eCArIHl5KTtcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gdlswXTtcbiAgICBvdXRbMTNdID0gdlsxXTtcbiAgICBvdXRbMTRdID0gdlsyXTtcbiAgICBvdXRbMTVdID0gMTtcbiAgICBcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSBxdWF0ZXJuaW9uIHJvdGF0aW9uLCB2ZWN0b3IgdHJhbnNsYXRpb24gYW5kIHZlY3RvciBzY2FsZVxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0NC50cmFuc2xhdGUoZGVzdCwgdmVjKTtcbiAqICAgICB2YXIgcXVhdE1hdCA9IG1hdDQuY3JlYXRlKCk7XG4gKiAgICAgcXVhdDQudG9NYXQ0KHF1YXQsIHF1YXRNYXQpO1xuICogICAgIG1hdDQubXVsdGlwbHkoZGVzdCwgcXVhdE1hdCk7XG4gKiAgICAgbWF0NC5zY2FsZShkZXN0LCBzY2FsZSlcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3F1YXQ0fSBxIFJvdGF0aW9uIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7dmVjM30gdiBUcmFuc2xhdGlvbiB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gcyBTY2FsaW5nIHZlY3RvclxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmZyb21Sb3RhdGlvblRyYW5zbGF0aW9uU2NhbGUgPSBmdW5jdGlvbiAob3V0LCBxLCB2LCBzKSB7XG4gICAgLy8gUXVhdGVybmlvbiBtYXRoXG4gICAgdmFyIHggPSBxWzBdLCB5ID0gcVsxXSwgeiA9IHFbMl0sIHcgPSBxWzNdLFxuICAgICAgICB4MiA9IHggKyB4LFxuICAgICAgICB5MiA9IHkgKyB5LFxuICAgICAgICB6MiA9IHogKyB6LFxuXG4gICAgICAgIHh4ID0geCAqIHgyLFxuICAgICAgICB4eSA9IHggKiB5MixcbiAgICAgICAgeHogPSB4ICogejIsXG4gICAgICAgIHl5ID0geSAqIHkyLFxuICAgICAgICB5eiA9IHkgKiB6MixcbiAgICAgICAgenogPSB6ICogejIsXG4gICAgICAgIHd4ID0gdyAqIHgyLFxuICAgICAgICB3eSA9IHcgKiB5MixcbiAgICAgICAgd3ogPSB3ICogejIsXG4gICAgICAgIHN4ID0gc1swXSxcbiAgICAgICAgc3kgPSBzWzFdLFxuICAgICAgICBzeiA9IHNbMl07XG5cbiAgICBvdXRbMF0gPSAoMSAtICh5eSArIHp6KSkgKiBzeDtcbiAgICBvdXRbMV0gPSAoeHkgKyB3eikgKiBzeDtcbiAgICBvdXRbMl0gPSAoeHogLSB3eSkgKiBzeDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9ICh4eSAtIHd6KSAqIHN5O1xuICAgIG91dFs1XSA9ICgxIC0gKHh4ICsgenopKSAqIHN5O1xuICAgIG91dFs2XSA9ICh5eiArIHd4KSAqIHN5O1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gKHh6ICsgd3kpICogc3o7XG4gICAgb3V0WzldID0gKHl6IC0gd3gpICogc3o7XG4gICAgb3V0WzEwXSA9ICgxIC0gKHh4ICsgeXkpKSAqIHN6O1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSB2WzBdO1xuICAgIG91dFsxM10gPSB2WzFdO1xuICAgIG91dFsxNF0gPSB2WzJdO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIFxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHF1YXRlcm5pb24gcm90YXRpb24sIHZlY3RvciB0cmFuc2xhdGlvbiBhbmQgdmVjdG9yIHNjYWxlLCByb3RhdGluZyBhbmQgc2NhbGluZyBhcm91bmQgdGhlIGdpdmVuIG9yaWdpblxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0NC50cmFuc2xhdGUoZGVzdCwgdmVjKTtcbiAqICAgICBtYXQ0LnRyYW5zbGF0ZShkZXN0LCBvcmlnaW4pO1xuICogICAgIHZhciBxdWF0TWF0ID0gbWF0NC5jcmVhdGUoKTtcbiAqICAgICBxdWF0NC50b01hdDQocXVhdCwgcXVhdE1hdCk7XG4gKiAgICAgbWF0NC5tdWx0aXBseShkZXN0LCBxdWF0TWF0KTtcbiAqICAgICBtYXQ0LnNjYWxlKGRlc3QsIHNjYWxlKVxuICogICAgIG1hdDQudHJhbnNsYXRlKGRlc3QsIG5lZ2F0aXZlT3JpZ2luKTtcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3F1YXQ0fSBxIFJvdGF0aW9uIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7dmVjM30gdiBUcmFuc2xhdGlvbiB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gcyBTY2FsaW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBvIFRoZSBvcmlnaW4gdmVjdG9yIGFyb3VuZCB3aGljaCB0byBzY2FsZSBhbmQgcm90YXRlXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuZnJvbVJvdGF0aW9uVHJhbnNsYXRpb25TY2FsZU9yaWdpbiA9IGZ1bmN0aW9uIChvdXQsIHEsIHYsIHMsIG8pIHtcbiAgLy8gUXVhdGVybmlvbiBtYXRoXG4gIHZhciB4ID0gcVswXSwgeSA9IHFbMV0sIHogPSBxWzJdLCB3ID0gcVszXSxcbiAgICAgIHgyID0geCArIHgsXG4gICAgICB5MiA9IHkgKyB5LFxuICAgICAgejIgPSB6ICsgeixcblxuICAgICAgeHggPSB4ICogeDIsXG4gICAgICB4eSA9IHggKiB5MixcbiAgICAgIHh6ID0geCAqIHoyLFxuICAgICAgeXkgPSB5ICogeTIsXG4gICAgICB5eiA9IHkgKiB6MixcbiAgICAgIHp6ID0geiAqIHoyLFxuICAgICAgd3ggPSB3ICogeDIsXG4gICAgICB3eSA9IHcgKiB5MixcbiAgICAgIHd6ID0gdyAqIHoyLFxuICAgICAgXG4gICAgICBzeCA9IHNbMF0sXG4gICAgICBzeSA9IHNbMV0sXG4gICAgICBzeiA9IHNbMl0sXG5cbiAgICAgIG94ID0gb1swXSxcbiAgICAgIG95ID0gb1sxXSxcbiAgICAgIG96ID0gb1syXTtcbiAgICAgIFxuICBvdXRbMF0gPSAoMSAtICh5eSArIHp6KSkgKiBzeDtcbiAgb3V0WzFdID0gKHh5ICsgd3opICogc3g7XG4gIG91dFsyXSA9ICh4eiAtIHd5KSAqIHN4O1xuICBvdXRbM10gPSAwO1xuICBvdXRbNF0gPSAoeHkgLSB3eikgKiBzeTtcbiAgb3V0WzVdID0gKDEgLSAoeHggKyB6eikpICogc3k7XG4gIG91dFs2XSA9ICh5eiArIHd4KSAqIHN5O1xuICBvdXRbN10gPSAwO1xuICBvdXRbOF0gPSAoeHogKyB3eSkgKiBzejtcbiAgb3V0WzldID0gKHl6IC0gd3gpICogc3o7XG4gIG91dFsxMF0gPSAoMSAtICh4eCArIHl5KSkgKiBzejtcbiAgb3V0WzExXSA9IDA7XG4gIG91dFsxMl0gPSB2WzBdICsgb3ggLSAob3V0WzBdICogb3ggKyBvdXRbNF0gKiBveSArIG91dFs4XSAqIG96KTtcbiAgb3V0WzEzXSA9IHZbMV0gKyBveSAtIChvdXRbMV0gKiBveCArIG91dFs1XSAqIG95ICsgb3V0WzldICogb3opO1xuICBvdXRbMTRdID0gdlsyXSArIG96IC0gKG91dFsyXSAqIG94ICsgb3V0WzZdICogb3kgKyBvdXRbMTBdICogb3opO1xuICBvdXRbMTVdID0gMTtcbiAgICAgICAgXG4gIHJldHVybiBvdXQ7XG59O1xuXG5tYXQ0LmZyb21RdWF0ID0gZnVuY3Rpb24gKG91dCwgcSkge1xuICAgIHZhciB4ID0gcVswXSwgeSA9IHFbMV0sIHogPSBxWzJdLCB3ID0gcVszXSxcbiAgICAgICAgeDIgPSB4ICsgeCxcbiAgICAgICAgeTIgPSB5ICsgeSxcbiAgICAgICAgejIgPSB6ICsgeixcblxuICAgICAgICB4eCA9IHggKiB4MixcbiAgICAgICAgeXggPSB5ICogeDIsXG4gICAgICAgIHl5ID0geSAqIHkyLFxuICAgICAgICB6eCA9IHogKiB4MixcbiAgICAgICAgenkgPSB6ICogeTIsXG4gICAgICAgIHp6ID0geiAqIHoyLFxuICAgICAgICB3eCA9IHcgKiB4MixcbiAgICAgICAgd3kgPSB3ICogeTIsXG4gICAgICAgIHd6ID0gdyAqIHoyO1xuXG4gICAgb3V0WzBdID0gMSAtIHl5IC0geno7XG4gICAgb3V0WzFdID0geXggKyB3ejtcbiAgICBvdXRbMl0gPSB6eCAtIHd5O1xuICAgIG91dFszXSA9IDA7XG5cbiAgICBvdXRbNF0gPSB5eCAtIHd6O1xuICAgIG91dFs1XSA9IDEgLSB4eCAtIHp6O1xuICAgIG91dFs2XSA9IHp5ICsgd3g7XG4gICAgb3V0WzddID0gMDtcblxuICAgIG91dFs4XSA9IHp4ICsgd3k7XG4gICAgb3V0WzldID0genkgLSB3eDtcbiAgICBvdXRbMTBdID0gMSAtIHh4IC0geXk7XG4gICAgb3V0WzExXSA9IDA7XG5cbiAgICBvdXRbMTJdID0gMDtcbiAgICBvdXRbMTNdID0gMDtcbiAgICBvdXRbMTRdID0gMDtcbiAgICBvdXRbMTVdID0gMTtcblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlcyBhIGZydXN0dW0gbWF0cml4IHdpdGggdGhlIGdpdmVuIGJvdW5kc1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgZnJ1c3R1bSBtYXRyaXggd2lsbCBiZSB3cml0dGVuIGludG9cbiAqIEBwYXJhbSB7TnVtYmVyfSBsZWZ0IExlZnQgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7TnVtYmVyfSByaWdodCBSaWdodCBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtOdW1iZXJ9IGJvdHRvbSBCb3R0b20gYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7TnVtYmVyfSB0b3AgVG9wIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge051bWJlcn0gbmVhciBOZWFyIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge051bWJlcn0gZmFyIEZhciBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmZydXN0dW0gPSBmdW5jdGlvbiAob3V0LCBsZWZ0LCByaWdodCwgYm90dG9tLCB0b3AsIG5lYXIsIGZhcikge1xuICAgIHZhciBybCA9IDEgLyAocmlnaHQgLSBsZWZ0KSxcbiAgICAgICAgdGIgPSAxIC8gKHRvcCAtIGJvdHRvbSksXG4gICAgICAgIG5mID0gMSAvIChuZWFyIC0gZmFyKTtcbiAgICBvdXRbMF0gPSAobmVhciAqIDIpICogcmw7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSAobmVhciAqIDIpICogdGI7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IChyaWdodCArIGxlZnQpICogcmw7XG4gICAgb3V0WzldID0gKHRvcCArIGJvdHRvbSkgKiB0YjtcbiAgICBvdXRbMTBdID0gKGZhciArIG5lYXIpICogbmY7XG4gICAgb3V0WzExXSA9IC0xO1xuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAoZmFyICogbmVhciAqIDIpICogbmY7XG4gICAgb3V0WzE1XSA9IDA7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgcGVyc3BlY3RpdmUgcHJvamVjdGlvbiBtYXRyaXggd2l0aCB0aGUgZ2l2ZW4gYm91bmRzXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCBmcnVzdHVtIG1hdHJpeCB3aWxsIGJlIHdyaXR0ZW4gaW50b1xuICogQHBhcmFtIHtudW1iZXJ9IGZvdnkgVmVydGljYWwgZmllbGQgb2YgdmlldyBpbiByYWRpYW5zXG4gKiBAcGFyYW0ge251bWJlcn0gYXNwZWN0IEFzcGVjdCByYXRpby4gdHlwaWNhbGx5IHZpZXdwb3J0IHdpZHRoL2hlaWdodFxuICogQHBhcmFtIHtudW1iZXJ9IG5lYXIgTmVhciBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtudW1iZXJ9IGZhciBGYXIgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5wZXJzcGVjdGl2ZSA9IGZ1bmN0aW9uIChvdXQsIGZvdnksIGFzcGVjdCwgbmVhciwgZmFyKSB7XG4gICAgdmFyIGYgPSAxLjAgLyBNYXRoLnRhbihmb3Z5IC8gMiksXG4gICAgICAgIG5mID0gMSAvIChuZWFyIC0gZmFyKTtcbiAgICBvdXRbMF0gPSBmIC8gYXNwZWN0O1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gZjtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMDtcbiAgICBvdXRbOV0gPSAwO1xuICAgIG91dFsxMF0gPSAoZmFyICsgbmVhcikgKiBuZjtcbiAgICBvdXRbMTFdID0gLTE7XG4gICAgb3V0WzEyXSA9IDA7XG4gICAgb3V0WzEzXSA9IDA7XG4gICAgb3V0WzE0XSA9ICgyICogZmFyICogbmVhcikgKiBuZjtcbiAgICBvdXRbMTVdID0gMDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSBwZXJzcGVjdGl2ZSBwcm9qZWN0aW9uIG1hdHJpeCB3aXRoIHRoZSBnaXZlbiBmaWVsZCBvZiB2aWV3LlxuICogVGhpcyBpcyBwcmltYXJpbHkgdXNlZnVsIGZvciBnZW5lcmF0aW5nIHByb2plY3Rpb24gbWF0cmljZXMgdG8gYmUgdXNlZFxuICogd2l0aCB0aGUgc3RpbGwgZXhwZXJpZW1lbnRhbCBXZWJWUiBBUEkuXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCBmcnVzdHVtIG1hdHJpeCB3aWxsIGJlIHdyaXR0ZW4gaW50b1xuICogQHBhcmFtIHtudW1iZXJ9IGZvdiBPYmplY3QgY29udGFpbmluZyB0aGUgZm9sbG93aW5nIHZhbHVlczogdXBEZWdyZWVzLCBkb3duRGVncmVlcywgbGVmdERlZ3JlZXMsIHJpZ2h0RGVncmVlc1xuICogQHBhcmFtIHtudW1iZXJ9IG5lYXIgTmVhciBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtudW1iZXJ9IGZhciBGYXIgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5wZXJzcGVjdGl2ZUZyb21GaWVsZE9mVmlldyA9IGZ1bmN0aW9uIChvdXQsIGZvdiwgbmVhciwgZmFyKSB7XG4gICAgdmFyIHVwVGFuID0gTWF0aC50YW4oZm92LnVwRGVncmVlcyAqIE1hdGguUEkvMTgwLjApLFxuICAgICAgICBkb3duVGFuID0gTWF0aC50YW4oZm92LmRvd25EZWdyZWVzICogTWF0aC5QSS8xODAuMCksXG4gICAgICAgIGxlZnRUYW4gPSBNYXRoLnRhbihmb3YubGVmdERlZ3JlZXMgKiBNYXRoLlBJLzE4MC4wKSxcbiAgICAgICAgcmlnaHRUYW4gPSBNYXRoLnRhbihmb3YucmlnaHREZWdyZWVzICogTWF0aC5QSS8xODAuMCksXG4gICAgICAgIHhTY2FsZSA9IDIuMCAvIChsZWZ0VGFuICsgcmlnaHRUYW4pLFxuICAgICAgICB5U2NhbGUgPSAyLjAgLyAodXBUYW4gKyBkb3duVGFuKTtcblxuICAgIG91dFswXSA9IHhTY2FsZTtcbiAgICBvdXRbMV0gPSAwLjA7XG4gICAgb3V0WzJdID0gMC4wO1xuICAgIG91dFszXSA9IDAuMDtcbiAgICBvdXRbNF0gPSAwLjA7XG4gICAgb3V0WzVdID0geVNjYWxlO1xuICAgIG91dFs2XSA9IDAuMDtcbiAgICBvdXRbN10gPSAwLjA7XG4gICAgb3V0WzhdID0gLSgobGVmdFRhbiAtIHJpZ2h0VGFuKSAqIHhTY2FsZSAqIDAuNSk7XG4gICAgb3V0WzldID0gKCh1cFRhbiAtIGRvd25UYW4pICogeVNjYWxlICogMC41KTtcbiAgICBvdXRbMTBdID0gZmFyIC8gKG5lYXIgLSBmYXIpO1xuICAgIG91dFsxMV0gPSAtMS4wO1xuICAgIG91dFsxMl0gPSAwLjA7XG4gICAgb3V0WzEzXSA9IDAuMDtcbiAgICBvdXRbMTRdID0gKGZhciAqIG5lYXIpIC8gKG5lYXIgLSBmYXIpO1xuICAgIG91dFsxNV0gPSAwLjA7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSBvcnRob2dvbmFsIHByb2plY3Rpb24gbWF0cml4IHdpdGggdGhlIGdpdmVuIGJvdW5kc1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgZnJ1c3R1bSBtYXRyaXggd2lsbCBiZSB3cml0dGVuIGludG9cbiAqIEBwYXJhbSB7bnVtYmVyfSBsZWZ0IExlZnQgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7bnVtYmVyfSByaWdodCBSaWdodCBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtudW1iZXJ9IGJvdHRvbSBCb3R0b20gYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7bnVtYmVyfSB0b3AgVG9wIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge251bWJlcn0gbmVhciBOZWFyIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge251bWJlcn0gZmFyIEZhciBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0Lm9ydGhvID0gZnVuY3Rpb24gKG91dCwgbGVmdCwgcmlnaHQsIGJvdHRvbSwgdG9wLCBuZWFyLCBmYXIpIHtcbiAgICB2YXIgbHIgPSAxIC8gKGxlZnQgLSByaWdodCksXG4gICAgICAgIGJ0ID0gMSAvIChib3R0b20gLSB0b3ApLFxuICAgICAgICBuZiA9IDEgLyAobmVhciAtIGZhcik7XG4gICAgb3V0WzBdID0gLTIgKiBscjtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IC0yICogYnQ7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDA7XG4gICAgb3V0WzldID0gMDtcbiAgICBvdXRbMTBdID0gMiAqIG5mO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSAobGVmdCArIHJpZ2h0KSAqIGxyO1xuICAgIG91dFsxM10gPSAodG9wICsgYm90dG9tKSAqIGJ0O1xuICAgIG91dFsxNF0gPSAoZmFyICsgbmVhcikgKiBuZjtcbiAgICBvdXRbMTVdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSBsb29rLWF0IG1hdHJpeCB3aXRoIHRoZSBnaXZlbiBleWUgcG9zaXRpb24sIGZvY2FsIHBvaW50LCBhbmQgdXAgYXhpc1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgZnJ1c3R1bSBtYXRyaXggd2lsbCBiZSB3cml0dGVuIGludG9cbiAqIEBwYXJhbSB7dmVjM30gZXllIFBvc2l0aW9uIG9mIHRoZSB2aWV3ZXJcbiAqIEBwYXJhbSB7dmVjM30gY2VudGVyIFBvaW50IHRoZSB2aWV3ZXIgaXMgbG9va2luZyBhdFxuICogQHBhcmFtIHt2ZWMzfSB1cCB2ZWMzIHBvaW50aW5nIHVwXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQubG9va0F0ID0gZnVuY3Rpb24gKG91dCwgZXllLCBjZW50ZXIsIHVwKSB7XG4gICAgdmFyIHgwLCB4MSwgeDIsIHkwLCB5MSwgeTIsIHowLCB6MSwgejIsIGxlbixcbiAgICAgICAgZXlleCA9IGV5ZVswXSxcbiAgICAgICAgZXlleSA9IGV5ZVsxXSxcbiAgICAgICAgZXlleiA9IGV5ZVsyXSxcbiAgICAgICAgdXB4ID0gdXBbMF0sXG4gICAgICAgIHVweSA9IHVwWzFdLFxuICAgICAgICB1cHogPSB1cFsyXSxcbiAgICAgICAgY2VudGVyeCA9IGNlbnRlclswXSxcbiAgICAgICAgY2VudGVyeSA9IGNlbnRlclsxXSxcbiAgICAgICAgY2VudGVyeiA9IGNlbnRlclsyXTtcblxuICAgIGlmIChNYXRoLmFicyhleWV4IC0gY2VudGVyeCkgPCBnbE1hdHJpeC5FUFNJTE9OICYmXG4gICAgICAgIE1hdGguYWJzKGV5ZXkgLSBjZW50ZXJ5KSA8IGdsTWF0cml4LkVQU0lMT04gJiZcbiAgICAgICAgTWF0aC5hYnMoZXlleiAtIGNlbnRlcnopIDwgZ2xNYXRyaXguRVBTSUxPTikge1xuICAgICAgICByZXR1cm4gbWF0NC5pZGVudGl0eShvdXQpO1xuICAgIH1cblxuICAgIHowID0gZXlleCAtIGNlbnRlcng7XG4gICAgejEgPSBleWV5IC0gY2VudGVyeTtcbiAgICB6MiA9IGV5ZXogLSBjZW50ZXJ6O1xuXG4gICAgbGVuID0gMSAvIE1hdGguc3FydCh6MCAqIHowICsgejEgKiB6MSArIHoyICogejIpO1xuICAgIHowICo9IGxlbjtcbiAgICB6MSAqPSBsZW47XG4gICAgejIgKj0gbGVuO1xuXG4gICAgeDAgPSB1cHkgKiB6MiAtIHVweiAqIHoxO1xuICAgIHgxID0gdXB6ICogejAgLSB1cHggKiB6MjtcbiAgICB4MiA9IHVweCAqIHoxIC0gdXB5ICogejA7XG4gICAgbGVuID0gTWF0aC5zcXJ0KHgwICogeDAgKyB4MSAqIHgxICsgeDIgKiB4Mik7XG4gICAgaWYgKCFsZW4pIHtcbiAgICAgICAgeDAgPSAwO1xuICAgICAgICB4MSA9IDA7XG4gICAgICAgIHgyID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBsZW4gPSAxIC8gbGVuO1xuICAgICAgICB4MCAqPSBsZW47XG4gICAgICAgIHgxICo9IGxlbjtcbiAgICAgICAgeDIgKj0gbGVuO1xuICAgIH1cblxuICAgIHkwID0gejEgKiB4MiAtIHoyICogeDE7XG4gICAgeTEgPSB6MiAqIHgwIC0gejAgKiB4MjtcbiAgICB5MiA9IHowICogeDEgLSB6MSAqIHgwO1xuXG4gICAgbGVuID0gTWF0aC5zcXJ0KHkwICogeTAgKyB5MSAqIHkxICsgeTIgKiB5Mik7XG4gICAgaWYgKCFsZW4pIHtcbiAgICAgICAgeTAgPSAwO1xuICAgICAgICB5MSA9IDA7XG4gICAgICAgIHkyID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBsZW4gPSAxIC8gbGVuO1xuICAgICAgICB5MCAqPSBsZW47XG4gICAgICAgIHkxICo9IGxlbjtcbiAgICAgICAgeTIgKj0gbGVuO1xuICAgIH1cblxuICAgIG91dFswXSA9IHgwO1xuICAgIG91dFsxXSA9IHkwO1xuICAgIG91dFsyXSA9IHowO1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0geDE7XG4gICAgb3V0WzVdID0geTE7XG4gICAgb3V0WzZdID0gejE7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSB4MjtcbiAgICBvdXRbOV0gPSB5MjtcbiAgICBvdXRbMTBdID0gejI7XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IC0oeDAgKiBleWV4ICsgeDEgKiBleWV5ICsgeDIgKiBleWV6KTtcbiAgICBvdXRbMTNdID0gLSh5MCAqIGV5ZXggKyB5MSAqIGV5ZXkgKyB5MiAqIGV5ZXopO1xuICAgIG91dFsxNF0gPSAtKHowICogZXlleCArIHoxICogZXlleSArIHoyICogZXlleik7XG4gICAgb3V0WzE1XSA9IDE7XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgbWF0NFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gbWF0IG1hdHJpeCB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4XG4gKi9cbm1hdDQuc3RyID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gJ21hdDQoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcsICcgKyBhWzJdICsgJywgJyArIGFbM10gKyAnLCAnICtcbiAgICAgICAgICAgICAgICAgICAgYVs0XSArICcsICcgKyBhWzVdICsgJywgJyArIGFbNl0gKyAnLCAnICsgYVs3XSArICcsICcgK1xuICAgICAgICAgICAgICAgICAgICBhWzhdICsgJywgJyArIGFbOV0gKyAnLCAnICsgYVsxMF0gKyAnLCAnICsgYVsxMV0gKyAnLCAnICsgXG4gICAgICAgICAgICAgICAgICAgIGFbMTJdICsgJywgJyArIGFbMTNdICsgJywgJyArIGFbMTRdICsgJywgJyArIGFbMTVdICsgJyknO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIEZyb2Jlbml1cyBub3JtIG9mIGEgbWF0NFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgbWF0cml4IHRvIGNhbGN1bGF0ZSBGcm9iZW5pdXMgbm9ybSBvZlxuICogQHJldHVybnMge051bWJlcn0gRnJvYmVuaXVzIG5vcm1cbiAqL1xubWF0NC5mcm9iID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4oTWF0aC5zcXJ0KE1hdGgucG93KGFbMF0sIDIpICsgTWF0aC5wb3coYVsxXSwgMikgKyBNYXRoLnBvdyhhWzJdLCAyKSArIE1hdGgucG93KGFbM10sIDIpICsgTWF0aC5wb3coYVs0XSwgMikgKyBNYXRoLnBvdyhhWzVdLCAyKSArIE1hdGgucG93KGFbNl0sIDIpICsgTWF0aC5wb3coYVs3XSwgMikgKyBNYXRoLnBvdyhhWzhdLCAyKSArIE1hdGgucG93KGFbOV0sIDIpICsgTWF0aC5wb3coYVsxMF0sIDIpICsgTWF0aC5wb3coYVsxMV0sIDIpICsgTWF0aC5wb3coYVsxMl0sIDIpICsgTWF0aC5wb3coYVsxM10sIDIpICsgTWF0aC5wb3coYVsxNF0sIDIpICsgTWF0aC5wb3coYVsxNV0sIDIpICkpXG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gbWF0NDtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L21hdDQuanNcbiAqKiBtb2R1bGUgaWQgPSA5XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiBDb3B5cmlnaHQgKGMpIDIwMTUsIEJyYW5kb24gSm9uZXMsIENvbGluIE1hY0tlbnppZSBJVi5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLiAqL1xuXG52YXIgZ2xNYXRyaXggPSByZXF1aXJlKFwiLi9jb21tb24uanNcIik7XG52YXIgbWF0MyA9IHJlcXVpcmUoXCIuL21hdDMuanNcIik7XG52YXIgdmVjMyA9IHJlcXVpcmUoXCIuL3ZlYzMuanNcIik7XG52YXIgdmVjNCA9IHJlcXVpcmUoXCIuL3ZlYzQuanNcIik7XG5cbi8qKlxuICogQGNsYXNzIFF1YXRlcm5pb25cbiAqIEBuYW1lIHF1YXRcbiAqL1xudmFyIHF1YXQgPSB7fTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGlkZW50aXR5IHF1YXRcbiAqXG4gKiBAcmV0dXJucyB7cXVhdH0gYSBuZXcgcXVhdGVybmlvblxuICovXG5xdWF0LmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSg0KTtcbiAgICBvdXRbMF0gPSAwO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNldHMgYSBxdWF0ZXJuaW9uIHRvIHJlcHJlc2VudCB0aGUgc2hvcnRlc3Qgcm90YXRpb24gZnJvbSBvbmVcbiAqIHZlY3RvciB0byBhbm90aGVyLlxuICpcbiAqIEJvdGggdmVjdG9ycyBhcmUgYXNzdW1lZCB0byBiZSB1bml0IGxlbmd0aC5cbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb24uXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGluaXRpYWwgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIGRlc3RpbmF0aW9uIHZlY3RvclxuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0LnJvdGF0aW9uVG8gPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRtcHZlYzMgPSB2ZWMzLmNyZWF0ZSgpO1xuICAgIHZhciB4VW5pdFZlYzMgPSB2ZWMzLmZyb21WYWx1ZXMoMSwwLDApO1xuICAgIHZhciB5VW5pdFZlYzMgPSB2ZWMzLmZyb21WYWx1ZXMoMCwxLDApO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgICAgICB2YXIgZG90ID0gdmVjMy5kb3QoYSwgYik7XG4gICAgICAgIGlmIChkb3QgPCAtMC45OTk5OTkpIHtcbiAgICAgICAgICAgIHZlYzMuY3Jvc3ModG1wdmVjMywgeFVuaXRWZWMzLCBhKTtcbiAgICAgICAgICAgIGlmICh2ZWMzLmxlbmd0aCh0bXB2ZWMzKSA8IDAuMDAwMDAxKVxuICAgICAgICAgICAgICAgIHZlYzMuY3Jvc3ModG1wdmVjMywgeVVuaXRWZWMzLCBhKTtcbiAgICAgICAgICAgIHZlYzMubm9ybWFsaXplKHRtcHZlYzMsIHRtcHZlYzMpO1xuICAgICAgICAgICAgcXVhdC5zZXRBeGlzQW5nbGUob3V0LCB0bXB2ZWMzLCBNYXRoLlBJKTtcbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoZG90ID4gMC45OTk5OTkpIHtcbiAgICAgICAgICAgIG91dFswXSA9IDA7XG4gICAgICAgICAgICBvdXRbMV0gPSAwO1xuICAgICAgICAgICAgb3V0WzJdID0gMDtcbiAgICAgICAgICAgIG91dFszXSA9IDE7XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmVjMy5jcm9zcyh0bXB2ZWMzLCBhLCBiKTtcbiAgICAgICAgICAgIG91dFswXSA9IHRtcHZlYzNbMF07XG4gICAgICAgICAgICBvdXRbMV0gPSB0bXB2ZWMzWzFdO1xuICAgICAgICAgICAgb3V0WzJdID0gdG1wdmVjM1syXTtcbiAgICAgICAgICAgIG91dFszXSA9IDEgKyBkb3Q7XG4gICAgICAgICAgICByZXR1cm4gcXVhdC5ub3JtYWxpemUob3V0LCBvdXQpO1xuICAgICAgICB9XG4gICAgfTtcbn0pKCk7XG5cbi8qKlxuICogU2V0cyB0aGUgc3BlY2lmaWVkIHF1YXRlcm5pb24gd2l0aCB2YWx1ZXMgY29ycmVzcG9uZGluZyB0byB0aGUgZ2l2ZW5cbiAqIGF4ZXMuIEVhY2ggYXhpcyBpcyBhIHZlYzMgYW5kIGlzIGV4cGVjdGVkIHRvIGJlIHVuaXQgbGVuZ3RoIGFuZFxuICogcGVycGVuZGljdWxhciB0byBhbGwgb3RoZXIgc3BlY2lmaWVkIGF4ZXMuXG4gKlxuICogQHBhcmFtIHt2ZWMzfSB2aWV3ICB0aGUgdmVjdG9yIHJlcHJlc2VudGluZyB0aGUgdmlld2luZyBkaXJlY3Rpb25cbiAqIEBwYXJhbSB7dmVjM30gcmlnaHQgdGhlIHZlY3RvciByZXByZXNlbnRpbmcgdGhlIGxvY2FsIFwicmlnaHRcIiBkaXJlY3Rpb25cbiAqIEBwYXJhbSB7dmVjM30gdXAgICAgdGhlIHZlY3RvciByZXByZXNlbnRpbmcgdGhlIGxvY2FsIFwidXBcIiBkaXJlY3Rpb25cbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5zZXRBeGVzID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBtYXRyID0gbWF0My5jcmVhdGUoKTtcblxuICAgIHJldHVybiBmdW5jdGlvbihvdXQsIHZpZXcsIHJpZ2h0LCB1cCkge1xuICAgICAgICBtYXRyWzBdID0gcmlnaHRbMF07XG4gICAgICAgIG1hdHJbM10gPSByaWdodFsxXTtcbiAgICAgICAgbWF0cls2XSA9IHJpZ2h0WzJdO1xuXG4gICAgICAgIG1hdHJbMV0gPSB1cFswXTtcbiAgICAgICAgbWF0cls0XSA9IHVwWzFdO1xuICAgICAgICBtYXRyWzddID0gdXBbMl07XG5cbiAgICAgICAgbWF0clsyXSA9IC12aWV3WzBdO1xuICAgICAgICBtYXRyWzVdID0gLXZpZXdbMV07XG4gICAgICAgIG1hdHJbOF0gPSAtdmlld1syXTtcblxuICAgICAgICByZXR1cm4gcXVhdC5ub3JtYWxpemUob3V0LCBxdWF0LmZyb21NYXQzKG91dCwgbWF0cikpO1xuICAgIH07XG59KSgpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgcXVhdCBpbml0aWFsaXplZCB3aXRoIHZhbHVlcyBmcm9tIGFuIGV4aXN0aW5nIHF1YXRlcm5pb25cbiAqXG4gKiBAcGFyYW0ge3F1YXR9IGEgcXVhdGVybmlvbiB0byBjbG9uZVxuICogQHJldHVybnMge3F1YXR9IGEgbmV3IHF1YXRlcm5pb25cbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LmNsb25lID0gdmVjNC5jbG9uZTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHF1YXQgaW5pdGlhbGl6ZWQgd2l0aCB0aGUgZ2l2ZW4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggWCBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFkgY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geiBaIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHcgVyBjb21wb25lbnRcbiAqIEByZXR1cm5zIHtxdWF0fSBhIG5ldyBxdWF0ZXJuaW9uXG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5mcm9tVmFsdWVzID0gdmVjNC5mcm9tVmFsdWVzO1xuXG4vKipcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSBxdWF0IHRvIGFub3RoZXJcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgc291cmNlIHF1YXRlcm5pb25cbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LmNvcHkgPSB2ZWM0LmNvcHk7XG5cbi8qKlxuICogU2V0IHRoZSBjb21wb25lbnRzIG9mIGEgcXVhdCB0byB0aGUgZ2l2ZW4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgWSBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFogY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0gdyBXIGNvbXBvbmVudFxuICogQHJldHVybnMge3F1YXR9IG91dFxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQuc2V0ID0gdmVjNC5zZXQ7XG5cbi8qKlxuICogU2V0IGEgcXVhdCB0byB0aGUgaWRlbnRpdHkgcXVhdGVybmlvblxuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0LmlkZW50aXR5ID0gZnVuY3Rpb24ob3V0KSB7XG4gICAgb3V0WzBdID0gMDtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTZXRzIGEgcXVhdCBmcm9tIHRoZSBnaXZlbiBhbmdsZSBhbmQgcm90YXRpb24gYXhpcyxcbiAqIHRoZW4gcmV0dXJucyBpdC5cbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7dmVjM30gYXhpcyB0aGUgYXhpcyBhcm91bmQgd2hpY2ggdG8gcm90YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSBpbiByYWRpYW5zXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKiovXG5xdWF0LnNldEF4aXNBbmdsZSA9IGZ1bmN0aW9uKG91dCwgYXhpcywgcmFkKSB7XG4gICAgcmFkID0gcmFkICogMC41O1xuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKTtcbiAgICBvdXRbMF0gPSBzICogYXhpc1swXTtcbiAgICBvdXRbMV0gPSBzICogYXhpc1sxXTtcbiAgICBvdXRbMl0gPSBzICogYXhpc1syXTtcbiAgICBvdXRbM10gPSBNYXRoLmNvcyhyYWQpO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFkZHMgdHdvIHF1YXQnc1xuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHtxdWF0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3F1YXR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5hZGQgPSB2ZWM0LmFkZDtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byBxdWF0J3NcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHtxdWF0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0Lm11bHRpcGx5ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgdmFyIGF4ID0gYVswXSwgYXkgPSBhWzFdLCBheiA9IGFbMl0sIGF3ID0gYVszXSxcbiAgICAgICAgYnggPSBiWzBdLCBieSA9IGJbMV0sIGJ6ID0gYlsyXSwgYncgPSBiWzNdO1xuXG4gICAgb3V0WzBdID0gYXggKiBidyArIGF3ICogYnggKyBheSAqIGJ6IC0gYXogKiBieTtcbiAgICBvdXRbMV0gPSBheSAqIGJ3ICsgYXcgKiBieSArIGF6ICogYnggLSBheCAqIGJ6O1xuICAgIG91dFsyXSA9IGF6ICogYncgKyBhdyAqIGJ6ICsgYXggKiBieSAtIGF5ICogYng7XG4gICAgb3V0WzNdID0gYXcgKiBidyAtIGF4ICogYnggLSBheSAqIGJ5IC0gYXogKiBiejtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHF1YXQubXVsdGlwbHl9XG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5tdWwgPSBxdWF0Lm11bHRpcGx5O1xuXG4vKipcbiAqIFNjYWxlcyBhIHF1YXQgYnkgYSBzY2FsYXIgbnVtYmVyXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgdmVjdG9yIHRvIHNjYWxlXG4gKiBAcGFyYW0ge051bWJlcn0gYiBhbW91bnQgdG8gc2NhbGUgdGhlIHZlY3RvciBieVxuICogQHJldHVybnMge3F1YXR9IG91dFxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQuc2NhbGUgPSB2ZWM0LnNjYWxlO1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBxdWF0ZXJuaW9uIGJ5IHRoZSBnaXZlbiBhbmdsZSBhYm91dCB0aGUgWCBheGlzXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgcXVhdCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXQgdG8gcm90YXRlXG4gKiBAcGFyYW0ge251bWJlcn0gcmFkIGFuZ2xlIChpbiByYWRpYW5zKSB0byByb3RhdGVcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5yb3RhdGVYID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkKSB7XG4gICAgcmFkICo9IDAuNTsgXG5cbiAgICB2YXIgYXggPSBhWzBdLCBheSA9IGFbMV0sIGF6ID0gYVsyXSwgYXcgPSBhWzNdLFxuICAgICAgICBieCA9IE1hdGguc2luKHJhZCksIGJ3ID0gTWF0aC5jb3MocmFkKTtcblxuICAgIG91dFswXSA9IGF4ICogYncgKyBhdyAqIGJ4O1xuICAgIG91dFsxXSA9IGF5ICogYncgKyBheiAqIGJ4O1xuICAgIG91dFsyXSA9IGF6ICogYncgLSBheSAqIGJ4O1xuICAgIG91dFszXSA9IGF3ICogYncgLSBheCAqIGJ4O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBxdWF0ZXJuaW9uIGJ5IHRoZSBnaXZlbiBhbmdsZSBhYm91dCB0aGUgWSBheGlzXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgcXVhdCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXQgdG8gcm90YXRlXG4gKiBAcGFyYW0ge251bWJlcn0gcmFkIGFuZ2xlIChpbiByYWRpYW5zKSB0byByb3RhdGVcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5yb3RhdGVZID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkKSB7XG4gICAgcmFkICo9IDAuNTsgXG5cbiAgICB2YXIgYXggPSBhWzBdLCBheSA9IGFbMV0sIGF6ID0gYVsyXSwgYXcgPSBhWzNdLFxuICAgICAgICBieSA9IE1hdGguc2luKHJhZCksIGJ3ID0gTWF0aC5jb3MocmFkKTtcblxuICAgIG91dFswXSA9IGF4ICogYncgLSBheiAqIGJ5O1xuICAgIG91dFsxXSA9IGF5ICogYncgKyBhdyAqIGJ5O1xuICAgIG91dFsyXSA9IGF6ICogYncgKyBheCAqIGJ5O1xuICAgIG91dFszXSA9IGF3ICogYncgLSBheSAqIGJ5O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBxdWF0ZXJuaW9uIGJ5IHRoZSBnaXZlbiBhbmdsZSBhYm91dCB0aGUgWiBheGlzXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgcXVhdCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXQgdG8gcm90YXRlXG4gKiBAcGFyYW0ge251bWJlcn0gcmFkIGFuZ2xlIChpbiByYWRpYW5zKSB0byByb3RhdGVcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5yb3RhdGVaID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkKSB7XG4gICAgcmFkICo9IDAuNTsgXG5cbiAgICB2YXIgYXggPSBhWzBdLCBheSA9IGFbMV0sIGF6ID0gYVsyXSwgYXcgPSBhWzNdLFxuICAgICAgICBieiA9IE1hdGguc2luKHJhZCksIGJ3ID0gTWF0aC5jb3MocmFkKTtcblxuICAgIG91dFswXSA9IGF4ICogYncgKyBheSAqIGJ6O1xuICAgIG91dFsxXSA9IGF5ICogYncgLSBheCAqIGJ6O1xuICAgIG91dFsyXSA9IGF6ICogYncgKyBhdyAqIGJ6O1xuICAgIG91dFszXSA9IGF3ICogYncgLSBheiAqIGJ6O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIFcgY29tcG9uZW50IG9mIGEgcXVhdCBmcm9tIHRoZSBYLCBZLCBhbmQgWiBjb21wb25lbnRzLlxuICogQXNzdW1lcyB0aGF0IHF1YXRlcm5pb24gaXMgMSB1bml0IGluIGxlbmd0aC5cbiAqIEFueSBleGlzdGluZyBXIGNvbXBvbmVudCB3aWxsIGJlIGlnbm9yZWQuXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3F1YXR9IGEgcXVhdCB0byBjYWxjdWxhdGUgVyBjb21wb25lbnQgb2ZcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5jYWxjdWxhdGVXID0gZnVuY3Rpb24gKG91dCwgYSkge1xuICAgIHZhciB4ID0gYVswXSwgeSA9IGFbMV0sIHogPSBhWzJdO1xuXG4gICAgb3V0WzBdID0geDtcbiAgICBvdXRbMV0gPSB5O1xuICAgIG91dFsyXSA9IHo7XG4gICAgb3V0WzNdID0gTWF0aC5zcXJ0KE1hdGguYWJzKDEuMCAtIHggKiB4IC0geSAqIHkgLSB6ICogeikpO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGRvdCBwcm9kdWN0IG9mIHR3byBxdWF0J3NcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7cXVhdH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRvdCBwcm9kdWN0IG9mIGEgYW5kIGJcbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LmRvdCA9IHZlYzQuZG90O1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgbGluZWFyIGludGVycG9sYXRpb24gYmV0d2VlbiB0d28gcXVhdCdzXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3F1YXR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7cXVhdH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSB0IGludGVycG9sYXRpb24gYW1vdW50IGJldHdlZW4gdGhlIHR3byBpbnB1dHNcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LmxlcnAgPSB2ZWM0LmxlcnA7XG5cbi8qKlxuICogUGVyZm9ybXMgYSBzcGhlcmljYWwgbGluZWFyIGludGVycG9sYXRpb24gYmV0d2VlbiB0d28gcXVhdFxuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHtxdWF0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3F1YXR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudCBiZXR3ZWVuIHRoZSB0d28gaW5wdXRzXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKi9cbnF1YXQuc2xlcnAgPSBmdW5jdGlvbiAob3V0LCBhLCBiLCB0KSB7XG4gICAgLy8gYmVuY2htYXJrczpcbiAgICAvLyAgICBodHRwOi8vanNwZXJmLmNvbS9xdWF0ZXJuaW9uLXNsZXJwLWltcGxlbWVudGF0aW9uc1xuXG4gICAgdmFyIGF4ID0gYVswXSwgYXkgPSBhWzFdLCBheiA9IGFbMl0sIGF3ID0gYVszXSxcbiAgICAgICAgYnggPSBiWzBdLCBieSA9IGJbMV0sIGJ6ID0gYlsyXSwgYncgPSBiWzNdO1xuXG4gICAgdmFyICAgICAgICBvbWVnYSwgY29zb20sIHNpbm9tLCBzY2FsZTAsIHNjYWxlMTtcblxuICAgIC8vIGNhbGMgY29zaW5lXG4gICAgY29zb20gPSBheCAqIGJ4ICsgYXkgKiBieSArIGF6ICogYnogKyBhdyAqIGJ3O1xuICAgIC8vIGFkanVzdCBzaWducyAoaWYgbmVjZXNzYXJ5KVxuICAgIGlmICggY29zb20gPCAwLjAgKSB7XG4gICAgICAgIGNvc29tID0gLWNvc29tO1xuICAgICAgICBieCA9IC0gYng7XG4gICAgICAgIGJ5ID0gLSBieTtcbiAgICAgICAgYnogPSAtIGJ6O1xuICAgICAgICBidyA9IC0gYnc7XG4gICAgfVxuICAgIC8vIGNhbGN1bGF0ZSBjb2VmZmljaWVudHNcbiAgICBpZiAoICgxLjAgLSBjb3NvbSkgPiAwLjAwMDAwMSApIHtcbiAgICAgICAgLy8gc3RhbmRhcmQgY2FzZSAoc2xlcnApXG4gICAgICAgIG9tZWdhICA9IE1hdGguYWNvcyhjb3NvbSk7XG4gICAgICAgIHNpbm9tICA9IE1hdGguc2luKG9tZWdhKTtcbiAgICAgICAgc2NhbGUwID0gTWF0aC5zaW4oKDEuMCAtIHQpICogb21lZ2EpIC8gc2lub207XG4gICAgICAgIHNjYWxlMSA9IE1hdGguc2luKHQgKiBvbWVnYSkgLyBzaW5vbTtcbiAgICB9IGVsc2UgeyAgICAgICAgXG4gICAgICAgIC8vIFwiZnJvbVwiIGFuZCBcInRvXCIgcXVhdGVybmlvbnMgYXJlIHZlcnkgY2xvc2UgXG4gICAgICAgIC8vICAuLi4gc28gd2UgY2FuIGRvIGEgbGluZWFyIGludGVycG9sYXRpb25cbiAgICAgICAgc2NhbGUwID0gMS4wIC0gdDtcbiAgICAgICAgc2NhbGUxID0gdDtcbiAgICB9XG4gICAgLy8gY2FsY3VsYXRlIGZpbmFsIHZhbHVlc1xuICAgIG91dFswXSA9IHNjYWxlMCAqIGF4ICsgc2NhbGUxICogYng7XG4gICAgb3V0WzFdID0gc2NhbGUwICogYXkgKyBzY2FsZTEgKiBieTtcbiAgICBvdXRbMl0gPSBzY2FsZTAgKiBheiArIHNjYWxlMSAqIGJ6O1xuICAgIG91dFszXSA9IHNjYWxlMCAqIGF3ICsgc2NhbGUxICogYnc7XG4gICAgXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgYSBzcGhlcmljYWwgbGluZWFyIGludGVycG9sYXRpb24gd2l0aCB0d28gY29udHJvbCBwb2ludHNcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHtxdWF0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHtxdWF0fSBjIHRoZSB0aGlyZCBvcGVyYW5kXG4gKiBAcGFyYW0ge3F1YXR9IGQgdGhlIGZvdXJ0aCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudFxuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0LnNxbGVycCA9IChmdW5jdGlvbiAoKSB7XG4gIHZhciB0ZW1wMSA9IHF1YXQuY3JlYXRlKCk7XG4gIHZhciB0ZW1wMiA9IHF1YXQuY3JlYXRlKCk7XG4gIFxuICByZXR1cm4gZnVuY3Rpb24gKG91dCwgYSwgYiwgYywgZCwgdCkge1xuICAgIHF1YXQuc2xlcnAodGVtcDEsIGEsIGQsIHQpO1xuICAgIHF1YXQuc2xlcnAodGVtcDIsIGIsIGMsIHQpO1xuICAgIHF1YXQuc2xlcnAob3V0LCB0ZW1wMSwgdGVtcDIsIDIgKiB0ICogKDEgLSB0KSk7XG4gICAgXG4gICAgcmV0dXJuIG91dDtcbiAgfTtcbn0oKSk7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgaW52ZXJzZSBvZiBhIHF1YXRcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSBxdWF0IHRvIGNhbGN1bGF0ZSBpbnZlcnNlIG9mXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKi9cbnF1YXQuaW52ZXJ0ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgdmFyIGEwID0gYVswXSwgYTEgPSBhWzFdLCBhMiA9IGFbMl0sIGEzID0gYVszXSxcbiAgICAgICAgZG90ID0gYTAqYTAgKyBhMSphMSArIGEyKmEyICsgYTMqYTMsXG4gICAgICAgIGludkRvdCA9IGRvdCA/IDEuMC9kb3QgOiAwO1xuICAgIFxuICAgIC8vIFRPRE86IFdvdWxkIGJlIGZhc3RlciB0byByZXR1cm4gWzAsMCwwLDBdIGltbWVkaWF0ZWx5IGlmIGRvdCA9PSAwXG5cbiAgICBvdXRbMF0gPSAtYTAqaW52RG90O1xuICAgIG91dFsxXSA9IC1hMSppbnZEb3Q7XG4gICAgb3V0WzJdID0gLWEyKmludkRvdDtcbiAgICBvdXRbM10gPSBhMyppbnZEb3Q7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgY29uanVnYXRlIG9mIGEgcXVhdFxuICogSWYgdGhlIHF1YXRlcm5pb24gaXMgbm9ybWFsaXplZCwgdGhpcyBmdW5jdGlvbiBpcyBmYXN0ZXIgdGhhbiBxdWF0LmludmVyc2UgYW5kIHByb2R1Y2VzIHRoZSBzYW1lIHJlc3VsdC5cbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSBxdWF0IHRvIGNhbGN1bGF0ZSBjb25qdWdhdGUgb2ZcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5jb25qdWdhdGUgPSBmdW5jdGlvbiAob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gLWFbMF07XG4gICAgb3V0WzFdID0gLWFbMV07XG4gICAgb3V0WzJdID0gLWFbMl07XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBsZW5ndGggb2YgYSBxdWF0XG4gKlxuICogQHBhcmFtIHtxdWF0fSBhIHZlY3RvciB0byBjYWxjdWxhdGUgbGVuZ3RoIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBsZW5ndGggb2YgYVxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQubGVuZ3RoID0gdmVjNC5sZW5ndGg7XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayBxdWF0Lmxlbmd0aH1cbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LmxlbiA9IHF1YXQubGVuZ3RoO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgbGVuZ3RoIG9mIGEgcXVhdFxuICpcbiAqIEBwYXJhbSB7cXVhdH0gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIHNxdWFyZWQgbGVuZ3RoIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBzcXVhcmVkIGxlbmd0aCBvZiBhXG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5zcXVhcmVkTGVuZ3RoID0gdmVjNC5zcXVhcmVkTGVuZ3RoO1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgcXVhdC5zcXVhcmVkTGVuZ3RofVxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQuc3FyTGVuID0gcXVhdC5zcXVhcmVkTGVuZ3RoO1xuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIHF1YXRcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSBxdWF0ZXJuaW9uIHRvIG5vcm1hbGl6ZVxuICogQHJldHVybnMge3F1YXR9IG91dFxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQubm9ybWFsaXplID0gdmVjNC5ub3JtYWxpemU7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHF1YXRlcm5pb24gZnJvbSB0aGUgZ2l2ZW4gM3gzIHJvdGF0aW9uIG1hdHJpeC5cbiAqXG4gKiBOT1RFOiBUaGUgcmVzdWx0YW50IHF1YXRlcm5pb24gaXMgbm90IG5vcm1hbGl6ZWQsIHNvIHlvdSBzaG91bGQgYmUgc3VyZVxuICogdG8gcmVub3JtYWxpemUgdGhlIHF1YXRlcm5pb24geW91cnNlbGYgd2hlcmUgbmVjZXNzYXJ5LlxuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHttYXQzfSBtIHJvdGF0aW9uIG1hdHJpeFxuICogQHJldHVybnMge3F1YXR9IG91dFxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQuZnJvbU1hdDMgPSBmdW5jdGlvbihvdXQsIG0pIHtcbiAgICAvLyBBbGdvcml0aG0gaW4gS2VuIFNob2VtYWtlJ3MgYXJ0aWNsZSBpbiAxOTg3IFNJR0dSQVBIIGNvdXJzZSBub3Rlc1xuICAgIC8vIGFydGljbGUgXCJRdWF0ZXJuaW9uIENhbGN1bHVzIGFuZCBGYXN0IEFuaW1hdGlvblwiLlxuICAgIHZhciBmVHJhY2UgPSBtWzBdICsgbVs0XSArIG1bOF07XG4gICAgdmFyIGZSb290O1xuXG4gICAgaWYgKCBmVHJhY2UgPiAwLjAgKSB7XG4gICAgICAgIC8vIHx3fCA+IDEvMiwgbWF5IGFzIHdlbGwgY2hvb3NlIHcgPiAxLzJcbiAgICAgICAgZlJvb3QgPSBNYXRoLnNxcnQoZlRyYWNlICsgMS4wKTsgIC8vIDJ3XG4gICAgICAgIG91dFszXSA9IDAuNSAqIGZSb290O1xuICAgICAgICBmUm9vdCA9IDAuNS9mUm9vdDsgIC8vIDEvKDR3KVxuICAgICAgICBvdXRbMF0gPSAobVs1XS1tWzddKSpmUm9vdDtcbiAgICAgICAgb3V0WzFdID0gKG1bNl0tbVsyXSkqZlJvb3Q7XG4gICAgICAgIG91dFsyXSA9IChtWzFdLW1bM10pKmZSb290O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHx3fCA8PSAxLzJcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICBpZiAoIG1bNF0gPiBtWzBdIClcbiAgICAgICAgICBpID0gMTtcbiAgICAgICAgaWYgKCBtWzhdID4gbVtpKjMraV0gKVxuICAgICAgICAgIGkgPSAyO1xuICAgICAgICB2YXIgaiA9IChpKzEpJTM7XG4gICAgICAgIHZhciBrID0gKGkrMiklMztcbiAgICAgICAgXG4gICAgICAgIGZSb290ID0gTWF0aC5zcXJ0KG1baSozK2ldLW1baiozK2pdLW1bayozK2tdICsgMS4wKTtcbiAgICAgICAgb3V0W2ldID0gMC41ICogZlJvb3Q7XG4gICAgICAgIGZSb290ID0gMC41IC8gZlJvb3Q7XG4gICAgICAgIG91dFszXSA9IChtW2oqMytrXSAtIG1bayozK2pdKSAqIGZSb290O1xuICAgICAgICBvdXRbal0gPSAobVtqKjMraV0gKyBtW2kqMytqXSkgKiBmUm9vdDtcbiAgICAgICAgb3V0W2tdID0gKG1bayozK2ldICsgbVtpKjMra10pICogZlJvb3Q7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBxdWF0ZW5pb25cbiAqXG4gKiBAcGFyYW0ge3F1YXR9IHZlYyB2ZWN0b3IgdG8gcmVwcmVzZW50IGFzIGEgc3RyaW5nXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHZlY3RvclxuICovXG5xdWF0LnN0ciA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuICdxdWF0KCcgKyBhWzBdICsgJywgJyArIGFbMV0gKyAnLCAnICsgYVsyXSArICcsICcgKyBhWzNdICsgJyknO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBxdWF0O1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvcXVhdC5qc1xuICoqIG1vZHVsZSBpZCA9IDEwXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiBDb3B5cmlnaHQgKGMpIDIwMTUsIEJyYW5kb24gSm9uZXMsIENvbGluIE1hY0tlbnppZSBJVi5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLiAqL1xuXG52YXIgZ2xNYXRyaXggPSByZXF1aXJlKFwiLi9jb21tb24uanNcIik7XG5cbi8qKlxuICogQGNsYXNzIDMgRGltZW5zaW9uYWwgVmVjdG9yXG4gKiBAbmFtZSB2ZWMzXG4gKi9cbnZhciB2ZWMzID0ge307XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldywgZW1wdHkgdmVjM1xuICpcbiAqIEByZXR1cm5zIHt2ZWMzfSBhIG5ldyAzRCB2ZWN0b3JcbiAqL1xudmVjMy5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMyk7XG4gICAgb3V0WzBdID0gMDtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB2ZWMzIGluaXRpYWxpemVkIHdpdGggdmFsdWVzIGZyb20gYW4gZXhpc3RpbmcgdmVjdG9yXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBhIHZlY3RvciB0byBjbG9uZVxuICogQHJldHVybnMge3ZlYzN9IGEgbmV3IDNEIHZlY3RvclxuICovXG52ZWMzLmNsb25lID0gZnVuY3Rpb24oYSkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSgzKTtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHZlYzMgaW5pdGlhbGl6ZWQgd2l0aCB0aGUgZ2l2ZW4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggWCBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFkgY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geiBaIGNvbXBvbmVudFxuICogQHJldHVybnMge3ZlYzN9IGEgbmV3IDNEIHZlY3RvclxuICovXG52ZWMzLmZyb21WYWx1ZXMgPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDMpO1xuICAgIG91dFswXSA9IHg7XG4gICAgb3V0WzFdID0geTtcbiAgICBvdXRbMl0gPSB6O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSB2ZWMzIHRvIGFub3RoZXJcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBzb3VyY2UgdmVjdG9yXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMuY29weSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzMgdG8gdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgWSBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFogY29tcG9uZW50XG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMuc2V0ID0gZnVuY3Rpb24ob3V0LCB4LCB5LCB6KSB7XG4gICAgb3V0WzBdID0geDtcbiAgICBvdXRbMV0gPSB5O1xuICAgIG91dFsyXSA9IHo7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWRkcyB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLmFkZCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKyBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gKyBiWzFdO1xuICAgIG91dFsyXSA9IGFbMl0gKyBiWzJdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0cyB2ZWN0b3IgYiBmcm9tIHZlY3RvciBhXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnN1YnRyYWN0ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAtIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAtIGJbMV07XG4gICAgb3V0WzJdID0gYVsyXSAtIGJbMl07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMzLnN1YnRyYWN0fVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzMuc3ViID0gdmVjMy5zdWJ0cmFjdDtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byB2ZWMzJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMubXVsdGlwbHkgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdICogYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdICogYlsxXTtcbiAgICBvdXRbMl0gPSBhWzJdICogYlsyXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzMubXVsdGlwbHl9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMy5tdWwgPSB2ZWMzLm11bHRpcGx5O1xuXG4vKipcbiAqIERpdmlkZXMgdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5kaXZpZGUgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdIC8gYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdIC8gYlsxXTtcbiAgICBvdXRbMl0gPSBhWzJdIC8gYlsyXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzMuZGl2aWRlfVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzMuZGl2ID0gdmVjMy5kaXZpZGU7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbWluaW11bSBvZiB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLm1pbiA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IE1hdGgubWluKGFbMF0sIGJbMF0pO1xuICAgIG91dFsxXSA9IE1hdGgubWluKGFbMV0sIGJbMV0pO1xuICAgIG91dFsyXSA9IE1hdGgubWluKGFbMl0sIGJbMl0pO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG1heGltdW0gb2YgdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5tYXggPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBNYXRoLm1heChhWzBdLCBiWzBdKTtcbiAgICBvdXRbMV0gPSBNYXRoLm1heChhWzFdLCBiWzFdKTtcbiAgICBvdXRbMl0gPSBNYXRoLm1heChhWzJdLCBiWzJdKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTY2FsZXMgYSB2ZWMzIGJ5IGEgc2NhbGFyIG51bWJlclxuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIHZlY3RvciB0byBzY2FsZVxuICogQHBhcmFtIHtOdW1iZXJ9IGIgYW1vdW50IHRvIHNjYWxlIHRoZSB2ZWN0b3IgYnlcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5zY2FsZSA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKiBiO1xuICAgIG91dFsxXSA9IGFbMV0gKiBiO1xuICAgIG91dFsyXSA9IGFbMl0gKiBiO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFkZHMgdHdvIHZlYzMncyBhZnRlciBzY2FsaW5nIHRoZSBzZWNvbmQgb3BlcmFuZCBieSBhIHNjYWxhciB2YWx1ZVxuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSBzY2FsZSB0aGUgYW1vdW50IHRvIHNjYWxlIGIgYnkgYmVmb3JlIGFkZGluZ1xuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnNjYWxlQW5kQWRkID0gZnVuY3Rpb24ob3V0LCBhLCBiLCBzY2FsZSkge1xuICAgIG91dFswXSA9IGFbMF0gKyAoYlswXSAqIHNjYWxlKTtcbiAgICBvdXRbMV0gPSBhWzFdICsgKGJbMV0gKiBzY2FsZSk7XG4gICAgb3V0WzJdID0gYVsyXSArIChiWzJdICogc2NhbGUpO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGV1Y2xpZGlhbiBkaXN0YW5jZSBiZXR3ZWVuIHR3byB2ZWMzJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRpc3RhbmNlIGJldHdlZW4gYSBhbmQgYlxuICovXG52ZWMzLmRpc3RhbmNlID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciB4ID0gYlswXSAtIGFbMF0sXG4gICAgICAgIHkgPSBiWzFdIC0gYVsxXSxcbiAgICAgICAgeiA9IGJbMl0gLSBhWzJdO1xuICAgIHJldHVybiBNYXRoLnNxcnQoeCp4ICsgeSp5ICsgeip6KTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMzLmRpc3RhbmNlfVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzMuZGlzdCA9IHZlYzMuZGlzdGFuY2U7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgc3F1YXJlZCBldWNsaWRpYW4gZGlzdGFuY2UgYmV0d2VlbiB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBzcXVhcmVkIGRpc3RhbmNlIGJldHdlZW4gYSBhbmQgYlxuICovXG52ZWMzLnNxdWFyZWREaXN0YW5jZSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgeCA9IGJbMF0gLSBhWzBdLFxuICAgICAgICB5ID0gYlsxXSAtIGFbMV0sXG4gICAgICAgIHogPSBiWzJdIC0gYVsyXTtcbiAgICByZXR1cm4geCp4ICsgeSp5ICsgeip6O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzMuc3F1YXJlZERpc3RhbmNlfVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzMuc3FyRGlzdCA9IHZlYzMuc3F1YXJlZERpc3RhbmNlO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGxlbmd0aCBvZiBhIHZlYzNcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdmVjdG9yIHRvIGNhbGN1bGF0ZSBsZW5ndGggb2ZcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGxlbmd0aCBvZiBhXG4gKi9cbnZlYzMubGVuZ3RoID0gZnVuY3Rpb24gKGEpIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdLFxuICAgICAgICB6ID0gYVsyXTtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHgqeCArIHkqeSArIHoqeik7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMy5sZW5ndGh9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMy5sZW4gPSB2ZWMzLmxlbmd0aDtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGxlbmd0aCBvZiBhIHZlYzNcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdmVjdG9yIHRvIGNhbGN1bGF0ZSBzcXVhcmVkIGxlbmd0aCBvZlxuICogQHJldHVybnMge051bWJlcn0gc3F1YXJlZCBsZW5ndGggb2YgYVxuICovXG52ZWMzLnNxdWFyZWRMZW5ndGggPSBmdW5jdGlvbiAoYSkge1xuICAgIHZhciB4ID0gYVswXSxcbiAgICAgICAgeSA9IGFbMV0sXG4gICAgICAgIHogPSBhWzJdO1xuICAgIHJldHVybiB4KnggKyB5KnkgKyB6Kno7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMy5zcXVhcmVkTGVuZ3RofVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzMuc3FyTGVuID0gdmVjMy5zcXVhcmVkTGVuZ3RoO1xuXG4vKipcbiAqIE5lZ2F0ZXMgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWMzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB2ZWN0b3IgdG8gbmVnYXRlXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMubmVnYXRlID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gLWFbMF07XG4gICAgb3V0WzFdID0gLWFbMV07XG4gICAgb3V0WzJdID0gLWFbMl07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW52ZXJzZSBvZiB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzNcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHZlY3RvciB0byBpbnZlcnRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5pbnZlcnNlID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gIG91dFswXSA9IDEuMCAvIGFbMF07XG4gIG91dFsxXSA9IDEuMCAvIGFbMV07XG4gIG91dFsyXSA9IDEuMCAvIGFbMl07XG4gIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIHZlYzNcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHZlY3RvciB0byBub3JtYWxpemVcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5ub3JtYWxpemUgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdLFxuICAgICAgICB6ID0gYVsyXTtcbiAgICB2YXIgbGVuID0geCp4ICsgeSp5ICsgeip6O1xuICAgIGlmIChsZW4gPiAwKSB7XG4gICAgICAgIC8vVE9ETzogZXZhbHVhdGUgdXNlIG9mIGdsbV9pbnZzcXJ0IGhlcmU/XG4gICAgICAgIGxlbiA9IDEgLyBNYXRoLnNxcnQobGVuKTtcbiAgICAgICAgb3V0WzBdID0gYVswXSAqIGxlbjtcbiAgICAgICAgb3V0WzFdID0gYVsxXSAqIGxlbjtcbiAgICAgICAgb3V0WzJdID0gYVsyXSAqIGxlbjtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZG90IHByb2R1Y3Qgb2YgdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gZG90IHByb2R1Y3Qgb2YgYSBhbmQgYlxuICovXG52ZWMzLmRvdCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGFbMF0gKiBiWzBdICsgYVsxXSAqIGJbMV0gKyBhWzJdICogYlsyXTtcbn07XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIGNyb3NzIHByb2R1Y3Qgb2YgdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5jcm9zcyA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIHZhciBheCA9IGFbMF0sIGF5ID0gYVsxXSwgYXogPSBhWzJdLFxuICAgICAgICBieCA9IGJbMF0sIGJ5ID0gYlsxXSwgYnogPSBiWzJdO1xuXG4gICAgb3V0WzBdID0gYXkgKiBieiAtIGF6ICogYnk7XG4gICAgb3V0WzFdID0gYXogKiBieCAtIGF4ICogYno7XG4gICAgb3V0WzJdID0gYXggKiBieSAtIGF5ICogYng7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgYSBsaW5lYXIgaW50ZXJwb2xhdGlvbiBiZXR3ZWVuIHR3byB2ZWMzJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudCBiZXR3ZWVuIHRoZSB0d28gaW5wdXRzXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMubGVycCA9IGZ1bmN0aW9uIChvdXQsIGEsIGIsIHQpIHtcbiAgICB2YXIgYXggPSBhWzBdLFxuICAgICAgICBheSA9IGFbMV0sXG4gICAgICAgIGF6ID0gYVsyXTtcbiAgICBvdXRbMF0gPSBheCArIHQgKiAoYlswXSAtIGF4KTtcbiAgICBvdXRbMV0gPSBheSArIHQgKiAoYlsxXSAtIGF5KTtcbiAgICBvdXRbMl0gPSBheiArIHQgKiAoYlsyXSAtIGF6KTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIGhlcm1pdGUgaW50ZXJwb2xhdGlvbiB3aXRoIHR3byBjb250cm9sIHBvaW50c1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYyB0aGUgdGhpcmQgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBkIHRoZSBmb3VydGggb3BlcmFuZFxuICogQHBhcmFtIHtOdW1iZXJ9IHQgaW50ZXJwb2xhdGlvbiBhbW91bnQgYmV0d2VlbiB0aGUgdHdvIGlucHV0c1xuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLmhlcm1pdGUgPSBmdW5jdGlvbiAob3V0LCBhLCBiLCBjLCBkLCB0KSB7XG4gIHZhciBmYWN0b3JUaW1lczIgPSB0ICogdCxcbiAgICAgIGZhY3RvcjEgPSBmYWN0b3JUaW1lczIgKiAoMiAqIHQgLSAzKSArIDEsXG4gICAgICBmYWN0b3IyID0gZmFjdG9yVGltZXMyICogKHQgLSAyKSArIHQsXG4gICAgICBmYWN0b3IzID0gZmFjdG9yVGltZXMyICogKHQgLSAxKSxcbiAgICAgIGZhY3RvcjQgPSBmYWN0b3JUaW1lczIgKiAoMyAtIDIgKiB0KTtcbiAgXG4gIG91dFswXSA9IGFbMF0gKiBmYWN0b3IxICsgYlswXSAqIGZhY3RvcjIgKyBjWzBdICogZmFjdG9yMyArIGRbMF0gKiBmYWN0b3I0O1xuICBvdXRbMV0gPSBhWzFdICogZmFjdG9yMSArIGJbMV0gKiBmYWN0b3IyICsgY1sxXSAqIGZhY3RvcjMgKyBkWzFdICogZmFjdG9yNDtcbiAgb3V0WzJdID0gYVsyXSAqIGZhY3RvcjEgKyBiWzJdICogZmFjdG9yMiArIGNbMl0gKiBmYWN0b3IzICsgZFsyXSAqIGZhY3RvcjQ7XG4gIFxuICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIGJlemllciBpbnRlcnBvbGF0aW9uIHdpdGggdHdvIGNvbnRyb2wgcG9pbnRzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBjIHRoZSB0aGlyZCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGQgdGhlIGZvdXJ0aCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudCBiZXR3ZWVuIHRoZSB0d28gaW5wdXRzXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMuYmV6aWVyID0gZnVuY3Rpb24gKG91dCwgYSwgYiwgYywgZCwgdCkge1xuICB2YXIgaW52ZXJzZUZhY3RvciA9IDEgLSB0LFxuICAgICAgaW52ZXJzZUZhY3RvclRpbWVzVHdvID0gaW52ZXJzZUZhY3RvciAqIGludmVyc2VGYWN0b3IsXG4gICAgICBmYWN0b3JUaW1lczIgPSB0ICogdCxcbiAgICAgIGZhY3RvcjEgPSBpbnZlcnNlRmFjdG9yVGltZXNUd28gKiBpbnZlcnNlRmFjdG9yLFxuICAgICAgZmFjdG9yMiA9IDMgKiB0ICogaW52ZXJzZUZhY3RvclRpbWVzVHdvLFxuICAgICAgZmFjdG9yMyA9IDMgKiBmYWN0b3JUaW1lczIgKiBpbnZlcnNlRmFjdG9yLFxuICAgICAgZmFjdG9yNCA9IGZhY3RvclRpbWVzMiAqIHQ7XG4gIFxuICBvdXRbMF0gPSBhWzBdICogZmFjdG9yMSArIGJbMF0gKiBmYWN0b3IyICsgY1swXSAqIGZhY3RvcjMgKyBkWzBdICogZmFjdG9yNDtcbiAgb3V0WzFdID0gYVsxXSAqIGZhY3RvcjEgKyBiWzFdICogZmFjdG9yMiArIGNbMV0gKiBmYWN0b3IzICsgZFsxXSAqIGZhY3RvcjQ7XG4gIG91dFsyXSA9IGFbMl0gKiBmYWN0b3IxICsgYlsyXSAqIGZhY3RvcjIgKyBjWzJdICogZmFjdG9yMyArIGRbMl0gKiBmYWN0b3I0O1xuICBcbiAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgcmFuZG9tIHZlY3RvciB3aXRoIHRoZSBnaXZlbiBzY2FsZVxuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge051bWJlcn0gW3NjYWxlXSBMZW5ndGggb2YgdGhlIHJlc3VsdGluZyB2ZWN0b3IuIElmIG9tbWl0dGVkLCBhIHVuaXQgdmVjdG9yIHdpbGwgYmUgcmV0dXJuZWRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5yYW5kb20gPSBmdW5jdGlvbiAob3V0LCBzY2FsZSkge1xuICAgIHNjYWxlID0gc2NhbGUgfHwgMS4wO1xuXG4gICAgdmFyIHIgPSBnbE1hdHJpeC5SQU5ET00oKSAqIDIuMCAqIE1hdGguUEk7XG4gICAgdmFyIHogPSAoZ2xNYXRyaXguUkFORE9NKCkgKiAyLjApIC0gMS4wO1xuICAgIHZhciB6U2NhbGUgPSBNYXRoLnNxcnQoMS4wLXoqeikgKiBzY2FsZTtcblxuICAgIG91dFswXSA9IE1hdGguY29zKHIpICogelNjYWxlO1xuICAgIG91dFsxXSA9IE1hdGguc2luKHIpICogelNjYWxlO1xuICAgIG91dFsyXSA9IHogKiBzY2FsZTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMzIHdpdGggYSBtYXQ0LlxuICogNHRoIHZlY3RvciBjb21wb25lbnQgaXMgaW1wbGljaXRseSAnMSdcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSB2ZWN0b3IgdG8gdHJhbnNmb3JtXG4gKiBAcGFyYW0ge21hdDR9IG0gbWF0cml4IHRvIHRyYW5zZm9ybSB3aXRoXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMudHJhbnNmb3JtTWF0NCA9IGZ1bmN0aW9uKG91dCwgYSwgbSkge1xuICAgIHZhciB4ID0gYVswXSwgeSA9IGFbMV0sIHogPSBhWzJdLFxuICAgICAgICB3ID0gbVszXSAqIHggKyBtWzddICogeSArIG1bMTFdICogeiArIG1bMTVdO1xuICAgIHcgPSB3IHx8IDEuMDtcbiAgICBvdXRbMF0gPSAobVswXSAqIHggKyBtWzRdICogeSArIG1bOF0gKiB6ICsgbVsxMl0pIC8gdztcbiAgICBvdXRbMV0gPSAobVsxXSAqIHggKyBtWzVdICogeSArIG1bOV0gKiB6ICsgbVsxM10pIC8gdztcbiAgICBvdXRbMl0gPSAobVsyXSAqIHggKyBtWzZdICogeSArIG1bMTBdICogeiArIG1bMTRdKSAvIHc7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNmb3JtcyB0aGUgdmVjMyB3aXRoIGEgbWF0My5cbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSB2ZWN0b3IgdG8gdHJhbnNmb3JtXG4gKiBAcGFyYW0ge21hdDR9IG0gdGhlIDN4MyBtYXRyaXggdG8gdHJhbnNmb3JtIHdpdGhcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy50cmFuc2Zvcm1NYXQzID0gZnVuY3Rpb24ob3V0LCBhLCBtKSB7XG4gICAgdmFyIHggPSBhWzBdLCB5ID0gYVsxXSwgeiA9IGFbMl07XG4gICAgb3V0WzBdID0geCAqIG1bMF0gKyB5ICogbVszXSArIHogKiBtWzZdO1xuICAgIG91dFsxXSA9IHggKiBtWzFdICsgeSAqIG1bNF0gKyB6ICogbVs3XTtcbiAgICBvdXRbMl0gPSB4ICogbVsyXSArIHkgKiBtWzVdICsgeiAqIG1bOF07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNmb3JtcyB0aGUgdmVjMyB3aXRoIGEgcXVhdFxuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7cXVhdH0gcSBxdWF0ZXJuaW9uIHRvIHRyYW5zZm9ybSB3aXRoXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMudHJhbnNmb3JtUXVhdCA9IGZ1bmN0aW9uKG91dCwgYSwgcSkge1xuICAgIC8vIGJlbmNobWFya3M6IGh0dHA6Ly9qc3BlcmYuY29tL3F1YXRlcm5pb24tdHJhbnNmb3JtLXZlYzMtaW1wbGVtZW50YXRpb25zXG5cbiAgICB2YXIgeCA9IGFbMF0sIHkgPSBhWzFdLCB6ID0gYVsyXSxcbiAgICAgICAgcXggPSBxWzBdLCBxeSA9IHFbMV0sIHF6ID0gcVsyXSwgcXcgPSBxWzNdLFxuXG4gICAgICAgIC8vIGNhbGN1bGF0ZSBxdWF0ICogdmVjXG4gICAgICAgIGl4ID0gcXcgKiB4ICsgcXkgKiB6IC0gcXogKiB5LFxuICAgICAgICBpeSA9IHF3ICogeSArIHF6ICogeCAtIHF4ICogeixcbiAgICAgICAgaXogPSBxdyAqIHogKyBxeCAqIHkgLSBxeSAqIHgsXG4gICAgICAgIGl3ID0gLXF4ICogeCAtIHF5ICogeSAtIHF6ICogejtcblxuICAgIC8vIGNhbGN1bGF0ZSByZXN1bHQgKiBpbnZlcnNlIHF1YXRcbiAgICBvdXRbMF0gPSBpeCAqIHF3ICsgaXcgKiAtcXggKyBpeSAqIC1xeiAtIGl6ICogLXF5O1xuICAgIG91dFsxXSA9IGl5ICogcXcgKyBpdyAqIC1xeSArIGl6ICogLXF4IC0gaXggKiAtcXo7XG4gICAgb3V0WzJdID0gaXogKiBxdyArIGl3ICogLXF6ICsgaXggKiAtcXkgLSBpeSAqIC1xeDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSb3RhdGUgYSAzRCB2ZWN0b3IgYXJvdW5kIHRoZSB4LWF4aXNcbiAqIEBwYXJhbSB7dmVjM30gb3V0IFRoZSByZWNlaXZpbmcgdmVjM1xuICogQHBhcmFtIHt2ZWMzfSBhIFRoZSB2ZWMzIHBvaW50IHRvIHJvdGF0ZVxuICogQHBhcmFtIHt2ZWMzfSBiIFRoZSBvcmlnaW4gb2YgdGhlIHJvdGF0aW9uXG4gKiBAcGFyYW0ge051bWJlcn0gYyBUaGUgYW5nbGUgb2Ygcm90YXRpb25cbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5yb3RhdGVYID0gZnVuY3Rpb24ob3V0LCBhLCBiLCBjKXtcbiAgIHZhciBwID0gW10sIHI9W107XG5cdCAgLy9UcmFuc2xhdGUgcG9pbnQgdG8gdGhlIG9yaWdpblxuXHQgIHBbMF0gPSBhWzBdIC0gYlswXTtcblx0ICBwWzFdID0gYVsxXSAtIGJbMV07XG4gIFx0cFsyXSA9IGFbMl0gLSBiWzJdO1xuXG5cdCAgLy9wZXJmb3JtIHJvdGF0aW9uXG5cdCAgclswXSA9IHBbMF07XG5cdCAgclsxXSA9IHBbMV0qTWF0aC5jb3MoYykgLSBwWzJdKk1hdGguc2luKGMpO1xuXHQgIHJbMl0gPSBwWzFdKk1hdGguc2luKGMpICsgcFsyXSpNYXRoLmNvcyhjKTtcblxuXHQgIC8vdHJhbnNsYXRlIHRvIGNvcnJlY3QgcG9zaXRpb25cblx0ICBvdXRbMF0gPSByWzBdICsgYlswXTtcblx0ICBvdXRbMV0gPSByWzFdICsgYlsxXTtcblx0ICBvdXRbMl0gPSByWzJdICsgYlsyXTtcblxuICBcdHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZSBhIDNEIHZlY3RvciBhcm91bmQgdGhlIHktYXhpc1xuICogQHBhcmFtIHt2ZWMzfSBvdXQgVGhlIHJlY2VpdmluZyB2ZWMzXG4gKiBAcGFyYW0ge3ZlYzN9IGEgVGhlIHZlYzMgcG9pbnQgdG8gcm90YXRlXG4gKiBAcGFyYW0ge3ZlYzN9IGIgVGhlIG9yaWdpbiBvZiB0aGUgcm90YXRpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSBjIFRoZSBhbmdsZSBvZiByb3RhdGlvblxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnJvdGF0ZVkgPSBmdW5jdGlvbihvdXQsIGEsIGIsIGMpe1xuICBcdHZhciBwID0gW10sIHI9W107XG4gIFx0Ly9UcmFuc2xhdGUgcG9pbnQgdG8gdGhlIG9yaWdpblxuICBcdHBbMF0gPSBhWzBdIC0gYlswXTtcbiAgXHRwWzFdID0gYVsxXSAtIGJbMV07XG4gIFx0cFsyXSA9IGFbMl0gLSBiWzJdO1xuICBcbiAgXHQvL3BlcmZvcm0gcm90YXRpb25cbiAgXHRyWzBdID0gcFsyXSpNYXRoLnNpbihjKSArIHBbMF0qTWF0aC5jb3MoYyk7XG4gIFx0clsxXSA9IHBbMV07XG4gIFx0clsyXSA9IHBbMl0qTWF0aC5jb3MoYykgLSBwWzBdKk1hdGguc2luKGMpO1xuICBcbiAgXHQvL3RyYW5zbGF0ZSB0byBjb3JyZWN0IHBvc2l0aW9uXG4gIFx0b3V0WzBdID0gclswXSArIGJbMF07XG4gIFx0b3V0WzFdID0gclsxXSArIGJbMV07XG4gIFx0b3V0WzJdID0gclsyXSArIGJbMl07XG4gIFxuICBcdHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZSBhIDNEIHZlY3RvciBhcm91bmQgdGhlIHotYXhpc1xuICogQHBhcmFtIHt2ZWMzfSBvdXQgVGhlIHJlY2VpdmluZyB2ZWMzXG4gKiBAcGFyYW0ge3ZlYzN9IGEgVGhlIHZlYzMgcG9pbnQgdG8gcm90YXRlXG4gKiBAcGFyYW0ge3ZlYzN9IGIgVGhlIG9yaWdpbiBvZiB0aGUgcm90YXRpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSBjIFRoZSBhbmdsZSBvZiByb3RhdGlvblxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnJvdGF0ZVogPSBmdW5jdGlvbihvdXQsIGEsIGIsIGMpe1xuICBcdHZhciBwID0gW10sIHI9W107XG4gIFx0Ly9UcmFuc2xhdGUgcG9pbnQgdG8gdGhlIG9yaWdpblxuICBcdHBbMF0gPSBhWzBdIC0gYlswXTtcbiAgXHRwWzFdID0gYVsxXSAtIGJbMV07XG4gIFx0cFsyXSA9IGFbMl0gLSBiWzJdO1xuICBcbiAgXHQvL3BlcmZvcm0gcm90YXRpb25cbiAgXHRyWzBdID0gcFswXSpNYXRoLmNvcyhjKSAtIHBbMV0qTWF0aC5zaW4oYyk7XG4gIFx0clsxXSA9IHBbMF0qTWF0aC5zaW4oYykgKyBwWzFdKk1hdGguY29zKGMpO1xuICBcdHJbMl0gPSBwWzJdO1xuICBcbiAgXHQvL3RyYW5zbGF0ZSB0byBjb3JyZWN0IHBvc2l0aW9uXG4gIFx0b3V0WzBdID0gclswXSArIGJbMF07XG4gIFx0b3V0WzFdID0gclsxXSArIGJbMV07XG4gIFx0b3V0WzJdID0gclsyXSArIGJbMl07XG4gIFxuICBcdHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFBlcmZvcm0gc29tZSBvcGVyYXRpb24gb3ZlciBhbiBhcnJheSBvZiB2ZWMzcy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBhIHRoZSBhcnJheSBvZiB2ZWN0b3JzIHRvIGl0ZXJhdGUgb3ZlclxuICogQHBhcmFtIHtOdW1iZXJ9IHN0cmlkZSBOdW1iZXIgb2YgZWxlbWVudHMgYmV0d2VlbiB0aGUgc3RhcnQgb2YgZWFjaCB2ZWMzLiBJZiAwIGFzc3VtZXMgdGlnaHRseSBwYWNrZWRcbiAqIEBwYXJhbSB7TnVtYmVyfSBvZmZzZXQgTnVtYmVyIG9mIGVsZW1lbnRzIHRvIHNraXAgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgYXJyYXlcbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBOdW1iZXIgb2YgdmVjM3MgdG8gaXRlcmF0ZSBvdmVyLiBJZiAwIGl0ZXJhdGVzIG92ZXIgZW50aXJlIGFycmF5XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBGdW5jdGlvbiB0byBjYWxsIGZvciBlYWNoIHZlY3RvciBpbiB0aGUgYXJyYXlcbiAqIEBwYXJhbSB7T2JqZWN0fSBbYXJnXSBhZGRpdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgdG8gZm5cbiAqIEByZXR1cm5zIHtBcnJheX0gYVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzMuZm9yRWFjaCA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgdmVjID0gdmVjMy5jcmVhdGUoKTtcblxuICAgIHJldHVybiBmdW5jdGlvbihhLCBzdHJpZGUsIG9mZnNldCwgY291bnQsIGZuLCBhcmcpIHtcbiAgICAgICAgdmFyIGksIGw7XG4gICAgICAgIGlmKCFzdHJpZGUpIHtcbiAgICAgICAgICAgIHN0cmlkZSA9IDM7XG4gICAgICAgIH1cblxuICAgICAgICBpZighb2Zmc2V0KSB7XG4gICAgICAgICAgICBvZmZzZXQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZihjb3VudCkge1xuICAgICAgICAgICAgbCA9IE1hdGgubWluKChjb3VudCAqIHN0cmlkZSkgKyBvZmZzZXQsIGEubGVuZ3RoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGwgPSBhLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpID0gb2Zmc2V0OyBpIDwgbDsgaSArPSBzdHJpZGUpIHtcbiAgICAgICAgICAgIHZlY1swXSA9IGFbaV07IHZlY1sxXSA9IGFbaSsxXTsgdmVjWzJdID0gYVtpKzJdO1xuICAgICAgICAgICAgZm4odmVjLCB2ZWMsIGFyZyk7XG4gICAgICAgICAgICBhW2ldID0gdmVjWzBdOyBhW2krMV0gPSB2ZWNbMV07IGFbaSsyXSA9IHZlY1syXTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfTtcbn0pKCk7XG5cbi8qKlxuICogR2V0IHRoZSBhbmdsZSBiZXR3ZWVuIHR3byAzRCB2ZWN0b3JzXG4gKiBAcGFyYW0ge3ZlYzN9IGEgVGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiBUaGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBhbmdsZSBpbiByYWRpYW5zXG4gKi9cbnZlYzMuYW5nbGUgPSBmdW5jdGlvbihhLCBiKSB7XG4gICBcbiAgICB2YXIgdGVtcEEgPSB2ZWMzLmZyb21WYWx1ZXMoYVswXSwgYVsxXSwgYVsyXSk7XG4gICAgdmFyIHRlbXBCID0gdmVjMy5mcm9tVmFsdWVzKGJbMF0sIGJbMV0sIGJbMl0pO1xuIFxuICAgIHZlYzMubm9ybWFsaXplKHRlbXBBLCB0ZW1wQSk7XG4gICAgdmVjMy5ub3JtYWxpemUodGVtcEIsIHRlbXBCKTtcbiBcbiAgICB2YXIgY29zaW5lID0gdmVjMy5kb3QodGVtcEEsIHRlbXBCKTtcblxuICAgIGlmKGNvc2luZSA+IDEuMCl7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBNYXRoLmFjb3MoY29zaW5lKTtcbiAgICB9ICAgICBcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIHZlY3RvclxuICpcbiAqIEBwYXJhbSB7dmVjM30gdmVjIHZlY3RvciB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdmVjdG9yXG4gKi9cbnZlYzMuc3RyID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gJ3ZlYzMoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcsICcgKyBhWzJdICsgJyknO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB2ZWMzO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvdmVjMy5qc1xuICoqIG1vZHVsZSBpZCA9IDExXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiBDb3B5cmlnaHQgKGMpIDIwMTUsIEJyYW5kb24gSm9uZXMsIENvbGluIE1hY0tlbnppZSBJVi5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLiAqL1xuXG52YXIgZ2xNYXRyaXggPSByZXF1aXJlKFwiLi9jb21tb24uanNcIik7XG5cbi8qKlxuICogQGNsYXNzIDQgRGltZW5zaW9uYWwgVmVjdG9yXG4gKiBAbmFtZSB2ZWM0XG4gKi9cbnZhciB2ZWM0ID0ge307XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldywgZW1wdHkgdmVjNFxuICpcbiAqIEByZXR1cm5zIHt2ZWM0fSBhIG5ldyA0RCB2ZWN0b3JcbiAqL1xudmVjNC5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoNCk7XG4gICAgb3V0WzBdID0gMDtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHZlYzQgaW5pdGlhbGl6ZWQgd2l0aCB2YWx1ZXMgZnJvbSBhbiBleGlzdGluZyB2ZWN0b3JcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdmVjdG9yIHRvIGNsb25lXG4gKiBAcmV0dXJucyB7dmVjNH0gYSBuZXcgNEQgdmVjdG9yXG4gKi9cbnZlYzQuY2xvbmUgPSBmdW5jdGlvbihhKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDQpO1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB2ZWM0IGluaXRpYWxpemVkIHdpdGggdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFggY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geSBZIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHogWiBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB3IFcgY29tcG9uZW50XG4gKiBAcmV0dXJucyB7dmVjNH0gYSBuZXcgNEQgdmVjdG9yXG4gKi9cbnZlYzQuZnJvbVZhbHVlcyA9IGZ1bmN0aW9uKHgsIHksIHosIHcpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoNCk7XG4gICAgb3V0WzBdID0geDtcbiAgICBvdXRbMV0gPSB5O1xuICAgIG91dFsyXSA9IHo7XG4gICAgb3V0WzNdID0gdztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDb3B5IHRoZSB2YWx1ZXMgZnJvbSBvbmUgdmVjNCB0byBhbm90aGVyXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgc291cmNlIHZlY3RvclxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LmNvcHkgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzQgdG8gdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgWSBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFogY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0gdyBXIGNvbXBvbmVudFxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LnNldCA9IGZ1bmN0aW9uKG91dCwgeCwgeSwgeiwgdykge1xuICAgIG91dFswXSA9IHg7XG4gICAgb3V0WzFdID0geTtcbiAgICBvdXRbMl0gPSB6O1xuICAgIG91dFszXSA9IHc7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWRkcyB0d28gdmVjNCdzXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LmFkZCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKyBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gKyBiWzFdO1xuICAgIG91dFsyXSA9IGFbMl0gKyBiWzJdO1xuICAgIG91dFszXSA9IGFbM10gKyBiWzNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0cyB2ZWN0b3IgYiBmcm9tIHZlY3RvciBhXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LnN1YnRyYWN0ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAtIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAtIGJbMV07XG4gICAgb3V0WzJdID0gYVsyXSAtIGJbMl07XG4gICAgb3V0WzNdID0gYVszXSAtIGJbM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWM0LnN1YnRyYWN0fVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzQuc3ViID0gdmVjNC5zdWJ0cmFjdDtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byB2ZWM0J3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQubXVsdGlwbHkgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdICogYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdICogYlsxXTtcbiAgICBvdXRbMl0gPSBhWzJdICogYlsyXTtcbiAgICBvdXRbM10gPSBhWzNdICogYlszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzQubXVsdGlwbHl9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjNC5tdWwgPSB2ZWM0Lm11bHRpcGx5O1xuXG4vKipcbiAqIERpdmlkZXMgdHdvIHZlYzQnc1xuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5kaXZpZGUgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdIC8gYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdIC8gYlsxXTtcbiAgICBvdXRbMl0gPSBhWzJdIC8gYlsyXTtcbiAgICBvdXRbM10gPSBhWzNdIC8gYlszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzQuZGl2aWRlfVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzQuZGl2ID0gdmVjNC5kaXZpZGU7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbWluaW11bSBvZiB0d28gdmVjNCdzXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0Lm1pbiA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IE1hdGgubWluKGFbMF0sIGJbMF0pO1xuICAgIG91dFsxXSA9IE1hdGgubWluKGFbMV0sIGJbMV0pO1xuICAgIG91dFsyXSA9IE1hdGgubWluKGFbMl0sIGJbMl0pO1xuICAgIG91dFszXSA9IE1hdGgubWluKGFbM10sIGJbM10pO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG1heGltdW0gb2YgdHdvIHZlYzQnc1xuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5tYXggPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBNYXRoLm1heChhWzBdLCBiWzBdKTtcbiAgICBvdXRbMV0gPSBNYXRoLm1heChhWzFdLCBiWzFdKTtcbiAgICBvdXRbMl0gPSBNYXRoLm1heChhWzJdLCBiWzJdKTtcbiAgICBvdXRbM10gPSBNYXRoLm1heChhWzNdLCBiWzNdKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTY2FsZXMgYSB2ZWM0IGJ5IGEgc2NhbGFyIG51bWJlclxuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIHZlY3RvciB0byBzY2FsZVxuICogQHBhcmFtIHtOdW1iZXJ9IGIgYW1vdW50IHRvIHNjYWxlIHRoZSB2ZWN0b3IgYnlcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5zY2FsZSA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKiBiO1xuICAgIG91dFsxXSA9IGFbMV0gKiBiO1xuICAgIG91dFsyXSA9IGFbMl0gKiBiO1xuICAgIG91dFszXSA9IGFbM10gKiBiO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFkZHMgdHdvIHZlYzQncyBhZnRlciBzY2FsaW5nIHRoZSBzZWNvbmQgb3BlcmFuZCBieSBhIHNjYWxhciB2YWx1ZVxuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSBzY2FsZSB0aGUgYW1vdW50IHRvIHNjYWxlIGIgYnkgYmVmb3JlIGFkZGluZ1xuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LnNjYWxlQW5kQWRkID0gZnVuY3Rpb24ob3V0LCBhLCBiLCBzY2FsZSkge1xuICAgIG91dFswXSA9IGFbMF0gKyAoYlswXSAqIHNjYWxlKTtcbiAgICBvdXRbMV0gPSBhWzFdICsgKGJbMV0gKiBzY2FsZSk7XG4gICAgb3V0WzJdID0gYVsyXSArIChiWzJdICogc2NhbGUpO1xuICAgIG91dFszXSA9IGFbM10gKyAoYlszXSAqIHNjYWxlKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBldWNsaWRpYW4gZGlzdGFuY2UgYmV0d2VlbiB0d28gdmVjNCdzXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkaXN0YW5jZSBiZXR3ZWVuIGEgYW5kIGJcbiAqL1xudmVjNC5kaXN0YW5jZSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgeCA9IGJbMF0gLSBhWzBdLFxuICAgICAgICB5ID0gYlsxXSAtIGFbMV0sXG4gICAgICAgIHogPSBiWzJdIC0gYVsyXSxcbiAgICAgICAgdyA9IGJbM10gLSBhWzNdO1xuICAgIHJldHVybiBNYXRoLnNxcnQoeCp4ICsgeSp5ICsgeip6ICsgdyp3KTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWM0LmRpc3RhbmNlfVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzQuZGlzdCA9IHZlYzQuZGlzdGFuY2U7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgc3F1YXJlZCBldWNsaWRpYW4gZGlzdGFuY2UgYmV0d2VlbiB0d28gdmVjNCdzXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBzcXVhcmVkIGRpc3RhbmNlIGJldHdlZW4gYSBhbmQgYlxuICovXG52ZWM0LnNxdWFyZWREaXN0YW5jZSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgeCA9IGJbMF0gLSBhWzBdLFxuICAgICAgICB5ID0gYlsxXSAtIGFbMV0sXG4gICAgICAgIHogPSBiWzJdIC0gYVsyXSxcbiAgICAgICAgdyA9IGJbM10gLSBhWzNdO1xuICAgIHJldHVybiB4KnggKyB5KnkgKyB6KnogKyB3Knc7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjNC5zcXVhcmVkRGlzdGFuY2V9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjNC5zcXJEaXN0ID0gdmVjNC5zcXVhcmVkRGlzdGFuY2U7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgbGVuZ3RoIG9mIGEgdmVjNFxuICpcbiAqIEBwYXJhbSB7dmVjNH0gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIGxlbmd0aCBvZlxuICogQHJldHVybnMge051bWJlcn0gbGVuZ3RoIG9mIGFcbiAqL1xudmVjNC5sZW5ndGggPSBmdW5jdGlvbiAoYSkge1xuICAgIHZhciB4ID0gYVswXSxcbiAgICAgICAgeSA9IGFbMV0sXG4gICAgICAgIHogPSBhWzJdLFxuICAgICAgICB3ID0gYVszXTtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHgqeCArIHkqeSArIHoqeiArIHcqdyk7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjNC5sZW5ndGh9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjNC5sZW4gPSB2ZWM0Lmxlbmd0aDtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGxlbmd0aCBvZiBhIHZlYzRcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdmVjdG9yIHRvIGNhbGN1bGF0ZSBzcXVhcmVkIGxlbmd0aCBvZlxuICogQHJldHVybnMge051bWJlcn0gc3F1YXJlZCBsZW5ndGggb2YgYVxuICovXG52ZWM0LnNxdWFyZWRMZW5ndGggPSBmdW5jdGlvbiAoYSkge1xuICAgIHZhciB4ID0gYVswXSxcbiAgICAgICAgeSA9IGFbMV0sXG4gICAgICAgIHogPSBhWzJdLFxuICAgICAgICB3ID0gYVszXTtcbiAgICByZXR1cm4geCp4ICsgeSp5ICsgeip6ICsgdyp3O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzQuc3F1YXJlZExlbmd0aH1cbiAqIEBmdW5jdGlvblxuICovXG52ZWM0LnNxckxlbiA9IHZlYzQuc3F1YXJlZExlbmd0aDtcblxuLyoqXG4gKiBOZWdhdGVzIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjNFxuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdmVjdG9yIHRvIG5lZ2F0ZVxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0Lm5lZ2F0ZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IC1hWzBdO1xuICAgIG91dFsxXSA9IC1hWzFdO1xuICAgIG91dFsyXSA9IC1hWzJdO1xuICAgIG91dFszXSA9IC1hWzNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGludmVyc2Ugb2YgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWM0XG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB2ZWN0b3IgdG8gaW52ZXJ0XG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQuaW52ZXJzZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICBvdXRbMF0gPSAxLjAgLyBhWzBdO1xuICBvdXRbMV0gPSAxLjAgLyBhWzFdO1xuICBvdXRbMl0gPSAxLjAgLyBhWzJdO1xuICBvdXRbM10gPSAxLjAgLyBhWzNdO1xuICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBOb3JtYWxpemUgYSB2ZWM0XG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB2ZWN0b3IgdG8gbm9ybWFsaXplXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQubm9ybWFsaXplID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXSxcbiAgICAgICAgeiA9IGFbMl0sXG4gICAgICAgIHcgPSBhWzNdO1xuICAgIHZhciBsZW4gPSB4KnggKyB5KnkgKyB6KnogKyB3Knc7XG4gICAgaWYgKGxlbiA+IDApIHtcbiAgICAgICAgbGVuID0gMSAvIE1hdGguc3FydChsZW4pO1xuICAgICAgICBvdXRbMF0gPSB4ICogbGVuO1xuICAgICAgICBvdXRbMV0gPSB5ICogbGVuO1xuICAgICAgICBvdXRbMl0gPSB6ICogbGVuO1xuICAgICAgICBvdXRbM10gPSB3ICogbGVuO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBkb3QgcHJvZHVjdCBvZiB0d28gdmVjNCdzXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkb3QgcHJvZHVjdCBvZiBhIGFuZCBiXG4gKi9cbnZlYzQuZG90ID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gYVswXSAqIGJbMF0gKyBhWzFdICogYlsxXSArIGFbMl0gKiBiWzJdICsgYVszXSAqIGJbM107XG59O1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgbGluZWFyIGludGVycG9sYXRpb24gYmV0d2VlbiB0d28gdmVjNCdzXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHtOdW1iZXJ9IHQgaW50ZXJwb2xhdGlvbiBhbW91bnQgYmV0d2VlbiB0aGUgdHdvIGlucHV0c1xuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LmxlcnAgPSBmdW5jdGlvbiAob3V0LCBhLCBiLCB0KSB7XG4gICAgdmFyIGF4ID0gYVswXSxcbiAgICAgICAgYXkgPSBhWzFdLFxuICAgICAgICBheiA9IGFbMl0sXG4gICAgICAgIGF3ID0gYVszXTtcbiAgICBvdXRbMF0gPSBheCArIHQgKiAoYlswXSAtIGF4KTtcbiAgICBvdXRbMV0gPSBheSArIHQgKiAoYlsxXSAtIGF5KTtcbiAgICBvdXRbMl0gPSBheiArIHQgKiAoYlsyXSAtIGF6KTtcbiAgICBvdXRbM10gPSBhdyArIHQgKiAoYlszXSAtIGF3KTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSByYW5kb20gdmVjdG9yIHdpdGggdGhlIGdpdmVuIHNjYWxlXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7TnVtYmVyfSBbc2NhbGVdIExlbmd0aCBvZiB0aGUgcmVzdWx0aW5nIHZlY3Rvci4gSWYgb21taXR0ZWQsIGEgdW5pdCB2ZWN0b3Igd2lsbCBiZSByZXR1cm5lZFxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LnJhbmRvbSA9IGZ1bmN0aW9uIChvdXQsIHNjYWxlKSB7XG4gICAgc2NhbGUgPSBzY2FsZSB8fCAxLjA7XG5cbiAgICAvL1RPRE86IFRoaXMgaXMgYSBwcmV0dHkgYXdmdWwgd2F5IG9mIGRvaW5nIHRoaXMuIEZpbmQgc29tZXRoaW5nIGJldHRlci5cbiAgICBvdXRbMF0gPSBnbE1hdHJpeC5SQU5ET00oKTtcbiAgICBvdXRbMV0gPSBnbE1hdHJpeC5SQU5ET00oKTtcbiAgICBvdXRbMl0gPSBnbE1hdHJpeC5SQU5ET00oKTtcbiAgICBvdXRbM10gPSBnbE1hdHJpeC5SQU5ET00oKTtcbiAgICB2ZWM0Lm5vcm1hbGl6ZShvdXQsIG91dCk7XG4gICAgdmVjNC5zY2FsZShvdXQsIG91dCwgc2NhbGUpO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzQgd2l0aCBhIG1hdDQuXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICogQHBhcmFtIHttYXQ0fSBtIG1hdHJpeCB0byB0cmFuc2Zvcm0gd2l0aFxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LnRyYW5zZm9ybU1hdDQgPSBmdW5jdGlvbihvdXQsIGEsIG0pIHtcbiAgICB2YXIgeCA9IGFbMF0sIHkgPSBhWzFdLCB6ID0gYVsyXSwgdyA9IGFbM107XG4gICAgb3V0WzBdID0gbVswXSAqIHggKyBtWzRdICogeSArIG1bOF0gKiB6ICsgbVsxMl0gKiB3O1xuICAgIG91dFsxXSA9IG1bMV0gKiB4ICsgbVs1XSAqIHkgKyBtWzldICogeiArIG1bMTNdICogdztcbiAgICBvdXRbMl0gPSBtWzJdICogeCArIG1bNl0gKiB5ICsgbVsxMF0gKiB6ICsgbVsxNF0gKiB3O1xuICAgIG91dFszXSA9IG1bM10gKiB4ICsgbVs3XSAqIHkgKyBtWzExXSAqIHogKyBtWzE1XSAqIHc7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNmb3JtcyB0aGUgdmVjNCB3aXRoIGEgcXVhdFxuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7cXVhdH0gcSBxdWF0ZXJuaW9uIHRvIHRyYW5zZm9ybSB3aXRoXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQudHJhbnNmb3JtUXVhdCA9IGZ1bmN0aW9uKG91dCwgYSwgcSkge1xuICAgIHZhciB4ID0gYVswXSwgeSA9IGFbMV0sIHogPSBhWzJdLFxuICAgICAgICBxeCA9IHFbMF0sIHF5ID0gcVsxXSwgcXogPSBxWzJdLCBxdyA9IHFbM10sXG5cbiAgICAgICAgLy8gY2FsY3VsYXRlIHF1YXQgKiB2ZWNcbiAgICAgICAgaXggPSBxdyAqIHggKyBxeSAqIHogLSBxeiAqIHksXG4gICAgICAgIGl5ID0gcXcgKiB5ICsgcXogKiB4IC0gcXggKiB6LFxuICAgICAgICBpeiA9IHF3ICogeiArIHF4ICogeSAtIHF5ICogeCxcbiAgICAgICAgaXcgPSAtcXggKiB4IC0gcXkgKiB5IC0gcXogKiB6O1xuXG4gICAgLy8gY2FsY3VsYXRlIHJlc3VsdCAqIGludmVyc2UgcXVhdFxuICAgIG91dFswXSA9IGl4ICogcXcgKyBpdyAqIC1xeCArIGl5ICogLXF6IC0gaXogKiAtcXk7XG4gICAgb3V0WzFdID0gaXkgKiBxdyArIGl3ICogLXF5ICsgaXogKiAtcXggLSBpeCAqIC1xejtcbiAgICBvdXRbMl0gPSBpeiAqIHF3ICsgaXcgKiAtcXogKyBpeCAqIC1xeSAtIGl5ICogLXF4O1xuICAgIG91dFszXSA9IGFbM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUGVyZm9ybSBzb21lIG9wZXJhdGlvbiBvdmVyIGFuIGFycmF5IG9mIHZlYzRzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGEgdGhlIGFycmF5IG9mIHZlY3RvcnMgdG8gaXRlcmF0ZSBvdmVyXG4gKiBAcGFyYW0ge051bWJlcn0gc3RyaWRlIE51bWJlciBvZiBlbGVtZW50cyBiZXR3ZWVuIHRoZSBzdGFydCBvZiBlYWNoIHZlYzQuIElmIDAgYXNzdW1lcyB0aWdodGx5IHBhY2tlZFxuICogQHBhcmFtIHtOdW1iZXJ9IG9mZnNldCBOdW1iZXIgb2YgZWxlbWVudHMgdG8gc2tpcCBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhcnJheVxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IE51bWJlciBvZiB2ZWM0cyB0byBpdGVyYXRlIG92ZXIuIElmIDAgaXRlcmF0ZXMgb3ZlciBlbnRpcmUgYXJyYXlcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggdmVjdG9yIGluIHRoZSBhcnJheVxuICogQHBhcmFtIHtPYmplY3R9IFthcmddIGFkZGl0aW9uYWwgYXJndW1lbnQgdG8gcGFzcyB0byBmblxuICogQHJldHVybnMge0FycmF5fSBhXG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjNC5mb3JFYWNoID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciB2ZWMgPSB2ZWM0LmNyZWF0ZSgpO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGEsIHN0cmlkZSwgb2Zmc2V0LCBjb3VudCwgZm4sIGFyZykge1xuICAgICAgICB2YXIgaSwgbDtcbiAgICAgICAgaWYoIXN0cmlkZSkge1xuICAgICAgICAgICAgc3RyaWRlID0gNDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCFvZmZzZXQpIHtcbiAgICAgICAgICAgIG9mZnNldCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmKGNvdW50KSB7XG4gICAgICAgICAgICBsID0gTWF0aC5taW4oKGNvdW50ICogc3RyaWRlKSArIG9mZnNldCwgYS5sZW5ndGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbCA9IGEubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKGkgPSBvZmZzZXQ7IGkgPCBsOyBpICs9IHN0cmlkZSkge1xuICAgICAgICAgICAgdmVjWzBdID0gYVtpXTsgdmVjWzFdID0gYVtpKzFdOyB2ZWNbMl0gPSBhW2krMl07IHZlY1szXSA9IGFbaSszXTtcbiAgICAgICAgICAgIGZuKHZlYywgdmVjLCBhcmcpO1xuICAgICAgICAgICAgYVtpXSA9IHZlY1swXTsgYVtpKzFdID0gdmVjWzFdOyBhW2krMl0gPSB2ZWNbMl07IGFbaSszXSA9IHZlY1szXTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfTtcbn0pKCk7XG5cbi8qKlxuICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIHZlY3RvclxuICpcbiAqIEBwYXJhbSB7dmVjNH0gdmVjIHZlY3RvciB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdmVjdG9yXG4gKi9cbnZlYzQuc3RyID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gJ3ZlYzQoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcsICcgKyBhWzJdICsgJywgJyArIGFbM10gKyAnKSc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHZlYzQ7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC92ZWM0LmpzXG4gKiogbW9kdWxlIGlkID0gMTJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qIENvcHlyaWdodCAoYykgMjAxNSwgQnJhbmRvbiBKb25lcywgQ29saW4gTWFjS2VuemllIElWLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuICovXG5cbnZhciBnbE1hdHJpeCA9IHJlcXVpcmUoXCIuL2NvbW1vbi5qc1wiKTtcblxuLyoqXG4gKiBAY2xhc3MgMiBEaW1lbnNpb25hbCBWZWN0b3JcbiAqIEBuYW1lIHZlYzJcbiAqL1xudmFyIHZlYzIgPSB7fTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3LCBlbXB0eSB2ZWMyXG4gKlxuICogQHJldHVybnMge3ZlYzJ9IGEgbmV3IDJEIHZlY3RvclxuICovXG52ZWMyLmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSgyKTtcbiAgICBvdXRbMF0gPSAwO1xuICAgIG91dFsxXSA9IDA7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB2ZWMyIGluaXRpYWxpemVkIHdpdGggdmFsdWVzIGZyb20gYW4gZXhpc3RpbmcgdmVjdG9yXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBhIHZlY3RvciB0byBjbG9uZVxuICogQHJldHVybnMge3ZlYzJ9IGEgbmV3IDJEIHZlY3RvclxuICovXG52ZWMyLmNsb25lID0gZnVuY3Rpb24oYSkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSgyKTtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB2ZWMyIGluaXRpYWxpemVkIHdpdGggdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFggY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geSBZIGNvbXBvbmVudFxuICogQHJldHVybnMge3ZlYzJ9IGEgbmV3IDJEIHZlY3RvclxuICovXG52ZWMyLmZyb21WYWx1ZXMgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDIpO1xuICAgIG91dFswXSA9IHg7XG4gICAgb3V0WzFdID0geTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDb3B5IHRoZSB2YWx1ZXMgZnJvbSBvbmUgdmVjMiB0byBhbm90aGVyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgc291cmNlIHZlY3RvclxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLmNvcHkgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjb21wb25lbnRzIG9mIGEgdmVjMiB0byB0aGUgZ2l2ZW4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFggY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geSBZIGNvbXBvbmVudFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnNldCA9IGZ1bmN0aW9uKG91dCwgeCwgeSkge1xuICAgIG91dFswXSA9IHg7XG4gICAgb3V0WzFdID0geTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBZGRzIHR3byB2ZWMyJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIuYWRkID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSArIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSArIGJbMV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU3VidHJhY3RzIHZlY3RvciBiIGZyb20gdmVjdG9yIGFcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIuc3VidHJhY3QgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdIC0gYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdIC0gYlsxXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzIuc3VidHJhY3R9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMi5zdWIgPSB2ZWMyLnN1YnRyYWN0O1xuXG4vKipcbiAqIE11bHRpcGxpZXMgdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5tdWx0aXBseSA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKiBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gKiBiWzFdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMi5tdWx0aXBseX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMyLm11bCA9IHZlYzIubXVsdGlwbHk7XG5cbi8qKlxuICogRGl2aWRlcyB0d28gdmVjMidzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLmRpdmlkZSA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gLyBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gLyBiWzFdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMi5kaXZpZGV9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMi5kaXYgPSB2ZWMyLmRpdmlkZTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtaW5pbXVtIG9mIHR3byB2ZWMyJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIubWluID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gTWF0aC5taW4oYVswXSwgYlswXSk7XG4gICAgb3V0WzFdID0gTWF0aC5taW4oYVsxXSwgYlsxXSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbWF4aW11bSBvZiB0d28gdmVjMidzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLm1heCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IE1hdGgubWF4KGFbMF0sIGJbMF0pO1xuICAgIG91dFsxXSA9IE1hdGgubWF4KGFbMV0sIGJbMV0pO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlcyBhIHZlYzIgYnkgYSBzY2FsYXIgbnVtYmVyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgdmVjdG9yIHRvIHNjYWxlXG4gKiBAcGFyYW0ge051bWJlcn0gYiBhbW91bnQgdG8gc2NhbGUgdGhlIHZlY3RvciBieVxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnNjYWxlID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAqIGI7XG4gICAgb3V0WzFdID0gYVsxXSAqIGI7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWRkcyB0d28gdmVjMidzIGFmdGVyIHNjYWxpbmcgdGhlIHNlY29uZCBvcGVyYW5kIGJ5IGEgc2NhbGFyIHZhbHVlXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHtOdW1iZXJ9IHNjYWxlIHRoZSBhbW91bnQgdG8gc2NhbGUgYiBieSBiZWZvcmUgYWRkaW5nXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIuc2NhbGVBbmRBZGQgPSBmdW5jdGlvbihvdXQsIGEsIGIsIHNjYWxlKSB7XG4gICAgb3V0WzBdID0gYVswXSArIChiWzBdICogc2NhbGUpO1xuICAgIG91dFsxXSA9IGFbMV0gKyAoYlsxXSAqIHNjYWxlKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBldWNsaWRpYW4gZGlzdGFuY2UgYmV0d2VlbiB0d28gdmVjMidzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkaXN0YW5jZSBiZXR3ZWVuIGEgYW5kIGJcbiAqL1xudmVjMi5kaXN0YW5jZSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgeCA9IGJbMF0gLSBhWzBdLFxuICAgICAgICB5ID0gYlsxXSAtIGFbMV07XG4gICAgcmV0dXJuIE1hdGguc3FydCh4KnggKyB5KnkpO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzIuZGlzdGFuY2V9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMi5kaXN0ID0gdmVjMi5kaXN0YW5jZTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGV1Y2xpZGlhbiBkaXN0YW5jZSBiZXR3ZWVuIHR3byB2ZWMyJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IHNxdWFyZWQgZGlzdGFuY2UgYmV0d2VlbiBhIGFuZCBiXG4gKi9cbnZlYzIuc3F1YXJlZERpc3RhbmNlID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciB4ID0gYlswXSAtIGFbMF0sXG4gICAgICAgIHkgPSBiWzFdIC0gYVsxXTtcbiAgICByZXR1cm4geCp4ICsgeSp5O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzIuc3F1YXJlZERpc3RhbmNlfVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzIuc3FyRGlzdCA9IHZlYzIuc3F1YXJlZERpc3RhbmNlO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGxlbmd0aCBvZiBhIHZlYzJcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdmVjdG9yIHRvIGNhbGN1bGF0ZSBsZW5ndGggb2ZcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGxlbmd0aCBvZiBhXG4gKi9cbnZlYzIubGVuZ3RoID0gZnVuY3Rpb24gKGEpIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdO1xuICAgIHJldHVybiBNYXRoLnNxcnQoeCp4ICsgeSp5KTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMyLmxlbmd0aH1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMyLmxlbiA9IHZlYzIubGVuZ3RoO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgbGVuZ3RoIG9mIGEgdmVjMlxuICpcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIHNxdWFyZWQgbGVuZ3RoIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBzcXVhcmVkIGxlbmd0aCBvZiBhXG4gKi9cbnZlYzIuc3F1YXJlZExlbmd0aCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXTtcbiAgICByZXR1cm4geCp4ICsgeSp5O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzIuc3F1YXJlZExlbmd0aH1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMyLnNxckxlbiA9IHZlYzIuc3F1YXJlZExlbmd0aDtcblxuLyoqXG4gKiBOZWdhdGVzIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjMlxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdmVjdG9yIHRvIG5lZ2F0ZVxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLm5lZ2F0ZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IC1hWzBdO1xuICAgIG91dFsxXSA9IC1hWzFdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGludmVyc2Ugb2YgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWMyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gaW52ZXJ0XG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIuaW52ZXJzZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICBvdXRbMF0gPSAxLjAgLyBhWzBdO1xuICBvdXRbMV0gPSAxLjAgLyBhWzFdO1xuICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBOb3JtYWxpemUgYSB2ZWMyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gbm9ybWFsaXplXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIubm9ybWFsaXplID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXTtcbiAgICB2YXIgbGVuID0geCp4ICsgeSp5O1xuICAgIGlmIChsZW4gPiAwKSB7XG4gICAgICAgIC8vVE9ETzogZXZhbHVhdGUgdXNlIG9mIGdsbV9pbnZzcXJ0IGhlcmU/XG4gICAgICAgIGxlbiA9IDEgLyBNYXRoLnNxcnQobGVuKTtcbiAgICAgICAgb3V0WzBdID0gYVswXSAqIGxlbjtcbiAgICAgICAgb3V0WzFdID0gYVsxXSAqIGxlbjtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZG90IHByb2R1Y3Qgb2YgdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gZG90IHByb2R1Y3Qgb2YgYSBhbmQgYlxuICovXG52ZWMyLmRvdCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGFbMF0gKiBiWzBdICsgYVsxXSAqIGJbMV07XG59O1xuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBjcm9zcyBwcm9kdWN0IG9mIHR3byB2ZWMyJ3NcbiAqIE5vdGUgdGhhdCB0aGUgY3Jvc3MgcHJvZHVjdCBtdXN0IGJ5IGRlZmluaXRpb24gcHJvZHVjZSBhIDNEIHZlY3RvclxuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMi5jcm9zcyA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIHZhciB6ID0gYVswXSAqIGJbMV0gLSBhWzFdICogYlswXTtcbiAgICBvdXRbMF0gPSBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IHo7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgYSBsaW5lYXIgaW50ZXJwb2xhdGlvbiBiZXR3ZWVuIHR3byB2ZWMyJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudCBiZXR3ZWVuIHRoZSB0d28gaW5wdXRzXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIubGVycCA9IGZ1bmN0aW9uIChvdXQsIGEsIGIsIHQpIHtcbiAgICB2YXIgYXggPSBhWzBdLFxuICAgICAgICBheSA9IGFbMV07XG4gICAgb3V0WzBdID0gYXggKyB0ICogKGJbMF0gLSBheCk7XG4gICAgb3V0WzFdID0gYXkgKyB0ICogKGJbMV0gLSBheSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgcmFuZG9tIHZlY3RvciB3aXRoIHRoZSBnaXZlbiBzY2FsZVxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge051bWJlcn0gW3NjYWxlXSBMZW5ndGggb2YgdGhlIHJlc3VsdGluZyB2ZWN0b3IuIElmIG9tbWl0dGVkLCBhIHVuaXQgdmVjdG9yIHdpbGwgYmUgcmV0dXJuZWRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5yYW5kb20gPSBmdW5jdGlvbiAob3V0LCBzY2FsZSkge1xuICAgIHNjYWxlID0gc2NhbGUgfHwgMS4wO1xuICAgIHZhciByID0gZ2xNYXRyaXguUkFORE9NKCkgKiAyLjAgKiBNYXRoLlBJO1xuICAgIG91dFswXSA9IE1hdGguY29zKHIpICogc2NhbGU7XG4gICAgb3V0WzFdID0gTWF0aC5zaW4ocikgKiBzY2FsZTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMyIHdpdGggYSBtYXQyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICogQHBhcmFtIHttYXQyfSBtIG1hdHJpeCB0byB0cmFuc2Zvcm0gd2l0aFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnRyYW5zZm9ybU1hdDIgPSBmdW5jdGlvbihvdXQsIGEsIG0pIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdO1xuICAgIG91dFswXSA9IG1bMF0gKiB4ICsgbVsyXSAqIHk7XG4gICAgb3V0WzFdID0gbVsxXSAqIHggKyBtWzNdICogeTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMyIHdpdGggYSBtYXQyZFxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7bWF0MmR9IG0gbWF0cml4IHRvIHRyYW5zZm9ybSB3aXRoXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIudHJhbnNmb3JtTWF0MmQgPSBmdW5jdGlvbihvdXQsIGEsIG0pIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdO1xuICAgIG91dFswXSA9IG1bMF0gKiB4ICsgbVsyXSAqIHkgKyBtWzRdO1xuICAgIG91dFsxXSA9IG1bMV0gKiB4ICsgbVszXSAqIHkgKyBtWzVdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzIgd2l0aCBhIG1hdDNcbiAqIDNyZCB2ZWN0b3IgY29tcG9uZW50IGlzIGltcGxpY2l0bHkgJzEnXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICogQHBhcmFtIHttYXQzfSBtIG1hdHJpeCB0byB0cmFuc2Zvcm0gd2l0aFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnRyYW5zZm9ybU1hdDMgPSBmdW5jdGlvbihvdXQsIGEsIG0pIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdO1xuICAgIG91dFswXSA9IG1bMF0gKiB4ICsgbVszXSAqIHkgKyBtWzZdO1xuICAgIG91dFsxXSA9IG1bMV0gKiB4ICsgbVs0XSAqIHkgKyBtWzddO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzIgd2l0aCBhIG1hdDRcbiAqIDNyZCB2ZWN0b3IgY29tcG9uZW50IGlzIGltcGxpY2l0bHkgJzAnXG4gKiA0dGggdmVjdG9yIGNvbXBvbmVudCBpcyBpbXBsaWNpdGx5ICcxJ1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7bWF0NH0gbSBtYXRyaXggdG8gdHJhbnNmb3JtIHdpdGhcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi50cmFuc2Zvcm1NYXQ0ID0gZnVuY3Rpb24ob3V0LCBhLCBtKSB7XG4gICAgdmFyIHggPSBhWzBdLCBcbiAgICAgICAgeSA9IGFbMV07XG4gICAgb3V0WzBdID0gbVswXSAqIHggKyBtWzRdICogeSArIG1bMTJdO1xuICAgIG91dFsxXSA9IG1bMV0gKiB4ICsgbVs1XSAqIHkgKyBtWzEzXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBQZXJmb3JtIHNvbWUgb3BlcmF0aW9uIG92ZXIgYW4gYXJyYXkgb2YgdmVjMnMuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYSB0aGUgYXJyYXkgb2YgdmVjdG9ycyB0byBpdGVyYXRlIG92ZXJcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdHJpZGUgTnVtYmVyIG9mIGVsZW1lbnRzIGJldHdlZW4gdGhlIHN0YXJ0IG9mIGVhY2ggdmVjMi4gSWYgMCBhc3N1bWVzIHRpZ2h0bHkgcGFja2VkXG4gKiBAcGFyYW0ge051bWJlcn0gb2Zmc2V0IE51bWJlciBvZiBlbGVtZW50cyB0byBza2lwIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFycmF5XG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgTnVtYmVyIG9mIHZlYzJzIHRvIGl0ZXJhdGUgb3Zlci4gSWYgMCBpdGVyYXRlcyBvdmVyIGVudGlyZSBhcnJheVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCB2ZWN0b3IgaW4gdGhlIGFycmF5XG4gKiBAcGFyYW0ge09iamVjdH0gW2FyZ10gYWRkaXRpb25hbCBhcmd1bWVudCB0byBwYXNzIHRvIGZuXG4gKiBAcmV0dXJucyB7QXJyYXl9IGFcbiAqIEBmdW5jdGlvblxuICovXG52ZWMyLmZvckVhY2ggPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZlYyA9IHZlYzIuY3JlYXRlKCk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oYSwgc3RyaWRlLCBvZmZzZXQsIGNvdW50LCBmbiwgYXJnKSB7XG4gICAgICAgIHZhciBpLCBsO1xuICAgICAgICBpZighc3RyaWRlKSB7XG4gICAgICAgICAgICBzdHJpZGUgPSAyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIW9mZnNldCkge1xuICAgICAgICAgICAgb2Zmc2V0ID0gMDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYoY291bnQpIHtcbiAgICAgICAgICAgIGwgPSBNYXRoLm1pbigoY291bnQgKiBzdHJpZGUpICsgb2Zmc2V0LCBhLmxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsID0gYS5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaSA9IG9mZnNldDsgaSA8IGw7IGkgKz0gc3RyaWRlKSB7XG4gICAgICAgICAgICB2ZWNbMF0gPSBhW2ldOyB2ZWNbMV0gPSBhW2krMV07XG4gICAgICAgICAgICBmbih2ZWMsIHZlYywgYXJnKTtcbiAgICAgICAgICAgIGFbaV0gPSB2ZWNbMF07IGFbaSsxXSA9IHZlY1sxXTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfTtcbn0pKCk7XG5cbi8qKlxuICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIHZlY3RvclxuICpcbiAqIEBwYXJhbSB7dmVjMn0gdmVjIHZlY3RvciB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdmVjdG9yXG4gKi9cbnZlYzIuc3RyID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gJ3ZlYzIoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcpJztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdmVjMjtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L3ZlYzIuanNcbiAqKiBtb2R1bGUgaWQgPSAxM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdFwiZmFjZVwiOiB7XG5cdFx0XCJwb3NpdGlvblwiOiBbXG5cdFx0XHQwLjAzODIsXG5cdFx0XHQtMC4wNjM3LFxuXHRcdFx0MC4yODk4LFxuXHRcdFx0MCxcblx0XHRcdC0wLjA1OTUsXG5cdFx0XHQwLjMwNTksXG5cdFx0XHQwLFxuXHRcdFx0LTAuMTAzNSxcblx0XHRcdDAuMzM2Nyxcblx0XHRcdDAuMDM4NSxcblx0XHRcdC0wLjEwNDYsXG5cdFx0XHQwLjMxOTUsXG5cdFx0XHQwLjAzNjIsXG5cdFx0XHQwLjA4MTYsXG5cdFx0XHQwLjIxMzksXG5cdFx0XHQwLFxuXHRcdFx0MC4wODg0LFxuXHRcdFx0MC4yMjY0LFxuXHRcdFx0MCxcblx0XHRcdDAsXG5cdFx0XHQwLjI2NjcsXG5cdFx0XHQwLjA0MjQsXG5cdFx0XHQtMC4wMDg2LFxuXHRcdFx0MC4yNTI2LFxuXHRcdFx0MC4wNzUsXG5cdFx0XHQwLjA0NTgsXG5cdFx0XHQwLjE2OTksXG5cdFx0XHQwLjA3NjgsXG5cdFx0XHQtMC4wNDE0LFxuXHRcdFx0MC4xOTQ5LFxuXHRcdFx0MCxcblx0XHRcdC0wLjE1MzUsXG5cdFx0XHQwLjMzODMsXG5cdFx0XHQwLjAzODUsXG5cdFx0XHQtMC4xNDksXG5cdFx0XHQwLjMyMjgsXG5cdFx0XHQwLjA5MTUsXG5cdFx0XHQtMC4xNTE0LFxuXHRcdFx0MC4yNTU2LFxuXHRcdFx0MC4wOTMsXG5cdFx0XHQtMC4xMTk5LFxuXHRcdFx0MC4yNDU2LFxuXHRcdFx0MCxcblx0XHRcdC0wLjE4NDgsXG5cdFx0XHQwLjMxMzgsXG5cdFx0XHQwLjAzMzksXG5cdFx0XHQtMC4xNzc1LFxuXHRcdFx0MC4zMDE1LFxuXHRcdFx0MC4wODAzLFxuXHRcdFx0LTAuMTcxMSxcblx0XHRcdDAuMjU4Nyxcblx0XHRcdDAuMDE0Nyxcblx0XHRcdC0wLjE5MDMsXG5cdFx0XHQwLjI3NjEsXG5cdFx0XHQwLFxuXHRcdFx0LTAuMTk1Myxcblx0XHRcdDAuMjc3Nyxcblx0XHRcdDAuMDMwOCxcblx0XHRcdC0wLjIwMSxcblx0XHRcdDAuMjQzLFxuXHRcdFx0MCxcblx0XHRcdC0wLjIwODUsXG5cdFx0XHQwLjI0OTcsXG5cdFx0XHQwLjEyMTIsXG5cdFx0XHQtMC4wNTQ3LFxuXHRcdFx0MC4xNjYsXG5cdFx0XHQwLjE4MzIsXG5cdFx0XHQtMC4wMTA1LFxuXHRcdFx0MC4xMzcyLFxuXHRcdFx0MC4yMzQzLFxuXHRcdFx0LTAuMDg1NSxcblx0XHRcdDAuMTI4NCxcblx0XHRcdDAuMTc2MSxcblx0XHRcdC0wLjEzMjksXG5cdFx0XHQwLjE1MzYsXG5cdFx0XHQwLjIyMTksXG5cdFx0XHQtMC4yMzA4LFxuXHRcdFx0MC4xMjI1LFxuXHRcdFx0MC4yNDIsXG5cdFx0XHQtMC4yNzk0LFxuXHRcdFx0MC4xMDg4LFxuXHRcdFx0MC4zMDY1LFxuXHRcdFx0LTAuMjQwNyxcblx0XHRcdDAuMDQxMTcsXG5cdFx0XHQwLjI5MDYsXG5cdFx0XHQtMC4xOTE1LFxuXHRcdFx0MC4wNzAzNyxcblx0XHRcdDAuMTczLFxuXHRcdFx0LTAuMjU3OSxcblx0XHRcdDAuMTUzMyxcblx0XHRcdDAuMTkzNSxcblx0XHRcdC0wLjMwMzMsXG5cdFx0XHQwLjE0NzUsXG5cdFx0XHQwLjI2ODMsXG5cdFx0XHQtMC4xMzk1LFxuXHRcdFx0MC4xMDM0LFxuXHRcdFx0MC4yMDAyLFxuXHRcdFx0LTAuMTgwMyxcblx0XHRcdDAuMTM4MSxcblx0XHRcdDAuMTUzMixcblx0XHRcdC0wLjIwNzEsXG5cdFx0XHQwLjE1OTksXG5cdFx0XHQwLjMxNixcblx0XHRcdC0wLjI4NjksXG5cdFx0XHQwLjAxODQ3LFxuXHRcdFx0MC4yNTY1LFxuXHRcdFx0LTAuMzI0NCxcblx0XHRcdDAuMDk2NTcsXG5cdFx0XHQwLjIwNjIsXG5cdFx0XHQtMC4zMzk5LFxuXHRcdFx0MC4xNDAxLFxuXHRcdFx0MC4zMjA4LFxuXHRcdFx0LTAuMzU4NSxcblx0XHRcdC0wLjAxMjEzLFxuXHRcdFx0MC4yMzg0LFxuXHRcdFx0LTAuNDEyMSxcblx0XHRcdDAuMDk4ODcsXG5cdFx0XHQwLjE5NDIsXG5cdFx0XHQtMC4zOTgsXG5cdFx0XHQwLjE0NDEsXG5cdFx0XHQwLjEzODksXG5cdFx0XHQtMC4zMTk1LFxuXHRcdFx0MC4xOTM3LFxuXHRcdFx0MC4xNDk0LFxuXHRcdFx0LTAuMzM5NCxcblx0XHRcdDAuMTYyMSxcblx0XHRcdDAuMTY3NSxcblx0XHRcdC0wLjMyNDMsXG5cdFx0XHQwLjE2MzQsXG5cdFx0XHQwLjE0NDEsXG5cdFx0XHQtMC4yOTQ3LFxuXHRcdFx0MC4xODcsXG5cdFx0XHQwLjA3NzIsXG5cdFx0XHQtMC40MjkzLFxuXHRcdFx0MC4yMDMyLFxuXHRcdFx0MCxcblx0XHRcdC0wLjQ0MDMsXG5cdFx0XHQwLjIzMTIsXG5cdFx0XHQwLFxuXHRcdFx0LTAuNDc1MSxcblx0XHRcdDAuMjE3MSxcblx0XHRcdDAuMDk1OCxcblx0XHRcdC0wLjQ3MDQsXG5cdFx0XHQwLjE5MTYsXG5cdFx0XHQwLjEyNjYsXG5cdFx0XHQtMC40MDgzLFxuXHRcdFx0MC4xODIsXG5cdFx0XHQwLjE0NzQsXG5cdFx0XHQtMC4zNTM4LFxuXHRcdFx0MC4xNTI1LFxuXHRcdFx0MC4xMTYsXG5cdFx0XHQtMC4zODUsXG5cdFx0XHQwLjE4NTQsXG5cdFx0XHQwLjE2NzksXG5cdFx0XHQtMC4zNzU2LFxuXHRcdFx0MC4xNTUyLFxuXHRcdFx0MC4wODkzLFxuXHRcdFx0LTAuMjg5Mixcblx0XHRcdDAuMjMwNCxcblx0XHRcdDAuMDc1Nixcblx0XHRcdC0wLjMwNDMsXG5cdFx0XHQwLjI0NTIsXG5cdFx0XHQwLjE2Nixcblx0XHRcdC0wLjM0NzgsXG5cdFx0XHQwLjE1MDIsXG5cdFx0XHQwLjE4MTMsXG5cdFx0XHQtMC4zNDQ1LFxuXHRcdFx0MC4xNDk2LFxuXHRcdFx0MC4xNTQyLFxuXHRcdFx0LTAuMzQ2LFxuXHRcdFx0MC4xNDgzLFxuXHRcdFx0MC4xNDE5LFxuXHRcdFx0LTAuMzUyNCxcblx0XHRcdDAuMTQ2Mixcblx0XHRcdDAuMTIxOSxcblx0XHRcdC0wLjMzNjUsXG5cdFx0XHQwLjE3NCxcblx0XHRcdDAuMTQxMSxcblx0XHRcdC0wLjM0Mixcblx0XHRcdDAuMTUzMyxcblx0XHRcdDAuMTMyNSxcblx0XHRcdC0wLjMyODcsXG5cdFx0XHQwLjE4NzcsXG5cdFx0XHQwLjA3MjYsXG5cdFx0XHQtMC4zMjEsXG5cdFx0XHQwLjIzOCxcblx0XHRcdDAuMDY2NSxcblx0XHRcdC0wLjMzMDIsXG5cdFx0XHQwLjIxNzUsXG5cdFx0XHQwLFxuXHRcdFx0LTAuMzA2Nyxcblx0XHRcdDAuMjYxMyxcblx0XHRcdDAsXG5cdFx0XHQtMC4zMjExLFxuXHRcdFx0MC4yNTc5LFxuXHRcdFx0MCxcblx0XHRcdC0wLjMyOTMsXG5cdFx0XHQwLjIzNjQsXG5cdFx0XHQwLjEyNSxcblx0XHRcdC0wLjIxOTcsXG5cdFx0XHQwLjE4MDUsXG5cdFx0XHQwLjA1NTQsXG5cdFx0XHQtMC4yMzQ3LFxuXHRcdFx0MC4yMjkxLFxuXHRcdFx0MC4wNDAzLFxuXHRcdFx0LTAuMjgyLFxuXHRcdFx0MC4yNDYxLFxuXHRcdFx0MCxcblx0XHRcdC0wLjI4ODksXG5cdFx0XHQwLjI1Myxcblx0XHRcdDAuMTA3NCxcblx0XHRcdC0wLjE3NTksXG5cdFx0XHQwLjE4MDYsXG5cdFx0XHQwLjEzNDksXG5cdFx0XHQtMC4xNjMyLFxuXHRcdFx0MC4xNjQ3LFxuXHRcdFx0MCxcblx0XHRcdC0wLjI0MjUsXG5cdFx0XHQwLjIzOTIsXG5cdFx0XHQwLjExODYsXG5cdFx0XHQtMC4xNTExLFxuXHRcdFx0MC4xOCxcblx0XHRcdDAsXG5cdFx0XHQtMC41MjczLFxuXHRcdFx0MC4yMjc0LFxuXHRcdFx0MC4xMTM2LFxuXHRcdFx0LTAuNTE5NCxcblx0XHRcdDAuMTg5Nyxcblx0XHRcdDAuMjI5LFxuXHRcdFx0LTAuNTEwMixcblx0XHRcdDAuMDU4MzcsXG5cdFx0XHQwLjMxODUsXG5cdFx0XHQtMC40Mjg3LFxuXHRcdFx0LTAuMDQ1NDMsXG5cdFx0XHQwLjM1MDEsXG5cdFx0XHQtMC4zODM2LFxuXHRcdFx0LTAuMTAwNCxcblx0XHRcdDAuMzQ1Mixcblx0XHRcdC0wLjMyMDUsXG5cdFx0XHQtMC4wNjUzMyxcblx0XHRcdDAuMzgyMixcblx0XHRcdC0wLjMxMTEsXG5cdFx0XHQtMC4xNzk3LFxuXHRcdFx0MC4zNzQ5LFxuXHRcdFx0LTAuMjYyOCxcblx0XHRcdC0wLjEzNTYsXG5cdFx0XHQwLjQzNzQsXG5cdFx0XHQwLjEzNjQsXG5cdFx0XHQtMC4zMTI1LFxuXHRcdFx0MC40MjkzLFxuXHRcdFx0MC4yMzA4LFxuXHRcdFx0LTAuMzA1OCxcblx0XHRcdDAuMzk2OCxcblx0XHRcdDAuMjM4Mixcblx0XHRcdC0wLjA5NzkzLFxuXHRcdFx0MC40MTY2LFxuXHRcdFx0MC4wNDU2LFxuXHRcdFx0LTAuMTMyNSxcblx0XHRcdDAuNDM4Myxcblx0XHRcdDAuMDUzOCxcblx0XHRcdC0wLjMxMzUsXG5cdFx0XHQwLjQxNDYsXG5cdFx0XHQtMC4wMjc1LFxuXHRcdFx0LTAuMTYwOSxcblx0XHRcdDAuNDA5Nyxcblx0XHRcdC0wLjA4MTcsXG5cdFx0XHQtMC4xODksXG5cdFx0XHQwLjQwODcsXG5cdFx0XHQtMC4xMjU0LFxuXHRcdFx0LTAuMjEyMixcblx0XHRcdDAuNDI4OSxcblx0XHRcdC0wLjA4OTIsXG5cdFx0XHQtMC4yOTIxLFxuXHRcdFx0MC40MzYyLFxuXHRcdFx0LTAuMDE0LFxuXHRcdFx0LTAuMzA1Nyxcblx0XHRcdDAuNDEwNCxcblx0XHRcdC0wLjE4NjMsXG5cdFx0XHQtMC4yNjMzLFxuXHRcdFx0MC4zNTY0LFxuXHRcdFx0MC4zNTg3LFxuXHRcdFx0LTAuMDk4NjMsXG5cdFx0XHQwLjQxMjYsXG5cdFx0XHQwLjM0NSxcblx0XHRcdC0wLjI4MjgsXG5cdFx0XHQwLjM5MDgsXG5cdFx0XHQwLjQ0Nyxcblx0XHRcdC0wLjI0OTIsXG5cdFx0XHQwLjMyNTMsXG5cdFx0XHQwLjQ3NTgsXG5cdFx0XHQtMC4xMjE4LFxuXHRcdFx0MC4xMTgyLFxuXHRcdFx0LTAuNTg5Nyxcblx0XHRcdDAuMTYxNSxcblx0XHRcdDAuMTM4NCxcblx0XHRcdDAuMTM2Nixcblx0XHRcdDAuMTA5OSxcblx0XHRcdDAuMTIyLFxuXHRcdFx0MC4xNDU3LFxuXHRcdFx0MC4xMzgzLFxuXHRcdFx0MC4wODkyLFxuXHRcdFx0MC4xMTAyLFxuXHRcdFx0MC4xMjQzLFxuXHRcdFx0MC4xMTAyLFxuXHRcdFx0MC4xMDc1LFxuXHRcdFx0MC4xMDY3LFxuXHRcdFx0MC4xODkxLFxuXHRcdFx0MC4wNDA1LFxuXHRcdFx0MC4xMjE3LFxuXHRcdFx0MC4xODYxLFxuXHRcdFx0MC4wNjcyLFxuXHRcdFx0MC4xMTUsXG5cdFx0XHQwLjEzNjMsXG5cdFx0XHQwLjA4ODksXG5cdFx0XHQwLjEwOTQsXG5cdFx0XHQwLjEyMDEsXG5cdFx0XHQwLjA2OTksXG5cdFx0XHQwLjEyMzMsXG5cdFx0XHQwLjIzMjMsXG5cdFx0XHQwLjA2MTgsXG5cdFx0XHQwLjEwNTcsXG5cdFx0XHQwLjIzODEsXG5cdFx0XHQwLjAzNTYsXG5cdFx0XHQwLjEwNDUsXG5cdFx0XHQwLjI4NDMsXG5cdFx0XHQwLjA3NzYsXG5cdFx0XHQwLjA3NjA3LFxuXHRcdFx0MC4yOTQ3LFxuXHRcdFx0MC4wNTY3LFxuXHRcdFx0MC4wNjg4Nyxcblx0XHRcdDAuMzM2Nyxcblx0XHRcdDAuMTAyNCxcblx0XHRcdDAuMDIzMzcsXG5cdFx0XHQwLjMyMTUsXG5cdFx0XHQwLjExMDMsXG5cdFx0XHQwLjAzNTY3LFxuXHRcdFx0MC4zMzE4LFxuXHRcdFx0MC4xNDIxLFxuXHRcdFx0MC4wNjYxNyxcblx0XHRcdDAuMzE4NCxcblx0XHRcdDAuMTM0Nixcblx0XHRcdDAuMDYxNzcsXG5cdFx0XHQwLjMwOTksXG5cdFx0XHQwLjI2Myxcblx0XHRcdDAuMTE2MSxcblx0XHRcdDAuMTUxNCxcblx0XHRcdDAuMTI3Myxcblx0XHRcdDAuMTA0Mixcblx0XHRcdDAuMTI4OCxcblx0XHRcdDAuMTA4MSxcblx0XHRcdDAuMDk4ODcsXG5cdFx0XHQwLjE4NTcsXG5cdFx0XHQwLjA5MjcsXG5cdFx0XHQwLjExLFxuXHRcdFx0MC4xNTExLFxuXHRcdFx0MC4xMDY4LFxuXHRcdFx0MC4xMDE1LFxuXHRcdFx0MC4yMjk3LFxuXHRcdFx0MC4wODY5LFxuXHRcdFx0MC4xMDQ4LFxuXHRcdFx0MC4zMDk3LFxuXHRcdFx0MC4xMTYyLFxuXHRcdFx0MC4wNDQxNyxcblx0XHRcdDAuMjc5Nyxcblx0XHRcdDAuMDk2LFxuXHRcdFx0MC4wNzc3Nyxcblx0XHRcdDAuMTQyMixcblx0XHRcdDAuMTEzNSxcblx0XHRcdDAuMDkxMjcsXG5cdFx0XHQwLjIzMzUsXG5cdFx0XHQwLjE3MDEsXG5cdFx0XHQwLjExMDcsXG5cdFx0XHQwLjE4MjMsXG5cdFx0XHQwLjE2LFxuXHRcdFx0MC4xMTAzLFxuXHRcdFx0MC4xODMxLFxuXHRcdFx0MC4xNDgsXG5cdFx0XHQwLjEwNjgsXG5cdFx0XHQwLjIzMjIsXG5cdFx0XHQwLjE1NjgsXG5cdFx0XHQwLjEwOTMsXG5cdFx0XHQwLjI1MjMsXG5cdFx0XHQwLjIxNyxcblx0XHRcdDAuMTYyMSxcblx0XHRcdDAuMTg1Mixcblx0XHRcdDAuMjAxNyxcblx0XHRcdDAuMTc4Mixcblx0XHRcdDAuMTgxMyxcblx0XHRcdDAuMTY0Myxcblx0XHRcdDAuMTM1Myxcblx0XHRcdDAuMjM5OCxcblx0XHRcdDAuMTc0LFxuXHRcdFx0MC4xMzI2LFxuXHRcdFx0MC4xMDg3LFxuXHRcdFx0MC4xNzI1LFxuXHRcdFx0MC4xODU3LFxuXHRcdFx0MC4wNjU2LFxuXHRcdFx0MC4xMTk1LFxuXHRcdFx0MC4xNjU3LFxuXHRcdFx0MC4yNTM4LFxuXHRcdFx0LTAuMDAzNCxcblx0XHRcdDAuMTEyMixcblx0XHRcdDAuMzE4OSxcblx0XHRcdDAuMDI3NCxcblx0XHRcdDAuMDU5NjcsXG5cdFx0XHQwLjM2MjIsXG5cdFx0XHQwLjA4NjIsXG5cdFx0XHQwLjAwNzU2Nyxcblx0XHRcdDAuMzUyMyxcblx0XHRcdDAuMTc2OCxcblx0XHRcdDAuMDczNTcsXG5cdFx0XHQwLjMwNDUsXG5cdFx0XHQwLjIwMzIsXG5cdFx0XHQwLjEyNTYsXG5cdFx0XHQwLjI1MzksXG5cdFx0XHQwLjI4OCxcblx0XHRcdDAuMTY1LFxuXHRcdFx0MC4wMzQxLFxuXHRcdFx0MC4xMjg5LFxuXHRcdFx0MC4yMDQzLFxuXHRcdFx0MC4wNzI4LFxuXHRcdFx0MC4yMzkzLFxuXHRcdFx0MC4yMTksXG5cdFx0XHQwLjM3MDEsXG5cdFx0XHQwLjIxMjgsXG5cdFx0XHQwLjAxODA3LFxuXHRcdFx0MCxcblx0XHRcdDAuMTMxMyxcblx0XHRcdDAuMjE0OCxcblx0XHRcdDAsXG5cdFx0XHQwLjI0MzcsXG5cdFx0XHQwLjIyMzUsXG5cdFx0XHQwLjI1MTEsXG5cdFx0XHQwLjMzNTIsXG5cdFx0XHQwLjE0NjcsXG5cdFx0XHQwLjI1MzMsXG5cdFx0XHQwLjM5NzksXG5cdFx0XHQwLjEwMzcsXG5cdFx0XHQwLjEyLFxuXHRcdFx0MC40MTc1LFxuXHRcdFx0MC4xNjI4LFxuXHRcdFx0MC4xMTg5LFxuXHRcdFx0MC4zMzU3LFxuXHRcdFx0MC4xOTg4LFxuXHRcdFx0MCxcblx0XHRcdDAuNDE5Mixcblx0XHRcdDAuMTc0OCxcblx0XHRcdDAsXG5cdFx0XHQwLjMzMjYsXG5cdFx0XHQwLjIwNTUsXG5cdFx0XHQwLjEyMzUsXG5cdFx0XHQwLjUyNzYsXG5cdFx0XHQwLjA3Nzg3LFxuXHRcdFx0MC4yNDQ5LFxuXHRcdFx0MC41MTE5LFxuXHRcdFx0MC4wMTY1Nyxcblx0XHRcdDAsXG5cdFx0XHQwLjUzNTksXG5cdFx0XHQwLjA5MzA3LFxuXHRcdFx0MC4zMjg2LFxuXHRcdFx0MC41NTExLFxuXHRcdFx0LTAuMTcyLFxuXHRcdFx0MC4yMzgxLFxuXHRcdFx0MC42MDUxLFxuXHRcdFx0LTAuMTAxMSxcblx0XHRcdDAsXG5cdFx0XHQwLjYzNjUsXG5cdFx0XHQtMC4wMjg4Myxcblx0XHRcdDAuMTE5NSxcblx0XHRcdDAuNjI5OCxcblx0XHRcdC0wLjA1MDUzLFxuXHRcdFx0MC4zODg4LFxuXHRcdFx0MC4wNTg0LFxuXHRcdFx0LTAuMDIxMjMsXG5cdFx0XHQwLjM0OTYsXG5cdFx0XHQtMC4wMjI3LFxuXHRcdFx0MC4wNDYxNyxcblx0XHRcdDAuMjg1LFxuXHRcdFx0LTAuMDY0NCxcblx0XHRcdDAuMTAzOSxcblx0XHRcdDAuMzA5LFxuXHRcdFx0LTAuMTE2Nixcblx0XHRcdDAuMDc1MzcsXG5cdFx0XHQwLjMyNDUsXG5cdFx0XHQtMC4xNjgzLFxuXHRcdFx0MC4wMzU4Nyxcblx0XHRcdDAuMzMzOCxcblx0XHRcdC0wLjIxNDgsXG5cdFx0XHQwLjAwMDY2NjcsXG5cdFx0XHQwLjMzODUsXG5cdFx0XHQtMC4yNTY5LFxuXHRcdFx0LTAuMDI4NzMsXG5cdFx0XHQwLjM2MzIsXG5cdFx0XHQtMC4wNjk2LFxuXHRcdFx0MC4wMTU0Nyxcblx0XHRcdDAuMzY3LFxuXHRcdFx0LTAuMTIxMyxcblx0XHRcdC0wLjAyNjUzLFxuXHRcdFx0MC4zNzA1LFxuXHRcdFx0LTAuMTY1Myxcblx0XHRcdC0wLjA2NTAzLFxuXHRcdFx0MC4zNzE5LFxuXHRcdFx0LTAuMjA0NSxcblx0XHRcdC0wLjA5NzAzLFxuXHRcdFx0MC4zMDUyLFxuXHRcdFx0MC4xMjU4LFxuXHRcdFx0MC4wNjQ4Nyxcblx0XHRcdDAuMTI1LFxuXHRcdFx0LTAuMTI3Mixcblx0XHRcdDAuMTcwMixcblx0XHRcdDAuMDg4LFxuXHRcdFx0LTAuMDkwMyxcblx0XHRcdDAuMjMwNSxcblx0XHRcdDAuMTExLFxuXHRcdFx0LTAuMzczMixcblx0XHRcdDAuMTgwNSxcblx0XHRcdDAuMTc5NSxcblx0XHRcdDAuMjc3Nyxcblx0XHRcdDAuMTkxOCxcblx0XHRcdDAuMjkwNSxcblx0XHRcdDAuMTYxNSxcblx0XHRcdDAuMDk5NTcsXG5cdFx0XHQwLjI3OTgsXG5cdFx0XHQwLjE1ODMsXG5cdFx0XHQwLjA4NzE3LFxuXHRcdFx0MC4yNzcyLFxuXHRcdFx0MC4xNDU5LFxuXHRcdFx0MC4wODU2Nyxcblx0XHRcdDAuMTA2Nixcblx0XHRcdC0wLjM2NjEsXG5cdFx0XHQwLjE3MjQsXG5cdFx0XHQwLFxuXHRcdFx0LTAuNjA1Myxcblx0XHRcdDAuMTk2NSxcblx0XHRcdDAuMDcxMSxcblx0XHRcdC0wLjQwODcsXG5cdFx0XHQwLjIxNjEsXG5cdFx0XHQwLjA2NzcsXG5cdFx0XHQtMC4zODkzLFxuXHRcdFx0MC4yMTEyLFxuXHRcdFx0MCxcblx0XHRcdC0wLjQxNTIsXG5cdFx0XHQwLjI0NCxcblx0XHRcdDAsXG5cdFx0XHQtMC4zOTIsXG5cdFx0XHQwLjIzOTYsXG5cdFx0XHQwLjA2NjMsXG5cdFx0XHQtMC4zODEzLFxuXHRcdFx0MC4xOTkxLFxuXHRcdFx0MCxcblx0XHRcdC0wLjM4MjksXG5cdFx0XHQwLjIyNzksXG5cdFx0XHQtMC4wMzgyLFxuXHRcdFx0LTAuMDYzNyxcblx0XHRcdDAuMjg5OCxcblx0XHRcdC0wLjAzODUsXG5cdFx0XHQtMC4xMDQ2LFxuXHRcdFx0MC4zMTk1LFxuXHRcdFx0LTAuMDM2Mixcblx0XHRcdDAuMDgxNixcblx0XHRcdDAuMjEzOSxcblx0XHRcdC0wLjA0MjQsXG5cdFx0XHQtMC4wMDg2LFxuXHRcdFx0MC4yNTI2LFxuXHRcdFx0LTAuMDc1LFxuXHRcdFx0MC4wNDU4LFxuXHRcdFx0MC4xNjk5LFxuXHRcdFx0LTAuMDc2OCxcblx0XHRcdC0wLjA0MTQsXG5cdFx0XHQwLjE5NDksXG5cdFx0XHQtMC4wMzg1LFxuXHRcdFx0LTAuMTQ5LFxuXHRcdFx0MC4zMjI4LFxuXHRcdFx0LTAuMDkxNSxcblx0XHRcdC0wLjE1MTQsXG5cdFx0XHQwLjI1NTYsXG5cdFx0XHQtMC4wOTMsXG5cdFx0XHQtMC4xMTk5LFxuXHRcdFx0MC4yNDU2LFxuXHRcdFx0LTAuMDMzOSxcblx0XHRcdC0wLjE3NzUsXG5cdFx0XHQwLjMwMTUsXG5cdFx0XHQtMC4wODAzLFxuXHRcdFx0LTAuMTcxMSxcblx0XHRcdDAuMjU4Nyxcblx0XHRcdC0wLjAxNDcsXG5cdFx0XHQtMC4xOTAzLFxuXHRcdFx0MC4yNzYxLFxuXHRcdFx0LTAuMDMwOCxcblx0XHRcdC0wLjIwMSxcblx0XHRcdDAuMjQzLFxuXHRcdFx0LTAuMTIxMixcblx0XHRcdC0wLjA1NDcsXG5cdFx0XHQwLjE2Nixcblx0XHRcdC0wLjE4MzIsXG5cdFx0XHQtMC4wMTA1LFxuXHRcdFx0MC4xMzcyLFxuXHRcdFx0LTAuMjM0Myxcblx0XHRcdC0wLjA4NTUsXG5cdFx0XHQwLjEyODQsXG5cdFx0XHQtMC4xNzYxLFxuXHRcdFx0LTAuMTMyOSxcblx0XHRcdDAuMTUzNixcblx0XHRcdC0wLjIyMTksXG5cdFx0XHQtMC4yMzA4LFxuXHRcdFx0MC4xMjI1LFxuXHRcdFx0LTAuMzA2NSxcblx0XHRcdC0wLjI0MDcsXG5cdFx0XHQwLjA0MTE3LFxuXHRcdFx0LTAuMjQyLFxuXHRcdFx0LTAuMjc5NCxcblx0XHRcdDAuMTA4OCxcblx0XHRcdC0wLjI5MDYsXG5cdFx0XHQtMC4xOTE1LFxuXHRcdFx0MC4wNzAzNyxcblx0XHRcdC0wLjE3Myxcblx0XHRcdC0wLjI1NzksXG5cdFx0XHQwLjE1MzMsXG5cdFx0XHQtMC4xOTM1LFxuXHRcdFx0LTAuMzAzMyxcblx0XHRcdDAuMTQ3NSxcblx0XHRcdC0wLjIwMDIsXG5cdFx0XHQtMC4xODAzLFxuXHRcdFx0MC4xMzgxLFxuXHRcdFx0LTAuMjY4Myxcblx0XHRcdC0wLjEzOTUsXG5cdFx0XHQwLjEwMzQsXG5cdFx0XHQtMC4xNTMyLFxuXHRcdFx0LTAuMjA3MSxcblx0XHRcdDAuMTU5OSxcblx0XHRcdC0wLjMxNixcblx0XHRcdC0wLjI4NjksXG5cdFx0XHQwLjAxODQ3LFxuXHRcdFx0LTAuMjU2NSxcblx0XHRcdC0wLjMyNDQsXG5cdFx0XHQwLjA5NjU3LFxuXHRcdFx0LTAuMjA2Mixcblx0XHRcdC0wLjMzOTksXG5cdFx0XHQwLjE0MDEsXG5cdFx0XHQtMC4zMjA4LFxuXHRcdFx0LTAuMzU4NSxcblx0XHRcdC0wLjAxMjEzLFxuXHRcdFx0LTAuMjM4NCxcblx0XHRcdC0wLjQxMjEsXG5cdFx0XHQwLjA5ODg3LFxuXHRcdFx0LTAuMTk0Mixcblx0XHRcdC0wLjM5OCxcblx0XHRcdDAuMTQ0MSxcblx0XHRcdC0wLjEzODksXG5cdFx0XHQtMC4zMTk1LFxuXHRcdFx0MC4xOTM3LFxuXHRcdFx0LTAuMTQ0MSxcblx0XHRcdC0wLjI5NDcsXG5cdFx0XHQwLjE4Nyxcblx0XHRcdC0wLjE2NzUsXG5cdFx0XHQtMC4zMjQzLFxuXHRcdFx0MC4xNjM0LFxuXHRcdFx0LTAuMTQ5NCxcblx0XHRcdC0wLjMzOTQsXG5cdFx0XHQwLjE2MjEsXG5cdFx0XHQtMC4wNzcyLFxuXHRcdFx0LTAuNDI5Myxcblx0XHRcdDAuMjAzMixcblx0XHRcdC0wLjA5NTgsXG5cdFx0XHQtMC40NzA0LFxuXHRcdFx0MC4xOTE2LFxuXHRcdFx0LTAuMTI2Nixcblx0XHRcdC0wLjQwODMsXG5cdFx0XHQwLjE4Mixcblx0XHRcdC0wLjE0NzQsXG5cdFx0XHQtMC4zNTM4LFxuXHRcdFx0MC4xNTI1LFxuXHRcdFx0LTAuMTY3OSxcblx0XHRcdC0wLjM3NTYsXG5cdFx0XHQwLjE1NTIsXG5cdFx0XHQtMC4xMTYsXG5cdFx0XHQtMC4zODUsXG5cdFx0XHQwLjE4NTQsXG5cdFx0XHQtMC4wNzU2LFxuXHRcdFx0LTAuMzA0Myxcblx0XHRcdDAuMjQ1Mixcblx0XHRcdC0wLjA4OTMsXG5cdFx0XHQtMC4yODkyLFxuXHRcdFx0MC4yMzA0LFxuXHRcdFx0LTAuMTY2LFxuXHRcdFx0LTAuMzQ3OCxcblx0XHRcdDAuMTUwMixcblx0XHRcdC0wLjE4MTMsXG5cdFx0XHQtMC4zNDQ1LFxuXHRcdFx0MC4xNDk2LFxuXHRcdFx0LTAuMTU0Mixcblx0XHRcdC0wLjM0Nixcblx0XHRcdDAuMTQ4Myxcblx0XHRcdC0wLjE0MTksXG5cdFx0XHQtMC4zNTI0LFxuXHRcdFx0MC4xNDYyLFxuXHRcdFx0LTAuMTIxOSxcblx0XHRcdC0wLjMzNjUsXG5cdFx0XHQwLjE3NCxcblx0XHRcdC0wLjEzMjUsXG5cdFx0XHQtMC4zMjg3LFxuXHRcdFx0MC4xODc3LFxuXHRcdFx0LTAuMTQxMSxcblx0XHRcdC0wLjM0Mixcblx0XHRcdDAuMTUzMyxcblx0XHRcdC0wLjA3MjYsXG5cdFx0XHQtMC4zMjEsXG5cdFx0XHQwLjIzOCxcblx0XHRcdC0wLjA2NjUsXG5cdFx0XHQtMC4zMzAyLFxuXHRcdFx0MC4yMTc1LFxuXHRcdFx0LTAuMTI1LFxuXHRcdFx0LTAuMjE5Nyxcblx0XHRcdDAuMTgwNSxcblx0XHRcdC0wLjA1NTQsXG5cdFx0XHQtMC4yMzQ3LFxuXHRcdFx0MC4yMjkxLFxuXHRcdFx0LTAuMDQwMyxcblx0XHRcdC0wLjI4Mixcblx0XHRcdDAuMjQ2MSxcblx0XHRcdC0wLjEwNzQsXG5cdFx0XHQtMC4xNzU5LFxuXHRcdFx0MC4xODA2LFxuXHRcdFx0LTAuMTM0OSxcblx0XHRcdC0wLjE2MzIsXG5cdFx0XHQwLjE2NDcsXG5cdFx0XHQtMC4xMTg2LFxuXHRcdFx0LTAuMTUxMSxcblx0XHRcdDAuMTgsXG5cdFx0XHQtMC4xMTM2LFxuXHRcdFx0LTAuNTE5NCxcblx0XHRcdDAuMTg5Nyxcblx0XHRcdC0wLjIyOSxcblx0XHRcdC0wLjUxMDIsXG5cdFx0XHQwLjA1ODM3LFxuXHRcdFx0LTAuMzE4NSxcblx0XHRcdC0wLjQyODcsXG5cdFx0XHQtMC4wNDU0Myxcblx0XHRcdC0wLjM0NTIsXG5cdFx0XHQtMC4zMjA1LFxuXHRcdFx0LTAuMDY1MzMsXG5cdFx0XHQtMC4zNTAxLFxuXHRcdFx0LTAuMzgzNixcblx0XHRcdC0wLjEwMDQsXG5cdFx0XHQtMC4zODIyLFxuXHRcdFx0LTAuMzExMSxcblx0XHRcdC0wLjE3OTcsXG5cdFx0XHQtMC4zNzQ5LFxuXHRcdFx0LTAuMjYyOCxcblx0XHRcdC0wLjEzNTYsXG5cdFx0XHQtMC40Mzc0LFxuXHRcdFx0MC4xMzY0LFxuXHRcdFx0LTAuMzEyNSxcblx0XHRcdC0wLjM5NjgsXG5cdFx0XHQwLjIzODIsXG5cdFx0XHQtMC4wOTc5Myxcblx0XHRcdC0wLjQyOTMsXG5cdFx0XHQwLjIzMDgsXG5cdFx0XHQtMC4zMDU4LFxuXHRcdFx0LTAuNDE2Nixcblx0XHRcdDAuMDQ1Nixcblx0XHRcdC0wLjEzMjUsXG5cdFx0XHQtMC40MzgzLFxuXHRcdFx0MC4wNTM4LFxuXHRcdFx0LTAuMzEzNSxcblx0XHRcdC0wLjQxNDYsXG5cdFx0XHQtMC4wMjc1LFxuXHRcdFx0LTAuMTYwOSxcblx0XHRcdC0wLjQwOTcsXG5cdFx0XHQtMC4wODE3LFxuXHRcdFx0LTAuMTg5LFxuXHRcdFx0LTAuNDI4OSxcblx0XHRcdC0wLjA4OTIsXG5cdFx0XHQtMC4yOTIxLFxuXHRcdFx0LTAuNDA4Nyxcblx0XHRcdC0wLjEyNTQsXG5cdFx0XHQtMC4yMTIyLFxuXHRcdFx0LTAuNDM2Mixcblx0XHRcdC0wLjAxNCxcblx0XHRcdC0wLjMwNTcsXG5cdFx0XHQtMC40MTA0LFxuXHRcdFx0LTAuMTg2Myxcblx0XHRcdC0wLjI2MzMsXG5cdFx0XHQtMC4zNTY0LFxuXHRcdFx0MC4zNTg3LFxuXHRcdFx0LTAuMDk4NjMsXG5cdFx0XHQtMC40MTI2LFxuXHRcdFx0MC4zNDUsXG5cdFx0XHQtMC4yODI4LFxuXHRcdFx0LTAuMzkwOCxcblx0XHRcdDAuNDQ3LFxuXHRcdFx0LTAuMjQ5Mixcblx0XHRcdC0wLjMyNTMsXG5cdFx0XHQwLjQ3NTgsXG5cdFx0XHQtMC4xMjE4LFxuXHRcdFx0LTAuMTE4Mixcblx0XHRcdC0wLjU4OTcsXG5cdFx0XHQwLjE2MTUsXG5cdFx0XHQtMC4xMzg0LFxuXHRcdFx0MC4xMzY2LFxuXHRcdFx0MC4xMDk5LFxuXHRcdFx0LTAuMDg5Mixcblx0XHRcdDAuMTEwMixcblx0XHRcdDAuMTI0Myxcblx0XHRcdC0wLjEyMixcblx0XHRcdDAuMTQ1Nyxcblx0XHRcdDAuMTM4Myxcblx0XHRcdC0wLjExMDIsXG5cdFx0XHQwLjEwNzUsXG5cdFx0XHQwLjEwNjcsXG5cdFx0XHQtMC4xODkxLFxuXHRcdFx0MC4wNDA1LFxuXHRcdFx0MC4xMjE3LFxuXHRcdFx0LTAuMTM2Myxcblx0XHRcdDAuMDg4OSxcblx0XHRcdDAuMTA5NCxcblx0XHRcdC0wLjE4NjEsXG5cdFx0XHQwLjA2NzIsXG5cdFx0XHQwLjExNSxcblx0XHRcdC0wLjEyMDEsXG5cdFx0XHQwLjA2OTksXG5cdFx0XHQwLjEyMzMsXG5cdFx0XHQtMC4yMzIzLFxuXHRcdFx0MC4wNjE4LFxuXHRcdFx0MC4xMDU3LFxuXHRcdFx0LTAuMjM4MSxcblx0XHRcdDAuMDM1Nixcblx0XHRcdDAuMTA0NSxcblx0XHRcdC0wLjI4NDMsXG5cdFx0XHQwLjA3NzYsXG5cdFx0XHQwLjA3NjA3LFxuXHRcdFx0LTAuMzM2Nyxcblx0XHRcdDAuMTAyNCxcblx0XHRcdDAuMDIzMzcsXG5cdFx0XHQtMC4yOTQ3LFxuXHRcdFx0MC4wNTY3LFxuXHRcdFx0MC4wNjg4Nyxcblx0XHRcdC0wLjMyMTUsXG5cdFx0XHQwLjExMDMsXG5cdFx0XHQwLjAzNTY3LFxuXHRcdFx0LTAuMzMxOCxcblx0XHRcdDAuMTQyMSxcblx0XHRcdDAuMDY2MTcsXG5cdFx0XHQtMC4zMTg0LFxuXHRcdFx0MC4xMzQ2LFxuXHRcdFx0MC4wNjE3Nyxcblx0XHRcdC0wLjMwOTksXG5cdFx0XHQwLjI2Myxcblx0XHRcdDAuMTE2MSxcblx0XHRcdC0wLjE1MTQsXG5cdFx0XHQwLjEyNzMsXG5cdFx0XHQwLjEwNDIsXG5cdFx0XHQtMC4xMjg4LFxuXHRcdFx0MC4xMDgxLFxuXHRcdFx0MC4wOTg4Nyxcblx0XHRcdC0wLjE1MTEsXG5cdFx0XHQwLjEwNjgsXG5cdFx0XHQwLjEwMTUsXG5cdFx0XHQtMC4xODU3LFxuXHRcdFx0MC4wOTI3LFxuXHRcdFx0MC4xMSxcblx0XHRcdC0wLjIyOTcsXG5cdFx0XHQwLjA4NjksXG5cdFx0XHQwLjEwNDgsXG5cdFx0XHQtMC4zMDk3LFxuXHRcdFx0MC4xMTYyLFxuXHRcdFx0MC4wNDQxNyxcblx0XHRcdC0wLjI3OTcsXG5cdFx0XHQwLjA5Nixcblx0XHRcdDAuMDc3NzcsXG5cdFx0XHQtMC4xNDIyLFxuXHRcdFx0MC4xMTM1LFxuXHRcdFx0MC4wOTEyNyxcblx0XHRcdC0wLjIzMzUsXG5cdFx0XHQwLjE3MDEsXG5cdFx0XHQwLjExMDcsXG5cdFx0XHQtMC4yMzIyLFxuXHRcdFx0MC4xNTY4LFxuXHRcdFx0MC4xMDkzLFxuXHRcdFx0LTAuMTgzMSxcblx0XHRcdDAuMTQ4LFxuXHRcdFx0MC4xMDY4LFxuXHRcdFx0LTAuMTgyMyxcblx0XHRcdDAuMTYsXG5cdFx0XHQwLjExMDMsXG5cdFx0XHQtMC4yNTIzLFxuXHRcdFx0MC4yMTcsXG5cdFx0XHQwLjE2MjEsXG5cdFx0XHQtMC4yMzk4LFxuXHRcdFx0MC4xNzQsXG5cdFx0XHQwLjEzMjYsXG5cdFx0XHQtMC4xODEzLFxuXHRcdFx0MC4xNjQzLFxuXHRcdFx0MC4xMzUzLFxuXHRcdFx0LTAuMTg1Mixcblx0XHRcdDAuMjAxNyxcblx0XHRcdDAuMTc4Mixcblx0XHRcdC0wLjEwODcsXG5cdFx0XHQwLjE3MjUsXG5cdFx0XHQwLjE4NTcsXG5cdFx0XHQtMC4wNjU2LFxuXHRcdFx0MC4xMTk1LFxuXHRcdFx0MC4xNjU3LFxuXHRcdFx0LTAuMjUzOCxcblx0XHRcdC0wLjAwMzQsXG5cdFx0XHQwLjExMjIsXG5cdFx0XHQtMC4zMTg5LFxuXHRcdFx0MC4wMjc0LFxuXHRcdFx0MC4wNTk2Nyxcblx0XHRcdC0wLjM2MjIsXG5cdFx0XHQwLjA4NjIsXG5cdFx0XHQwLjAwNzU2Nyxcblx0XHRcdC0wLjM1MjMsXG5cdFx0XHQwLjE3NjgsXG5cdFx0XHQwLjA3MzU3LFxuXHRcdFx0LTAuMjUzOSxcblx0XHRcdDAuMjg4LFxuXHRcdFx0MC4xNjUsXG5cdFx0XHQtMC4zMDQ1LFxuXHRcdFx0MC4yMDMyLFxuXHRcdFx0MC4xMjU2LFxuXHRcdFx0LTAuMDM0MSxcblx0XHRcdDAuMTI4OSxcblx0XHRcdDAuMjA0Myxcblx0XHRcdC0wLjA3MjgsXG5cdFx0XHQwLjIzOTMsXG5cdFx0XHQwLjIxOSxcblx0XHRcdC0wLjM3MDEsXG5cdFx0XHQwLjIxMjgsXG5cdFx0XHQwLjAxODA3LFxuXHRcdFx0LTAuMjUxMSxcblx0XHRcdDAuMzM1Mixcblx0XHRcdDAuMTQ2Nyxcblx0XHRcdC0wLjEyLFxuXHRcdFx0MC40MTc1LFxuXHRcdFx0MC4xNjI4LFxuXHRcdFx0LTAuMjUzMyxcblx0XHRcdDAuMzk3OSxcblx0XHRcdDAuMTAzNyxcblx0XHRcdC0wLjExODksXG5cdFx0XHQwLjMzNTcsXG5cdFx0XHQwLjE5ODgsXG5cdFx0XHQtMC4xMjM1LFxuXHRcdFx0MC41Mjc2LFxuXHRcdFx0MC4wNzc4Nyxcblx0XHRcdC0wLjI0NDksXG5cdFx0XHQwLjUxMTksXG5cdFx0XHQwLjAxNjU3LFxuXHRcdFx0LTAuMzI4Nixcblx0XHRcdDAuNTUxMSxcblx0XHRcdC0wLjE3Mixcblx0XHRcdC0wLjIzODEsXG5cdFx0XHQwLjYwNTEsXG5cdFx0XHQtMC4xMDExLFxuXHRcdFx0LTAuMTE5NSxcblx0XHRcdDAuNjI5OCxcblx0XHRcdC0wLjA1MDUzLFxuXHRcdFx0LTAuMzg4OCxcblx0XHRcdDAuMDU4NCxcblx0XHRcdC0wLjAyMTIzLFxuXHRcdFx0LTAuMzQ5Nixcblx0XHRcdC0wLjAyMjcsXG5cdFx0XHQwLjA0NjE3LFxuXHRcdFx0LTAuMjg1LFxuXHRcdFx0LTAuMDY0NCxcblx0XHRcdDAuMTAzOSxcblx0XHRcdC0wLjMwOSxcblx0XHRcdC0wLjExNjYsXG5cdFx0XHQwLjA3NTM3LFxuXHRcdFx0LTAuMzI0NSxcblx0XHRcdC0wLjE2ODMsXG5cdFx0XHQwLjAzNTg3LFxuXHRcdFx0LTAuMzMzOCxcblx0XHRcdC0wLjIxNDgsXG5cdFx0XHQwLjAwMDY2NjcsXG5cdFx0XHQtMC4zMzg1LFxuXHRcdFx0LTAuMjU2OSxcblx0XHRcdC0wLjAyODczLFxuXHRcdFx0LTAuMzYzMixcblx0XHRcdC0wLjA2OTYsXG5cdFx0XHQwLjAxNTQ3LFxuXHRcdFx0LTAuMzY3LFxuXHRcdFx0LTAuMTIxMyxcblx0XHRcdC0wLjAyNjUzLFxuXHRcdFx0LTAuMzcwNSxcblx0XHRcdC0wLjE2NTMsXG5cdFx0XHQtMC4wNjUwMyxcblx0XHRcdC0wLjM3MTksXG5cdFx0XHQtMC4yMDQ1LFxuXHRcdFx0LTAuMDk3MDMsXG5cdFx0XHQtMC4zMDUyLFxuXHRcdFx0MC4xMjU4LFxuXHRcdFx0MC4wNjQ4Nyxcblx0XHRcdC0wLjEyNSxcblx0XHRcdC0wLjEyNzIsXG5cdFx0XHQwLjE3MDIsXG5cdFx0XHQtMC4wODgsXG5cdFx0XHQtMC4wOTAzLFxuXHRcdFx0MC4yMzA1LFxuXHRcdFx0LTAuMTExLFxuXHRcdFx0LTAuMzczMixcblx0XHRcdDAuMTgwNSxcblx0XHRcdC0wLjE3OTUsXG5cdFx0XHQwLjI3NzcsXG5cdFx0XHQwLjE5MTgsXG5cdFx0XHQtMC4yOTA1LFxuXHRcdFx0MC4xNjE1LFxuXHRcdFx0MC4wOTk1Nyxcblx0XHRcdC0wLjI3OTgsXG5cdFx0XHQwLjE1ODMsXG5cdFx0XHQwLjA4NzE3LFxuXHRcdFx0LTAuMjc3Mixcblx0XHRcdDAuMTQ1OSxcblx0XHRcdDAuMDg1NjcsXG5cdFx0XHQtMC4xMDY2LFxuXHRcdFx0LTAuMzY2MSxcblx0XHRcdDAuMTcyNCxcblx0XHRcdC0wLjA3MTEsXG5cdFx0XHQtMC40MDg3LFxuXHRcdFx0MC4yMTYxLFxuXHRcdFx0LTAuMDY3Nyxcblx0XHRcdC0wLjM4OTMsXG5cdFx0XHQwLjIxMTIsXG5cdFx0XHQtMC4wNjYzLFxuXHRcdFx0LTAuMzgxMyxcblx0XHRcdDAuMTk5MVxuXHRcdF0sXG5cdFx0XCJpbmRleFwiOiBbXG5cdFx0XHQyLFxuXHRcdFx0MCxcblx0XHRcdDEsXG5cdFx0XHQwLFxuXHRcdFx0Mixcblx0XHRcdDMsXG5cdFx0XHQ2LFxuXHRcdFx0NCxcblx0XHRcdDUsXG5cdFx0XHQ0LFxuXHRcdFx0Nixcblx0XHRcdDcsXG5cdFx0XHQ3LFxuXHRcdFx0OCxcblx0XHRcdDQsXG5cdFx0XHQ4LFxuXHRcdFx0Nyxcblx0XHRcdDksXG5cdFx0XHQxMCxcblx0XHRcdDMsXG5cdFx0XHQyLFxuXHRcdFx0Myxcblx0XHRcdDEwLFxuXHRcdFx0MTEsXG5cdFx0XHQxMixcblx0XHRcdDMsXG5cdFx0XHQxMSxcblx0XHRcdDMsXG5cdFx0XHQxMixcblx0XHRcdDEzLFxuXHRcdFx0MTUsXG5cdFx0XHQxMCxcblx0XHRcdDE0LFxuXHRcdFx0MTAsXG5cdFx0XHQxNSxcblx0XHRcdDExLFxuXHRcdFx0MTYsXG5cdFx0XHQxMSxcblx0XHRcdDE1LFxuXHRcdFx0MTEsXG5cdFx0XHQxNixcblx0XHRcdDEyLFxuXHRcdFx0MTQsXG5cdFx0XHQxNyxcblx0XHRcdDE1LFxuXHRcdFx0MTcsXG5cdFx0XHQxNCxcblx0XHRcdDE4LFxuXHRcdFx0MTgsXG5cdFx0XHQxOSxcblx0XHRcdDE3LFxuXHRcdFx0MTksXG5cdFx0XHQxOCxcblx0XHRcdDIwLFxuXHRcdFx0MTcsXG5cdFx0XHQxNixcblx0XHRcdDE1LFxuXHRcdFx0MTYsXG5cdFx0XHQxNyxcblx0XHRcdDE5LFxuXHRcdFx0MCxcblx0XHRcdDYsXG5cdFx0XHQxLFxuXHRcdFx0Nixcblx0XHRcdDAsXG5cdFx0XHQ3LFxuXHRcdFx0OSxcblx0XHRcdDIxLFxuXHRcdFx0OCxcblx0XHRcdDIxLFxuXHRcdFx0MjIsXG5cdFx0XHQ4LFxuXHRcdFx0MjEsXG5cdFx0XHQyMyxcblx0XHRcdDIyLFxuXHRcdFx0MjMsXG5cdFx0XHQyMSxcblx0XHRcdDI0LFxuXHRcdFx0MjcsXG5cdFx0XHQyNSxcblx0XHRcdDI2LFxuXHRcdFx0MjUsXG5cdFx0XHQyNyxcblx0XHRcdDI4LFxuXHRcdFx0MjYsXG5cdFx0XHQyOSxcblx0XHRcdDMwLFxuXHRcdFx0MjksXG5cdFx0XHQyNixcblx0XHRcdDI1LFxuXHRcdFx0MzIsXG5cdFx0XHQyOCxcblx0XHRcdDMxLFxuXHRcdFx0MjgsXG5cdFx0XHQzMixcblx0XHRcdDI1LFxuXHRcdFx0MzMsXG5cdFx0XHQyNSxcblx0XHRcdDMyLFxuXHRcdFx0MjUsXG5cdFx0XHQzMyxcblx0XHRcdDI5LFxuXHRcdFx0MjYsXG5cdFx0XHQzNCxcblx0XHRcdDI3LFxuXHRcdFx0MzQsXG5cdFx0XHQyNixcblx0XHRcdDM1LFxuXHRcdFx0MzAsXG5cdFx0XHQzNSxcblx0XHRcdDI2LFxuXHRcdFx0MzUsXG5cdFx0XHQzMCxcblx0XHRcdDM2LFxuXHRcdFx0MzUsXG5cdFx0XHQzNyxcblx0XHRcdDM0LFxuXHRcdFx0MzcsXG5cdFx0XHQzNSxcblx0XHRcdDM4LFxuXHRcdFx0MzYsXG5cdFx0XHQzOCxcblx0XHRcdDM1LFxuXHRcdFx0MzgsXG5cdFx0XHQzNixcblx0XHRcdDM5LFxuXHRcdFx0NDMsXG5cdFx0XHQ0MCxcblx0XHRcdDQxLFxuXHRcdFx0NDMsXG5cdFx0XHQ0MSxcblx0XHRcdDQyLFxuXHRcdFx0NDcsXG5cdFx0XHQ0NCxcblx0XHRcdDQ1LFxuXHRcdFx0NDcsXG5cdFx0XHQ0NSxcblx0XHRcdDQ2LFxuXHRcdFx0NDgsXG5cdFx0XHQ0NCxcblx0XHRcdDQ3LFxuXHRcdFx0NTEsXG5cdFx0XHQ0OSxcblx0XHRcdDUwLFxuXHRcdFx0NTEsXG5cdFx0XHQ1MCxcblx0XHRcdDQ4LFxuXHRcdFx0NTMsXG5cdFx0XHQ0MCxcblx0XHRcdDQzLFxuXHRcdFx0NTMsXG5cdFx0XHQ0Myxcblx0XHRcdDUyLFxuXHRcdFx0NDEsXG5cdFx0XHQ1NCxcblx0XHRcdDU1LFxuXHRcdFx0NDEsXG5cdFx0XHQ1NSxcblx0XHRcdDQyLFxuXHRcdFx0NTYsXG5cdFx0XHQ0OSxcblx0XHRcdDU0LFxuXHRcdFx0NTYsXG5cdFx0XHQ1Nyxcblx0XHRcdDQ5LFxuXHRcdFx0NjAsXG5cdFx0XHQ1OCxcblx0XHRcdDU5LFxuXHRcdFx0NjAsXG5cdFx0XHQ1OSxcblx0XHRcdDQxLFxuXHRcdFx0NTYsXG5cdFx0XHQ0MSxcblx0XHRcdDU5LFxuXHRcdFx0NjEsXG5cdFx0XHQ2MCxcblx0XHRcdDQwLFxuXHRcdFx0NjEsXG5cdFx0XHQ0MCxcblx0XHRcdDUzLFxuXHRcdFx0NjAsXG5cdFx0XHQ0MSxcblx0XHRcdDQwLFxuXHRcdFx0NDEsXG5cdFx0XHQ1Nixcblx0XHRcdDU0LFxuXHRcdFx0NjIsXG5cdFx0XHQ1OCxcblx0XHRcdDYwLFxuXHRcdFx0NjIsXG5cdFx0XHQ2MCxcblx0XHRcdDYxLFxuXHRcdFx0NTUsXG5cdFx0XHQ1NCxcblx0XHRcdDQ5LFxuXHRcdFx0NTUsXG5cdFx0XHQ0OSxcblx0XHRcdDUxLFxuXHRcdFx0NjQsXG5cdFx0XHQ2MSxcblx0XHRcdDUzLFxuXHRcdFx0NjQsXG5cdFx0XHQ1Myxcblx0XHRcdDYzLFxuXHRcdFx0NjUsXG5cdFx0XHQ2Mixcblx0XHRcdDYxLFxuXHRcdFx0NjUsXG5cdFx0XHQ2MSxcblx0XHRcdDY0LFxuXHRcdFx0MzYsXG5cdFx0XHQ1MSxcblx0XHRcdDM5LFxuXHRcdFx0NTEsXG5cdFx0XHQzNixcblx0XHRcdDU1LFxuXHRcdFx0MzYsXG5cdFx0XHQ0Mixcblx0XHRcdDU1LFxuXHRcdFx0NDIsXG5cdFx0XHQzNixcblx0XHRcdDMwLFxuXHRcdFx0MzAsXG5cdFx0XHQ0Myxcblx0XHRcdDQyLFxuXHRcdFx0NDMsXG5cdFx0XHQzMCxcblx0XHRcdDI5LFxuXHRcdFx0NjYsXG5cdFx0XHQyOSxcblx0XHRcdDMzLFxuXHRcdFx0MjksXG5cdFx0XHQ2Nixcblx0XHRcdDQzLFxuXHRcdFx0NjYsXG5cdFx0XHQ2Nyxcblx0XHRcdDUyLFxuXHRcdFx0NjYsXG5cdFx0XHQ1Mixcblx0XHRcdDQzLFxuXHRcdFx0NjgsXG5cdFx0XHQ2Myxcblx0XHRcdDUzLFxuXHRcdFx0NjksXG5cdFx0XHQ2Myxcblx0XHRcdDY4LFxuXHRcdFx0MzMsXG5cdFx0XHQ3MCxcblx0XHRcdDY2LFxuXHRcdFx0NzAsXG5cdFx0XHQzMyxcblx0XHRcdDcxLFxuXHRcdFx0NzAsXG5cdFx0XHQ2Nyxcblx0XHRcdDY2LFxuXHRcdFx0NjcsXG5cdFx0XHQ3MCxcblx0XHRcdDE5LFxuXHRcdFx0NjcsXG5cdFx0XHQyMCxcblx0XHRcdDcyLFxuXHRcdFx0MjAsXG5cdFx0XHQ2Nyxcblx0XHRcdDE5LFxuXHRcdFx0MzIsXG5cdFx0XHQ3MSxcblx0XHRcdDMzLFxuXHRcdFx0NzEsXG5cdFx0XHQzMixcblx0XHRcdDI0LFxuXHRcdFx0MzEsXG5cdFx0XHQyNCxcblx0XHRcdDMyLFxuXHRcdFx0MjQsXG5cdFx0XHQzMSxcblx0XHRcdDIzLFxuXHRcdFx0MTYsXG5cdFx0XHQ3MCxcblx0XHRcdDEyLFxuXHRcdFx0NzAsXG5cdFx0XHQxNixcblx0XHRcdDE5LFxuXHRcdFx0NzEsXG5cdFx0XHQ3Myxcblx0XHRcdDcwLFxuXHRcdFx0NDYsXG5cdFx0XHQ3NCxcblx0XHRcdDc1LFxuXHRcdFx0NDYsXG5cdFx0XHQ3NSxcblx0XHRcdDQ3LFxuXHRcdFx0NzIsXG5cdFx0XHQ2OSxcblx0XHRcdDY4LFxuXHRcdFx0MzcsXG5cdFx0XHQ3Nixcblx0XHRcdDc3LFxuXHRcdFx0NzYsXG5cdFx0XHQzNyxcblx0XHRcdDM4LFxuXHRcdFx0NzksXG5cdFx0XHQ3Nyxcblx0XHRcdDc4LFxuXHRcdFx0NzcsXG5cdFx0XHQ3OSxcblx0XHRcdDM3LFxuXHRcdFx0NzksXG5cdFx0XHQ4MCxcblx0XHRcdDgxLFxuXHRcdFx0ODAsXG5cdFx0XHQ3OSxcblx0XHRcdDc4LFxuXHRcdFx0ODQsXG5cdFx0XHQ4Mixcblx0XHRcdDgzLFxuXHRcdFx0ODIsXG5cdFx0XHQ4NCxcblx0XHRcdDg1LFxuXHRcdFx0ODUsXG5cdFx0XHQ4Nixcblx0XHRcdDgyLFxuXHRcdFx0ODYsXG5cdFx0XHQ4NSxcblx0XHRcdDg3LFxuXHRcdFx0OTAsXG5cdFx0XHQ4OCxcblx0XHRcdDg5LFxuXHRcdFx0ODgsXG5cdFx0XHQ5MCxcblx0XHRcdDkxLFxuXHRcdFx0OTIsXG5cdFx0XHQ4MSxcblx0XHRcdDgwLFxuXHRcdFx0ODMsXG5cdFx0XHQ5Myxcblx0XHRcdDg0LFxuXHRcdFx0OTMsXG5cdFx0XHQ4Myxcblx0XHRcdDk0LFxuXHRcdFx0OTUsXG5cdFx0XHQ5Myxcblx0XHRcdDk0LFxuXHRcdFx0OTMsXG5cdFx0XHQ5NSxcblx0XHRcdDk2LFxuXHRcdFx0NDgsXG5cdFx0XHQ0Nyxcblx0XHRcdDM5LFxuXHRcdFx0MTMsXG5cdFx0XHQxMixcblx0XHRcdDczLFxuXHRcdFx0MTIsXG5cdFx0XHQ3MCxcblx0XHRcdDczLFxuXHRcdFx0NjgsXG5cdFx0XHQ1Myxcblx0XHRcdDUyLFxuXHRcdFx0OTcsXG5cdFx0XHQzOCxcblx0XHRcdDc1LFxuXHRcdFx0MzgsXG5cdFx0XHQ5Nyxcblx0XHRcdDc2LFxuXHRcdFx0MTAwLFxuXHRcdFx0OTgsXG5cdFx0XHQ5OSxcblx0XHRcdDk4LFxuXHRcdFx0MTAwLFxuXHRcdFx0MTAxLFxuXHRcdFx0MTA0LFxuXHRcdFx0MTAyLFxuXHRcdFx0MTAzLFxuXHRcdFx0MTAyLFxuXHRcdFx0MTA0LFxuXHRcdFx0MTA1LFxuXHRcdFx0MTAyLFxuXHRcdFx0MTA2LFxuXHRcdFx0MTAzLFxuXHRcdFx0MTA2LFxuXHRcdFx0MTAyLFxuXHRcdFx0MTA3LFxuXHRcdFx0MTEwLFxuXHRcdFx0MTA4LFxuXHRcdFx0MTA5LFxuXHRcdFx0MTA4LFxuXHRcdFx0MTEwLFxuXHRcdFx0MTExLFxuXHRcdFx0MTEyLFxuXHRcdFx0MTExLFxuXHRcdFx0MTEwLFxuXHRcdFx0MTExLFxuXHRcdFx0MTEyLFxuXHRcdFx0MTEzLFxuXHRcdFx0ODQsXG5cdFx0XHQ5Myxcblx0XHRcdDExNCxcblx0XHRcdDEwMSxcblx0XHRcdDExNSxcblx0XHRcdDk4LFxuXHRcdFx0MTE1LFxuXHRcdFx0MTAxLFxuXHRcdFx0MTE2LFxuXHRcdFx0MTE4LFxuXHRcdFx0MTAzLFxuXHRcdFx0MTE3LFxuXHRcdFx0MTAzLFxuXHRcdFx0MTE4LFxuXHRcdFx0MTA0LFxuXHRcdFx0MTAzLFxuXHRcdFx0MTE5LFxuXHRcdFx0MTE3LFxuXHRcdFx0MTE5LFxuXHRcdFx0MTAzLFxuXHRcdFx0MTA2LFxuXHRcdFx0MTA4LFxuXHRcdFx0MTIwLFxuXHRcdFx0MTIxLFxuXHRcdFx0MTIwLFxuXHRcdFx0MTA4LFxuXHRcdFx0MTExLFxuXHRcdFx0MTIyLFxuXHRcdFx0MTE1LFxuXHRcdFx0MTE2LFxuXHRcdFx0MTI2LFxuXHRcdFx0MTIzLFxuXHRcdFx0MTI0LFxuXHRcdFx0MTI2LFxuXHRcdFx0MTI0LFxuXHRcdFx0MTI1LFxuXHRcdFx0MTMwLFxuXHRcdFx0MTI3LFxuXHRcdFx0MTI4LFxuXHRcdFx0MTMwLFxuXHRcdFx0MTI4LFxuXHRcdFx0MTI5LFxuXHRcdFx0MTA1LFxuXHRcdFx0MTAxLFxuXHRcdFx0MTAwLFxuXHRcdFx0MTAxLFxuXHRcdFx0MTA1LFxuXHRcdFx0MTA0LFxuXHRcdFx0MTA0LFxuXHRcdFx0MTE2LFxuXHRcdFx0MTAxLFxuXHRcdFx0MTE2LFxuXHRcdFx0MTA0LFxuXHRcdFx0MTE4LFxuXHRcdFx0MTA2LFxuXHRcdFx0MTA5LFxuXHRcdFx0MTA4LFxuXHRcdFx0MTA5LFxuXHRcdFx0MTA2LFxuXHRcdFx0MTA3LFxuXHRcdFx0MTE5LFxuXHRcdFx0MTA4LFxuXHRcdFx0MTIxLFxuXHRcdFx0MTA4LFxuXHRcdFx0MTE5LFxuXHRcdFx0MTA2LFxuXHRcdFx0MTI1LFxuXHRcdFx0MTI0LFxuXHRcdFx0OTgsXG5cdFx0XHQxMjUsXG5cdFx0XHQ5OCxcblx0XHRcdDExNSxcblx0XHRcdDEyNCxcblx0XHRcdDEyMyxcblx0XHRcdDEzMCxcblx0XHRcdDEyNCxcblx0XHRcdDEzMCxcblx0XHRcdDEyOSxcblx0XHRcdDEzMSxcblx0XHRcdDEwMCxcblx0XHRcdDk5LFxuXHRcdFx0MTAwLFxuXHRcdFx0MTMxLFxuXHRcdFx0MTMyLFxuXHRcdFx0OCxcblx0XHRcdDEwMixcblx0XHRcdDEwNSxcblx0XHRcdDEwMixcblx0XHRcdDgsXG5cdFx0XHQyMixcblx0XHRcdDIyLFxuXHRcdFx0MTA3LFxuXHRcdFx0MTAyLFxuXHRcdFx0MTA3LFxuXHRcdFx0MjIsXG5cdFx0XHQxMzMsXG5cdFx0XHQxMzQsXG5cdFx0XHQxMTAsXG5cdFx0XHQxMDksXG5cdFx0XHQxMTAsXG5cdFx0XHQxMzQsXG5cdFx0XHQxMzUsXG5cdFx0XHQxMzUsXG5cdFx0XHQxMTIsXG5cdFx0XHQxMTAsXG5cdFx0XHQxMTIsXG5cdFx0XHQxMzUsXG5cdFx0XHQxMzYsXG5cdFx0XHQ5OCxcblx0XHRcdDEyNCxcblx0XHRcdDEyOSxcblx0XHRcdDk4LFxuXHRcdFx0MTI5LFxuXHRcdFx0OTksXG5cdFx0XHQxMzgsXG5cdFx0XHQxMjcsXG5cdFx0XHQxMzcsXG5cdFx0XHQxMzgsXG5cdFx0XHQxMzcsXG5cdFx0XHQxMTQsXG5cdFx0XHQxMzIsXG5cdFx0XHQxMDUsXG5cdFx0XHQxMDAsXG5cdFx0XHQxMDUsXG5cdFx0XHQxMzIsXG5cdFx0XHQ4LFxuXHRcdFx0MTMzLFxuXHRcdFx0MTA5LFxuXHRcdFx0MTA3LFxuXHRcdFx0MTA5LFxuXHRcdFx0MTMzLFxuXHRcdFx0MTM0LFxuXHRcdFx0OCxcblx0XHRcdDEzOSxcblx0XHRcdDQsXG5cdFx0XHQxMzksXG5cdFx0XHQ4LFxuXHRcdFx0MTMyLFxuXHRcdFx0MTMyLFxuXHRcdFx0MTQwLFxuXHRcdFx0MTM5LFxuXHRcdFx0MTQwLFxuXHRcdFx0MTMyLFxuXHRcdFx0MTMxLFxuXHRcdFx0MTE0LFxuXHRcdFx0MTM3LFxuXHRcdFx0MTM2LFxuXHRcdFx0MTE0LFxuXHRcdFx0MTM2LFxuXHRcdFx0MTQxLFxuXHRcdFx0MTE0LFxuXHRcdFx0MTQxLFxuXHRcdFx0ODQsXG5cdFx0XHQ0LFxuXHRcdFx0MTQyLFxuXHRcdFx0NSxcblx0XHRcdDE0Mixcblx0XHRcdDQsXG5cdFx0XHQxMzksXG5cdFx0XHQxMzksXG5cdFx0XHQxNDMsXG5cdFx0XHQxNDIsXG5cdFx0XHQxNDMsXG5cdFx0XHQxMzksXG5cdFx0XHQxNDAsXG5cdFx0XHQxNDYsXG5cdFx0XHQxNDQsXG5cdFx0XHQxNDUsXG5cdFx0XHQxNDQsXG5cdFx0XHQxNDYsXG5cdFx0XHQxNDcsXG5cdFx0XHQxNDUsXG5cdFx0XHQxMTQsXG5cdFx0XHQ5Myxcblx0XHRcdDExNCxcblx0XHRcdDE0NSxcblx0XHRcdDE0NCxcblx0XHRcdDE0OCxcblx0XHRcdDE0Nyxcblx0XHRcdDE0Nixcblx0XHRcdDE0Nyxcblx0XHRcdDE0OCxcblx0XHRcdDE0OSxcblx0XHRcdDE0NSxcblx0XHRcdDE1MCxcblx0XHRcdDE0Nixcblx0XHRcdDE1MCxcblx0XHRcdDE0NSxcblx0XHRcdDE1MSxcblx0XHRcdDkzLFxuXHRcdFx0MTUxLFxuXHRcdFx0MTQ1LFxuXHRcdFx0MTUxLFxuXHRcdFx0OTMsXG5cdFx0XHQ5Nixcblx0XHRcdDE1MCxcblx0XHRcdDE0OCxcblx0XHRcdDE0Nixcblx0XHRcdDE0OCxcblx0XHRcdDE1MCxcblx0XHRcdDE1Mixcblx0XHRcdDE1MSxcblx0XHRcdDE1Myxcblx0XHRcdDE1NCxcblx0XHRcdDE1MSxcblx0XHRcdDk2LFxuXHRcdFx0MTUzLFxuXHRcdFx0MTUwLFxuXHRcdFx0MTU1LFxuXHRcdFx0MTUyLFxuXHRcdFx0MTU1LFxuXHRcdFx0MTUwLFxuXHRcdFx0MTU2LFxuXHRcdFx0MTU3LFxuXHRcdFx0MTM2LFxuXHRcdFx0MTM1LFxuXHRcdFx0MTM2LFxuXHRcdFx0MTU3LFxuXHRcdFx0MTQxLFxuXHRcdFx0MTM1LFxuXHRcdFx0MTU4LFxuXHRcdFx0MTU3LFxuXHRcdFx0MTU4LFxuXHRcdFx0MTM1LFxuXHRcdFx0MTM0LFxuXHRcdFx0MTM0LFxuXHRcdFx0MTU5LFxuXHRcdFx0MTU4LFxuXHRcdFx0MTU5LFxuXHRcdFx0MTM0LFxuXHRcdFx0MTMzLFxuXHRcdFx0MTMzLFxuXHRcdFx0MjMsXG5cdFx0XHQxNTksXG5cdFx0XHQyMyxcblx0XHRcdDEzMyxcblx0XHRcdDIyLFxuXHRcdFx0MzEsXG5cdFx0XHQxNTksXG5cdFx0XHQyMyxcblx0XHRcdDE1OSxcblx0XHRcdDMxLFxuXHRcdFx0MTYwLFxuXHRcdFx0MjcsXG5cdFx0XHQxNjEsXG5cdFx0XHQyOCxcblx0XHRcdDE2MSxcblx0XHRcdDI3LFxuXHRcdFx0MTYyLFxuXHRcdFx0MjgsXG5cdFx0XHQxNjAsXG5cdFx0XHQzMSxcblx0XHRcdDE2MCxcblx0XHRcdDI4LFxuXHRcdFx0MTYxLFxuXHRcdFx0MzQsXG5cdFx0XHQxNjIsXG5cdFx0XHQyNyxcblx0XHRcdDE2Mixcblx0XHRcdDM0LFxuXHRcdFx0MTYzLFxuXHRcdFx0NzksXG5cdFx0XHQzNCxcblx0XHRcdDM3LFxuXHRcdFx0MzQsXG5cdFx0XHQ3OSxcblx0XHRcdDE2Myxcblx0XHRcdDE2MCxcblx0XHRcdDE1OCxcblx0XHRcdDE1OSxcblx0XHRcdDE1OCxcblx0XHRcdDE2MCxcblx0XHRcdDE2NCxcblx0XHRcdDE2Mixcblx0XHRcdDE2NSxcblx0XHRcdDE2MSxcblx0XHRcdDE2NSxcblx0XHRcdDE2Mixcblx0XHRcdDE2Nixcblx0XHRcdDE2MSxcblx0XHRcdDE2NCxcblx0XHRcdDE2MCxcblx0XHRcdDE2NCxcblx0XHRcdDE2MSxcblx0XHRcdDE2NSxcblx0XHRcdDE2Myxcblx0XHRcdDE2Nixcblx0XHRcdDE2Mixcblx0XHRcdDE2Nixcblx0XHRcdDE2Myxcblx0XHRcdDE2Nyxcblx0XHRcdDgxLFxuXHRcdFx0MTYzLFxuXHRcdFx0NzksXG5cdFx0XHQxNjMsXG5cdFx0XHQ4MSxcblx0XHRcdDE2Nyxcblx0XHRcdDE2NCxcblx0XHRcdDE1Nyxcblx0XHRcdDE1OCxcblx0XHRcdDE1Nyxcblx0XHRcdDE2NCxcblx0XHRcdDg1LFxuXHRcdFx0MTY2LFxuXHRcdFx0ODcsXG5cdFx0XHQxNjUsXG5cdFx0XHQ4Nyxcblx0XHRcdDE2Nixcblx0XHRcdDg4LFxuXHRcdFx0MTY1LFxuXHRcdFx0ODUsXG5cdFx0XHQxNjQsXG5cdFx0XHQ4NSxcblx0XHRcdDE2NSxcblx0XHRcdDg3LFxuXHRcdFx0MTY3LFxuXHRcdFx0ODgsXG5cdFx0XHQxNjYsXG5cdFx0XHQ4OCxcblx0XHRcdDE2Nyxcblx0XHRcdDg5LFxuXHRcdFx0OTIsXG5cdFx0XHQxNjcsXG5cdFx0XHQ4MSxcblx0XHRcdDE2Nyxcblx0XHRcdDkyLFxuXHRcdFx0ODksXG5cdFx0XHQ4NSxcblx0XHRcdDE0MSxcblx0XHRcdDE1Nyxcblx0XHRcdDE0MSxcblx0XHRcdDg1LFxuXHRcdFx0ODQsXG5cdFx0XHQxMjAsXG5cdFx0XHQxMTMsXG5cdFx0XHQxNjgsXG5cdFx0XHQxMTMsXG5cdFx0XHQxMjAsXG5cdFx0XHQxMTEsXG5cdFx0XHQxNzAsXG5cdFx0XHQxNjksXG5cdFx0XHQ5LFxuXHRcdFx0OTEsXG5cdFx0XHQ4Nyxcblx0XHRcdDg4LFxuXHRcdFx0ODcsXG5cdFx0XHQ5MSxcblx0XHRcdDg2LFxuXHRcdFx0MTU0LFxuXHRcdFx0MTUwLFxuXHRcdFx0MTUxLFxuXHRcdFx0MTUwLFxuXHRcdFx0MTU0LFxuXHRcdFx0MTU2LFxuXHRcdFx0MTUzLFxuXHRcdFx0OTYsXG5cdFx0XHQ5NSxcblx0XHRcdDUwLFxuXHRcdFx0NDksXG5cdFx0XHQxNzEsXG5cdFx0XHQ0Nyxcblx0XHRcdDM4LFxuXHRcdFx0MzksXG5cdFx0XHQzOCxcblx0XHRcdDQ3LFxuXHRcdFx0NzUsXG5cdFx0XHQ1Mixcblx0XHRcdDY3LFxuXHRcdFx0NjgsXG5cdFx0XHQ3Mixcblx0XHRcdDY4LFxuXHRcdFx0NjcsXG5cdFx0XHQxMTgsXG5cdFx0XHQxMjIsXG5cdFx0XHQxMTYsXG5cdFx0XHQxNDMsXG5cdFx0XHQxNDcsXG5cdFx0XHQxNDksXG5cdFx0XHQxNDcsXG5cdFx0XHQxNDMsXG5cdFx0XHQxNDAsXG5cdFx0XHQxNzIsXG5cdFx0XHQxNDcsXG5cdFx0XHQxNDAsXG5cdFx0XHQxNDAsXG5cdFx0XHQxMzEsXG5cdFx0XHQxMjgsXG5cdFx0XHQxNDAsXG5cdFx0XHQxMjgsXG5cdFx0XHQxNzIsXG5cdFx0XHQxMjksXG5cdFx0XHQxMjgsXG5cdFx0XHQxMzEsXG5cdFx0XHQxMjksXG5cdFx0XHQxMzEsXG5cdFx0XHQ5OSxcblx0XHRcdDExMixcblx0XHRcdDEzNixcblx0XHRcdDEzNyxcblx0XHRcdDExMixcblx0XHRcdDEzNyxcblx0XHRcdDE3Myxcblx0XHRcdDExMixcblx0XHRcdDE3Myxcblx0XHRcdDE3NCxcblx0XHRcdDExMixcblx0XHRcdDE3NCxcblx0XHRcdDExMyxcblx0XHRcdDE3NCxcblx0XHRcdDE3NSxcblx0XHRcdDE2OCxcblx0XHRcdDE3NCxcblx0XHRcdDE2OCxcblx0XHRcdDExMyxcblx0XHRcdDE3Myxcblx0XHRcdDEzNyxcblx0XHRcdDEyNyxcblx0XHRcdDE3Myxcblx0XHRcdDEyNyxcblx0XHRcdDEzMCxcblx0XHRcdDE3Myxcblx0XHRcdDEzMCxcblx0XHRcdDEyMyxcblx0XHRcdDE3Myxcblx0XHRcdDEyMyxcblx0XHRcdDE3NCxcblx0XHRcdDEyMyxcblx0XHRcdDEyNixcblx0XHRcdDE3NSxcblx0XHRcdDEyMyxcblx0XHRcdDE3NSxcblx0XHRcdDE3NCxcblx0XHRcdDE0NCxcblx0XHRcdDE0Nyxcblx0XHRcdDE3Mixcblx0XHRcdDE0NCxcblx0XHRcdDEzOCxcblx0XHRcdDExNCxcblx0XHRcdDE3Mixcblx0XHRcdDEzOCxcblx0XHRcdDE0NCxcblx0XHRcdDE3Mixcblx0XHRcdDEyOCxcblx0XHRcdDEyNyxcblx0XHRcdDE3Mixcblx0XHRcdDEyNyxcblx0XHRcdDEzOCxcblx0XHRcdDQ4LFxuXHRcdFx0MzksXG5cdFx0XHQ1MSxcblx0XHRcdDkwLFxuXHRcdFx0ODksXG5cdFx0XHQ5Mixcblx0XHRcdDQ5LFxuXHRcdFx0NTcsXG5cdFx0XHQxNzYsXG5cdFx0XHQ0OSxcblx0XHRcdDE3Nixcblx0XHRcdDE3MSxcblx0XHRcdDc0LFxuXHRcdFx0MTc3LFxuXHRcdFx0OTcsXG5cdFx0XHQ3NCxcblx0XHRcdDk3LFxuXHRcdFx0NzUsXG5cdFx0XHQzLFxuXHRcdFx0MTcwLFxuXHRcdFx0MCxcblx0XHRcdDE3MCxcblx0XHRcdDMsXG5cdFx0XHQxMyxcblx0XHRcdDE3MCxcblx0XHRcdDcsXG5cdFx0XHQwLFxuXHRcdFx0Nyxcblx0XHRcdDE3MCxcblx0XHRcdDksXG5cdFx0XHQyMSxcblx0XHRcdDksXG5cdFx0XHQxNjksXG5cdFx0XHQxNjksXG5cdFx0XHQyNCxcblx0XHRcdDIxLFxuXHRcdFx0MjQsXG5cdFx0XHQxNjksXG5cdFx0XHQ3MSxcblx0XHRcdDUwLFxuXHRcdFx0MTc4LFxuXHRcdFx0NDQsXG5cdFx0XHQ1MCxcblx0XHRcdDQ0LFxuXHRcdFx0NDgsXG5cdFx0XHQxNzEsXG5cdFx0XHQxNzksXG5cdFx0XHQxNzgsXG5cdFx0XHQxNzEsXG5cdFx0XHQxNzgsXG5cdFx0XHQ1MCxcblx0XHRcdDQ0LFxuXHRcdFx0MTc4LFxuXHRcdFx0MTgwLFxuXHRcdFx0NDQsXG5cdFx0XHQxODAsXG5cdFx0XHQ0NSxcblx0XHRcdDE4MSxcblx0XHRcdDE4MCxcblx0XHRcdDE3OCxcblx0XHRcdDE4MSxcblx0XHRcdDE3OCxcblx0XHRcdDE3OSxcblx0XHRcdDE4Myxcblx0XHRcdDE4MSxcblx0XHRcdDE3OSxcblx0XHRcdDE4Myxcblx0XHRcdDE3OSxcblx0XHRcdDE4Mixcblx0XHRcdDczLFxuXHRcdFx0NzEsXG5cdFx0XHQxNjksXG5cdFx0XHQxNjksXG5cdFx0XHQxMyxcblx0XHRcdDczLFxuXHRcdFx0MTMsXG5cdFx0XHQxNjksXG5cdFx0XHQxNzAsXG5cdFx0XHQxODIsXG5cdFx0XHQxNzksXG5cdFx0XHQxNzEsXG5cdFx0XHQxODIsXG5cdFx0XHQxNzEsXG5cdFx0XHQxNzYsXG5cdFx0XHQxLFxuXHRcdFx0MTg0LFxuXHRcdFx0Mixcblx0XHRcdDE4NSxcblx0XHRcdDIsXG5cdFx0XHQxODQsXG5cdFx0XHQ1LFxuXHRcdFx0MTg2LFxuXHRcdFx0Nixcblx0XHRcdDE4Nyxcblx0XHRcdDYsXG5cdFx0XHQxODYsXG5cdFx0XHQxODYsXG5cdFx0XHQxODgsXG5cdFx0XHQxODcsXG5cdFx0XHQxODksXG5cdFx0XHQxODcsXG5cdFx0XHQxODgsXG5cdFx0XHQyLFxuXHRcdFx0MTg1LFxuXHRcdFx0MTAsXG5cdFx0XHQxOTAsXG5cdFx0XHQxMCxcblx0XHRcdDE4NSxcblx0XHRcdDE5MCxcblx0XHRcdDE4NSxcblx0XHRcdDE5MSxcblx0XHRcdDE5Mixcblx0XHRcdDE5MSxcblx0XHRcdDE4NSxcblx0XHRcdDE0LFxuXHRcdFx0MTAsXG5cdFx0XHQxOTMsXG5cdFx0XHQxOTAsXG5cdFx0XHQxOTMsXG5cdFx0XHQxMCxcblx0XHRcdDE5Myxcblx0XHRcdDE5MCxcblx0XHRcdDE5NCxcblx0XHRcdDE5MSxcblx0XHRcdDE5NCxcblx0XHRcdDE5MCxcblx0XHRcdDE5Myxcblx0XHRcdDE5NSxcblx0XHRcdDE0LFxuXHRcdFx0MTgsXG5cdFx0XHQxNCxcblx0XHRcdDE5NSxcblx0XHRcdDE5NSxcblx0XHRcdDE5Nixcblx0XHRcdDE4LFxuXHRcdFx0MjAsXG5cdFx0XHQxOCxcblx0XHRcdDE5Nixcblx0XHRcdDE5Myxcblx0XHRcdDE5NCxcblx0XHRcdDE5NSxcblx0XHRcdDE5Nixcblx0XHRcdDE5NSxcblx0XHRcdDE5NCxcblx0XHRcdDEsXG5cdFx0XHQ2LFxuXHRcdFx0MTg0LFxuXHRcdFx0MTg3LFxuXHRcdFx0MTg0LFxuXHRcdFx0Nixcblx0XHRcdDE4OCxcblx0XHRcdDE5Nyxcblx0XHRcdDE4OSxcblx0XHRcdDE4OCxcblx0XHRcdDE5OCxcblx0XHRcdDE5Nyxcblx0XHRcdDE5OCxcblx0XHRcdDE5OSxcblx0XHRcdDE5Nyxcblx0XHRcdDIwMCxcblx0XHRcdDE5Nyxcblx0XHRcdDE5OSxcblx0XHRcdDIwMyxcblx0XHRcdDIwMSxcblx0XHRcdDIwMixcblx0XHRcdDIwNCxcblx0XHRcdDIwMixcblx0XHRcdDIwMSxcblx0XHRcdDIwNixcblx0XHRcdDIwNSxcblx0XHRcdDIwMyxcblx0XHRcdDIwMSxcblx0XHRcdDIwMyxcblx0XHRcdDIwNSxcblx0XHRcdDIwOCxcblx0XHRcdDIwNCxcblx0XHRcdDIwNyxcblx0XHRcdDIwMSxcblx0XHRcdDIwNyxcblx0XHRcdDIwNCxcblx0XHRcdDIwNyxcblx0XHRcdDIwMSxcblx0XHRcdDIwOSxcblx0XHRcdDIwNSxcblx0XHRcdDIwOSxcblx0XHRcdDIwMSxcblx0XHRcdDIwMixcblx0XHRcdDIxMCxcblx0XHRcdDIwMyxcblx0XHRcdDIxMSxcblx0XHRcdDIwMyxcblx0XHRcdDIxMCxcblx0XHRcdDIwMyxcblx0XHRcdDIxMSxcblx0XHRcdDIwNixcblx0XHRcdDIxMixcblx0XHRcdDIwNixcblx0XHRcdDIxMSxcblx0XHRcdDIxMCxcblx0XHRcdDIxMyxcblx0XHRcdDIxMSxcblx0XHRcdDIxNCxcblx0XHRcdDIxMSxcblx0XHRcdDIxMyxcblx0XHRcdDIxMSxcblx0XHRcdDIxNCxcblx0XHRcdDIxMixcblx0XHRcdDIxNSxcblx0XHRcdDIxMixcblx0XHRcdDIxNCxcblx0XHRcdDIxOSxcblx0XHRcdDIxNixcblx0XHRcdDIxNyxcblx0XHRcdDIxOSxcblx0XHRcdDIxNyxcblx0XHRcdDIxOCxcblx0XHRcdDQ1LFxuXHRcdFx0MjIwLFxuXHRcdFx0MjIxLFxuXHRcdFx0NDUsXG5cdFx0XHQyMjEsXG5cdFx0XHQ0Nixcblx0XHRcdDIyMSxcblx0XHRcdDIyMCxcblx0XHRcdDIyMixcblx0XHRcdDIyNSxcblx0XHRcdDIyMyxcblx0XHRcdDIyNCxcblx0XHRcdDIyNSxcblx0XHRcdDIyNCxcblx0XHRcdDIyMixcblx0XHRcdDIxNyxcblx0XHRcdDIxNixcblx0XHRcdDIyNixcblx0XHRcdDIxNyxcblx0XHRcdDIyNixcblx0XHRcdDIyNyxcblx0XHRcdDIyOSxcblx0XHRcdDIyOCxcblx0XHRcdDIxOSxcblx0XHRcdDIyOSxcblx0XHRcdDIxOSxcblx0XHRcdDIxOCxcblx0XHRcdDIyMyxcblx0XHRcdDIzMCxcblx0XHRcdDIyOCxcblx0XHRcdDIzMSxcblx0XHRcdDIzMCxcblx0XHRcdDIyMyxcblx0XHRcdDIzNCxcblx0XHRcdDIzMixcblx0XHRcdDIzMyxcblx0XHRcdDIzNCxcblx0XHRcdDIzMyxcblx0XHRcdDIxOSxcblx0XHRcdDIzNCxcblx0XHRcdDIxOSxcblx0XHRcdDIzMCxcblx0XHRcdDIxNixcblx0XHRcdDIzMyxcblx0XHRcdDIzNSxcblx0XHRcdDIxNixcblx0XHRcdDIzNSxcblx0XHRcdDIyNixcblx0XHRcdDIxOSxcblx0XHRcdDIzMyxcblx0XHRcdDIxNixcblx0XHRcdDIyOCxcblx0XHRcdDIzMCxcblx0XHRcdDIxOSxcblx0XHRcdDIzMyxcblx0XHRcdDIzMixcblx0XHRcdDIzNixcblx0XHRcdDIzMyxcblx0XHRcdDIzNixcblx0XHRcdDIzNSxcblx0XHRcdDIyMyxcblx0XHRcdDIyOCxcblx0XHRcdDIyOSxcblx0XHRcdDIyMyxcblx0XHRcdDIyOSxcblx0XHRcdDIyNCxcblx0XHRcdDIyNixcblx0XHRcdDIzNSxcblx0XHRcdDY0LFxuXHRcdFx0MjI2LFxuXHRcdFx0NjQsXG5cdFx0XHQ2Myxcblx0XHRcdDIzNSxcblx0XHRcdDIzNixcblx0XHRcdDY1LFxuXHRcdFx0MjM1LFxuXHRcdFx0NjUsXG5cdFx0XHQ2NCxcblx0XHRcdDIxNSxcblx0XHRcdDIyNCxcblx0XHRcdDIxMixcblx0XHRcdDIyOSxcblx0XHRcdDIxMixcblx0XHRcdDIyNCxcblx0XHRcdDIyOSxcblx0XHRcdDIxOCxcblx0XHRcdDIxMixcblx0XHRcdDIwNixcblx0XHRcdDIxMixcblx0XHRcdDIxOCxcblx0XHRcdDIxOCxcblx0XHRcdDIxNyxcblx0XHRcdDIwNixcblx0XHRcdDIwNSxcblx0XHRcdDIwNixcblx0XHRcdDIxNyxcblx0XHRcdDIwOSxcblx0XHRcdDIwNSxcblx0XHRcdDIzNyxcblx0XHRcdDIxNyxcblx0XHRcdDIzNyxcblx0XHRcdDIwNSxcblx0XHRcdDIyNyxcblx0XHRcdDIzOCxcblx0XHRcdDIzNyxcblx0XHRcdDIxNyxcblx0XHRcdDIyNyxcblx0XHRcdDIzNyxcblx0XHRcdDIyNixcblx0XHRcdDYzLFxuXHRcdFx0MjM5LFxuXHRcdFx0MjM5LFxuXHRcdFx0NjMsXG5cdFx0XHQ2OSxcblx0XHRcdDIzNyxcblx0XHRcdDI0MCxcblx0XHRcdDIwOSxcblx0XHRcdDI0MSxcblx0XHRcdDIwOSxcblx0XHRcdDI0MCxcblx0XHRcdDIzNyxcblx0XHRcdDIzOCxcblx0XHRcdDI0MCxcblx0XHRcdDE5Nixcblx0XHRcdDI0MCxcblx0XHRcdDIzOCxcblx0XHRcdDcyLFxuXHRcdFx0MjAsXG5cdFx0XHQyMzgsXG5cdFx0XHQxOTYsXG5cdFx0XHQyMzgsXG5cdFx0XHQyMCxcblx0XHRcdDIwOSxcblx0XHRcdDI0MSxcblx0XHRcdDIwNyxcblx0XHRcdDIwMCxcblx0XHRcdDIwNyxcblx0XHRcdDI0MSxcblx0XHRcdDIwNyxcblx0XHRcdDIwMCxcblx0XHRcdDIwOCxcblx0XHRcdDE5OSxcblx0XHRcdDIwOCxcblx0XHRcdDIwMCxcblx0XHRcdDE5MSxcblx0XHRcdDI0MCxcblx0XHRcdDE5NCxcblx0XHRcdDE5Nixcblx0XHRcdDE5NCxcblx0XHRcdDI0MCxcblx0XHRcdDI0MCxcblx0XHRcdDI0Mixcblx0XHRcdDI0MSxcblx0XHRcdDI0Myxcblx0XHRcdDc0LFxuXHRcdFx0NDYsXG5cdFx0XHQyNDMsXG5cdFx0XHQ0Nixcblx0XHRcdDIyMSxcblx0XHRcdDIzOSxcblx0XHRcdDY5LFxuXHRcdFx0NzIsXG5cdFx0XHQyNDUsXG5cdFx0XHQyNDQsXG5cdFx0XHQyMTMsXG5cdFx0XHQyMTQsXG5cdFx0XHQyMTMsXG5cdFx0XHQyNDQsXG5cdFx0XHQyNDcsXG5cdFx0XHQyNDUsXG5cdFx0XHQyNDYsXG5cdFx0XHQyMTMsXG5cdFx0XHQyNDYsXG5cdFx0XHQyNDUsXG5cdFx0XHQyNDksXG5cdFx0XHQyNDgsXG5cdFx0XHQyNDYsXG5cdFx0XHQyNDcsXG5cdFx0XHQyNDYsXG5cdFx0XHQyNDgsXG5cdFx0XHQyNTIsXG5cdFx0XHQyNTAsXG5cdFx0XHQyNTEsXG5cdFx0XHQyNTMsXG5cdFx0XHQyNTEsXG5cdFx0XHQyNTAsXG5cdFx0XHQyNTAsXG5cdFx0XHQyNTQsXG5cdFx0XHQyNTMsXG5cdFx0XHQyNTUsXG5cdFx0XHQyNTMsXG5cdFx0XHQyNTQsXG5cdFx0XHQyNTgsXG5cdFx0XHQyNTYsXG5cdFx0XHQyNTcsXG5cdFx0XHQyNTksXG5cdFx0XHQyNTcsXG5cdFx0XHQyNTYsXG5cdFx0XHQyNDgsXG5cdFx0XHQyNDksXG5cdFx0XHQyNjAsXG5cdFx0XHQyNTEsXG5cdFx0XHQyNjEsXG5cdFx0XHQyNTIsXG5cdFx0XHQyNjIsXG5cdFx0XHQyNTIsXG5cdFx0XHQyNjEsXG5cdFx0XHQyNjIsXG5cdFx0XHQyNjEsXG5cdFx0XHQyNjMsXG5cdFx0XHQyNjQsXG5cdFx0XHQyNjMsXG5cdFx0XHQyNjEsXG5cdFx0XHQyMTUsXG5cdFx0XHQyMjEsXG5cdFx0XHQyMjIsXG5cdFx0XHQyNDIsXG5cdFx0XHQxOTEsXG5cdFx0XHQxOTIsXG5cdFx0XHQyNDIsXG5cdFx0XHQyNDAsXG5cdFx0XHQxOTEsXG5cdFx0XHQyMjcsXG5cdFx0XHQyMjYsXG5cdFx0XHQyMzksXG5cdFx0XHQyNDMsXG5cdFx0XHQyMTQsXG5cdFx0XHQyNjUsXG5cdFx0XHQyNDQsXG5cdFx0XHQyNjUsXG5cdFx0XHQyMTQsXG5cdFx0XHQyNjgsXG5cdFx0XHQyNjYsXG5cdFx0XHQyNjcsXG5cdFx0XHQyNjksXG5cdFx0XHQyNjcsXG5cdFx0XHQyNjYsXG5cdFx0XHQyNzIsXG5cdFx0XHQyNzAsXG5cdFx0XHQyNzEsXG5cdFx0XHQyNzMsXG5cdFx0XHQyNzEsXG5cdFx0XHQyNzAsXG5cdFx0XHQyNzIsXG5cdFx0XHQyNzQsXG5cdFx0XHQyNzAsXG5cdFx0XHQyNzUsXG5cdFx0XHQyNzAsXG5cdFx0XHQyNzQsXG5cdFx0XHQyNzgsXG5cdFx0XHQyNzYsXG5cdFx0XHQyNzcsXG5cdFx0XHQyNzksXG5cdFx0XHQyNzcsXG5cdFx0XHQyNzYsXG5cdFx0XHQyNzcsXG5cdFx0XHQyNzksXG5cdFx0XHQyODAsXG5cdFx0XHQyODEsXG5cdFx0XHQyODAsXG5cdFx0XHQyNzksXG5cdFx0XHQyODIsXG5cdFx0XHQyNjEsXG5cdFx0XHQyNTEsXG5cdFx0XHQyNjYsXG5cdFx0XHQyODMsXG5cdFx0XHQyNjksXG5cdFx0XHQyODQsXG5cdFx0XHQyNjksXG5cdFx0XHQyODMsXG5cdFx0XHQyODYsXG5cdFx0XHQyNzIsXG5cdFx0XHQyODUsXG5cdFx0XHQyNzEsXG5cdFx0XHQyODUsXG5cdFx0XHQyNzIsXG5cdFx0XHQyODYsXG5cdFx0XHQyODcsXG5cdFx0XHQyNzIsXG5cdFx0XHQyNzQsXG5cdFx0XHQyNzIsXG5cdFx0XHQyODcsXG5cdFx0XHQyODksXG5cdFx0XHQyODgsXG5cdFx0XHQyNzYsXG5cdFx0XHQyNzksXG5cdFx0XHQyNzYsXG5cdFx0XHQyODgsXG5cdFx0XHQyODQsXG5cdFx0XHQyODMsXG5cdFx0XHQyOTAsXG5cdFx0XHQyOTQsXG5cdFx0XHQyOTEsXG5cdFx0XHQyOTIsXG5cdFx0XHQyOTQsXG5cdFx0XHQyOTIsXG5cdFx0XHQyOTMsXG5cdFx0XHQyOTgsXG5cdFx0XHQyOTUsXG5cdFx0XHQyOTYsXG5cdFx0XHQyOTgsXG5cdFx0XHQyOTYsXG5cdFx0XHQyOTcsXG5cdFx0XHQyNjcsXG5cdFx0XHQyNjksXG5cdFx0XHQyNzMsXG5cdFx0XHQyNzEsXG5cdFx0XHQyNzMsXG5cdFx0XHQyNjksXG5cdFx0XHQyNjksXG5cdFx0XHQyODQsXG5cdFx0XHQyNzEsXG5cdFx0XHQyODUsXG5cdFx0XHQyNzEsXG5cdFx0XHQyODQsXG5cdFx0XHQyNzYsXG5cdFx0XHQyNzgsXG5cdFx0XHQyNzQsXG5cdFx0XHQyNzUsXG5cdFx0XHQyNzQsXG5cdFx0XHQyNzgsXG5cdFx0XHQyODksXG5cdFx0XHQyNzYsXG5cdFx0XHQyODcsXG5cdFx0XHQyNzQsXG5cdFx0XHQyODcsXG5cdFx0XHQyNzYsXG5cdFx0XHQyNjYsXG5cdFx0XHQyOTQsXG5cdFx0XHQyOTMsXG5cdFx0XHQyNjYsXG5cdFx0XHQyOTMsXG5cdFx0XHQyODMsXG5cdFx0XHQyOTYsXG5cdFx0XHQyOTEsXG5cdFx0XHQyOTQsXG5cdFx0XHQyOTYsXG5cdFx0XHQyOTQsXG5cdFx0XHQyOTcsXG5cdFx0XHQyNjgsXG5cdFx0XHQyNjcsXG5cdFx0XHQyOTksXG5cdFx0XHQzMDAsXG5cdFx0XHQyOTksXG5cdFx0XHQyNjcsXG5cdFx0XHQyNzMsXG5cdFx0XHQyNzAsXG5cdFx0XHQxODgsXG5cdFx0XHQxOTgsXG5cdFx0XHQxODgsXG5cdFx0XHQyNzAsXG5cdFx0XHQyNzAsXG5cdFx0XHQyNzUsXG5cdFx0XHQxOTgsXG5cdFx0XHQzMDEsXG5cdFx0XHQxOTgsXG5cdFx0XHQyNzUsXG5cdFx0XHQyNzgsXG5cdFx0XHQyNzcsXG5cdFx0XHQzMDIsXG5cdFx0XHQzMDMsXG5cdFx0XHQzMDIsXG5cdFx0XHQyNzcsXG5cdFx0XHQyNzcsXG5cdFx0XHQyODAsXG5cdFx0XHQzMDMsXG5cdFx0XHQzMDQsXG5cdFx0XHQzMDMsXG5cdFx0XHQyODAsXG5cdFx0XHQyOTcsXG5cdFx0XHQyOTQsXG5cdFx0XHQyNjYsXG5cdFx0XHQyOTcsXG5cdFx0XHQyNjYsXG5cdFx0XHQyNjgsXG5cdFx0XHQzMDYsXG5cdFx0XHQyOTUsXG5cdFx0XHQzMDUsXG5cdFx0XHQzMDYsXG5cdFx0XHQzMDUsXG5cdFx0XHQyODIsXG5cdFx0XHQyNjcsXG5cdFx0XHQyNzMsXG5cdFx0XHQzMDAsXG5cdFx0XHQxODgsXG5cdFx0XHQzMDAsXG5cdFx0XHQyNzMsXG5cdFx0XHQyNzUsXG5cdFx0XHQyNzgsXG5cdFx0XHQzMDEsXG5cdFx0XHQzMDIsXG5cdFx0XHQzMDEsXG5cdFx0XHQyNzgsXG5cdFx0XHQxODYsXG5cdFx0XHQzMDcsXG5cdFx0XHQxODgsXG5cdFx0XHQzMDAsXG5cdFx0XHQxODgsXG5cdFx0XHQzMDcsXG5cdFx0XHQzMDcsXG5cdFx0XHQzMDgsXG5cdFx0XHQzMDAsXG5cdFx0XHQyOTksXG5cdFx0XHQzMDAsXG5cdFx0XHQzMDgsXG5cdFx0XHQzMDQsXG5cdFx0XHQzMDYsXG5cdFx0XHQyODIsXG5cdFx0XHQzMDQsXG5cdFx0XHQyODIsXG5cdFx0XHQzMDksXG5cdFx0XHQyNTEsXG5cdFx0XHQzMDksXG5cdFx0XHQyODIsXG5cdFx0XHQ1LFxuXHRcdFx0MTQyLFxuXHRcdFx0MTg2LFxuXHRcdFx0MzA3LFxuXHRcdFx0MTg2LFxuXHRcdFx0MTQyLFxuXHRcdFx0MTQyLFxuXHRcdFx0MTQzLFxuXHRcdFx0MzA3LFxuXHRcdFx0MzA4LFxuXHRcdFx0MzA3LFxuXHRcdFx0MTQzLFxuXHRcdFx0MzEyLFxuXHRcdFx0MzEwLFxuXHRcdFx0MzExLFxuXHRcdFx0MzEzLFxuXHRcdFx0MzExLFxuXHRcdFx0MzEwLFxuXHRcdFx0MjYxLFxuXHRcdFx0MjgyLFxuXHRcdFx0MzEyLFxuXHRcdFx0MzEwLFxuXHRcdFx0MzEyLFxuXHRcdFx0MjgyLFxuXHRcdFx0MzExLFxuXHRcdFx0MzEzLFxuXHRcdFx0MTQ4LFxuXHRcdFx0MTQ5LFxuXHRcdFx0MTQ4LFxuXHRcdFx0MzEzLFxuXHRcdFx0MzExLFxuXHRcdFx0MzE0LFxuXHRcdFx0MzEyLFxuXHRcdFx0MzE1LFxuXHRcdFx0MzEyLFxuXHRcdFx0MzE0LFxuXHRcdFx0MzEyLFxuXHRcdFx0MzE1LFxuXHRcdFx0MjYxLFxuXHRcdFx0MjY0LFxuXHRcdFx0MjYxLFxuXHRcdFx0MzE1LFxuXHRcdFx0MzExLFxuXHRcdFx0MTQ4LFxuXHRcdFx0MzE0LFxuXHRcdFx0MTUyLFxuXHRcdFx0MzE0LFxuXHRcdFx0MTQ4LFxuXHRcdFx0MzE3LFxuXHRcdFx0MzE2LFxuXHRcdFx0MzE1LFxuXHRcdFx0MzE2LFxuXHRcdFx0MjY0LFxuXHRcdFx0MzE1LFxuXHRcdFx0MTUyLFxuXHRcdFx0MTU1LFxuXHRcdFx0MzE0LFxuXHRcdFx0MzE4LFxuXHRcdFx0MzE0LFxuXHRcdFx0MTU1LFxuXHRcdFx0MzAzLFxuXHRcdFx0MzA0LFxuXHRcdFx0MzE5LFxuXHRcdFx0MzA5LFxuXHRcdFx0MzE5LFxuXHRcdFx0MzA0LFxuXHRcdFx0MzE5LFxuXHRcdFx0MzIwLFxuXHRcdFx0MzAzLFxuXHRcdFx0MzAyLFxuXHRcdFx0MzAzLFxuXHRcdFx0MzIwLFxuXHRcdFx0MzIwLFxuXHRcdFx0MzIxLFxuXHRcdFx0MzAyLFxuXHRcdFx0MzAxLFxuXHRcdFx0MzAyLFxuXHRcdFx0MzIxLFxuXHRcdFx0MzIxLFxuXHRcdFx0MTk5LFxuXHRcdFx0MzAxLFxuXHRcdFx0MTk4LFxuXHRcdFx0MzAxLFxuXHRcdFx0MTk5LFxuXHRcdFx0MTk5LFxuXHRcdFx0MzIxLFxuXHRcdFx0MjA4LFxuXHRcdFx0MzIyLFxuXHRcdFx0MjA4LFxuXHRcdFx0MzIxLFxuXHRcdFx0MjA0LFxuXHRcdFx0MzIzLFxuXHRcdFx0MjAyLFxuXHRcdFx0MzI0LFxuXHRcdFx0MjAyLFxuXHRcdFx0MzIzLFxuXHRcdFx0MjA4LFxuXHRcdFx0MzIyLFxuXHRcdFx0MjA0LFxuXHRcdFx0MzIzLFxuXHRcdFx0MjA0LFxuXHRcdFx0MzIyLFxuXHRcdFx0MjAyLFxuXHRcdFx0MzI0LFxuXHRcdFx0MjEwLFxuXHRcdFx0MzI1LFxuXHRcdFx0MjEwLFxuXHRcdFx0MzI0LFxuXHRcdFx0MjEzLFxuXHRcdFx0MjEwLFxuXHRcdFx0MjQ2LFxuXHRcdFx0MzI1LFxuXHRcdFx0MjQ2LFxuXHRcdFx0MjEwLFxuXHRcdFx0MzIxLFxuXHRcdFx0MzIwLFxuXHRcdFx0MzIyLFxuXHRcdFx0MzI2LFxuXHRcdFx0MzIyLFxuXHRcdFx0MzIwLFxuXHRcdFx0MzIzLFxuXHRcdFx0MzI3LFxuXHRcdFx0MzI0LFxuXHRcdFx0MzI4LFxuXHRcdFx0MzI0LFxuXHRcdFx0MzI3LFxuXHRcdFx0MzIyLFxuXHRcdFx0MzI2LFxuXHRcdFx0MzIzLFxuXHRcdFx0MzI3LFxuXHRcdFx0MzIzLFxuXHRcdFx0MzI2LFxuXHRcdFx0MzI0LFxuXHRcdFx0MzI4LFxuXHRcdFx0MzI1LFxuXHRcdFx0MzI5LFxuXHRcdFx0MzI1LFxuXHRcdFx0MzI4LFxuXHRcdFx0MjQ2LFxuXHRcdFx0MzI1LFxuXHRcdFx0MjQ5LFxuXHRcdFx0MzI5LFxuXHRcdFx0MjQ5LFxuXHRcdFx0MzI1LFxuXHRcdFx0MzIwLFxuXHRcdFx0MzE5LFxuXHRcdFx0MzI2LFxuXHRcdFx0MjUzLFxuXHRcdFx0MzI2LFxuXHRcdFx0MzE5LFxuXHRcdFx0MzI3LFxuXHRcdFx0MjU1LFxuXHRcdFx0MzI4LFxuXHRcdFx0MjU2LFxuXHRcdFx0MzI4LFxuXHRcdFx0MjU1LFxuXHRcdFx0MzI2LFxuXHRcdFx0MjUzLFxuXHRcdFx0MzI3LFxuXHRcdFx0MjU1LFxuXHRcdFx0MzI3LFxuXHRcdFx0MjUzLFxuXHRcdFx0MzI4LFxuXHRcdFx0MjU2LFxuXHRcdFx0MzI5LFxuXHRcdFx0MjU4LFxuXHRcdFx0MzI5LFxuXHRcdFx0MjU2LFxuXHRcdFx0MjQ5LFxuXHRcdFx0MzI5LFxuXHRcdFx0MjYwLFxuXHRcdFx0MjU4LFxuXHRcdFx0MjYwLFxuXHRcdFx0MzI5LFxuXHRcdFx0MzE5LFxuXHRcdFx0MzA5LFxuXHRcdFx0MjUzLFxuXHRcdFx0MjUxLFxuXHRcdFx0MjUzLFxuXHRcdFx0MzA5LFxuXHRcdFx0MzMwLFxuXHRcdFx0MjgxLFxuXHRcdFx0Mjg4LFxuXHRcdFx0Mjc5LFxuXHRcdFx0Mjg4LFxuXHRcdFx0MjgxLFxuXHRcdFx0MTg5LFxuXHRcdFx0MzMxLFxuXHRcdFx0MzMyLFxuXHRcdFx0MjU2LFxuXHRcdFx0MjU1LFxuXHRcdFx0MjU5LFxuXHRcdFx0MjU0LFxuXHRcdFx0MjU5LFxuXHRcdFx0MjU1LFxuXHRcdFx0MzE1LFxuXHRcdFx0MzE0LFxuXHRcdFx0MzE3LFxuXHRcdFx0MzE4LFxuXHRcdFx0MzE3LFxuXHRcdFx0MzE0LFxuXHRcdFx0MjYzLFxuXHRcdFx0MjY0LFxuXHRcdFx0MzE2LFxuXHRcdFx0MjIzLFxuXHRcdFx0MjI1LFxuXHRcdFx0MzMzLFxuXHRcdFx0MjE1LFxuXHRcdFx0MjE0LFxuXHRcdFx0MjIxLFxuXHRcdFx0MjQzLFxuXHRcdFx0MjIxLFxuXHRcdFx0MjE0LFxuXHRcdFx0MjM5LFxuXHRcdFx0MjM4LFxuXHRcdFx0MjI3LFxuXHRcdFx0MjM4LFxuXHRcdFx0MjM5LFxuXHRcdFx0NzIsXG5cdFx0XHQyODQsXG5cdFx0XHQyOTAsXG5cdFx0XHQyODUsXG5cdFx0XHQxNDksXG5cdFx0XHQzMTMsXG5cdFx0XHQxNDMsXG5cdFx0XHQzMDgsXG5cdFx0XHQxNDMsXG5cdFx0XHQzMTMsXG5cdFx0XHQzMDgsXG5cdFx0XHQzMTMsXG5cdFx0XHQzMzQsXG5cdFx0XHQyOTgsXG5cdFx0XHQyOTksXG5cdFx0XHQzMDgsXG5cdFx0XHQyOTgsXG5cdFx0XHQzMDgsXG5cdFx0XHQzMzQsXG5cdFx0XHQyOTksXG5cdFx0XHQyOTgsXG5cdFx0XHQyOTcsXG5cdFx0XHQyOTksXG5cdFx0XHQyOTcsXG5cdFx0XHQyNjgsXG5cdFx0XHQzMDYsXG5cdFx0XHQzMDQsXG5cdFx0XHQyODAsXG5cdFx0XHQzMDYsXG5cdFx0XHQyODAsXG5cdFx0XHQzMzUsXG5cdFx0XHQzMzYsXG5cdFx0XHQzMzUsXG5cdFx0XHQyODAsXG5cdFx0XHQzMzYsXG5cdFx0XHQyODAsXG5cdFx0XHQyODEsXG5cdFx0XHQzMzAsXG5cdFx0XHQzMzcsXG5cdFx0XHQzMzYsXG5cdFx0XHQzMzAsXG5cdFx0XHQzMzYsXG5cdFx0XHQyODEsXG5cdFx0XHQyOTUsXG5cdFx0XHQzMDYsXG5cdFx0XHQzMzUsXG5cdFx0XHQyOTUsXG5cdFx0XHQzMzUsXG5cdFx0XHQyOTYsXG5cdFx0XHQyOTEsXG5cdFx0XHQyOTYsXG5cdFx0XHQzMzUsXG5cdFx0XHQyOTEsXG5cdFx0XHQzMzUsXG5cdFx0XHQzMzYsXG5cdFx0XHQzMzcsXG5cdFx0XHQyOTIsXG5cdFx0XHQyOTEsXG5cdFx0XHQzMzcsXG5cdFx0XHQyOTEsXG5cdFx0XHQzMzYsXG5cdFx0XHQzMzQsXG5cdFx0XHQzMTMsXG5cdFx0XHQzMTAsXG5cdFx0XHQyODIsXG5cdFx0XHQzMDUsXG5cdFx0XHQzMTAsXG5cdFx0XHQzMTAsXG5cdFx0XHQzMDUsXG5cdFx0XHQzMzQsXG5cdFx0XHQyOTUsXG5cdFx0XHQyOTgsXG5cdFx0XHQzMzQsXG5cdFx0XHQyOTUsXG5cdFx0XHQzMzQsXG5cdFx0XHQzMDUsXG5cdFx0XHQyMjQsXG5cdFx0XHQyMTUsXG5cdFx0XHQyMjIsXG5cdFx0XHQyNjAsXG5cdFx0XHQyNTgsXG5cdFx0XHQyNTcsXG5cdFx0XHQzMzgsXG5cdFx0XHQyMzEsXG5cdFx0XHQyMjMsXG5cdFx0XHQzMzgsXG5cdFx0XHQyMjMsXG5cdFx0XHQzMzMsXG5cdFx0XHQyNjUsXG5cdFx0XHQxNzcsXG5cdFx0XHQ3NCxcblx0XHRcdDI2NSxcblx0XHRcdDc0LFxuXHRcdFx0MjQzLFxuXHRcdFx0MTg0LFxuXHRcdFx0MzMyLFxuXHRcdFx0MTg1LFxuXHRcdFx0MTkyLFxuXHRcdFx0MTg1LFxuXHRcdFx0MzMyLFxuXHRcdFx0MTg0LFxuXHRcdFx0MTg3LFxuXHRcdFx0MzMyLFxuXHRcdFx0MTg5LFxuXHRcdFx0MzMyLFxuXHRcdFx0MTg3LFxuXHRcdFx0MzMxLFxuXHRcdFx0MTg5LFxuXHRcdFx0MTk3LFxuXHRcdFx0MTk3LFxuXHRcdFx0MjAwLFxuXHRcdFx0MzMxLFxuXHRcdFx0MjQxLFxuXHRcdFx0MzMxLFxuXHRcdFx0MjAwLFxuXHRcdFx0MjIwLFxuXHRcdFx0MzM5LFxuXHRcdFx0MjI1LFxuXHRcdFx0MjIwLFxuXHRcdFx0MjI1LFxuXHRcdFx0MjIyLFxuXHRcdFx0MzM5LFxuXHRcdFx0MzQwLFxuXHRcdFx0MzMzLFxuXHRcdFx0MzM5LFxuXHRcdFx0MzMzLFxuXHRcdFx0MjI1LFxuXHRcdFx0MTgwLFxuXHRcdFx0MzM5LFxuXHRcdFx0MjIwLFxuXHRcdFx0MTgwLFxuXHRcdFx0MjIwLFxuXHRcdFx0NDUsXG5cdFx0XHQzMzksXG5cdFx0XHQxODAsXG5cdFx0XHQxODEsXG5cdFx0XHQzMzksXG5cdFx0XHQxODEsXG5cdFx0XHQzNDAsXG5cdFx0XHQzNDAsXG5cdFx0XHQxODEsXG5cdFx0XHQxODMsXG5cdFx0XHQzNDAsXG5cdFx0XHQxODMsXG5cdFx0XHQzNDEsXG5cdFx0XHQzMzEsXG5cdFx0XHQyNDEsXG5cdFx0XHQyNDIsXG5cdFx0XHQyNDIsXG5cdFx0XHQxOTIsXG5cdFx0XHQzMzEsXG5cdFx0XHQzMzIsXG5cdFx0XHQzMzEsXG5cdFx0XHQxOTIsXG5cdFx0XHQzMzMsXG5cdFx0XHQzNDAsXG5cdFx0XHQzNDEsXG5cdFx0XHQzMzMsXG5cdFx0XHQzNDEsXG5cdFx0XHQzMzhcblx0XHRdLFxuXHRcdFwiZmVhdHVyZVBvaW50XCI6IFtcblx0XHRcdDI1MCxcblx0XHRcdDI1OSxcblx0XHRcdDI2MCxcblx0XHRcdDI0OCxcblx0XHRcdDI0NSxcblx0XHRcdDI0NCxcblx0XHRcdDI2NSxcblx0XHRcdDE3Nyxcblx0XHRcdDk3LFxuXHRcdFx0NzYsXG5cdFx0XHQ3Nyxcblx0XHRcdDgwLFxuXHRcdFx0OTIsXG5cdFx0XHQ5MSxcblx0XHRcdDgyLFxuXHRcdFx0MTQxLFxuXHRcdFx0MTE0LFxuXHRcdFx0MTcyLFxuXHRcdFx0MTQwLFxuXHRcdFx0MzA5LFxuXHRcdFx0MjgyLFxuXHRcdFx0MzM0LFxuXHRcdFx0MzA4LFxuXHRcdFx0Mjg4LFxuXHRcdFx0MjkyLFxuXHRcdFx0MjkwLFxuXHRcdFx0Mjg3LFxuXHRcdFx0LTEsXG5cdFx0XHQxMjAsXG5cdFx0XHQxMjYsXG5cdFx0XHQxMjIsXG5cdFx0XHQxMTksXG5cdFx0XHQtMSxcblx0XHRcdDUsXG5cdFx0XHQxODksXG5cdFx0XHQzMzEsXG5cdFx0XHQyNDAsXG5cdFx0XHQyMCxcblx0XHRcdDcwLFxuXHRcdFx0MTY5LFxuXHRcdFx0OSxcblx0XHRcdDYsXG5cdFx0XHQxOTMsXG5cdFx0XHQxNSxcblx0XHRcdDIzMCxcblx0XHRcdDIyNyxcblx0XHRcdDIzOSxcblx0XHRcdDY5LFxuXHRcdFx0NjgsXG5cdFx0XHQ1Mixcblx0XHRcdDU2LFxuXHRcdFx0NDgsXG5cdFx0XHQ0NCxcblx0XHRcdDQ1LFxuXHRcdFx0MjIwLFxuXHRcdFx0MjIyLFxuXHRcdFx0MzQxLFxuXHRcdFx0MTgzLFxuXHRcdFx0MTgyLFxuXHRcdFx0NjIsXG5cdFx0XHQ2NSxcblx0XHRcdDIzNixcblx0XHRcdDIsXG5cdFx0XHQzMzcsXG5cdFx0XHQyOTMsXG5cdFx0XHQyODYsXG5cdFx0XHQyODksXG5cdFx0XHQxNzUsXG5cdFx0XHQxMjUsXG5cdFx0XHQxMTcsXG5cdFx0XHQxMjEsXG5cdFx0XHQ4Myxcblx0XHRcdDk1LFxuXHRcdFx0MTUzLFxuXHRcdFx0MTU2LFxuXHRcdFx0MTU1LFxuXHRcdFx0MzE4LFxuXHRcdFx0MzE2LFxuXHRcdFx0MjYzLFxuXHRcdFx0MjUyXG5cdFx0XSxcblx0XHRcIndlaWdodFwiOiBbXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Mixcblx0XHRcdFx0XHQxODMuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0MTU4LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDUxLjU4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQ0My4zMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjIsXG5cdFx0XHRcdFx0MzA2LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDE1Ny40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQ1LjA2NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDMsXG5cdFx0XHRcdFx0NS4wNjRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDU1Ny42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQxNTAuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0NjQuNDZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDU2LjMzXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMyxcblx0XHRcdFx0XHQ2NTBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDgyLjIxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQyOC44NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTgsXG5cdFx0XHRcdFx0MjUuNzdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMzLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDQ2NC44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQxNjAuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzMsXG5cdFx0XHRcdFx0MzUuNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDM0LjQ3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQxMTkuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzMsXG5cdFx0XHRcdFx0ODQuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0NTEuMTdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDQyLjY4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Mixcblx0XHRcdFx0XHQzOTcuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDMsXG5cdFx0XHRcdFx0MzIyLjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQyLFxuXHRcdFx0XHRcdDMyMi4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQ4Mi44MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDMsXG5cdFx0XHRcdFx0NzU5LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDExNS42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQ4OC40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0NTYuMjVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDExOC45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQ5OC45NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0NTMuMDhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDQxLjM2XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQxMTkuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDAsXG5cdFx0XHRcdFx0ODIuNjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDY0LjQxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQ0Mi45N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0NjYyLjdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDY2Mi43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQxNDAuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjIsXG5cdFx0XHRcdFx0NTQuNDdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDI0Ni41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQxNDMuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0MTE1LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDU3LjQ0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQ4MzkuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0NDUxLjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQyLFxuXHRcdFx0XHRcdDIyMy4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nyxcblx0XHRcdFx0XHQ0OS4xNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0OTU5Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQyLFxuXHRcdFx0XHRcdDMxOS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQzMTkuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDcsXG5cdFx0XHRcdFx0NS40MDVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDkwNS4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQxNDMuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDgsXG5cdFx0XHRcdFx0NjMuMjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQyLFxuXHRcdFx0XHRcdDYyLjc1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQzMzIuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0MTg2LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDU5Ljg1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQzMC4xMlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0ODIuODVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDU1LjUzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQ1MC4wN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0MzkuOTFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDUwLjQzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQzMC41NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDAsXG5cdFx0XHRcdFx0MjUuODJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDI0Ljc2XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQzMzkuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0MTMwLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQwLFxuXHRcdFx0XHRcdDQwLjQ3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQxNy4xNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0NDUuMzFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDMxLjAyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQyMy4wMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDksXG5cdFx0XHRcdFx0MjIuMjRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDQ2LjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQyNC4wM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDksXG5cdFx0XHRcdFx0MjIuNjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDE4LjU1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMCxcblx0XHRcdFx0XHQyMC43N1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MTQuNDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDEyLjY1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQxMS42NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0MTcuMDFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDE2LjUyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMCxcblx0XHRcdFx0XHQxMC40M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0OC44OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0NzAuMTRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDU3LjE4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQ1NC41NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0NDQuMDNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDE2Ny40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQ1Mi45OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MzkuOTVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDM0LjM0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQzNi4wNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0MjMuODNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDEzLjkyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQxMy4xN1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0ODQuMDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDc5Ljg0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQyNC42MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDAsXG5cdFx0XHRcdFx0MTkuODdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDI4MC42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQxMzEuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDksXG5cdFx0XHRcdFx0NTQuMjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDI3LjMxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMCxcblx0XHRcdFx0XHQzOS40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTEsXG5cdFx0XHRcdFx0MTkuNzZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDE3LjQzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ5LFxuXHRcdFx0XHRcdDEyLjA4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQ2MS4wOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MjUuMzhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDksXG5cdFx0XHRcdFx0MjEuMTdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDE4LjE4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQzMjQuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0NjkuNDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDMxLjE1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQzMC4wMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTAsXG5cdFx0XHRcdFx0MTYyLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDExLFxuXHRcdFx0XHRcdDI1LjAyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ5LFxuXHRcdFx0XHRcdDI0Ljg5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQxMi45N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0OSxcblx0XHRcdFx0XHQ4Ni41OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0NDcuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0NDcuNDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDIzLjM0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQxNDkuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MTQ2LjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDM3LjcyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OCxcblx0XHRcdFx0XHQyMy4wM1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MzA5LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU5LFxuXHRcdFx0XHRcdDExNC43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQ4NC43NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDgsXG5cdFx0XHRcdFx0NDEuOFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0Mzg2NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTksXG5cdFx0XHRcdFx0NjcuODNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDYyLjUxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQ0NS4wMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0NjM0LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ5LFxuXHRcdFx0XHRcdDc0LjAyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQ2NS42NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTksXG5cdFx0XHRcdFx0NTguNDVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDIxMC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQxOTQuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTksXG5cdFx0XHRcdFx0NzEuNTRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDU4LjA0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Mixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Myxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Myxcblx0XHRcdFx0XHQ2NzkuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTcsXG5cdFx0XHRcdFx0NjMuNjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDQwLjk5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NCxcblx0XHRcdFx0XHQ0MC45OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTIsXG5cdFx0XHRcdFx0NDM4LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDE4MS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OCxcblx0XHRcdFx0XHQ2Ni4xN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTMsXG5cdFx0XHRcdFx0NjMuODdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDc5MTdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDYxLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDE4LjczXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQxNDk4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Mixcblx0XHRcdFx0XHQyNjIuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0MjUxLjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDIyNS4yXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQ1NzEuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MjY5LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDU3LjAxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OCxcblx0XHRcdFx0XHQ0OS4yN1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDksXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDksXG5cdFx0XHRcdFx0MTU2NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTksXG5cdFx0XHRcdFx0NTYzLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDU2Mi4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nyxcblx0XHRcdFx0XHQxMzMuNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0NjgzN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0OTAuMzFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDY0LjIyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OSxcblx0XHRcdFx0XHQ1NC41MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MTI5MFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MTA2LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDQ4LjQ4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OSxcblx0XHRcdFx0XHQ0My4yOVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0NTA4MFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MTIwLjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDEwMi4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Mixcblx0XHRcdFx0XHQ1OS4yOVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0NDg4Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU5LFxuXHRcdFx0XHRcdDE1Ny42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQyMi4wN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MTYuMTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDQ2ODhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU5LFxuXHRcdFx0XHRcdDg1Ljg0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQ3Mi42NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0NTAuNjJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDM3Ni40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OSxcblx0XHRcdFx0XHQxNDMuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDksXG5cdFx0XHRcdFx0MzkuNDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDEwLjgxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OSxcblx0XHRcdFx0XHQxNzk2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQ0NzcuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDgsXG5cdFx0XHRcdFx0MjI4LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYwLFxuXHRcdFx0XHRcdDE0MC4zXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nyxcblx0XHRcdFx0XHQyNTg4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MCxcblx0XHRcdFx0XHQ2OTVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDQwMS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQ0MDEuMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjAsXG5cdFx0XHRcdFx0MTg1MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDcsXG5cdFx0XHRcdFx0ODA1Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ2LFxuXHRcdFx0XHRcdDIwMy44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OCxcblx0XHRcdFx0XHQyMDMuOFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjAsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0NDI3LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ5LFxuXHRcdFx0XHRcdDk1LjIyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQ3Ni45NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDgsXG5cdFx0XHRcdFx0MzEuNjdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDM1OC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQyMzcuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0MjM0LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDExMi44XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nyxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQ4NTJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDY5OS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQ0OS4xN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0MzIuNzdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDc4NS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nyxcblx0XHRcdFx0XHQ0MjIuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDYsXG5cdFx0XHRcdFx0MzA1LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDMwNS4zXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQxMzg4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQxMzI2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQzOC41NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0MTYuNzdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcsXG5cdFx0XHRcdFx0MTM5Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUzLFxuXHRcdFx0XHRcdDExOS4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ4LFxuXHRcdFx0XHRcdDQyLjg1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2LFxuXHRcdFx0XHRcdDQyLjg1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ4LFxuXHRcdFx0XHRcdDE2OS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Mixcblx0XHRcdFx0XHQ5Ny45OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0NjIuNDhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDM1LjIxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ5LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDE0Ny45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQ2Mi42OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0OSxcblx0XHRcdFx0XHQyLjk3MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTIsXG5cdFx0XHRcdFx0MC4wNjMzXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMCxcblx0XHRcdFx0XHQ3Ni40NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTEsXG5cdFx0XHRcdFx0NjcuMThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEyLFxuXHRcdFx0XHRcdDE0LjYxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ5LFxuXHRcdFx0XHRcdDEzLjE3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQyMjYuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTIsXG5cdFx0XHRcdFx0MzguNDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDE4LjcyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMyxcblx0XHRcdFx0XHQ1LjAzN1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTQsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzEsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTUsXG5cdFx0XHRcdFx0NTcuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzEsXG5cdFx0XHRcdFx0MTMuMDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDkuMTg3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNCxcblx0XHRcdFx0XHQ3Ljk0NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTQsXG5cdFx0XHRcdFx0MjIuMjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEzLFxuXHRcdFx0XHRcdDE3LjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNSxcblx0XHRcdFx0XHQxNi44NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0MTYuMTNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEzLFxuXHRcdFx0XHRcdDE4My45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNCxcblx0XHRcdFx0XHQxMTYuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzEsXG5cdFx0XHRcdFx0NS4xNjZcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEzLFxuXHRcdFx0XHRcdDQyLjgzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHQyNC4yM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTQsXG5cdFx0XHRcdFx0MTEuNzhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE1LFxuXHRcdFx0XHRcdDcuMjM5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHQ1Ni4yMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTMsXG5cdFx0XHRcdFx0NDkuMDJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDExLFxuXHRcdFx0XHRcdDguODY2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNCxcblx0XHRcdFx0XHQ4LjMxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHQxNTQuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTMsXG5cdFx0XHRcdFx0MzIuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTEsXG5cdFx0XHRcdFx0MTQuNzRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE0LFxuXHRcdFx0XHRcdDYuMjQyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMyxcblx0XHRcdFx0XHQxNTEuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTIsXG5cdFx0XHRcdFx0NzYuMDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE0LFxuXHRcdFx0XHRcdDMuMjU5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMyxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Mixcblx0XHRcdFx0XHQyNi45NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzMsXG5cdFx0XHRcdFx0MTcuMjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDEyLjg2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNSxcblx0XHRcdFx0XHQxMS42MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzIsXG5cdFx0XHRcdFx0NjcuNDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcxLFxuXHRcdFx0XHRcdDU2LjQ1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNCxcblx0XHRcdFx0XHQ3LjY3MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzMsXG5cdFx0XHRcdFx0MS44OTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcyLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDczLFxuXHRcdFx0XHRcdDExOC44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Mixcblx0XHRcdFx0XHQ0My43NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzQsXG5cdFx0XHRcdFx0NS4yOTZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDQuNjg1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ4LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDY2Ny45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQ0NDIuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0OTUuMTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDgzLjYxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQxNzYuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0MTM5LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDQ4LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDQzLjU3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQyMzMuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0ODIuMDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDc0LjMzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQzMi4yNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0NzM4Ljhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDE0MC45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQxMzFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDUxLjkyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQzNDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDE2OS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQxMDEuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0NTMuNjlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDE0Nzdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDQxMy45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQyMDIuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0ODQuMjNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDYzMS4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQyNDIuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0MTA5LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDgyLjQ0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQyMDYuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0MTA5Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY4LFxuXHRcdFx0XHRcdDYwLjA1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQ0Ny43MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0MTU2NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0MjAyLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDE1MC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQ3MC42NFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0MzY1LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDEwMy42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQ4Mi45MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0NDUuMTFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDI3NTVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDMxNC4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQyNTRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDg0LjMxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQ1MjUuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0MTUwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQxMjguN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0NTMuODRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDczMy44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQxMjkuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0OTQuMTJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDQ1LjI1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQ0MDU1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQyMzAuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0MTU0LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDYxLjI2XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQ1MDIuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0MTU3LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDc4LjI5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNSxcblx0XHRcdFx0XHQ0NS4xNVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0MTM1N1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0MjkwLjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDE0OC4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOSxcblx0XHRcdFx0XHQ2Mi4xMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTYsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0MjIwOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0NjM3Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDEyNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0NzYuMDhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDM3NDFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDI1OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0MjA0LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDc4LjUyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQ0MTYwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQ0Njhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDU1MzJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY3LFxuXHRcdFx0XHRcdDMxMy4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQyNDEuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0NjIuOTlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY4LFxuXHRcdFx0XHRcdDYzNjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDM5MS45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQxODcuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0ODguMjlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY4LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDg5LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE3LFxuXHRcdFx0XHRcdDY4LjAzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQzNS41NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTYsXG5cdFx0XHRcdFx0MzAuODhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE3LFxuXHRcdFx0XHRcdDE2NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0MTA5LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDc2LjY1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQ2MS44NFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0NjYxLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDE0Mi45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQ3OC4zNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0MzAuNTVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDcxMy4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQxNDAuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0MTI2LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDIzLjQyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQxNDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY4LFxuXHRcdFx0XHRcdDYwLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDU5LjI1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNyxcblx0XHRcdFx0XHQzNy41MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0NjUuMTdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMzLFxuXHRcdFx0XHRcdDQ0Ljc5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQ0NC40MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0MjkuNjVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDEwOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0NTcuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0NDguMjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDMzLjUxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQxNDIuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0NjUuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0NTkuMDdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDMwLjM5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQxOTMuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0NjMuOTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY3LFxuXHRcdFx0XHRcdDUwLjEzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQyNy41NFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTUsXG5cdFx0XHRcdFx0MjEwLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDEzOS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNixcblx0XHRcdFx0XHQ4OC4xM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0NzcuMDdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDI2OS4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQxNTIuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0NjQuNDlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDU1LjcyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNixcblx0XHRcdFx0XHQxMzYuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0MTMxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOSxcblx0XHRcdFx0XHQxNC40NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0NS42MTdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMzLFxuXHRcdFx0XHRcdDE1MS44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQ2OC4zMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0MzkuNjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDMzLjkyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMyxcblx0XHRcdFx0XHQ1MDMuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0NDcuMTNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDM5LjYxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQzOS42MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTgsXG5cdFx0XHRcdFx0MTU4LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDE1OC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMyxcblx0XHRcdFx0XHQxNC4yOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0My4wNjJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDEwMC42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNyxcblx0XHRcdFx0XHQ5MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0MTguNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE4LFxuXHRcdFx0XHRcdDE3LjRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDQxLjc3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNyxcblx0XHRcdFx0XHQyNi44NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTUsXG5cdFx0XHRcdFx0OS4wNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0Ny42NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0MjkuMTZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE4LFxuXHRcdFx0XHRcdDIxLjQ2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNixcblx0XHRcdFx0XHQxMS42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NCxcblx0XHRcdFx0XHQ3LjAwNVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0MTM3LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE4LFxuXHRcdFx0XHRcdDgwLjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDE1LjcyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNixcblx0XHRcdFx0XHQxMy40MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0MTYuMDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIxLFxuXHRcdFx0XHRcdDE2LjA0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMixcblx0XHRcdFx0XHQxMi42OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTgsXG5cdFx0XHRcdFx0MTIuNjhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDM0Ljc5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQzNC43OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjEsXG5cdFx0XHRcdFx0MjEuNzFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE3LFxuXHRcdFx0XHRcdDIxLjcxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NCxcblx0XHRcdFx0XHQzMi4wN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzUsXG5cdFx0XHRcdFx0MjAuOTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE3LFxuXHRcdFx0XHRcdDUuNDkzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nixcblx0XHRcdFx0XHQ1LjE3M1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzMsXG5cdFx0XHRcdFx0MTkuMjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc0LFxuXHRcdFx0XHRcdDkuMjM1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNixcblx0XHRcdFx0XHQ4LjQ4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Mixcblx0XHRcdFx0XHQ3LjA0OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzUsXG5cdFx0XHRcdFx0MzUuNzdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc2LFxuXHRcdFx0XHRcdDguNjg3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NCxcblx0XHRcdFx0XHQ4LjY4N1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0My4yMzhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDczLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDczLFxuXHRcdFx0XHRcdDUwLjE5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NCxcblx0XHRcdFx0XHQ0Ni4yNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzUsXG5cdFx0XHRcdFx0NC45NDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcyLFxuXHRcdFx0XHRcdDMuMTU4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQ2NS40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTUsXG5cdFx0XHRcdFx0MzMuNjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDMwLjExXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQyNC44N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0NDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDI2LjkxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQyNC44OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0MTQuODVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDM0LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDI0LjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQyMy42M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0MTkuODhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDE5LjE3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQxNi41MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0MTMuNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDEzLjM5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQxMC41NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0MTAuMjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDkuNzEzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQ5LjE1M1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTEsXG5cdFx0XHRcdFx0MTUuNDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDE1LjE4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQ3LjgzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHQ2Ljk1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQyOC4zNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTAsXG5cdFx0XHRcdFx0MjUuNzNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEyLFxuXHRcdFx0XHRcdDExLjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDkuMTkxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQyMC45MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0MTMuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0MTIuOTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDguMTcyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQxMi45MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0MTAuMjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEyLFxuXHRcdFx0XHRcdDguOTc0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQ3LjEyNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTEsXG5cdFx0XHRcdFx0MjQuOTZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEyLFxuXHRcdFx0XHRcdDE2LjQ2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMCxcblx0XHRcdFx0XHQ4LjE2MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTMsXG5cdFx0XHRcdFx0OC4wMzNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDExLFxuXHRcdFx0XHRcdDUwLjM4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHQzMC4xMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTAsXG5cdFx0XHRcdFx0OS4xNTNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEzLFxuXHRcdFx0XHRcdDcuNzY4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQxODA1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQ1NzRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDE0Ny43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOSxcblx0XHRcdFx0XHQ3Ni42N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDAsXG5cdFx0XHRcdFx0MjQ1LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDEzOC4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQzNy45NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0MzEuOTNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDYzNy40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OCxcblx0XHRcdFx0XHQ0MTIuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MjY2LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDE3NC41XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNyxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQxMTEwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOSxcblx0XHRcdFx0XHQxNTAuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0OTEuNjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDQwLjQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQ2MTM0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOSxcblx0XHRcdFx0XHQyMjkuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0MTk0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQ2Ni44OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0Mzc3Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDM3MFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MjgzLjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDEyMC45XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDE1ODdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDgxNy40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQxNDAuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTcsXG5cdFx0XHRcdFx0MTE3LjVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDQ1Nzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDM2MS40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nyxcblx0XHRcdFx0XHQ4Ni43OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0My45NzZcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUzLFxuXHRcdFx0XHRcdDEyNTZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU3LFxuXHRcdFx0XHRcdDY3My4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Mixcblx0XHRcdFx0XHQxMjQuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTQsXG5cdFx0XHRcdFx0MTI0LjFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU3LFxuXHRcdFx0XHRcdDQ0OTBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUzLFxuXHRcdFx0XHRcdDMxMy4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ3NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0NzVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU3LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDE4My45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQxNTguNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0NTEuNThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM0LFxuXHRcdFx0XHRcdDQzLjMxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Mixcblx0XHRcdFx0XHQ1NTcuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0MTUwLjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDY0LjQ2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQ1Ni4zM1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzMsXG5cdFx0XHRcdFx0NjUwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQ4Mi4yMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MjguODZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDI1Ljc3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQ0NjQuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MTYwLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMzLFxuXHRcdFx0XHRcdDM1Ljc5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Mixcblx0XHRcdFx0XHQzNC40N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MTE5LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMzLFxuXHRcdFx0XHRcdDg0LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDUxLjE3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQ0Mi42OFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0NzU5LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDExNS42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQ4OC40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0NTYuMjVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDExOC45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQ5OC45NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0NTMuMDhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDQxLjM2XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQxMTkuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0ODIuNjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDY0LjQxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQ0Mi45N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0MjQ2LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDE0My45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQxMTUuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0NTcuNDRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQyLFxuXHRcdFx0XHRcdDgzOS40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQ0NTEuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDMsXG5cdFx0XHRcdFx0MjIzLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ3LFxuXHRcdFx0XHRcdDQ5LjE0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQ5MDUuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0MTQzLjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ2LFxuXHRcdFx0XHRcdDYzLjIxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQ2Mi43NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MzMyLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDE4Ni41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQ1OS44NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0MzAuMTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDgyLjg1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQ1NS41M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0NTAuMDdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDM5LjkxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQ1MC40M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0MzAuNTRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM0LFxuXHRcdFx0XHRcdDI1LjgyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQyNC43NlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0MzM5LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDEzMC4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNCxcblx0XHRcdFx0XHQ0MC40N1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0MTcuMTRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDQ1LjMxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQzMS4wMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MjMuMDFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDIyLjI0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0LFxuXHRcdFx0XHRcdDIwLjc3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQxNC40NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0MTIuNjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0MTEuNjVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDQ2LjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQyNC4wM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0MjIuNjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDE4LjU1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQxNy4wMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0MTYuNTJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0MTAuNDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDguODlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDcwLjE0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQ1Ny4xOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0NTQuNTZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDQ0LjAzXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQxNjcuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0NTIuOThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDM5Ljk1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQzNC4zNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0ODQuMDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDc5Ljg0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NSxcblx0XHRcdFx0XHQyNC42MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MTkuODdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDM2LjA2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQyMy44M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0MTMuOTJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM0LFxuXHRcdFx0XHRcdDEzLjE3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQyODAuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0MTMxLjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDU0LjIyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQyNy4zMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NCxcblx0XHRcdFx0XHQzOS40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQxOS43NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MTcuNDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUsXG5cdFx0XHRcdFx0MTIuMDhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDYxLjA5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQyNS4zOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NSxcblx0XHRcdFx0XHQyMS4xN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NCxcblx0XHRcdFx0XHQxOC4xOFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MzI0Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDY5LjQ1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQzMS4xNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0MzAuMDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0MTYyLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0MjUuMDJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUsXG5cdFx0XHRcdFx0MjQuODlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDEyLjk3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1LFxuXHRcdFx0XHRcdDg2LjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQ0Ny45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQ0Ny40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTQsXG5cdFx0XHRcdFx0MjMuMzRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDE0OS41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQxNDYuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTQsXG5cdFx0XHRcdFx0MzcuNzJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU2LFxuXHRcdFx0XHRcdDIzLjAzXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQzMDkuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0MTE0Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDg0Ljc2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQ0MS44XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQyMTAuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0MTk0LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYxLFxuXHRcdFx0XHRcdDcxLjU0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQ1OC4wNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0NjM0LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDc0LjAyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQ2NS42NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0NTguNDVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDM4NjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYxLFxuXHRcdFx0XHRcdDY3LjgzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQ2Mi41MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0NDUuMDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU0LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU0LFxuXHRcdFx0XHRcdDQzOC4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQxODEuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTYsXG5cdFx0XHRcdFx0NjYuMTdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUzLFxuXHRcdFx0XHRcdDYzLjg3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQ3OTE3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQ2MS45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQxOC43M1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0NTcxLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDI2OS41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NCxcblx0XHRcdFx0XHQ1Ny4wMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTYsXG5cdFx0XHRcdFx0NDkuMjdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDE0OThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU0LFxuXHRcdFx0XHRcdDI2Mi4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQyNTEuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MjI1LjJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDE1NjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYxLFxuXHRcdFx0XHRcdDU2My42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQ1NjIuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDcsXG5cdFx0XHRcdFx0MTMzLjRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDY4Mzdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDkwLjMxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ2NC4yMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0NTQuNTFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDEyOTBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDEwNi40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ0OC40OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0NDMuMjlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDUwODBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDEyMC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQxMDIuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTQsXG5cdFx0XHRcdFx0NTkuMjlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDQ4OC45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MSxcblx0XHRcdFx0XHQxNTcuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0MjIuMDdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDE2LjEyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQzNzYuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0MTQzLjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDM5LjQ0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQxMC44MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0NDY4OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0ODUuODRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDcyLjY1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ1MC42MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0MTc5NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0NDc3LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ2LFxuXHRcdFx0XHRcdDIyOC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MCxcblx0XHRcdFx0XHQxNDAuM1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0NDI3LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDk1LjIyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQ3Ni45NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDYsXG5cdFx0XHRcdFx0MzEuNjdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ2LFxuXHRcdFx0XHRcdDM1OC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NSxcblx0XHRcdFx0XHQyMzcuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0MjM0LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDExMi44XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQ4NTJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDY5OS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNCxcblx0XHRcdFx0XHQ0OS4xN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0MzIuNzdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDEzODhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDEzMjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM0LFxuXHRcdFx0XHRcdDM4LjU1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQxNi43N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Nixcblx0XHRcdFx0XHQxNjkuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTQsXG5cdFx0XHRcdFx0OTcuOTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDYyLjQ4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQzNS4yMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0NzYuNDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0NjcuMThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIsXG5cdFx0XHRcdFx0MTQuNjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUsXG5cdFx0XHRcdFx0MTMuMTdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0MTQ3Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0NjIuNjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUsXG5cdFx0XHRcdFx0Mi45NzJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIsXG5cdFx0XHRcdFx0MC4wNjMzXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0MjI2LjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIsXG5cdFx0XHRcdFx0MzguNDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0MTguNzJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEsXG5cdFx0XHRcdFx0NS4wMzdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDAsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTksXG5cdFx0XHRcdFx0NTcuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzksXG5cdFx0XHRcdFx0MTMuMDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDkuMTg3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdDcuOTQ1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3OSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdDIyLjI1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxLFxuXHRcdFx0XHRcdDE3LjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOSxcblx0XHRcdFx0XHQxNi44NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MTYuMTNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEsXG5cdFx0XHRcdFx0MTgzLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDAsXG5cdFx0XHRcdFx0MTE2LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc5LFxuXHRcdFx0XHRcdDUuMTY2XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxLFxuXHRcdFx0XHRcdDQyLjgzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyLFxuXHRcdFx0XHRcdDI0LjIzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdDExLjc4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOSxcblx0XHRcdFx0XHQ3LjIzOVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Mixcblx0XHRcdFx0XHQ1Ni4yMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MSxcblx0XHRcdFx0XHQ0OS4wMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQ4Ljg2NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MCxcblx0XHRcdFx0XHQ4LjMxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxLFxuXHRcdFx0XHRcdDE1MS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyLFxuXHRcdFx0XHRcdDc2LjAzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdDMuMjU5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyLFxuXHRcdFx0XHRcdDE1NC4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxLFxuXHRcdFx0XHRcdDMyLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0MTQuNzRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDAsXG5cdFx0XHRcdFx0Ni4yNDJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Mixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3OCxcblx0XHRcdFx0XHQyNi45NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzcsXG5cdFx0XHRcdFx0MTcuMjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDEyLjg2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOSxcblx0XHRcdFx0XHQxMS42MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzgsXG5cdFx0XHRcdFx0NjcuNDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc5LFxuXHRcdFx0XHRcdDU2LjQ1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdDcuNjcyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nyxcblx0XHRcdFx0XHQxLjg5MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzgsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzcsXG5cdFx0XHRcdFx0MTE4Ljhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc4LFxuXHRcdFx0XHRcdDQzLjc2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nixcblx0XHRcdFx0XHQ1LjI5NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjAsXG5cdFx0XHRcdFx0NC42ODVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0NjY3Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDQ0Mi42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQ5NS4xMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0ODMuNjFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDIzMy4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQ4Mi4wM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0NzQuMzNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDMyLjI0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQxNzYuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0MTM5LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDQ4LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI0LFxuXHRcdFx0XHRcdDQzLjU3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQ3MzguOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MTQwLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDEzMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0NTEuOTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDM0M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0MTY5LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDEwMS41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQ1My42OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0NjMxLjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDI0Mi4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQxMDkuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0ODIuNDRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDE0Nzdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDQxMy45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQyMDIuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0ODQuMjNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDIwNi4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQxMDkuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0NjAuMDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDQ3LjcxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQxNTY2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQyMDIuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MTUwLjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDcwLjY0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQzNjUuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MTAzLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDgyLjkxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQ0NS4xMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0Mjc1NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MzE0LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDI1NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0ODQuMzFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDczMy44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQxMjkuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjMsXG5cdFx0XHRcdFx0OTQuMTJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDQ1LjI1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQ1MjUuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MTUwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQxMjguN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0NTMuODRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDQwNTVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDIzMC45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQxNTQuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0NjEuMjZcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDUwMi43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQxNTcuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0NzguMjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE5LFxuXHRcdFx0XHRcdDQ1LjE1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQxMzU3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQyOTAuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MTQ4LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI0LFxuXHRcdFx0XHRcdDYyLjExXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQyMjA4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQ2MzcuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MTI2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQ3Ni4wOFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0Mzc0MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQyMDQuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0NzguNTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDQxNjBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDQ2OFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0NTUzMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjMsXG5cdFx0XHRcdFx0MzEzLjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDI0MS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQ2Mi45OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0NjM2NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0MzkxLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDE4Ny44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQ4OC4yOVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0ODkuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjEsXG5cdFx0XHRcdFx0NjguMDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDM1LjU0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMCxcblx0XHRcdFx0XHQzMC44OFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0NzEzLjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDE0MC4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQxMjYuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0MjMuNDJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDY2MS45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQxNDIuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0NzguMzZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDMwLjU1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMSxcblx0XHRcdFx0XHQxNjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDEwOS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQ3Ni42NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjIsXG5cdFx0XHRcdFx0NjEuODRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDE0NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0NjAuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0NTkuMjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIxLFxuXHRcdFx0XHRcdDM3LjUyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQ2NS4xN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzMsXG5cdFx0XHRcdFx0NDQuNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDQ0LjQyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQyOS42NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0MTA4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQ1Ny44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQ0OC4yMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MzMuNTFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDE0Mi42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQ2NS44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQ1OS4wN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MzAuMzlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDE5My44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQ2My45MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjMsXG5cdFx0XHRcdFx0NTAuMTNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDI3LjU0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOSxcblx0XHRcdFx0XHQyMTAuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MTM5Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDg4LjEzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQ3Ny4wN1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjAsXG5cdFx0XHRcdFx0MTM2LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIxLFxuXHRcdFx0XHRcdDEzMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0MTQuNDZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDUuNjE3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMCxcblx0XHRcdFx0XHQyNjkuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjMsXG5cdFx0XHRcdFx0MTUyLjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI0LFxuXHRcdFx0XHRcdDY0LjQ5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQ1NS43MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzMsXG5cdFx0XHRcdFx0MTUxLjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDY4LjMyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQzOS42OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0MzMuOTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE5LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDEwMC42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMSxcblx0XHRcdFx0XHQ5MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0MTguNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDE3LjRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIxLFxuXHRcdFx0XHRcdDI5LjE2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMixcblx0XHRcdFx0XHQyMS40NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjAsXG5cdFx0XHRcdFx0MTEuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzYsXG5cdFx0XHRcdFx0Ny4wMDVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDQxLjc3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMSxcblx0XHRcdFx0XHQyNi44NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTksXG5cdFx0XHRcdFx0OS4wNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0Ny42NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjEsXG5cdFx0XHRcdFx0MTM3LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDgwLjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE4LFxuXHRcdFx0XHRcdDE1LjcyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMCxcblx0XHRcdFx0XHQxMy40MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzYsXG5cdFx0XHRcdFx0MzIuMDdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc1LFxuXHRcdFx0XHRcdDIwLjk5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMSxcblx0XHRcdFx0XHQ1LjQ5M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzQsXG5cdFx0XHRcdFx0NS4xNzNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc3LFxuXHRcdFx0XHRcdDE5LjIyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nixcblx0XHRcdFx0XHQ5LjIzNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjAsXG5cdFx0XHRcdFx0OC40OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzgsXG5cdFx0XHRcdFx0Ny4wNDlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc3LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc3LFxuXHRcdFx0XHRcdDUwLjE5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nixcblx0XHRcdFx0XHQ0Ni4yNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzUsXG5cdFx0XHRcdFx0NC45NDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc4LFxuXHRcdFx0XHRcdDMuMTU4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQ2NS40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTksXG5cdFx0XHRcdFx0MzMuNjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDMwLjExXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQyNC44N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0NDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDI2LjkxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQyNC44OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MTQuODVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDM0LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDI0LjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQyMy42M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MTkuODhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDE5LjE3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQxNi41MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0MTMuNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDEzLjM5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQxMC41NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0MTAuMjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0OS43MTNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0OS4xNTNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0MTUuNDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0MTUuMThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDcuODNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIsXG5cdFx0XHRcdFx0Ni45NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQyOC4zNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NCxcblx0XHRcdFx0XHQyNS43M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Mixcblx0XHRcdFx0XHQxMS41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQ5LjE5MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MjAuOTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDEzLjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDEyLjkxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQ4LjE3MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQxMi45MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MTAuMjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIsXG5cdFx0XHRcdFx0OC45NzRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDcuMTI0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzLFxuXHRcdFx0XHRcdDI0Ljk2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyLFxuXHRcdFx0XHRcdDE2LjQ2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0LFxuXHRcdFx0XHRcdDguMTYxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxLFxuXHRcdFx0XHRcdDguMDMzXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzLFxuXHRcdFx0XHRcdDUwLjM4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyLFxuXHRcdFx0XHRcdDMwLjExXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0LFxuXHRcdFx0XHRcdDkuMTUzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxLFxuXHRcdFx0XHRcdDcuNzY4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQxODA1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQ1NzRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDE0Ny43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQ3Ni42N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MjQ1LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDEzOC4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQzNy45NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0MzEuOTNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDYzNy40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ0MTIuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MjY2LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU0LFxuXHRcdFx0XHRcdDE3NC41XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQxMTEwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQxNTAuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0OTEuNjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDQwLjQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQ2MTM0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQyMjkuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MTk0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQ2Ni44OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjMsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTYsXG5cdFx0XHRcdFx0Mzc3Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDM3MFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MjgzLjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU0LFxuXHRcdFx0XHRcdDEyMC45XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NCxcblx0XHRcdFx0XHQxNTg3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ4MTcuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0MTQwLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU3LFxuXHRcdFx0XHRcdDExNy41XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ0NTc5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NCxcblx0XHRcdFx0XHQzNjEuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTcsXG5cdFx0XHRcdFx0ODYuNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDMuOTc2XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF1cblx0XHRdXG5cdH0sXG5cdFwicmlnaHRFeWVcIjoge1xuXHRcdFwiaW5kZXhcIjogW1xuXHRcdFx0MjkzLFxuXHRcdFx0Mjg2LFxuXHRcdFx0MjgzLFxuXHRcdFx0Mjg4LFxuXHRcdFx0Mjg5LFxuXHRcdFx0MzMwLFxuXHRcdFx0Mjg1LFxuXHRcdFx0MjkwLFxuXHRcdFx0MjgzLFxuXHRcdFx0Mjg5LFxuXHRcdFx0MzM3LFxuXHRcdFx0MzMwLFxuXHRcdFx0Mjg3LFxuXHRcdFx0MjkyLFxuXHRcdFx0MzM3LFxuXHRcdFx0Mjg3LFxuXHRcdFx0Mjg2LFxuXHRcdFx0MjkzLFxuXHRcdFx0Mjg2LFxuXHRcdFx0Mjg1LFxuXHRcdFx0MjgzLFxuXHRcdFx0Mjg5LFxuXHRcdFx0Mjg3LFxuXHRcdFx0MzM3LFxuXHRcdFx0MjkyLFxuXHRcdFx0Mjg3LFxuXHRcdFx0MjkzXG5cdFx0XVxuXHR9LFxuXHRcImxlZnRFeWVcIjoge1xuXHRcdFwiaW5kZXhcIjogW1xuXHRcdFx0MTc1LFxuXHRcdFx0MTE5LFxuXHRcdFx0MTIxLFxuXHRcdFx0MTI1LFxuXHRcdFx0MTE5LFxuXHRcdFx0MTI2LFxuXHRcdFx0MTE1LFxuXHRcdFx0MTE3LFxuXHRcdFx0MTI1LFxuXHRcdFx0MTY4LFxuXHRcdFx0MTIxLFxuXHRcdFx0MTIwLFxuXHRcdFx0MTE1LFxuXHRcdFx0MTIyLFxuXHRcdFx0MTE4LFxuXHRcdFx0MTY4LFxuXHRcdFx0MTc1LFxuXHRcdFx0MTIxLFxuXHRcdFx0MTc1LFxuXHRcdFx0MTI2LFxuXHRcdFx0MTE5LFxuXHRcdFx0MTI1LFxuXHRcdFx0MTE3LFxuXHRcdFx0MTE5LFxuXHRcdFx0MTE1LFxuXHRcdFx0MTE4LFxuXHRcdFx0MTE3XG5cdFx0XVxuXHR9LFxuXHRcImJhY2tcIjoge1xuXHRcdFwiaW5kZXhcIjogW1xuXHRcdFx0OTEsXG5cdFx0XHQ5MCxcblx0XHRcdDI1Nyxcblx0XHRcdDI1NCxcblx0XHRcdDg2LFxuXHRcdFx0OTEsXG5cdFx0XHQyNTAsXG5cdFx0XHQ4Myxcblx0XHRcdDgyLFxuXHRcdFx0MTU0LFxuXHRcdFx0OTUsXG5cdFx0XHQ5NCxcblx0XHRcdDk1LFxuXHRcdFx0MTU0LFxuXHRcdFx0MTUzLFxuXHRcdFx0ODMsXG5cdFx0XHQxNTUsXG5cdFx0XHQxNTYsXG5cdFx0XHQyNjIsXG5cdFx0XHQzMTcsXG5cdFx0XHQzMTgsXG5cdFx0XHQzMTcsXG5cdFx0XHQyNjMsXG5cdFx0XHQzMTYsXG5cdFx0XHQzMTgsXG5cdFx0XHQyNTIsXG5cdFx0XHQyNjIsXG5cdFx0XHQ4Nixcblx0XHRcdDI1NCxcblx0XHRcdDI1MCxcblx0XHRcdDkxLFxuXHRcdFx0MjU3LFxuXHRcdFx0MjU5LFxuXHRcdFx0ODAsXG5cdFx0XHQyNDgsXG5cdFx0XHQyNjAsXG5cdFx0XHQ3Nyxcblx0XHRcdDI0NSxcblx0XHRcdDI0Nyxcblx0XHRcdDE3Nyxcblx0XHRcdDI2NSxcblx0XHRcdDI0NCxcblx0XHRcdDc2LFxuXHRcdFx0OTcsXG5cdFx0XHQxNzcsXG5cdFx0XHQyNDUsXG5cdFx0XHQ3Nyxcblx0XHRcdDc2LFxuXHRcdFx0MjQ4LFxuXHRcdFx0ODAsXG5cdFx0XHQ3OCxcblx0XHRcdDI2MCxcblx0XHRcdDkwLFxuXHRcdFx0OTIsXG5cdFx0XHQyNTAsXG5cdFx0XHQ4Mixcblx0XHRcdDg2LFxuXHRcdFx0MTU2LFxuXHRcdFx0MTU0LFxuXHRcdFx0OTQsXG5cdFx0XHQ4Myxcblx0XHRcdDI1Mixcblx0XHRcdDE1NSxcblx0XHRcdDMxNyxcblx0XHRcdDI2Mixcblx0XHRcdDI2Myxcblx0XHRcdDkxLFxuXHRcdFx0MjU5LFxuXHRcdFx0MjU0LFxuXHRcdFx0NzgsXG5cdFx0XHQyNDcsXG5cdFx0XHQyNDgsXG5cdFx0XHQ3Nixcblx0XHRcdDE3Nyxcblx0XHRcdDI0NCxcblx0XHRcdDI0Nyxcblx0XHRcdDc4LFxuXHRcdFx0NzcsXG5cdFx0XHQyNjAsXG5cdFx0XHQyNTcsXG5cdFx0XHQ5MCxcblx0XHRcdDgzLFxuXHRcdFx0MTU2LFxuXHRcdFx0OTQsXG5cdFx0XHQzMTgsXG5cdFx0XHQxNTUsXG5cdFx0XHQyNTIsXG5cdFx0XHQ3Nixcblx0XHRcdDI0NCxcblx0XHRcdDI0NSxcblx0XHRcdDI2MCxcblx0XHRcdDkyLFxuXHRcdFx0ODAsXG5cdFx0XHQ4Myxcblx0XHRcdDI1MCxcblx0XHRcdDI1MlxuXHRcdF1cblx0fVxufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL3BjL2RhdGEvZmFjZTIuanNvblxuICoqIG1vZHVsZSBpZCA9IDE0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9