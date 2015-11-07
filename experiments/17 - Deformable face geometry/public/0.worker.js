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
/*!**********************************************************!*\
  !*** ./~/babel-loader!./~/eslint-loader!./src/worker.js ***!
  \**********************************************************/
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	var _delaunayFast = __webpack_require__(/*! delaunay-fast */ 1);
	
	var _delaunayFast2 = _interopRequireDefault(_delaunayFast);
	
	var _simpleQuadtree = __webpack_require__(/*! simple-quadtree */ 2);
	
	var _simpleQuadtree2 = _interopRequireDefault(_simpleQuadtree);
	
	var _standardfacedata = __webpack_require__(/*! ./standardfacedata */ 3);
	
	var _standardfacedata2 = _interopRequireDefault(_standardfacedata);
	
	self.THREE = {};
	importScripts('libs/three.js');
	
	var convertData = function convertData(vertices) {
	  var standardFace = new _standardfacedata2['default']();
	
	  var standardFacePoints = [];
	  var position = standardFace.data.face.position;
	  for (var i = 0; i < position.length; i += 3) {
	    standardFacePoints.push([position[i], position[i + 1]]);
	  }
	  standardFacePoints.push([1, 1]);
	  standardFacePoints.push([1, -1]);
	  standardFacePoints.push([-1, -1]);
	  standardFacePoints.push([-1, 1]);
	
	  var triangleIndices = _delaunayFast2['default'].triangulate(standardFacePoints);
	
	  // let tree = QuadTree(-1, -1, 2, 2)
	  // tree.put({x: 0, y: 0, w: 0, h: 0, string: 'test'})
	  // console.table(tree.get({x:0, y: 0, w: 0.01, h: 0.01}))
	
	  //*
	  var tree = (0, _simpleQuadtree2['default'])(-1, -1, 2, 2);
	  for (var i = 0; i < triangleIndices.length; i += 3) {
	    var v0 = standardFacePoints[triangleIndices[i]];
	    var v1 = standardFacePoints[triangleIndices[i + 1]];
	    var v2 = standardFacePoints[triangleIndices[i + 2]];
	    var minX = Math.min(v0[0], v1[0], v2[0]);
	    var minY = Math.min(v0[1], v1[1], v2[1]);
	    var maxX = Math.max(v0[0], v1[0], v2[0]);
	    var maxY = Math.max(v0[1], v1[1], v2[1]);
	    tree.put({
	      x: minX,
	      y: minY,
	      w: maxX - minX,
	      h: maxY - minY,
	      index: i,
	      v0: v0,
	      v1: v1,
	      v2: v2
	    });
	  }
	  // console.log(JSON.parse(tree.stringify()))
	  console.log(tree.root);
	
	  // tree.put({x: 0, y: 0, w: 0.001, h: 0.001, string: 'test'})
	  // console.table(tree.get({x:-0.001, y: -0.001, w: 0.1, h: 0.1}))
	
	  // console.log(tree.get({x: 0, y: 0, w: 0.1, h: 0.1}))
	  //*/
	
	  // console.table(tree.get({x: -0.25, y: -0.25, w: 0.5, h: 0.5}))
	  // console.log(triangleIndices.length / 3)
	
	  var getTriangleIndex = function getTriangleIndex(p) {
	    var candidate = tree.get({ x: p[0], y: p[1], w: 0, h: 0 });
	    for (var i = 0; i < candidate.length; i++) {
	      var node = candidate[i];
	      var uv = _delaunayFast2['default'].contains([node.v0, node.v1, node.v2], p);
	      if (uv) {
	        uv.unshift(1 - uv[0] - uv[1]);
	        return [node.index, uv];
	      }
	    }
	    console.error('not found');
	  };
	
	  var getTriangleIndex_ = function getTriangleIndex_(p, vertices) {
	    for (var i = 0; i < triangleIndices.length; i += 3) {
	      var uv = _delaunayFast2['default'].contains([vertices[triangleIndices[i]], vertices[triangleIndices[i + 1]], vertices[triangleIndices[i + 2]]], p);
	      if (uv) {
	        uv.unshift(1 - uv[0] - uv[1]);
	        return [i, uv];
	      }
	    }
	  };
	
	  /**
	  let p = [vertices[0][0], vertices[0][1]]
	  console.table(p)
	  {
	    let [index, uvw] = getTriangleIndex(p, standardFacePoints)
	    console.log(index, standardFacePoints[triangleIndices[index]], standardFacePoints[triangleIndices[index + 1]], standardFacePoints[triangleIndices[index + 2]], uvw)
	  }
	  {
	    let [index, uvw] = getTriangleIndex_(p, standardFacePoints)
	    console.log(index, standardFacePoints[triangleIndices[index]], standardFacePoints[triangleIndices[index + 1]], standardFacePoints[triangleIndices[index + 2]], uvw)
	  }
	  // return
	  */
	
	  return vertices.map(function (vertices) {
	    var weights = [];
	    for (var i = 0; i < vertices.length; i += 3) {
	      var _getTriangleIndex = getTriangleIndex([vertices[i], vertices[i + 1]], standardFacePoints);
	
	      var _getTriangleIndex2 = _slicedToArray(_getTriangleIndex, 2);
	
	      var index = _getTriangleIndex2[0];
	      var coord = _getTriangleIndex2[1];
	
	      weights.push(triangleIndices[index + 0], triangleIndices[index + 1], triangleIndices[index + 2], coord[0], coord[1], coord[2], vertices[i + 2]);
	    }
	    return new Float32Array(weights);
	  });
	};
	
	onmessage = function (event) {
	  console.log('start', performance.now());
	  var result = convertData(event.data);
	  console.log('done', performance.now());
	  postMessage(result, result.map(function (a) {
	    return a.buffer;
	  }));
	
	  // let loader = new self.THREE.XHRLoader()
	  // loader.load('keyframes.json', (text) => {
	  //   console.log('loaded', performance.now())
	  //   let data = JSON.parse(text)
	  //   console.log('parsed', performance.now())
	  //   data.user.property.morph = convertData(data.user.property.face_vertices)
	  //   console.log('done', performance.now())
	  //   postMessage(data)
	  // })
	};

/***/ },
/* 1 */
/*!*************************************!*\
  !*** ./~/delaunay-fast/delaunay.js ***!
  \*************************************/
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
/*!************************************!*\
  !*** ./~/simple-quadtree/qtree.js ***!
  \************************************/
/***/ function(module, exports, __webpack_require__) {

	/**
	*
	* simple-quadtree is a minimal quadtree implementation that supports simple put, get,
	* remove and clear operations on objects having a x, y position and w, h dimension.
	*
	* Copyright (c) 2013 Antti Saarinen <antti.p.saarinen@gmail.com>
	* https://github.com/asaarinen/qtree
	*
	*/
	function QuadTree(x, y, w, h, options) {
	
	    if( typeof x != 'number' || isNaN(x) )
	        x = 0;
	    if( typeof y != 'number' || isNaN(y) )
	        y = 0;
	    if( typeof w != 'number' || isNaN(w) )
	        w = 10;
	    if( typeof h != 'number' || isNaN(h) )
	        h = 10;
	    
	    var maxc = 25;
	    var leafratio = 0.5;
	    if( options ) {
	        if( typeof options.maxchildren == 'number' )
	            if( options.maxchildren > 0 )
	                maxc = options.maxchildren;
	        if( typeof options.leafratio == 'number' )
	            if( options.leafratio >= 0 )
	                leafratio = options.leafratio;
	    }
	
	    // validate an input object
	    function validate(obj) {
	        if( !obj )
	            return false;
	        if( typeof obj.x != 'number' ||
	            typeof obj.y != 'number' ||
	            typeof obj.w != 'number' ||
	            typeof obj.h != 'number' )
	            return false;
	        if( isNaN(obj.x) || isNaN(obj.y) ||
	            isNaN(obj.w) || isNaN(obj.h) )
	            return false;
	        if( obj.w < 0 || obj.h < 0 )
	            return false;
	        return true;
	    }
	
	    // test for deep equality for x,y,w,h
	    function isequal(o1, o2) {
	        if( o1.x == o2.x &&
	            o1.y == o2.y &&
	            o1.w == o2.w &&
	            o1.h == o2.h )
	            return true;
	        return false;
	    }
	
	    // create a new quadtree node
	    function createnode(x, y, w, h) {
	        return {
	            x: x,
	            y: y,
	            w: w,
	            h: h,
	            c: [],
	            l: [],
	            n: []
	        }
	    }
	
	    // root node used by this quadtree
	    var root = createnode(x, y, w, h);
	
	    // calculate distance between two points
	    function distance(x1, y1, x2, y2) {
	        return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
	    }
	    
	    // calculate distance between a point and a line (segment)
	    function distancePL(x, y, x1, y1, dx1, dy1, len1 ) {
	        if( !len1 ) // in case length is not provided, assume a line 
	            len1 = -1;
	        
	        // x = x1 + s * dx1 + t * dy1
	        // y = y1 + s * dy1 - t * dx1
	        // x * dy1 - y * dx1 = x1 * dy1 - y1 * dx1 + 
	        //                     t * ( dy1 * dy1 + dx1 * dx1 )
	        var t = dx1 * dx1 + dy1 * dy1;
	        if( t == 0 )
	            return null;
	        else {
	            t = ( x * dy1 - y * dx1 - x1 * dy1 + y1 * dx1 ) / t;
	            if( Math.abs(dx1) > Math.abs(dy1) )
	                var s = ( x - x1 - t * dy1 ) / dx1;
	            else
	                var s = ( y - y1 + t * dx1 ) / dy1;
	            if( ( s >= 0 && s <= len1 ) || len1 < 0 )
	                return {
	                    s: s,
	                    t: t,
	                    x: x1 + s * dx1,
	                    y: y1 + s * dy1,
	                    dist: Math.abs(t)
	                };
	            else if( s < 0 ) { 
	                var dist = distance(x, y, x1, y1);
	                return {
	                    s: s,
	                    dist: dist
	                };
	            } else {
	                var dist = distance(x, y,
	                                    x1 + len1*dx1, 
	                                    y1 + len1*dy1);
	                return {
	                    s: s,
	                    dist: dist
	                };
	            }
	        }
	    }
	    
	    // does a line and a rectangle overlap ?
	    function overlap_line(o1, o2, buf) {
	        if( !o1 || !o2 )
	            return true;
	        var dist = distancePL(o2.x + 0.5 * o2.w,
	                              o2.y + 0.5 * o2.h,
	                              o1.x, o1.y, o1.dx, o1.dy, o1.dist);
	        if( dist ) {
	            dist.dist -= buf;
	            if( dist.dist < 0 )
	                return true;
	            if( dist.dist * dist.dist <= o2.w * o2.w + o2.h * o2.h )
	                return true;
	        }
	        return false;
	    }
	
	    // do two rectangles overlap ?
	    function overlap_rect(o1, o2, buf) {
	        if( !o1 || !o2 )
	            return true;
	        if( o1.x + o1.w < o2.x - buf ||
	            o1.y + o1.h < o2.y - buf ||
	            o1.x - buf > o2.x + o2.w ||
	            o1.y - buf > o2.y + o2.h )
	            return false;
	        return true;
	    }
	
	    function isleaf(node, obj) {
	
	        var leaf = false;
	        if( obj.w * obj.h > node.w * node.h * leafratio )
	            leaf = true;
	
	        if( obj.x < node.x ||
	            obj.y < node.y ||
	            obj.x + obj.w > node.x + node.w ||
	            obj.y + obj.h > node.y + node.h )
	            leaf = true;
	
	        var childnode = null;
	        for( var ni = 0; ni < node.n.length; ni++ )
	            if( overlap_rect(obj, node.n[ni], 0) ) {
	                if( childnode ) { // multiple hits
	                    leaf = true;
	                    break;
	                } else
	                    childnode = node.n[ni];
	            }
	        
	        return { leaf: leaf,
	                 childnode: childnode };
	    }
	
	    // put an object to one of the child nodes of this node
	    function put_to_nodes(node, obj) {
	        var leaf = isleaf(node, obj);
	        if( leaf.leaf )
	            node.l.push(obj);
	        else if( leaf.childnode )
	            put(leaf.childnode, obj);
	        else
	            return;
	    }
	    
	    function update_coords(obj, updatedcoords) {
	        obj.x = ((typeof updatedcoords.x == 'number') ? updatedcoords.x : obj.x);
	        obj.y = ((typeof updatedcoords.y == 'number') ? updatedcoords.y : obj.y);
	        obj.w = ((typeof updatedcoords.w == 'number') ? updatedcoords.w : obj.w);
	        obj.h = ((typeof updatedcoords.h == 'number') ? updatedcoords.h : obj.h);
	    }
	
	    function update(node, obj, attr, updatedcoords) {
	        if( typeof attr == 'object' && typeof updatedcoords == 'undefined' ) {
	            updatedcoords = attr;
	            attr = false;
	        }
	
	        if( !validate(obj) || typeof updatedcoords == 'undefined' )
	            return false;
	
	        if( !attr )
	            attr = false;
	        else if( typeof attr != 'string' )
	            attr = 'id';
	
	        var count = 0;
	        for( var ci = 0; ci < node.c.length; ci++ )
	            if( ( attr && node.c[ci][attr] == obj[attr] ) ||
	                ( !attr && isequal(node.c[ci], obj) ) ) {
	
	                // found the object to be updated
	                var orig = node.c[ci];
	                update_coords(orig, updatedcoords);
	                
	                if( orig.x > node.x + node.w ||
	                    orig.y > node.y + node.h ||
	                    orig.x + orig.w < node.x ||
	                    orig.y + orig.h < node.y ) {
	
	                    // this object needs to be removed and added
	                    node.c.splice(ci, 1);
	                    put(root, orig);
	                } // updated object is still inside same node
	                
	                return true;
	            }
	        
	        for( var ci = 0; ci < node.l.length; ci++ )
	            if( ( attr && node.l[ci][attr] == obj[attr] ) ||
	                ( !attr && isequal(node.l[ci], obj) ) ) {
	                
	                var orig = node.l[ci];
	                update_coords(orig, updatedcoords);
	                
	                // found the object to be updated
	                if( orig.x > node.x + node.w ||
	                    orig.y > node.y + node.h ||
	                    orig.x + orig.w < node.x ||
	                    orig.y + orig.h < node.y ) {
	
	                    // this object needs to be removed and added 
	                    node.l.splice(ci, 1);
	                    put(root, orig);
	                } // updated object is still inside same node
	                
	                return true;
	            }
	
	        var leaf = isleaf(node, obj);
	        if( !leaf.leaf && leaf.childnode )
	            if( update(leaf.childnode, obj, attr) )
	                return true;
	        return false;
	    }
	
	    // remove an object from this node
	    function remove(node, obj, attr) {
	        if( !validate(obj) )
	            return 0;
	
	        if( !attr )
	            attr = false;
	        else if( typeof attr != 'string' )
	            attr = 'id';
	
	        var count = 0;
	        for( var ci = 0; ci < node.c.length; ci++ )
	            if( ( attr && node.c[ci][attr] == obj[attr] ) ||
	                ( !attr && isequal(node.c[ci], obj) ) ) {
	                count++;
	                node.c.splice(ci, 1);
	                ci--;
	            }
	
	        for( var ci = 0; ci < node.l.length; ci++ )
	            if( ( attr && node.l[ci][attr] == obj[attr] ) ||
	                ( !attr && isequal(node.l[ci], obj) ) ) {
	                count++;
	                node.l.splice(ci, 1);
	                ci--;
	            }
	
	        var leaf = isleaf(node, obj);
	        if( !leaf.leaf && leaf.childnode )
	            return count + remove(leaf.childnode, obj, attr);
	        return count;
	    }
	
	    // put an object to this node
	    function put(node, obj) {
	
	        if( !validate(obj) )
	            return;
	
	        if( node.n.length == 0 ) {
	            node.c.push(obj);
	            
	            // subdivide
	            if( node.c.length > maxc ) {
	                var w2 = node.w / 2;
	                var h2 = node.h / 2;
	                node.n.push(createnode(node.x, node.y, w2, h2),
	                            createnode(node.x + w2, node.y, w2, h2),
	                            createnode(node.x, node.y + h2, w2, h2),
	                            createnode(node.x + w2, node.y + h2, w2, h2));
	                for( var ci = 0; ci < node.c.length; ci++ ) 
	                    put_to_nodes(node, node.c[ci]);
	                node.c = [];
	            }
	        } else 
	            put_to_nodes(node, obj);
	    }
	
	    // iterate through all objects in this node matching given overlap
	    // function
	    function getter(overlapfun, node, obj, buf, strict, callbackOrArray) {
	        for( var li = 0; li < node.l.length; li++ )
	            if( !strict || overlapfun(obj, node.l[li], buf) )
	                if( typeof callbackOrArray == 'object' )
	                    callbackOrArray.push(node.l[li]);
	                else if( !callbackOrArray(node.l[li]) )
	                    return false;
	        for( var li = 0; li < node.c.length; li++ )
	            if( !strict || overlapfun(obj, node.c[li], buf) )
	                if( typeof callbackOrArray == 'object' )
	                    callbackOrArray.push(node.c[li]);
	                else if( !callbackOrArray(node.c[li]) )
	                    return false;
	        for( var ni = 0; ni < node.n.length; ni++ ) {
	            if( overlapfun(obj, node.n[ni], buf) ) {
	                if( typeof callbackOrArray == 'object' )
	                    callbackOrArray.concat(getter(overlapfun, node.n[ni], obj, buf, strict, callbackOrArray));
	                else if( !getter(overlapfun, node.n[ni], obj, buf, strict, callbackOrArray) )
	                    return false;
	            }
	        }
	        return true;
	    }
	
	    // iterate through all objects in this node matching the given rectangle
	    function get_rect(node, obj, buf, callbackOrArray) {
	        return getter(overlap_rect, node, obj, buf, true, callbackOrArray);
	    }
	
	    // iterate through all objects in this node matching the given
	    // line (segment)
	    function get_line(node, obj, buf, callbackOrArray) {
	        return getter(overlap_line, node, obj, buf, false, callbackOrArray);
	    }
	
	    // iterate through all objects in this node matching given
	    // geometry, either a rectangle or a line segment
	    function get(node, obj, buf, callbackOrArray) {
	
	        if( (typeof buf == 'function' || typeof buf == 'object') && typeof callbackOrArray == 'undefined' ) {
	            callbackOrArray = buf;
	            buf = 0;
	        }
	        if( typeof callbackOrArray == 'undefined' ) {
	            callbackOrArray = [];
	            buf = 0;
	        }
	        if( obj == null )
	            get_rect(node, obj, buf, callbackOrArray);
	        else if( typeof obj.x == 'number' &&
	                 typeof obj.y == 'number' &&
	                 !isNaN(obj.x) && !isNaN(obj.y) ) {
	            if( typeof obj.dx == 'number' &&
	                typeof obj.dy == 'number' &&
	                !isNaN(obj.dx) && !isNaN(obj.dy) )
	                get_line(node, obj, buf, callbackOrArray);
	            else if( typeof obj.w == 'number' &&
	                     typeof obj.h == 'number' &&
	                     !isNaN(obj.w) && !isNaN(obj.h) )
	                get_rect(node, obj, buf, callbackOrArray);
	        }
	        if( typeof callbackOrArray == 'object' ) 
	            return callbackOrArray;
	    }
	
	    // return the object interface
	    return {
	        get: function(obj, buf, callbackOrArray) {
	            return get(root, obj, buf, callbackOrArray);
	        },
	        put: function(obj) {
	            put(root, obj);
	        },
	        update: function(obj, attr, updatedcoords) {
	            return update(root, obj, attr, updatedcoords);
	        },
	        remove: function(obj, attr) {
	            return remove(root, obj, attr);
	        },
	        clear: function() {
	            root = createnode(x, y, w, h);
	        },
	        stringify: function() {
	            var strobj = {
	                x: x, y: y, w: w, h: h,
	                maxc: maxc, 
	                leafratio: leafratio,
	                root: root
	            };
	            try {
	                return JSON.stringify(strobj);
	            } catch(err) {
	                // could not stringify
	                // probably due to objects included in qtree being non-stringifiable
	                return null; 
	            }
	        },
	        parse: function(str) {
	            if( typeof str == 'string' )
	                str = JSON.parse(str);
	            
	            x = str.x;
	            y = str.y;
	            w = str.w;
	            h = str.h;
	            maxc = str.maxc;
	            leafratio = str.leafratio;
	            root = str.root;
	        }
	    };
	}
	
	// for use within node.js
	if( true )
	    module.exports = QuadTree;


/***/ },
/* 3 */
/*!*********************************!*\
  !*** ./src/standardfacedata.js ***!
  \*********************************/
/***/ function(module, exports, __webpack_require__) {

	/* global THREE */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _glMatrix = __webpack_require__(/*! gl-matrix */ 4);
	
	var StandardFaceData = (function () {
	  function StandardFaceData() {
	    _classCallCheck(this, StandardFaceData);
	
	    this.data = __webpack_require__(/*! ./data/face2.json */ 14);
	
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
	
	exports['default'] = StandardFaceData;
	module.exports = exports['default'];

/***/ },
/* 4 */
/*!**************************************!*\
  !*** ./~/gl-matrix/src/gl-matrix.js ***!
  \**************************************/
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
	
	exports.glMatrix = __webpack_require__(/*! ./gl-matrix/common.js */ 5);
	exports.mat2 = __webpack_require__(/*! ./gl-matrix/mat2.js */ 6);
	exports.mat2d = __webpack_require__(/*! ./gl-matrix/mat2d.js */ 7);
	exports.mat3 = __webpack_require__(/*! ./gl-matrix/mat3.js */ 8);
	exports.mat4 = __webpack_require__(/*! ./gl-matrix/mat4.js */ 9);
	exports.quat = __webpack_require__(/*! ./gl-matrix/quat.js */ 10);
	exports.vec2 = __webpack_require__(/*! ./gl-matrix/vec2.js */ 13);
	exports.vec3 = __webpack_require__(/*! ./gl-matrix/vec3.js */ 11);
	exports.vec4 = __webpack_require__(/*! ./gl-matrix/vec4.js */ 12);

/***/ },
/* 5 */
/*!*********************************************!*\
  !*** ./~/gl-matrix/src/gl-matrix/common.js ***!
  \*********************************************/
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
/*!*******************************************!*\
  !*** ./~/gl-matrix/src/gl-matrix/mat2.js ***!
  \*******************************************/
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
	
	var glMatrix = __webpack_require__(/*! ./common.js */ 5);
	
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
/*!********************************************!*\
  !*** ./~/gl-matrix/src/gl-matrix/mat2d.js ***!
  \********************************************/
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
	
	var glMatrix = __webpack_require__(/*! ./common.js */ 5);
	
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
/*!*******************************************!*\
  !*** ./~/gl-matrix/src/gl-matrix/mat3.js ***!
  \*******************************************/
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
	
	var glMatrix = __webpack_require__(/*! ./common.js */ 5);
	
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
/*!*******************************************!*\
  !*** ./~/gl-matrix/src/gl-matrix/mat4.js ***!
  \*******************************************/
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
	
	var glMatrix = __webpack_require__(/*! ./common.js */ 5);
	
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
/*!*******************************************!*\
  !*** ./~/gl-matrix/src/gl-matrix/quat.js ***!
  \*******************************************/
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
	
	var glMatrix = __webpack_require__(/*! ./common.js */ 5);
	var mat3 = __webpack_require__(/*! ./mat3.js */ 8);
	var vec3 = __webpack_require__(/*! ./vec3.js */ 11);
	var vec4 = __webpack_require__(/*! ./vec4.js */ 12);
	
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
/*!*******************************************!*\
  !*** ./~/gl-matrix/src/gl-matrix/vec3.js ***!
  \*******************************************/
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
	
	var glMatrix = __webpack_require__(/*! ./common.js */ 5);
	
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
/*!*******************************************!*\
  !*** ./~/gl-matrix/src/gl-matrix/vec4.js ***!
  \*******************************************/
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
	
	var glMatrix = __webpack_require__(/*! ./common.js */ 5);
	
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
/*!*******************************************!*\
  !*** ./~/gl-matrix/src/gl-matrix/vec2.js ***!
  \*******************************************/
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
	
	var glMatrix = __webpack_require__(/*! ./common.js */ 5);
	
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
/*!*****************************!*\
  !*** ./src/data/face2.json ***!
  \*****************************/
/***/ function(module, exports) {

	module.exports = {
		"face": {
			"position": [
				0.0382,
				-0.0637,
				0.0231,
				0,
				-0.0595,
				0.0392,
				0,
				-0.1035,
				0.07,
				0.0385,
				-0.1046,
				0.0528,
				0.0362,
				0.0816,
				-0.0528,
				0,
				0.0884,
				-0.0403,
				0,
				0,
				0,
				0.0424,
				-0.0086,
				-0.0141,
				0.075,
				0.0458,
				-0.0968,
				0.0768,
				-0.0414,
				-0.0718,
				0,
				-0.1535,
				0.0716,
				0.0385,
				-0.149,
				0.0561,
				0.0915,
				-0.1514,
				-0.0111,
				0.093,
				-0.1199,
				-0.0211,
				0,
				-0.1848,
				0.0471,
				0.0339,
				-0.1775,
				0.0348,
				0.0803,
				-0.1711,
				-0.008,
				0.0147,
				-0.1903,
				0.0094,
				0,
				-0.1953,
				0.011,
				0.0308,
				-0.201,
				-0.0237,
				0,
				-0.2085,
				-0.017,
				0.1212,
				-0.0547,
				-0.1007,
				0.1832,
				-0.0105,
				-0.1295,
				0.2343,
				-0.0855,
				-0.1383,
				0.1761,
				-0.1329,
				-0.1131,
				0.2219,
				-0.2308,
				-0.1442,
				0.242,
				-0.2794,
				-0.1579,
				0.3065,
				-0.2407,
				-0.2255,
				0.2906,
				-0.1915,
				-0.1963,
				0.173,
				-0.2579,
				-0.1134,
				0.1935,
				-0.3033,
				-0.1192,
				0.2683,
				-0.1395,
				-0.1633,
				0.2002,
				-0.1803,
				-0.1286,
				0.1532,
				-0.2071,
				-0.1068,
				0.316,
				-0.2869,
				-0.2482,
				0.2565,
				-0.3244,
				-0.1701,
				0.2062,
				-0.3399,
				-0.1266,
				0.3208,
				-0.3585,
				-0.2788,
				0.2384,
				-0.4121,
				-0.1678,
				0.1942,
				-0.398,
				-0.1226,
				0.1389,
				-0.3195,
				-0.073,
				0.1494,
				-0.3394,
				-0.1046,
				0.1675,
				-0.3243,
				-0.1033,
				0.1441,
				-0.2947,
				-0.0797,
				0.0772,
				-0.4293,
				-0.0635,
				0,
				-0.4403,
				-0.0355,
				0,
				-0.4751,
				-0.0496,
				0.0958,
				-0.4704,
				-0.0751,
				0.1266,
				-0.4083,
				-0.0847,
				0.1474,
				-0.3538,
				-0.1142,
				0.116,
				-0.385,
				-0.0813,
				0.1679,
				-0.3756,
				-0.1115,
				0.0893,
				-0.2892,
				-0.0363,
				0.0756,
				-0.3043,
				-0.0215,
				0.166,
				-0.3478,
				-0.1165,
				0.1813,
				-0.3445,
				-0.1171,
				0.1542,
				-0.346,
				-0.1184,
				0.1419,
				-0.3524,
				-0.1205,
				0.1219,
				-0.3365,
				-0.0927,
				0.1411,
				-0.342,
				-0.1134,
				0.1325,
				-0.3287,
				-0.079,
				0.0726,
				-0.321,
				-0.0287,
				0.0665,
				-0.3302,
				-0.0492,
				0,
				-0.3067,
				-0.0054,
				0,
				-0.3211,
				-0.0088,
				0,
				-0.3293,
				-0.0303,
				0.125,
				-0.2197,
				-0.0862,
				0.0554,
				-0.2347,
				-0.0376,
				0.0403,
				-0.282,
				-0.0206,
				0,
				-0.2889,
				-0.0137,
				0.1074,
				-0.1759,
				-0.0861,
				0.1349,
				-0.1632,
				-0.102,
				0,
				-0.2425,
				-0.0275,
				0.1186,
				-0.1511,
				-0.0867,
				0,
				-0.5273,
				-0.0393,
				0.1136,
				-0.5194,
				-0.077,
				0.229,
				-0.5102,
				-0.2083,
				0.3185,
				-0.4287,
				-0.3121,
				0.3501,
				-0.3836,
				-0.3671,
				0.3452,
				-0.3205,
				-0.332,
				0.3822,
				-0.3111,
				-0.4464,
				0.3749,
				-0.2628,
				-0.4023,
				0.4374,
				0.1364,
				-0.5792,
				0.4293,
				0.2308,
				-0.5725,
				0.3968,
				0.2382,
				-0.3646,
				0.4166,
				0.0456,
				-0.3992,
				0.4383,
				0.0538,
				-0.5802,
				0.4146,
				-0.0275,
				-0.4276,
				0.4097,
				-0.0817,
				-0.4557,
				0.4087,
				-0.1254,
				-0.4789,
				0.4289,
				-0.0892,
				-0.5588,
				0.4362,
				-0.014,
				-0.5724,
				0.4104,
				-0.1863,
				-0.53,
				0.3564,
				0.3587,
				-0.3653,
				0.4126,
				0.345,
				-0.5495,
				0.3908,
				0.447,
				-0.5159,
				0.3253,
				0.4758,
				-0.3885,
				0.1182,
				-0.5897,
				-0.1052,
				0.1384,
				0.1366,
				-0.1568,
				0.122,
				0.1457,
				-0.1284,
				0.0892,
				0.1102,
				-0.1424,
				0.1102,
				0.1075,
				-0.16,
				0.1891,
				0.0405,
				-0.145,
				0.1861,
				0.0672,
				-0.1517,
				0.1363,
				0.0889,
				-0.1573,
				0.1201,
				0.0699,
				-0.1434,
				0.2323,
				0.0618,
				-0.161,
				0.2381,
				0.0356,
				-0.1622,
				0.2843,
				0.0776,
				-0.1906,
				0.2947,
				0.0567,
				-0.1978,
				0.3367,
				0.1024,
				-0.2433,
				0.3215,
				0.1103,
				-0.231,
				0.3318,
				0.1421,
				-0.2005,
				0.3184,
				0.1346,
				-0.2049,
				0.3099,
				0.263,
				-0.1506,
				0.1514,
				0.1273,
				-0.1625,
				0.1288,
				0.1081,
				-0.1678,
				0.1857,
				0.0927,
				-0.1567,
				0.1511,
				0.1068,
				-0.1652,
				0.2297,
				0.0869,
				-0.1619,
				0.3097,
				0.1162,
				-0.2225,
				0.2797,
				0.096,
				-0.1889,
				0.1422,
				0.1135,
				-0.1754,
				0.2335,
				0.1701,
				-0.156,
				0.1823,
				0.16,
				-0.1564,
				0.1831,
				0.148,
				-0.1599,
				0.2322,
				0.1568,
				-0.1574,
				0.2523,
				0.217,
				-0.1046,
				0.1852,
				0.2017,
				-0.0885,
				0.1813,
				0.1643,
				-0.1314,
				0.2398,
				0.174,
				-0.1341,
				0.1087,
				0.1725,
				-0.081,
				0.0656,
				0.1195,
				-0.101,
				0.2538,
				-0.0034,
				-0.1545,
				0.3189,
				0.0274,
				-0.207,
				0.3622,
				0.0862,
				-0.2591,
				0.3523,
				0.1768,
				-0.1931,
				0.3045,
				0.2032,
				-0.1411,
				0.2539,
				0.288,
				-0.1017,
				0.0341,
				0.1289,
				-0.0624,
				0.0728,
				0.2393,
				-0.0477,
				0.3701,
				0.2128,
				-0.2486,
				0,
				0.1313,
				-0.0519,
				0,
				0.2437,
				-0.0432,
				0.2511,
				0.3352,
				-0.12,
				0.2533,
				0.3979,
				-0.163,
				0.12,
				0.4175,
				-0.1039,
				0.1189,
				0.3357,
				-0.0679,
				0,
				0.4192,
				-0.0919,
				0,
				0.3326,
				-0.0612,
				0.1235,
				0.5276,
				-0.1888,
				0.2449,
				0.5119,
				-0.2501,
				0,
				0.5359,
				-0.1736,
				0.3286,
				0.5511,
				-0.4387,
				0.2381,
				0.6051,
				-0.3678,
				0,
				0.6365,
				-0.2955,
				0.1195,
				0.6298,
				-0.3172,
				0.3888,
				0.0584,
				-0.2879,
				0.3496,
				-0.0227,
				-0.2205,
				0.285,
				-0.0644,
				-0.1628,
				0.309,
				-0.1166,
				-0.1913,
				0.3245,
				-0.1683,
				-0.2308,
				0.3338,
				-0.2148,
				-0.266,
				0.3385,
				-0.2569,
				-0.2954,
				0.3632,
				-0.0696,
				-0.2512,
				0.367,
				-0.1213,
				-0.2932,
				0.3705,
				-0.1653,
				-0.3317,
				0.3719,
				-0.2045,
				-0.3637,
				0.3052,
				0.1258,
				-0.2018,
				0.125,
				-0.1272,
				-0.0965,
				0.088,
				-0.0903,
				-0.0362,
				0.111,
				-0.3732,
				-0.0862,
				0.1795,
				0.2777,
				-0.0749,
				0.2905,
				0.1615,
				-0.1671,
				0.2798,
				0.1583,
				-0.1795,
				0.2772,
				0.1459,
				-0.181,
				0.1066,
				-0.3661,
				-0.0943,
				0,
				-0.6053,
				-0.0702,
				0.0711,
				-0.4087,
				-0.0506,
				0.0677,
				-0.3893,
				-0.0555,
				0,
				-0.4152,
				-0.0227,
				0,
				-0.392,
				-0.0271,
				0.0663,
				-0.3813,
				-0.0676,
				0,
				-0.3829,
				-0.0388,
				-0.0382,
				-0.0637,
				0.0231,
				-0.0385,
				-0.1046,
				0.0528,
				-0.0362,
				0.0816,
				-0.0528,
				-0.0424,
				-0.0086,
				-0.0141,
				-0.075,
				0.0458,
				-0.0968,
				-0.0768,
				-0.0414,
				-0.0718,
				-0.0385,
				-0.149,
				0.0561,
				-0.0915,
				-0.1514,
				-0.0111,
				-0.093,
				-0.1199,
				-0.0211,
				-0.0339,
				-0.1775,
				0.0348,
				-0.0803,
				-0.1711,
				-0.008,
				-0.0147,
				-0.1903,
				0.0094,
				-0.0308,
				-0.201,
				-0.0237,
				-0.1212,
				-0.0547,
				-0.1007,
				-0.1832,
				-0.0105,
				-0.1295,
				-0.2343,
				-0.0855,
				-0.1383,
				-0.1761,
				-0.1329,
				-0.1131,
				-0.2219,
				-0.2308,
				-0.1442,
				-0.3065,
				-0.2407,
				-0.2255,
				-0.242,
				-0.2794,
				-0.1579,
				-0.2906,
				-0.1915,
				-0.1963,
				-0.173,
				-0.2579,
				-0.1134,
				-0.1935,
				-0.3033,
				-0.1192,
				-0.2002,
				-0.1803,
				-0.1286,
				-0.2683,
				-0.1395,
				-0.1633,
				-0.1532,
				-0.2071,
				-0.1068,
				-0.316,
				-0.2869,
				-0.2482,
				-0.2565,
				-0.3244,
				-0.1701,
				-0.2062,
				-0.3399,
				-0.1266,
				-0.3208,
				-0.3585,
				-0.2788,
				-0.2384,
				-0.4121,
				-0.1678,
				-0.1942,
				-0.398,
				-0.1226,
				-0.1389,
				-0.3195,
				-0.073,
				-0.1441,
				-0.2947,
				-0.0797,
				-0.1675,
				-0.3243,
				-0.1033,
				-0.1494,
				-0.3394,
				-0.1046,
				-0.0772,
				-0.4293,
				-0.0635,
				-0.0958,
				-0.4704,
				-0.0751,
				-0.1266,
				-0.4083,
				-0.0847,
				-0.1474,
				-0.3538,
				-0.1142,
				-0.1679,
				-0.3756,
				-0.1115,
				-0.116,
				-0.385,
				-0.0813,
				-0.0756,
				-0.3043,
				-0.0215,
				-0.0893,
				-0.2892,
				-0.0363,
				-0.166,
				-0.3478,
				-0.1165,
				-0.1813,
				-0.3445,
				-0.1171,
				-0.1542,
				-0.346,
				-0.1184,
				-0.1419,
				-0.3524,
				-0.1205,
				-0.1219,
				-0.3365,
				-0.0927,
				-0.1325,
				-0.3287,
				-0.079,
				-0.1411,
				-0.342,
				-0.1134,
				-0.0726,
				-0.321,
				-0.0287,
				-0.0665,
				-0.3302,
				-0.0492,
				-0.125,
				-0.2197,
				-0.0862,
				-0.0554,
				-0.2347,
				-0.0376,
				-0.0403,
				-0.282,
				-0.0206,
				-0.1074,
				-0.1759,
				-0.0861,
				-0.1349,
				-0.1632,
				-0.102,
				-0.1186,
				-0.1511,
				-0.0867,
				-0.1136,
				-0.5194,
				-0.077,
				-0.229,
				-0.5102,
				-0.2083,
				-0.3185,
				-0.4287,
				-0.3121,
				-0.3452,
				-0.3205,
				-0.332,
				-0.3501,
				-0.3836,
				-0.3671,
				-0.3822,
				-0.3111,
				-0.4464,
				-0.3749,
				-0.2628,
				-0.4023,
				-0.4374,
				0.1364,
				-0.5792,
				-0.3968,
				0.2382,
				-0.3646,
				-0.4293,
				0.2308,
				-0.5725,
				-0.4166,
				0.0456,
				-0.3992,
				-0.4383,
				0.0538,
				-0.5802,
				-0.4146,
				-0.0275,
				-0.4276,
				-0.4097,
				-0.0817,
				-0.4557,
				-0.4289,
				-0.0892,
				-0.5588,
				-0.4087,
				-0.1254,
				-0.4789,
				-0.4362,
				-0.014,
				-0.5724,
				-0.4104,
				-0.1863,
				-0.53,
				-0.3564,
				0.3587,
				-0.3653,
				-0.4126,
				0.345,
				-0.5495,
				-0.3908,
				0.447,
				-0.5159,
				-0.3253,
				0.4758,
				-0.3885,
				-0.1182,
				-0.5897,
				-0.1052,
				-0.1384,
				0.1366,
				-0.1568,
				-0.0892,
				0.1102,
				-0.1424,
				-0.122,
				0.1457,
				-0.1284,
				-0.1102,
				0.1075,
				-0.16,
				-0.1891,
				0.0405,
				-0.145,
				-0.1363,
				0.0889,
				-0.1573,
				-0.1861,
				0.0672,
				-0.1517,
				-0.1201,
				0.0699,
				-0.1434,
				-0.2323,
				0.0618,
				-0.161,
				-0.2381,
				0.0356,
				-0.1622,
				-0.2843,
				0.0776,
				-0.1906,
				-0.3367,
				0.1024,
				-0.2433,
				-0.2947,
				0.0567,
				-0.1978,
				-0.3215,
				0.1103,
				-0.231,
				-0.3318,
				0.1421,
				-0.2005,
				-0.3184,
				0.1346,
				-0.2049,
				-0.3099,
				0.263,
				-0.1506,
				-0.1514,
				0.1273,
				-0.1625,
				-0.1288,
				0.1081,
				-0.1678,
				-0.1511,
				0.1068,
				-0.1652,
				-0.1857,
				0.0927,
				-0.1567,
				-0.2297,
				0.0869,
				-0.1619,
				-0.3097,
				0.1162,
				-0.2225,
				-0.2797,
				0.096,
				-0.1889,
				-0.1422,
				0.1135,
				-0.1754,
				-0.2335,
				0.1701,
				-0.156,
				-0.2322,
				0.1568,
				-0.1574,
				-0.1831,
				0.148,
				-0.1599,
				-0.1823,
				0.16,
				-0.1564,
				-0.2523,
				0.217,
				-0.1046,
				-0.2398,
				0.174,
				-0.1341,
				-0.1813,
				0.1643,
				-0.1314,
				-0.1852,
				0.2017,
				-0.0885,
				-0.1087,
				0.1725,
				-0.081,
				-0.0656,
				0.1195,
				-0.101,
				-0.2538,
				-0.0034,
				-0.1545,
				-0.3189,
				0.0274,
				-0.207,
				-0.3622,
				0.0862,
				-0.2591,
				-0.3523,
				0.1768,
				-0.1931,
				-0.2539,
				0.288,
				-0.1017,
				-0.3045,
				0.2032,
				-0.1411,
				-0.0341,
				0.1289,
				-0.0624,
				-0.0728,
				0.2393,
				-0.0477,
				-0.3701,
				0.2128,
				-0.2486,
				-0.2511,
				0.3352,
				-0.12,
				-0.12,
				0.4175,
				-0.1039,
				-0.2533,
				0.3979,
				-0.163,
				-0.1189,
				0.3357,
				-0.0679,
				-0.1235,
				0.5276,
				-0.1888,
				-0.2449,
				0.5119,
				-0.2501,
				-0.3286,
				0.5511,
				-0.4387,
				-0.2381,
				0.6051,
				-0.3678,
				-0.1195,
				0.6298,
				-0.3172,
				-0.3888,
				0.0584,
				-0.2879,
				-0.3496,
				-0.0227,
				-0.2205,
				-0.285,
				-0.0644,
				-0.1628,
				-0.309,
				-0.1166,
				-0.1913,
				-0.3245,
				-0.1683,
				-0.2308,
				-0.3338,
				-0.2148,
				-0.266,
				-0.3385,
				-0.2569,
				-0.2954,
				-0.3632,
				-0.0696,
				-0.2512,
				-0.367,
				-0.1213,
				-0.2932,
				-0.3705,
				-0.1653,
				-0.3317,
				-0.3719,
				-0.2045,
				-0.3637,
				-0.3052,
				0.1258,
				-0.2018,
				-0.125,
				-0.1272,
				-0.0965,
				-0.088,
				-0.0903,
				-0.0362,
				-0.111,
				-0.3732,
				-0.0862,
				-0.1795,
				0.2777,
				-0.0749,
				-0.2905,
				0.1615,
				-0.1671,
				-0.2798,
				0.1583,
				-0.1795,
				-0.2772,
				0.1459,
				-0.181,
				-0.1066,
				-0.3661,
				-0.0943,
				-0.0711,
				-0.4087,
				-0.0506,
				-0.0677,
				-0.3893,
				-0.0555,
				-0.0663,
				-0.3813,
				-0.0676
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
		}
	};

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgZThlMjkxYjVlYjkxMWNhMzEzNjQiLCJ3ZWJwYWNrOi8vLy4vc3JjL3dvcmtlci5qcyIsIndlYnBhY2s6Ly8vLi9+L2RlbGF1bmF5LWZhc3QvZGVsYXVuYXkuanMiLCJ3ZWJwYWNrOi8vLy4vfi9zaW1wbGUtcXVhZHRyZWUvcXRyZWUuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0YW5kYXJkZmFjZWRhdGEuanMiLCJ3ZWJwYWNrOi8vLy4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC5qcyIsIndlYnBhY2s6Ly8vLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L2NvbW1vbi5qcyIsIndlYnBhY2s6Ly8vLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L21hdDIuanMiLCJ3ZWJwYWNrOi8vLy4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC9tYXQyZC5qcyIsIndlYnBhY2s6Ly8vLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L21hdDMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC9tYXQ0LmpzIiwid2VicGFjazovLy8uL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvcXVhdC5qcyIsIndlYnBhY2s6Ly8vLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L3ZlYzMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC92ZWM0LmpzIiwid2VicGFjazovLy8uL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvdmVjMi5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvZGF0YS9mYWNlMi5qc29uIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNB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QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsY0FBYSxPQUFPO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFF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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxNQUFNO0FBQ2pCLGNBQWEsT0FBTztBQUNwQjtBQUNBLDRCO0FBQ0E7QUFDQSxHOztBQUVBOzs7Ozs7Ozs7O0FDNVRBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsZ0I7QUFDQSxxQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsT0FBTztBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGVBQWM7QUFDZDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFD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O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FB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Y0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxxQkFBb0I7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxxQkFBb0I7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxxQkFBb0I7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLDRDQUEyQyxhQUFhOztBQUV4RDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxNQUFNO0FBQ2pCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLE1BQU07QUFDakIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxNQUFNO0FBQ2pCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZ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QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBLGdCOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0EsZ0I7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQSxnQjs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsT0FBTztBQUNwQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLE9BQU87QUFDcEI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtB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QTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxPQUFPO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxNQUFNO0FBQ2pCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsTUFBTTtBQUNqQixZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLFlBQVcsT0FBTztBQUNsQixZQUFXLFNBQVM7QUFDcEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsTUFBTTtBQUNuQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7O0FBRUEsd0JBQXVCLE9BQU87QUFDOUIsMkJBQTBCO0FBQzFCO0FBQ0EsMkJBQTBCO0FBQzFCOztBQUVBO0FBQ0E7QUFDQSxFQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixjQUFhLE9BQU87QUFDcEI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7Ozs7Ozs7Ozs7QUMxZ0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRyIsImZpbGUiOiIwLndvcmtlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgZThlMjkxYjVlYjkxMWNhMzEzNjRcbiAqKi8iLCJzZWxmLlRIUkVFID0ge31cbmltcG9ydFNjcmlwdHMoJ2xpYnMvdGhyZWUuanMnKVxuXG5pbXBvcnQgRGVsYXVuYXkgZnJvbSAnZGVsYXVuYXktZmFzdCdcbmltcG9ydCBRdWFkVHJlZSBmcm9tICdzaW1wbGUtcXVhZHRyZWUnXG5cbmltcG9ydCBTdGFuZGFyZEZhY2VEYXRhIGZyb20gJy4vc3RhbmRhcmRmYWNlZGF0YSdcblxuXG5jb25zdCBjb252ZXJ0RGF0YSA9ICh2ZXJ0aWNlcykgPT4ge1xuICBsZXQgc3RhbmRhcmRGYWNlID0gbmV3IFN0YW5kYXJkRmFjZURhdGEoKVxuXG4gIGxldCBzdGFuZGFyZEZhY2VQb2ludHMgPSBbXVxuICBsZXQgcG9zaXRpb24gPSBzdGFuZGFyZEZhY2UuZGF0YS5mYWNlLnBvc2l0aW9uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcG9zaXRpb24ubGVuZ3RoOyBpICs9IDMpIHtcbiAgICBzdGFuZGFyZEZhY2VQb2ludHMucHVzaChbcG9zaXRpb25baV0sIHBvc2l0aW9uW2kgKyAxXV0pXG4gIH1cbiAgc3RhbmRhcmRGYWNlUG9pbnRzLnB1c2goWzEsIDFdKVxuICBzdGFuZGFyZEZhY2VQb2ludHMucHVzaChbMSwgLTFdKVxuICBzdGFuZGFyZEZhY2VQb2ludHMucHVzaChbLTEsIC0xXSlcbiAgc3RhbmRhcmRGYWNlUG9pbnRzLnB1c2goWy0xLCAxXSlcblxuICBsZXQgdHJpYW5nbGVJbmRpY2VzID0gRGVsYXVuYXkudHJpYW5ndWxhdGUoc3RhbmRhcmRGYWNlUG9pbnRzKVxuXG4gIC8vIGxldCB0cmVlID0gUXVhZFRyZWUoLTEsIC0xLCAyLCAyKVxuICAvLyB0cmVlLnB1dCh7eDogMCwgeTogMCwgdzogMCwgaDogMCwgc3RyaW5nOiAndGVzdCd9KVxuICAvLyBjb25zb2xlLnRhYmxlKHRyZWUuZ2V0KHt4OjAsIHk6IDAsIHc6IDAuMDEsIGg6IDAuMDF9KSlcblxuICAvLypcbiAgbGV0IHRyZWUgPSBRdWFkVHJlZSgtMSwgLTEsIDIsIDIpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdHJpYW5nbGVJbmRpY2VzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgbGV0IHYwID0gc3RhbmRhcmRGYWNlUG9pbnRzW3RyaWFuZ2xlSW5kaWNlc1tpXV1cbiAgICBsZXQgdjEgPSBzdGFuZGFyZEZhY2VQb2ludHNbdHJpYW5nbGVJbmRpY2VzW2kgKyAxXV1cbiAgICBsZXQgdjIgPSBzdGFuZGFyZEZhY2VQb2ludHNbdHJpYW5nbGVJbmRpY2VzW2kgKyAyXV1cbiAgICBsZXQgbWluWCA9IE1hdGgubWluKHYwWzBdLCB2MVswXSwgdjJbMF0pXG4gICAgbGV0IG1pblkgPSBNYXRoLm1pbih2MFsxXSwgdjFbMV0sIHYyWzFdKVxuICAgIGxldCBtYXhYID0gTWF0aC5tYXgodjBbMF0sIHYxWzBdLCB2MlswXSlcbiAgICBsZXQgbWF4WSA9IE1hdGgubWF4KHYwWzFdLCB2MVsxXSwgdjJbMV0pXG4gICAgdHJlZS5wdXQoe1xuICAgICAgeDogbWluWCxcbiAgICAgIHk6IG1pblksXG4gICAgICB3OiBtYXhYIC0gbWluWCxcbiAgICAgIGg6IG1heFkgLSBtaW5ZLFxuICAgICAgaW5kZXg6IGksXG4gICAgICB2MCxcbiAgICAgIHYxLFxuICAgICAgdjIgICAgICBcbiAgICB9KVxuICB9XG4gIC8vIGNvbnNvbGUubG9nKEpTT04ucGFyc2UodHJlZS5zdHJpbmdpZnkoKSkpXG4gIGNvbnNvbGUubG9nKHRyZWUucm9vdClcblxuICAvLyB0cmVlLnB1dCh7eDogMCwgeTogMCwgdzogMC4wMDEsIGg6IDAuMDAxLCBzdHJpbmc6ICd0ZXN0J30pXG4gIC8vIGNvbnNvbGUudGFibGUodHJlZS5nZXQoe3g6LTAuMDAxLCB5OiAtMC4wMDEsIHc6IDAuMSwgaDogMC4xfSkpXG5cbiAgLy8gY29uc29sZS5sb2codHJlZS5nZXQoe3g6IDAsIHk6IDAsIHc6IDAuMSwgaDogMC4xfSkpXG4gIC8vKi9cblxuICAvLyBjb25zb2xlLnRhYmxlKHRyZWUuZ2V0KHt4OiAtMC4yNSwgeTogLTAuMjUsIHc6IDAuNSwgaDogMC41fSkpXG4gIC8vIGNvbnNvbGUubG9nKHRyaWFuZ2xlSW5kaWNlcy5sZW5ndGggLyAzKVxuXG5cbiAgY29uc3QgZ2V0VHJpYW5nbGVJbmRleCA9IChwKSA9PiB7XG4gICAgbGV0IGNhbmRpZGF0ZSA9IHRyZWUuZ2V0KHt4OiBwWzBdLCB5OiBwWzFdLCB3OiAwLCBoOiAwfSlcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNhbmRpZGF0ZS5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IG5vZGUgPSBjYW5kaWRhdGVbaV1cbiAgICAgIGxldCB1diA9IERlbGF1bmF5LmNvbnRhaW5zKFtub2RlLnYwLCBub2RlLnYxLCBub2RlLnYyXSwgcClcbiAgICAgIGlmICh1dikge1xuICAgICAgICB1di51bnNoaWZ0KDEgLSB1dlswXSAtIHV2WzFdKVxuICAgICAgICByZXR1cm4gW25vZGUuaW5kZXgsIHV2XVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmVycm9yKCdub3QgZm91bmQnKVxuICB9XG5cbiAgY29uc3QgZ2V0VHJpYW5nbGVJbmRleF8gPSAocCwgdmVydGljZXMpID0+IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRyaWFuZ2xlSW5kaWNlcy5sZW5ndGg7IGkgKz0gMykge1xuICAgICAgbGV0IHV2ID0gRGVsYXVuYXkuY29udGFpbnMoW3ZlcnRpY2VzW3RyaWFuZ2xlSW5kaWNlc1tpXV0sIHZlcnRpY2VzW3RyaWFuZ2xlSW5kaWNlc1tpICsgMV1dLCB2ZXJ0aWNlc1t0cmlhbmdsZUluZGljZXNbaSArIDJdXV0sIHApXG4gICAgICBpZiAodXYpIHtcbiAgICAgICAgdXYudW5zaGlmdCgxIC0gdXZbMF0gLSB1dlsxXSlcbiAgICAgICAgcmV0dXJuIFtpLCB1dl1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgbGV0IHAgPSBbdmVydGljZXNbMF1bMF0sIHZlcnRpY2VzWzBdWzFdXVxuICBjb25zb2xlLnRhYmxlKHApXG4gIHtcbiAgICBsZXQgW2luZGV4LCB1dnddID0gZ2V0VHJpYW5nbGVJbmRleChwLCBzdGFuZGFyZEZhY2VQb2ludHMpXG4gICAgY29uc29sZS5sb2coaW5kZXgsIHN0YW5kYXJkRmFjZVBvaW50c1t0cmlhbmdsZUluZGljZXNbaW5kZXhdXSwgc3RhbmRhcmRGYWNlUG9pbnRzW3RyaWFuZ2xlSW5kaWNlc1tpbmRleCArIDFdXSwgc3RhbmRhcmRGYWNlUG9pbnRzW3RyaWFuZ2xlSW5kaWNlc1tpbmRleCArIDJdXSwgdXZ3KVxuICB9XG4gIHtcbiAgICBsZXQgW2luZGV4LCB1dnddID0gZ2V0VHJpYW5nbGVJbmRleF8ocCwgc3RhbmRhcmRGYWNlUG9pbnRzKVxuICAgIGNvbnNvbGUubG9nKGluZGV4LCBzdGFuZGFyZEZhY2VQb2ludHNbdHJpYW5nbGVJbmRpY2VzW2luZGV4XV0sIHN0YW5kYXJkRmFjZVBvaW50c1t0cmlhbmdsZUluZGljZXNbaW5kZXggKyAxXV0sIHN0YW5kYXJkRmFjZVBvaW50c1t0cmlhbmdsZUluZGljZXNbaW5kZXggKyAyXV0sIHV2dylcbiAgfVxuICAvLyByZXR1cm5cbiAgKi9cblxuICByZXR1cm4gdmVydGljZXMubWFwKCh2ZXJ0aWNlcykgPT4ge1xuICAgIGxldCB3ZWlnaHRzID0gW11cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZlcnRpY2VzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICBsZXQgW2luZGV4LCBjb29yZF0gPSBnZXRUcmlhbmdsZUluZGV4KFt2ZXJ0aWNlc1tpXSwgdmVydGljZXNbaSArIDFdXSwgc3RhbmRhcmRGYWNlUG9pbnRzKVxuICAgICAgd2VpZ2h0cy5wdXNoKHRyaWFuZ2xlSW5kaWNlc1tpbmRleCArIDBdLCB0cmlhbmdsZUluZGljZXNbaW5kZXggKyAxXSwgdHJpYW5nbGVJbmRpY2VzW2luZGV4ICsgMl0sIGNvb3JkWzBdLCBjb29yZFsxXSwgY29vcmRbMl0sIHZlcnRpY2VzW2kgKyAyXSlcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkod2VpZ2h0cylcbiAgfSlcbn1cblxuXG5vbm1lc3NhZ2UgPSAoZXZlbnQpID0+IHtcbiAgY29uc29sZS5sb2coJ3N0YXJ0JywgcGVyZm9ybWFuY2Uubm93KCkpXG4gIGxldCByZXN1bHQgPSBjb252ZXJ0RGF0YShldmVudC5kYXRhKVxuICBjb25zb2xlLmxvZygnZG9uZScsIHBlcmZvcm1hbmNlLm5vdygpKVxuICBwb3N0TWVzc2FnZShyZXN1bHQsIHJlc3VsdC5tYXAoKGEpID0+IGEuYnVmZmVyKSlcblxuICAvLyBsZXQgbG9hZGVyID0gbmV3IHNlbGYuVEhSRUUuWEhSTG9hZGVyKClcbiAgLy8gbG9hZGVyLmxvYWQoJ2tleWZyYW1lcy5qc29uJywgKHRleHQpID0+IHtcbiAgLy8gICBjb25zb2xlLmxvZygnbG9hZGVkJywgcGVyZm9ybWFuY2Uubm93KCkpXG4gIC8vICAgbGV0IGRhdGEgPSBKU09OLnBhcnNlKHRleHQpXG4gIC8vICAgY29uc29sZS5sb2coJ3BhcnNlZCcsIHBlcmZvcm1hbmNlLm5vdygpKVxuICAvLyAgIGRhdGEudXNlci5wcm9wZXJ0eS5tb3JwaCA9IGNvbnZlcnREYXRhKGRhdGEudXNlci5wcm9wZXJ0eS5mYWNlX3ZlcnRpY2VzKVxuICAvLyAgIGNvbnNvbGUubG9nKCdkb25lJywgcGVyZm9ybWFuY2Uubm93KCkpXG4gIC8vICAgcG9zdE1lc3NhZ2UoZGF0YSlcbiAgLy8gfSlcbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9lc2xpbnQtbG9hZGVyIS4vc3JjL3dvcmtlci5qc1xuICoqLyIsInZhciBEZWxhdW5heTtcblxuKGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgRVBTSUxPTiA9IDEuMCAvIDEwNDg1NzYuMDtcblxuICBmdW5jdGlvbiBzdXBlcnRyaWFuZ2xlKHZlcnRpY2VzKSB7XG4gICAgdmFyIHhtaW4gPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXG4gICAgICAgIHltaW4gPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXG4gICAgICAgIHhtYXggPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXG4gICAgICAgIHltYXggPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXG4gICAgICAgIGksIGR4LCBkeSwgZG1heCwgeG1pZCwgeW1pZDtcblxuICAgIGZvcihpID0gdmVydGljZXMubGVuZ3RoOyBpLS07ICkge1xuICAgICAgaWYodmVydGljZXNbaV1bMF0gPCB4bWluKSB4bWluID0gdmVydGljZXNbaV1bMF07XG4gICAgICBpZih2ZXJ0aWNlc1tpXVswXSA+IHhtYXgpIHhtYXggPSB2ZXJ0aWNlc1tpXVswXTtcbiAgICAgIGlmKHZlcnRpY2VzW2ldWzFdIDwgeW1pbikgeW1pbiA9IHZlcnRpY2VzW2ldWzFdO1xuICAgICAgaWYodmVydGljZXNbaV1bMV0gPiB5bWF4KSB5bWF4ID0gdmVydGljZXNbaV1bMV07XG4gICAgfVxuXG4gICAgZHggPSB4bWF4IC0geG1pbjtcbiAgICBkeSA9IHltYXggLSB5bWluO1xuICAgIGRtYXggPSBNYXRoLm1heChkeCwgZHkpO1xuICAgIHhtaWQgPSB4bWluICsgZHggKiAwLjU7XG4gICAgeW1pZCA9IHltaW4gKyBkeSAqIDAuNTtcblxuICAgIHJldHVybiBbXG4gICAgICBbeG1pZCAtIDIwICogZG1heCwgeW1pZCAtICAgICAgZG1heF0sXG4gICAgICBbeG1pZCAgICAgICAgICAgICwgeW1pZCArIDIwICogZG1heF0sXG4gICAgICBbeG1pZCArIDIwICogZG1heCwgeW1pZCAtICAgICAgZG1heF1cbiAgICBdO1xuICB9XG5cbiAgZnVuY3Rpb24gY2lyY3VtY2lyY2xlKHZlcnRpY2VzLCBpLCBqLCBrKSB7XG4gICAgdmFyIHgxID0gdmVydGljZXNbaV1bMF0sXG4gICAgICAgIHkxID0gdmVydGljZXNbaV1bMV0sXG4gICAgICAgIHgyID0gdmVydGljZXNbal1bMF0sXG4gICAgICAgIHkyID0gdmVydGljZXNbal1bMV0sXG4gICAgICAgIHgzID0gdmVydGljZXNba11bMF0sXG4gICAgICAgIHkzID0gdmVydGljZXNba11bMV0sXG4gICAgICAgIGZhYnN5MXkyID0gTWF0aC5hYnMoeTEgLSB5MiksXG4gICAgICAgIGZhYnN5MnkzID0gTWF0aC5hYnMoeTIgLSB5MyksXG4gICAgICAgIHhjLCB5YywgbTEsIG0yLCBteDEsIG14MiwgbXkxLCBteTIsIGR4LCBkeTtcblxuICAgIC8qIENoZWNrIGZvciBjb2luY2lkZW50IHBvaW50cyAqL1xuICAgIGlmKGZhYnN5MXkyIDwgRVBTSUxPTiAmJiBmYWJzeTJ5MyA8IEVQU0lMT04pXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFZWshIENvaW5jaWRlbnQgcG9pbnRzIVwiKTtcblxuICAgIGlmKGZhYnN5MXkyIDwgRVBTSUxPTikge1xuICAgICAgbTIgID0gLSgoeDMgLSB4MikgLyAoeTMgLSB5MikpO1xuICAgICAgbXgyID0gKHgyICsgeDMpIC8gMi4wO1xuICAgICAgbXkyID0gKHkyICsgeTMpIC8gMi4wO1xuICAgICAgeGMgID0gKHgyICsgeDEpIC8gMi4wO1xuICAgICAgeWMgID0gbTIgKiAoeGMgLSBteDIpICsgbXkyO1xuICAgIH1cblxuICAgIGVsc2UgaWYoZmFic3kyeTMgPCBFUFNJTE9OKSB7XG4gICAgICBtMSAgPSAtKCh4MiAtIHgxKSAvICh5MiAtIHkxKSk7XG4gICAgICBteDEgPSAoeDEgKyB4MikgLyAyLjA7XG4gICAgICBteTEgPSAoeTEgKyB5MikgLyAyLjA7XG4gICAgICB4YyAgPSAoeDMgKyB4MikgLyAyLjA7XG4gICAgICB5YyAgPSBtMSAqICh4YyAtIG14MSkgKyBteTE7XG4gICAgfVxuXG4gICAgZWxzZSB7XG4gICAgICBtMSAgPSAtKCh4MiAtIHgxKSAvICh5MiAtIHkxKSk7XG4gICAgICBtMiAgPSAtKCh4MyAtIHgyKSAvICh5MyAtIHkyKSk7XG4gICAgICBteDEgPSAoeDEgKyB4MikgLyAyLjA7XG4gICAgICBteDIgPSAoeDIgKyB4MykgLyAyLjA7XG4gICAgICBteTEgPSAoeTEgKyB5MikgLyAyLjA7XG4gICAgICBteTIgPSAoeTIgKyB5MykgLyAyLjA7XG4gICAgICB4YyAgPSAobTEgKiBteDEgLSBtMiAqIG14MiArIG15MiAtIG15MSkgLyAobTEgLSBtMik7XG4gICAgICB5YyAgPSAoZmFic3kxeTIgPiBmYWJzeTJ5MykgP1xuICAgICAgICBtMSAqICh4YyAtIG14MSkgKyBteTEgOlxuICAgICAgICBtMiAqICh4YyAtIG14MikgKyBteTI7XG4gICAgfVxuXG4gICAgZHggPSB4MiAtIHhjO1xuICAgIGR5ID0geTIgLSB5YztcbiAgICByZXR1cm4ge2k6IGksIGo6IGosIGs6IGssIHg6IHhjLCB5OiB5YywgcjogZHggKiBkeCArIGR5ICogZHl9O1xuICB9XG5cbiAgZnVuY3Rpb24gZGVkdXAoZWRnZXMpIHtcbiAgICB2YXIgaSwgaiwgYSwgYiwgbSwgbjtcblxuICAgIGZvcihqID0gZWRnZXMubGVuZ3RoOyBqOyApIHtcbiAgICAgIGIgPSBlZGdlc1stLWpdO1xuICAgICAgYSA9IGVkZ2VzWy0tal07XG5cbiAgICAgIGZvcihpID0gajsgaTsgKSB7XG4gICAgICAgIG4gPSBlZGdlc1stLWldO1xuICAgICAgICBtID0gZWRnZXNbLS1pXTtcblxuICAgICAgICBpZigoYSA9PT0gbSAmJiBiID09PSBuKSB8fCAoYSA9PT0gbiAmJiBiID09PSBtKSkge1xuICAgICAgICAgIGVkZ2VzLnNwbGljZShqLCAyKTtcbiAgICAgICAgICBlZGdlcy5zcGxpY2UoaSwgMik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBEZWxhdW5heSA9IHtcbiAgICB0cmlhbmd1bGF0ZTogZnVuY3Rpb24odmVydGljZXMsIGtleSkge1xuICAgICAgdmFyIG4gPSB2ZXJ0aWNlcy5sZW5ndGgsXG4gICAgICAgICAgaSwgaiwgaW5kaWNlcywgc3QsIG9wZW4sIGNsb3NlZCwgZWRnZXMsIGR4LCBkeSwgYSwgYiwgYztcblxuICAgICAgLyogQmFpbCBpZiB0aGVyZSBhcmVuJ3QgZW5vdWdoIHZlcnRpY2VzIHRvIGZvcm0gYW55IHRyaWFuZ2xlcy4gKi9cbiAgICAgIGlmKG4gPCAzKVxuICAgICAgICByZXR1cm4gW107XG5cbiAgICAgIC8qIFNsaWNlIG91dCB0aGUgYWN0dWFsIHZlcnRpY2VzIGZyb20gdGhlIHBhc3NlZCBvYmplY3RzLiAoRHVwbGljYXRlIHRoZVxuICAgICAgICogYXJyYXkgZXZlbiBpZiB3ZSBkb24ndCwgdGhvdWdoLCBzaW5jZSB3ZSBuZWVkIHRvIG1ha2UgYSBzdXBlcnRyaWFuZ2xlXG4gICAgICAgKiBsYXRlciBvbiEpICovXG4gICAgICB2ZXJ0aWNlcyA9IHZlcnRpY2VzLnNsaWNlKDApO1xuXG4gICAgICBpZihrZXkpXG4gICAgICAgIGZvcihpID0gbjsgaS0tOyApXG4gICAgICAgICAgdmVydGljZXNbaV0gPSB2ZXJ0aWNlc1tpXVtrZXldO1xuXG4gICAgICAvKiBNYWtlIGFuIGFycmF5IG9mIGluZGljZXMgaW50byB0aGUgdmVydGV4IGFycmF5LCBzb3J0ZWQgYnkgdGhlXG4gICAgICAgKiB2ZXJ0aWNlcycgeC1wb3NpdGlvbi4gKi9cbiAgICAgIGluZGljZXMgPSBuZXcgQXJyYXkobik7XG5cbiAgICAgIGZvcihpID0gbjsgaS0tOyApXG4gICAgICAgIGluZGljZXNbaV0gPSBpO1xuXG4gICAgICBpbmRpY2VzLnNvcnQoZnVuY3Rpb24oaSwgaikge1xuICAgICAgICByZXR1cm4gdmVydGljZXNbal1bMF0gLSB2ZXJ0aWNlc1tpXVswXTtcbiAgICAgIH0pO1xuXG4gICAgICAvKiBOZXh0LCBmaW5kIHRoZSB2ZXJ0aWNlcyBvZiB0aGUgc3VwZXJ0cmlhbmdsZSAod2hpY2ggY29udGFpbnMgYWxsIG90aGVyXG4gICAgICAgKiB0cmlhbmdsZXMpLCBhbmQgYXBwZW5kIHRoZW0gb250byB0aGUgZW5kIG9mIGEgKGNvcHkgb2YpIHRoZSB2ZXJ0ZXhcbiAgICAgICAqIGFycmF5LiAqL1xuICAgICAgc3QgPSBzdXBlcnRyaWFuZ2xlKHZlcnRpY2VzKTtcbiAgICAgIHZlcnRpY2VzLnB1c2goc3RbMF0sIHN0WzFdLCBzdFsyXSk7XG4gICAgICBcbiAgICAgIC8qIEluaXRpYWxpemUgdGhlIG9wZW4gbGlzdCAoY29udGFpbmluZyB0aGUgc3VwZXJ0cmlhbmdsZSBhbmQgbm90aGluZ1xuICAgICAgICogZWxzZSkgYW5kIHRoZSBjbG9zZWQgbGlzdCAod2hpY2ggaXMgZW1wdHkgc2luY2Ugd2UgaGF2bid0IHByb2Nlc3NlZFxuICAgICAgICogYW55IHRyaWFuZ2xlcyB5ZXQpLiAqL1xuICAgICAgb3BlbiAgID0gW2NpcmN1bWNpcmNsZSh2ZXJ0aWNlcywgbiArIDAsIG4gKyAxLCBuICsgMildO1xuICAgICAgY2xvc2VkID0gW107XG4gICAgICBlZGdlcyAgPSBbXTtcblxuICAgICAgLyogSW5jcmVtZW50YWxseSBhZGQgZWFjaCB2ZXJ0ZXggdG8gdGhlIG1lc2guICovXG4gICAgICBmb3IoaSA9IGluZGljZXMubGVuZ3RoOyBpLS07IGVkZ2VzLmxlbmd0aCA9IDApIHtcbiAgICAgICAgYyA9IGluZGljZXNbaV07XG5cbiAgICAgICAgLyogRm9yIGVhY2ggb3BlbiB0cmlhbmdsZSwgY2hlY2sgdG8gc2VlIGlmIHRoZSBjdXJyZW50IHBvaW50IGlzXG4gICAgICAgICAqIGluc2lkZSBpdCdzIGNpcmN1bWNpcmNsZS4gSWYgaXQgaXMsIHJlbW92ZSB0aGUgdHJpYW5nbGUgYW5kIGFkZFxuICAgICAgICAgKiBpdCdzIGVkZ2VzIHRvIGFuIGVkZ2UgbGlzdC4gKi9cbiAgICAgICAgZm9yKGogPSBvcGVuLmxlbmd0aDsgai0tOyApIHtcbiAgICAgICAgICAvKiBJZiB0aGlzIHBvaW50IGlzIHRvIHRoZSByaWdodCBvZiB0aGlzIHRyaWFuZ2xlJ3MgY2lyY3VtY2lyY2xlLFxuICAgICAgICAgICAqIHRoZW4gdGhpcyB0cmlhbmdsZSBzaG91bGQgbmV2ZXIgZ2V0IGNoZWNrZWQgYWdhaW4uIFJlbW92ZSBpdFxuICAgICAgICAgICAqIGZyb20gdGhlIG9wZW4gbGlzdCwgYWRkIGl0IHRvIHRoZSBjbG9zZWQgbGlzdCwgYW5kIHNraXAuICovXG4gICAgICAgICAgZHggPSB2ZXJ0aWNlc1tjXVswXSAtIG9wZW5bal0ueDtcbiAgICAgICAgICBpZihkeCA+IDAuMCAmJiBkeCAqIGR4ID4gb3BlbltqXS5yKSB7XG4gICAgICAgICAgICBjbG9zZWQucHVzaChvcGVuW2pdKTtcbiAgICAgICAgICAgIG9wZW4uc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLyogSWYgd2UncmUgb3V0c2lkZSB0aGUgY2lyY3VtY2lyY2xlLCBza2lwIHRoaXMgdHJpYW5nbGUuICovXG4gICAgICAgICAgZHkgPSB2ZXJ0aWNlc1tjXVsxXSAtIG9wZW5bal0ueTtcbiAgICAgICAgICBpZihkeCAqIGR4ICsgZHkgKiBkeSAtIG9wZW5bal0uciA+IEVQU0lMT04pXG4gICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgIC8qIFJlbW92ZSB0aGUgdHJpYW5nbGUgYW5kIGFkZCBpdCdzIGVkZ2VzIHRvIHRoZSBlZGdlIGxpc3QuICovXG4gICAgICAgICAgZWRnZXMucHVzaChcbiAgICAgICAgICAgIG9wZW5bal0uaSwgb3BlbltqXS5qLFxuICAgICAgICAgICAgb3BlbltqXS5qLCBvcGVuW2pdLmssXG4gICAgICAgICAgICBvcGVuW2pdLmssIG9wZW5bal0uaVxuICAgICAgICAgICk7XG4gICAgICAgICAgb3Blbi5zcGxpY2UoaiwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBSZW1vdmUgYW55IGRvdWJsZWQgZWRnZXMuICovXG4gICAgICAgIGRlZHVwKGVkZ2VzKTtcblxuICAgICAgICAvKiBBZGQgYSBuZXcgdHJpYW5nbGUgZm9yIGVhY2ggZWRnZS4gKi9cbiAgICAgICAgZm9yKGogPSBlZGdlcy5sZW5ndGg7IGo7ICkge1xuICAgICAgICAgIGIgPSBlZGdlc1stLWpdO1xuICAgICAgICAgIGEgPSBlZGdlc1stLWpdO1xuICAgICAgICAgIG9wZW4ucHVzaChjaXJjdW1jaXJjbGUodmVydGljZXMsIGEsIGIsIGMpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvKiBDb3B5IGFueSByZW1haW5pbmcgb3BlbiB0cmlhbmdsZXMgdG8gdGhlIGNsb3NlZCBsaXN0LCBhbmQgdGhlblxuICAgICAgICogcmVtb3ZlIGFueSB0cmlhbmdsZXMgdGhhdCBzaGFyZSBhIHZlcnRleCB3aXRoIHRoZSBzdXBlcnRyaWFuZ2xlLFxuICAgICAgICogYnVpbGRpbmcgYSBsaXN0IG9mIHRyaXBsZXRzIHRoYXQgcmVwcmVzZW50IHRyaWFuZ2xlcy4gKi9cbiAgICAgIGZvcihpID0gb3Blbi5sZW5ndGg7IGktLTsgKVxuICAgICAgICBjbG9zZWQucHVzaChvcGVuW2ldKTtcbiAgICAgIG9wZW4ubGVuZ3RoID0gMDtcblxuICAgICAgZm9yKGkgPSBjbG9zZWQubGVuZ3RoOyBpLS07IClcbiAgICAgICAgaWYoY2xvc2VkW2ldLmkgPCBuICYmIGNsb3NlZFtpXS5qIDwgbiAmJiBjbG9zZWRbaV0uayA8IG4pXG4gICAgICAgICAgb3Blbi5wdXNoKGNsb3NlZFtpXS5pLCBjbG9zZWRbaV0uaiwgY2xvc2VkW2ldLmspO1xuXG4gICAgICAvKiBZYXksIHdlJ3JlIGRvbmUhICovXG4gICAgICByZXR1cm4gb3BlbjtcbiAgICB9LFxuICAgIGNvbnRhaW5zOiBmdW5jdGlvbih0cmksIHApIHtcbiAgICAgIC8qIEJvdW5kaW5nIGJveCB0ZXN0IGZpcnN0LCBmb3IgcXVpY2sgcmVqZWN0aW9ucy4gKi9cbiAgICAgIGlmKChwWzBdIDwgdHJpWzBdWzBdICYmIHBbMF0gPCB0cmlbMV1bMF0gJiYgcFswXSA8IHRyaVsyXVswXSkgfHxcbiAgICAgICAgIChwWzBdID4gdHJpWzBdWzBdICYmIHBbMF0gPiB0cmlbMV1bMF0gJiYgcFswXSA+IHRyaVsyXVswXSkgfHxcbiAgICAgICAgIChwWzFdIDwgdHJpWzBdWzFdICYmIHBbMV0gPCB0cmlbMV1bMV0gJiYgcFsxXSA8IHRyaVsyXVsxXSkgfHxcbiAgICAgICAgIChwWzFdID4gdHJpWzBdWzFdICYmIHBbMV0gPiB0cmlbMV1bMV0gJiYgcFsxXSA+IHRyaVsyXVsxXSkpXG4gICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICB2YXIgYSA9IHRyaVsxXVswXSAtIHRyaVswXVswXSxcbiAgICAgICAgICBiID0gdHJpWzJdWzBdIC0gdHJpWzBdWzBdLFxuICAgICAgICAgIGMgPSB0cmlbMV1bMV0gLSB0cmlbMF1bMV0sXG4gICAgICAgICAgZCA9IHRyaVsyXVsxXSAtIHRyaVswXVsxXSxcbiAgICAgICAgICBpID0gYSAqIGQgLSBiICogYztcblxuICAgICAgLyogRGVnZW5lcmF0ZSB0cmkuICovXG4gICAgICBpZihpID09PSAwLjApXG4gICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICB2YXIgdSA9IChkICogKHBbMF0gLSB0cmlbMF1bMF0pIC0gYiAqIChwWzFdIC0gdHJpWzBdWzFdKSkgLyBpLFxuICAgICAgICAgIHYgPSAoYSAqIChwWzFdIC0gdHJpWzBdWzFdKSAtIGMgKiAocFswXSAtIHRyaVswXVswXSkpIC8gaTtcblxuICAgICAgLyogSWYgd2UncmUgb3V0c2lkZSB0aGUgdHJpLCBmYWlsLiAqL1xuICAgICAgaWYodSA8IDAuMCB8fCB2IDwgMC4wIHx8ICh1ICsgdikgPiAxLjApXG4gICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICByZXR1cm4gW3UsIHZdO1xuICAgIH1cbiAgfTtcblxuICBpZih0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiKVxuICAgIG1vZHVsZS5leHBvcnRzID0gRGVsYXVuYXk7XG59KSgpO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vZGVsYXVuYXktZmFzdC9kZWxhdW5heS5qc1xuICoqIG1vZHVsZSBpZCA9IDFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qKlxuKlxuKiBzaW1wbGUtcXVhZHRyZWUgaXMgYSBtaW5pbWFsIHF1YWR0cmVlIGltcGxlbWVudGF0aW9uIHRoYXQgc3VwcG9ydHMgc2ltcGxlIHB1dCwgZ2V0LFxuKiByZW1vdmUgYW5kIGNsZWFyIG9wZXJhdGlvbnMgb24gb2JqZWN0cyBoYXZpbmcgYSB4LCB5IHBvc2l0aW9uIGFuZCB3LCBoIGRpbWVuc2lvbi5cbipcbiogQ29weXJpZ2h0IChjKSAyMDEzIEFudHRpIFNhYXJpbmVuIDxhbnR0aS5wLnNhYXJpbmVuQGdtYWlsLmNvbT5cbiogaHR0cHM6Ly9naXRodWIuY29tL2FzYWFyaW5lbi9xdHJlZVxuKlxuKi9cbmZ1bmN0aW9uIFF1YWRUcmVlKHgsIHksIHcsIGgsIG9wdGlvbnMpIHtcblxuICAgIGlmKCB0eXBlb2YgeCAhPSAnbnVtYmVyJyB8fCBpc05hTih4KSApXG4gICAgICAgIHggPSAwO1xuICAgIGlmKCB0eXBlb2YgeSAhPSAnbnVtYmVyJyB8fCBpc05hTih5KSApXG4gICAgICAgIHkgPSAwO1xuICAgIGlmKCB0eXBlb2YgdyAhPSAnbnVtYmVyJyB8fCBpc05hTih3KSApXG4gICAgICAgIHcgPSAxMDtcbiAgICBpZiggdHlwZW9mIGggIT0gJ251bWJlcicgfHwgaXNOYU4oaCkgKVxuICAgICAgICBoID0gMTA7XG4gICAgXG4gICAgdmFyIG1heGMgPSAyNTtcbiAgICB2YXIgbGVhZnJhdGlvID0gMC41O1xuICAgIGlmKCBvcHRpb25zICkge1xuICAgICAgICBpZiggdHlwZW9mIG9wdGlvbnMubWF4Y2hpbGRyZW4gPT0gJ251bWJlcicgKVxuICAgICAgICAgICAgaWYoIG9wdGlvbnMubWF4Y2hpbGRyZW4gPiAwIClcbiAgICAgICAgICAgICAgICBtYXhjID0gb3B0aW9ucy5tYXhjaGlsZHJlbjtcbiAgICAgICAgaWYoIHR5cGVvZiBvcHRpb25zLmxlYWZyYXRpbyA9PSAnbnVtYmVyJyApXG4gICAgICAgICAgICBpZiggb3B0aW9ucy5sZWFmcmF0aW8gPj0gMCApXG4gICAgICAgICAgICAgICAgbGVhZnJhdGlvID0gb3B0aW9ucy5sZWFmcmF0aW87XG4gICAgfVxuXG4gICAgLy8gdmFsaWRhdGUgYW4gaW5wdXQgb2JqZWN0XG4gICAgZnVuY3Rpb24gdmFsaWRhdGUob2JqKSB7XG4gICAgICAgIGlmKCAhb2JqIClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYoIHR5cGVvZiBvYmoueCAhPSAnbnVtYmVyJyB8fFxuICAgICAgICAgICAgdHlwZW9mIG9iai55ICE9ICdudW1iZXInIHx8XG4gICAgICAgICAgICB0eXBlb2Ygb2JqLncgIT0gJ251bWJlcicgfHxcbiAgICAgICAgICAgIHR5cGVvZiBvYmouaCAhPSAnbnVtYmVyJyApXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmKCBpc05hTihvYmoueCkgfHwgaXNOYU4ob2JqLnkpIHx8XG4gICAgICAgICAgICBpc05hTihvYmoudykgfHwgaXNOYU4ob2JqLmgpIClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYoIG9iai53IDwgMCB8fCBvYmouaCA8IDAgKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyB0ZXN0IGZvciBkZWVwIGVxdWFsaXR5IGZvciB4LHksdyxoXG4gICAgZnVuY3Rpb24gaXNlcXVhbChvMSwgbzIpIHtcbiAgICAgICAgaWYoIG8xLnggPT0gbzIueCAmJlxuICAgICAgICAgICAgbzEueSA9PSBvMi55ICYmXG4gICAgICAgICAgICBvMS53ID09IG8yLncgJiZcbiAgICAgICAgICAgIG8xLmggPT0gbzIuaCApXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSBhIG5ldyBxdWFkdHJlZSBub2RlXG4gICAgZnVuY3Rpb24gY3JlYXRlbm9kZSh4LCB5LCB3LCBoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgIHc6IHcsXG4gICAgICAgICAgICBoOiBoLFxuICAgICAgICAgICAgYzogW10sXG4gICAgICAgICAgICBsOiBbXSxcbiAgICAgICAgICAgIG46IFtdXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyByb290IG5vZGUgdXNlZCBieSB0aGlzIHF1YWR0cmVlXG4gICAgdmFyIHJvb3QgPSBjcmVhdGVub2RlKHgsIHksIHcsIGgpO1xuXG4gICAgLy8gY2FsY3VsYXRlIGRpc3RhbmNlIGJldHdlZW4gdHdvIHBvaW50c1xuICAgIGZ1bmN0aW9uIGRpc3RhbmNlKHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoKHgyLXgxKSooeDIteDEpKyh5Mi15MSkqKHkyLXkxKSk7XG4gICAgfVxuICAgIFxuICAgIC8vIGNhbGN1bGF0ZSBkaXN0YW5jZSBiZXR3ZWVuIGEgcG9pbnQgYW5kIGEgbGluZSAoc2VnbWVudClcbiAgICBmdW5jdGlvbiBkaXN0YW5jZVBMKHgsIHksIHgxLCB5MSwgZHgxLCBkeTEsIGxlbjEgKSB7XG4gICAgICAgIGlmKCAhbGVuMSApIC8vIGluIGNhc2UgbGVuZ3RoIGlzIG5vdCBwcm92aWRlZCwgYXNzdW1lIGEgbGluZSBcbiAgICAgICAgICAgIGxlbjEgPSAtMTtcbiAgICAgICAgXG4gICAgICAgIC8vIHggPSB4MSArIHMgKiBkeDEgKyB0ICogZHkxXG4gICAgICAgIC8vIHkgPSB5MSArIHMgKiBkeTEgLSB0ICogZHgxXG4gICAgICAgIC8vIHggKiBkeTEgLSB5ICogZHgxID0geDEgKiBkeTEgLSB5MSAqIGR4MSArIFxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgIHQgKiAoIGR5MSAqIGR5MSArIGR4MSAqIGR4MSApXG4gICAgICAgIHZhciB0ID0gZHgxICogZHgxICsgZHkxICogZHkxO1xuICAgICAgICBpZiggdCA9PSAwIClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHQgPSAoIHggKiBkeTEgLSB5ICogZHgxIC0geDEgKiBkeTEgKyB5MSAqIGR4MSApIC8gdDtcbiAgICAgICAgICAgIGlmKCBNYXRoLmFicyhkeDEpID4gTWF0aC5hYnMoZHkxKSApXG4gICAgICAgICAgICAgICAgdmFyIHMgPSAoIHggLSB4MSAtIHQgKiBkeTEgKSAvIGR4MTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB2YXIgcyA9ICggeSAtIHkxICsgdCAqIGR4MSApIC8gZHkxO1xuICAgICAgICAgICAgaWYoICggcyA+PSAwICYmIHMgPD0gbGVuMSApIHx8IGxlbjEgPCAwIClcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzOiBzLFxuICAgICAgICAgICAgICAgICAgICB0OiB0LFxuICAgICAgICAgICAgICAgICAgICB4OiB4MSArIHMgKiBkeDEsXG4gICAgICAgICAgICAgICAgICAgIHk6IHkxICsgcyAqIGR5MSxcbiAgICAgICAgICAgICAgICAgICAgZGlzdDogTWF0aC5hYnModClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgZWxzZSBpZiggcyA8IDAgKSB7IFxuICAgICAgICAgICAgICAgIHZhciBkaXN0ID0gZGlzdGFuY2UoeCwgeSwgeDEsIHkxKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzOiBzLFxuICAgICAgICAgICAgICAgICAgICBkaXN0OiBkaXN0XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpc3QgPSBkaXN0YW5jZSh4LCB5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDEgKyBsZW4xKmR4MSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5MSArIGxlbjEqZHkxKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzOiBzLFxuICAgICAgICAgICAgICAgICAgICBkaXN0OiBkaXN0XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBkb2VzIGEgbGluZSBhbmQgYSByZWN0YW5nbGUgb3ZlcmxhcCA/XG4gICAgZnVuY3Rpb24gb3ZlcmxhcF9saW5lKG8xLCBvMiwgYnVmKSB7XG4gICAgICAgIGlmKCAhbzEgfHwgIW8yIClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB2YXIgZGlzdCA9IGRpc3RhbmNlUEwobzIueCArIDAuNSAqIG8yLncsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvMi55ICsgMC41ICogbzIuaCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8xLngsIG8xLnksIG8xLmR4LCBvMS5keSwgbzEuZGlzdCk7XG4gICAgICAgIGlmKCBkaXN0ICkge1xuICAgICAgICAgICAgZGlzdC5kaXN0IC09IGJ1ZjtcbiAgICAgICAgICAgIGlmKCBkaXN0LmRpc3QgPCAwIClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIGlmKCBkaXN0LmRpc3QgKiBkaXN0LmRpc3QgPD0gbzIudyAqIG8yLncgKyBvMi5oICogbzIuaCApXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIGRvIHR3byByZWN0YW5nbGVzIG92ZXJsYXAgP1xuICAgIGZ1bmN0aW9uIG92ZXJsYXBfcmVjdChvMSwgbzIsIGJ1Zikge1xuICAgICAgICBpZiggIW8xIHx8ICFvMiApXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgaWYoIG8xLnggKyBvMS53IDwgbzIueCAtIGJ1ZiB8fFxuICAgICAgICAgICAgbzEueSArIG8xLmggPCBvMi55IC0gYnVmIHx8XG4gICAgICAgICAgICBvMS54IC0gYnVmID4gbzIueCArIG8yLncgfHxcbiAgICAgICAgICAgIG8xLnkgLSBidWYgPiBvMi55ICsgbzIuaCApXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzbGVhZihub2RlLCBvYmopIHtcblxuICAgICAgICB2YXIgbGVhZiA9IGZhbHNlO1xuICAgICAgICBpZiggb2JqLncgKiBvYmouaCA+IG5vZGUudyAqIG5vZGUuaCAqIGxlYWZyYXRpbyApXG4gICAgICAgICAgICBsZWFmID0gdHJ1ZTtcblxuICAgICAgICBpZiggb2JqLnggPCBub2RlLnggfHxcbiAgICAgICAgICAgIG9iai55IDwgbm9kZS55IHx8XG4gICAgICAgICAgICBvYmoueCArIG9iai53ID4gbm9kZS54ICsgbm9kZS53IHx8XG4gICAgICAgICAgICBvYmoueSArIG9iai5oID4gbm9kZS55ICsgbm9kZS5oIClcbiAgICAgICAgICAgIGxlYWYgPSB0cnVlO1xuXG4gICAgICAgIHZhciBjaGlsZG5vZGUgPSBudWxsO1xuICAgICAgICBmb3IoIHZhciBuaSA9IDA7IG5pIDwgbm9kZS5uLmxlbmd0aDsgbmkrKyApXG4gICAgICAgICAgICBpZiggb3ZlcmxhcF9yZWN0KG9iaiwgbm9kZS5uW25pXSwgMCkgKSB7XG4gICAgICAgICAgICAgICAgaWYoIGNoaWxkbm9kZSApIHsgLy8gbXVsdGlwbGUgaGl0c1xuICAgICAgICAgICAgICAgICAgICBsZWFmID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkbm9kZSA9IG5vZGUubltuaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4geyBsZWFmOiBsZWFmLFxuICAgICAgICAgICAgICAgICBjaGlsZG5vZGU6IGNoaWxkbm9kZSB9O1xuICAgIH1cblxuICAgIC8vIHB1dCBhbiBvYmplY3QgdG8gb25lIG9mIHRoZSBjaGlsZCBub2RlcyBvZiB0aGlzIG5vZGVcbiAgICBmdW5jdGlvbiBwdXRfdG9fbm9kZXMobm9kZSwgb2JqKSB7XG4gICAgICAgIHZhciBsZWFmID0gaXNsZWFmKG5vZGUsIG9iaik7XG4gICAgICAgIGlmKCBsZWFmLmxlYWYgKVxuICAgICAgICAgICAgbm9kZS5sLnB1c2gob2JqKTtcbiAgICAgICAgZWxzZSBpZiggbGVhZi5jaGlsZG5vZGUgKVxuICAgICAgICAgICAgcHV0KGxlYWYuY2hpbGRub2RlLCBvYmopO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIHVwZGF0ZV9jb29yZHMob2JqLCB1cGRhdGVkY29vcmRzKSB7XG4gICAgICAgIG9iai54ID0gKCh0eXBlb2YgdXBkYXRlZGNvb3Jkcy54ID09ICdudW1iZXInKSA/IHVwZGF0ZWRjb29yZHMueCA6IG9iai54KTtcbiAgICAgICAgb2JqLnkgPSAoKHR5cGVvZiB1cGRhdGVkY29vcmRzLnkgPT0gJ251bWJlcicpID8gdXBkYXRlZGNvb3Jkcy55IDogb2JqLnkpO1xuICAgICAgICBvYmoudyA9ICgodHlwZW9mIHVwZGF0ZWRjb29yZHMudyA9PSAnbnVtYmVyJykgPyB1cGRhdGVkY29vcmRzLncgOiBvYmoudyk7XG4gICAgICAgIG9iai5oID0gKCh0eXBlb2YgdXBkYXRlZGNvb3Jkcy5oID09ICdudW1iZXInKSA/IHVwZGF0ZWRjb29yZHMuaCA6IG9iai5oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGRhdGUobm9kZSwgb2JqLCBhdHRyLCB1cGRhdGVkY29vcmRzKSB7XG4gICAgICAgIGlmKCB0eXBlb2YgYXR0ciA9PSAnb2JqZWN0JyAmJiB0eXBlb2YgdXBkYXRlZGNvb3JkcyA9PSAndW5kZWZpbmVkJyApIHtcbiAgICAgICAgICAgIHVwZGF0ZWRjb29yZHMgPSBhdHRyO1xuICAgICAgICAgICAgYXR0ciA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoICF2YWxpZGF0ZShvYmopIHx8IHR5cGVvZiB1cGRhdGVkY29vcmRzID09ICd1bmRlZmluZWQnIClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICBpZiggIWF0dHIgKVxuICAgICAgICAgICAgYXR0ciA9IGZhbHNlO1xuICAgICAgICBlbHNlIGlmKCB0eXBlb2YgYXR0ciAhPSAnc3RyaW5nJyApXG4gICAgICAgICAgICBhdHRyID0gJ2lkJztcblxuICAgICAgICB2YXIgY291bnQgPSAwO1xuICAgICAgICBmb3IoIHZhciBjaSA9IDA7IGNpIDwgbm9kZS5jLmxlbmd0aDsgY2krKyApXG4gICAgICAgICAgICBpZiggKCBhdHRyICYmIG5vZGUuY1tjaV1bYXR0cl0gPT0gb2JqW2F0dHJdICkgfHxcbiAgICAgICAgICAgICAgICAoICFhdHRyICYmIGlzZXF1YWwobm9kZS5jW2NpXSwgb2JqKSApICkge1xuXG4gICAgICAgICAgICAgICAgLy8gZm91bmQgdGhlIG9iamVjdCB0byBiZSB1cGRhdGVkXG4gICAgICAgICAgICAgICAgdmFyIG9yaWcgPSBub2RlLmNbY2ldO1xuICAgICAgICAgICAgICAgIHVwZGF0ZV9jb29yZHMob3JpZywgdXBkYXRlZGNvb3Jkcyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYoIG9yaWcueCA+IG5vZGUueCArIG5vZGUudyB8fFxuICAgICAgICAgICAgICAgICAgICBvcmlnLnkgPiBub2RlLnkgKyBub2RlLmggfHxcbiAgICAgICAgICAgICAgICAgICAgb3JpZy54ICsgb3JpZy53IDwgbm9kZS54IHx8XG4gICAgICAgICAgICAgICAgICAgIG9yaWcueSArIG9yaWcuaCA8IG5vZGUueSApIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIG9iamVjdCBuZWVkcyB0byBiZSByZW1vdmVkIGFuZCBhZGRlZFxuICAgICAgICAgICAgICAgICAgICBub2RlLmMuc3BsaWNlKGNpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgcHV0KHJvb3QsIG9yaWcpO1xuICAgICAgICAgICAgICAgIH0gLy8gdXBkYXRlZCBvYmplY3QgaXMgc3RpbGwgaW5zaWRlIHNhbWUgbm9kZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yKCB2YXIgY2kgPSAwOyBjaSA8IG5vZGUubC5sZW5ndGg7IGNpKysgKVxuICAgICAgICAgICAgaWYoICggYXR0ciAmJiBub2RlLmxbY2ldW2F0dHJdID09IG9ialthdHRyXSApIHx8XG4gICAgICAgICAgICAgICAgKCAhYXR0ciAmJiBpc2VxdWFsKG5vZGUubFtjaV0sIG9iaikgKSApIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgb3JpZyA9IG5vZGUubFtjaV07XG4gICAgICAgICAgICAgICAgdXBkYXRlX2Nvb3JkcyhvcmlnLCB1cGRhdGVkY29vcmRzKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBmb3VuZCB0aGUgb2JqZWN0IHRvIGJlIHVwZGF0ZWRcbiAgICAgICAgICAgICAgICBpZiggb3JpZy54ID4gbm9kZS54ICsgbm9kZS53IHx8XG4gICAgICAgICAgICAgICAgICAgIG9yaWcueSA+IG5vZGUueSArIG5vZGUuaCB8fFxuICAgICAgICAgICAgICAgICAgICBvcmlnLnggKyBvcmlnLncgPCBub2RlLnggfHxcbiAgICAgICAgICAgICAgICAgICAgb3JpZy55ICsgb3JpZy5oIDwgbm9kZS55ICkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgb2JqZWN0IG5lZWRzIHRvIGJlIHJlbW92ZWQgYW5kIGFkZGVkIFxuICAgICAgICAgICAgICAgICAgICBub2RlLmwuc3BsaWNlKGNpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgcHV0KHJvb3QsIG9yaWcpO1xuICAgICAgICAgICAgICAgIH0gLy8gdXBkYXRlZCBvYmplY3QgaXMgc3RpbGwgaW5zaWRlIHNhbWUgbm9kZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWFmID0gaXNsZWFmKG5vZGUsIG9iaik7XG4gICAgICAgIGlmKCAhbGVhZi5sZWFmICYmIGxlYWYuY2hpbGRub2RlIClcbiAgICAgICAgICAgIGlmKCB1cGRhdGUobGVhZi5jaGlsZG5vZGUsIG9iaiwgYXR0cikgKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gcmVtb3ZlIGFuIG9iamVjdCBmcm9tIHRoaXMgbm9kZVxuICAgIGZ1bmN0aW9uIHJlbW92ZShub2RlLCBvYmosIGF0dHIpIHtcbiAgICAgICAgaWYoICF2YWxpZGF0ZShvYmopIClcbiAgICAgICAgICAgIHJldHVybiAwO1xuXG4gICAgICAgIGlmKCAhYXR0ciApXG4gICAgICAgICAgICBhdHRyID0gZmFsc2U7XG4gICAgICAgIGVsc2UgaWYoIHR5cGVvZiBhdHRyICE9ICdzdHJpbmcnIClcbiAgICAgICAgICAgIGF0dHIgPSAnaWQnO1xuXG4gICAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICAgIGZvciggdmFyIGNpID0gMDsgY2kgPCBub2RlLmMubGVuZ3RoOyBjaSsrIClcbiAgICAgICAgICAgIGlmKCAoIGF0dHIgJiYgbm9kZS5jW2NpXVthdHRyXSA9PSBvYmpbYXR0cl0gKSB8fFxuICAgICAgICAgICAgICAgICggIWF0dHIgJiYgaXNlcXVhbChub2RlLmNbY2ldLCBvYmopICkgKSB7XG4gICAgICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgICAgICBub2RlLmMuc3BsaWNlKGNpLCAxKTtcbiAgICAgICAgICAgICAgICBjaS0tO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIGZvciggdmFyIGNpID0gMDsgY2kgPCBub2RlLmwubGVuZ3RoOyBjaSsrIClcbiAgICAgICAgICAgIGlmKCAoIGF0dHIgJiYgbm9kZS5sW2NpXVthdHRyXSA9PSBvYmpbYXR0cl0gKSB8fFxuICAgICAgICAgICAgICAgICggIWF0dHIgJiYgaXNlcXVhbChub2RlLmxbY2ldLCBvYmopICkgKSB7XG4gICAgICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgICAgICBub2RlLmwuc3BsaWNlKGNpLCAxKTtcbiAgICAgICAgICAgICAgICBjaS0tO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWFmID0gaXNsZWFmKG5vZGUsIG9iaik7XG4gICAgICAgIGlmKCAhbGVhZi5sZWFmICYmIGxlYWYuY2hpbGRub2RlIClcbiAgICAgICAgICAgIHJldHVybiBjb3VudCArIHJlbW92ZShsZWFmLmNoaWxkbm9kZSwgb2JqLCBhdHRyKTtcbiAgICAgICAgcmV0dXJuIGNvdW50O1xuICAgIH1cblxuICAgIC8vIHB1dCBhbiBvYmplY3QgdG8gdGhpcyBub2RlXG4gICAgZnVuY3Rpb24gcHV0KG5vZGUsIG9iaikge1xuXG4gICAgICAgIGlmKCAhdmFsaWRhdGUob2JqKSApXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgaWYoIG5vZGUubi5sZW5ndGggPT0gMCApIHtcbiAgICAgICAgICAgIG5vZGUuYy5wdXNoKG9iaik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHN1YmRpdmlkZVxuICAgICAgICAgICAgaWYoIG5vZGUuYy5sZW5ndGggPiBtYXhjICkge1xuICAgICAgICAgICAgICAgIHZhciB3MiA9IG5vZGUudyAvIDI7XG4gICAgICAgICAgICAgICAgdmFyIGgyID0gbm9kZS5oIC8gMjtcbiAgICAgICAgICAgICAgICBub2RlLm4ucHVzaChjcmVhdGVub2RlKG5vZGUueCwgbm9kZS55LCB3MiwgaDIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZW5vZGUobm9kZS54ICsgdzIsIG5vZGUueSwgdzIsIGgyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVub2RlKG5vZGUueCwgbm9kZS55ICsgaDIsIHcyLCBoMiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlbm9kZShub2RlLnggKyB3Miwgbm9kZS55ICsgaDIsIHcyLCBoMikpO1xuICAgICAgICAgICAgICAgIGZvciggdmFyIGNpID0gMDsgY2kgPCBub2RlLmMubGVuZ3RoOyBjaSsrICkgXG4gICAgICAgICAgICAgICAgICAgIHB1dF90b19ub2Rlcyhub2RlLCBub2RlLmNbY2ldKTtcbiAgICAgICAgICAgICAgICBub2RlLmMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIFxuICAgICAgICAgICAgcHV0X3RvX25vZGVzKG5vZGUsIG9iaik7XG4gICAgfVxuXG4gICAgLy8gaXRlcmF0ZSB0aHJvdWdoIGFsbCBvYmplY3RzIGluIHRoaXMgbm9kZSBtYXRjaGluZyBnaXZlbiBvdmVybGFwXG4gICAgLy8gZnVuY3Rpb25cbiAgICBmdW5jdGlvbiBnZXR0ZXIob3ZlcmxhcGZ1biwgbm9kZSwgb2JqLCBidWYsIHN0cmljdCwgY2FsbGJhY2tPckFycmF5KSB7XG4gICAgICAgIGZvciggdmFyIGxpID0gMDsgbGkgPCBub2RlLmwubGVuZ3RoOyBsaSsrIClcbiAgICAgICAgICAgIGlmKCAhc3RyaWN0IHx8IG92ZXJsYXBmdW4ob2JqLCBub2RlLmxbbGldLCBidWYpIClcbiAgICAgICAgICAgICAgICBpZiggdHlwZW9mIGNhbGxiYWNrT3JBcnJheSA9PSAnb2JqZWN0JyApXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrT3JBcnJheS5wdXNoKG5vZGUubFtsaV0pO1xuICAgICAgICAgICAgICAgIGVsc2UgaWYoICFjYWxsYmFja09yQXJyYXkobm9kZS5sW2xpXSkgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGZvciggdmFyIGxpID0gMDsgbGkgPCBub2RlLmMubGVuZ3RoOyBsaSsrIClcbiAgICAgICAgICAgIGlmKCAhc3RyaWN0IHx8IG92ZXJsYXBmdW4ob2JqLCBub2RlLmNbbGldLCBidWYpIClcbiAgICAgICAgICAgICAgICBpZiggdHlwZW9mIGNhbGxiYWNrT3JBcnJheSA9PSAnb2JqZWN0JyApXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrT3JBcnJheS5wdXNoKG5vZGUuY1tsaV0pO1xuICAgICAgICAgICAgICAgIGVsc2UgaWYoICFjYWxsYmFja09yQXJyYXkobm9kZS5jW2xpXSkgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGZvciggdmFyIG5pID0gMDsgbmkgPCBub2RlLm4ubGVuZ3RoOyBuaSsrICkge1xuICAgICAgICAgICAgaWYoIG92ZXJsYXBmdW4ob2JqLCBub2RlLm5bbmldLCBidWYpICkge1xuICAgICAgICAgICAgICAgIGlmKCB0eXBlb2YgY2FsbGJhY2tPckFycmF5ID09ICdvYmplY3QnIClcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tPckFycmF5LmNvbmNhdChnZXR0ZXIob3ZlcmxhcGZ1biwgbm9kZS5uW25pXSwgb2JqLCBidWYsIHN0cmljdCwgY2FsbGJhY2tPckFycmF5KSk7XG4gICAgICAgICAgICAgICAgZWxzZSBpZiggIWdldHRlcihvdmVybGFwZnVuLCBub2RlLm5bbmldLCBvYmosIGJ1Ziwgc3RyaWN0LCBjYWxsYmFja09yQXJyYXkpIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIGl0ZXJhdGUgdGhyb3VnaCBhbGwgb2JqZWN0cyBpbiB0aGlzIG5vZGUgbWF0Y2hpbmcgdGhlIGdpdmVuIHJlY3RhbmdsZVxuICAgIGZ1bmN0aW9uIGdldF9yZWN0KG5vZGUsIG9iaiwgYnVmLCBjYWxsYmFja09yQXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIGdldHRlcihvdmVybGFwX3JlY3QsIG5vZGUsIG9iaiwgYnVmLCB0cnVlLCBjYWxsYmFja09yQXJyYXkpO1xuICAgIH1cblxuICAgIC8vIGl0ZXJhdGUgdGhyb3VnaCBhbGwgb2JqZWN0cyBpbiB0aGlzIG5vZGUgbWF0Y2hpbmcgdGhlIGdpdmVuXG4gICAgLy8gbGluZSAoc2VnbWVudClcbiAgICBmdW5jdGlvbiBnZXRfbGluZShub2RlLCBvYmosIGJ1ZiwgY2FsbGJhY2tPckFycmF5KSB7XG4gICAgICAgIHJldHVybiBnZXR0ZXIob3ZlcmxhcF9saW5lLCBub2RlLCBvYmosIGJ1ZiwgZmFsc2UsIGNhbGxiYWNrT3JBcnJheSk7XG4gICAgfVxuXG4gICAgLy8gaXRlcmF0ZSB0aHJvdWdoIGFsbCBvYmplY3RzIGluIHRoaXMgbm9kZSBtYXRjaGluZyBnaXZlblxuICAgIC8vIGdlb21ldHJ5LCBlaXRoZXIgYSByZWN0YW5nbGUgb3IgYSBsaW5lIHNlZ21lbnRcbiAgICBmdW5jdGlvbiBnZXQobm9kZSwgb2JqLCBidWYsIGNhbGxiYWNrT3JBcnJheSkge1xuXG4gICAgICAgIGlmKCAodHlwZW9mIGJ1ZiA9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBidWYgPT0gJ29iamVjdCcpICYmIHR5cGVvZiBjYWxsYmFja09yQXJyYXkgPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICAgICAgICBjYWxsYmFja09yQXJyYXkgPSBidWY7XG4gICAgICAgICAgICBidWYgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGlmKCB0eXBlb2YgY2FsbGJhY2tPckFycmF5ID09ICd1bmRlZmluZWQnICkge1xuICAgICAgICAgICAgY2FsbGJhY2tPckFycmF5ID0gW107XG4gICAgICAgICAgICBidWYgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGlmKCBvYmogPT0gbnVsbCApXG4gICAgICAgICAgICBnZXRfcmVjdChub2RlLCBvYmosIGJ1ZiwgY2FsbGJhY2tPckFycmF5KTtcbiAgICAgICAgZWxzZSBpZiggdHlwZW9mIG9iai54ID09ICdudW1iZXInICYmXG4gICAgICAgICAgICAgICAgIHR5cGVvZiBvYmoueSA9PSAnbnVtYmVyJyAmJlxuICAgICAgICAgICAgICAgICAhaXNOYU4ob2JqLngpICYmICFpc05hTihvYmoueSkgKSB7XG4gICAgICAgICAgICBpZiggdHlwZW9mIG9iai5keCA9PSAnbnVtYmVyJyAmJlxuICAgICAgICAgICAgICAgIHR5cGVvZiBvYmouZHkgPT0gJ251bWJlcicgJiZcbiAgICAgICAgICAgICAgICAhaXNOYU4ob2JqLmR4KSAmJiAhaXNOYU4ob2JqLmR5KSApXG4gICAgICAgICAgICAgICAgZ2V0X2xpbmUobm9kZSwgb2JqLCBidWYsIGNhbGxiYWNrT3JBcnJheSk7XG4gICAgICAgICAgICBlbHNlIGlmKCB0eXBlb2Ygb2JqLncgPT0gJ251bWJlcicgJiZcbiAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBvYmouaCA9PSAnbnVtYmVyJyAmJlxuICAgICAgICAgICAgICAgICAgICAgIWlzTmFOKG9iai53KSAmJiAhaXNOYU4ob2JqLmgpIClcbiAgICAgICAgICAgICAgICBnZXRfcmVjdChub2RlLCBvYmosIGJ1ZiwgY2FsbGJhY2tPckFycmF5KTtcbiAgICAgICAgfVxuICAgICAgICBpZiggdHlwZW9mIGNhbGxiYWNrT3JBcnJheSA9PSAnb2JqZWN0JyApIFxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrT3JBcnJheTtcbiAgICB9XG5cbiAgICAvLyByZXR1cm4gdGhlIG9iamVjdCBpbnRlcmZhY2VcbiAgICByZXR1cm4ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKG9iaiwgYnVmLCBjYWxsYmFja09yQXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXQocm9vdCwgb2JqLCBidWYsIGNhbGxiYWNrT3JBcnJheSk7XG4gICAgICAgIH0sXG4gICAgICAgIHB1dDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICBwdXQocm9vdCwgb2JqKTtcbiAgICAgICAgfSxcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihvYmosIGF0dHIsIHVwZGF0ZWRjb29yZHMpIHtcbiAgICAgICAgICAgIHJldHVybiB1cGRhdGUocm9vdCwgb2JqLCBhdHRyLCB1cGRhdGVkY29vcmRzKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihvYmosIGF0dHIpIHtcbiAgICAgICAgICAgIHJldHVybiByZW1vdmUocm9vdCwgb2JqLCBhdHRyKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcm9vdCA9IGNyZWF0ZW5vZGUoeCwgeSwgdywgaCk7XG4gICAgICAgIH0sXG4gICAgICAgIHN0cmluZ2lmeTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc3Ryb2JqID0ge1xuICAgICAgICAgICAgICAgIHg6IHgsIHk6IHksIHc6IHcsIGg6IGgsXG4gICAgICAgICAgICAgICAgbWF4YzogbWF4YywgXG4gICAgICAgICAgICAgICAgbGVhZnJhdGlvOiBsZWFmcmF0aW8sXG4gICAgICAgICAgICAgICAgcm9vdDogcm9vdFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHN0cm9iaik7XG4gICAgICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgICAgIC8vIGNvdWxkIG5vdCBzdHJpbmdpZnlcbiAgICAgICAgICAgICAgICAvLyBwcm9iYWJseSBkdWUgdG8gb2JqZWN0cyBpbmNsdWRlZCBpbiBxdHJlZSBiZWluZyBub24tc3RyaW5naWZpYWJsZVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsOyBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICAgICAgaWYoIHR5cGVvZiBzdHIgPT0gJ3N0cmluZycgKVxuICAgICAgICAgICAgICAgIHN0ciA9IEpTT04ucGFyc2Uoc3RyKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgeCA9IHN0ci54O1xuICAgICAgICAgICAgeSA9IHN0ci55O1xuICAgICAgICAgICAgdyA9IHN0ci53O1xuICAgICAgICAgICAgaCA9IHN0ci5oO1xuICAgICAgICAgICAgbWF4YyA9IHN0ci5tYXhjO1xuICAgICAgICAgICAgbGVhZnJhdGlvID0gc3RyLmxlYWZyYXRpbztcbiAgICAgICAgICAgIHJvb3QgPSBzdHIucm9vdDtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8vIGZvciB1c2Ugd2l0aGluIG5vZGUuanNcbmlmKCB0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnIClcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFF1YWRUcmVlO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vc2ltcGxlLXF1YWR0cmVlL3F0cmVlLmpzXG4gKiogbW9kdWxlIGlkID0gMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyogZ2xvYmFsIFRIUkVFICovXG5cbmltcG9ydCB7dmVjMiwgdmVjM30gZnJvbSAnZ2wtbWF0cml4J1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN0YW5kYXJkRmFjZURhdGEge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZGF0YSA9IHJlcXVpcmUoJy4vZGF0YS9mYWNlMi5qc29uJylcblxuICAgIGxldCBpbmRleCA9IHRoaXMuZGF0YS5mYWNlLmluZGV4LmNvbmNhdCh0aGlzLmRhdGEucmlnaHRFeWUuaW5kZXgsIHRoaXMuZGF0YS5sZWZ0RXllLmluZGV4KVxuICAgIHRoaXMuaW5kZXggPSBuZXcgVEhSRUUuVWludDE2QXR0cmlidXRlKGluZGV4LCAxKVxuICAgIHRoaXMucG9zaXRpb24gPSBuZXcgVEhSRUUuRmxvYXQzMkF0dHJpYnV0ZSh0aGlzLmRhdGEuZmFjZS5wb3NpdGlvbiwgMylcblxuICAgIHRoaXMuYm91bmRzID0gdGhpcy5nZXRCb3VuZHMoKVxuICAgIHRoaXMuc2l6ZSA9IHZlYzIubGVuKHRoaXMuYm91bmRzLnNpemUpXG4gIH1cblxuXG4gIGdldEJvdW5kcygpIHtcbiAgICBsZXQgbWluID0gW051bWJlci5NQVhfVkFMVUUsIE51bWJlci5NQVhfVkFMVUUsIE51bWJlci5NQVhfVkFMVUVdXG4gICAgbGV0IG1heCA9IFtOdW1iZXIuTUlOX1ZBTFVFLCBOdW1iZXIuTUlOX1ZBTFVFLCBOdW1iZXIuTUlOX1ZBTFVFXVxuICAgIGxldCBwb3NpdGlvbiA9IHRoaXMuZGF0YS5mYWNlLnBvc2l0aW9uXG4gICAgbGV0IG4gPSBwb3NpdGlvbi5sZW5ndGhcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkgKz0gMykge1xuICAgICAgbGV0IHAgPSBbcG9zaXRpb25baV0sIHBvc2l0aW9uW2kgKyAxXSwgcG9zaXRpb25baSArIDJdXVxuICAgICAgdmVjMy5taW4obWluLCBtaW4sIHApXG4gICAgICB2ZWMzLm1heChtYXgsIG1heCwgcClcbiAgICB9XG4gICAgcmV0dXJuIHttaW4sIG1heCwgc2l6ZTogdmVjMy5zdWIoW10sIG1heCwgbWluKSwgY2VudGVyOiB2ZWMzLmxlcnAoW10sIG1pbiwgbWF4LCAwLjUpfVxuICB9XG5cblxuICBnZXRGZWF0dXJlVmVydGV4KGluZGV4KSB7XG4gICAgbGV0IGkgPSB0aGlzLmRhdGEuZmFjZS5mZWF0dXJlUG9pbnRbaW5kZXhdICogM1xuICAgIGxldCBwID0gdGhpcy5kYXRhLmZhY2UucG9zaXRpb25cbiAgICByZXR1cm4gW3BbaV0sIHBbaSArIDFdLCBwW2kgKyAyXV1cbiAgfVxuXG5cbiAgZ2V0VmVydGV4KGluZGV4KSB7XG4gICAgbGV0IGkgPSBpbmRleCAqIDNcbiAgICBsZXQgcCA9IHRoaXMuZGF0YS5mYWNlLnBvc2l0aW9uXG4gICAgcmV0dXJuIFtwW2ldLCBwW2kgKyAxXSwgcFtpICsgMl1dXG4gIH1cbiBcbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9lc2xpbnQtbG9hZGVyIS4vc3JjL3N0YW5kYXJkZmFjZWRhdGEuanNcbiAqKi8iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgZ2wtbWF0cml4IC0gSGlnaCBwZXJmb3JtYW5jZSBtYXRyaXggYW5kIHZlY3RvciBvcGVyYXRpb25zXG4gKiBAYXV0aG9yIEJyYW5kb24gSm9uZXNcbiAqIEBhdXRob3IgQ29saW4gTWFjS2VuemllIElWXG4gKiBAdmVyc2lvbiAyLjMuMFxuICovXG5cbi8qIENvcHlyaWdodCAoYykgMjAxNSwgQnJhbmRvbiBKb25lcywgQ29saW4gTWFjS2VuemllIElWLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuICovXG4vLyBFTkQgSEVBREVSXG5cbmV4cG9ydHMuZ2xNYXRyaXggPSByZXF1aXJlKFwiLi9nbC1tYXRyaXgvY29tbW9uLmpzXCIpO1xuZXhwb3J0cy5tYXQyID0gcmVxdWlyZShcIi4vZ2wtbWF0cml4L21hdDIuanNcIik7XG5leHBvcnRzLm1hdDJkID0gcmVxdWlyZShcIi4vZ2wtbWF0cml4L21hdDJkLmpzXCIpO1xuZXhwb3J0cy5tYXQzID0gcmVxdWlyZShcIi4vZ2wtbWF0cml4L21hdDMuanNcIik7XG5leHBvcnRzLm1hdDQgPSByZXF1aXJlKFwiLi9nbC1tYXRyaXgvbWF0NC5qc1wiKTtcbmV4cG9ydHMucXVhdCA9IHJlcXVpcmUoXCIuL2dsLW1hdHJpeC9xdWF0LmpzXCIpO1xuZXhwb3J0cy52ZWMyID0gcmVxdWlyZShcIi4vZ2wtbWF0cml4L3ZlYzIuanNcIik7XG5leHBvcnRzLnZlYzMgPSByZXF1aXJlKFwiLi9nbC1tYXRyaXgvdmVjMy5qc1wiKTtcbmV4cG9ydHMudmVjNCA9IHJlcXVpcmUoXCIuL2dsLW1hdHJpeC92ZWM0LmpzXCIpO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4LmpzXG4gKiogbW9kdWxlIGlkID0gNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyogQ29weXJpZ2h0IChjKSAyMDE1LCBCcmFuZG9uIEpvbmVzLCBDb2xpbiBNYWNLZW56aWUgSVYuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS4gKi9cblxuLyoqXG4gKiBAY2xhc3MgQ29tbW9uIHV0aWxpdGllc1xuICogQG5hbWUgZ2xNYXRyaXhcbiAqL1xudmFyIGdsTWF0cml4ID0ge307XG5cbi8vIENvbnN0YW50c1xuZ2xNYXRyaXguRVBTSUxPTiA9IDAuMDAwMDAxO1xuZ2xNYXRyaXguQVJSQVlfVFlQRSA9ICh0eXBlb2YgRmxvYXQzMkFycmF5ICE9PSAndW5kZWZpbmVkJykgPyBGbG9hdDMyQXJyYXkgOiBBcnJheTtcbmdsTWF0cml4LlJBTkRPTSA9IE1hdGgucmFuZG9tO1xuXG4vKipcbiAqIFNldHMgdGhlIHR5cGUgb2YgYXJyYXkgdXNlZCB3aGVuIGNyZWF0aW5nIG5ldyB2ZWN0b3JzIGFuZCBtYXRyaWNlc1xuICpcbiAqIEBwYXJhbSB7VHlwZX0gdHlwZSBBcnJheSB0eXBlLCBzdWNoIGFzIEZsb2F0MzJBcnJheSBvciBBcnJheVxuICovXG5nbE1hdHJpeC5zZXRNYXRyaXhBcnJheVR5cGUgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgR0xNQVRfQVJSQVlfVFlQRSA9IHR5cGU7XG59XG5cbnZhciBkZWdyZWUgPSBNYXRoLlBJIC8gMTgwO1xuXG4vKipcbiogQ29udmVydCBEZWdyZWUgVG8gUmFkaWFuXG4qXG4qIEBwYXJhbSB7TnVtYmVyfSBBbmdsZSBpbiBEZWdyZWVzXG4qL1xuZ2xNYXRyaXgudG9SYWRpYW4gPSBmdW5jdGlvbihhKXtcbiAgICAgcmV0dXJuIGEgKiBkZWdyZWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2xNYXRyaXg7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC9jb21tb24uanNcbiAqKiBtb2R1bGUgaWQgPSA1XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiBDb3B5cmlnaHQgKGMpIDIwMTUsIEJyYW5kb24gSm9uZXMsIENvbGluIE1hY0tlbnppZSBJVi5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLiAqL1xuXG52YXIgZ2xNYXRyaXggPSByZXF1aXJlKFwiLi9jb21tb24uanNcIik7XG5cbi8qKlxuICogQGNsYXNzIDJ4MiBNYXRyaXhcbiAqIEBuYW1lIG1hdDJcbiAqL1xudmFyIG1hdDIgPSB7fTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGlkZW50aXR5IG1hdDJcbiAqXG4gKiBAcmV0dXJucyB7bWF0Mn0gYSBuZXcgMngyIG1hdHJpeFxuICovXG5tYXQyLmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSg0KTtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgbWF0MiBpbml0aWFsaXplZCB3aXRoIHZhbHVlcyBmcm9tIGFuIGV4aXN0aW5nIG1hdHJpeFxuICpcbiAqIEBwYXJhbSB7bWF0Mn0gYSBtYXRyaXggdG8gY2xvbmVcbiAqIEByZXR1cm5zIHttYXQyfSBhIG5ldyAyeDIgbWF0cml4XG4gKi9cbm1hdDIuY2xvbmUgPSBmdW5jdGlvbihhKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDQpO1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ29weSB0aGUgdmFsdWVzIGZyb20gb25lIG1hdDIgdG8gYW5vdGhlclxuICpcbiAqIEBwYXJhbSB7bWF0Mn0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJ9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQyfSBvdXRcbiAqL1xubWF0Mi5jb3B5ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTZXQgYSBtYXQyIHRvIHRoZSBpZGVudGl0eSBtYXRyaXhcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHJldHVybnMge21hdDJ9IG91dFxuICovXG5tYXQyLmlkZW50aXR5ID0gZnVuY3Rpb24ob3V0KSB7XG4gICAgb3V0WzBdID0gMTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc3Bvc2UgdGhlIHZhbHVlcyBvZiBhIG1hdDJcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIudHJhbnNwb3NlID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgLy8gSWYgd2UgYXJlIHRyYW5zcG9zaW5nIG91cnNlbHZlcyB3ZSBjYW4gc2tpcCBhIGZldyBzdGVwcyBidXQgaGF2ZSB0byBjYWNoZSBzb21lIHZhbHVlc1xuICAgIGlmIChvdXQgPT09IGEpIHtcbiAgICAgICAgdmFyIGExID0gYVsxXTtcbiAgICAgICAgb3V0WzFdID0gYVsyXTtcbiAgICAgICAgb3V0WzJdID0gYTE7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgb3V0WzBdID0gYVswXTtcbiAgICAgICAgb3V0WzFdID0gYVsyXTtcbiAgICAgICAgb3V0WzJdID0gYVsxXTtcbiAgICAgICAgb3V0WzNdID0gYVszXTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogSW52ZXJ0cyBhIG1hdDJcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIuaW52ZXJ0ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgdmFyIGEwID0gYVswXSwgYTEgPSBhWzFdLCBhMiA9IGFbMl0sIGEzID0gYVszXSxcblxuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGRldGVybWluYW50XG4gICAgICAgIGRldCA9IGEwICogYTMgLSBhMiAqIGExO1xuXG4gICAgaWYgKCFkZXQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGRldCA9IDEuMCAvIGRldDtcbiAgICBcbiAgICBvdXRbMF0gPSAgYTMgKiBkZXQ7XG4gICAgb3V0WzFdID0gLWExICogZGV0O1xuICAgIG91dFsyXSA9IC1hMiAqIGRldDtcbiAgICBvdXRbM10gPSAgYTAgKiBkZXQ7XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBhZGp1Z2F0ZSBvZiBhIG1hdDJcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIuYWRqb2ludCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIC8vIENhY2hpbmcgdGhpcyB2YWx1ZSBpcyBuZXNzZWNhcnkgaWYgb3V0ID09IGFcbiAgICB2YXIgYTAgPSBhWzBdO1xuICAgIG91dFswXSA9ICBhWzNdO1xuICAgIG91dFsxXSA9IC1hWzFdO1xuICAgIG91dFsyXSA9IC1hWzJdO1xuICAgIG91dFszXSA9ICBhMDtcblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGRldGVybWluYW50IG9mIGEgbWF0MlxuICpcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge051bWJlcn0gZGV0ZXJtaW5hbnQgb2YgYVxuICovXG5tYXQyLmRldGVybWluYW50ID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gYVswXSAqIGFbM10gLSBhWzJdICogYVsxXTtcbn07XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gbWF0MidzXG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHttYXQyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge21hdDJ9IG91dFxuICovXG5tYXQyLm11bHRpcGx5ID0gZnVuY3Rpb24gKG91dCwgYSwgYikge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXSwgYTIgPSBhWzJdLCBhMyA9IGFbM107XG4gICAgdmFyIGIwID0gYlswXSwgYjEgPSBiWzFdLCBiMiA9IGJbMl0sIGIzID0gYlszXTtcbiAgICBvdXRbMF0gPSBhMCAqIGIwICsgYTIgKiBiMTtcbiAgICBvdXRbMV0gPSBhMSAqIGIwICsgYTMgKiBiMTtcbiAgICBvdXRbMl0gPSBhMCAqIGIyICsgYTIgKiBiMztcbiAgICBvdXRbM10gPSBhMSAqIGIyICsgYTMgKiBiMztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIG1hdDIubXVsdGlwbHl9XG4gKiBAZnVuY3Rpb25cbiAqL1xubWF0Mi5tdWwgPSBtYXQyLm11bHRpcGx5O1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBtYXQyIGJ5IHRoZSBnaXZlbiBhbmdsZVxuICpcbiAqIEBwYXJhbSB7bWF0Mn0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJ9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIucm90YXRlID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkKSB7XG4gICAgdmFyIGEwID0gYVswXSwgYTEgPSBhWzFdLCBhMiA9IGFbMl0sIGEzID0gYVszXSxcbiAgICAgICAgcyA9IE1hdGguc2luKHJhZCksXG4gICAgICAgIGMgPSBNYXRoLmNvcyhyYWQpO1xuICAgIG91dFswXSA9IGEwICogIGMgKyBhMiAqIHM7XG4gICAgb3V0WzFdID0gYTEgKiAgYyArIGEzICogcztcbiAgICBvdXRbMl0gPSBhMCAqIC1zICsgYTIgKiBjO1xuICAgIG91dFszXSA9IGExICogLXMgKyBhMyAqIGM7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2NhbGVzIHRoZSBtYXQyIGJ5IHRoZSBkaW1lbnNpb25zIGluIHRoZSBnaXZlbiB2ZWMyXG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHt2ZWMyfSB2IHRoZSB2ZWMyIHRvIHNjYWxlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQyfSBvdXRcbiAqKi9cbm1hdDIuc2NhbGUgPSBmdW5jdGlvbihvdXQsIGEsIHYpIHtcbiAgICB2YXIgYTAgPSBhWzBdLCBhMSA9IGFbMV0sIGEyID0gYVsyXSwgYTMgPSBhWzNdLFxuICAgICAgICB2MCA9IHZbMF0sIHYxID0gdlsxXTtcbiAgICBvdXRbMF0gPSBhMCAqIHYwO1xuICAgIG91dFsxXSA9IGExICogdjA7XG4gICAgb3V0WzJdID0gYTIgKiB2MTtcbiAgICBvdXRbM10gPSBhMyAqIHYxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIGdpdmVuIGFuZ2xlXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0Mi5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQyLnJvdGF0ZShkZXN0LCBkZXN0LCByYWQpO1xuICpcbiAqIEBwYXJhbSB7bWF0Mn0gb3V0IG1hdDIgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIuZnJvbVJvdGF0aW9uID0gZnVuY3Rpb24ob3V0LCByYWQpIHtcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCksXG4gICAgICAgIGMgPSBNYXRoLmNvcyhyYWQpO1xuICAgIG91dFswXSA9IGM7XG4gICAgb3V0WzFdID0gcztcbiAgICBvdXRbMl0gPSAtcztcbiAgICBvdXRbM10gPSBjO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgdmVjdG9yIHNjYWxpbmdcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQyLmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDIuc2NhbGUoZGVzdCwgZGVzdCwgdmVjKTtcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG91dCBtYXQyIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3ZlYzJ9IHYgU2NhbGluZyB2ZWN0b3JcbiAqIEByZXR1cm5zIHttYXQyfSBvdXRcbiAqL1xubWF0Mi5mcm9tU2NhbGluZyA9IGZ1bmN0aW9uKG91dCwgdikge1xuICAgIG91dFswXSA9IHZbMF07XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IHZbMV07XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgbWF0MlxuICpcbiAqIEBwYXJhbSB7bWF0Mn0gbWF0IG1hdHJpeCB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4XG4gKi9cbm1hdDIuc3RyID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gJ21hdDIoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcsICcgKyBhWzJdICsgJywgJyArIGFbM10gKyAnKSc7XG59O1xuXG4vKipcbiAqIFJldHVybnMgRnJvYmVuaXVzIG5vcm0gb2YgYSBtYXQyXG4gKlxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBtYXRyaXggdG8gY2FsY3VsYXRlIEZyb2Jlbml1cyBub3JtIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBGcm9iZW5pdXMgbm9ybVxuICovXG5tYXQyLmZyb2IgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybihNYXRoLnNxcnQoTWF0aC5wb3coYVswXSwgMikgKyBNYXRoLnBvdyhhWzFdLCAyKSArIE1hdGgucG93KGFbMl0sIDIpICsgTWF0aC5wb3coYVszXSwgMikpKVxufTtcblxuLyoqXG4gKiBSZXR1cm5zIEwsIEQgYW5kIFUgbWF0cmljZXMgKExvd2VyIHRyaWFuZ3VsYXIsIERpYWdvbmFsIGFuZCBVcHBlciB0cmlhbmd1bGFyKSBieSBmYWN0b3JpemluZyB0aGUgaW5wdXQgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJ9IEwgdGhlIGxvd2VyIHRyaWFuZ3VsYXIgbWF0cml4IFxuICogQHBhcmFtIHttYXQyfSBEIHRoZSBkaWFnb25hbCBtYXRyaXggXG4gKiBAcGFyYW0ge21hdDJ9IFUgdGhlIHVwcGVyIHRyaWFuZ3VsYXIgbWF0cml4IFxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBpbnB1dCBtYXRyaXggdG8gZmFjdG9yaXplXG4gKi9cblxubWF0Mi5MRFUgPSBmdW5jdGlvbiAoTCwgRCwgVSwgYSkgeyBcbiAgICBMWzJdID0gYVsyXS9hWzBdOyBcbiAgICBVWzBdID0gYVswXTsgXG4gICAgVVsxXSA9IGFbMV07IFxuICAgIFVbM10gPSBhWzNdIC0gTFsyXSAqIFVbMV07IFxuICAgIHJldHVybiBbTCwgRCwgVV07ICAgICAgIFxufTsgXG5cblxubW9kdWxlLmV4cG9ydHMgPSBtYXQyO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvbWF0Mi5qc1xuICoqIG1vZHVsZSBpZCA9IDZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qIENvcHlyaWdodCAoYykgMjAxNSwgQnJhbmRvbiBKb25lcywgQ29saW4gTWFjS2VuemllIElWLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuICovXG5cbnZhciBnbE1hdHJpeCA9IHJlcXVpcmUoXCIuL2NvbW1vbi5qc1wiKTtcblxuLyoqXG4gKiBAY2xhc3MgMngzIE1hdHJpeFxuICogQG5hbWUgbWF0MmRcbiAqIFxuICogQGRlc2NyaXB0aW9uIFxuICogQSBtYXQyZCBjb250YWlucyBzaXggZWxlbWVudHMgZGVmaW5lZCBhczpcbiAqIDxwcmU+XG4gKiBbYSwgYywgdHgsXG4gKiAgYiwgZCwgdHldXG4gKiA8L3ByZT5cbiAqIFRoaXMgaXMgYSBzaG9ydCBmb3JtIGZvciB0aGUgM3gzIG1hdHJpeDpcbiAqIDxwcmU+XG4gKiBbYSwgYywgdHgsXG4gKiAgYiwgZCwgdHksXG4gKiAgMCwgMCwgMV1cbiAqIDwvcHJlPlxuICogVGhlIGxhc3Qgcm93IGlzIGlnbm9yZWQgc28gdGhlIGFycmF5IGlzIHNob3J0ZXIgYW5kIG9wZXJhdGlvbnMgYXJlIGZhc3Rlci5cbiAqL1xudmFyIG1hdDJkID0ge307XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpZGVudGl0eSBtYXQyZFxuICpcbiAqIEByZXR1cm5zIHttYXQyZH0gYSBuZXcgMngzIG1hdHJpeFxuICovXG5tYXQyZC5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoNik7XG4gICAgb3V0WzBdID0gMTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMTtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IDA7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBtYXQyZCBpbml0aWFsaXplZCB3aXRoIHZhbHVlcyBmcm9tIGFuIGV4aXN0aW5nIG1hdHJpeFxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IGEgbWF0cml4IHRvIGNsb25lXG4gKiBAcmV0dXJucyB7bWF0MmR9IGEgbmV3IDJ4MyBtYXRyaXhcbiAqL1xubWF0MmQuY2xvbmUgPSBmdW5jdGlvbihhKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDYpO1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgb3V0WzRdID0gYVs0XTtcbiAgICBvdXRbNV0gPSBhWzVdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSBtYXQyZCB0byBhbm90aGVyXG4gKlxuICogQHBhcmFtIHttYXQyZH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJkfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0MmR9IG91dFxuICovXG5tYXQyZC5jb3B5ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICBvdXRbNF0gPSBhWzRdO1xuICAgIG91dFs1XSA9IGFbNV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2V0IGEgbWF0MmQgdG8gdGhlIGlkZW50aXR5IG1hdHJpeFxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHJldHVybnMge21hdDJkfSBvdXRcbiAqL1xubWF0MmQuaWRlbnRpdHkgPSBmdW5jdGlvbihvdXQpIHtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAxO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gMDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBJbnZlcnRzIGEgbWF0MmRcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQyZH0gb3V0XG4gKi9cbm1hdDJkLmludmVydCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciBhYSA9IGFbMF0sIGFiID0gYVsxXSwgYWMgPSBhWzJdLCBhZCA9IGFbM10sXG4gICAgICAgIGF0eCA9IGFbNF0sIGF0eSA9IGFbNV07XG5cbiAgICB2YXIgZGV0ID0gYWEgKiBhZCAtIGFiICogYWM7XG4gICAgaWYoIWRldCl7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBkZXQgPSAxLjAgLyBkZXQ7XG5cbiAgICBvdXRbMF0gPSBhZCAqIGRldDtcbiAgICBvdXRbMV0gPSAtYWIgKiBkZXQ7XG4gICAgb3V0WzJdID0gLWFjICogZGV0O1xuICAgIG91dFszXSA9IGFhICogZGV0O1xuICAgIG91dFs0XSA9IChhYyAqIGF0eSAtIGFkICogYXR4KSAqIGRldDtcbiAgICBvdXRbNV0gPSAoYWIgKiBhdHggLSBhYSAqIGF0eSkgKiBkZXQ7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgYSBtYXQyZFxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRldGVybWluYW50IG9mIGFcbiAqL1xubWF0MmQuZGV0ZXJtaW5hbnQgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiBhWzBdICogYVszXSAtIGFbMV0gKiBhWzJdO1xufTtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byBtYXQyZCdzXG4gKlxuICogQHBhcmFtIHttYXQyZH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJkfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge21hdDJkfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge21hdDJkfSBvdXRcbiAqL1xubWF0MmQubXVsdGlwbHkgPSBmdW5jdGlvbiAob3V0LCBhLCBiKSB7XG4gICAgdmFyIGEwID0gYVswXSwgYTEgPSBhWzFdLCBhMiA9IGFbMl0sIGEzID0gYVszXSwgYTQgPSBhWzRdLCBhNSA9IGFbNV0sXG4gICAgICAgIGIwID0gYlswXSwgYjEgPSBiWzFdLCBiMiA9IGJbMl0sIGIzID0gYlszXSwgYjQgPSBiWzRdLCBiNSA9IGJbNV07XG4gICAgb3V0WzBdID0gYTAgKiBiMCArIGEyICogYjE7XG4gICAgb3V0WzFdID0gYTEgKiBiMCArIGEzICogYjE7XG4gICAgb3V0WzJdID0gYTAgKiBiMiArIGEyICogYjM7XG4gICAgb3V0WzNdID0gYTEgKiBiMiArIGEzICogYjM7XG4gICAgb3V0WzRdID0gYTAgKiBiNCArIGEyICogYjUgKyBhNDtcbiAgICBvdXRbNV0gPSBhMSAqIGI0ICsgYTMgKiBiNSArIGE1O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgbWF0MmQubXVsdGlwbHl9XG4gKiBAZnVuY3Rpb25cbiAqL1xubWF0MmQubXVsID0gbWF0MmQubXVsdGlwbHk7XG5cbi8qKlxuICogUm90YXRlcyBhIG1hdDJkIGJ5IHRoZSBnaXZlbiBhbmdsZVxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQyZH0gb3V0XG4gKi9cbm1hdDJkLnJvdGF0ZSA9IGZ1bmN0aW9uIChvdXQsIGEsIHJhZCkge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXSwgYTIgPSBhWzJdLCBhMyA9IGFbM10sIGE0ID0gYVs0XSwgYTUgPSBhWzVdLFxuICAgICAgICBzID0gTWF0aC5zaW4ocmFkKSxcbiAgICAgICAgYyA9IE1hdGguY29zKHJhZCk7XG4gICAgb3V0WzBdID0gYTAgKiAgYyArIGEyICogcztcbiAgICBvdXRbMV0gPSBhMSAqICBjICsgYTMgKiBzO1xuICAgIG91dFsyXSA9IGEwICogLXMgKyBhMiAqIGM7XG4gICAgb3V0WzNdID0gYTEgKiAtcyArIGEzICogYztcbiAgICBvdXRbNF0gPSBhNDtcbiAgICBvdXRbNV0gPSBhNTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTY2FsZXMgdGhlIG1hdDJkIGJ5IHRoZSBkaW1lbnNpb25zIGluIHRoZSBnaXZlbiB2ZWMyXG4gKlxuICogQHBhcmFtIHttYXQyZH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJkfSBhIHRoZSBtYXRyaXggdG8gdHJhbnNsYXRlXG4gKiBAcGFyYW0ge3ZlYzJ9IHYgdGhlIHZlYzIgdG8gc2NhbGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDJkfSBvdXRcbiAqKi9cbm1hdDJkLnNjYWxlID0gZnVuY3Rpb24ob3V0LCBhLCB2KSB7XG4gICAgdmFyIGEwID0gYVswXSwgYTEgPSBhWzFdLCBhMiA9IGFbMl0sIGEzID0gYVszXSwgYTQgPSBhWzRdLCBhNSA9IGFbNV0sXG4gICAgICAgIHYwID0gdlswXSwgdjEgPSB2WzFdO1xuICAgIG91dFswXSA9IGEwICogdjA7XG4gICAgb3V0WzFdID0gYTEgKiB2MDtcbiAgICBvdXRbMl0gPSBhMiAqIHYxO1xuICAgIG91dFszXSA9IGEzICogdjE7XG4gICAgb3V0WzRdID0gYTQ7XG4gICAgb3V0WzVdID0gYTU7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNsYXRlcyB0aGUgbWF0MmQgYnkgdGhlIGRpbWVuc2lvbnMgaW4gdGhlIGdpdmVuIHZlYzJcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIG1hdHJpeCB0byB0cmFuc2xhdGVcbiAqIEBwYXJhbSB7dmVjMn0gdiB0aGUgdmVjMiB0byB0cmFuc2xhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDJkfSBvdXRcbiAqKi9cbm1hdDJkLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKG91dCwgYSwgdikge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXSwgYTIgPSBhWzJdLCBhMyA9IGFbM10sIGE0ID0gYVs0XSwgYTUgPSBhWzVdLFxuICAgICAgICB2MCA9IHZbMF0sIHYxID0gdlsxXTtcbiAgICBvdXRbMF0gPSBhMDtcbiAgICBvdXRbMV0gPSBhMTtcbiAgICBvdXRbMl0gPSBhMjtcbiAgICBvdXRbM10gPSBhMztcbiAgICBvdXRbNF0gPSBhMCAqIHYwICsgYTIgKiB2MSArIGE0O1xuICAgIG91dFs1XSA9IGExICogdjAgKyBhMyAqIHYxICsgYTU7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgZ2l2ZW4gYW5nbGVcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQyZC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQyZC5yb3RhdGUoZGVzdCwgZGVzdCwgcmFkKTtcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBvdXQgbWF0MmQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0MmR9IG91dFxuICovXG5tYXQyZC5mcm9tUm90YXRpb24gPSBmdW5jdGlvbihvdXQsIHJhZCkge1xuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKSwgYyA9IE1hdGguY29zKHJhZCk7XG4gICAgb3V0WzBdID0gYztcbiAgICBvdXRbMV0gPSBzO1xuICAgIG91dFsyXSA9IC1zO1xuICAgIG91dFszXSA9IGM7XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSAwO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgdmVjdG9yIHNjYWxpbmdcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQyZC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQyZC5zY2FsZShkZXN0LCBkZXN0LCB2ZWMpO1xuICpcbiAqIEBwYXJhbSB7bWF0MmR9IG91dCBtYXQyZCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHt2ZWMyfSB2IFNjYWxpbmcgdmVjdG9yXG4gKiBAcmV0dXJucyB7bWF0MmR9IG91dFxuICovXG5tYXQyZC5mcm9tU2NhbGluZyA9IGZ1bmN0aW9uKG91dCwgdikge1xuICAgIG91dFswXSA9IHZbMF07XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IHZbMV07XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSAwO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgdmVjdG9yIHRyYW5zbGF0aW9uXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0MmQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0MmQudHJhbnNsYXRlKGRlc3QsIGRlc3QsIHZlYyk7XG4gKlxuICogQHBhcmFtIHttYXQyZH0gb3V0IG1hdDJkIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3ZlYzJ9IHYgVHJhbnNsYXRpb24gdmVjdG9yXG4gKiBAcmV0dXJucyB7bWF0MmR9IG91dFxuICovXG5tYXQyZC5mcm9tVHJhbnNsYXRpb24gPSBmdW5jdGlvbihvdXQsIHYpIHtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAxO1xuICAgIG91dFs0XSA9IHZbMF07XG4gICAgb3V0WzVdID0gdlsxXTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBtYXQyZFxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IGEgbWF0cml4IHRvIHJlcHJlc2VudCBhcyBhIHN0cmluZ1xuICogQHJldHVybnMge1N0cmluZ30gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBtYXRyaXhcbiAqL1xubWF0MmQuc3RyID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gJ21hdDJkKCcgKyBhWzBdICsgJywgJyArIGFbMV0gKyAnLCAnICsgYVsyXSArICcsICcgKyBcbiAgICAgICAgICAgICAgICAgICAgYVszXSArICcsICcgKyBhWzRdICsgJywgJyArIGFbNV0gKyAnKSc7XG59O1xuXG4vKipcbiAqIFJldHVybnMgRnJvYmVuaXVzIG5vcm0gb2YgYSBtYXQyZFxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIG1hdHJpeCB0byBjYWxjdWxhdGUgRnJvYmVuaXVzIG5vcm0gb2ZcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IEZyb2Jlbml1cyBub3JtXG4gKi9cbm1hdDJkLmZyb2IgPSBmdW5jdGlvbiAoYSkgeyBcbiAgICByZXR1cm4oTWF0aC5zcXJ0KE1hdGgucG93KGFbMF0sIDIpICsgTWF0aC5wb3coYVsxXSwgMikgKyBNYXRoLnBvdyhhWzJdLCAyKSArIE1hdGgucG93KGFbM10sIDIpICsgTWF0aC5wb3coYVs0XSwgMikgKyBNYXRoLnBvdyhhWzVdLCAyKSArIDEpKVxufTsgXG5cbm1vZHVsZS5leHBvcnRzID0gbWF0MmQ7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC9tYXQyZC5qc1xuICoqIG1vZHVsZSBpZCA9IDdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qIENvcHlyaWdodCAoYykgMjAxNSwgQnJhbmRvbiBKb25lcywgQ29saW4gTWFjS2VuemllIElWLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuICovXG5cbnZhciBnbE1hdHJpeCA9IHJlcXVpcmUoXCIuL2NvbW1vbi5qc1wiKTtcblxuLyoqXG4gKiBAY2xhc3MgM3gzIE1hdHJpeFxuICogQG5hbWUgbWF0M1xuICovXG52YXIgbWF0MyA9IHt9O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaWRlbnRpdHkgbWF0M1xuICpcbiAqIEByZXR1cm5zIHttYXQzfSBhIG5ldyAzeDMgbWF0cml4XG4gKi9cbm1hdDMuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDkpO1xuICAgIG91dFswXSA9IDE7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0gMTtcbiAgICBvdXRbNV0gPSAwO1xuICAgIG91dFs2XSA9IDA7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENvcGllcyB0aGUgdXBwZXItbGVmdCAzeDMgdmFsdWVzIGludG8gdGhlIGdpdmVuIG1hdDMuXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyAzeDMgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgICB0aGUgc291cmNlIDR4NCBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My5mcm9tTWF0NCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbNF07XG4gICAgb3V0WzRdID0gYVs1XTtcbiAgICBvdXRbNV0gPSBhWzZdO1xuICAgIG91dFs2XSA9IGFbOF07XG4gICAgb3V0WzddID0gYVs5XTtcbiAgICBvdXRbOF0gPSBhWzEwXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IG1hdDMgaW5pdGlhbGl6ZWQgd2l0aCB2YWx1ZXMgZnJvbSBhbiBleGlzdGluZyBtYXRyaXhcbiAqXG4gKiBAcGFyYW0ge21hdDN9IGEgbWF0cml4IHRvIGNsb25lXG4gKiBAcmV0dXJucyB7bWF0M30gYSBuZXcgM3gzIG1hdHJpeFxuICovXG5tYXQzLmNsb25lID0gZnVuY3Rpb24oYSkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSg5KTtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIG91dFs0XSA9IGFbNF07XG4gICAgb3V0WzVdID0gYVs1XTtcbiAgICBvdXRbNl0gPSBhWzZdO1xuICAgIG91dFs3XSA9IGFbN107XG4gICAgb3V0WzhdID0gYVs4XTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDb3B5IHRoZSB2YWx1ZXMgZnJvbSBvbmUgbWF0MyB0byBhbm90aGVyXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLmNvcHkgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIG91dFs0XSA9IGFbNF07XG4gICAgb3V0WzVdID0gYVs1XTtcbiAgICBvdXRbNl0gPSBhWzZdO1xuICAgIG91dFs3XSA9IGFbN107XG4gICAgb3V0WzhdID0gYVs4XTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTZXQgYSBtYXQzIHRvIHRoZSBpZGVudGl0eSBtYXRyaXhcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLmlkZW50aXR5ID0gZnVuY3Rpb24ob3V0KSB7XG4gICAgb3V0WzBdID0gMTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAxO1xuICAgIG91dFs1XSA9IDA7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNwb3NlIHRoZSB2YWx1ZXMgb2YgYSBtYXQzXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLnRyYW5zcG9zZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIC8vIElmIHdlIGFyZSB0cmFuc3Bvc2luZyBvdXJzZWx2ZXMgd2UgY2FuIHNraXAgYSBmZXcgc3RlcHMgYnV0IGhhdmUgdG8gY2FjaGUgc29tZSB2YWx1ZXNcbiAgICBpZiAob3V0ID09PSBhKSB7XG4gICAgICAgIHZhciBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMTIgPSBhWzVdO1xuICAgICAgICBvdXRbMV0gPSBhWzNdO1xuICAgICAgICBvdXRbMl0gPSBhWzZdO1xuICAgICAgICBvdXRbM10gPSBhMDE7XG4gICAgICAgIG91dFs1XSA9IGFbN107XG4gICAgICAgIG91dFs2XSA9IGEwMjtcbiAgICAgICAgb3V0WzddID0gYTEyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG91dFswXSA9IGFbMF07XG4gICAgICAgIG91dFsxXSA9IGFbM107XG4gICAgICAgIG91dFsyXSA9IGFbNl07XG4gICAgICAgIG91dFszXSA9IGFbMV07XG4gICAgICAgIG91dFs0XSA9IGFbNF07XG4gICAgICAgIG91dFs1XSA9IGFbN107XG4gICAgICAgIG91dFs2XSA9IGFbMl07XG4gICAgICAgIG91dFs3XSA9IGFbNV07XG4gICAgICAgIG91dFs4XSA9IGFbOF07XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEludmVydHMgYSBtYXQzXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLmludmVydCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLFxuICAgICAgICBhMTAgPSBhWzNdLCBhMTEgPSBhWzRdLCBhMTIgPSBhWzVdLFxuICAgICAgICBhMjAgPSBhWzZdLCBhMjEgPSBhWzddLCBhMjIgPSBhWzhdLFxuXG4gICAgICAgIGIwMSA9IGEyMiAqIGExMSAtIGExMiAqIGEyMSxcbiAgICAgICAgYjExID0gLWEyMiAqIGExMCArIGExMiAqIGEyMCxcbiAgICAgICAgYjIxID0gYTIxICogYTEwIC0gYTExICogYTIwLFxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnRcbiAgICAgICAgZGV0ID0gYTAwICogYjAxICsgYTAxICogYjExICsgYTAyICogYjIxO1xuXG4gICAgaWYgKCFkZXQpIHsgXG4gICAgICAgIHJldHVybiBudWxsOyBcbiAgICB9XG4gICAgZGV0ID0gMS4wIC8gZGV0O1xuXG4gICAgb3V0WzBdID0gYjAxICogZGV0O1xuICAgIG91dFsxXSA9ICgtYTIyICogYTAxICsgYTAyICogYTIxKSAqIGRldDtcbiAgICBvdXRbMl0gPSAoYTEyICogYTAxIC0gYTAyICogYTExKSAqIGRldDtcbiAgICBvdXRbM10gPSBiMTEgKiBkZXQ7XG4gICAgb3V0WzRdID0gKGEyMiAqIGEwMCAtIGEwMiAqIGEyMCkgKiBkZXQ7XG4gICAgb3V0WzVdID0gKC1hMTIgKiBhMDAgKyBhMDIgKiBhMTApICogZGV0O1xuICAgIG91dFs2XSA9IGIyMSAqIGRldDtcbiAgICBvdXRbN10gPSAoLWEyMSAqIGEwMCArIGEwMSAqIGEyMCkgKiBkZXQ7XG4gICAgb3V0WzhdID0gKGExMSAqIGEwMCAtIGEwMSAqIGExMCkgKiBkZXQ7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgYWRqdWdhdGUgb2YgYSBtYXQzXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLmFkam9pbnQgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSxcbiAgICAgICAgYTEwID0gYVszXSwgYTExID0gYVs0XSwgYTEyID0gYVs1XSxcbiAgICAgICAgYTIwID0gYVs2XSwgYTIxID0gYVs3XSwgYTIyID0gYVs4XTtcblxuICAgIG91dFswXSA9IChhMTEgKiBhMjIgLSBhMTIgKiBhMjEpO1xuICAgIG91dFsxXSA9IChhMDIgKiBhMjEgLSBhMDEgKiBhMjIpO1xuICAgIG91dFsyXSA9IChhMDEgKiBhMTIgLSBhMDIgKiBhMTEpO1xuICAgIG91dFszXSA9IChhMTIgKiBhMjAgLSBhMTAgKiBhMjIpO1xuICAgIG91dFs0XSA9IChhMDAgKiBhMjIgLSBhMDIgKiBhMjApO1xuICAgIG91dFs1XSA9IChhMDIgKiBhMTAgLSBhMDAgKiBhMTIpO1xuICAgIG91dFs2XSA9IChhMTAgKiBhMjEgLSBhMTEgKiBhMjApO1xuICAgIG91dFs3XSA9IChhMDEgKiBhMjAgLSBhMDAgKiBhMjEpO1xuICAgIG91dFs4XSA9IChhMDAgKiBhMTEgLSBhMDEgKiBhMTApO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGRldGVybWluYW50IG9mIGEgbWF0M1xuICpcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge051bWJlcn0gZGV0ZXJtaW5hbnQgb2YgYVxuICovXG5tYXQzLmRldGVybWluYW50ID0gZnVuY3Rpb24gKGEpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSxcbiAgICAgICAgYTEwID0gYVszXSwgYTExID0gYVs0XSwgYTEyID0gYVs1XSxcbiAgICAgICAgYTIwID0gYVs2XSwgYTIxID0gYVs3XSwgYTIyID0gYVs4XTtcblxuICAgIHJldHVybiBhMDAgKiAoYTIyICogYTExIC0gYTEyICogYTIxKSArIGEwMSAqICgtYTIyICogYTEwICsgYTEyICogYTIwKSArIGEwMiAqIChhMjEgKiBhMTAgLSBhMTEgKiBhMjApO1xufTtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byBtYXQzJ3NcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge21hdDN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMubXVsdGlwbHkgPSBmdW5jdGlvbiAob3V0LCBhLCBiKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sXG4gICAgICAgIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV0sXG4gICAgICAgIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF0sXG5cbiAgICAgICAgYjAwID0gYlswXSwgYjAxID0gYlsxXSwgYjAyID0gYlsyXSxcbiAgICAgICAgYjEwID0gYlszXSwgYjExID0gYls0XSwgYjEyID0gYls1XSxcbiAgICAgICAgYjIwID0gYls2XSwgYjIxID0gYls3XSwgYjIyID0gYls4XTtcblxuICAgIG91dFswXSA9IGIwMCAqIGEwMCArIGIwMSAqIGExMCArIGIwMiAqIGEyMDtcbiAgICBvdXRbMV0gPSBiMDAgKiBhMDEgKyBiMDEgKiBhMTEgKyBiMDIgKiBhMjE7XG4gICAgb3V0WzJdID0gYjAwICogYTAyICsgYjAxICogYTEyICsgYjAyICogYTIyO1xuXG4gICAgb3V0WzNdID0gYjEwICogYTAwICsgYjExICogYTEwICsgYjEyICogYTIwO1xuICAgIG91dFs0XSA9IGIxMCAqIGEwMSArIGIxMSAqIGExMSArIGIxMiAqIGEyMTtcbiAgICBvdXRbNV0gPSBiMTAgKiBhMDIgKyBiMTEgKiBhMTIgKyBiMTIgKiBhMjI7XG5cbiAgICBvdXRbNl0gPSBiMjAgKiBhMDAgKyBiMjEgKiBhMTAgKyBiMjIgKiBhMjA7XG4gICAgb3V0WzddID0gYjIwICogYTAxICsgYjIxICogYTExICsgYjIyICogYTIxO1xuICAgIG91dFs4XSA9IGIyMCAqIGEwMiArIGIyMSAqIGExMiArIGIyMiAqIGEyMjtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIG1hdDMubXVsdGlwbHl9XG4gKiBAZnVuY3Rpb25cbiAqL1xubWF0My5tdWwgPSBtYXQzLm11bHRpcGx5O1xuXG4vKipcbiAqIFRyYW5zbGF0ZSBhIG1hdDMgYnkgdGhlIGdpdmVuIHZlY3RvclxuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIG1hdHJpeCB0byB0cmFuc2xhdGVcbiAqIEBwYXJhbSB7dmVjMn0gdiB2ZWN0b3IgdG8gdHJhbnNsYXRlIGJ5XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMudHJhbnNsYXRlID0gZnVuY3Rpb24ob3V0LCBhLCB2KSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sXG4gICAgICAgIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV0sXG4gICAgICAgIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF0sXG4gICAgICAgIHggPSB2WzBdLCB5ID0gdlsxXTtcblxuICAgIG91dFswXSA9IGEwMDtcbiAgICBvdXRbMV0gPSBhMDE7XG4gICAgb3V0WzJdID0gYTAyO1xuXG4gICAgb3V0WzNdID0gYTEwO1xuICAgIG91dFs0XSA9IGExMTtcbiAgICBvdXRbNV0gPSBhMTI7XG5cbiAgICBvdXRbNl0gPSB4ICogYTAwICsgeSAqIGExMCArIGEyMDtcbiAgICBvdXRbN10gPSB4ICogYTAxICsgeSAqIGExMSArIGEyMTtcbiAgICBvdXRbOF0gPSB4ICogYTAyICsgeSAqIGExMiArIGEyMjtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSb3RhdGVzIGEgbWF0MyBieSB0aGUgZ2l2ZW4gYW5nbGVcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLnJvdGF0ZSA9IGZ1bmN0aW9uIChvdXQsIGEsIHJhZCkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLFxuICAgICAgICBhMTAgPSBhWzNdLCBhMTEgPSBhWzRdLCBhMTIgPSBhWzVdLFxuICAgICAgICBhMjAgPSBhWzZdLCBhMjEgPSBhWzddLCBhMjIgPSBhWzhdLFxuXG4gICAgICAgIHMgPSBNYXRoLnNpbihyYWQpLFxuICAgICAgICBjID0gTWF0aC5jb3MocmFkKTtcblxuICAgIG91dFswXSA9IGMgKiBhMDAgKyBzICogYTEwO1xuICAgIG91dFsxXSA9IGMgKiBhMDEgKyBzICogYTExO1xuICAgIG91dFsyXSA9IGMgKiBhMDIgKyBzICogYTEyO1xuXG4gICAgb3V0WzNdID0gYyAqIGExMCAtIHMgKiBhMDA7XG4gICAgb3V0WzRdID0gYyAqIGExMSAtIHMgKiBhMDE7XG4gICAgb3V0WzVdID0gYyAqIGExMiAtIHMgKiBhMDI7XG5cbiAgICBvdXRbNl0gPSBhMjA7XG4gICAgb3V0WzddID0gYTIxO1xuICAgIG91dFs4XSA9IGEyMjtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTY2FsZXMgdGhlIG1hdDMgYnkgdGhlIGRpbWVuc2lvbnMgaW4gdGhlIGdpdmVuIHZlYzJcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge3ZlYzJ9IHYgdGhlIHZlYzIgdG8gc2NhbGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDN9IG91dFxuICoqL1xubWF0My5zY2FsZSA9IGZ1bmN0aW9uKG91dCwgYSwgdikge1xuICAgIHZhciB4ID0gdlswXSwgeSA9IHZbMV07XG5cbiAgICBvdXRbMF0gPSB4ICogYVswXTtcbiAgICBvdXRbMV0gPSB4ICogYVsxXTtcbiAgICBvdXRbMl0gPSB4ICogYVsyXTtcblxuICAgIG91dFszXSA9IHkgKiBhWzNdO1xuICAgIG91dFs0XSA9IHkgKiBhWzRdO1xuICAgIG91dFs1XSA9IHkgKiBhWzVdO1xuXG4gICAgb3V0WzZdID0gYVs2XTtcbiAgICBvdXRbN10gPSBhWzddO1xuICAgIG91dFs4XSA9IGFbOF07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgdmVjdG9yIHRyYW5zbGF0aW9uXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0My5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQzLnRyYW5zbGF0ZShkZXN0LCBkZXN0LCB2ZWMpO1xuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IG1hdDMgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7dmVjMn0gdiBUcmFuc2xhdGlvbiB2ZWN0b3JcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My5mcm9tVHJhbnNsYXRpb24gPSBmdW5jdGlvbihvdXQsIHYpIHtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDE7XG4gICAgb3V0WzVdID0gMDtcbiAgICBvdXRbNl0gPSB2WzBdO1xuICAgIG91dFs3XSA9IHZbMV07XG4gICAgb3V0WzhdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIGdpdmVuIGFuZ2xlXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0My5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQzLnJvdGF0ZShkZXN0LCBkZXN0LCByYWQpO1xuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IG1hdDMgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMuZnJvbVJvdGF0aW9uID0gZnVuY3Rpb24ob3V0LCByYWQpIHtcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCksIGMgPSBNYXRoLmNvcyhyYWQpO1xuXG4gICAgb3V0WzBdID0gYztcbiAgICBvdXRbMV0gPSBzO1xuICAgIG91dFsyXSA9IDA7XG5cbiAgICBvdXRbM10gPSAtcztcbiAgICBvdXRbNF0gPSBjO1xuICAgIG91dFs1XSA9IDA7XG5cbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHZlY3RvciBzY2FsaW5nXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0My5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQzLnNjYWxlKGRlc3QsIGRlc3QsIHZlYyk7XG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgbWF0MyByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHt2ZWMyfSB2IFNjYWxpbmcgdmVjdG9yXG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMuZnJvbVNjYWxpbmcgPSBmdW5jdGlvbihvdXQsIHYpIHtcbiAgICBvdXRbMF0gPSB2WzBdO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcblxuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0gdlsxXTtcbiAgICBvdXRbNV0gPSAwO1xuXG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDb3BpZXMgdGhlIHZhbHVlcyBmcm9tIGEgbWF0MmQgaW50byBhIG1hdDNcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgbWF0cml4IHRvIGNvcHlcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqKi9cbm1hdDMuZnJvbU1hdDJkID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IDA7XG5cbiAgICBvdXRbM10gPSBhWzJdO1xuICAgIG91dFs0XSA9IGFbM107XG4gICAgb3V0WzVdID0gMDtcblxuICAgIG91dFs2XSA9IGFbNF07XG4gICAgb3V0WzddID0gYVs1XTtcbiAgICBvdXRbOF0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiogQ2FsY3VsYXRlcyBhIDN4MyBtYXRyaXggZnJvbSB0aGUgZ2l2ZW4gcXVhdGVybmlvblxuKlxuKiBAcGFyYW0ge21hdDN9IG91dCBtYXQzIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4qIEBwYXJhbSB7cXVhdH0gcSBRdWF0ZXJuaW9uIHRvIGNyZWF0ZSBtYXRyaXggZnJvbVxuKlxuKiBAcmV0dXJucyB7bWF0M30gb3V0XG4qL1xubWF0My5mcm9tUXVhdCA9IGZ1bmN0aW9uIChvdXQsIHEpIHtcbiAgICB2YXIgeCA9IHFbMF0sIHkgPSBxWzFdLCB6ID0gcVsyXSwgdyA9IHFbM10sXG4gICAgICAgIHgyID0geCArIHgsXG4gICAgICAgIHkyID0geSArIHksXG4gICAgICAgIHoyID0geiArIHosXG5cbiAgICAgICAgeHggPSB4ICogeDIsXG4gICAgICAgIHl4ID0geSAqIHgyLFxuICAgICAgICB5eSA9IHkgKiB5MixcbiAgICAgICAgenggPSB6ICogeDIsXG4gICAgICAgIHp5ID0geiAqIHkyLFxuICAgICAgICB6eiA9IHogKiB6MixcbiAgICAgICAgd3ggPSB3ICogeDIsXG4gICAgICAgIHd5ID0gdyAqIHkyLFxuICAgICAgICB3eiA9IHcgKiB6MjtcblxuICAgIG91dFswXSA9IDEgLSB5eSAtIHp6O1xuICAgIG91dFszXSA9IHl4IC0gd3o7XG4gICAgb3V0WzZdID0genggKyB3eTtcblxuICAgIG91dFsxXSA9IHl4ICsgd3o7XG4gICAgb3V0WzRdID0gMSAtIHh4IC0geno7XG4gICAgb3V0WzddID0genkgLSB3eDtcblxuICAgIG91dFsyXSA9IHp4IC0gd3k7XG4gICAgb3V0WzVdID0genkgKyB3eDtcbiAgICBvdXRbOF0gPSAxIC0geHggLSB5eTtcblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiogQ2FsY3VsYXRlcyBhIDN4MyBub3JtYWwgbWF0cml4ICh0cmFuc3Bvc2UgaW52ZXJzZSkgZnJvbSB0aGUgNHg0IG1hdHJpeFxuKlxuKiBAcGFyYW0ge21hdDN9IG91dCBtYXQzIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4qIEBwYXJhbSB7bWF0NH0gYSBNYXQ0IHRvIGRlcml2ZSB0aGUgbm9ybWFsIG1hdHJpeCBmcm9tXG4qXG4qIEByZXR1cm5zIHttYXQzfSBvdXRcbiovXG5tYXQzLm5vcm1hbEZyb21NYXQ0ID0gZnVuY3Rpb24gKG91dCwgYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMDMgPSBhWzNdLFxuICAgICAgICBhMTAgPSBhWzRdLCBhMTEgPSBhWzVdLCBhMTIgPSBhWzZdLCBhMTMgPSBhWzddLFxuICAgICAgICBhMjAgPSBhWzhdLCBhMjEgPSBhWzldLCBhMjIgPSBhWzEwXSwgYTIzID0gYVsxMV0sXG4gICAgICAgIGEzMCA9IGFbMTJdLCBhMzEgPSBhWzEzXSwgYTMyID0gYVsxNF0sIGEzMyA9IGFbMTVdLFxuXG4gICAgICAgIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMCxcbiAgICAgICAgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwLFxuICAgICAgICBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTAsXG4gICAgICAgIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMSxcbiAgICAgICAgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExLFxuICAgICAgICBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTIsXG4gICAgICAgIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMCxcbiAgICAgICAgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwLFxuICAgICAgICBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzAsXG4gICAgICAgIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMSxcbiAgICAgICAgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxLFxuICAgICAgICBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzIsXG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudFxuICAgICAgICBkZXQgPSBiMDAgKiBiMTEgLSBiMDEgKiBiMTAgKyBiMDIgKiBiMDkgKyBiMDMgKiBiMDggLSBiMDQgKiBiMDcgKyBiMDUgKiBiMDY7XG5cbiAgICBpZiAoIWRldCkgeyBcbiAgICAgICAgcmV0dXJuIG51bGw7IFxuICAgIH1cbiAgICBkZXQgPSAxLjAgLyBkZXQ7XG5cbiAgICBvdXRbMF0gPSAoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5KSAqIGRldDtcbiAgICBvdXRbMV0gPSAoYTEyICogYjA4IC0gYTEwICogYjExIC0gYTEzICogYjA3KSAqIGRldDtcbiAgICBvdXRbMl0gPSAoYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2KSAqIGRldDtcblxuICAgIG91dFszXSA9IChhMDIgKiBiMTAgLSBhMDEgKiBiMTEgLSBhMDMgKiBiMDkpICogZGV0O1xuICAgIG91dFs0XSA9IChhMDAgKiBiMTEgLSBhMDIgKiBiMDggKyBhMDMgKiBiMDcpICogZGV0O1xuICAgIG91dFs1XSA9IChhMDEgKiBiMDggLSBhMDAgKiBiMTAgLSBhMDMgKiBiMDYpICogZGV0O1xuXG4gICAgb3V0WzZdID0gKGEzMSAqIGIwNSAtIGEzMiAqIGIwNCArIGEzMyAqIGIwMykgKiBkZXQ7XG4gICAgb3V0WzddID0gKGEzMiAqIGIwMiAtIGEzMCAqIGIwNSAtIGEzMyAqIGIwMSkgKiBkZXQ7XG4gICAgb3V0WzhdID0gKGEzMCAqIGIwNCAtIGEzMSAqIGIwMiArIGEzMyAqIGIwMCkgKiBkZXQ7XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgbWF0M1xuICpcbiAqIEBwYXJhbSB7bWF0M30gbWF0IG1hdHJpeCB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4XG4gKi9cbm1hdDMuc3RyID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gJ21hdDMoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcsICcgKyBhWzJdICsgJywgJyArIFxuICAgICAgICAgICAgICAgICAgICBhWzNdICsgJywgJyArIGFbNF0gKyAnLCAnICsgYVs1XSArICcsICcgKyBcbiAgICAgICAgICAgICAgICAgICAgYVs2XSArICcsICcgKyBhWzddICsgJywgJyArIGFbOF0gKyAnKSc7XG59O1xuXG4vKipcbiAqIFJldHVybnMgRnJvYmVuaXVzIG5vcm0gb2YgYSBtYXQzXG4gKlxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBtYXRyaXggdG8gY2FsY3VsYXRlIEZyb2Jlbml1cyBub3JtIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBGcm9iZW5pdXMgbm9ybVxuICovXG5tYXQzLmZyb2IgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybihNYXRoLnNxcnQoTWF0aC5wb3coYVswXSwgMikgKyBNYXRoLnBvdyhhWzFdLCAyKSArIE1hdGgucG93KGFbMl0sIDIpICsgTWF0aC5wb3coYVszXSwgMikgKyBNYXRoLnBvdyhhWzRdLCAyKSArIE1hdGgucG93KGFbNV0sIDIpICsgTWF0aC5wb3coYVs2XSwgMikgKyBNYXRoLnBvdyhhWzddLCAyKSArIE1hdGgucG93KGFbOF0sIDIpKSlcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBtYXQzO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvbWF0My5qc1xuICoqIG1vZHVsZSBpZCA9IDhcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qIENvcHlyaWdodCAoYykgMjAxNSwgQnJhbmRvbiBKb25lcywgQ29saW4gTWFjS2VuemllIElWLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuICovXG5cbnZhciBnbE1hdHJpeCA9IHJlcXVpcmUoXCIuL2NvbW1vbi5qc1wiKTtcblxuLyoqXG4gKiBAY2xhc3MgNHg0IE1hdHJpeFxuICogQG5hbWUgbWF0NFxuICovXG52YXIgbWF0NCA9IHt9O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaWRlbnRpdHkgbWF0NFxuICpcbiAqIEByZXR1cm5zIHttYXQ0fSBhIG5ldyA0eDQgbWF0cml4XG4gKi9cbm1hdDQuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDE2KTtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gMTtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMDtcbiAgICBvdXRbOV0gPSAwO1xuICAgIG91dFsxMF0gPSAxO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAwO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgbWF0NCBpbml0aWFsaXplZCB3aXRoIHZhbHVlcyBmcm9tIGFuIGV4aXN0aW5nIG1hdHJpeFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gYSBtYXRyaXggdG8gY2xvbmVcbiAqIEByZXR1cm5zIHttYXQ0fSBhIG5ldyA0eDQgbWF0cml4XG4gKi9cbm1hdDQuY2xvbmUgPSBmdW5jdGlvbihhKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDE2KTtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIG91dFs0XSA9IGFbNF07XG4gICAgb3V0WzVdID0gYVs1XTtcbiAgICBvdXRbNl0gPSBhWzZdO1xuICAgIG91dFs3XSA9IGFbN107XG4gICAgb3V0WzhdID0gYVs4XTtcbiAgICBvdXRbOV0gPSBhWzldO1xuICAgIG91dFsxMF0gPSBhWzEwXTtcbiAgICBvdXRbMTFdID0gYVsxMV07XG4gICAgb3V0WzEyXSA9IGFbMTJdO1xuICAgIG91dFsxM10gPSBhWzEzXTtcbiAgICBvdXRbMTRdID0gYVsxNF07XG4gICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSBtYXQ0IHRvIGFub3RoZXJcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuY29weSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgb3V0WzRdID0gYVs0XTtcbiAgICBvdXRbNV0gPSBhWzVdO1xuICAgIG91dFs2XSA9IGFbNl07XG4gICAgb3V0WzddID0gYVs3XTtcbiAgICBvdXRbOF0gPSBhWzhdO1xuICAgIG91dFs5XSA9IGFbOV07XG4gICAgb3V0WzEwXSA9IGFbMTBdO1xuICAgIG91dFsxMV0gPSBhWzExXTtcbiAgICBvdXRbMTJdID0gYVsxMl07XG4gICAgb3V0WzEzXSA9IGFbMTNdO1xuICAgIG91dFsxNF0gPSBhWzE0XTtcbiAgICBvdXRbMTVdID0gYVsxNV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2V0IGEgbWF0NCB0byB0aGUgaWRlbnRpdHkgbWF0cml4XG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5pZGVudGl0eSA9IGZ1bmN0aW9uKG91dCkge1xuICAgIG91dFswXSA9IDE7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSAxO1xuICAgIG91dFs2XSA9IDA7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSAwO1xuICAgIG91dFs5XSA9IDA7XG4gICAgb3V0WzEwXSA9IDE7XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IDA7XG4gICAgb3V0WzEzXSA9IDA7XG4gICAgb3V0WzE0XSA9IDA7XG4gICAgb3V0WzE1XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNwb3NlIHRoZSB2YWx1ZXMgb2YgYSBtYXQ0XG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LnRyYW5zcG9zZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIC8vIElmIHdlIGFyZSB0cmFuc3Bvc2luZyBvdXJzZWx2ZXMgd2UgY2FuIHNraXAgYSBmZXcgc3RlcHMgYnV0IGhhdmUgdG8gY2FjaGUgc29tZSB2YWx1ZXNcbiAgICBpZiAob3V0ID09PSBhKSB7XG4gICAgICAgIHZhciBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMDMgPSBhWzNdLFxuICAgICAgICAgICAgYTEyID0gYVs2XSwgYTEzID0gYVs3XSxcbiAgICAgICAgICAgIGEyMyA9IGFbMTFdO1xuXG4gICAgICAgIG91dFsxXSA9IGFbNF07XG4gICAgICAgIG91dFsyXSA9IGFbOF07XG4gICAgICAgIG91dFszXSA9IGFbMTJdO1xuICAgICAgICBvdXRbNF0gPSBhMDE7XG4gICAgICAgIG91dFs2XSA9IGFbOV07XG4gICAgICAgIG91dFs3XSA9IGFbMTNdO1xuICAgICAgICBvdXRbOF0gPSBhMDI7XG4gICAgICAgIG91dFs5XSA9IGExMjtcbiAgICAgICAgb3V0WzExXSA9IGFbMTRdO1xuICAgICAgICBvdXRbMTJdID0gYTAzO1xuICAgICAgICBvdXRbMTNdID0gYTEzO1xuICAgICAgICBvdXRbMTRdID0gYTIzO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG91dFswXSA9IGFbMF07XG4gICAgICAgIG91dFsxXSA9IGFbNF07XG4gICAgICAgIG91dFsyXSA9IGFbOF07XG4gICAgICAgIG91dFszXSA9IGFbMTJdO1xuICAgICAgICBvdXRbNF0gPSBhWzFdO1xuICAgICAgICBvdXRbNV0gPSBhWzVdO1xuICAgICAgICBvdXRbNl0gPSBhWzldO1xuICAgICAgICBvdXRbN10gPSBhWzEzXTtcbiAgICAgICAgb3V0WzhdID0gYVsyXTtcbiAgICAgICAgb3V0WzldID0gYVs2XTtcbiAgICAgICAgb3V0WzEwXSA9IGFbMTBdO1xuICAgICAgICBvdXRbMTFdID0gYVsxNF07XG4gICAgICAgIG91dFsxMl0gPSBhWzNdO1xuICAgICAgICBvdXRbMTNdID0gYVs3XTtcbiAgICAgICAgb3V0WzE0XSA9IGFbMTFdO1xuICAgICAgICBvdXRbMTVdID0gYVsxNV07XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEludmVydHMgYSBtYXQ0XG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmludmVydCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMDMgPSBhWzNdLFxuICAgICAgICBhMTAgPSBhWzRdLCBhMTEgPSBhWzVdLCBhMTIgPSBhWzZdLCBhMTMgPSBhWzddLFxuICAgICAgICBhMjAgPSBhWzhdLCBhMjEgPSBhWzldLCBhMjIgPSBhWzEwXSwgYTIzID0gYVsxMV0sXG4gICAgICAgIGEzMCA9IGFbMTJdLCBhMzEgPSBhWzEzXSwgYTMyID0gYVsxNF0sIGEzMyA9IGFbMTVdLFxuXG4gICAgICAgIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMCxcbiAgICAgICAgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwLFxuICAgICAgICBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTAsXG4gICAgICAgIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMSxcbiAgICAgICAgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExLFxuICAgICAgICBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTIsXG4gICAgICAgIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMCxcbiAgICAgICAgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwLFxuICAgICAgICBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzAsXG4gICAgICAgIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMSxcbiAgICAgICAgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxLFxuICAgICAgICBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzIsXG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudFxuICAgICAgICBkZXQgPSBiMDAgKiBiMTEgLSBiMDEgKiBiMTAgKyBiMDIgKiBiMDkgKyBiMDMgKiBiMDggLSBiMDQgKiBiMDcgKyBiMDUgKiBiMDY7XG5cbiAgICBpZiAoIWRldCkgeyBcbiAgICAgICAgcmV0dXJuIG51bGw7IFxuICAgIH1cbiAgICBkZXQgPSAxLjAgLyBkZXQ7XG5cbiAgICBvdXRbMF0gPSAoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5KSAqIGRldDtcbiAgICBvdXRbMV0gPSAoYTAyICogYjEwIC0gYTAxICogYjExIC0gYTAzICogYjA5KSAqIGRldDtcbiAgICBvdXRbMl0gPSAoYTMxICogYjA1IC0gYTMyICogYjA0ICsgYTMzICogYjAzKSAqIGRldDtcbiAgICBvdXRbM10gPSAoYTIyICogYjA0IC0gYTIxICogYjA1IC0gYTIzICogYjAzKSAqIGRldDtcbiAgICBvdXRbNF0gPSAoYTEyICogYjA4IC0gYTEwICogYjExIC0gYTEzICogYjA3KSAqIGRldDtcbiAgICBvdXRbNV0gPSAoYTAwICogYjExIC0gYTAyICogYjA4ICsgYTAzICogYjA3KSAqIGRldDtcbiAgICBvdXRbNl0gPSAoYTMyICogYjAyIC0gYTMwICogYjA1IC0gYTMzICogYjAxKSAqIGRldDtcbiAgICBvdXRbN10gPSAoYTIwICogYjA1IC0gYTIyICogYjAyICsgYTIzICogYjAxKSAqIGRldDtcbiAgICBvdXRbOF0gPSAoYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2KSAqIGRldDtcbiAgICBvdXRbOV0gPSAoYTAxICogYjA4IC0gYTAwICogYjEwIC0gYTAzICogYjA2KSAqIGRldDtcbiAgICBvdXRbMTBdID0gKGEzMCAqIGIwNCAtIGEzMSAqIGIwMiArIGEzMyAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0WzExXSA9IChhMjEgKiBiMDIgLSBhMjAgKiBiMDQgLSBhMjMgKiBiMDApICogZGV0O1xuICAgIG91dFsxMl0gPSAoYTExICogYjA3IC0gYTEwICogYjA5IC0gYTEyICogYjA2KSAqIGRldDtcbiAgICBvdXRbMTNdID0gKGEwMCAqIGIwOSAtIGEwMSAqIGIwNyArIGEwMiAqIGIwNikgKiBkZXQ7XG4gICAgb3V0WzE0XSA9IChhMzEgKiBiMDEgLSBhMzAgKiBiMDMgLSBhMzIgKiBiMDApICogZGV0O1xuICAgIG91dFsxNV0gPSAoYTIwICogYjAzIC0gYTIxICogYjAxICsgYTIyICogYjAwKSAqIGRldDtcblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGFkanVnYXRlIG9mIGEgbWF0NFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5hZGpvaW50ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sIGEwMyA9IGFbM10sXG4gICAgICAgIGExMCA9IGFbNF0sIGExMSA9IGFbNV0sIGExMiA9IGFbNl0sIGExMyA9IGFbN10sXG4gICAgICAgIGEyMCA9IGFbOF0sIGEyMSA9IGFbOV0sIGEyMiA9IGFbMTBdLCBhMjMgPSBhWzExXSxcbiAgICAgICAgYTMwID0gYVsxMl0sIGEzMSA9IGFbMTNdLCBhMzIgPSBhWzE0XSwgYTMzID0gYVsxNV07XG5cbiAgICBvdXRbMF0gID0gIChhMTEgKiAoYTIyICogYTMzIC0gYTIzICogYTMyKSAtIGEyMSAqIChhMTIgKiBhMzMgLSBhMTMgKiBhMzIpICsgYTMxICogKGExMiAqIGEyMyAtIGExMyAqIGEyMikpO1xuICAgIG91dFsxXSAgPSAtKGEwMSAqIChhMjIgKiBhMzMgLSBhMjMgKiBhMzIpIC0gYTIxICogKGEwMiAqIGEzMyAtIGEwMyAqIGEzMikgKyBhMzEgKiAoYTAyICogYTIzIC0gYTAzICogYTIyKSk7XG4gICAgb3V0WzJdICA9ICAoYTAxICogKGExMiAqIGEzMyAtIGExMyAqIGEzMikgLSBhMTEgKiAoYTAyICogYTMzIC0gYTAzICogYTMyKSArIGEzMSAqIChhMDIgKiBhMTMgLSBhMDMgKiBhMTIpKTtcbiAgICBvdXRbM10gID0gLShhMDEgKiAoYTEyICogYTIzIC0gYTEzICogYTIyKSAtIGExMSAqIChhMDIgKiBhMjMgLSBhMDMgKiBhMjIpICsgYTIxICogKGEwMiAqIGExMyAtIGEwMyAqIGExMikpO1xuICAgIG91dFs0XSAgPSAtKGExMCAqIChhMjIgKiBhMzMgLSBhMjMgKiBhMzIpIC0gYTIwICogKGExMiAqIGEzMyAtIGExMyAqIGEzMikgKyBhMzAgKiAoYTEyICogYTIzIC0gYTEzICogYTIyKSk7XG4gICAgb3V0WzVdICA9ICAoYTAwICogKGEyMiAqIGEzMyAtIGEyMyAqIGEzMikgLSBhMjAgKiAoYTAyICogYTMzIC0gYTAzICogYTMyKSArIGEzMCAqIChhMDIgKiBhMjMgLSBhMDMgKiBhMjIpKTtcbiAgICBvdXRbNl0gID0gLShhMDAgKiAoYTEyICogYTMzIC0gYTEzICogYTMyKSAtIGExMCAqIChhMDIgKiBhMzMgLSBhMDMgKiBhMzIpICsgYTMwICogKGEwMiAqIGExMyAtIGEwMyAqIGExMikpO1xuICAgIG91dFs3XSAgPSAgKGEwMCAqIChhMTIgKiBhMjMgLSBhMTMgKiBhMjIpIC0gYTEwICogKGEwMiAqIGEyMyAtIGEwMyAqIGEyMikgKyBhMjAgKiAoYTAyICogYTEzIC0gYTAzICogYTEyKSk7XG4gICAgb3V0WzhdICA9ICAoYTEwICogKGEyMSAqIGEzMyAtIGEyMyAqIGEzMSkgLSBhMjAgKiAoYTExICogYTMzIC0gYTEzICogYTMxKSArIGEzMCAqIChhMTEgKiBhMjMgLSBhMTMgKiBhMjEpKTtcbiAgICBvdXRbOV0gID0gLShhMDAgKiAoYTIxICogYTMzIC0gYTIzICogYTMxKSAtIGEyMCAqIChhMDEgKiBhMzMgLSBhMDMgKiBhMzEpICsgYTMwICogKGEwMSAqIGEyMyAtIGEwMyAqIGEyMSkpO1xuICAgIG91dFsxMF0gPSAgKGEwMCAqIChhMTEgKiBhMzMgLSBhMTMgKiBhMzEpIC0gYTEwICogKGEwMSAqIGEzMyAtIGEwMyAqIGEzMSkgKyBhMzAgKiAoYTAxICogYTEzIC0gYTAzICogYTExKSk7XG4gICAgb3V0WzExXSA9IC0oYTAwICogKGExMSAqIGEyMyAtIGExMyAqIGEyMSkgLSBhMTAgKiAoYTAxICogYTIzIC0gYTAzICogYTIxKSArIGEyMCAqIChhMDEgKiBhMTMgLSBhMDMgKiBhMTEpKTtcbiAgICBvdXRbMTJdID0gLShhMTAgKiAoYTIxICogYTMyIC0gYTIyICogYTMxKSAtIGEyMCAqIChhMTEgKiBhMzIgLSBhMTIgKiBhMzEpICsgYTMwICogKGExMSAqIGEyMiAtIGExMiAqIGEyMSkpO1xuICAgIG91dFsxM10gPSAgKGEwMCAqIChhMjEgKiBhMzIgLSBhMjIgKiBhMzEpIC0gYTIwICogKGEwMSAqIGEzMiAtIGEwMiAqIGEzMSkgKyBhMzAgKiAoYTAxICogYTIyIC0gYTAyICogYTIxKSk7XG4gICAgb3V0WzE0XSA9IC0oYTAwICogKGExMSAqIGEzMiAtIGExMiAqIGEzMSkgLSBhMTAgKiAoYTAxICogYTMyIC0gYTAyICogYTMxKSArIGEzMCAqIChhMDEgKiBhMTIgLSBhMDIgKiBhMTEpKTtcbiAgICBvdXRbMTVdID0gIChhMDAgKiAoYTExICogYTIyIC0gYTEyICogYTIxKSAtIGExMCAqIChhMDEgKiBhMjIgLSBhMDIgKiBhMjEpICsgYTIwICogKGEwMSAqIGExMiAtIGEwMiAqIGExMSkpO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGRldGVybWluYW50IG9mIGEgbWF0NFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge051bWJlcn0gZGV0ZXJtaW5hbnQgb2YgYVxuICovXG5tYXQ0LmRldGVybWluYW50ID0gZnVuY3Rpb24gKGEpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTAzID0gYVszXSxcbiAgICAgICAgYTEwID0gYVs0XSwgYTExID0gYVs1XSwgYTEyID0gYVs2XSwgYTEzID0gYVs3XSxcbiAgICAgICAgYTIwID0gYVs4XSwgYTIxID0gYVs5XSwgYTIyID0gYVsxMF0sIGEyMyA9IGFbMTFdLFxuICAgICAgICBhMzAgPSBhWzEyXSwgYTMxID0gYVsxM10sIGEzMiA9IGFbMTRdLCBhMzMgPSBhWzE1XSxcblxuICAgICAgICBiMDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTAsXG4gICAgICAgIGIwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMCxcbiAgICAgICAgYjAyID0gYTAwICogYTEzIC0gYTAzICogYTEwLFxuICAgICAgICBiMDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTEsXG4gICAgICAgIGIwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMSxcbiAgICAgICAgYjA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyLFxuICAgICAgICBiMDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzAsXG4gICAgICAgIGIwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMCxcbiAgICAgICAgYjA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwLFxuICAgICAgICBiMDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzEsXG4gICAgICAgIGIxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMSxcbiAgICAgICAgYjExID0gYTIyICogYTMzIC0gYTIzICogYTMyO1xuXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudFxuICAgIHJldHVybiBiMDAgKiBiMTEgLSBiMDEgKiBiMTAgKyBiMDIgKiBiMDkgKyBiMDMgKiBiMDggLSBiMDQgKiBiMDcgKyBiMDUgKiBiMDY7XG59O1xuXG4vKipcbiAqIE11bHRpcGxpZXMgdHdvIG1hdDQnc1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7bWF0NH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5tdWx0aXBseSA9IGZ1bmN0aW9uIChvdXQsIGEsIGIpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTAzID0gYVszXSxcbiAgICAgICAgYTEwID0gYVs0XSwgYTExID0gYVs1XSwgYTEyID0gYVs2XSwgYTEzID0gYVs3XSxcbiAgICAgICAgYTIwID0gYVs4XSwgYTIxID0gYVs5XSwgYTIyID0gYVsxMF0sIGEyMyA9IGFbMTFdLFxuICAgICAgICBhMzAgPSBhWzEyXSwgYTMxID0gYVsxM10sIGEzMiA9IGFbMTRdLCBhMzMgPSBhWzE1XTtcblxuICAgIC8vIENhY2hlIG9ubHkgdGhlIGN1cnJlbnQgbGluZSBvZiB0aGUgc2Vjb25kIG1hdHJpeFxuICAgIHZhciBiMCAgPSBiWzBdLCBiMSA9IGJbMV0sIGIyID0gYlsyXSwgYjMgPSBiWzNdOyAgXG4gICAgb3V0WzBdID0gYjAqYTAwICsgYjEqYTEwICsgYjIqYTIwICsgYjMqYTMwO1xuICAgIG91dFsxXSA9IGIwKmEwMSArIGIxKmExMSArIGIyKmEyMSArIGIzKmEzMTtcbiAgICBvdXRbMl0gPSBiMCphMDIgKyBiMSphMTIgKyBiMiphMjIgKyBiMyphMzI7XG4gICAgb3V0WzNdID0gYjAqYTAzICsgYjEqYTEzICsgYjIqYTIzICsgYjMqYTMzO1xuXG4gICAgYjAgPSBiWzRdOyBiMSA9IGJbNV07IGIyID0gYls2XTsgYjMgPSBiWzddO1xuICAgIG91dFs0XSA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXRbNV0gPSBiMCphMDEgKyBiMSphMTEgKyBiMiphMjEgKyBiMyphMzE7XG4gICAgb3V0WzZdID0gYjAqYTAyICsgYjEqYTEyICsgYjIqYTIyICsgYjMqYTMyO1xuICAgIG91dFs3XSA9IGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcblxuICAgIGIwID0gYls4XTsgYjEgPSBiWzldOyBiMiA9IGJbMTBdOyBiMyA9IGJbMTFdO1xuICAgIG91dFs4XSA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXRbOV0gPSBiMCphMDEgKyBiMSphMTEgKyBiMiphMjEgKyBiMyphMzE7XG4gICAgb3V0WzEwXSA9IGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMjtcbiAgICBvdXRbMTFdID0gYjAqYTAzICsgYjEqYTEzICsgYjIqYTIzICsgYjMqYTMzO1xuXG4gICAgYjAgPSBiWzEyXTsgYjEgPSBiWzEzXTsgYjIgPSBiWzE0XTsgYjMgPSBiWzE1XTtcbiAgICBvdXRbMTJdID0gYjAqYTAwICsgYjEqYTEwICsgYjIqYTIwICsgYjMqYTMwO1xuICAgIG91dFsxM10gPSBiMCphMDEgKyBiMSphMTEgKyBiMiphMjEgKyBiMyphMzE7XG4gICAgb3V0WzE0XSA9IGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMjtcbiAgICBvdXRbMTVdID0gYjAqYTAzICsgYjEqYTEzICsgYjIqYTIzICsgYjMqYTMzO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgbWF0NC5tdWx0aXBseX1cbiAqIEBmdW5jdGlvblxuICovXG5tYXQ0Lm11bCA9IG1hdDQubXVsdGlwbHk7XG5cbi8qKlxuICogVHJhbnNsYXRlIGEgbWF0NCBieSB0aGUgZ2l2ZW4gdmVjdG9yXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgbWF0cml4IHRvIHRyYW5zbGF0ZVxuICogQHBhcmFtIHt2ZWMzfSB2IHZlY3RvciB0byB0cmFuc2xhdGUgYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC50cmFuc2xhdGUgPSBmdW5jdGlvbiAob3V0LCBhLCB2KSB7XG4gICAgdmFyIHggPSB2WzBdLCB5ID0gdlsxXSwgeiA9IHZbMl0sXG4gICAgICAgIGEwMCwgYTAxLCBhMDIsIGEwMyxcbiAgICAgICAgYTEwLCBhMTEsIGExMiwgYTEzLFxuICAgICAgICBhMjAsIGEyMSwgYTIyLCBhMjM7XG5cbiAgICBpZiAoYSA9PT0gb3V0KSB7XG4gICAgICAgIG91dFsxMl0gPSBhWzBdICogeCArIGFbNF0gKiB5ICsgYVs4XSAqIHogKyBhWzEyXTtcbiAgICAgICAgb3V0WzEzXSA9IGFbMV0gKiB4ICsgYVs1XSAqIHkgKyBhWzldICogeiArIGFbMTNdO1xuICAgICAgICBvdXRbMTRdID0gYVsyXSAqIHggKyBhWzZdICogeSArIGFbMTBdICogeiArIGFbMTRdO1xuICAgICAgICBvdXRbMTVdID0gYVszXSAqIHggKyBhWzddICogeSArIGFbMTFdICogeiArIGFbMTVdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGEwMCA9IGFbMF07IGEwMSA9IGFbMV07IGEwMiA9IGFbMl07IGEwMyA9IGFbM107XG4gICAgICAgIGExMCA9IGFbNF07IGExMSA9IGFbNV07IGExMiA9IGFbNl07IGExMyA9IGFbN107XG4gICAgICAgIGEyMCA9IGFbOF07IGEyMSA9IGFbOV07IGEyMiA9IGFbMTBdOyBhMjMgPSBhWzExXTtcblxuICAgICAgICBvdXRbMF0gPSBhMDA7IG91dFsxXSA9IGEwMTsgb3V0WzJdID0gYTAyOyBvdXRbM10gPSBhMDM7XG4gICAgICAgIG91dFs0XSA9IGExMDsgb3V0WzVdID0gYTExOyBvdXRbNl0gPSBhMTI7IG91dFs3XSA9IGExMztcbiAgICAgICAgb3V0WzhdID0gYTIwOyBvdXRbOV0gPSBhMjE7IG91dFsxMF0gPSBhMjI7IG91dFsxMV0gPSBhMjM7XG5cbiAgICAgICAgb3V0WzEyXSA9IGEwMCAqIHggKyBhMTAgKiB5ICsgYTIwICogeiArIGFbMTJdO1xuICAgICAgICBvdXRbMTNdID0gYTAxICogeCArIGExMSAqIHkgKyBhMjEgKiB6ICsgYVsxM107XG4gICAgICAgIG91dFsxNF0gPSBhMDIgKiB4ICsgYTEyICogeSArIGEyMiAqIHogKyBhWzE0XTtcbiAgICAgICAgb3V0WzE1XSA9IGEwMyAqIHggKyBhMTMgKiB5ICsgYTIzICogeiArIGFbMTVdO1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlcyB0aGUgbWF0NCBieSB0aGUgZGltZW5zaW9ucyBpbiB0aGUgZ2l2ZW4gdmVjM1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIG1hdHJpeCB0byBzY2FsZVxuICogQHBhcmFtIHt2ZWMzfSB2IHRoZSB2ZWMzIHRvIHNjYWxlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqKi9cbm1hdDQuc2NhbGUgPSBmdW5jdGlvbihvdXQsIGEsIHYpIHtcbiAgICB2YXIgeCA9IHZbMF0sIHkgPSB2WzFdLCB6ID0gdlsyXTtcblxuICAgIG91dFswXSA9IGFbMF0gKiB4O1xuICAgIG91dFsxXSA9IGFbMV0gKiB4O1xuICAgIG91dFsyXSA9IGFbMl0gKiB4O1xuICAgIG91dFszXSA9IGFbM10gKiB4O1xuICAgIG91dFs0XSA9IGFbNF0gKiB5O1xuICAgIG91dFs1XSA9IGFbNV0gKiB5O1xuICAgIG91dFs2XSA9IGFbNl0gKiB5O1xuICAgIG91dFs3XSA9IGFbN10gKiB5O1xuICAgIG91dFs4XSA9IGFbOF0gKiB6O1xuICAgIG91dFs5XSA9IGFbOV0gKiB6O1xuICAgIG91dFsxMF0gPSBhWzEwXSAqIHo7XG4gICAgb3V0WzExXSA9IGFbMTFdICogejtcbiAgICBvdXRbMTJdID0gYVsxMl07XG4gICAgb3V0WzEzXSA9IGFbMTNdO1xuICAgIG91dFsxNF0gPSBhWzE0XTtcbiAgICBvdXRbMTVdID0gYVsxNV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUm90YXRlcyBhIG1hdDQgYnkgdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgZ2l2ZW4gYXhpc1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcGFyYW0ge3ZlYzN9IGF4aXMgdGhlIGF4aXMgdG8gcm90YXRlIGFyb3VuZFxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LnJvdGF0ZSA9IGZ1bmN0aW9uIChvdXQsIGEsIHJhZCwgYXhpcykge1xuICAgIHZhciB4ID0gYXhpc1swXSwgeSA9IGF4aXNbMV0sIHogPSBheGlzWzJdLFxuICAgICAgICBsZW4gPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KSxcbiAgICAgICAgcywgYywgdCxcbiAgICAgICAgYTAwLCBhMDEsIGEwMiwgYTAzLFxuICAgICAgICBhMTAsIGExMSwgYTEyLCBhMTMsXG4gICAgICAgIGEyMCwgYTIxLCBhMjIsIGEyMyxcbiAgICAgICAgYjAwLCBiMDEsIGIwMixcbiAgICAgICAgYjEwLCBiMTEsIGIxMixcbiAgICAgICAgYjIwLCBiMjEsIGIyMjtcblxuICAgIGlmIChNYXRoLmFicyhsZW4pIDwgZ2xNYXRyaXguRVBTSUxPTikgeyByZXR1cm4gbnVsbDsgfVxuICAgIFxuICAgIGxlbiA9IDEgLyBsZW47XG4gICAgeCAqPSBsZW47XG4gICAgeSAqPSBsZW47XG4gICAgeiAqPSBsZW47XG5cbiAgICBzID0gTWF0aC5zaW4ocmFkKTtcbiAgICBjID0gTWF0aC5jb3MocmFkKTtcbiAgICB0ID0gMSAtIGM7XG5cbiAgICBhMDAgPSBhWzBdOyBhMDEgPSBhWzFdOyBhMDIgPSBhWzJdOyBhMDMgPSBhWzNdO1xuICAgIGExMCA9IGFbNF07IGExMSA9IGFbNV07IGExMiA9IGFbNl07IGExMyA9IGFbN107XG4gICAgYTIwID0gYVs4XTsgYTIxID0gYVs5XTsgYTIyID0gYVsxMF07IGEyMyA9IGFbMTFdO1xuXG4gICAgLy8gQ29uc3RydWN0IHRoZSBlbGVtZW50cyBvZiB0aGUgcm90YXRpb24gbWF0cml4XG4gICAgYjAwID0geCAqIHggKiB0ICsgYzsgYjAxID0geSAqIHggKiB0ICsgeiAqIHM7IGIwMiA9IHogKiB4ICogdCAtIHkgKiBzO1xuICAgIGIxMCA9IHggKiB5ICogdCAtIHogKiBzOyBiMTEgPSB5ICogeSAqIHQgKyBjOyBiMTIgPSB6ICogeSAqIHQgKyB4ICogcztcbiAgICBiMjAgPSB4ICogeiAqIHQgKyB5ICogczsgYjIxID0geSAqIHogKiB0IC0geCAqIHM7IGIyMiA9IHogKiB6ICogdCArIGM7XG5cbiAgICAvLyBQZXJmb3JtIHJvdGF0aW9uLXNwZWNpZmljIG1hdHJpeCBtdWx0aXBsaWNhdGlvblxuICAgIG91dFswXSA9IGEwMCAqIGIwMCArIGExMCAqIGIwMSArIGEyMCAqIGIwMjtcbiAgICBvdXRbMV0gPSBhMDEgKiBiMDAgKyBhMTEgKiBiMDEgKyBhMjEgKiBiMDI7XG4gICAgb3V0WzJdID0gYTAyICogYjAwICsgYTEyICogYjAxICsgYTIyICogYjAyO1xuICAgIG91dFszXSA9IGEwMyAqIGIwMCArIGExMyAqIGIwMSArIGEyMyAqIGIwMjtcbiAgICBvdXRbNF0gPSBhMDAgKiBiMTAgKyBhMTAgKiBiMTEgKyBhMjAgKiBiMTI7XG4gICAgb3V0WzVdID0gYTAxICogYjEwICsgYTExICogYjExICsgYTIxICogYjEyO1xuICAgIG91dFs2XSA9IGEwMiAqIGIxMCArIGExMiAqIGIxMSArIGEyMiAqIGIxMjtcbiAgICBvdXRbN10gPSBhMDMgKiBiMTAgKyBhMTMgKiBiMTEgKyBhMjMgKiBiMTI7XG4gICAgb3V0WzhdID0gYTAwICogYjIwICsgYTEwICogYjIxICsgYTIwICogYjIyO1xuICAgIG91dFs5XSA9IGEwMSAqIGIyMCArIGExMSAqIGIyMSArIGEyMSAqIGIyMjtcbiAgICBvdXRbMTBdID0gYTAyICogYjIwICsgYTEyICogYjIxICsgYTIyICogYjIyO1xuICAgIG91dFsxMV0gPSBhMDMgKiBiMjAgKyBhMTMgKiBiMjEgKyBhMjMgKiBiMjI7XG5cbiAgICBpZiAoYSAhPT0gb3V0KSB7IC8vIElmIHRoZSBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uIGRpZmZlciwgY29weSB0aGUgdW5jaGFuZ2VkIGxhc3Qgcm93XG4gICAgICAgIG91dFsxMl0gPSBhWzEyXTtcbiAgICAgICAgb3V0WzEzXSA9IGFbMTNdO1xuICAgICAgICBvdXRbMTRdID0gYVsxNF07XG4gICAgICAgIG91dFsxNV0gPSBhWzE1XTtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUm90YXRlcyBhIG1hdHJpeCBieSB0aGUgZ2l2ZW4gYW5nbGUgYXJvdW5kIHRoZSBYIGF4aXNcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LnJvdGF0ZVggPSBmdW5jdGlvbiAob3V0LCBhLCByYWQpIHtcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCksXG4gICAgICAgIGMgPSBNYXRoLmNvcyhyYWQpLFxuICAgICAgICBhMTAgPSBhWzRdLFxuICAgICAgICBhMTEgPSBhWzVdLFxuICAgICAgICBhMTIgPSBhWzZdLFxuICAgICAgICBhMTMgPSBhWzddLFxuICAgICAgICBhMjAgPSBhWzhdLFxuICAgICAgICBhMjEgPSBhWzldLFxuICAgICAgICBhMjIgPSBhWzEwXSxcbiAgICAgICAgYTIzID0gYVsxMV07XG5cbiAgICBpZiAoYSAhPT0gb3V0KSB7IC8vIElmIHRoZSBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uIGRpZmZlciwgY29weSB0aGUgdW5jaGFuZ2VkIHJvd3NcbiAgICAgICAgb3V0WzBdICA9IGFbMF07XG4gICAgICAgIG91dFsxXSAgPSBhWzFdO1xuICAgICAgICBvdXRbMl0gID0gYVsyXTtcbiAgICAgICAgb3V0WzNdICA9IGFbM107XG4gICAgICAgIG91dFsxMl0gPSBhWzEyXTtcbiAgICAgICAgb3V0WzEzXSA9IGFbMTNdO1xuICAgICAgICBvdXRbMTRdID0gYVsxNF07XG4gICAgICAgIG91dFsxNV0gPSBhWzE1XTtcbiAgICB9XG5cbiAgICAvLyBQZXJmb3JtIGF4aXMtc3BlY2lmaWMgbWF0cml4IG11bHRpcGxpY2F0aW9uXG4gICAgb3V0WzRdID0gYTEwICogYyArIGEyMCAqIHM7XG4gICAgb3V0WzVdID0gYTExICogYyArIGEyMSAqIHM7XG4gICAgb3V0WzZdID0gYTEyICogYyArIGEyMiAqIHM7XG4gICAgb3V0WzddID0gYTEzICogYyArIGEyMyAqIHM7XG4gICAgb3V0WzhdID0gYTIwICogYyAtIGExMCAqIHM7XG4gICAgb3V0WzldID0gYTIxICogYyAtIGExMSAqIHM7XG4gICAgb3V0WzEwXSA9IGEyMiAqIGMgLSBhMTIgKiBzO1xuICAgIG91dFsxMV0gPSBhMjMgKiBjIC0gYTEzICogcztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSb3RhdGVzIGEgbWF0cml4IGJ5IHRoZSBnaXZlbiBhbmdsZSBhcm91bmQgdGhlIFkgYXhpc1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQucm90YXRlWSA9IGZ1bmN0aW9uIChvdXQsIGEsIHJhZCkge1xuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKSxcbiAgICAgICAgYyA9IE1hdGguY29zKHJhZCksXG4gICAgICAgIGEwMCA9IGFbMF0sXG4gICAgICAgIGEwMSA9IGFbMV0sXG4gICAgICAgIGEwMiA9IGFbMl0sXG4gICAgICAgIGEwMyA9IGFbM10sXG4gICAgICAgIGEyMCA9IGFbOF0sXG4gICAgICAgIGEyMSA9IGFbOV0sXG4gICAgICAgIGEyMiA9IGFbMTBdLFxuICAgICAgICBhMjMgPSBhWzExXTtcblxuICAgIGlmIChhICE9PSBvdXQpIHsgLy8gSWYgdGhlIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gZGlmZmVyLCBjb3B5IHRoZSB1bmNoYW5nZWQgcm93c1xuICAgICAgICBvdXRbNF0gID0gYVs0XTtcbiAgICAgICAgb3V0WzVdICA9IGFbNV07XG4gICAgICAgIG91dFs2XSAgPSBhWzZdO1xuICAgICAgICBvdXRbN10gID0gYVs3XTtcbiAgICAgICAgb3V0WzEyXSA9IGFbMTJdO1xuICAgICAgICBvdXRbMTNdID0gYVsxM107XG4gICAgICAgIG91dFsxNF0gPSBhWzE0XTtcbiAgICAgICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIH1cblxuICAgIC8vIFBlcmZvcm0gYXhpcy1zcGVjaWZpYyBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICBvdXRbMF0gPSBhMDAgKiBjIC0gYTIwICogcztcbiAgICBvdXRbMV0gPSBhMDEgKiBjIC0gYTIxICogcztcbiAgICBvdXRbMl0gPSBhMDIgKiBjIC0gYTIyICogcztcbiAgICBvdXRbM10gPSBhMDMgKiBjIC0gYTIzICogcztcbiAgICBvdXRbOF0gPSBhMDAgKiBzICsgYTIwICogYztcbiAgICBvdXRbOV0gPSBhMDEgKiBzICsgYTIxICogYztcbiAgICBvdXRbMTBdID0gYTAyICogcyArIGEyMiAqIGM7XG4gICAgb3V0WzExXSA9IGEwMyAqIHMgKyBhMjMgKiBjO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBtYXRyaXggYnkgdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgWiBheGlzXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5yb3RhdGVaID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkKSB7XG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpLFxuICAgICAgICBjID0gTWF0aC5jb3MocmFkKSxcbiAgICAgICAgYTAwID0gYVswXSxcbiAgICAgICAgYTAxID0gYVsxXSxcbiAgICAgICAgYTAyID0gYVsyXSxcbiAgICAgICAgYTAzID0gYVszXSxcbiAgICAgICAgYTEwID0gYVs0XSxcbiAgICAgICAgYTExID0gYVs1XSxcbiAgICAgICAgYTEyID0gYVs2XSxcbiAgICAgICAgYTEzID0gYVs3XTtcblxuICAgIGlmIChhICE9PSBvdXQpIHsgLy8gSWYgdGhlIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gZGlmZmVyLCBjb3B5IHRoZSB1bmNoYW5nZWQgbGFzdCByb3dcbiAgICAgICAgb3V0WzhdICA9IGFbOF07XG4gICAgICAgIG91dFs5XSAgPSBhWzldO1xuICAgICAgICBvdXRbMTBdID0gYVsxMF07XG4gICAgICAgIG91dFsxMV0gPSBhWzExXTtcbiAgICAgICAgb3V0WzEyXSA9IGFbMTJdO1xuICAgICAgICBvdXRbMTNdID0gYVsxM107XG4gICAgICAgIG91dFsxNF0gPSBhWzE0XTtcbiAgICAgICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIH1cblxuICAgIC8vIFBlcmZvcm0gYXhpcy1zcGVjaWZpYyBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICBvdXRbMF0gPSBhMDAgKiBjICsgYTEwICogcztcbiAgICBvdXRbMV0gPSBhMDEgKiBjICsgYTExICogcztcbiAgICBvdXRbMl0gPSBhMDIgKiBjICsgYTEyICogcztcbiAgICBvdXRbM10gPSBhMDMgKiBjICsgYTEzICogcztcbiAgICBvdXRbNF0gPSBhMTAgKiBjIC0gYTAwICogcztcbiAgICBvdXRbNV0gPSBhMTEgKiBjIC0gYTAxICogcztcbiAgICBvdXRbNl0gPSBhMTIgKiBjIC0gYTAyICogcztcbiAgICBvdXRbN10gPSBhMTMgKiBjIC0gYTAzICogcztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSB2ZWN0b3IgdHJhbnNsYXRpb25cbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQ0LmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDQudHJhbnNsYXRlKGRlc3QsIGRlc3QsIHZlYyk7XG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHt2ZWMzfSB2IFRyYW5zbGF0aW9uIHZlY3RvclxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmZyb21UcmFuc2xhdGlvbiA9IGZ1bmN0aW9uKG91dCwgdikge1xuICAgIG91dFswXSA9IDE7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSAxO1xuICAgIG91dFs2XSA9IDA7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSAwO1xuICAgIG91dFs5XSA9IDA7XG4gICAgb3V0WzEwXSA9IDE7XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IHZbMF07XG4gICAgb3V0WzEzXSA9IHZbMV07XG4gICAgb3V0WzE0XSA9IHZbMl07XG4gICAgb3V0WzE1XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSB2ZWN0b3Igc2NhbGluZ1xuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0NC5zY2FsZShkZXN0LCBkZXN0LCB2ZWMpO1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7dmVjM30gdiBTY2FsaW5nIHZlY3RvclxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmZyb21TY2FsaW5nID0gZnVuY3Rpb24ob3V0LCB2KSB7XG4gICAgb3V0WzBdID0gdlswXTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IHZbMV07XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDA7XG4gICAgb3V0WzldID0gMDtcbiAgICBvdXRbMTBdID0gdlsyXTtcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gMDtcbiAgICBvdXRbMTNdID0gMDtcbiAgICBvdXRbMTRdID0gMDtcbiAgICBvdXRbMTVdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIGdpdmVuIGFuZ2xlIGFyb3VuZCBhIGdpdmVuIGF4aXNcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQ0LmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDQucm90YXRlKGRlc3QsIGRlc3QsIHJhZCwgYXhpcyk7XG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEBwYXJhbSB7dmVjM30gYXhpcyB0aGUgYXhpcyB0byByb3RhdGUgYXJvdW5kXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuZnJvbVJvdGF0aW9uID0gZnVuY3Rpb24ob3V0LCByYWQsIGF4aXMpIHtcbiAgICB2YXIgeCA9IGF4aXNbMF0sIHkgPSBheGlzWzFdLCB6ID0gYXhpc1syXSxcbiAgICAgICAgbGVuID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeiksXG4gICAgICAgIHMsIGMsIHQ7XG4gICAgXG4gICAgaWYgKE1hdGguYWJzKGxlbikgPCBnbE1hdHJpeC5FUFNJTE9OKSB7IHJldHVybiBudWxsOyB9XG4gICAgXG4gICAgbGVuID0gMSAvIGxlbjtcbiAgICB4ICo9IGxlbjtcbiAgICB5ICo9IGxlbjtcbiAgICB6ICo9IGxlbjtcbiAgICBcbiAgICBzID0gTWF0aC5zaW4ocmFkKTtcbiAgICBjID0gTWF0aC5jb3MocmFkKTtcbiAgICB0ID0gMSAtIGM7XG4gICAgXG4gICAgLy8gUGVyZm9ybSByb3RhdGlvbi1zcGVjaWZpYyBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICBvdXRbMF0gPSB4ICogeCAqIHQgKyBjO1xuICAgIG91dFsxXSA9IHkgKiB4ICogdCArIHogKiBzO1xuICAgIG91dFsyXSA9IHogKiB4ICogdCAtIHkgKiBzO1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0geCAqIHkgKiB0IC0geiAqIHM7XG4gICAgb3V0WzVdID0geSAqIHkgKiB0ICsgYztcbiAgICBvdXRbNl0gPSB6ICogeSAqIHQgKyB4ICogcztcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IHggKiB6ICogdCArIHkgKiBzO1xuICAgIG91dFs5XSA9IHkgKiB6ICogdCAtIHggKiBzO1xuICAgIG91dFsxMF0gPSB6ICogeiAqIHQgKyBjO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAwO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIHRoZSBnaXZlbiBhbmdsZSBhcm91bmQgdGhlIFggYXhpc1xuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0NC5yb3RhdGVYKGRlc3QsIGRlc3QsIHJhZCk7XG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5mcm9tWFJvdGF0aW9uID0gZnVuY3Rpb24ob3V0LCByYWQpIHtcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCksXG4gICAgICAgIGMgPSBNYXRoLmNvcyhyYWQpO1xuICAgIFxuICAgIC8vIFBlcmZvcm0gYXhpcy1zcGVjaWZpYyBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICBvdXRbMF0gID0gMTtcbiAgICBvdXRbMV0gID0gMDtcbiAgICBvdXRbMl0gID0gMDtcbiAgICBvdXRbM10gID0gMDtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IGM7XG4gICAgb3V0WzZdID0gcztcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDA7XG4gICAgb3V0WzldID0gLXM7XG4gICAgb3V0WzEwXSA9IGM7XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IDA7XG4gICAgb3V0WzEzXSA9IDA7XG4gICAgb3V0WzE0XSA9IDA7XG4gICAgb3V0WzE1XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgWSBheGlzXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0NC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQ0LnJvdGF0ZVkoZGVzdCwgZGVzdCwgcmFkKTtcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmZyb21ZUm90YXRpb24gPSBmdW5jdGlvbihvdXQsIHJhZCkge1xuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKSxcbiAgICAgICAgYyA9IE1hdGguY29zKHJhZCk7XG4gICAgXG4gICAgLy8gUGVyZm9ybSBheGlzLXNwZWNpZmljIG1hdHJpeCBtdWx0aXBsaWNhdGlvblxuICAgIG91dFswXSAgPSBjO1xuICAgIG91dFsxXSAgPSAwO1xuICAgIG91dFsyXSAgPSAtcztcbiAgICBvdXRbM10gID0gMDtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IDE7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IHM7XG4gICAgb3V0WzldID0gMDtcbiAgICBvdXRbMTBdID0gYztcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gMDtcbiAgICBvdXRbMTNdID0gMDtcbiAgICBvdXRbMTRdID0gMDtcbiAgICBvdXRbMTVdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSB0aGUgZ2l2ZW4gYW5nbGUgYXJvdW5kIHRoZSBaIGF4aXNcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQ0LmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDQucm90YXRlWihkZXN0LCBkZXN0LCByYWQpO1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuZnJvbVpSb3RhdGlvbiA9IGZ1bmN0aW9uKG91dCwgcmFkKSB7XG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpLFxuICAgICAgICBjID0gTWF0aC5jb3MocmFkKTtcbiAgICBcbiAgICAvLyBQZXJmb3JtIGF4aXMtc3BlY2lmaWMgbWF0cml4IG11bHRpcGxpY2F0aW9uXG4gICAgb3V0WzBdICA9IGM7XG4gICAgb3V0WzFdICA9IHM7XG4gICAgb3V0WzJdICA9IDA7XG4gICAgb3V0WzNdICA9IDA7XG4gICAgb3V0WzRdID0gLXM7XG4gICAgb3V0WzVdID0gYztcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMDtcbiAgICBvdXRbOV0gPSAwO1xuICAgIG91dFsxMF0gPSAxO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAwO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgcXVhdGVybmlvbiByb3RhdGlvbiBhbmQgdmVjdG9yIHRyYW5zbGF0aW9uXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0NC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQ0LnRyYW5zbGF0ZShkZXN0LCB2ZWMpO1xuICogICAgIHZhciBxdWF0TWF0ID0gbWF0NC5jcmVhdGUoKTtcbiAqICAgICBxdWF0NC50b01hdDQocXVhdCwgcXVhdE1hdCk7XG4gKiAgICAgbWF0NC5tdWx0aXBseShkZXN0LCBxdWF0TWF0KTtcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3F1YXQ0fSBxIFJvdGF0aW9uIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7dmVjM30gdiBUcmFuc2xhdGlvbiB2ZWN0b3JcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5mcm9tUm90YXRpb25UcmFuc2xhdGlvbiA9IGZ1bmN0aW9uIChvdXQsIHEsIHYpIHtcbiAgICAvLyBRdWF0ZXJuaW9uIG1hdGhcbiAgICB2YXIgeCA9IHFbMF0sIHkgPSBxWzFdLCB6ID0gcVsyXSwgdyA9IHFbM10sXG4gICAgICAgIHgyID0geCArIHgsXG4gICAgICAgIHkyID0geSArIHksXG4gICAgICAgIHoyID0geiArIHosXG5cbiAgICAgICAgeHggPSB4ICogeDIsXG4gICAgICAgIHh5ID0geCAqIHkyLFxuICAgICAgICB4eiA9IHggKiB6MixcbiAgICAgICAgeXkgPSB5ICogeTIsXG4gICAgICAgIHl6ID0geSAqIHoyLFxuICAgICAgICB6eiA9IHogKiB6MixcbiAgICAgICAgd3ggPSB3ICogeDIsXG4gICAgICAgIHd5ID0gdyAqIHkyLFxuICAgICAgICB3eiA9IHcgKiB6MjtcblxuICAgIG91dFswXSA9IDEgLSAoeXkgKyB6eik7XG4gICAgb3V0WzFdID0geHkgKyB3ejtcbiAgICBvdXRbMl0gPSB4eiAtIHd5O1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0geHkgLSB3ejtcbiAgICBvdXRbNV0gPSAxIC0gKHh4ICsgenopO1xuICAgIG91dFs2XSA9IHl6ICsgd3g7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSB4eiArIHd5O1xuICAgIG91dFs5XSA9IHl6IC0gd3g7XG4gICAgb3V0WzEwXSA9IDEgLSAoeHggKyB5eSk7XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IHZbMF07XG4gICAgb3V0WzEzXSA9IHZbMV07XG4gICAgb3V0WzE0XSA9IHZbMl07XG4gICAgb3V0WzE1XSA9IDE7XG4gICAgXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgcXVhdGVybmlvbiByb3RhdGlvbiwgdmVjdG9yIHRyYW5zbGF0aW9uIGFuZCB2ZWN0b3Igc2NhbGVcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQ0LmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDQudHJhbnNsYXRlKGRlc3QsIHZlYyk7XG4gKiAgICAgdmFyIHF1YXRNYXQgPSBtYXQ0LmNyZWF0ZSgpO1xuICogICAgIHF1YXQ0LnRvTWF0NChxdWF0LCBxdWF0TWF0KTtcbiAqICAgICBtYXQ0Lm11bHRpcGx5KGRlc3QsIHF1YXRNYXQpO1xuICogICAgIG1hdDQuc2NhbGUoZGVzdCwgc2NhbGUpXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtxdWF0NH0gcSBSb3RhdGlvbiBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3ZlYzN9IHYgVHJhbnNsYXRpb24gdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IHMgU2NhbGluZyB2ZWN0b3JcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5mcm9tUm90YXRpb25UcmFuc2xhdGlvblNjYWxlID0gZnVuY3Rpb24gKG91dCwgcSwgdiwgcykge1xuICAgIC8vIFF1YXRlcm5pb24gbWF0aFxuICAgIHZhciB4ID0gcVswXSwgeSA9IHFbMV0sIHogPSBxWzJdLCB3ID0gcVszXSxcbiAgICAgICAgeDIgPSB4ICsgeCxcbiAgICAgICAgeTIgPSB5ICsgeSxcbiAgICAgICAgejIgPSB6ICsgeixcblxuICAgICAgICB4eCA9IHggKiB4MixcbiAgICAgICAgeHkgPSB4ICogeTIsXG4gICAgICAgIHh6ID0geCAqIHoyLFxuICAgICAgICB5eSA9IHkgKiB5MixcbiAgICAgICAgeXogPSB5ICogejIsXG4gICAgICAgIHp6ID0geiAqIHoyLFxuICAgICAgICB3eCA9IHcgKiB4MixcbiAgICAgICAgd3kgPSB3ICogeTIsXG4gICAgICAgIHd6ID0gdyAqIHoyLFxuICAgICAgICBzeCA9IHNbMF0sXG4gICAgICAgIHN5ID0gc1sxXSxcbiAgICAgICAgc3ogPSBzWzJdO1xuXG4gICAgb3V0WzBdID0gKDEgLSAoeXkgKyB6eikpICogc3g7XG4gICAgb3V0WzFdID0gKHh5ICsgd3opICogc3g7XG4gICAgb3V0WzJdID0gKHh6IC0gd3kpICogc3g7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAoeHkgLSB3eikgKiBzeTtcbiAgICBvdXRbNV0gPSAoMSAtICh4eCArIHp6KSkgKiBzeTtcbiAgICBvdXRbNl0gPSAoeXogKyB3eCkgKiBzeTtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9ICh4eiArIHd5KSAqIHN6O1xuICAgIG91dFs5XSA9ICh5eiAtIHd4KSAqIHN6O1xuICAgIG91dFsxMF0gPSAoMSAtICh4eCArIHl5KSkgKiBzejtcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gdlswXTtcbiAgICBvdXRbMTNdID0gdlsxXTtcbiAgICBvdXRbMTRdID0gdlsyXTtcbiAgICBvdXRbMTVdID0gMTtcbiAgICBcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSBxdWF0ZXJuaW9uIHJvdGF0aW9uLCB2ZWN0b3IgdHJhbnNsYXRpb24gYW5kIHZlY3RvciBzY2FsZSwgcm90YXRpbmcgYW5kIHNjYWxpbmcgYXJvdW5kIHRoZSBnaXZlbiBvcmlnaW5cbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQ0LmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDQudHJhbnNsYXRlKGRlc3QsIHZlYyk7XG4gKiAgICAgbWF0NC50cmFuc2xhdGUoZGVzdCwgb3JpZ2luKTtcbiAqICAgICB2YXIgcXVhdE1hdCA9IG1hdDQuY3JlYXRlKCk7XG4gKiAgICAgcXVhdDQudG9NYXQ0KHF1YXQsIHF1YXRNYXQpO1xuICogICAgIG1hdDQubXVsdGlwbHkoZGVzdCwgcXVhdE1hdCk7XG4gKiAgICAgbWF0NC5zY2FsZShkZXN0LCBzY2FsZSlcbiAqICAgICBtYXQ0LnRyYW5zbGF0ZShkZXN0LCBuZWdhdGl2ZU9yaWdpbik7XG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtxdWF0NH0gcSBSb3RhdGlvbiBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3ZlYzN9IHYgVHJhbnNsYXRpb24gdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IHMgU2NhbGluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gbyBUaGUgb3JpZ2luIHZlY3RvciBhcm91bmQgd2hpY2ggdG8gc2NhbGUgYW5kIHJvdGF0ZVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmZyb21Sb3RhdGlvblRyYW5zbGF0aW9uU2NhbGVPcmlnaW4gPSBmdW5jdGlvbiAob3V0LCBxLCB2LCBzLCBvKSB7XG4gIC8vIFF1YXRlcm5pb24gbWF0aFxuICB2YXIgeCA9IHFbMF0sIHkgPSBxWzFdLCB6ID0gcVsyXSwgdyA9IHFbM10sXG4gICAgICB4MiA9IHggKyB4LFxuICAgICAgeTIgPSB5ICsgeSxcbiAgICAgIHoyID0geiArIHosXG5cbiAgICAgIHh4ID0geCAqIHgyLFxuICAgICAgeHkgPSB4ICogeTIsXG4gICAgICB4eiA9IHggKiB6MixcbiAgICAgIHl5ID0geSAqIHkyLFxuICAgICAgeXogPSB5ICogejIsXG4gICAgICB6eiA9IHogKiB6MixcbiAgICAgIHd4ID0gdyAqIHgyLFxuICAgICAgd3kgPSB3ICogeTIsXG4gICAgICB3eiA9IHcgKiB6MixcbiAgICAgIFxuICAgICAgc3ggPSBzWzBdLFxuICAgICAgc3kgPSBzWzFdLFxuICAgICAgc3ogPSBzWzJdLFxuXG4gICAgICBveCA9IG9bMF0sXG4gICAgICBveSA9IG9bMV0sXG4gICAgICBveiA9IG9bMl07XG4gICAgICBcbiAgb3V0WzBdID0gKDEgLSAoeXkgKyB6eikpICogc3g7XG4gIG91dFsxXSA9ICh4eSArIHd6KSAqIHN4O1xuICBvdXRbMl0gPSAoeHogLSB3eSkgKiBzeDtcbiAgb3V0WzNdID0gMDtcbiAgb3V0WzRdID0gKHh5IC0gd3opICogc3k7XG4gIG91dFs1XSA9ICgxIC0gKHh4ICsgenopKSAqIHN5O1xuICBvdXRbNl0gPSAoeXogKyB3eCkgKiBzeTtcbiAgb3V0WzddID0gMDtcbiAgb3V0WzhdID0gKHh6ICsgd3kpICogc3o7XG4gIG91dFs5XSA9ICh5eiAtIHd4KSAqIHN6O1xuICBvdXRbMTBdID0gKDEgLSAoeHggKyB5eSkpICogc3o7XG4gIG91dFsxMV0gPSAwO1xuICBvdXRbMTJdID0gdlswXSArIG94IC0gKG91dFswXSAqIG94ICsgb3V0WzRdICogb3kgKyBvdXRbOF0gKiBveik7XG4gIG91dFsxM10gPSB2WzFdICsgb3kgLSAob3V0WzFdICogb3ggKyBvdXRbNV0gKiBveSArIG91dFs5XSAqIG96KTtcbiAgb3V0WzE0XSA9IHZbMl0gKyBveiAtIChvdXRbMl0gKiBveCArIG91dFs2XSAqIG95ICsgb3V0WzEwXSAqIG96KTtcbiAgb3V0WzE1XSA9IDE7XG4gICAgICAgIFxuICByZXR1cm4gb3V0O1xufTtcblxubWF0NC5mcm9tUXVhdCA9IGZ1bmN0aW9uIChvdXQsIHEpIHtcbiAgICB2YXIgeCA9IHFbMF0sIHkgPSBxWzFdLCB6ID0gcVsyXSwgdyA9IHFbM10sXG4gICAgICAgIHgyID0geCArIHgsXG4gICAgICAgIHkyID0geSArIHksXG4gICAgICAgIHoyID0geiArIHosXG5cbiAgICAgICAgeHggPSB4ICogeDIsXG4gICAgICAgIHl4ID0geSAqIHgyLFxuICAgICAgICB5eSA9IHkgKiB5MixcbiAgICAgICAgenggPSB6ICogeDIsXG4gICAgICAgIHp5ID0geiAqIHkyLFxuICAgICAgICB6eiA9IHogKiB6MixcbiAgICAgICAgd3ggPSB3ICogeDIsXG4gICAgICAgIHd5ID0gdyAqIHkyLFxuICAgICAgICB3eiA9IHcgKiB6MjtcblxuICAgIG91dFswXSA9IDEgLSB5eSAtIHp6O1xuICAgIG91dFsxXSA9IHl4ICsgd3o7XG4gICAgb3V0WzJdID0genggLSB3eTtcbiAgICBvdXRbM10gPSAwO1xuXG4gICAgb3V0WzRdID0geXggLSB3ejtcbiAgICBvdXRbNV0gPSAxIC0geHggLSB6ejtcbiAgICBvdXRbNl0gPSB6eSArIHd4O1xuICAgIG91dFs3XSA9IDA7XG5cbiAgICBvdXRbOF0gPSB6eCArIHd5O1xuICAgIG91dFs5XSA9IHp5IC0gd3g7XG4gICAgb3V0WzEwXSA9IDEgLSB4eCAtIHl5O1xuICAgIG91dFsxMV0gPSAwO1xuXG4gICAgb3V0WzEyXSA9IDA7XG4gICAgb3V0WzEzXSA9IDA7XG4gICAgb3V0WzE0XSA9IDA7XG4gICAgb3V0WzE1XSA9IDE7XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSBmcnVzdHVtIG1hdHJpeCB3aXRoIHRoZSBnaXZlbiBib3VuZHNcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IGZydXN0dW0gbWF0cml4IHdpbGwgYmUgd3JpdHRlbiBpbnRvXG4gKiBAcGFyYW0ge051bWJlcn0gbGVmdCBMZWZ0IGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge051bWJlcn0gcmlnaHQgUmlnaHQgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7TnVtYmVyfSBib3R0b20gQm90dG9tIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge051bWJlcn0gdG9wIFRvcCBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtOdW1iZXJ9IG5lYXIgTmVhciBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtOdW1iZXJ9IGZhciBGYXIgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5mcnVzdHVtID0gZnVuY3Rpb24gKG91dCwgbGVmdCwgcmlnaHQsIGJvdHRvbSwgdG9wLCBuZWFyLCBmYXIpIHtcbiAgICB2YXIgcmwgPSAxIC8gKHJpZ2h0IC0gbGVmdCksXG4gICAgICAgIHRiID0gMSAvICh0b3AgLSBib3R0b20pLFxuICAgICAgICBuZiA9IDEgLyAobmVhciAtIGZhcik7XG4gICAgb3V0WzBdID0gKG5lYXIgKiAyKSAqIHJsO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gKG5lYXIgKiAyKSAqIHRiO1xuICAgIG91dFs2XSA9IDA7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSAocmlnaHQgKyBsZWZ0KSAqIHJsO1xuICAgIG91dFs5XSA9ICh0b3AgKyBib3R0b20pICogdGI7XG4gICAgb3V0WzEwXSA9IChmYXIgKyBuZWFyKSAqIG5mO1xuICAgIG91dFsxMV0gPSAtMTtcbiAgICBvdXRbMTJdID0gMDtcbiAgICBvdXRbMTNdID0gMDtcbiAgICBvdXRbMTRdID0gKGZhciAqIG5lYXIgKiAyKSAqIG5mO1xuICAgIG91dFsxNV0gPSAwO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHBlcnNwZWN0aXZlIHByb2plY3Rpb24gbWF0cml4IHdpdGggdGhlIGdpdmVuIGJvdW5kc1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgZnJ1c3R1bSBtYXRyaXggd2lsbCBiZSB3cml0dGVuIGludG9cbiAqIEBwYXJhbSB7bnVtYmVyfSBmb3Z5IFZlcnRpY2FsIGZpZWxkIG9mIHZpZXcgaW4gcmFkaWFuc1xuICogQHBhcmFtIHtudW1iZXJ9IGFzcGVjdCBBc3BlY3QgcmF0aW8uIHR5cGljYWxseSB2aWV3cG9ydCB3aWR0aC9oZWlnaHRcbiAqIEBwYXJhbSB7bnVtYmVyfSBuZWFyIE5lYXIgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7bnVtYmVyfSBmYXIgRmFyIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQucGVyc3BlY3RpdmUgPSBmdW5jdGlvbiAob3V0LCBmb3Z5LCBhc3BlY3QsIG5lYXIsIGZhcikge1xuICAgIHZhciBmID0gMS4wIC8gTWF0aC50YW4oZm92eSAvIDIpLFxuICAgICAgICBuZiA9IDEgLyAobmVhciAtIGZhcik7XG4gICAgb3V0WzBdID0gZiAvIGFzcGVjdDtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IGY7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDA7XG4gICAgb3V0WzldID0gMDtcbiAgICBvdXRbMTBdID0gKGZhciArIG5lYXIpICogbmY7XG4gICAgb3V0WzExXSA9IC0xO1xuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAoMiAqIGZhciAqIG5lYXIpICogbmY7XG4gICAgb3V0WzE1XSA9IDA7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgcGVyc3BlY3RpdmUgcHJvamVjdGlvbiBtYXRyaXggd2l0aCB0aGUgZ2l2ZW4gZmllbGQgb2Ygdmlldy5cbiAqIFRoaXMgaXMgcHJpbWFyaWx5IHVzZWZ1bCBmb3IgZ2VuZXJhdGluZyBwcm9qZWN0aW9uIG1hdHJpY2VzIHRvIGJlIHVzZWRcbiAqIHdpdGggdGhlIHN0aWxsIGV4cGVyaWVtZW50YWwgV2ViVlIgQVBJLlxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgZnJ1c3R1bSBtYXRyaXggd2lsbCBiZSB3cml0dGVuIGludG9cbiAqIEBwYXJhbSB7bnVtYmVyfSBmb3YgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGZvbGxvd2luZyB2YWx1ZXM6IHVwRGVncmVlcywgZG93bkRlZ3JlZXMsIGxlZnREZWdyZWVzLCByaWdodERlZ3JlZXNcbiAqIEBwYXJhbSB7bnVtYmVyfSBuZWFyIE5lYXIgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7bnVtYmVyfSBmYXIgRmFyIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQucGVyc3BlY3RpdmVGcm9tRmllbGRPZlZpZXcgPSBmdW5jdGlvbiAob3V0LCBmb3YsIG5lYXIsIGZhcikge1xuICAgIHZhciB1cFRhbiA9IE1hdGgudGFuKGZvdi51cERlZ3JlZXMgKiBNYXRoLlBJLzE4MC4wKSxcbiAgICAgICAgZG93blRhbiA9IE1hdGgudGFuKGZvdi5kb3duRGVncmVlcyAqIE1hdGguUEkvMTgwLjApLFxuICAgICAgICBsZWZ0VGFuID0gTWF0aC50YW4oZm92LmxlZnREZWdyZWVzICogTWF0aC5QSS8xODAuMCksXG4gICAgICAgIHJpZ2h0VGFuID0gTWF0aC50YW4oZm92LnJpZ2h0RGVncmVlcyAqIE1hdGguUEkvMTgwLjApLFxuICAgICAgICB4U2NhbGUgPSAyLjAgLyAobGVmdFRhbiArIHJpZ2h0VGFuKSxcbiAgICAgICAgeVNjYWxlID0gMi4wIC8gKHVwVGFuICsgZG93blRhbik7XG5cbiAgICBvdXRbMF0gPSB4U2NhbGU7XG4gICAgb3V0WzFdID0gMC4wO1xuICAgIG91dFsyXSA9IDAuMDtcbiAgICBvdXRbM10gPSAwLjA7XG4gICAgb3V0WzRdID0gMC4wO1xuICAgIG91dFs1XSA9IHlTY2FsZTtcbiAgICBvdXRbNl0gPSAwLjA7XG4gICAgb3V0WzddID0gMC4wO1xuICAgIG91dFs4XSA9IC0oKGxlZnRUYW4gLSByaWdodFRhbikgKiB4U2NhbGUgKiAwLjUpO1xuICAgIG91dFs5XSA9ICgodXBUYW4gLSBkb3duVGFuKSAqIHlTY2FsZSAqIDAuNSk7XG4gICAgb3V0WzEwXSA9IGZhciAvIChuZWFyIC0gZmFyKTtcbiAgICBvdXRbMTFdID0gLTEuMDtcbiAgICBvdXRbMTJdID0gMC4wO1xuICAgIG91dFsxM10gPSAwLjA7XG4gICAgb3V0WzE0XSA9IChmYXIgKiBuZWFyKSAvIChuZWFyIC0gZmFyKTtcbiAgICBvdXRbMTVdID0gMC4wO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgb3J0aG9nb25hbCBwcm9qZWN0aW9uIG1hdHJpeCB3aXRoIHRoZSBnaXZlbiBib3VuZHNcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IGZydXN0dW0gbWF0cml4IHdpbGwgYmUgd3JpdHRlbiBpbnRvXG4gKiBAcGFyYW0ge251bWJlcn0gbGVmdCBMZWZ0IGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge251bWJlcn0gcmlnaHQgUmlnaHQgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7bnVtYmVyfSBib3R0b20gQm90dG9tIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge251bWJlcn0gdG9wIFRvcCBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtudW1iZXJ9IG5lYXIgTmVhciBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtudW1iZXJ9IGZhciBGYXIgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5vcnRobyA9IGZ1bmN0aW9uIChvdXQsIGxlZnQsIHJpZ2h0LCBib3R0b20sIHRvcCwgbmVhciwgZmFyKSB7XG4gICAgdmFyIGxyID0gMSAvIChsZWZ0IC0gcmlnaHQpLFxuICAgICAgICBidCA9IDEgLyAoYm90dG9tIC0gdG9wKSxcbiAgICAgICAgbmYgPSAxIC8gKG5lYXIgLSBmYXIpO1xuICAgIG91dFswXSA9IC0yICogbHI7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSAtMiAqIGJ0O1xuICAgIG91dFs2XSA9IDA7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSAwO1xuICAgIG91dFs5XSA9IDA7XG4gICAgb3V0WzEwXSA9IDIgKiBuZjtcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gKGxlZnQgKyByaWdodCkgKiBscjtcbiAgICBvdXRbMTNdID0gKHRvcCArIGJvdHRvbSkgKiBidDtcbiAgICBvdXRbMTRdID0gKGZhciArIG5lYXIpICogbmY7XG4gICAgb3V0WzE1XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgbG9vay1hdCBtYXRyaXggd2l0aCB0aGUgZ2l2ZW4gZXllIHBvc2l0aW9uLCBmb2NhbCBwb2ludCwgYW5kIHVwIGF4aXNcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IGZydXN0dW0gbWF0cml4IHdpbGwgYmUgd3JpdHRlbiBpbnRvXG4gKiBAcGFyYW0ge3ZlYzN9IGV5ZSBQb3NpdGlvbiBvZiB0aGUgdmlld2VyXG4gKiBAcGFyYW0ge3ZlYzN9IGNlbnRlciBQb2ludCB0aGUgdmlld2VyIGlzIGxvb2tpbmcgYXRcbiAqIEBwYXJhbSB7dmVjM30gdXAgdmVjMyBwb2ludGluZyB1cFxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0Lmxvb2tBdCA9IGZ1bmN0aW9uIChvdXQsIGV5ZSwgY2VudGVyLCB1cCkge1xuICAgIHZhciB4MCwgeDEsIHgyLCB5MCwgeTEsIHkyLCB6MCwgejEsIHoyLCBsZW4sXG4gICAgICAgIGV5ZXggPSBleWVbMF0sXG4gICAgICAgIGV5ZXkgPSBleWVbMV0sXG4gICAgICAgIGV5ZXogPSBleWVbMl0sXG4gICAgICAgIHVweCA9IHVwWzBdLFxuICAgICAgICB1cHkgPSB1cFsxXSxcbiAgICAgICAgdXB6ID0gdXBbMl0sXG4gICAgICAgIGNlbnRlcnggPSBjZW50ZXJbMF0sXG4gICAgICAgIGNlbnRlcnkgPSBjZW50ZXJbMV0sXG4gICAgICAgIGNlbnRlcnogPSBjZW50ZXJbMl07XG5cbiAgICBpZiAoTWF0aC5hYnMoZXlleCAtIGNlbnRlcngpIDwgZ2xNYXRyaXguRVBTSUxPTiAmJlxuICAgICAgICBNYXRoLmFicyhleWV5IC0gY2VudGVyeSkgPCBnbE1hdHJpeC5FUFNJTE9OICYmXG4gICAgICAgIE1hdGguYWJzKGV5ZXogLSBjZW50ZXJ6KSA8IGdsTWF0cml4LkVQU0lMT04pIHtcbiAgICAgICAgcmV0dXJuIG1hdDQuaWRlbnRpdHkob3V0KTtcbiAgICB9XG5cbiAgICB6MCA9IGV5ZXggLSBjZW50ZXJ4O1xuICAgIHoxID0gZXlleSAtIGNlbnRlcnk7XG4gICAgejIgPSBleWV6IC0gY2VudGVyejtcblxuICAgIGxlbiA9IDEgLyBNYXRoLnNxcnQoejAgKiB6MCArIHoxICogejEgKyB6MiAqIHoyKTtcbiAgICB6MCAqPSBsZW47XG4gICAgejEgKj0gbGVuO1xuICAgIHoyICo9IGxlbjtcblxuICAgIHgwID0gdXB5ICogejIgLSB1cHogKiB6MTtcbiAgICB4MSA9IHVweiAqIHowIC0gdXB4ICogejI7XG4gICAgeDIgPSB1cHggKiB6MSAtIHVweSAqIHowO1xuICAgIGxlbiA9IE1hdGguc3FydCh4MCAqIHgwICsgeDEgKiB4MSArIHgyICogeDIpO1xuICAgIGlmICghbGVuKSB7XG4gICAgICAgIHgwID0gMDtcbiAgICAgICAgeDEgPSAwO1xuICAgICAgICB4MiA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGVuID0gMSAvIGxlbjtcbiAgICAgICAgeDAgKj0gbGVuO1xuICAgICAgICB4MSAqPSBsZW47XG4gICAgICAgIHgyICo9IGxlbjtcbiAgICB9XG5cbiAgICB5MCA9IHoxICogeDIgLSB6MiAqIHgxO1xuICAgIHkxID0gejIgKiB4MCAtIHowICogeDI7XG4gICAgeTIgPSB6MCAqIHgxIC0gejEgKiB4MDtcblxuICAgIGxlbiA9IE1hdGguc3FydCh5MCAqIHkwICsgeTEgKiB5MSArIHkyICogeTIpO1xuICAgIGlmICghbGVuKSB7XG4gICAgICAgIHkwID0gMDtcbiAgICAgICAgeTEgPSAwO1xuICAgICAgICB5MiA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGVuID0gMSAvIGxlbjtcbiAgICAgICAgeTAgKj0gbGVuO1xuICAgICAgICB5MSAqPSBsZW47XG4gICAgICAgIHkyICo9IGxlbjtcbiAgICB9XG5cbiAgICBvdXRbMF0gPSB4MDtcbiAgICBvdXRbMV0gPSB5MDtcbiAgICBvdXRbMl0gPSB6MDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IHgxO1xuICAgIG91dFs1XSA9IHkxO1xuICAgIG91dFs2XSA9IHoxO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0geDI7XG4gICAgb3V0WzldID0geTI7XG4gICAgb3V0WzEwXSA9IHoyO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSAtKHgwICogZXlleCArIHgxICogZXlleSArIHgyICogZXlleik7XG4gICAgb3V0WzEzXSA9IC0oeTAgKiBleWV4ICsgeTEgKiBleWV5ICsgeTIgKiBleWV6KTtcbiAgICBvdXRbMTRdID0gLSh6MCAqIGV5ZXggKyB6MSAqIGV5ZXkgKyB6MiAqIGV5ZXopO1xuICAgIG91dFsxNV0gPSAxO1xuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIG1hdDRcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG1hdCBtYXRyaXggdG8gcmVwcmVzZW50IGFzIGEgc3RyaW5nXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hdHJpeFxuICovXG5tYXQ0LnN0ciA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuICdtYXQ0KCcgKyBhWzBdICsgJywgJyArIGFbMV0gKyAnLCAnICsgYVsyXSArICcsICcgKyBhWzNdICsgJywgJyArXG4gICAgICAgICAgICAgICAgICAgIGFbNF0gKyAnLCAnICsgYVs1XSArICcsICcgKyBhWzZdICsgJywgJyArIGFbN10gKyAnLCAnICtcbiAgICAgICAgICAgICAgICAgICAgYVs4XSArICcsICcgKyBhWzldICsgJywgJyArIGFbMTBdICsgJywgJyArIGFbMTFdICsgJywgJyArIFxuICAgICAgICAgICAgICAgICAgICBhWzEyXSArICcsICcgKyBhWzEzXSArICcsICcgKyBhWzE0XSArICcsICcgKyBhWzE1XSArICcpJztcbn07XG5cbi8qKlxuICogUmV0dXJucyBGcm9iZW5pdXMgbm9ybSBvZiBhIG1hdDRcbiAqXG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIG1hdHJpeCB0byBjYWxjdWxhdGUgRnJvYmVuaXVzIG5vcm0gb2ZcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IEZyb2Jlbml1cyBub3JtXG4gKi9cbm1hdDQuZnJvYiA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuKE1hdGguc3FydChNYXRoLnBvdyhhWzBdLCAyKSArIE1hdGgucG93KGFbMV0sIDIpICsgTWF0aC5wb3coYVsyXSwgMikgKyBNYXRoLnBvdyhhWzNdLCAyKSArIE1hdGgucG93KGFbNF0sIDIpICsgTWF0aC5wb3coYVs1XSwgMikgKyBNYXRoLnBvdyhhWzZdLCAyKSArIE1hdGgucG93KGFbN10sIDIpICsgTWF0aC5wb3coYVs4XSwgMikgKyBNYXRoLnBvdyhhWzldLCAyKSArIE1hdGgucG93KGFbMTBdLCAyKSArIE1hdGgucG93KGFbMTFdLCAyKSArIE1hdGgucG93KGFbMTJdLCAyKSArIE1hdGgucG93KGFbMTNdLCAyKSArIE1hdGgucG93KGFbMTRdLCAyKSArIE1hdGgucG93KGFbMTVdLCAyKSApKVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdDQ7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC9tYXQ0LmpzXG4gKiogbW9kdWxlIGlkID0gOVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyogQ29weXJpZ2h0IChjKSAyMDE1LCBCcmFuZG9uIEpvbmVzLCBDb2xpbiBNYWNLZW56aWUgSVYuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS4gKi9cblxudmFyIGdsTWF0cml4ID0gcmVxdWlyZShcIi4vY29tbW9uLmpzXCIpO1xudmFyIG1hdDMgPSByZXF1aXJlKFwiLi9tYXQzLmpzXCIpO1xudmFyIHZlYzMgPSByZXF1aXJlKFwiLi92ZWMzLmpzXCIpO1xudmFyIHZlYzQgPSByZXF1aXJlKFwiLi92ZWM0LmpzXCIpO1xuXG4vKipcbiAqIEBjbGFzcyBRdWF0ZXJuaW9uXG4gKiBAbmFtZSBxdWF0XG4gKi9cbnZhciBxdWF0ID0ge307XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpZGVudGl0eSBxdWF0XG4gKlxuICogQHJldHVybnMge3F1YXR9IGEgbmV3IHF1YXRlcm5pb25cbiAqL1xucXVhdC5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoNCk7XG4gICAgb3V0WzBdID0gMDtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTZXRzIGEgcXVhdGVybmlvbiB0byByZXByZXNlbnQgdGhlIHNob3J0ZXN0IHJvdGF0aW9uIGZyb20gb25lXG4gKiB2ZWN0b3IgdG8gYW5vdGhlci5cbiAqXG4gKiBCb3RoIHZlY3RvcnMgYXJlIGFzc3VtZWQgdG8gYmUgdW5pdCBsZW5ndGguXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uLlxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBpbml0aWFsIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBkZXN0aW5hdGlvbiB2ZWN0b3JcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5yb3RhdGlvblRvID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciB0bXB2ZWMzID0gdmVjMy5jcmVhdGUoKTtcbiAgICB2YXIgeFVuaXRWZWMzID0gdmVjMy5mcm9tVmFsdWVzKDEsMCwwKTtcbiAgICB2YXIgeVVuaXRWZWMzID0gdmVjMy5mcm9tVmFsdWVzKDAsMSwwKTtcblxuICAgIHJldHVybiBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICAgICAgdmFyIGRvdCA9IHZlYzMuZG90KGEsIGIpO1xuICAgICAgICBpZiAoZG90IDwgLTAuOTk5OTk5KSB7XG4gICAgICAgICAgICB2ZWMzLmNyb3NzKHRtcHZlYzMsIHhVbml0VmVjMywgYSk7XG4gICAgICAgICAgICBpZiAodmVjMy5sZW5ndGgodG1wdmVjMykgPCAwLjAwMDAwMSlcbiAgICAgICAgICAgICAgICB2ZWMzLmNyb3NzKHRtcHZlYzMsIHlVbml0VmVjMywgYSk7XG4gICAgICAgICAgICB2ZWMzLm5vcm1hbGl6ZSh0bXB2ZWMzLCB0bXB2ZWMzKTtcbiAgICAgICAgICAgIHF1YXQuc2V0QXhpc0FuZ2xlKG91dCwgdG1wdmVjMywgTWF0aC5QSSk7XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9IGVsc2UgaWYgKGRvdCA+IDAuOTk5OTk5KSB7XG4gICAgICAgICAgICBvdXRbMF0gPSAwO1xuICAgICAgICAgICAgb3V0WzFdID0gMDtcbiAgICAgICAgICAgIG91dFsyXSA9IDA7XG4gICAgICAgICAgICBvdXRbM10gPSAxO1xuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZlYzMuY3Jvc3ModG1wdmVjMywgYSwgYik7XG4gICAgICAgICAgICBvdXRbMF0gPSB0bXB2ZWMzWzBdO1xuICAgICAgICAgICAgb3V0WzFdID0gdG1wdmVjM1sxXTtcbiAgICAgICAgICAgIG91dFsyXSA9IHRtcHZlYzNbMl07XG4gICAgICAgICAgICBvdXRbM10gPSAxICsgZG90O1xuICAgICAgICAgICAgcmV0dXJuIHF1YXQubm9ybWFsaXplKG91dCwgb3V0KTtcbiAgICAgICAgfVxuICAgIH07XG59KSgpO1xuXG4vKipcbiAqIFNldHMgdGhlIHNwZWNpZmllZCBxdWF0ZXJuaW9uIHdpdGggdmFsdWVzIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGdpdmVuXG4gKiBheGVzLiBFYWNoIGF4aXMgaXMgYSB2ZWMzIGFuZCBpcyBleHBlY3RlZCB0byBiZSB1bml0IGxlbmd0aCBhbmRcbiAqIHBlcnBlbmRpY3VsYXIgdG8gYWxsIG90aGVyIHNwZWNpZmllZCBheGVzLlxuICpcbiAqIEBwYXJhbSB7dmVjM30gdmlldyAgdGhlIHZlY3RvciByZXByZXNlbnRpbmcgdGhlIHZpZXdpbmcgZGlyZWN0aW9uXG4gKiBAcGFyYW0ge3ZlYzN9IHJpZ2h0IHRoZSB2ZWN0b3IgcmVwcmVzZW50aW5nIHRoZSBsb2NhbCBcInJpZ2h0XCIgZGlyZWN0aW9uXG4gKiBAcGFyYW0ge3ZlYzN9IHVwICAgIHRoZSB2ZWN0b3IgcmVwcmVzZW50aW5nIHRoZSBsb2NhbCBcInVwXCIgZGlyZWN0aW9uXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKi9cbnF1YXQuc2V0QXhlcyA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgbWF0ciA9IG1hdDMuY3JlYXRlKCk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24ob3V0LCB2aWV3LCByaWdodCwgdXApIHtcbiAgICAgICAgbWF0clswXSA9IHJpZ2h0WzBdO1xuICAgICAgICBtYXRyWzNdID0gcmlnaHRbMV07XG4gICAgICAgIG1hdHJbNl0gPSByaWdodFsyXTtcblxuICAgICAgICBtYXRyWzFdID0gdXBbMF07XG4gICAgICAgIG1hdHJbNF0gPSB1cFsxXTtcbiAgICAgICAgbWF0cls3XSA9IHVwWzJdO1xuXG4gICAgICAgIG1hdHJbMl0gPSAtdmlld1swXTtcbiAgICAgICAgbWF0cls1XSA9IC12aWV3WzFdO1xuICAgICAgICBtYXRyWzhdID0gLXZpZXdbMl07XG5cbiAgICAgICAgcmV0dXJuIHF1YXQubm9ybWFsaXplKG91dCwgcXVhdC5mcm9tTWF0MyhvdXQsIG1hdHIpKTtcbiAgICB9O1xufSkoKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHF1YXQgaW5pdGlhbGl6ZWQgd2l0aCB2YWx1ZXMgZnJvbSBhbiBleGlzdGluZyBxdWF0ZXJuaW9uXG4gKlxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXRlcm5pb24gdG8gY2xvbmVcbiAqIEByZXR1cm5zIHtxdWF0fSBhIG5ldyBxdWF0ZXJuaW9uXG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5jbG9uZSA9IHZlYzQuY2xvbmU7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBxdWF0IGluaXRpYWxpemVkIHdpdGggdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFggY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geSBZIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHogWiBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB3IFcgY29tcG9uZW50XG4gKiBAcmV0dXJucyB7cXVhdH0gYSBuZXcgcXVhdGVybmlvblxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQuZnJvbVZhbHVlcyA9IHZlYzQuZnJvbVZhbHVlcztcblxuLyoqXG4gKiBDb3B5IHRoZSB2YWx1ZXMgZnJvbSBvbmUgcXVhdCB0byBhbm90aGVyXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3F1YXR9IGEgdGhlIHNvdXJjZSBxdWF0ZXJuaW9uXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5jb3B5ID0gdmVjNC5jb3B5O1xuXG4vKipcbiAqIFNldCB0aGUgY29tcG9uZW50cyBvZiBhIHF1YXQgdG8gdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHtOdW1iZXJ9IHggWCBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFkgY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geiBaIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHcgVyBjb21wb25lbnRcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LnNldCA9IHZlYzQuc2V0O1xuXG4vKipcbiAqIFNldCBhIHF1YXQgdG8gdGhlIGlkZW50aXR5IHF1YXRlcm5pb25cbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5pZGVudGl0eSA9IGZ1bmN0aW9uKG91dCkge1xuICAgIG91dFswXSA9IDA7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2V0cyBhIHF1YXQgZnJvbSB0aGUgZ2l2ZW4gYW5nbGUgYW5kIHJvdGF0aW9uIGF4aXMsXG4gKiB0aGVuIHJldHVybnMgaXQuXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3ZlYzN9IGF4aXMgdGhlIGF4aXMgYXJvdW5kIHdoaWNoIHRvIHJvdGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgaW4gcmFkaWFuc1xuICogQHJldHVybnMge3F1YXR9IG91dFxuICoqL1xucXVhdC5zZXRBeGlzQW5nbGUgPSBmdW5jdGlvbihvdXQsIGF4aXMsIHJhZCkge1xuICAgIHJhZCA9IHJhZCAqIDAuNTtcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCk7XG4gICAgb3V0WzBdID0gcyAqIGF4aXNbMF07XG4gICAgb3V0WzFdID0gcyAqIGF4aXNbMV07XG4gICAgb3V0WzJdID0gcyAqIGF4aXNbMl07XG4gICAgb3V0WzNdID0gTWF0aC5jb3MocmFkKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBZGRzIHR3byBxdWF0J3NcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHtxdWF0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3F1YXR9IG91dFxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQuYWRkID0gdmVjNC5hZGQ7XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gcXVhdCdzXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3F1YXR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7cXVhdH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5tdWx0aXBseSA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIHZhciBheCA9IGFbMF0sIGF5ID0gYVsxXSwgYXogPSBhWzJdLCBhdyA9IGFbM10sXG4gICAgICAgIGJ4ID0gYlswXSwgYnkgPSBiWzFdLCBieiA9IGJbMl0sIGJ3ID0gYlszXTtcblxuICAgIG91dFswXSA9IGF4ICogYncgKyBhdyAqIGJ4ICsgYXkgKiBieiAtIGF6ICogYnk7XG4gICAgb3V0WzFdID0gYXkgKiBidyArIGF3ICogYnkgKyBheiAqIGJ4IC0gYXggKiBiejtcbiAgICBvdXRbMl0gPSBheiAqIGJ3ICsgYXcgKiBieiArIGF4ICogYnkgLSBheSAqIGJ4O1xuICAgIG91dFszXSA9IGF3ICogYncgLSBheCAqIGJ4IC0gYXkgKiBieSAtIGF6ICogYno7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayBxdWF0Lm11bHRpcGx5fVxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQubXVsID0gcXVhdC5tdWx0aXBseTtcblxuLyoqXG4gKiBTY2FsZXMgYSBxdWF0IGJ5IGEgc2NhbGFyIG51bWJlclxuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3F1YXR9IGEgdGhlIHZlY3RvciB0byBzY2FsZVxuICogQHBhcmFtIHtOdW1iZXJ9IGIgYW1vdW50IHRvIHNjYWxlIHRoZSB2ZWN0b3IgYnlcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LnNjYWxlID0gdmVjNC5zY2FsZTtcblxuLyoqXG4gKiBSb3RhdGVzIGEgcXVhdGVybmlvbiBieSB0aGUgZ2l2ZW4gYW5nbGUgYWJvdXQgdGhlIFggYXhpc1xuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHF1YXQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7cXVhdH0gYSBxdWF0IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IHJhZCBhbmdsZSAoaW4gcmFkaWFucykgdG8gcm90YXRlXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKi9cbnF1YXQucm90YXRlWCA9IGZ1bmN0aW9uIChvdXQsIGEsIHJhZCkge1xuICAgIHJhZCAqPSAwLjU7IFxuXG4gICAgdmFyIGF4ID0gYVswXSwgYXkgPSBhWzFdLCBheiA9IGFbMl0sIGF3ID0gYVszXSxcbiAgICAgICAgYnggPSBNYXRoLnNpbihyYWQpLCBidyA9IE1hdGguY29zKHJhZCk7XG5cbiAgICBvdXRbMF0gPSBheCAqIGJ3ICsgYXcgKiBieDtcbiAgICBvdXRbMV0gPSBheSAqIGJ3ICsgYXogKiBieDtcbiAgICBvdXRbMl0gPSBheiAqIGJ3IC0gYXkgKiBieDtcbiAgICBvdXRbM10gPSBhdyAqIGJ3IC0gYXggKiBieDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSb3RhdGVzIGEgcXVhdGVybmlvbiBieSB0aGUgZ2l2ZW4gYW5nbGUgYWJvdXQgdGhlIFkgYXhpc1xuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHF1YXQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7cXVhdH0gYSBxdWF0IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IHJhZCBhbmdsZSAoaW4gcmFkaWFucykgdG8gcm90YXRlXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKi9cbnF1YXQucm90YXRlWSA9IGZ1bmN0aW9uIChvdXQsIGEsIHJhZCkge1xuICAgIHJhZCAqPSAwLjU7IFxuXG4gICAgdmFyIGF4ID0gYVswXSwgYXkgPSBhWzFdLCBheiA9IGFbMl0sIGF3ID0gYVszXSxcbiAgICAgICAgYnkgPSBNYXRoLnNpbihyYWQpLCBidyA9IE1hdGguY29zKHJhZCk7XG5cbiAgICBvdXRbMF0gPSBheCAqIGJ3IC0gYXogKiBieTtcbiAgICBvdXRbMV0gPSBheSAqIGJ3ICsgYXcgKiBieTtcbiAgICBvdXRbMl0gPSBheiAqIGJ3ICsgYXggKiBieTtcbiAgICBvdXRbM10gPSBhdyAqIGJ3IC0gYXkgKiBieTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSb3RhdGVzIGEgcXVhdGVybmlvbiBieSB0aGUgZ2l2ZW4gYW5nbGUgYWJvdXQgdGhlIFogYXhpc1xuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHF1YXQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7cXVhdH0gYSBxdWF0IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IHJhZCBhbmdsZSAoaW4gcmFkaWFucykgdG8gcm90YXRlXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKi9cbnF1YXQucm90YXRlWiA9IGZ1bmN0aW9uIChvdXQsIGEsIHJhZCkge1xuICAgIHJhZCAqPSAwLjU7IFxuXG4gICAgdmFyIGF4ID0gYVswXSwgYXkgPSBhWzFdLCBheiA9IGFbMl0sIGF3ID0gYVszXSxcbiAgICAgICAgYnogPSBNYXRoLnNpbihyYWQpLCBidyA9IE1hdGguY29zKHJhZCk7XG5cbiAgICBvdXRbMF0gPSBheCAqIGJ3ICsgYXkgKiBiejtcbiAgICBvdXRbMV0gPSBheSAqIGJ3IC0gYXggKiBiejtcbiAgICBvdXRbMl0gPSBheiAqIGJ3ICsgYXcgKiBiejtcbiAgICBvdXRbM10gPSBhdyAqIGJ3IC0gYXogKiBiejtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBXIGNvbXBvbmVudCBvZiBhIHF1YXQgZnJvbSB0aGUgWCwgWSwgYW5kIFogY29tcG9uZW50cy5cbiAqIEFzc3VtZXMgdGhhdCBxdWF0ZXJuaW9uIGlzIDEgdW5pdCBpbiBsZW5ndGguXG4gKiBBbnkgZXhpc3RpbmcgVyBjb21wb25lbnQgd2lsbCBiZSBpZ25vcmVkLlxuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXQgdG8gY2FsY3VsYXRlIFcgY29tcG9uZW50IG9mXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKi9cbnF1YXQuY2FsY3VsYXRlVyA9IGZ1bmN0aW9uIChvdXQsIGEpIHtcbiAgICB2YXIgeCA9IGFbMF0sIHkgPSBhWzFdLCB6ID0gYVsyXTtcblxuICAgIG91dFswXSA9IHg7XG4gICAgb3V0WzFdID0geTtcbiAgICBvdXRbMl0gPSB6O1xuICAgIG91dFszXSA9IE1hdGguc3FydChNYXRoLmFicygxLjAgLSB4ICogeCAtIHkgKiB5IC0geiAqIHopKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBkb3QgcHJvZHVjdCBvZiB0d28gcXVhdCdzXG4gKlxuICogQHBhcmFtIHtxdWF0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3F1YXR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkb3QgcHJvZHVjdCBvZiBhIGFuZCBiXG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5kb3QgPSB2ZWM0LmRvdDtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIGxpbmVhciBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdHdvIHF1YXQnc1xuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHtxdWF0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3F1YXR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudCBiZXR3ZWVuIHRoZSB0d28gaW5wdXRzXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5sZXJwID0gdmVjNC5sZXJwO1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgc3BoZXJpY2FsIGxpbmVhciBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdHdvIHF1YXRcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHtxdWF0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHtOdW1iZXJ9IHQgaW50ZXJwb2xhdGlvbiBhbW91bnQgYmV0d2VlbiB0aGUgdHdvIGlucHV0c1xuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0LnNsZXJwID0gZnVuY3Rpb24gKG91dCwgYSwgYiwgdCkge1xuICAgIC8vIGJlbmNobWFya3M6XG4gICAgLy8gICAgaHR0cDovL2pzcGVyZi5jb20vcXVhdGVybmlvbi1zbGVycC1pbXBsZW1lbnRhdGlvbnNcblxuICAgIHZhciBheCA9IGFbMF0sIGF5ID0gYVsxXSwgYXogPSBhWzJdLCBhdyA9IGFbM10sXG4gICAgICAgIGJ4ID0gYlswXSwgYnkgPSBiWzFdLCBieiA9IGJbMl0sIGJ3ID0gYlszXTtcblxuICAgIHZhciAgICAgICAgb21lZ2EsIGNvc29tLCBzaW5vbSwgc2NhbGUwLCBzY2FsZTE7XG5cbiAgICAvLyBjYWxjIGNvc2luZVxuICAgIGNvc29tID0gYXggKiBieCArIGF5ICogYnkgKyBheiAqIGJ6ICsgYXcgKiBidztcbiAgICAvLyBhZGp1c3Qgc2lnbnMgKGlmIG5lY2Vzc2FyeSlcbiAgICBpZiAoIGNvc29tIDwgMC4wICkge1xuICAgICAgICBjb3NvbSA9IC1jb3NvbTtcbiAgICAgICAgYnggPSAtIGJ4O1xuICAgICAgICBieSA9IC0gYnk7XG4gICAgICAgIGJ6ID0gLSBiejtcbiAgICAgICAgYncgPSAtIGJ3O1xuICAgIH1cbiAgICAvLyBjYWxjdWxhdGUgY29lZmZpY2llbnRzXG4gICAgaWYgKCAoMS4wIC0gY29zb20pID4gMC4wMDAwMDEgKSB7XG4gICAgICAgIC8vIHN0YW5kYXJkIGNhc2UgKHNsZXJwKVxuICAgICAgICBvbWVnYSAgPSBNYXRoLmFjb3MoY29zb20pO1xuICAgICAgICBzaW5vbSAgPSBNYXRoLnNpbihvbWVnYSk7XG4gICAgICAgIHNjYWxlMCA9IE1hdGguc2luKCgxLjAgLSB0KSAqIG9tZWdhKSAvIHNpbm9tO1xuICAgICAgICBzY2FsZTEgPSBNYXRoLnNpbih0ICogb21lZ2EpIC8gc2lub207XG4gICAgfSBlbHNlIHsgICAgICAgIFxuICAgICAgICAvLyBcImZyb21cIiBhbmQgXCJ0b1wiIHF1YXRlcm5pb25zIGFyZSB2ZXJ5IGNsb3NlIFxuICAgICAgICAvLyAgLi4uIHNvIHdlIGNhbiBkbyBhIGxpbmVhciBpbnRlcnBvbGF0aW9uXG4gICAgICAgIHNjYWxlMCA9IDEuMCAtIHQ7XG4gICAgICAgIHNjYWxlMSA9IHQ7XG4gICAgfVxuICAgIC8vIGNhbGN1bGF0ZSBmaW5hbCB2YWx1ZXNcbiAgICBvdXRbMF0gPSBzY2FsZTAgKiBheCArIHNjYWxlMSAqIGJ4O1xuICAgIG91dFsxXSA9IHNjYWxlMCAqIGF5ICsgc2NhbGUxICogYnk7XG4gICAgb3V0WzJdID0gc2NhbGUwICogYXogKyBzY2FsZTEgKiBiejtcbiAgICBvdXRbM10gPSBzY2FsZTAgKiBhdyArIHNjYWxlMSAqIGJ3O1xuICAgIFxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgc3BoZXJpY2FsIGxpbmVhciBpbnRlcnBvbGF0aW9uIHdpdGggdHdvIGNvbnRyb2wgcG9pbnRzXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3F1YXR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7cXVhdH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7cXVhdH0gYyB0aGUgdGhpcmQgb3BlcmFuZFxuICogQHBhcmFtIHtxdWF0fSBkIHRoZSBmb3VydGggb3BlcmFuZFxuICogQHBhcmFtIHtOdW1iZXJ9IHQgaW50ZXJwb2xhdGlvbiBhbW91bnRcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5zcWxlcnAgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgdGVtcDEgPSBxdWF0LmNyZWF0ZSgpO1xuICB2YXIgdGVtcDIgPSBxdWF0LmNyZWF0ZSgpO1xuICBcbiAgcmV0dXJuIGZ1bmN0aW9uIChvdXQsIGEsIGIsIGMsIGQsIHQpIHtcbiAgICBxdWF0LnNsZXJwKHRlbXAxLCBhLCBkLCB0KTtcbiAgICBxdWF0LnNsZXJwKHRlbXAyLCBiLCBjLCB0KTtcbiAgICBxdWF0LnNsZXJwKG91dCwgdGVtcDEsIHRlbXAyLCAyICogdCAqICgxIC0gdCkpO1xuICAgIFxuICAgIHJldHVybiBvdXQ7XG4gIH07XG59KCkpO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGludmVyc2Ugb2YgYSBxdWF0XG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3F1YXR9IGEgcXVhdCB0byBjYWxjdWxhdGUgaW52ZXJzZSBvZlxuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0LmludmVydCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXSwgYTIgPSBhWzJdLCBhMyA9IGFbM10sXG4gICAgICAgIGRvdCA9IGEwKmEwICsgYTEqYTEgKyBhMiphMiArIGEzKmEzLFxuICAgICAgICBpbnZEb3QgPSBkb3QgPyAxLjAvZG90IDogMDtcbiAgICBcbiAgICAvLyBUT0RPOiBXb3VsZCBiZSBmYXN0ZXIgdG8gcmV0dXJuIFswLDAsMCwwXSBpbW1lZGlhdGVseSBpZiBkb3QgPT0gMFxuXG4gICAgb3V0WzBdID0gLWEwKmludkRvdDtcbiAgICBvdXRbMV0gPSAtYTEqaW52RG90O1xuICAgIG91dFsyXSA9IC1hMippbnZEb3Q7XG4gICAgb3V0WzNdID0gYTMqaW52RG90O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGNvbmp1Z2F0ZSBvZiBhIHF1YXRcbiAqIElmIHRoZSBxdWF0ZXJuaW9uIGlzIG5vcm1hbGl6ZWQsIHRoaXMgZnVuY3Rpb24gaXMgZmFzdGVyIHRoYW4gcXVhdC5pbnZlcnNlIGFuZCBwcm9kdWNlcyB0aGUgc2FtZSByZXN1bHQuXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3F1YXR9IGEgcXVhdCB0byBjYWxjdWxhdGUgY29uanVnYXRlIG9mXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKi9cbnF1YXQuY29uanVnYXRlID0gZnVuY3Rpb24gKG91dCwgYSkge1xuICAgIG91dFswXSA9IC1hWzBdO1xuICAgIG91dFsxXSA9IC1hWzFdO1xuICAgIG91dFsyXSA9IC1hWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgbGVuZ3RoIG9mIGEgcXVhdFxuICpcbiAqIEBwYXJhbSB7cXVhdH0gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIGxlbmd0aCBvZlxuICogQHJldHVybnMge051bWJlcn0gbGVuZ3RoIG9mIGFcbiAqIEBmdW5jdGlvblxuICovXG5xdWF0Lmxlbmd0aCA9IHZlYzQubGVuZ3RoO1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgcXVhdC5sZW5ndGh9XG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5sZW4gPSBxdWF0Lmxlbmd0aDtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGxlbmd0aCBvZiBhIHF1YXRcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IGEgdmVjdG9yIHRvIGNhbGN1bGF0ZSBzcXVhcmVkIGxlbmd0aCBvZlxuICogQHJldHVybnMge051bWJlcn0gc3F1YXJlZCBsZW5ndGggb2YgYVxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQuc3F1YXJlZExlbmd0aCA9IHZlYzQuc3F1YXJlZExlbmd0aDtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHF1YXQuc3F1YXJlZExlbmd0aH1cbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LnNxckxlbiA9IHF1YXQuc3F1YXJlZExlbmd0aDtcblxuLyoqXG4gKiBOb3JtYWxpemUgYSBxdWF0XG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3F1YXR9IGEgcXVhdGVybmlvbiB0byBub3JtYWxpemVcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqIEBmdW5jdGlvblxuICovXG5xdWF0Lm5vcm1hbGl6ZSA9IHZlYzQubm9ybWFsaXplO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBxdWF0ZXJuaW9uIGZyb20gdGhlIGdpdmVuIDN4MyByb3RhdGlvbiBtYXRyaXguXG4gKlxuICogTk9URTogVGhlIHJlc3VsdGFudCBxdWF0ZXJuaW9uIGlzIG5vdCBub3JtYWxpemVkLCBzbyB5b3Ugc2hvdWxkIGJlIHN1cmVcbiAqIHRvIHJlbm9ybWFsaXplIHRoZSBxdWF0ZXJuaW9uIHlvdXJzZWxmIHdoZXJlIG5lY2Vzc2FyeS5cbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7bWF0M30gbSByb3RhdGlvbiBtYXRyaXhcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LmZyb21NYXQzID0gZnVuY3Rpb24ob3V0LCBtKSB7XG4gICAgLy8gQWxnb3JpdGhtIGluIEtlbiBTaG9lbWFrZSdzIGFydGljbGUgaW4gMTk4NyBTSUdHUkFQSCBjb3Vyc2Ugbm90ZXNcbiAgICAvLyBhcnRpY2xlIFwiUXVhdGVybmlvbiBDYWxjdWx1cyBhbmQgRmFzdCBBbmltYXRpb25cIi5cbiAgICB2YXIgZlRyYWNlID0gbVswXSArIG1bNF0gKyBtWzhdO1xuICAgIHZhciBmUm9vdDtcblxuICAgIGlmICggZlRyYWNlID4gMC4wICkge1xuICAgICAgICAvLyB8d3wgPiAxLzIsIG1heSBhcyB3ZWxsIGNob29zZSB3ID4gMS8yXG4gICAgICAgIGZSb290ID0gTWF0aC5zcXJ0KGZUcmFjZSArIDEuMCk7ICAvLyAyd1xuICAgICAgICBvdXRbM10gPSAwLjUgKiBmUm9vdDtcbiAgICAgICAgZlJvb3QgPSAwLjUvZlJvb3Q7ICAvLyAxLyg0dylcbiAgICAgICAgb3V0WzBdID0gKG1bNV0tbVs3XSkqZlJvb3Q7XG4gICAgICAgIG91dFsxXSA9IChtWzZdLW1bMl0pKmZSb290O1xuICAgICAgICBvdXRbMl0gPSAobVsxXS1tWzNdKSpmUm9vdDtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyB8d3wgPD0gMS8yXG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgaWYgKCBtWzRdID4gbVswXSApXG4gICAgICAgICAgaSA9IDE7XG4gICAgICAgIGlmICggbVs4XSA+IG1baSozK2ldIClcbiAgICAgICAgICBpID0gMjtcbiAgICAgICAgdmFyIGogPSAoaSsxKSUzO1xuICAgICAgICB2YXIgayA9IChpKzIpJTM7XG4gICAgICAgIFxuICAgICAgICBmUm9vdCA9IE1hdGguc3FydChtW2kqMytpXS1tW2oqMytqXS1tW2sqMytrXSArIDEuMCk7XG4gICAgICAgIG91dFtpXSA9IDAuNSAqIGZSb290O1xuICAgICAgICBmUm9vdCA9IDAuNSAvIGZSb290O1xuICAgICAgICBvdXRbM10gPSAobVtqKjMra10gLSBtW2sqMytqXSkgKiBmUm9vdDtcbiAgICAgICAgb3V0W2pdID0gKG1baiozK2ldICsgbVtpKjMral0pICogZlJvb3Q7XG4gICAgICAgIG91dFtrXSA9IChtW2sqMytpXSArIG1baSozK2tdKSAqIGZSb290O1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgcXVhdGVuaW9uXG4gKlxuICogQHBhcmFtIHtxdWF0fSB2ZWMgdmVjdG9yIHRvIHJlcHJlc2VudCBhcyBhIHN0cmluZ1xuICogQHJldHVybnMge1N0cmluZ30gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3JcbiAqL1xucXVhdC5zdHIgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiAncXVhdCgnICsgYVswXSArICcsICcgKyBhWzFdICsgJywgJyArIGFbMl0gKyAnLCAnICsgYVszXSArICcpJztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcXVhdDtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L3F1YXQuanNcbiAqKiBtb2R1bGUgaWQgPSAxMFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyogQ29weXJpZ2h0IChjKSAyMDE1LCBCcmFuZG9uIEpvbmVzLCBDb2xpbiBNYWNLZW56aWUgSVYuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS4gKi9cblxudmFyIGdsTWF0cml4ID0gcmVxdWlyZShcIi4vY29tbW9uLmpzXCIpO1xuXG4vKipcbiAqIEBjbGFzcyAzIERpbWVuc2lvbmFsIFZlY3RvclxuICogQG5hbWUgdmVjM1xuICovXG52YXIgdmVjMyA9IHt9O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcsIGVtcHR5IHZlYzNcbiAqXG4gKiBAcmV0dXJucyB7dmVjM30gYSBuZXcgM0QgdmVjdG9yXG4gKi9cbnZlYzMuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDMpO1xuICAgIG91dFswXSA9IDA7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgdmVjMyBpbml0aWFsaXplZCB3aXRoIHZhbHVlcyBmcm9tIGFuIGV4aXN0aW5nIHZlY3RvclxuICpcbiAqIEBwYXJhbSB7dmVjM30gYSB2ZWN0b3IgdG8gY2xvbmVcbiAqIEByZXR1cm5zIHt2ZWMzfSBhIG5ldyAzRCB2ZWN0b3JcbiAqL1xudmVjMy5jbG9uZSA9IGZ1bmN0aW9uKGEpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMyk7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB2ZWMzIGluaXRpYWxpemVkIHdpdGggdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFggY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geSBZIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHogWiBjb21wb25lbnRcbiAqIEByZXR1cm5zIHt2ZWMzfSBhIG5ldyAzRCB2ZWN0b3JcbiAqL1xudmVjMy5mcm9tVmFsdWVzID0gZnVuY3Rpb24oeCwgeSwgeikge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSgzKTtcbiAgICBvdXRbMF0gPSB4O1xuICAgIG91dFsxXSA9IHk7XG4gICAgb3V0WzJdID0gejtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDb3B5IHRoZSB2YWx1ZXMgZnJvbSBvbmUgdmVjMyB0byBhbm90aGVyXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgc291cmNlIHZlY3RvclxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLmNvcHkgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWMzIHRvIHRoZSBnaXZlbiB2YWx1ZXNcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHtOdW1iZXJ9IHggWCBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFkgY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geiBaIGNvbXBvbmVudFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnNldCA9IGZ1bmN0aW9uKG91dCwgeCwgeSwgeikge1xuICAgIG91dFswXSA9IHg7XG4gICAgb3V0WzFdID0geTtcbiAgICBvdXRbMl0gPSB6O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFkZHMgdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5hZGQgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdICsgYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdICsgYlsxXTtcbiAgICBvdXRbMl0gPSBhWzJdICsgYlsyXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdHMgdmVjdG9yIGIgZnJvbSB2ZWN0b3IgYVxuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5zdWJ0cmFjdCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gLSBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gLSBiWzFdO1xuICAgIG91dFsyXSA9IGFbMl0gLSBiWzJdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMy5zdWJ0cmFjdH1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMzLnN1YiA9IHZlYzMuc3VidHJhY3Q7XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLm11bHRpcGx5ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAqIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAqIGJbMV07XG4gICAgb3V0WzJdID0gYVsyXSAqIGJbMl07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMzLm11bHRpcGx5fVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzMubXVsID0gdmVjMy5tdWx0aXBseTtcblxuLyoqXG4gKiBEaXZpZGVzIHR3byB2ZWMzJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMuZGl2aWRlID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAvIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAvIGJbMV07XG4gICAgb3V0WzJdID0gYVsyXSAvIGJbMl07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMzLmRpdmlkZX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMzLmRpdiA9IHZlYzMuZGl2aWRlO1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG1pbmltdW0gb2YgdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5taW4gPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBNYXRoLm1pbihhWzBdLCBiWzBdKTtcbiAgICBvdXRbMV0gPSBNYXRoLm1pbihhWzFdLCBiWzFdKTtcbiAgICBvdXRbMl0gPSBNYXRoLm1pbihhWzJdLCBiWzJdKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtYXhpbXVtIG9mIHR3byB2ZWMzJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMubWF4ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gTWF0aC5tYXgoYVswXSwgYlswXSk7XG4gICAgb3V0WzFdID0gTWF0aC5tYXgoYVsxXSwgYlsxXSk7XG4gICAgb3V0WzJdID0gTWF0aC5tYXgoYVsyXSwgYlsyXSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2NhbGVzIGEgdmVjMyBieSBhIHNjYWxhciBudW1iZXJcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSB2ZWN0b3IgdG8gc2NhbGVcbiAqIEBwYXJhbSB7TnVtYmVyfSBiIGFtb3VudCB0byBzY2FsZSB0aGUgdmVjdG9yIGJ5XG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMuc2NhbGUgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdICogYjtcbiAgICBvdXRbMV0gPSBhWzFdICogYjtcbiAgICBvdXRbMl0gPSBhWzJdICogYjtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBZGRzIHR3byB2ZWMzJ3MgYWZ0ZXIgc2NhbGluZyB0aGUgc2Vjb25kIG9wZXJhbmQgYnkgYSBzY2FsYXIgdmFsdWVcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gc2NhbGUgdGhlIGFtb3VudCB0byBzY2FsZSBiIGJ5IGJlZm9yZSBhZGRpbmdcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5zY2FsZUFuZEFkZCA9IGZ1bmN0aW9uKG91dCwgYSwgYiwgc2NhbGUpIHtcbiAgICBvdXRbMF0gPSBhWzBdICsgKGJbMF0gKiBzY2FsZSk7XG4gICAgb3V0WzFdID0gYVsxXSArIChiWzFdICogc2NhbGUpO1xuICAgIG91dFsyXSA9IGFbMl0gKyAoYlsyXSAqIHNjYWxlKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBldWNsaWRpYW4gZGlzdGFuY2UgYmV0d2VlbiB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkaXN0YW5jZSBiZXR3ZWVuIGEgYW5kIGJcbiAqL1xudmVjMy5kaXN0YW5jZSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgeCA9IGJbMF0gLSBhWzBdLFxuICAgICAgICB5ID0gYlsxXSAtIGFbMV0sXG4gICAgICAgIHogPSBiWzJdIC0gYVsyXTtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHgqeCArIHkqeSArIHoqeik7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMy5kaXN0YW5jZX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMzLmRpc3QgPSB2ZWMzLmRpc3RhbmNlO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgZXVjbGlkaWFuIGRpc3RhbmNlIGJldHdlZW4gdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gc3F1YXJlZCBkaXN0YW5jZSBiZXR3ZWVuIGEgYW5kIGJcbiAqL1xudmVjMy5zcXVhcmVkRGlzdGFuY2UgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIHggPSBiWzBdIC0gYVswXSxcbiAgICAgICAgeSA9IGJbMV0gLSBhWzFdLFxuICAgICAgICB6ID0gYlsyXSAtIGFbMl07XG4gICAgcmV0dXJuIHgqeCArIHkqeSArIHoqejtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMzLnNxdWFyZWREaXN0YW5jZX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMzLnNxckRpc3QgPSB2ZWMzLnNxdWFyZWREaXN0YW5jZTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBsZW5ndGggb2YgYSB2ZWMzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBhIHZlY3RvciB0byBjYWxjdWxhdGUgbGVuZ3RoIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBsZW5ndGggb2YgYVxuICovXG52ZWMzLmxlbmd0aCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXSxcbiAgICAgICAgeiA9IGFbMl07XG4gICAgcmV0dXJuIE1hdGguc3FydCh4KnggKyB5KnkgKyB6KnopO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzMubGVuZ3RofVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzMubGVuID0gdmVjMy5sZW5ndGg7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgc3F1YXJlZCBsZW5ndGggb2YgYSB2ZWMzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBhIHZlY3RvciB0byBjYWxjdWxhdGUgc3F1YXJlZCBsZW5ndGggb2ZcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IHNxdWFyZWQgbGVuZ3RoIG9mIGFcbiAqL1xudmVjMy5zcXVhcmVkTGVuZ3RoID0gZnVuY3Rpb24gKGEpIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdLFxuICAgICAgICB6ID0gYVsyXTtcbiAgICByZXR1cm4geCp4ICsgeSp5ICsgeip6O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzMuc3F1YXJlZExlbmd0aH1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMzLnNxckxlbiA9IHZlYzMuc3F1YXJlZExlbmd0aDtcblxuLyoqXG4gKiBOZWdhdGVzIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjM1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdmVjdG9yIHRvIG5lZ2F0ZVxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLm5lZ2F0ZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IC1hWzBdO1xuICAgIG91dFsxXSA9IC1hWzFdO1xuICAgIG91dFsyXSA9IC1hWzJdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGludmVyc2Ugb2YgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWMzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB2ZWN0b3IgdG8gaW52ZXJ0XG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMuaW52ZXJzZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICBvdXRbMF0gPSAxLjAgLyBhWzBdO1xuICBvdXRbMV0gPSAxLjAgLyBhWzFdO1xuICBvdXRbMl0gPSAxLjAgLyBhWzJdO1xuICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBOb3JtYWxpemUgYSB2ZWMzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB2ZWN0b3IgdG8gbm9ybWFsaXplXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMubm9ybWFsaXplID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXSxcbiAgICAgICAgeiA9IGFbMl07XG4gICAgdmFyIGxlbiA9IHgqeCArIHkqeSArIHoqejtcbiAgICBpZiAobGVuID4gMCkge1xuICAgICAgICAvL1RPRE86IGV2YWx1YXRlIHVzZSBvZiBnbG1faW52c3FydCBoZXJlP1xuICAgICAgICBsZW4gPSAxIC8gTWF0aC5zcXJ0KGxlbik7XG4gICAgICAgIG91dFswXSA9IGFbMF0gKiBsZW47XG4gICAgICAgIG91dFsxXSA9IGFbMV0gKiBsZW47XG4gICAgICAgIG91dFsyXSA9IGFbMl0gKiBsZW47XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGRvdCBwcm9kdWN0IG9mIHR3byB2ZWMzJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRvdCBwcm9kdWN0IG9mIGEgYW5kIGJcbiAqL1xudmVjMy5kb3QgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhWzBdICogYlswXSArIGFbMV0gKiBiWzFdICsgYVsyXSAqIGJbMl07XG59O1xuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBjcm9zcyBwcm9kdWN0IG9mIHR3byB2ZWMzJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMuY3Jvc3MgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICB2YXIgYXggPSBhWzBdLCBheSA9IGFbMV0sIGF6ID0gYVsyXSxcbiAgICAgICAgYnggPSBiWzBdLCBieSA9IGJbMV0sIGJ6ID0gYlsyXTtcblxuICAgIG91dFswXSA9IGF5ICogYnogLSBheiAqIGJ5O1xuICAgIG91dFsxXSA9IGF6ICogYnggLSBheCAqIGJ6O1xuICAgIG91dFsyXSA9IGF4ICogYnkgLSBheSAqIGJ4O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgbGluZWFyIGludGVycG9sYXRpb24gYmV0d2VlbiB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHtOdW1iZXJ9IHQgaW50ZXJwb2xhdGlvbiBhbW91bnQgYmV0d2VlbiB0aGUgdHdvIGlucHV0c1xuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLmxlcnAgPSBmdW5jdGlvbiAob3V0LCBhLCBiLCB0KSB7XG4gICAgdmFyIGF4ID0gYVswXSxcbiAgICAgICAgYXkgPSBhWzFdLFxuICAgICAgICBheiA9IGFbMl07XG4gICAgb3V0WzBdID0gYXggKyB0ICogKGJbMF0gLSBheCk7XG4gICAgb3V0WzFdID0gYXkgKyB0ICogKGJbMV0gLSBheSk7XG4gICAgb3V0WzJdID0gYXogKyB0ICogKGJbMl0gLSBheik7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgYSBoZXJtaXRlIGludGVycG9sYXRpb24gd2l0aCB0d28gY29udHJvbCBwb2ludHNcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGMgdGhlIHRoaXJkIG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gZCB0aGUgZm91cnRoIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSB0IGludGVycG9sYXRpb24gYW1vdW50IGJldHdlZW4gdGhlIHR3byBpbnB1dHNcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5oZXJtaXRlID0gZnVuY3Rpb24gKG91dCwgYSwgYiwgYywgZCwgdCkge1xuICB2YXIgZmFjdG9yVGltZXMyID0gdCAqIHQsXG4gICAgICBmYWN0b3IxID0gZmFjdG9yVGltZXMyICogKDIgKiB0IC0gMykgKyAxLFxuICAgICAgZmFjdG9yMiA9IGZhY3RvclRpbWVzMiAqICh0IC0gMikgKyB0LFxuICAgICAgZmFjdG9yMyA9IGZhY3RvclRpbWVzMiAqICh0IC0gMSksXG4gICAgICBmYWN0b3I0ID0gZmFjdG9yVGltZXMyICogKDMgLSAyICogdCk7XG4gIFxuICBvdXRbMF0gPSBhWzBdICogZmFjdG9yMSArIGJbMF0gKiBmYWN0b3IyICsgY1swXSAqIGZhY3RvcjMgKyBkWzBdICogZmFjdG9yNDtcbiAgb3V0WzFdID0gYVsxXSAqIGZhY3RvcjEgKyBiWzFdICogZmFjdG9yMiArIGNbMV0gKiBmYWN0b3IzICsgZFsxXSAqIGZhY3RvcjQ7XG4gIG91dFsyXSA9IGFbMl0gKiBmYWN0b3IxICsgYlsyXSAqIGZhY3RvcjIgKyBjWzJdICogZmFjdG9yMyArIGRbMl0gKiBmYWN0b3I0O1xuICBcbiAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgYSBiZXppZXIgaW50ZXJwb2xhdGlvbiB3aXRoIHR3byBjb250cm9sIHBvaW50c1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYyB0aGUgdGhpcmQgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBkIHRoZSBmb3VydGggb3BlcmFuZFxuICogQHBhcmFtIHtOdW1iZXJ9IHQgaW50ZXJwb2xhdGlvbiBhbW91bnQgYmV0d2VlbiB0aGUgdHdvIGlucHV0c1xuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLmJlemllciA9IGZ1bmN0aW9uIChvdXQsIGEsIGIsIGMsIGQsIHQpIHtcbiAgdmFyIGludmVyc2VGYWN0b3IgPSAxIC0gdCxcbiAgICAgIGludmVyc2VGYWN0b3JUaW1lc1R3byA9IGludmVyc2VGYWN0b3IgKiBpbnZlcnNlRmFjdG9yLFxuICAgICAgZmFjdG9yVGltZXMyID0gdCAqIHQsXG4gICAgICBmYWN0b3IxID0gaW52ZXJzZUZhY3RvclRpbWVzVHdvICogaW52ZXJzZUZhY3RvcixcbiAgICAgIGZhY3RvcjIgPSAzICogdCAqIGludmVyc2VGYWN0b3JUaW1lc1R3byxcbiAgICAgIGZhY3RvcjMgPSAzICogZmFjdG9yVGltZXMyICogaW52ZXJzZUZhY3RvcixcbiAgICAgIGZhY3RvcjQgPSBmYWN0b3JUaW1lczIgKiB0O1xuICBcbiAgb3V0WzBdID0gYVswXSAqIGZhY3RvcjEgKyBiWzBdICogZmFjdG9yMiArIGNbMF0gKiBmYWN0b3IzICsgZFswXSAqIGZhY3RvcjQ7XG4gIG91dFsxXSA9IGFbMV0gKiBmYWN0b3IxICsgYlsxXSAqIGZhY3RvcjIgKyBjWzFdICogZmFjdG9yMyArIGRbMV0gKiBmYWN0b3I0O1xuICBvdXRbMl0gPSBhWzJdICogZmFjdG9yMSArIGJbMl0gKiBmYWN0b3IyICsgY1syXSAqIGZhY3RvcjMgKyBkWzJdICogZmFjdG9yNDtcbiAgXG4gIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHJhbmRvbSB2ZWN0b3Igd2l0aCB0aGUgZ2l2ZW4gc2NhbGVcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHtOdW1iZXJ9IFtzY2FsZV0gTGVuZ3RoIG9mIHRoZSByZXN1bHRpbmcgdmVjdG9yLiBJZiBvbW1pdHRlZCwgYSB1bml0IHZlY3RvciB3aWxsIGJlIHJldHVybmVkXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMucmFuZG9tID0gZnVuY3Rpb24gKG91dCwgc2NhbGUpIHtcbiAgICBzY2FsZSA9IHNjYWxlIHx8IDEuMDtcblxuICAgIHZhciByID0gZ2xNYXRyaXguUkFORE9NKCkgKiAyLjAgKiBNYXRoLlBJO1xuICAgIHZhciB6ID0gKGdsTWF0cml4LlJBTkRPTSgpICogMi4wKSAtIDEuMDtcbiAgICB2YXIgelNjYWxlID0gTWF0aC5zcXJ0KDEuMC16KnopICogc2NhbGU7XG5cbiAgICBvdXRbMF0gPSBNYXRoLmNvcyhyKSAqIHpTY2FsZTtcbiAgICBvdXRbMV0gPSBNYXRoLnNpbihyKSAqIHpTY2FsZTtcbiAgICBvdXRbMl0gPSB6ICogc2NhbGU7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNmb3JtcyB0aGUgdmVjMyB3aXRoIGEgbWF0NC5cbiAqIDR0aCB2ZWN0b3IgY29tcG9uZW50IGlzIGltcGxpY2l0bHkgJzEnXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICogQHBhcmFtIHttYXQ0fSBtIG1hdHJpeCB0byB0cmFuc2Zvcm0gd2l0aFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnRyYW5zZm9ybU1hdDQgPSBmdW5jdGlvbihvdXQsIGEsIG0pIHtcbiAgICB2YXIgeCA9IGFbMF0sIHkgPSBhWzFdLCB6ID0gYVsyXSxcbiAgICAgICAgdyA9IG1bM10gKiB4ICsgbVs3XSAqIHkgKyBtWzExXSAqIHogKyBtWzE1XTtcbiAgICB3ID0gdyB8fCAxLjA7XG4gICAgb3V0WzBdID0gKG1bMF0gKiB4ICsgbVs0XSAqIHkgKyBtWzhdICogeiArIG1bMTJdKSAvIHc7XG4gICAgb3V0WzFdID0gKG1bMV0gKiB4ICsgbVs1XSAqIHkgKyBtWzldICogeiArIG1bMTNdKSAvIHc7XG4gICAgb3V0WzJdID0gKG1bMl0gKiB4ICsgbVs2XSAqIHkgKyBtWzEwXSAqIHogKyBtWzE0XSkgLyB3O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzMgd2l0aCBhIG1hdDMuXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICogQHBhcmFtIHttYXQ0fSBtIHRoZSAzeDMgbWF0cml4IHRvIHRyYW5zZm9ybSB3aXRoXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMudHJhbnNmb3JtTWF0MyA9IGZ1bmN0aW9uKG91dCwgYSwgbSkge1xuICAgIHZhciB4ID0gYVswXSwgeSA9IGFbMV0sIHogPSBhWzJdO1xuICAgIG91dFswXSA9IHggKiBtWzBdICsgeSAqIG1bM10gKyB6ICogbVs2XTtcbiAgICBvdXRbMV0gPSB4ICogbVsxXSArIHkgKiBtWzRdICsgeiAqIG1bN107XG4gICAgb3V0WzJdID0geCAqIG1bMl0gKyB5ICogbVs1XSArIHogKiBtWzhdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzMgd2l0aCBhIHF1YXRcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSB2ZWN0b3IgdG8gdHJhbnNmb3JtXG4gKiBAcGFyYW0ge3F1YXR9IHEgcXVhdGVybmlvbiB0byB0cmFuc2Zvcm0gd2l0aFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnRyYW5zZm9ybVF1YXQgPSBmdW5jdGlvbihvdXQsIGEsIHEpIHtcbiAgICAvLyBiZW5jaG1hcmtzOiBodHRwOi8vanNwZXJmLmNvbS9xdWF0ZXJuaW9uLXRyYW5zZm9ybS12ZWMzLWltcGxlbWVudGF0aW9uc1xuXG4gICAgdmFyIHggPSBhWzBdLCB5ID0gYVsxXSwgeiA9IGFbMl0sXG4gICAgICAgIHF4ID0gcVswXSwgcXkgPSBxWzFdLCBxeiA9IHFbMl0sIHF3ID0gcVszXSxcblxuICAgICAgICAvLyBjYWxjdWxhdGUgcXVhdCAqIHZlY1xuICAgICAgICBpeCA9IHF3ICogeCArIHF5ICogeiAtIHF6ICogeSxcbiAgICAgICAgaXkgPSBxdyAqIHkgKyBxeiAqIHggLSBxeCAqIHosXG4gICAgICAgIGl6ID0gcXcgKiB6ICsgcXggKiB5IC0gcXkgKiB4LFxuICAgICAgICBpdyA9IC1xeCAqIHggLSBxeSAqIHkgLSBxeiAqIHo7XG5cbiAgICAvLyBjYWxjdWxhdGUgcmVzdWx0ICogaW52ZXJzZSBxdWF0XG4gICAgb3V0WzBdID0gaXggKiBxdyArIGl3ICogLXF4ICsgaXkgKiAtcXogLSBpeiAqIC1xeTtcbiAgICBvdXRbMV0gPSBpeSAqIHF3ICsgaXcgKiAtcXkgKyBpeiAqIC1xeCAtIGl4ICogLXF6O1xuICAgIG91dFsyXSA9IGl6ICogcXcgKyBpdyAqIC1xeiArIGl4ICogLXF5IC0gaXkgKiAtcXg7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUm90YXRlIGEgM0QgdmVjdG9yIGFyb3VuZCB0aGUgeC1heGlzXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCBUaGUgcmVjZWl2aW5nIHZlYzNcbiAqIEBwYXJhbSB7dmVjM30gYSBUaGUgdmVjMyBwb2ludCB0byByb3RhdGVcbiAqIEBwYXJhbSB7dmVjM30gYiBUaGUgb3JpZ2luIG9mIHRoZSByb3RhdGlvblxuICogQHBhcmFtIHtOdW1iZXJ9IGMgVGhlIGFuZ2xlIG9mIHJvdGF0aW9uXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMucm90YXRlWCA9IGZ1bmN0aW9uKG91dCwgYSwgYiwgYyl7XG4gICB2YXIgcCA9IFtdLCByPVtdO1xuXHQgIC8vVHJhbnNsYXRlIHBvaW50IHRvIHRoZSBvcmlnaW5cblx0ICBwWzBdID0gYVswXSAtIGJbMF07XG5cdCAgcFsxXSA9IGFbMV0gLSBiWzFdO1xuICBcdHBbMl0gPSBhWzJdIC0gYlsyXTtcblxuXHQgIC8vcGVyZm9ybSByb3RhdGlvblxuXHQgIHJbMF0gPSBwWzBdO1xuXHQgIHJbMV0gPSBwWzFdKk1hdGguY29zKGMpIC0gcFsyXSpNYXRoLnNpbihjKTtcblx0ICByWzJdID0gcFsxXSpNYXRoLnNpbihjKSArIHBbMl0qTWF0aC5jb3MoYyk7XG5cblx0ICAvL3RyYW5zbGF0ZSB0byBjb3JyZWN0IHBvc2l0aW9uXG5cdCAgb3V0WzBdID0gclswXSArIGJbMF07XG5cdCAgb3V0WzFdID0gclsxXSArIGJbMV07XG5cdCAgb3V0WzJdID0gclsyXSArIGJbMl07XG5cbiAgXHRyZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSb3RhdGUgYSAzRCB2ZWN0b3IgYXJvdW5kIHRoZSB5LWF4aXNcbiAqIEBwYXJhbSB7dmVjM30gb3V0IFRoZSByZWNlaXZpbmcgdmVjM1xuICogQHBhcmFtIHt2ZWMzfSBhIFRoZSB2ZWMzIHBvaW50IHRvIHJvdGF0ZVxuICogQHBhcmFtIHt2ZWMzfSBiIFRoZSBvcmlnaW4gb2YgdGhlIHJvdGF0aW9uXG4gKiBAcGFyYW0ge051bWJlcn0gYyBUaGUgYW5nbGUgb2Ygcm90YXRpb25cbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5yb3RhdGVZID0gZnVuY3Rpb24ob3V0LCBhLCBiLCBjKXtcbiAgXHR2YXIgcCA9IFtdLCByPVtdO1xuICBcdC8vVHJhbnNsYXRlIHBvaW50IHRvIHRoZSBvcmlnaW5cbiAgXHRwWzBdID0gYVswXSAtIGJbMF07XG4gIFx0cFsxXSA9IGFbMV0gLSBiWzFdO1xuICBcdHBbMl0gPSBhWzJdIC0gYlsyXTtcbiAgXG4gIFx0Ly9wZXJmb3JtIHJvdGF0aW9uXG4gIFx0clswXSA9IHBbMl0qTWF0aC5zaW4oYykgKyBwWzBdKk1hdGguY29zKGMpO1xuICBcdHJbMV0gPSBwWzFdO1xuICBcdHJbMl0gPSBwWzJdKk1hdGguY29zKGMpIC0gcFswXSpNYXRoLnNpbihjKTtcbiAgXG4gIFx0Ly90cmFuc2xhdGUgdG8gY29ycmVjdCBwb3NpdGlvblxuICBcdG91dFswXSA9IHJbMF0gKyBiWzBdO1xuICBcdG91dFsxXSA9IHJbMV0gKyBiWzFdO1xuICBcdG91dFsyXSA9IHJbMl0gKyBiWzJdO1xuICBcbiAgXHRyZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSb3RhdGUgYSAzRCB2ZWN0b3IgYXJvdW5kIHRoZSB6LWF4aXNcbiAqIEBwYXJhbSB7dmVjM30gb3V0IFRoZSByZWNlaXZpbmcgdmVjM1xuICogQHBhcmFtIHt2ZWMzfSBhIFRoZSB2ZWMzIHBvaW50IHRvIHJvdGF0ZVxuICogQHBhcmFtIHt2ZWMzfSBiIFRoZSBvcmlnaW4gb2YgdGhlIHJvdGF0aW9uXG4gKiBAcGFyYW0ge051bWJlcn0gYyBUaGUgYW5nbGUgb2Ygcm90YXRpb25cbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5yb3RhdGVaID0gZnVuY3Rpb24ob3V0LCBhLCBiLCBjKXtcbiAgXHR2YXIgcCA9IFtdLCByPVtdO1xuICBcdC8vVHJhbnNsYXRlIHBvaW50IHRvIHRoZSBvcmlnaW5cbiAgXHRwWzBdID0gYVswXSAtIGJbMF07XG4gIFx0cFsxXSA9IGFbMV0gLSBiWzFdO1xuICBcdHBbMl0gPSBhWzJdIC0gYlsyXTtcbiAgXG4gIFx0Ly9wZXJmb3JtIHJvdGF0aW9uXG4gIFx0clswXSA9IHBbMF0qTWF0aC5jb3MoYykgLSBwWzFdKk1hdGguc2luKGMpO1xuICBcdHJbMV0gPSBwWzBdKk1hdGguc2luKGMpICsgcFsxXSpNYXRoLmNvcyhjKTtcbiAgXHRyWzJdID0gcFsyXTtcbiAgXG4gIFx0Ly90cmFuc2xhdGUgdG8gY29ycmVjdCBwb3NpdGlvblxuICBcdG91dFswXSA9IHJbMF0gKyBiWzBdO1xuICBcdG91dFsxXSA9IHJbMV0gKyBiWzFdO1xuICBcdG91dFsyXSA9IHJbMl0gKyBiWzJdO1xuICBcbiAgXHRyZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBQZXJmb3JtIHNvbWUgb3BlcmF0aW9uIG92ZXIgYW4gYXJyYXkgb2YgdmVjM3MuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYSB0aGUgYXJyYXkgb2YgdmVjdG9ycyB0byBpdGVyYXRlIG92ZXJcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdHJpZGUgTnVtYmVyIG9mIGVsZW1lbnRzIGJldHdlZW4gdGhlIHN0YXJ0IG9mIGVhY2ggdmVjMy4gSWYgMCBhc3N1bWVzIHRpZ2h0bHkgcGFja2VkXG4gKiBAcGFyYW0ge051bWJlcn0gb2Zmc2V0IE51bWJlciBvZiBlbGVtZW50cyB0byBza2lwIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFycmF5XG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgTnVtYmVyIG9mIHZlYzNzIHRvIGl0ZXJhdGUgb3Zlci4gSWYgMCBpdGVyYXRlcyBvdmVyIGVudGlyZSBhcnJheVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCB2ZWN0b3IgaW4gdGhlIGFycmF5XG4gKiBAcGFyYW0ge09iamVjdH0gW2FyZ10gYWRkaXRpb25hbCBhcmd1bWVudCB0byBwYXNzIHRvIGZuXG4gKiBAcmV0dXJucyB7QXJyYXl9IGFcbiAqIEBmdW5jdGlvblxuICovXG52ZWMzLmZvckVhY2ggPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZlYyA9IHZlYzMuY3JlYXRlKCk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oYSwgc3RyaWRlLCBvZmZzZXQsIGNvdW50LCBmbiwgYXJnKSB7XG4gICAgICAgIHZhciBpLCBsO1xuICAgICAgICBpZighc3RyaWRlKSB7XG4gICAgICAgICAgICBzdHJpZGUgPSAzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIW9mZnNldCkge1xuICAgICAgICAgICAgb2Zmc2V0ID0gMDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYoY291bnQpIHtcbiAgICAgICAgICAgIGwgPSBNYXRoLm1pbigoY291bnQgKiBzdHJpZGUpICsgb2Zmc2V0LCBhLmxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsID0gYS5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaSA9IG9mZnNldDsgaSA8IGw7IGkgKz0gc3RyaWRlKSB7XG4gICAgICAgICAgICB2ZWNbMF0gPSBhW2ldOyB2ZWNbMV0gPSBhW2krMV07IHZlY1syXSA9IGFbaSsyXTtcbiAgICAgICAgICAgIGZuKHZlYywgdmVjLCBhcmcpO1xuICAgICAgICAgICAgYVtpXSA9IHZlY1swXTsgYVtpKzFdID0gdmVjWzFdOyBhW2krMl0gPSB2ZWNbMl07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBhO1xuICAgIH07XG59KSgpO1xuXG4vKipcbiAqIEdldCB0aGUgYW5nbGUgYmV0d2VlbiB0d28gM0QgdmVjdG9yc1xuICogQHBhcmFtIHt2ZWMzfSBhIFRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgVGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgYW5nbGUgaW4gcmFkaWFuc1xuICovXG52ZWMzLmFuZ2xlID0gZnVuY3Rpb24oYSwgYikge1xuICAgXG4gICAgdmFyIHRlbXBBID0gdmVjMy5mcm9tVmFsdWVzKGFbMF0sIGFbMV0sIGFbMl0pO1xuICAgIHZhciB0ZW1wQiA9IHZlYzMuZnJvbVZhbHVlcyhiWzBdLCBiWzFdLCBiWzJdKTtcbiBcbiAgICB2ZWMzLm5vcm1hbGl6ZSh0ZW1wQSwgdGVtcEEpO1xuICAgIHZlYzMubm9ybWFsaXplKHRlbXBCLCB0ZW1wQik7XG4gXG4gICAgdmFyIGNvc2luZSA9IHZlYzMuZG90KHRlbXBBLCB0ZW1wQik7XG5cbiAgICBpZihjb3NpbmUgPiAxLjApe1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gTWF0aC5hY29zKGNvc2luZSk7XG4gICAgfSAgICAgXG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSB2ZWN0b3JcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IHZlYyB2ZWN0b3IgdG8gcmVwcmVzZW50IGFzIGEgc3RyaW5nXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHZlY3RvclxuICovXG52ZWMzLnN0ciA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuICd2ZWMzKCcgKyBhWzBdICsgJywgJyArIGFbMV0gKyAnLCAnICsgYVsyXSArICcpJztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdmVjMztcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L3ZlYzMuanNcbiAqKiBtb2R1bGUgaWQgPSAxMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyogQ29weXJpZ2h0IChjKSAyMDE1LCBCcmFuZG9uIEpvbmVzLCBDb2xpbiBNYWNLZW56aWUgSVYuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS4gKi9cblxudmFyIGdsTWF0cml4ID0gcmVxdWlyZShcIi4vY29tbW9uLmpzXCIpO1xuXG4vKipcbiAqIEBjbGFzcyA0IERpbWVuc2lvbmFsIFZlY3RvclxuICogQG5hbWUgdmVjNFxuICovXG52YXIgdmVjNCA9IHt9O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcsIGVtcHR5IHZlYzRcbiAqXG4gKiBAcmV0dXJucyB7dmVjNH0gYSBuZXcgNEQgdmVjdG9yXG4gKi9cbnZlYzQuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDQpO1xuICAgIG91dFswXSA9IDA7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDA7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB2ZWM0IGluaXRpYWxpemVkIHdpdGggdmFsdWVzIGZyb20gYW4gZXhpc3RpbmcgdmVjdG9yXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBhIHZlY3RvciB0byBjbG9uZVxuICogQHJldHVybnMge3ZlYzR9IGEgbmV3IDREIHZlY3RvclxuICovXG52ZWM0LmNsb25lID0gZnVuY3Rpb24oYSkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSg0KTtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgdmVjNCBpbml0aWFsaXplZCB3aXRoIHRoZSBnaXZlbiB2YWx1ZXNcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgWSBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFogY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0gdyBXIGNvbXBvbmVudFxuICogQHJldHVybnMge3ZlYzR9IGEgbmV3IDREIHZlY3RvclxuICovXG52ZWM0LmZyb21WYWx1ZXMgPSBmdW5jdGlvbih4LCB5LCB6LCB3KSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDQpO1xuICAgIG91dFswXSA9IHg7XG4gICAgb3V0WzFdID0geTtcbiAgICBvdXRbMl0gPSB6O1xuICAgIG91dFszXSA9IHc7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ29weSB0aGUgdmFsdWVzIGZyb20gb25lIHZlYzQgdG8gYW5vdGhlclxuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIHNvdXJjZSB2ZWN0b3JcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5jb3B5ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWM0IHRvIHRoZSBnaXZlbiB2YWx1ZXNcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHtOdW1iZXJ9IHggWCBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFkgY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geiBaIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHcgVyBjb21wb25lbnRcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5zZXQgPSBmdW5jdGlvbihvdXQsIHgsIHksIHosIHcpIHtcbiAgICBvdXRbMF0gPSB4O1xuICAgIG91dFsxXSA9IHk7XG4gICAgb3V0WzJdID0gejtcbiAgICBvdXRbM10gPSB3O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFkZHMgdHdvIHZlYzQnc1xuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5hZGQgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdICsgYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdICsgYlsxXTtcbiAgICBvdXRbMl0gPSBhWzJdICsgYlsyXTtcbiAgICBvdXRbM10gPSBhWzNdICsgYlszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdHMgdmVjdG9yIGIgZnJvbSB2ZWN0b3IgYVxuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5zdWJ0cmFjdCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gLSBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gLSBiWzFdO1xuICAgIG91dFsyXSA9IGFbMl0gLSBiWzJdO1xuICAgIG91dFszXSA9IGFbM10gLSBiWzNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjNC5zdWJ0cmFjdH1cbiAqIEBmdW5jdGlvblxuICovXG52ZWM0LnN1YiA9IHZlYzQuc3VidHJhY3Q7XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gdmVjNCdzXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0Lm11bHRpcGx5ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAqIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAqIGJbMV07XG4gICAgb3V0WzJdID0gYVsyXSAqIGJbMl07XG4gICAgb3V0WzNdID0gYVszXSAqIGJbM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWM0Lm11bHRpcGx5fVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzQubXVsID0gdmVjNC5tdWx0aXBseTtcblxuLyoqXG4gKiBEaXZpZGVzIHR3byB2ZWM0J3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQuZGl2aWRlID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAvIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAvIGJbMV07XG4gICAgb3V0WzJdID0gYVsyXSAvIGJbMl07XG4gICAgb3V0WzNdID0gYVszXSAvIGJbM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWM0LmRpdmlkZX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWM0LmRpdiA9IHZlYzQuZGl2aWRlO1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG1pbmltdW0gb2YgdHdvIHZlYzQnc1xuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5taW4gPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBNYXRoLm1pbihhWzBdLCBiWzBdKTtcbiAgICBvdXRbMV0gPSBNYXRoLm1pbihhWzFdLCBiWzFdKTtcbiAgICBvdXRbMl0gPSBNYXRoLm1pbihhWzJdLCBiWzJdKTtcbiAgICBvdXRbM10gPSBNYXRoLm1pbihhWzNdLCBiWzNdKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtYXhpbXVtIG9mIHR3byB2ZWM0J3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQubWF4ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gTWF0aC5tYXgoYVswXSwgYlswXSk7XG4gICAgb3V0WzFdID0gTWF0aC5tYXgoYVsxXSwgYlsxXSk7XG4gICAgb3V0WzJdID0gTWF0aC5tYXgoYVsyXSwgYlsyXSk7XG4gICAgb3V0WzNdID0gTWF0aC5tYXgoYVszXSwgYlszXSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2NhbGVzIGEgdmVjNCBieSBhIHNjYWxhciBudW1iZXJcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSB2ZWN0b3IgdG8gc2NhbGVcbiAqIEBwYXJhbSB7TnVtYmVyfSBiIGFtb3VudCB0byBzY2FsZSB0aGUgdmVjdG9yIGJ5XG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQuc2NhbGUgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdICogYjtcbiAgICBvdXRbMV0gPSBhWzFdICogYjtcbiAgICBvdXRbMl0gPSBhWzJdICogYjtcbiAgICBvdXRbM10gPSBhWzNdICogYjtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBZGRzIHR3byB2ZWM0J3MgYWZ0ZXIgc2NhbGluZyB0aGUgc2Vjb25kIG9wZXJhbmQgYnkgYSBzY2FsYXIgdmFsdWVcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gc2NhbGUgdGhlIGFtb3VudCB0byBzY2FsZSBiIGJ5IGJlZm9yZSBhZGRpbmdcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5zY2FsZUFuZEFkZCA9IGZ1bmN0aW9uKG91dCwgYSwgYiwgc2NhbGUpIHtcbiAgICBvdXRbMF0gPSBhWzBdICsgKGJbMF0gKiBzY2FsZSk7XG4gICAgb3V0WzFdID0gYVsxXSArIChiWzFdICogc2NhbGUpO1xuICAgIG91dFsyXSA9IGFbMl0gKyAoYlsyXSAqIHNjYWxlKTtcbiAgICBvdXRbM10gPSBhWzNdICsgKGJbM10gKiBzY2FsZSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZXVjbGlkaWFuIGRpc3RhbmNlIGJldHdlZW4gdHdvIHZlYzQnc1xuICpcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gZGlzdGFuY2UgYmV0d2VlbiBhIGFuZCBiXG4gKi9cbnZlYzQuZGlzdGFuY2UgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIHggPSBiWzBdIC0gYVswXSxcbiAgICAgICAgeSA9IGJbMV0gLSBhWzFdLFxuICAgICAgICB6ID0gYlsyXSAtIGFbMl0sXG4gICAgICAgIHcgPSBiWzNdIC0gYVszXTtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHgqeCArIHkqeSArIHoqeiArIHcqdyk7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjNC5kaXN0YW5jZX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWM0LmRpc3QgPSB2ZWM0LmRpc3RhbmNlO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgZXVjbGlkaWFuIGRpc3RhbmNlIGJldHdlZW4gdHdvIHZlYzQnc1xuICpcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gc3F1YXJlZCBkaXN0YW5jZSBiZXR3ZWVuIGEgYW5kIGJcbiAqL1xudmVjNC5zcXVhcmVkRGlzdGFuY2UgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIHggPSBiWzBdIC0gYVswXSxcbiAgICAgICAgeSA9IGJbMV0gLSBhWzFdLFxuICAgICAgICB6ID0gYlsyXSAtIGFbMl0sXG4gICAgICAgIHcgPSBiWzNdIC0gYVszXTtcbiAgICByZXR1cm4geCp4ICsgeSp5ICsgeip6ICsgdyp3O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzQuc3F1YXJlZERpc3RhbmNlfVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzQuc3FyRGlzdCA9IHZlYzQuc3F1YXJlZERpc3RhbmNlO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGxlbmd0aCBvZiBhIHZlYzRcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdmVjdG9yIHRvIGNhbGN1bGF0ZSBsZW5ndGggb2ZcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGxlbmd0aCBvZiBhXG4gKi9cbnZlYzQubGVuZ3RoID0gZnVuY3Rpb24gKGEpIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdLFxuICAgICAgICB6ID0gYVsyXSxcbiAgICAgICAgdyA9IGFbM107XG4gICAgcmV0dXJuIE1hdGguc3FydCh4KnggKyB5KnkgKyB6KnogKyB3KncpO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzQubGVuZ3RofVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzQubGVuID0gdmVjNC5sZW5ndGg7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgc3F1YXJlZCBsZW5ndGggb2YgYSB2ZWM0XG4gKlxuICogQHBhcmFtIHt2ZWM0fSBhIHZlY3RvciB0byBjYWxjdWxhdGUgc3F1YXJlZCBsZW5ndGggb2ZcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IHNxdWFyZWQgbGVuZ3RoIG9mIGFcbiAqL1xudmVjNC5zcXVhcmVkTGVuZ3RoID0gZnVuY3Rpb24gKGEpIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdLFxuICAgICAgICB6ID0gYVsyXSxcbiAgICAgICAgdyA9IGFbM107XG4gICAgcmV0dXJuIHgqeCArIHkqeSArIHoqeiArIHcqdztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWM0LnNxdWFyZWRMZW5ndGh9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjNC5zcXJMZW4gPSB2ZWM0LnNxdWFyZWRMZW5ndGg7XG5cbi8qKlxuICogTmVnYXRlcyB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzRcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHZlY3RvciB0byBuZWdhdGVcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5uZWdhdGUgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSAtYVswXTtcbiAgICBvdXRbMV0gPSAtYVsxXTtcbiAgICBvdXRbMl0gPSAtYVsyXTtcbiAgICBvdXRbM10gPSAtYVszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbnZlcnNlIG9mIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjNFxuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdmVjdG9yIHRvIGludmVydFxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LmludmVyc2UgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgb3V0WzBdID0gMS4wIC8gYVswXTtcbiAgb3V0WzFdID0gMS4wIC8gYVsxXTtcbiAgb3V0WzJdID0gMS4wIC8gYVsyXTtcbiAgb3V0WzNdID0gMS4wIC8gYVszXTtcbiAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogTm9ybWFsaXplIGEgdmVjNFxuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdmVjdG9yIHRvIG5vcm1hbGl6ZVxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0Lm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciB4ID0gYVswXSxcbiAgICAgICAgeSA9IGFbMV0sXG4gICAgICAgIHogPSBhWzJdLFxuICAgICAgICB3ID0gYVszXTtcbiAgICB2YXIgbGVuID0geCp4ICsgeSp5ICsgeip6ICsgdyp3O1xuICAgIGlmIChsZW4gPiAwKSB7XG4gICAgICAgIGxlbiA9IDEgLyBNYXRoLnNxcnQobGVuKTtcbiAgICAgICAgb3V0WzBdID0geCAqIGxlbjtcbiAgICAgICAgb3V0WzFdID0geSAqIGxlbjtcbiAgICAgICAgb3V0WzJdID0geiAqIGxlbjtcbiAgICAgICAgb3V0WzNdID0gdyAqIGxlbjtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZG90IHByb2R1Y3Qgb2YgdHdvIHZlYzQnc1xuICpcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gZG90IHByb2R1Y3Qgb2YgYSBhbmQgYlxuICovXG52ZWM0LmRvdCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGFbMF0gKiBiWzBdICsgYVsxXSAqIGJbMV0gKyBhWzJdICogYlsyXSArIGFbM10gKiBiWzNdO1xufTtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIGxpbmVhciBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdHdvIHZlYzQnc1xuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSB0IGludGVycG9sYXRpb24gYW1vdW50IGJldHdlZW4gdGhlIHR3byBpbnB1dHNcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5sZXJwID0gZnVuY3Rpb24gKG91dCwgYSwgYiwgdCkge1xuICAgIHZhciBheCA9IGFbMF0sXG4gICAgICAgIGF5ID0gYVsxXSxcbiAgICAgICAgYXogPSBhWzJdLFxuICAgICAgICBhdyA9IGFbM107XG4gICAgb3V0WzBdID0gYXggKyB0ICogKGJbMF0gLSBheCk7XG4gICAgb3V0WzFdID0gYXkgKyB0ICogKGJbMV0gLSBheSk7XG4gICAgb3V0WzJdID0gYXogKyB0ICogKGJbMl0gLSBheik7XG4gICAgb3V0WzNdID0gYXcgKyB0ICogKGJbM10gLSBhdyk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgcmFuZG9tIHZlY3RvciB3aXRoIHRoZSBnaXZlbiBzY2FsZVxuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge051bWJlcn0gW3NjYWxlXSBMZW5ndGggb2YgdGhlIHJlc3VsdGluZyB2ZWN0b3IuIElmIG9tbWl0dGVkLCBhIHVuaXQgdmVjdG9yIHdpbGwgYmUgcmV0dXJuZWRcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5yYW5kb20gPSBmdW5jdGlvbiAob3V0LCBzY2FsZSkge1xuICAgIHNjYWxlID0gc2NhbGUgfHwgMS4wO1xuXG4gICAgLy9UT0RPOiBUaGlzIGlzIGEgcHJldHR5IGF3ZnVsIHdheSBvZiBkb2luZyB0aGlzLiBGaW5kIHNvbWV0aGluZyBiZXR0ZXIuXG4gICAgb3V0WzBdID0gZ2xNYXRyaXguUkFORE9NKCk7XG4gICAgb3V0WzFdID0gZ2xNYXRyaXguUkFORE9NKCk7XG4gICAgb3V0WzJdID0gZ2xNYXRyaXguUkFORE9NKCk7XG4gICAgb3V0WzNdID0gZ2xNYXRyaXguUkFORE9NKCk7XG4gICAgdmVjNC5ub3JtYWxpemUob3V0LCBvdXQpO1xuICAgIHZlYzQuc2NhbGUob3V0LCBvdXQsIHNjYWxlKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWM0IHdpdGggYSBtYXQ0LlxuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7bWF0NH0gbSBtYXRyaXggdG8gdHJhbnNmb3JtIHdpdGhcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC50cmFuc2Zvcm1NYXQ0ID0gZnVuY3Rpb24ob3V0LCBhLCBtKSB7XG4gICAgdmFyIHggPSBhWzBdLCB5ID0gYVsxXSwgeiA9IGFbMl0sIHcgPSBhWzNdO1xuICAgIG91dFswXSA9IG1bMF0gKiB4ICsgbVs0XSAqIHkgKyBtWzhdICogeiArIG1bMTJdICogdztcbiAgICBvdXRbMV0gPSBtWzFdICogeCArIG1bNV0gKiB5ICsgbVs5XSAqIHogKyBtWzEzXSAqIHc7XG4gICAgb3V0WzJdID0gbVsyXSAqIHggKyBtWzZdICogeSArIG1bMTBdICogeiArIG1bMTRdICogdztcbiAgICBvdXRbM10gPSBtWzNdICogeCArIG1bN10gKiB5ICsgbVsxMV0gKiB6ICsgbVsxNV0gKiB3O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzQgd2l0aCBhIHF1YXRcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSB2ZWN0b3IgdG8gdHJhbnNmb3JtXG4gKiBAcGFyYW0ge3F1YXR9IHEgcXVhdGVybmlvbiB0byB0cmFuc2Zvcm0gd2l0aFxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LnRyYW5zZm9ybVF1YXQgPSBmdW5jdGlvbihvdXQsIGEsIHEpIHtcbiAgICB2YXIgeCA9IGFbMF0sIHkgPSBhWzFdLCB6ID0gYVsyXSxcbiAgICAgICAgcXggPSBxWzBdLCBxeSA9IHFbMV0sIHF6ID0gcVsyXSwgcXcgPSBxWzNdLFxuXG4gICAgICAgIC8vIGNhbGN1bGF0ZSBxdWF0ICogdmVjXG4gICAgICAgIGl4ID0gcXcgKiB4ICsgcXkgKiB6IC0gcXogKiB5LFxuICAgICAgICBpeSA9IHF3ICogeSArIHF6ICogeCAtIHF4ICogeixcbiAgICAgICAgaXogPSBxdyAqIHogKyBxeCAqIHkgLSBxeSAqIHgsXG4gICAgICAgIGl3ID0gLXF4ICogeCAtIHF5ICogeSAtIHF6ICogejtcblxuICAgIC8vIGNhbGN1bGF0ZSByZXN1bHQgKiBpbnZlcnNlIHF1YXRcbiAgICBvdXRbMF0gPSBpeCAqIHF3ICsgaXcgKiAtcXggKyBpeSAqIC1xeiAtIGl6ICogLXF5O1xuICAgIG91dFsxXSA9IGl5ICogcXcgKyBpdyAqIC1xeSArIGl6ICogLXF4IC0gaXggKiAtcXo7XG4gICAgb3V0WzJdID0gaXogKiBxdyArIGl3ICogLXF6ICsgaXggKiAtcXkgLSBpeSAqIC1xeDtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFBlcmZvcm0gc29tZSBvcGVyYXRpb24gb3ZlciBhbiBhcnJheSBvZiB2ZWM0cy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBhIHRoZSBhcnJheSBvZiB2ZWN0b3JzIHRvIGl0ZXJhdGUgb3ZlclxuICogQHBhcmFtIHtOdW1iZXJ9IHN0cmlkZSBOdW1iZXIgb2YgZWxlbWVudHMgYmV0d2VlbiB0aGUgc3RhcnQgb2YgZWFjaCB2ZWM0LiBJZiAwIGFzc3VtZXMgdGlnaHRseSBwYWNrZWRcbiAqIEBwYXJhbSB7TnVtYmVyfSBvZmZzZXQgTnVtYmVyIG9mIGVsZW1lbnRzIHRvIHNraXAgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgYXJyYXlcbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBOdW1iZXIgb2YgdmVjNHMgdG8gaXRlcmF0ZSBvdmVyLiBJZiAwIGl0ZXJhdGVzIG92ZXIgZW50aXJlIGFycmF5XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBGdW5jdGlvbiB0byBjYWxsIGZvciBlYWNoIHZlY3RvciBpbiB0aGUgYXJyYXlcbiAqIEBwYXJhbSB7T2JqZWN0fSBbYXJnXSBhZGRpdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgdG8gZm5cbiAqIEByZXR1cm5zIHtBcnJheX0gYVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzQuZm9yRWFjaCA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgdmVjID0gdmVjNC5jcmVhdGUoKTtcblxuICAgIHJldHVybiBmdW5jdGlvbihhLCBzdHJpZGUsIG9mZnNldCwgY291bnQsIGZuLCBhcmcpIHtcbiAgICAgICAgdmFyIGksIGw7XG4gICAgICAgIGlmKCFzdHJpZGUpIHtcbiAgICAgICAgICAgIHN0cmlkZSA9IDQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZighb2Zmc2V0KSB7XG4gICAgICAgICAgICBvZmZzZXQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZihjb3VudCkge1xuICAgICAgICAgICAgbCA9IE1hdGgubWluKChjb3VudCAqIHN0cmlkZSkgKyBvZmZzZXQsIGEubGVuZ3RoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGwgPSBhLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpID0gb2Zmc2V0OyBpIDwgbDsgaSArPSBzdHJpZGUpIHtcbiAgICAgICAgICAgIHZlY1swXSA9IGFbaV07IHZlY1sxXSA9IGFbaSsxXTsgdmVjWzJdID0gYVtpKzJdOyB2ZWNbM10gPSBhW2krM107XG4gICAgICAgICAgICBmbih2ZWMsIHZlYywgYXJnKTtcbiAgICAgICAgICAgIGFbaV0gPSB2ZWNbMF07IGFbaSsxXSA9IHZlY1sxXTsgYVtpKzJdID0gdmVjWzJdOyBhW2krM10gPSB2ZWNbM107XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBhO1xuICAgIH07XG59KSgpO1xuXG4vKipcbiAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSB2ZWN0b3JcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IHZlYyB2ZWN0b3IgdG8gcmVwcmVzZW50IGFzIGEgc3RyaW5nXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHZlY3RvclxuICovXG52ZWM0LnN0ciA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuICd2ZWM0KCcgKyBhWzBdICsgJywgJyArIGFbMV0gKyAnLCAnICsgYVsyXSArICcsICcgKyBhWzNdICsgJyknO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB2ZWM0O1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvdmVjNC5qc1xuICoqIG1vZHVsZSBpZCA9IDEyXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiBDb3B5cmlnaHQgKGMpIDIwMTUsIEJyYW5kb24gSm9uZXMsIENvbGluIE1hY0tlbnppZSBJVi5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLiAqL1xuXG52YXIgZ2xNYXRyaXggPSByZXF1aXJlKFwiLi9jb21tb24uanNcIik7XG5cbi8qKlxuICogQGNsYXNzIDIgRGltZW5zaW9uYWwgVmVjdG9yXG4gKiBAbmFtZSB2ZWMyXG4gKi9cbnZhciB2ZWMyID0ge307XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldywgZW1wdHkgdmVjMlxuICpcbiAqIEByZXR1cm5zIHt2ZWMyfSBhIG5ldyAyRCB2ZWN0b3JcbiAqL1xudmVjMi5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMik7XG4gICAgb3V0WzBdID0gMDtcbiAgICBvdXRbMV0gPSAwO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgdmVjMiBpbml0aWFsaXplZCB3aXRoIHZhbHVlcyBmcm9tIGFuIGV4aXN0aW5nIHZlY3RvclxuICpcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gY2xvbmVcbiAqIEByZXR1cm5zIHt2ZWMyfSBhIG5ldyAyRCB2ZWN0b3JcbiAqL1xudmVjMi5jbG9uZSA9IGZ1bmN0aW9uKGEpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMik7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgdmVjMiBpbml0aWFsaXplZCB3aXRoIHRoZSBnaXZlbiB2YWx1ZXNcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgWSBjb21wb25lbnRcbiAqIEByZXR1cm5zIHt2ZWMyfSBhIG5ldyAyRCB2ZWN0b3JcbiAqL1xudmVjMi5mcm9tVmFsdWVzID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSgyKTtcbiAgICBvdXRbMF0gPSB4O1xuICAgIG91dFsxXSA9IHk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ29weSB0aGUgdmFsdWVzIGZyb20gb25lIHZlYzIgdG8gYW5vdGhlclxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHNvdXJjZSB2ZWN0b3JcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5jb3B5ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzIgdG8gdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgWSBjb21wb25lbnRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5zZXQgPSBmdW5jdGlvbihvdXQsIHgsIHkpIHtcbiAgICBvdXRbMF0gPSB4O1xuICAgIG91dFsxXSA9IHk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWRkcyB0d28gdmVjMidzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLmFkZCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKyBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gKyBiWzFdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0cyB2ZWN0b3IgYiBmcm9tIHZlY3RvciBhXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnN1YnRyYWN0ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAtIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAtIGJbMV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMyLnN1YnRyYWN0fVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzIuc3ViID0gdmVjMi5zdWJ0cmFjdDtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byB2ZWMyJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIubXVsdGlwbHkgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdICogYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdICogYlsxXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzIubXVsdGlwbHl9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMi5tdWwgPSB2ZWMyLm11bHRpcGx5O1xuXG4vKipcbiAqIERpdmlkZXMgdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5kaXZpZGUgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdIC8gYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdIC8gYlsxXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzIuZGl2aWRlfVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzIuZGl2ID0gdmVjMi5kaXZpZGU7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbWluaW11bSBvZiB0d28gdmVjMidzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLm1pbiA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IE1hdGgubWluKGFbMF0sIGJbMF0pO1xuICAgIG91dFsxXSA9IE1hdGgubWluKGFbMV0sIGJbMV0pO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG1heGltdW0gb2YgdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5tYXggPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBNYXRoLm1heChhWzBdLCBiWzBdKTtcbiAgICBvdXRbMV0gPSBNYXRoLm1heChhWzFdLCBiWzFdKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTY2FsZXMgYSB2ZWMyIGJ5IGEgc2NhbGFyIG51bWJlclxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHZlY3RvciB0byBzY2FsZVxuICogQHBhcmFtIHtOdW1iZXJ9IGIgYW1vdW50IHRvIHNjYWxlIHRoZSB2ZWN0b3IgYnlcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5zY2FsZSA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKiBiO1xuICAgIG91dFsxXSA9IGFbMV0gKiBiO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFkZHMgdHdvIHZlYzIncyBhZnRlciBzY2FsaW5nIHRoZSBzZWNvbmQgb3BlcmFuZCBieSBhIHNjYWxhciB2YWx1ZVxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSBzY2FsZSB0aGUgYW1vdW50IHRvIHNjYWxlIGIgYnkgYmVmb3JlIGFkZGluZ1xuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnNjYWxlQW5kQWRkID0gZnVuY3Rpb24ob3V0LCBhLCBiLCBzY2FsZSkge1xuICAgIG91dFswXSA9IGFbMF0gKyAoYlswXSAqIHNjYWxlKTtcbiAgICBvdXRbMV0gPSBhWzFdICsgKGJbMV0gKiBzY2FsZSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZXVjbGlkaWFuIGRpc3RhbmNlIGJldHdlZW4gdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gZGlzdGFuY2UgYmV0d2VlbiBhIGFuZCBiXG4gKi9cbnZlYzIuZGlzdGFuY2UgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIHggPSBiWzBdIC0gYVswXSxcbiAgICAgICAgeSA9IGJbMV0gLSBhWzFdO1xuICAgIHJldHVybiBNYXRoLnNxcnQoeCp4ICsgeSp5KTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMyLmRpc3RhbmNlfVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzIuZGlzdCA9IHZlYzIuZGlzdGFuY2U7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgc3F1YXJlZCBldWNsaWRpYW4gZGlzdGFuY2UgYmV0d2VlbiB0d28gdmVjMidzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBzcXVhcmVkIGRpc3RhbmNlIGJldHdlZW4gYSBhbmQgYlxuICovXG52ZWMyLnNxdWFyZWREaXN0YW5jZSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgeCA9IGJbMF0gLSBhWzBdLFxuICAgICAgICB5ID0gYlsxXSAtIGFbMV07XG4gICAgcmV0dXJuIHgqeCArIHkqeTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMyLnNxdWFyZWREaXN0YW5jZX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMyLnNxckRpc3QgPSB2ZWMyLnNxdWFyZWREaXN0YW5jZTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBsZW5ndGggb2YgYSB2ZWMyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBhIHZlY3RvciB0byBjYWxjdWxhdGUgbGVuZ3RoIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBsZW5ndGggb2YgYVxuICovXG52ZWMyLmxlbmd0aCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXTtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHgqeCArIHkqeSk7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMi5sZW5ndGh9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMi5sZW4gPSB2ZWMyLmxlbmd0aDtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGxlbmd0aCBvZiBhIHZlYzJcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdmVjdG9yIHRvIGNhbGN1bGF0ZSBzcXVhcmVkIGxlbmd0aCBvZlxuICogQHJldHVybnMge051bWJlcn0gc3F1YXJlZCBsZW5ndGggb2YgYVxuICovXG52ZWMyLnNxdWFyZWRMZW5ndGggPSBmdW5jdGlvbiAoYSkge1xuICAgIHZhciB4ID0gYVswXSxcbiAgICAgICAgeSA9IGFbMV07XG4gICAgcmV0dXJuIHgqeCArIHkqeTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMyLnNxdWFyZWRMZW5ndGh9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMi5zcXJMZW4gPSB2ZWMyLnNxdWFyZWRMZW5ndGg7XG5cbi8qKlxuICogTmVnYXRlcyB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzJcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHZlY3RvciB0byBuZWdhdGVcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5uZWdhdGUgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSAtYVswXTtcbiAgICBvdXRbMV0gPSAtYVsxXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbnZlcnNlIG9mIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjMlxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdmVjdG9yIHRvIGludmVydFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLmludmVyc2UgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgb3V0WzBdID0gMS4wIC8gYVswXTtcbiAgb3V0WzFdID0gMS4wIC8gYVsxXTtcbiAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogTm9ybWFsaXplIGEgdmVjMlxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdmVjdG9yIHRvIG5vcm1hbGl6ZVxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciB4ID0gYVswXSxcbiAgICAgICAgeSA9IGFbMV07XG4gICAgdmFyIGxlbiA9IHgqeCArIHkqeTtcbiAgICBpZiAobGVuID4gMCkge1xuICAgICAgICAvL1RPRE86IGV2YWx1YXRlIHVzZSBvZiBnbG1faW52c3FydCBoZXJlP1xuICAgICAgICBsZW4gPSAxIC8gTWF0aC5zcXJ0KGxlbik7XG4gICAgICAgIG91dFswXSA9IGFbMF0gKiBsZW47XG4gICAgICAgIG91dFsxXSA9IGFbMV0gKiBsZW47XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGRvdCBwcm9kdWN0IG9mIHR3byB2ZWMyJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRvdCBwcm9kdWN0IG9mIGEgYW5kIGJcbiAqL1xudmVjMi5kb3QgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhWzBdICogYlswXSArIGFbMV0gKiBiWzFdO1xufTtcblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgY3Jvc3MgcHJvZHVjdCBvZiB0d28gdmVjMidzXG4gKiBOb3RlIHRoYXQgdGhlIGNyb3NzIHByb2R1Y3QgbXVzdCBieSBkZWZpbml0aW9uIHByb2R1Y2UgYSAzRCB2ZWN0b3JcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzIuY3Jvc3MgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICB2YXIgeiA9IGFbMF0gKiBiWzFdIC0gYVsxXSAqIGJbMF07XG4gICAgb3V0WzBdID0gb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSB6O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgbGluZWFyIGludGVycG9sYXRpb24gYmV0d2VlbiB0d28gdmVjMidzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHtOdW1iZXJ9IHQgaW50ZXJwb2xhdGlvbiBhbW91bnQgYmV0d2VlbiB0aGUgdHdvIGlucHV0c1xuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLmxlcnAgPSBmdW5jdGlvbiAob3V0LCBhLCBiLCB0KSB7XG4gICAgdmFyIGF4ID0gYVswXSxcbiAgICAgICAgYXkgPSBhWzFdO1xuICAgIG91dFswXSA9IGF4ICsgdCAqIChiWzBdIC0gYXgpO1xuICAgIG91dFsxXSA9IGF5ICsgdCAqIChiWzFdIC0gYXkpO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHJhbmRvbSB2ZWN0b3Igd2l0aCB0aGUgZ2l2ZW4gc2NhbGVcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHtOdW1iZXJ9IFtzY2FsZV0gTGVuZ3RoIG9mIHRoZSByZXN1bHRpbmcgdmVjdG9yLiBJZiBvbW1pdHRlZCwgYSB1bml0IHZlY3RvciB3aWxsIGJlIHJldHVybmVkXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIucmFuZG9tID0gZnVuY3Rpb24gKG91dCwgc2NhbGUpIHtcbiAgICBzY2FsZSA9IHNjYWxlIHx8IDEuMDtcbiAgICB2YXIgciA9IGdsTWF0cml4LlJBTkRPTSgpICogMi4wICogTWF0aC5QSTtcbiAgICBvdXRbMF0gPSBNYXRoLmNvcyhyKSAqIHNjYWxlO1xuICAgIG91dFsxXSA9IE1hdGguc2luKHIpICogc2NhbGU7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNmb3JtcyB0aGUgdmVjMiB3aXRoIGEgbWF0MlxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7bWF0Mn0gbSBtYXRyaXggdG8gdHJhbnNmb3JtIHdpdGhcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi50cmFuc2Zvcm1NYXQyID0gZnVuY3Rpb24ob3V0LCBhLCBtKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXTtcbiAgICBvdXRbMF0gPSBtWzBdICogeCArIG1bMl0gKiB5O1xuICAgIG91dFsxXSA9IG1bMV0gKiB4ICsgbVszXSAqIHk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNmb3JtcyB0aGUgdmVjMiB3aXRoIGEgbWF0MmRcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSB2ZWN0b3IgdG8gdHJhbnNmb3JtXG4gKiBAcGFyYW0ge21hdDJkfSBtIG1hdHJpeCB0byB0cmFuc2Zvcm0gd2l0aFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnRyYW5zZm9ybU1hdDJkID0gZnVuY3Rpb24ob3V0LCBhLCBtKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXTtcbiAgICBvdXRbMF0gPSBtWzBdICogeCArIG1bMl0gKiB5ICsgbVs0XTtcbiAgICBvdXRbMV0gPSBtWzFdICogeCArIG1bM10gKiB5ICsgbVs1XTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMyIHdpdGggYSBtYXQzXG4gKiAzcmQgdmVjdG9yIGNvbXBvbmVudCBpcyBpbXBsaWNpdGx5ICcxJ1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7bWF0M30gbSBtYXRyaXggdG8gdHJhbnNmb3JtIHdpdGhcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi50cmFuc2Zvcm1NYXQzID0gZnVuY3Rpb24ob3V0LCBhLCBtKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXTtcbiAgICBvdXRbMF0gPSBtWzBdICogeCArIG1bM10gKiB5ICsgbVs2XTtcbiAgICBvdXRbMV0gPSBtWzFdICogeCArIG1bNF0gKiB5ICsgbVs3XTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMyIHdpdGggYSBtYXQ0XG4gKiAzcmQgdmVjdG9yIGNvbXBvbmVudCBpcyBpbXBsaWNpdGx5ICcwJ1xuICogNHRoIHZlY3RvciBjb21wb25lbnQgaXMgaW1wbGljaXRseSAnMSdcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSB2ZWN0b3IgdG8gdHJhbnNmb3JtXG4gKiBAcGFyYW0ge21hdDR9IG0gbWF0cml4IHRvIHRyYW5zZm9ybSB3aXRoXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIudHJhbnNmb3JtTWF0NCA9IGZ1bmN0aW9uKG91dCwgYSwgbSkge1xuICAgIHZhciB4ID0gYVswXSwgXG4gICAgICAgIHkgPSBhWzFdO1xuICAgIG91dFswXSA9IG1bMF0gKiB4ICsgbVs0XSAqIHkgKyBtWzEyXTtcbiAgICBvdXRbMV0gPSBtWzFdICogeCArIG1bNV0gKiB5ICsgbVsxM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUGVyZm9ybSBzb21lIG9wZXJhdGlvbiBvdmVyIGFuIGFycmF5IG9mIHZlYzJzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGEgdGhlIGFycmF5IG9mIHZlY3RvcnMgdG8gaXRlcmF0ZSBvdmVyXG4gKiBAcGFyYW0ge051bWJlcn0gc3RyaWRlIE51bWJlciBvZiBlbGVtZW50cyBiZXR3ZWVuIHRoZSBzdGFydCBvZiBlYWNoIHZlYzIuIElmIDAgYXNzdW1lcyB0aWdodGx5IHBhY2tlZFxuICogQHBhcmFtIHtOdW1iZXJ9IG9mZnNldCBOdW1iZXIgb2YgZWxlbWVudHMgdG8gc2tpcCBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhcnJheVxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IE51bWJlciBvZiB2ZWMycyB0byBpdGVyYXRlIG92ZXIuIElmIDAgaXRlcmF0ZXMgb3ZlciBlbnRpcmUgYXJyYXlcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggdmVjdG9yIGluIHRoZSBhcnJheVxuICogQHBhcmFtIHtPYmplY3R9IFthcmddIGFkZGl0aW9uYWwgYXJndW1lbnQgdG8gcGFzcyB0byBmblxuICogQHJldHVybnMge0FycmF5fSBhXG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMi5mb3JFYWNoID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciB2ZWMgPSB2ZWMyLmNyZWF0ZSgpO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGEsIHN0cmlkZSwgb2Zmc2V0LCBjb3VudCwgZm4sIGFyZykge1xuICAgICAgICB2YXIgaSwgbDtcbiAgICAgICAgaWYoIXN0cmlkZSkge1xuICAgICAgICAgICAgc3RyaWRlID0gMjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCFvZmZzZXQpIHtcbiAgICAgICAgICAgIG9mZnNldCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmKGNvdW50KSB7XG4gICAgICAgICAgICBsID0gTWF0aC5taW4oKGNvdW50ICogc3RyaWRlKSArIG9mZnNldCwgYS5sZW5ndGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbCA9IGEubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKGkgPSBvZmZzZXQ7IGkgPCBsOyBpICs9IHN0cmlkZSkge1xuICAgICAgICAgICAgdmVjWzBdID0gYVtpXTsgdmVjWzFdID0gYVtpKzFdO1xuICAgICAgICAgICAgZm4odmVjLCB2ZWMsIGFyZyk7XG4gICAgICAgICAgICBhW2ldID0gdmVjWzBdOyBhW2krMV0gPSB2ZWNbMV07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBhO1xuICAgIH07XG59KSgpO1xuXG4vKipcbiAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSB2ZWN0b3JcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IHZlYyB2ZWN0b3IgdG8gcmVwcmVzZW50IGFzIGEgc3RyaW5nXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHZlY3RvclxuICovXG52ZWMyLnN0ciA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuICd2ZWMyKCcgKyBhWzBdICsgJywgJyArIGFbMV0gKyAnKSc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHZlYzI7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC92ZWMyLmpzXG4gKiogbW9kdWxlIGlkID0gMTNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRcImZhY2VcIjoge1xuXHRcdFwicG9zaXRpb25cIjogW1xuXHRcdFx0MC4wMzgyLFxuXHRcdFx0LTAuMDYzNyxcblx0XHRcdDAuMDIzMSxcblx0XHRcdDAsXG5cdFx0XHQtMC4wNTk1LFxuXHRcdFx0MC4wMzkyLFxuXHRcdFx0MCxcblx0XHRcdC0wLjEwMzUsXG5cdFx0XHQwLjA3LFxuXHRcdFx0MC4wMzg1LFxuXHRcdFx0LTAuMTA0Nixcblx0XHRcdDAuMDUyOCxcblx0XHRcdDAuMDM2Mixcblx0XHRcdDAuMDgxNixcblx0XHRcdC0wLjA1MjgsXG5cdFx0XHQwLFxuXHRcdFx0MC4wODg0LFxuXHRcdFx0LTAuMDQwMyxcblx0XHRcdDAsXG5cdFx0XHQwLFxuXHRcdFx0MCxcblx0XHRcdDAuMDQyNCxcblx0XHRcdC0wLjAwODYsXG5cdFx0XHQtMC4wMTQxLFxuXHRcdFx0MC4wNzUsXG5cdFx0XHQwLjA0NTgsXG5cdFx0XHQtMC4wOTY4LFxuXHRcdFx0MC4wNzY4LFxuXHRcdFx0LTAuMDQxNCxcblx0XHRcdC0wLjA3MTgsXG5cdFx0XHQwLFxuXHRcdFx0LTAuMTUzNSxcblx0XHRcdDAuMDcxNixcblx0XHRcdDAuMDM4NSxcblx0XHRcdC0wLjE0OSxcblx0XHRcdDAuMDU2MSxcblx0XHRcdDAuMDkxNSxcblx0XHRcdC0wLjE1MTQsXG5cdFx0XHQtMC4wMTExLFxuXHRcdFx0MC4wOTMsXG5cdFx0XHQtMC4xMTk5LFxuXHRcdFx0LTAuMDIxMSxcblx0XHRcdDAsXG5cdFx0XHQtMC4xODQ4LFxuXHRcdFx0MC4wNDcxLFxuXHRcdFx0MC4wMzM5LFxuXHRcdFx0LTAuMTc3NSxcblx0XHRcdDAuMDM0OCxcblx0XHRcdDAuMDgwMyxcblx0XHRcdC0wLjE3MTEsXG5cdFx0XHQtMC4wMDgsXG5cdFx0XHQwLjAxNDcsXG5cdFx0XHQtMC4xOTAzLFxuXHRcdFx0MC4wMDk0LFxuXHRcdFx0MCxcblx0XHRcdC0wLjE5NTMsXG5cdFx0XHQwLjAxMSxcblx0XHRcdDAuMDMwOCxcblx0XHRcdC0wLjIwMSxcblx0XHRcdC0wLjAyMzcsXG5cdFx0XHQwLFxuXHRcdFx0LTAuMjA4NSxcblx0XHRcdC0wLjAxNyxcblx0XHRcdDAuMTIxMixcblx0XHRcdC0wLjA1NDcsXG5cdFx0XHQtMC4xMDA3LFxuXHRcdFx0MC4xODMyLFxuXHRcdFx0LTAuMDEwNSxcblx0XHRcdC0wLjEyOTUsXG5cdFx0XHQwLjIzNDMsXG5cdFx0XHQtMC4wODU1LFxuXHRcdFx0LTAuMTM4Myxcblx0XHRcdDAuMTc2MSxcblx0XHRcdC0wLjEzMjksXG5cdFx0XHQtMC4xMTMxLFxuXHRcdFx0MC4yMjE5LFxuXHRcdFx0LTAuMjMwOCxcblx0XHRcdC0wLjE0NDIsXG5cdFx0XHQwLjI0Mixcblx0XHRcdC0wLjI3OTQsXG5cdFx0XHQtMC4xNTc5LFxuXHRcdFx0MC4zMDY1LFxuXHRcdFx0LTAuMjQwNyxcblx0XHRcdC0wLjIyNTUsXG5cdFx0XHQwLjI5MDYsXG5cdFx0XHQtMC4xOTE1LFxuXHRcdFx0LTAuMTk2Myxcblx0XHRcdDAuMTczLFxuXHRcdFx0LTAuMjU3OSxcblx0XHRcdC0wLjExMzQsXG5cdFx0XHQwLjE5MzUsXG5cdFx0XHQtMC4zMDMzLFxuXHRcdFx0LTAuMTE5Mixcblx0XHRcdDAuMjY4Myxcblx0XHRcdC0wLjEzOTUsXG5cdFx0XHQtMC4xNjMzLFxuXHRcdFx0MC4yMDAyLFxuXHRcdFx0LTAuMTgwMyxcblx0XHRcdC0wLjEyODYsXG5cdFx0XHQwLjE1MzIsXG5cdFx0XHQtMC4yMDcxLFxuXHRcdFx0LTAuMTA2OCxcblx0XHRcdDAuMzE2LFxuXHRcdFx0LTAuMjg2OSxcblx0XHRcdC0wLjI0ODIsXG5cdFx0XHQwLjI1NjUsXG5cdFx0XHQtMC4zMjQ0LFxuXHRcdFx0LTAuMTcwMSxcblx0XHRcdDAuMjA2Mixcblx0XHRcdC0wLjMzOTksXG5cdFx0XHQtMC4xMjY2LFxuXHRcdFx0MC4zMjA4LFxuXHRcdFx0LTAuMzU4NSxcblx0XHRcdC0wLjI3ODgsXG5cdFx0XHQwLjIzODQsXG5cdFx0XHQtMC40MTIxLFxuXHRcdFx0LTAuMTY3OCxcblx0XHRcdDAuMTk0Mixcblx0XHRcdC0wLjM5OCxcblx0XHRcdC0wLjEyMjYsXG5cdFx0XHQwLjEzODksXG5cdFx0XHQtMC4zMTk1LFxuXHRcdFx0LTAuMDczLFxuXHRcdFx0MC4xNDk0LFxuXHRcdFx0LTAuMzM5NCxcblx0XHRcdC0wLjEwNDYsXG5cdFx0XHQwLjE2NzUsXG5cdFx0XHQtMC4zMjQzLFxuXHRcdFx0LTAuMTAzMyxcblx0XHRcdDAuMTQ0MSxcblx0XHRcdC0wLjI5NDcsXG5cdFx0XHQtMC4wNzk3LFxuXHRcdFx0MC4wNzcyLFxuXHRcdFx0LTAuNDI5Myxcblx0XHRcdC0wLjA2MzUsXG5cdFx0XHQwLFxuXHRcdFx0LTAuNDQwMyxcblx0XHRcdC0wLjAzNTUsXG5cdFx0XHQwLFxuXHRcdFx0LTAuNDc1MSxcblx0XHRcdC0wLjA0OTYsXG5cdFx0XHQwLjA5NTgsXG5cdFx0XHQtMC40NzA0LFxuXHRcdFx0LTAuMDc1MSxcblx0XHRcdDAuMTI2Nixcblx0XHRcdC0wLjQwODMsXG5cdFx0XHQtMC4wODQ3LFxuXHRcdFx0MC4xNDc0LFxuXHRcdFx0LTAuMzUzOCxcblx0XHRcdC0wLjExNDIsXG5cdFx0XHQwLjExNixcblx0XHRcdC0wLjM4NSxcblx0XHRcdC0wLjA4MTMsXG5cdFx0XHQwLjE2NzksXG5cdFx0XHQtMC4zNzU2LFxuXHRcdFx0LTAuMTExNSxcblx0XHRcdDAuMDg5Myxcblx0XHRcdC0wLjI4OTIsXG5cdFx0XHQtMC4wMzYzLFxuXHRcdFx0MC4wNzU2LFxuXHRcdFx0LTAuMzA0Myxcblx0XHRcdC0wLjAyMTUsXG5cdFx0XHQwLjE2Nixcblx0XHRcdC0wLjM0NzgsXG5cdFx0XHQtMC4xMTY1LFxuXHRcdFx0MC4xODEzLFxuXHRcdFx0LTAuMzQ0NSxcblx0XHRcdC0wLjExNzEsXG5cdFx0XHQwLjE1NDIsXG5cdFx0XHQtMC4zNDYsXG5cdFx0XHQtMC4xMTg0LFxuXHRcdFx0MC4xNDE5LFxuXHRcdFx0LTAuMzUyNCxcblx0XHRcdC0wLjEyMDUsXG5cdFx0XHQwLjEyMTksXG5cdFx0XHQtMC4zMzY1LFxuXHRcdFx0LTAuMDkyNyxcblx0XHRcdDAuMTQxMSxcblx0XHRcdC0wLjM0Mixcblx0XHRcdC0wLjExMzQsXG5cdFx0XHQwLjEzMjUsXG5cdFx0XHQtMC4zMjg3LFxuXHRcdFx0LTAuMDc5LFxuXHRcdFx0MC4wNzI2LFxuXHRcdFx0LTAuMzIxLFxuXHRcdFx0LTAuMDI4Nyxcblx0XHRcdDAuMDY2NSxcblx0XHRcdC0wLjMzMDIsXG5cdFx0XHQtMC4wNDkyLFxuXHRcdFx0MCxcblx0XHRcdC0wLjMwNjcsXG5cdFx0XHQtMC4wMDU0LFxuXHRcdFx0MCxcblx0XHRcdC0wLjMyMTEsXG5cdFx0XHQtMC4wMDg4LFxuXHRcdFx0MCxcblx0XHRcdC0wLjMyOTMsXG5cdFx0XHQtMC4wMzAzLFxuXHRcdFx0MC4xMjUsXG5cdFx0XHQtMC4yMTk3LFxuXHRcdFx0LTAuMDg2Mixcblx0XHRcdDAuMDU1NCxcblx0XHRcdC0wLjIzNDcsXG5cdFx0XHQtMC4wMzc2LFxuXHRcdFx0MC4wNDAzLFxuXHRcdFx0LTAuMjgyLFxuXHRcdFx0LTAuMDIwNixcblx0XHRcdDAsXG5cdFx0XHQtMC4yODg5LFxuXHRcdFx0LTAuMDEzNyxcblx0XHRcdDAuMTA3NCxcblx0XHRcdC0wLjE3NTksXG5cdFx0XHQtMC4wODYxLFxuXHRcdFx0MC4xMzQ5LFxuXHRcdFx0LTAuMTYzMixcblx0XHRcdC0wLjEwMixcblx0XHRcdDAsXG5cdFx0XHQtMC4yNDI1LFxuXHRcdFx0LTAuMDI3NSxcblx0XHRcdDAuMTE4Nixcblx0XHRcdC0wLjE1MTEsXG5cdFx0XHQtMC4wODY3LFxuXHRcdFx0MCxcblx0XHRcdC0wLjUyNzMsXG5cdFx0XHQtMC4wMzkzLFxuXHRcdFx0MC4xMTM2LFxuXHRcdFx0LTAuNTE5NCxcblx0XHRcdC0wLjA3Nyxcblx0XHRcdDAuMjI5LFxuXHRcdFx0LTAuNTEwMixcblx0XHRcdC0wLjIwODMsXG5cdFx0XHQwLjMxODUsXG5cdFx0XHQtMC40Mjg3LFxuXHRcdFx0LTAuMzEyMSxcblx0XHRcdDAuMzUwMSxcblx0XHRcdC0wLjM4MzYsXG5cdFx0XHQtMC4zNjcxLFxuXHRcdFx0MC4zNDUyLFxuXHRcdFx0LTAuMzIwNSxcblx0XHRcdC0wLjMzMixcblx0XHRcdDAuMzgyMixcblx0XHRcdC0wLjMxMTEsXG5cdFx0XHQtMC40NDY0LFxuXHRcdFx0MC4zNzQ5LFxuXHRcdFx0LTAuMjYyOCxcblx0XHRcdC0wLjQwMjMsXG5cdFx0XHQwLjQzNzQsXG5cdFx0XHQwLjEzNjQsXG5cdFx0XHQtMC41NzkyLFxuXHRcdFx0MC40MjkzLFxuXHRcdFx0MC4yMzA4LFxuXHRcdFx0LTAuNTcyNSxcblx0XHRcdDAuMzk2OCxcblx0XHRcdDAuMjM4Mixcblx0XHRcdC0wLjM2NDYsXG5cdFx0XHQwLjQxNjYsXG5cdFx0XHQwLjA0NTYsXG5cdFx0XHQtMC4zOTkyLFxuXHRcdFx0MC40MzgzLFxuXHRcdFx0MC4wNTM4LFxuXHRcdFx0LTAuNTgwMixcblx0XHRcdDAuNDE0Nixcblx0XHRcdC0wLjAyNzUsXG5cdFx0XHQtMC40Mjc2LFxuXHRcdFx0MC40MDk3LFxuXHRcdFx0LTAuMDgxNyxcblx0XHRcdC0wLjQ1NTcsXG5cdFx0XHQwLjQwODcsXG5cdFx0XHQtMC4xMjU0LFxuXHRcdFx0LTAuNDc4OSxcblx0XHRcdDAuNDI4OSxcblx0XHRcdC0wLjA4OTIsXG5cdFx0XHQtMC41NTg4LFxuXHRcdFx0MC40MzYyLFxuXHRcdFx0LTAuMDE0LFxuXHRcdFx0LTAuNTcyNCxcblx0XHRcdDAuNDEwNCxcblx0XHRcdC0wLjE4NjMsXG5cdFx0XHQtMC41Myxcblx0XHRcdDAuMzU2NCxcblx0XHRcdDAuMzU4Nyxcblx0XHRcdC0wLjM2NTMsXG5cdFx0XHQwLjQxMjYsXG5cdFx0XHQwLjM0NSxcblx0XHRcdC0wLjU0OTUsXG5cdFx0XHQwLjM5MDgsXG5cdFx0XHQwLjQ0Nyxcblx0XHRcdC0wLjUxNTksXG5cdFx0XHQwLjMyNTMsXG5cdFx0XHQwLjQ3NTgsXG5cdFx0XHQtMC4zODg1LFxuXHRcdFx0MC4xMTgyLFxuXHRcdFx0LTAuNTg5Nyxcblx0XHRcdC0wLjEwNTIsXG5cdFx0XHQwLjEzODQsXG5cdFx0XHQwLjEzNjYsXG5cdFx0XHQtMC4xNTY4LFxuXHRcdFx0MC4xMjIsXG5cdFx0XHQwLjE0NTcsXG5cdFx0XHQtMC4xMjg0LFxuXHRcdFx0MC4wODkyLFxuXHRcdFx0MC4xMTAyLFxuXHRcdFx0LTAuMTQyNCxcblx0XHRcdDAuMTEwMixcblx0XHRcdDAuMTA3NSxcblx0XHRcdC0wLjE2LFxuXHRcdFx0MC4xODkxLFxuXHRcdFx0MC4wNDA1LFxuXHRcdFx0LTAuMTQ1LFxuXHRcdFx0MC4xODYxLFxuXHRcdFx0MC4wNjcyLFxuXHRcdFx0LTAuMTUxNyxcblx0XHRcdDAuMTM2Myxcblx0XHRcdDAuMDg4OSxcblx0XHRcdC0wLjE1NzMsXG5cdFx0XHQwLjEyMDEsXG5cdFx0XHQwLjA2OTksXG5cdFx0XHQtMC4xNDM0LFxuXHRcdFx0MC4yMzIzLFxuXHRcdFx0MC4wNjE4LFxuXHRcdFx0LTAuMTYxLFxuXHRcdFx0MC4yMzgxLFxuXHRcdFx0MC4wMzU2LFxuXHRcdFx0LTAuMTYyMixcblx0XHRcdDAuMjg0Myxcblx0XHRcdDAuMDc3Nixcblx0XHRcdC0wLjE5MDYsXG5cdFx0XHQwLjI5NDcsXG5cdFx0XHQwLjA1NjcsXG5cdFx0XHQtMC4xOTc4LFxuXHRcdFx0MC4zMzY3LFxuXHRcdFx0MC4xMDI0LFxuXHRcdFx0LTAuMjQzMyxcblx0XHRcdDAuMzIxNSxcblx0XHRcdDAuMTEwMyxcblx0XHRcdC0wLjIzMSxcblx0XHRcdDAuMzMxOCxcblx0XHRcdDAuMTQyMSxcblx0XHRcdC0wLjIwMDUsXG5cdFx0XHQwLjMxODQsXG5cdFx0XHQwLjEzNDYsXG5cdFx0XHQtMC4yMDQ5LFxuXHRcdFx0MC4zMDk5LFxuXHRcdFx0MC4yNjMsXG5cdFx0XHQtMC4xNTA2LFxuXHRcdFx0MC4xNTE0LFxuXHRcdFx0MC4xMjczLFxuXHRcdFx0LTAuMTYyNSxcblx0XHRcdDAuMTI4OCxcblx0XHRcdDAuMTA4MSxcblx0XHRcdC0wLjE2NzgsXG5cdFx0XHQwLjE4NTcsXG5cdFx0XHQwLjA5MjcsXG5cdFx0XHQtMC4xNTY3LFxuXHRcdFx0MC4xNTExLFxuXHRcdFx0MC4xMDY4LFxuXHRcdFx0LTAuMTY1Mixcblx0XHRcdDAuMjI5Nyxcblx0XHRcdDAuMDg2OSxcblx0XHRcdC0wLjE2MTksXG5cdFx0XHQwLjMwOTcsXG5cdFx0XHQwLjExNjIsXG5cdFx0XHQtMC4yMjI1LFxuXHRcdFx0MC4yNzk3LFxuXHRcdFx0MC4wOTYsXG5cdFx0XHQtMC4xODg5LFxuXHRcdFx0MC4xNDIyLFxuXHRcdFx0MC4xMTM1LFxuXHRcdFx0LTAuMTc1NCxcblx0XHRcdDAuMjMzNSxcblx0XHRcdDAuMTcwMSxcblx0XHRcdC0wLjE1Nixcblx0XHRcdDAuMTgyMyxcblx0XHRcdDAuMTYsXG5cdFx0XHQtMC4xNTY0LFxuXHRcdFx0MC4xODMxLFxuXHRcdFx0MC4xNDgsXG5cdFx0XHQtMC4xNTk5LFxuXHRcdFx0MC4yMzIyLFxuXHRcdFx0MC4xNTY4LFxuXHRcdFx0LTAuMTU3NCxcblx0XHRcdDAuMjUyMyxcblx0XHRcdDAuMjE3LFxuXHRcdFx0LTAuMTA0Nixcblx0XHRcdDAuMTg1Mixcblx0XHRcdDAuMjAxNyxcblx0XHRcdC0wLjA4ODUsXG5cdFx0XHQwLjE4MTMsXG5cdFx0XHQwLjE2NDMsXG5cdFx0XHQtMC4xMzE0LFxuXHRcdFx0MC4yMzk4LFxuXHRcdFx0MC4xNzQsXG5cdFx0XHQtMC4xMzQxLFxuXHRcdFx0MC4xMDg3LFxuXHRcdFx0MC4xNzI1LFxuXHRcdFx0LTAuMDgxLFxuXHRcdFx0MC4wNjU2LFxuXHRcdFx0MC4xMTk1LFxuXHRcdFx0LTAuMTAxLFxuXHRcdFx0MC4yNTM4LFxuXHRcdFx0LTAuMDAzNCxcblx0XHRcdC0wLjE1NDUsXG5cdFx0XHQwLjMxODksXG5cdFx0XHQwLjAyNzQsXG5cdFx0XHQtMC4yMDcsXG5cdFx0XHQwLjM2MjIsXG5cdFx0XHQwLjA4NjIsXG5cdFx0XHQtMC4yNTkxLFxuXHRcdFx0MC4zNTIzLFxuXHRcdFx0MC4xNzY4LFxuXHRcdFx0LTAuMTkzMSxcblx0XHRcdDAuMzA0NSxcblx0XHRcdDAuMjAzMixcblx0XHRcdC0wLjE0MTEsXG5cdFx0XHQwLjI1MzksXG5cdFx0XHQwLjI4OCxcblx0XHRcdC0wLjEwMTcsXG5cdFx0XHQwLjAzNDEsXG5cdFx0XHQwLjEyODksXG5cdFx0XHQtMC4wNjI0LFxuXHRcdFx0MC4wNzI4LFxuXHRcdFx0MC4yMzkzLFxuXHRcdFx0LTAuMDQ3Nyxcblx0XHRcdDAuMzcwMSxcblx0XHRcdDAuMjEyOCxcblx0XHRcdC0wLjI0ODYsXG5cdFx0XHQwLFxuXHRcdFx0MC4xMzEzLFxuXHRcdFx0LTAuMDUxOSxcblx0XHRcdDAsXG5cdFx0XHQwLjI0MzcsXG5cdFx0XHQtMC4wNDMyLFxuXHRcdFx0MC4yNTExLFxuXHRcdFx0MC4zMzUyLFxuXHRcdFx0LTAuMTIsXG5cdFx0XHQwLjI1MzMsXG5cdFx0XHQwLjM5NzksXG5cdFx0XHQtMC4xNjMsXG5cdFx0XHQwLjEyLFxuXHRcdFx0MC40MTc1LFxuXHRcdFx0LTAuMTAzOSxcblx0XHRcdDAuMTE4OSxcblx0XHRcdDAuMzM1Nyxcblx0XHRcdC0wLjA2NzksXG5cdFx0XHQwLFxuXHRcdFx0MC40MTkyLFxuXHRcdFx0LTAuMDkxOSxcblx0XHRcdDAsXG5cdFx0XHQwLjMzMjYsXG5cdFx0XHQtMC4wNjEyLFxuXHRcdFx0MC4xMjM1LFxuXHRcdFx0MC41Mjc2LFxuXHRcdFx0LTAuMTg4OCxcblx0XHRcdDAuMjQ0OSxcblx0XHRcdDAuNTExOSxcblx0XHRcdC0wLjI1MDEsXG5cdFx0XHQwLFxuXHRcdFx0MC41MzU5LFxuXHRcdFx0LTAuMTczNixcblx0XHRcdDAuMzI4Nixcblx0XHRcdDAuNTUxMSxcblx0XHRcdC0wLjQzODcsXG5cdFx0XHQwLjIzODEsXG5cdFx0XHQwLjYwNTEsXG5cdFx0XHQtMC4zNjc4LFxuXHRcdFx0MCxcblx0XHRcdDAuNjM2NSxcblx0XHRcdC0wLjI5NTUsXG5cdFx0XHQwLjExOTUsXG5cdFx0XHQwLjYyOTgsXG5cdFx0XHQtMC4zMTcyLFxuXHRcdFx0MC4zODg4LFxuXHRcdFx0MC4wNTg0LFxuXHRcdFx0LTAuMjg3OSxcblx0XHRcdDAuMzQ5Nixcblx0XHRcdC0wLjAyMjcsXG5cdFx0XHQtMC4yMjA1LFxuXHRcdFx0MC4yODUsXG5cdFx0XHQtMC4wNjQ0LFxuXHRcdFx0LTAuMTYyOCxcblx0XHRcdDAuMzA5LFxuXHRcdFx0LTAuMTE2Nixcblx0XHRcdC0wLjE5MTMsXG5cdFx0XHQwLjMyNDUsXG5cdFx0XHQtMC4xNjgzLFxuXHRcdFx0LTAuMjMwOCxcblx0XHRcdDAuMzMzOCxcblx0XHRcdC0wLjIxNDgsXG5cdFx0XHQtMC4yNjYsXG5cdFx0XHQwLjMzODUsXG5cdFx0XHQtMC4yNTY5LFxuXHRcdFx0LTAuMjk1NCxcblx0XHRcdDAuMzYzMixcblx0XHRcdC0wLjA2OTYsXG5cdFx0XHQtMC4yNTEyLFxuXHRcdFx0MC4zNjcsXG5cdFx0XHQtMC4xMjEzLFxuXHRcdFx0LTAuMjkzMixcblx0XHRcdDAuMzcwNSxcblx0XHRcdC0wLjE2NTMsXG5cdFx0XHQtMC4zMzE3LFxuXHRcdFx0MC4zNzE5LFxuXHRcdFx0LTAuMjA0NSxcblx0XHRcdC0wLjM2MzcsXG5cdFx0XHQwLjMwNTIsXG5cdFx0XHQwLjEyNTgsXG5cdFx0XHQtMC4yMDE4LFxuXHRcdFx0MC4xMjUsXG5cdFx0XHQtMC4xMjcyLFxuXHRcdFx0LTAuMDk2NSxcblx0XHRcdDAuMDg4LFxuXHRcdFx0LTAuMDkwMyxcblx0XHRcdC0wLjAzNjIsXG5cdFx0XHQwLjExMSxcblx0XHRcdC0wLjM3MzIsXG5cdFx0XHQtMC4wODYyLFxuXHRcdFx0MC4xNzk1LFxuXHRcdFx0MC4yNzc3LFxuXHRcdFx0LTAuMDc0OSxcblx0XHRcdDAuMjkwNSxcblx0XHRcdDAuMTYxNSxcblx0XHRcdC0wLjE2NzEsXG5cdFx0XHQwLjI3OTgsXG5cdFx0XHQwLjE1ODMsXG5cdFx0XHQtMC4xNzk1LFxuXHRcdFx0MC4yNzcyLFxuXHRcdFx0MC4xNDU5LFxuXHRcdFx0LTAuMTgxLFxuXHRcdFx0MC4xMDY2LFxuXHRcdFx0LTAuMzY2MSxcblx0XHRcdC0wLjA5NDMsXG5cdFx0XHQwLFxuXHRcdFx0LTAuNjA1Myxcblx0XHRcdC0wLjA3MDIsXG5cdFx0XHQwLjA3MTEsXG5cdFx0XHQtMC40MDg3LFxuXHRcdFx0LTAuMDUwNixcblx0XHRcdDAuMDY3Nyxcblx0XHRcdC0wLjM4OTMsXG5cdFx0XHQtMC4wNTU1LFxuXHRcdFx0MCxcblx0XHRcdC0wLjQxNTIsXG5cdFx0XHQtMC4wMjI3LFxuXHRcdFx0MCxcblx0XHRcdC0wLjM5Mixcblx0XHRcdC0wLjAyNzEsXG5cdFx0XHQwLjA2NjMsXG5cdFx0XHQtMC4zODEzLFxuXHRcdFx0LTAuMDY3Nixcblx0XHRcdDAsXG5cdFx0XHQtMC4zODI5LFxuXHRcdFx0LTAuMDM4OCxcblx0XHRcdC0wLjAzODIsXG5cdFx0XHQtMC4wNjM3LFxuXHRcdFx0MC4wMjMxLFxuXHRcdFx0LTAuMDM4NSxcblx0XHRcdC0wLjEwNDYsXG5cdFx0XHQwLjA1MjgsXG5cdFx0XHQtMC4wMzYyLFxuXHRcdFx0MC4wODE2LFxuXHRcdFx0LTAuMDUyOCxcblx0XHRcdC0wLjA0MjQsXG5cdFx0XHQtMC4wMDg2LFxuXHRcdFx0LTAuMDE0MSxcblx0XHRcdC0wLjA3NSxcblx0XHRcdDAuMDQ1OCxcblx0XHRcdC0wLjA5NjgsXG5cdFx0XHQtMC4wNzY4LFxuXHRcdFx0LTAuMDQxNCxcblx0XHRcdC0wLjA3MTgsXG5cdFx0XHQtMC4wMzg1LFxuXHRcdFx0LTAuMTQ5LFxuXHRcdFx0MC4wNTYxLFxuXHRcdFx0LTAuMDkxNSxcblx0XHRcdC0wLjE1MTQsXG5cdFx0XHQtMC4wMTExLFxuXHRcdFx0LTAuMDkzLFxuXHRcdFx0LTAuMTE5OSxcblx0XHRcdC0wLjAyMTEsXG5cdFx0XHQtMC4wMzM5LFxuXHRcdFx0LTAuMTc3NSxcblx0XHRcdDAuMDM0OCxcblx0XHRcdC0wLjA4MDMsXG5cdFx0XHQtMC4xNzExLFxuXHRcdFx0LTAuMDA4LFxuXHRcdFx0LTAuMDE0Nyxcblx0XHRcdC0wLjE5MDMsXG5cdFx0XHQwLjAwOTQsXG5cdFx0XHQtMC4wMzA4LFxuXHRcdFx0LTAuMjAxLFxuXHRcdFx0LTAuMDIzNyxcblx0XHRcdC0wLjEyMTIsXG5cdFx0XHQtMC4wNTQ3LFxuXHRcdFx0LTAuMTAwNyxcblx0XHRcdC0wLjE4MzIsXG5cdFx0XHQtMC4wMTA1LFxuXHRcdFx0LTAuMTI5NSxcblx0XHRcdC0wLjIzNDMsXG5cdFx0XHQtMC4wODU1LFxuXHRcdFx0LTAuMTM4Myxcblx0XHRcdC0wLjE3NjEsXG5cdFx0XHQtMC4xMzI5LFxuXHRcdFx0LTAuMTEzMSxcblx0XHRcdC0wLjIyMTksXG5cdFx0XHQtMC4yMzA4LFxuXHRcdFx0LTAuMTQ0Mixcblx0XHRcdC0wLjMwNjUsXG5cdFx0XHQtMC4yNDA3LFxuXHRcdFx0LTAuMjI1NSxcblx0XHRcdC0wLjI0Mixcblx0XHRcdC0wLjI3OTQsXG5cdFx0XHQtMC4xNTc5LFxuXHRcdFx0LTAuMjkwNixcblx0XHRcdC0wLjE5MTUsXG5cdFx0XHQtMC4xOTYzLFxuXHRcdFx0LTAuMTczLFxuXHRcdFx0LTAuMjU3OSxcblx0XHRcdC0wLjExMzQsXG5cdFx0XHQtMC4xOTM1LFxuXHRcdFx0LTAuMzAzMyxcblx0XHRcdC0wLjExOTIsXG5cdFx0XHQtMC4yMDAyLFxuXHRcdFx0LTAuMTgwMyxcblx0XHRcdC0wLjEyODYsXG5cdFx0XHQtMC4yNjgzLFxuXHRcdFx0LTAuMTM5NSxcblx0XHRcdC0wLjE2MzMsXG5cdFx0XHQtMC4xNTMyLFxuXHRcdFx0LTAuMjA3MSxcblx0XHRcdC0wLjEwNjgsXG5cdFx0XHQtMC4zMTYsXG5cdFx0XHQtMC4yODY5LFxuXHRcdFx0LTAuMjQ4Mixcblx0XHRcdC0wLjI1NjUsXG5cdFx0XHQtMC4zMjQ0LFxuXHRcdFx0LTAuMTcwMSxcblx0XHRcdC0wLjIwNjIsXG5cdFx0XHQtMC4zMzk5LFxuXHRcdFx0LTAuMTI2Nixcblx0XHRcdC0wLjMyMDgsXG5cdFx0XHQtMC4zNTg1LFxuXHRcdFx0LTAuMjc4OCxcblx0XHRcdC0wLjIzODQsXG5cdFx0XHQtMC40MTIxLFxuXHRcdFx0LTAuMTY3OCxcblx0XHRcdC0wLjE5NDIsXG5cdFx0XHQtMC4zOTgsXG5cdFx0XHQtMC4xMjI2LFxuXHRcdFx0LTAuMTM4OSxcblx0XHRcdC0wLjMxOTUsXG5cdFx0XHQtMC4wNzMsXG5cdFx0XHQtMC4xNDQxLFxuXHRcdFx0LTAuMjk0Nyxcblx0XHRcdC0wLjA3OTcsXG5cdFx0XHQtMC4xNjc1LFxuXHRcdFx0LTAuMzI0Myxcblx0XHRcdC0wLjEwMzMsXG5cdFx0XHQtMC4xNDk0LFxuXHRcdFx0LTAuMzM5NCxcblx0XHRcdC0wLjEwNDYsXG5cdFx0XHQtMC4wNzcyLFxuXHRcdFx0LTAuNDI5Myxcblx0XHRcdC0wLjA2MzUsXG5cdFx0XHQtMC4wOTU4LFxuXHRcdFx0LTAuNDcwNCxcblx0XHRcdC0wLjA3NTEsXG5cdFx0XHQtMC4xMjY2LFxuXHRcdFx0LTAuNDA4Myxcblx0XHRcdC0wLjA4NDcsXG5cdFx0XHQtMC4xNDc0LFxuXHRcdFx0LTAuMzUzOCxcblx0XHRcdC0wLjExNDIsXG5cdFx0XHQtMC4xNjc5LFxuXHRcdFx0LTAuMzc1Nixcblx0XHRcdC0wLjExMTUsXG5cdFx0XHQtMC4xMTYsXG5cdFx0XHQtMC4zODUsXG5cdFx0XHQtMC4wODEzLFxuXHRcdFx0LTAuMDc1Nixcblx0XHRcdC0wLjMwNDMsXG5cdFx0XHQtMC4wMjE1LFxuXHRcdFx0LTAuMDg5Myxcblx0XHRcdC0wLjI4OTIsXG5cdFx0XHQtMC4wMzYzLFxuXHRcdFx0LTAuMTY2LFxuXHRcdFx0LTAuMzQ3OCxcblx0XHRcdC0wLjExNjUsXG5cdFx0XHQtMC4xODEzLFxuXHRcdFx0LTAuMzQ0NSxcblx0XHRcdC0wLjExNzEsXG5cdFx0XHQtMC4xNTQyLFxuXHRcdFx0LTAuMzQ2LFxuXHRcdFx0LTAuMTE4NCxcblx0XHRcdC0wLjE0MTksXG5cdFx0XHQtMC4zNTI0LFxuXHRcdFx0LTAuMTIwNSxcblx0XHRcdC0wLjEyMTksXG5cdFx0XHQtMC4zMzY1LFxuXHRcdFx0LTAuMDkyNyxcblx0XHRcdC0wLjEzMjUsXG5cdFx0XHQtMC4zMjg3LFxuXHRcdFx0LTAuMDc5LFxuXHRcdFx0LTAuMTQxMSxcblx0XHRcdC0wLjM0Mixcblx0XHRcdC0wLjExMzQsXG5cdFx0XHQtMC4wNzI2LFxuXHRcdFx0LTAuMzIxLFxuXHRcdFx0LTAuMDI4Nyxcblx0XHRcdC0wLjA2NjUsXG5cdFx0XHQtMC4zMzAyLFxuXHRcdFx0LTAuMDQ5Mixcblx0XHRcdC0wLjEyNSxcblx0XHRcdC0wLjIxOTcsXG5cdFx0XHQtMC4wODYyLFxuXHRcdFx0LTAuMDU1NCxcblx0XHRcdC0wLjIzNDcsXG5cdFx0XHQtMC4wMzc2LFxuXHRcdFx0LTAuMDQwMyxcblx0XHRcdC0wLjI4Mixcblx0XHRcdC0wLjAyMDYsXG5cdFx0XHQtMC4xMDc0LFxuXHRcdFx0LTAuMTc1OSxcblx0XHRcdC0wLjA4NjEsXG5cdFx0XHQtMC4xMzQ5LFxuXHRcdFx0LTAuMTYzMixcblx0XHRcdC0wLjEwMixcblx0XHRcdC0wLjExODYsXG5cdFx0XHQtMC4xNTExLFxuXHRcdFx0LTAuMDg2Nyxcblx0XHRcdC0wLjExMzYsXG5cdFx0XHQtMC41MTk0LFxuXHRcdFx0LTAuMDc3LFxuXHRcdFx0LTAuMjI5LFxuXHRcdFx0LTAuNTEwMixcblx0XHRcdC0wLjIwODMsXG5cdFx0XHQtMC4zMTg1LFxuXHRcdFx0LTAuNDI4Nyxcblx0XHRcdC0wLjMxMjEsXG5cdFx0XHQtMC4zNDUyLFxuXHRcdFx0LTAuMzIwNSxcblx0XHRcdC0wLjMzMixcblx0XHRcdC0wLjM1MDEsXG5cdFx0XHQtMC4zODM2LFxuXHRcdFx0LTAuMzY3MSxcblx0XHRcdC0wLjM4MjIsXG5cdFx0XHQtMC4zMTExLFxuXHRcdFx0LTAuNDQ2NCxcblx0XHRcdC0wLjM3NDksXG5cdFx0XHQtMC4yNjI4LFxuXHRcdFx0LTAuNDAyMyxcblx0XHRcdC0wLjQzNzQsXG5cdFx0XHQwLjEzNjQsXG5cdFx0XHQtMC41NzkyLFxuXHRcdFx0LTAuMzk2OCxcblx0XHRcdDAuMjM4Mixcblx0XHRcdC0wLjM2NDYsXG5cdFx0XHQtMC40MjkzLFxuXHRcdFx0MC4yMzA4LFxuXHRcdFx0LTAuNTcyNSxcblx0XHRcdC0wLjQxNjYsXG5cdFx0XHQwLjA0NTYsXG5cdFx0XHQtMC4zOTkyLFxuXHRcdFx0LTAuNDM4Myxcblx0XHRcdDAuMDUzOCxcblx0XHRcdC0wLjU4MDIsXG5cdFx0XHQtMC40MTQ2LFxuXHRcdFx0LTAuMDI3NSxcblx0XHRcdC0wLjQyNzYsXG5cdFx0XHQtMC40MDk3LFxuXHRcdFx0LTAuMDgxNyxcblx0XHRcdC0wLjQ1NTcsXG5cdFx0XHQtMC40Mjg5LFxuXHRcdFx0LTAuMDg5Mixcblx0XHRcdC0wLjU1ODgsXG5cdFx0XHQtMC40MDg3LFxuXHRcdFx0LTAuMTI1NCxcblx0XHRcdC0wLjQ3ODksXG5cdFx0XHQtMC40MzYyLFxuXHRcdFx0LTAuMDE0LFxuXHRcdFx0LTAuNTcyNCxcblx0XHRcdC0wLjQxMDQsXG5cdFx0XHQtMC4xODYzLFxuXHRcdFx0LTAuNTMsXG5cdFx0XHQtMC4zNTY0LFxuXHRcdFx0MC4zNTg3LFxuXHRcdFx0LTAuMzY1Myxcblx0XHRcdC0wLjQxMjYsXG5cdFx0XHQwLjM0NSxcblx0XHRcdC0wLjU0OTUsXG5cdFx0XHQtMC4zOTA4LFxuXHRcdFx0MC40NDcsXG5cdFx0XHQtMC41MTU5LFxuXHRcdFx0LTAuMzI1Myxcblx0XHRcdDAuNDc1OCxcblx0XHRcdC0wLjM4ODUsXG5cdFx0XHQtMC4xMTgyLFxuXHRcdFx0LTAuNTg5Nyxcblx0XHRcdC0wLjEwNTIsXG5cdFx0XHQtMC4xMzg0LFxuXHRcdFx0MC4xMzY2LFxuXHRcdFx0LTAuMTU2OCxcblx0XHRcdC0wLjA4OTIsXG5cdFx0XHQwLjExMDIsXG5cdFx0XHQtMC4xNDI0LFxuXHRcdFx0LTAuMTIyLFxuXHRcdFx0MC4xNDU3LFxuXHRcdFx0LTAuMTI4NCxcblx0XHRcdC0wLjExMDIsXG5cdFx0XHQwLjEwNzUsXG5cdFx0XHQtMC4xNixcblx0XHRcdC0wLjE4OTEsXG5cdFx0XHQwLjA0MDUsXG5cdFx0XHQtMC4xNDUsXG5cdFx0XHQtMC4xMzYzLFxuXHRcdFx0MC4wODg5LFxuXHRcdFx0LTAuMTU3Myxcblx0XHRcdC0wLjE4NjEsXG5cdFx0XHQwLjA2NzIsXG5cdFx0XHQtMC4xNTE3LFxuXHRcdFx0LTAuMTIwMSxcblx0XHRcdDAuMDY5OSxcblx0XHRcdC0wLjE0MzQsXG5cdFx0XHQtMC4yMzIzLFxuXHRcdFx0MC4wNjE4LFxuXHRcdFx0LTAuMTYxLFxuXHRcdFx0LTAuMjM4MSxcblx0XHRcdDAuMDM1Nixcblx0XHRcdC0wLjE2MjIsXG5cdFx0XHQtMC4yODQzLFxuXHRcdFx0MC4wNzc2LFxuXHRcdFx0LTAuMTkwNixcblx0XHRcdC0wLjMzNjcsXG5cdFx0XHQwLjEwMjQsXG5cdFx0XHQtMC4yNDMzLFxuXHRcdFx0LTAuMjk0Nyxcblx0XHRcdDAuMDU2Nyxcblx0XHRcdC0wLjE5NzgsXG5cdFx0XHQtMC4zMjE1LFxuXHRcdFx0MC4xMTAzLFxuXHRcdFx0LTAuMjMxLFxuXHRcdFx0LTAuMzMxOCxcblx0XHRcdDAuMTQyMSxcblx0XHRcdC0wLjIwMDUsXG5cdFx0XHQtMC4zMTg0LFxuXHRcdFx0MC4xMzQ2LFxuXHRcdFx0LTAuMjA0OSxcblx0XHRcdC0wLjMwOTksXG5cdFx0XHQwLjI2Myxcblx0XHRcdC0wLjE1MDYsXG5cdFx0XHQtMC4xNTE0LFxuXHRcdFx0MC4xMjczLFxuXHRcdFx0LTAuMTYyNSxcblx0XHRcdC0wLjEyODgsXG5cdFx0XHQwLjEwODEsXG5cdFx0XHQtMC4xNjc4LFxuXHRcdFx0LTAuMTUxMSxcblx0XHRcdDAuMTA2OCxcblx0XHRcdC0wLjE2NTIsXG5cdFx0XHQtMC4xODU3LFxuXHRcdFx0MC4wOTI3LFxuXHRcdFx0LTAuMTU2Nyxcblx0XHRcdC0wLjIyOTcsXG5cdFx0XHQwLjA4NjksXG5cdFx0XHQtMC4xNjE5LFxuXHRcdFx0LTAuMzA5Nyxcblx0XHRcdDAuMTE2Mixcblx0XHRcdC0wLjIyMjUsXG5cdFx0XHQtMC4yNzk3LFxuXHRcdFx0MC4wOTYsXG5cdFx0XHQtMC4xODg5LFxuXHRcdFx0LTAuMTQyMixcblx0XHRcdDAuMTEzNSxcblx0XHRcdC0wLjE3NTQsXG5cdFx0XHQtMC4yMzM1LFxuXHRcdFx0MC4xNzAxLFxuXHRcdFx0LTAuMTU2LFxuXHRcdFx0LTAuMjMyMixcblx0XHRcdDAuMTU2OCxcblx0XHRcdC0wLjE1NzQsXG5cdFx0XHQtMC4xODMxLFxuXHRcdFx0MC4xNDgsXG5cdFx0XHQtMC4xNTk5LFxuXHRcdFx0LTAuMTgyMyxcblx0XHRcdDAuMTYsXG5cdFx0XHQtMC4xNTY0LFxuXHRcdFx0LTAuMjUyMyxcblx0XHRcdDAuMjE3LFxuXHRcdFx0LTAuMTA0Nixcblx0XHRcdC0wLjIzOTgsXG5cdFx0XHQwLjE3NCxcblx0XHRcdC0wLjEzNDEsXG5cdFx0XHQtMC4xODEzLFxuXHRcdFx0MC4xNjQzLFxuXHRcdFx0LTAuMTMxNCxcblx0XHRcdC0wLjE4NTIsXG5cdFx0XHQwLjIwMTcsXG5cdFx0XHQtMC4wODg1LFxuXHRcdFx0LTAuMTA4Nyxcblx0XHRcdDAuMTcyNSxcblx0XHRcdC0wLjA4MSxcblx0XHRcdC0wLjA2NTYsXG5cdFx0XHQwLjExOTUsXG5cdFx0XHQtMC4xMDEsXG5cdFx0XHQtMC4yNTM4LFxuXHRcdFx0LTAuMDAzNCxcblx0XHRcdC0wLjE1NDUsXG5cdFx0XHQtMC4zMTg5LFxuXHRcdFx0MC4wMjc0LFxuXHRcdFx0LTAuMjA3LFxuXHRcdFx0LTAuMzYyMixcblx0XHRcdDAuMDg2Mixcblx0XHRcdC0wLjI1OTEsXG5cdFx0XHQtMC4zNTIzLFxuXHRcdFx0MC4xNzY4LFxuXHRcdFx0LTAuMTkzMSxcblx0XHRcdC0wLjI1MzksXG5cdFx0XHQwLjI4OCxcblx0XHRcdC0wLjEwMTcsXG5cdFx0XHQtMC4zMDQ1LFxuXHRcdFx0MC4yMDMyLFxuXHRcdFx0LTAuMTQxMSxcblx0XHRcdC0wLjAzNDEsXG5cdFx0XHQwLjEyODksXG5cdFx0XHQtMC4wNjI0LFxuXHRcdFx0LTAuMDcyOCxcblx0XHRcdDAuMjM5Myxcblx0XHRcdC0wLjA0NzcsXG5cdFx0XHQtMC4zNzAxLFxuXHRcdFx0MC4yMTI4LFxuXHRcdFx0LTAuMjQ4Nixcblx0XHRcdC0wLjI1MTEsXG5cdFx0XHQwLjMzNTIsXG5cdFx0XHQtMC4xMixcblx0XHRcdC0wLjEyLFxuXHRcdFx0MC40MTc1LFxuXHRcdFx0LTAuMTAzOSxcblx0XHRcdC0wLjI1MzMsXG5cdFx0XHQwLjM5NzksXG5cdFx0XHQtMC4xNjMsXG5cdFx0XHQtMC4xMTg5LFxuXHRcdFx0MC4zMzU3LFxuXHRcdFx0LTAuMDY3OSxcblx0XHRcdC0wLjEyMzUsXG5cdFx0XHQwLjUyNzYsXG5cdFx0XHQtMC4xODg4LFxuXHRcdFx0LTAuMjQ0OSxcblx0XHRcdDAuNTExOSxcblx0XHRcdC0wLjI1MDEsXG5cdFx0XHQtMC4zMjg2LFxuXHRcdFx0MC41NTExLFxuXHRcdFx0LTAuNDM4Nyxcblx0XHRcdC0wLjIzODEsXG5cdFx0XHQwLjYwNTEsXG5cdFx0XHQtMC4zNjc4LFxuXHRcdFx0LTAuMTE5NSxcblx0XHRcdDAuNjI5OCxcblx0XHRcdC0wLjMxNzIsXG5cdFx0XHQtMC4zODg4LFxuXHRcdFx0MC4wNTg0LFxuXHRcdFx0LTAuMjg3OSxcblx0XHRcdC0wLjM0OTYsXG5cdFx0XHQtMC4wMjI3LFxuXHRcdFx0LTAuMjIwNSxcblx0XHRcdC0wLjI4NSxcblx0XHRcdC0wLjA2NDQsXG5cdFx0XHQtMC4xNjI4LFxuXHRcdFx0LTAuMzA5LFxuXHRcdFx0LTAuMTE2Nixcblx0XHRcdC0wLjE5MTMsXG5cdFx0XHQtMC4zMjQ1LFxuXHRcdFx0LTAuMTY4Myxcblx0XHRcdC0wLjIzMDgsXG5cdFx0XHQtMC4zMzM4LFxuXHRcdFx0LTAuMjE0OCxcblx0XHRcdC0wLjI2Nixcblx0XHRcdC0wLjMzODUsXG5cdFx0XHQtMC4yNTY5LFxuXHRcdFx0LTAuMjk1NCxcblx0XHRcdC0wLjM2MzIsXG5cdFx0XHQtMC4wNjk2LFxuXHRcdFx0LTAuMjUxMixcblx0XHRcdC0wLjM2Nyxcblx0XHRcdC0wLjEyMTMsXG5cdFx0XHQtMC4yOTMyLFxuXHRcdFx0LTAuMzcwNSxcblx0XHRcdC0wLjE2NTMsXG5cdFx0XHQtMC4zMzE3LFxuXHRcdFx0LTAuMzcxOSxcblx0XHRcdC0wLjIwNDUsXG5cdFx0XHQtMC4zNjM3LFxuXHRcdFx0LTAuMzA1Mixcblx0XHRcdDAuMTI1OCxcblx0XHRcdC0wLjIwMTgsXG5cdFx0XHQtMC4xMjUsXG5cdFx0XHQtMC4xMjcyLFxuXHRcdFx0LTAuMDk2NSxcblx0XHRcdC0wLjA4OCxcblx0XHRcdC0wLjA5MDMsXG5cdFx0XHQtMC4wMzYyLFxuXHRcdFx0LTAuMTExLFxuXHRcdFx0LTAuMzczMixcblx0XHRcdC0wLjA4NjIsXG5cdFx0XHQtMC4xNzk1LFxuXHRcdFx0MC4yNzc3LFxuXHRcdFx0LTAuMDc0OSxcblx0XHRcdC0wLjI5MDUsXG5cdFx0XHQwLjE2MTUsXG5cdFx0XHQtMC4xNjcxLFxuXHRcdFx0LTAuMjc5OCxcblx0XHRcdDAuMTU4Myxcblx0XHRcdC0wLjE3OTUsXG5cdFx0XHQtMC4yNzcyLFxuXHRcdFx0MC4xNDU5LFxuXHRcdFx0LTAuMTgxLFxuXHRcdFx0LTAuMTA2Nixcblx0XHRcdC0wLjM2NjEsXG5cdFx0XHQtMC4wOTQzLFxuXHRcdFx0LTAuMDcxMSxcblx0XHRcdC0wLjQwODcsXG5cdFx0XHQtMC4wNTA2LFxuXHRcdFx0LTAuMDY3Nyxcblx0XHRcdC0wLjM4OTMsXG5cdFx0XHQtMC4wNTU1LFxuXHRcdFx0LTAuMDY2Myxcblx0XHRcdC0wLjM4MTMsXG5cdFx0XHQtMC4wNjc2XG5cdFx0XSxcblx0XHRcImluZGV4XCI6IFtcblx0XHRcdDIsXG5cdFx0XHQwLFxuXHRcdFx0MSxcblx0XHRcdDAsXG5cdFx0XHQyLFxuXHRcdFx0Myxcblx0XHRcdDYsXG5cdFx0XHQ0LFxuXHRcdFx0NSxcblx0XHRcdDQsXG5cdFx0XHQ2LFxuXHRcdFx0Nyxcblx0XHRcdDcsXG5cdFx0XHQ4LFxuXHRcdFx0NCxcblx0XHRcdDgsXG5cdFx0XHQ3LFxuXHRcdFx0OSxcblx0XHRcdDEwLFxuXHRcdFx0Myxcblx0XHRcdDIsXG5cdFx0XHQzLFxuXHRcdFx0MTAsXG5cdFx0XHQxMSxcblx0XHRcdDEyLFxuXHRcdFx0Myxcblx0XHRcdDExLFxuXHRcdFx0Myxcblx0XHRcdDEyLFxuXHRcdFx0MTMsXG5cdFx0XHQxNSxcblx0XHRcdDEwLFxuXHRcdFx0MTQsXG5cdFx0XHQxMCxcblx0XHRcdDE1LFxuXHRcdFx0MTEsXG5cdFx0XHQxNixcblx0XHRcdDExLFxuXHRcdFx0MTUsXG5cdFx0XHQxMSxcblx0XHRcdDE2LFxuXHRcdFx0MTIsXG5cdFx0XHQxNCxcblx0XHRcdDE3LFxuXHRcdFx0MTUsXG5cdFx0XHQxNyxcblx0XHRcdDE0LFxuXHRcdFx0MTgsXG5cdFx0XHQxOCxcblx0XHRcdDE5LFxuXHRcdFx0MTcsXG5cdFx0XHQxOSxcblx0XHRcdDE4LFxuXHRcdFx0MjAsXG5cdFx0XHQxNyxcblx0XHRcdDE2LFxuXHRcdFx0MTUsXG5cdFx0XHQxNixcblx0XHRcdDE3LFxuXHRcdFx0MTksXG5cdFx0XHQwLFxuXHRcdFx0Nixcblx0XHRcdDEsXG5cdFx0XHQ2LFxuXHRcdFx0MCxcblx0XHRcdDcsXG5cdFx0XHQ5LFxuXHRcdFx0MjEsXG5cdFx0XHQ4LFxuXHRcdFx0MjEsXG5cdFx0XHQyMixcblx0XHRcdDgsXG5cdFx0XHQyMSxcblx0XHRcdDIzLFxuXHRcdFx0MjIsXG5cdFx0XHQyMyxcblx0XHRcdDIxLFxuXHRcdFx0MjQsXG5cdFx0XHQyNyxcblx0XHRcdDI1LFxuXHRcdFx0MjYsXG5cdFx0XHQyNSxcblx0XHRcdDI3LFxuXHRcdFx0MjgsXG5cdFx0XHQyNixcblx0XHRcdDI5LFxuXHRcdFx0MzAsXG5cdFx0XHQyOSxcblx0XHRcdDI2LFxuXHRcdFx0MjUsXG5cdFx0XHQzMixcblx0XHRcdDI4LFxuXHRcdFx0MzEsXG5cdFx0XHQyOCxcblx0XHRcdDMyLFxuXHRcdFx0MjUsXG5cdFx0XHQzMyxcblx0XHRcdDI1LFxuXHRcdFx0MzIsXG5cdFx0XHQyNSxcblx0XHRcdDMzLFxuXHRcdFx0MjksXG5cdFx0XHQyNixcblx0XHRcdDM0LFxuXHRcdFx0MjcsXG5cdFx0XHQzNCxcblx0XHRcdDI2LFxuXHRcdFx0MzUsXG5cdFx0XHQzMCxcblx0XHRcdDM1LFxuXHRcdFx0MjYsXG5cdFx0XHQzNSxcblx0XHRcdDMwLFxuXHRcdFx0MzYsXG5cdFx0XHQzNSxcblx0XHRcdDM3LFxuXHRcdFx0MzQsXG5cdFx0XHQzNyxcblx0XHRcdDM1LFxuXHRcdFx0MzgsXG5cdFx0XHQzNixcblx0XHRcdDM4LFxuXHRcdFx0MzUsXG5cdFx0XHQzOCxcblx0XHRcdDM2LFxuXHRcdFx0MzksXG5cdFx0XHQ0Myxcblx0XHRcdDQwLFxuXHRcdFx0NDEsXG5cdFx0XHQ0Myxcblx0XHRcdDQxLFxuXHRcdFx0NDIsXG5cdFx0XHQ0Nyxcblx0XHRcdDQ0LFxuXHRcdFx0NDUsXG5cdFx0XHQ0Nyxcblx0XHRcdDQ1LFxuXHRcdFx0NDYsXG5cdFx0XHQ0OCxcblx0XHRcdDQ0LFxuXHRcdFx0NDcsXG5cdFx0XHQ1MSxcblx0XHRcdDQ5LFxuXHRcdFx0NTAsXG5cdFx0XHQ1MSxcblx0XHRcdDUwLFxuXHRcdFx0NDgsXG5cdFx0XHQ1Myxcblx0XHRcdDQwLFxuXHRcdFx0NDMsXG5cdFx0XHQ1Myxcblx0XHRcdDQzLFxuXHRcdFx0NTIsXG5cdFx0XHQ0MSxcblx0XHRcdDU0LFxuXHRcdFx0NTUsXG5cdFx0XHQ0MSxcblx0XHRcdDU1LFxuXHRcdFx0NDIsXG5cdFx0XHQ1Nixcblx0XHRcdDQ5LFxuXHRcdFx0NTQsXG5cdFx0XHQ1Nixcblx0XHRcdDU3LFxuXHRcdFx0NDksXG5cdFx0XHQ2MCxcblx0XHRcdDU4LFxuXHRcdFx0NTksXG5cdFx0XHQ2MCxcblx0XHRcdDU5LFxuXHRcdFx0NDEsXG5cdFx0XHQ1Nixcblx0XHRcdDQxLFxuXHRcdFx0NTksXG5cdFx0XHQ2MSxcblx0XHRcdDYwLFxuXHRcdFx0NDAsXG5cdFx0XHQ2MSxcblx0XHRcdDQwLFxuXHRcdFx0NTMsXG5cdFx0XHQ2MCxcblx0XHRcdDQxLFxuXHRcdFx0NDAsXG5cdFx0XHQ0MSxcblx0XHRcdDU2LFxuXHRcdFx0NTQsXG5cdFx0XHQ2Mixcblx0XHRcdDU4LFxuXHRcdFx0NjAsXG5cdFx0XHQ2Mixcblx0XHRcdDYwLFxuXHRcdFx0NjEsXG5cdFx0XHQ1NSxcblx0XHRcdDU0LFxuXHRcdFx0NDksXG5cdFx0XHQ1NSxcblx0XHRcdDQ5LFxuXHRcdFx0NTEsXG5cdFx0XHQ2NCxcblx0XHRcdDYxLFxuXHRcdFx0NTMsXG5cdFx0XHQ2NCxcblx0XHRcdDUzLFxuXHRcdFx0NjMsXG5cdFx0XHQ2NSxcblx0XHRcdDYyLFxuXHRcdFx0NjEsXG5cdFx0XHQ2NSxcblx0XHRcdDYxLFxuXHRcdFx0NjQsXG5cdFx0XHQzNixcblx0XHRcdDUxLFxuXHRcdFx0MzksXG5cdFx0XHQ1MSxcblx0XHRcdDM2LFxuXHRcdFx0NTUsXG5cdFx0XHQzNixcblx0XHRcdDQyLFxuXHRcdFx0NTUsXG5cdFx0XHQ0Mixcblx0XHRcdDM2LFxuXHRcdFx0MzAsXG5cdFx0XHQzMCxcblx0XHRcdDQzLFxuXHRcdFx0NDIsXG5cdFx0XHQ0Myxcblx0XHRcdDMwLFxuXHRcdFx0MjksXG5cdFx0XHQ2Nixcblx0XHRcdDI5LFxuXHRcdFx0MzMsXG5cdFx0XHQyOSxcblx0XHRcdDY2LFxuXHRcdFx0NDMsXG5cdFx0XHQ2Nixcblx0XHRcdDY3LFxuXHRcdFx0NTIsXG5cdFx0XHQ2Nixcblx0XHRcdDUyLFxuXHRcdFx0NDMsXG5cdFx0XHQ2OCxcblx0XHRcdDYzLFxuXHRcdFx0NTMsXG5cdFx0XHQ2OSxcblx0XHRcdDYzLFxuXHRcdFx0NjgsXG5cdFx0XHQzMyxcblx0XHRcdDcwLFxuXHRcdFx0NjYsXG5cdFx0XHQ3MCxcblx0XHRcdDMzLFxuXHRcdFx0NzEsXG5cdFx0XHQ3MCxcblx0XHRcdDY3LFxuXHRcdFx0NjYsXG5cdFx0XHQ2Nyxcblx0XHRcdDcwLFxuXHRcdFx0MTksXG5cdFx0XHQ2Nyxcblx0XHRcdDIwLFxuXHRcdFx0NzIsXG5cdFx0XHQyMCxcblx0XHRcdDY3LFxuXHRcdFx0MTksXG5cdFx0XHQzMixcblx0XHRcdDcxLFxuXHRcdFx0MzMsXG5cdFx0XHQ3MSxcblx0XHRcdDMyLFxuXHRcdFx0MjQsXG5cdFx0XHQzMSxcblx0XHRcdDI0LFxuXHRcdFx0MzIsXG5cdFx0XHQyNCxcblx0XHRcdDMxLFxuXHRcdFx0MjMsXG5cdFx0XHQxNixcblx0XHRcdDcwLFxuXHRcdFx0MTIsXG5cdFx0XHQ3MCxcblx0XHRcdDE2LFxuXHRcdFx0MTksXG5cdFx0XHQ3MSxcblx0XHRcdDczLFxuXHRcdFx0NzAsXG5cdFx0XHQ0Nixcblx0XHRcdDc0LFxuXHRcdFx0NzUsXG5cdFx0XHQ0Nixcblx0XHRcdDc1LFxuXHRcdFx0NDcsXG5cdFx0XHQ3Mixcblx0XHRcdDY5LFxuXHRcdFx0NjgsXG5cdFx0XHQzNyxcblx0XHRcdDc2LFxuXHRcdFx0NzcsXG5cdFx0XHQ3Nixcblx0XHRcdDM3LFxuXHRcdFx0MzgsXG5cdFx0XHQ3OSxcblx0XHRcdDc3LFxuXHRcdFx0NzgsXG5cdFx0XHQ3Nyxcblx0XHRcdDc5LFxuXHRcdFx0MzcsXG5cdFx0XHQ3OSxcblx0XHRcdDgwLFxuXHRcdFx0ODEsXG5cdFx0XHQ4MCxcblx0XHRcdDc5LFxuXHRcdFx0NzgsXG5cdFx0XHQ4NCxcblx0XHRcdDgyLFxuXHRcdFx0ODMsXG5cdFx0XHQ4Mixcblx0XHRcdDg0LFxuXHRcdFx0ODUsXG5cdFx0XHQ4NSxcblx0XHRcdDg2LFxuXHRcdFx0ODIsXG5cdFx0XHQ4Nixcblx0XHRcdDg1LFxuXHRcdFx0ODcsXG5cdFx0XHQ5MCxcblx0XHRcdDg4LFxuXHRcdFx0ODksXG5cdFx0XHQ4OCxcblx0XHRcdDkwLFxuXHRcdFx0OTEsXG5cdFx0XHQ5Mixcblx0XHRcdDgxLFxuXHRcdFx0ODAsXG5cdFx0XHQ4Myxcblx0XHRcdDkzLFxuXHRcdFx0ODQsXG5cdFx0XHQ5Myxcblx0XHRcdDgzLFxuXHRcdFx0OTQsXG5cdFx0XHQ5NSxcblx0XHRcdDkzLFxuXHRcdFx0OTQsXG5cdFx0XHQ5Myxcblx0XHRcdDk1LFxuXHRcdFx0OTYsXG5cdFx0XHQ0OCxcblx0XHRcdDQ3LFxuXHRcdFx0MzksXG5cdFx0XHQxMyxcblx0XHRcdDEyLFxuXHRcdFx0NzMsXG5cdFx0XHQxMixcblx0XHRcdDcwLFxuXHRcdFx0NzMsXG5cdFx0XHQ2OCxcblx0XHRcdDUzLFxuXHRcdFx0NTIsXG5cdFx0XHQ5Nyxcblx0XHRcdDM4LFxuXHRcdFx0NzUsXG5cdFx0XHQzOCxcblx0XHRcdDk3LFxuXHRcdFx0NzYsXG5cdFx0XHQxMDAsXG5cdFx0XHQ5OCxcblx0XHRcdDk5LFxuXHRcdFx0OTgsXG5cdFx0XHQxMDAsXG5cdFx0XHQxMDEsXG5cdFx0XHQxMDQsXG5cdFx0XHQxMDIsXG5cdFx0XHQxMDMsXG5cdFx0XHQxMDIsXG5cdFx0XHQxMDQsXG5cdFx0XHQxMDUsXG5cdFx0XHQxMDIsXG5cdFx0XHQxMDYsXG5cdFx0XHQxMDMsXG5cdFx0XHQxMDYsXG5cdFx0XHQxMDIsXG5cdFx0XHQxMDcsXG5cdFx0XHQxMTAsXG5cdFx0XHQxMDgsXG5cdFx0XHQxMDksXG5cdFx0XHQxMDgsXG5cdFx0XHQxMTAsXG5cdFx0XHQxMTEsXG5cdFx0XHQxMTIsXG5cdFx0XHQxMTEsXG5cdFx0XHQxMTAsXG5cdFx0XHQxMTEsXG5cdFx0XHQxMTIsXG5cdFx0XHQxMTMsXG5cdFx0XHQ4NCxcblx0XHRcdDkzLFxuXHRcdFx0MTE0LFxuXHRcdFx0MTAxLFxuXHRcdFx0MTE1LFxuXHRcdFx0OTgsXG5cdFx0XHQxMTUsXG5cdFx0XHQxMDEsXG5cdFx0XHQxMTYsXG5cdFx0XHQxMTgsXG5cdFx0XHQxMDMsXG5cdFx0XHQxMTcsXG5cdFx0XHQxMDMsXG5cdFx0XHQxMTgsXG5cdFx0XHQxMDQsXG5cdFx0XHQxMDMsXG5cdFx0XHQxMTksXG5cdFx0XHQxMTcsXG5cdFx0XHQxMTksXG5cdFx0XHQxMDMsXG5cdFx0XHQxMDYsXG5cdFx0XHQxMDgsXG5cdFx0XHQxMjAsXG5cdFx0XHQxMjEsXG5cdFx0XHQxMjAsXG5cdFx0XHQxMDgsXG5cdFx0XHQxMTEsXG5cdFx0XHQxMjIsXG5cdFx0XHQxMTUsXG5cdFx0XHQxMTYsXG5cdFx0XHQxMjYsXG5cdFx0XHQxMjMsXG5cdFx0XHQxMjQsXG5cdFx0XHQxMjYsXG5cdFx0XHQxMjQsXG5cdFx0XHQxMjUsXG5cdFx0XHQxMzAsXG5cdFx0XHQxMjcsXG5cdFx0XHQxMjgsXG5cdFx0XHQxMzAsXG5cdFx0XHQxMjgsXG5cdFx0XHQxMjksXG5cdFx0XHQxMDUsXG5cdFx0XHQxMDEsXG5cdFx0XHQxMDAsXG5cdFx0XHQxMDEsXG5cdFx0XHQxMDUsXG5cdFx0XHQxMDQsXG5cdFx0XHQxMDQsXG5cdFx0XHQxMTYsXG5cdFx0XHQxMDEsXG5cdFx0XHQxMTYsXG5cdFx0XHQxMDQsXG5cdFx0XHQxMTgsXG5cdFx0XHQxMDYsXG5cdFx0XHQxMDksXG5cdFx0XHQxMDgsXG5cdFx0XHQxMDksXG5cdFx0XHQxMDYsXG5cdFx0XHQxMDcsXG5cdFx0XHQxMTksXG5cdFx0XHQxMDgsXG5cdFx0XHQxMjEsXG5cdFx0XHQxMDgsXG5cdFx0XHQxMTksXG5cdFx0XHQxMDYsXG5cdFx0XHQxMjUsXG5cdFx0XHQxMjQsXG5cdFx0XHQ5OCxcblx0XHRcdDEyNSxcblx0XHRcdDk4LFxuXHRcdFx0MTE1LFxuXHRcdFx0MTI0LFxuXHRcdFx0MTIzLFxuXHRcdFx0MTMwLFxuXHRcdFx0MTI0LFxuXHRcdFx0MTMwLFxuXHRcdFx0MTI5LFxuXHRcdFx0MTMxLFxuXHRcdFx0MTAwLFxuXHRcdFx0OTksXG5cdFx0XHQxMDAsXG5cdFx0XHQxMzEsXG5cdFx0XHQxMzIsXG5cdFx0XHQ4LFxuXHRcdFx0MTAyLFxuXHRcdFx0MTA1LFxuXHRcdFx0MTAyLFxuXHRcdFx0OCxcblx0XHRcdDIyLFxuXHRcdFx0MjIsXG5cdFx0XHQxMDcsXG5cdFx0XHQxMDIsXG5cdFx0XHQxMDcsXG5cdFx0XHQyMixcblx0XHRcdDEzMyxcblx0XHRcdDEzNCxcblx0XHRcdDExMCxcblx0XHRcdDEwOSxcblx0XHRcdDExMCxcblx0XHRcdDEzNCxcblx0XHRcdDEzNSxcblx0XHRcdDEzNSxcblx0XHRcdDExMixcblx0XHRcdDExMCxcblx0XHRcdDExMixcblx0XHRcdDEzNSxcblx0XHRcdDEzNixcblx0XHRcdDk4LFxuXHRcdFx0MTI0LFxuXHRcdFx0MTI5LFxuXHRcdFx0OTgsXG5cdFx0XHQxMjksXG5cdFx0XHQ5OSxcblx0XHRcdDEzOCxcblx0XHRcdDEyNyxcblx0XHRcdDEzNyxcblx0XHRcdDEzOCxcblx0XHRcdDEzNyxcblx0XHRcdDExNCxcblx0XHRcdDEzMixcblx0XHRcdDEwNSxcblx0XHRcdDEwMCxcblx0XHRcdDEwNSxcblx0XHRcdDEzMixcblx0XHRcdDgsXG5cdFx0XHQxMzMsXG5cdFx0XHQxMDksXG5cdFx0XHQxMDcsXG5cdFx0XHQxMDksXG5cdFx0XHQxMzMsXG5cdFx0XHQxMzQsXG5cdFx0XHQ4LFxuXHRcdFx0MTM5LFxuXHRcdFx0NCxcblx0XHRcdDEzOSxcblx0XHRcdDgsXG5cdFx0XHQxMzIsXG5cdFx0XHQxMzIsXG5cdFx0XHQxNDAsXG5cdFx0XHQxMzksXG5cdFx0XHQxNDAsXG5cdFx0XHQxMzIsXG5cdFx0XHQxMzEsXG5cdFx0XHQxMTQsXG5cdFx0XHQxMzcsXG5cdFx0XHQxMzYsXG5cdFx0XHQxMTQsXG5cdFx0XHQxMzYsXG5cdFx0XHQxNDEsXG5cdFx0XHQxMTQsXG5cdFx0XHQxNDEsXG5cdFx0XHQ4NCxcblx0XHRcdDQsXG5cdFx0XHQxNDIsXG5cdFx0XHQ1LFxuXHRcdFx0MTQyLFxuXHRcdFx0NCxcblx0XHRcdDEzOSxcblx0XHRcdDEzOSxcblx0XHRcdDE0Myxcblx0XHRcdDE0Mixcblx0XHRcdDE0Myxcblx0XHRcdDEzOSxcblx0XHRcdDE0MCxcblx0XHRcdDE0Nixcblx0XHRcdDE0NCxcblx0XHRcdDE0NSxcblx0XHRcdDE0NCxcblx0XHRcdDE0Nixcblx0XHRcdDE0Nyxcblx0XHRcdDE0NSxcblx0XHRcdDExNCxcblx0XHRcdDkzLFxuXHRcdFx0MTE0LFxuXHRcdFx0MTQ1LFxuXHRcdFx0MTQ0LFxuXHRcdFx0MTQ4LFxuXHRcdFx0MTQ3LFxuXHRcdFx0MTQ2LFxuXHRcdFx0MTQ3LFxuXHRcdFx0MTQ4LFxuXHRcdFx0MTQ5LFxuXHRcdFx0MTQ1LFxuXHRcdFx0MTUwLFxuXHRcdFx0MTQ2LFxuXHRcdFx0MTUwLFxuXHRcdFx0MTQ1LFxuXHRcdFx0MTUxLFxuXHRcdFx0OTMsXG5cdFx0XHQxNTEsXG5cdFx0XHQxNDUsXG5cdFx0XHQxNTEsXG5cdFx0XHQ5Myxcblx0XHRcdDk2LFxuXHRcdFx0MTUwLFxuXHRcdFx0MTQ4LFxuXHRcdFx0MTQ2LFxuXHRcdFx0MTQ4LFxuXHRcdFx0MTUwLFxuXHRcdFx0MTUyLFxuXHRcdFx0MTUxLFxuXHRcdFx0MTUzLFxuXHRcdFx0MTU0LFxuXHRcdFx0MTUxLFxuXHRcdFx0OTYsXG5cdFx0XHQxNTMsXG5cdFx0XHQxNTAsXG5cdFx0XHQxNTUsXG5cdFx0XHQxNTIsXG5cdFx0XHQxNTUsXG5cdFx0XHQxNTAsXG5cdFx0XHQxNTYsXG5cdFx0XHQxNTcsXG5cdFx0XHQxMzYsXG5cdFx0XHQxMzUsXG5cdFx0XHQxMzYsXG5cdFx0XHQxNTcsXG5cdFx0XHQxNDEsXG5cdFx0XHQxMzUsXG5cdFx0XHQxNTgsXG5cdFx0XHQxNTcsXG5cdFx0XHQxNTgsXG5cdFx0XHQxMzUsXG5cdFx0XHQxMzQsXG5cdFx0XHQxMzQsXG5cdFx0XHQxNTksXG5cdFx0XHQxNTgsXG5cdFx0XHQxNTksXG5cdFx0XHQxMzQsXG5cdFx0XHQxMzMsXG5cdFx0XHQxMzMsXG5cdFx0XHQyMyxcblx0XHRcdDE1OSxcblx0XHRcdDIzLFxuXHRcdFx0MTMzLFxuXHRcdFx0MjIsXG5cdFx0XHQzMSxcblx0XHRcdDE1OSxcblx0XHRcdDIzLFxuXHRcdFx0MTU5LFxuXHRcdFx0MzEsXG5cdFx0XHQxNjAsXG5cdFx0XHQyNyxcblx0XHRcdDE2MSxcblx0XHRcdDI4LFxuXHRcdFx0MTYxLFxuXHRcdFx0MjcsXG5cdFx0XHQxNjIsXG5cdFx0XHQyOCxcblx0XHRcdDE2MCxcblx0XHRcdDMxLFxuXHRcdFx0MTYwLFxuXHRcdFx0MjgsXG5cdFx0XHQxNjEsXG5cdFx0XHQzNCxcblx0XHRcdDE2Mixcblx0XHRcdDI3LFxuXHRcdFx0MTYyLFxuXHRcdFx0MzQsXG5cdFx0XHQxNjMsXG5cdFx0XHQ3OSxcblx0XHRcdDM0LFxuXHRcdFx0MzcsXG5cdFx0XHQzNCxcblx0XHRcdDc5LFxuXHRcdFx0MTYzLFxuXHRcdFx0MTYwLFxuXHRcdFx0MTU4LFxuXHRcdFx0MTU5LFxuXHRcdFx0MTU4LFxuXHRcdFx0MTYwLFxuXHRcdFx0MTY0LFxuXHRcdFx0MTYyLFxuXHRcdFx0MTY1LFxuXHRcdFx0MTYxLFxuXHRcdFx0MTY1LFxuXHRcdFx0MTYyLFxuXHRcdFx0MTY2LFxuXHRcdFx0MTYxLFxuXHRcdFx0MTY0LFxuXHRcdFx0MTYwLFxuXHRcdFx0MTY0LFxuXHRcdFx0MTYxLFxuXHRcdFx0MTY1LFxuXHRcdFx0MTYzLFxuXHRcdFx0MTY2LFxuXHRcdFx0MTYyLFxuXHRcdFx0MTY2LFxuXHRcdFx0MTYzLFxuXHRcdFx0MTY3LFxuXHRcdFx0ODEsXG5cdFx0XHQxNjMsXG5cdFx0XHQ3OSxcblx0XHRcdDE2Myxcblx0XHRcdDgxLFxuXHRcdFx0MTY3LFxuXHRcdFx0MTY0LFxuXHRcdFx0MTU3LFxuXHRcdFx0MTU4LFxuXHRcdFx0MTU3LFxuXHRcdFx0MTY0LFxuXHRcdFx0ODUsXG5cdFx0XHQxNjYsXG5cdFx0XHQ4Nyxcblx0XHRcdDE2NSxcblx0XHRcdDg3LFxuXHRcdFx0MTY2LFxuXHRcdFx0ODgsXG5cdFx0XHQxNjUsXG5cdFx0XHQ4NSxcblx0XHRcdDE2NCxcblx0XHRcdDg1LFxuXHRcdFx0MTY1LFxuXHRcdFx0ODcsXG5cdFx0XHQxNjcsXG5cdFx0XHQ4OCxcblx0XHRcdDE2Nixcblx0XHRcdDg4LFxuXHRcdFx0MTY3LFxuXHRcdFx0ODksXG5cdFx0XHQ5Mixcblx0XHRcdDE2Nyxcblx0XHRcdDgxLFxuXHRcdFx0MTY3LFxuXHRcdFx0OTIsXG5cdFx0XHQ4OSxcblx0XHRcdDg1LFxuXHRcdFx0MTQxLFxuXHRcdFx0MTU3LFxuXHRcdFx0MTQxLFxuXHRcdFx0ODUsXG5cdFx0XHQ4NCxcblx0XHRcdDEyMCxcblx0XHRcdDExMyxcblx0XHRcdDE2OCxcblx0XHRcdDExMyxcblx0XHRcdDEyMCxcblx0XHRcdDExMSxcblx0XHRcdDE3MCxcblx0XHRcdDE2OSxcblx0XHRcdDksXG5cdFx0XHQ5MSxcblx0XHRcdDg3LFxuXHRcdFx0ODgsXG5cdFx0XHQ4Nyxcblx0XHRcdDkxLFxuXHRcdFx0ODYsXG5cdFx0XHQxNTQsXG5cdFx0XHQxNTAsXG5cdFx0XHQxNTEsXG5cdFx0XHQxNTAsXG5cdFx0XHQxNTQsXG5cdFx0XHQxNTYsXG5cdFx0XHQxNTMsXG5cdFx0XHQ5Nixcblx0XHRcdDk1LFxuXHRcdFx0NTAsXG5cdFx0XHQ0OSxcblx0XHRcdDE3MSxcblx0XHRcdDQ3LFxuXHRcdFx0MzgsXG5cdFx0XHQzOSxcblx0XHRcdDM4LFxuXHRcdFx0NDcsXG5cdFx0XHQ3NSxcblx0XHRcdDUyLFxuXHRcdFx0NjcsXG5cdFx0XHQ2OCxcblx0XHRcdDcyLFxuXHRcdFx0NjgsXG5cdFx0XHQ2Nyxcblx0XHRcdDExOCxcblx0XHRcdDEyMixcblx0XHRcdDExNixcblx0XHRcdDE0Myxcblx0XHRcdDE0Nyxcblx0XHRcdDE0OSxcblx0XHRcdDE0Nyxcblx0XHRcdDE0Myxcblx0XHRcdDE0MCxcblx0XHRcdDE3Mixcblx0XHRcdDE0Nyxcblx0XHRcdDE0MCxcblx0XHRcdDE0MCxcblx0XHRcdDEzMSxcblx0XHRcdDEyOCxcblx0XHRcdDE0MCxcblx0XHRcdDEyOCxcblx0XHRcdDE3Mixcblx0XHRcdDEyOSxcblx0XHRcdDEyOCxcblx0XHRcdDEzMSxcblx0XHRcdDEyOSxcblx0XHRcdDEzMSxcblx0XHRcdDk5LFxuXHRcdFx0MTEyLFxuXHRcdFx0MTM2LFxuXHRcdFx0MTM3LFxuXHRcdFx0MTEyLFxuXHRcdFx0MTM3LFxuXHRcdFx0MTczLFxuXHRcdFx0MTEyLFxuXHRcdFx0MTczLFxuXHRcdFx0MTc0LFxuXHRcdFx0MTEyLFxuXHRcdFx0MTc0LFxuXHRcdFx0MTEzLFxuXHRcdFx0MTc0LFxuXHRcdFx0MTc1LFxuXHRcdFx0MTY4LFxuXHRcdFx0MTc0LFxuXHRcdFx0MTY4LFxuXHRcdFx0MTEzLFxuXHRcdFx0MTczLFxuXHRcdFx0MTM3LFxuXHRcdFx0MTI3LFxuXHRcdFx0MTczLFxuXHRcdFx0MTI3LFxuXHRcdFx0MTMwLFxuXHRcdFx0MTczLFxuXHRcdFx0MTMwLFxuXHRcdFx0MTIzLFxuXHRcdFx0MTczLFxuXHRcdFx0MTIzLFxuXHRcdFx0MTc0LFxuXHRcdFx0MTIzLFxuXHRcdFx0MTI2LFxuXHRcdFx0MTc1LFxuXHRcdFx0MTIzLFxuXHRcdFx0MTc1LFxuXHRcdFx0MTc0LFxuXHRcdFx0MTQ0LFxuXHRcdFx0MTQ3LFxuXHRcdFx0MTcyLFxuXHRcdFx0MTQ0LFxuXHRcdFx0MTM4LFxuXHRcdFx0MTE0LFxuXHRcdFx0MTcyLFxuXHRcdFx0MTM4LFxuXHRcdFx0MTQ0LFxuXHRcdFx0MTcyLFxuXHRcdFx0MTI4LFxuXHRcdFx0MTI3LFxuXHRcdFx0MTcyLFxuXHRcdFx0MTI3LFxuXHRcdFx0MTM4LFxuXHRcdFx0NDgsXG5cdFx0XHQzOSxcblx0XHRcdDUxLFxuXHRcdFx0OTAsXG5cdFx0XHQ4OSxcblx0XHRcdDkyLFxuXHRcdFx0NDksXG5cdFx0XHQ1Nyxcblx0XHRcdDE3Nixcblx0XHRcdDQ5LFxuXHRcdFx0MTc2LFxuXHRcdFx0MTcxLFxuXHRcdFx0NzQsXG5cdFx0XHQxNzcsXG5cdFx0XHQ5Nyxcblx0XHRcdDc0LFxuXHRcdFx0OTcsXG5cdFx0XHQ3NSxcblx0XHRcdDMsXG5cdFx0XHQxNzAsXG5cdFx0XHQwLFxuXHRcdFx0MTcwLFxuXHRcdFx0Myxcblx0XHRcdDEzLFxuXHRcdFx0MTcwLFxuXHRcdFx0Nyxcblx0XHRcdDAsXG5cdFx0XHQ3LFxuXHRcdFx0MTcwLFxuXHRcdFx0OSxcblx0XHRcdDIxLFxuXHRcdFx0OSxcblx0XHRcdDE2OSxcblx0XHRcdDE2OSxcblx0XHRcdDI0LFxuXHRcdFx0MjEsXG5cdFx0XHQyNCxcblx0XHRcdDE2OSxcblx0XHRcdDcxLFxuXHRcdFx0NTAsXG5cdFx0XHQxNzgsXG5cdFx0XHQ0NCxcblx0XHRcdDUwLFxuXHRcdFx0NDQsXG5cdFx0XHQ0OCxcblx0XHRcdDE3MSxcblx0XHRcdDE3OSxcblx0XHRcdDE3OCxcblx0XHRcdDE3MSxcblx0XHRcdDE3OCxcblx0XHRcdDUwLFxuXHRcdFx0NDQsXG5cdFx0XHQxNzgsXG5cdFx0XHQxODAsXG5cdFx0XHQ0NCxcblx0XHRcdDE4MCxcblx0XHRcdDQ1LFxuXHRcdFx0MTgxLFxuXHRcdFx0MTgwLFxuXHRcdFx0MTc4LFxuXHRcdFx0MTgxLFxuXHRcdFx0MTc4LFxuXHRcdFx0MTc5LFxuXHRcdFx0MTgzLFxuXHRcdFx0MTgxLFxuXHRcdFx0MTc5LFxuXHRcdFx0MTgzLFxuXHRcdFx0MTc5LFxuXHRcdFx0MTgyLFxuXHRcdFx0NzMsXG5cdFx0XHQ3MSxcblx0XHRcdDE2OSxcblx0XHRcdDE2OSxcblx0XHRcdDEzLFxuXHRcdFx0NzMsXG5cdFx0XHQxMyxcblx0XHRcdDE2OSxcblx0XHRcdDE3MCxcblx0XHRcdDE4Mixcblx0XHRcdDE3OSxcblx0XHRcdDE3MSxcblx0XHRcdDE4Mixcblx0XHRcdDE3MSxcblx0XHRcdDE3Nixcblx0XHRcdDEsXG5cdFx0XHQxODQsXG5cdFx0XHQyLFxuXHRcdFx0MTg1LFxuXHRcdFx0Mixcblx0XHRcdDE4NCxcblx0XHRcdDUsXG5cdFx0XHQxODYsXG5cdFx0XHQ2LFxuXHRcdFx0MTg3LFxuXHRcdFx0Nixcblx0XHRcdDE4Nixcblx0XHRcdDE4Nixcblx0XHRcdDE4OCxcblx0XHRcdDE4Nyxcblx0XHRcdDE4OSxcblx0XHRcdDE4Nyxcblx0XHRcdDE4OCxcblx0XHRcdDIsXG5cdFx0XHQxODUsXG5cdFx0XHQxMCxcblx0XHRcdDE5MCxcblx0XHRcdDEwLFxuXHRcdFx0MTg1LFxuXHRcdFx0MTkwLFxuXHRcdFx0MTg1LFxuXHRcdFx0MTkxLFxuXHRcdFx0MTkyLFxuXHRcdFx0MTkxLFxuXHRcdFx0MTg1LFxuXHRcdFx0MTQsXG5cdFx0XHQxMCxcblx0XHRcdDE5Myxcblx0XHRcdDE5MCxcblx0XHRcdDE5Myxcblx0XHRcdDEwLFxuXHRcdFx0MTkzLFxuXHRcdFx0MTkwLFxuXHRcdFx0MTk0LFxuXHRcdFx0MTkxLFxuXHRcdFx0MTk0LFxuXHRcdFx0MTkwLFxuXHRcdFx0MTkzLFxuXHRcdFx0MTk1LFxuXHRcdFx0MTQsXG5cdFx0XHQxOCxcblx0XHRcdDE0LFxuXHRcdFx0MTk1LFxuXHRcdFx0MTk1LFxuXHRcdFx0MTk2LFxuXHRcdFx0MTgsXG5cdFx0XHQyMCxcblx0XHRcdDE4LFxuXHRcdFx0MTk2LFxuXHRcdFx0MTkzLFxuXHRcdFx0MTk0LFxuXHRcdFx0MTk1LFxuXHRcdFx0MTk2LFxuXHRcdFx0MTk1LFxuXHRcdFx0MTk0LFxuXHRcdFx0MSxcblx0XHRcdDYsXG5cdFx0XHQxODQsXG5cdFx0XHQxODcsXG5cdFx0XHQxODQsXG5cdFx0XHQ2LFxuXHRcdFx0MTg4LFxuXHRcdFx0MTk3LFxuXHRcdFx0MTg5LFxuXHRcdFx0MTg4LFxuXHRcdFx0MTk4LFxuXHRcdFx0MTk3LFxuXHRcdFx0MTk4LFxuXHRcdFx0MTk5LFxuXHRcdFx0MTk3LFxuXHRcdFx0MjAwLFxuXHRcdFx0MTk3LFxuXHRcdFx0MTk5LFxuXHRcdFx0MjAzLFxuXHRcdFx0MjAxLFxuXHRcdFx0MjAyLFxuXHRcdFx0MjA0LFxuXHRcdFx0MjAyLFxuXHRcdFx0MjAxLFxuXHRcdFx0MjA2LFxuXHRcdFx0MjA1LFxuXHRcdFx0MjAzLFxuXHRcdFx0MjAxLFxuXHRcdFx0MjAzLFxuXHRcdFx0MjA1LFxuXHRcdFx0MjA4LFxuXHRcdFx0MjA0LFxuXHRcdFx0MjA3LFxuXHRcdFx0MjAxLFxuXHRcdFx0MjA3LFxuXHRcdFx0MjA0LFxuXHRcdFx0MjA3LFxuXHRcdFx0MjAxLFxuXHRcdFx0MjA5LFxuXHRcdFx0MjA1LFxuXHRcdFx0MjA5LFxuXHRcdFx0MjAxLFxuXHRcdFx0MjAyLFxuXHRcdFx0MjEwLFxuXHRcdFx0MjAzLFxuXHRcdFx0MjExLFxuXHRcdFx0MjAzLFxuXHRcdFx0MjEwLFxuXHRcdFx0MjAzLFxuXHRcdFx0MjExLFxuXHRcdFx0MjA2LFxuXHRcdFx0MjEyLFxuXHRcdFx0MjA2LFxuXHRcdFx0MjExLFxuXHRcdFx0MjEwLFxuXHRcdFx0MjEzLFxuXHRcdFx0MjExLFxuXHRcdFx0MjE0LFxuXHRcdFx0MjExLFxuXHRcdFx0MjEzLFxuXHRcdFx0MjExLFxuXHRcdFx0MjE0LFxuXHRcdFx0MjEyLFxuXHRcdFx0MjE1LFxuXHRcdFx0MjEyLFxuXHRcdFx0MjE0LFxuXHRcdFx0MjE5LFxuXHRcdFx0MjE2LFxuXHRcdFx0MjE3LFxuXHRcdFx0MjE5LFxuXHRcdFx0MjE3LFxuXHRcdFx0MjE4LFxuXHRcdFx0NDUsXG5cdFx0XHQyMjAsXG5cdFx0XHQyMjEsXG5cdFx0XHQ0NSxcblx0XHRcdDIyMSxcblx0XHRcdDQ2LFxuXHRcdFx0MjIxLFxuXHRcdFx0MjIwLFxuXHRcdFx0MjIyLFxuXHRcdFx0MjI1LFxuXHRcdFx0MjIzLFxuXHRcdFx0MjI0LFxuXHRcdFx0MjI1LFxuXHRcdFx0MjI0LFxuXHRcdFx0MjIyLFxuXHRcdFx0MjE3LFxuXHRcdFx0MjE2LFxuXHRcdFx0MjI2LFxuXHRcdFx0MjE3LFxuXHRcdFx0MjI2LFxuXHRcdFx0MjI3LFxuXHRcdFx0MjI5LFxuXHRcdFx0MjI4LFxuXHRcdFx0MjE5LFxuXHRcdFx0MjI5LFxuXHRcdFx0MjE5LFxuXHRcdFx0MjE4LFxuXHRcdFx0MjIzLFxuXHRcdFx0MjMwLFxuXHRcdFx0MjI4LFxuXHRcdFx0MjMxLFxuXHRcdFx0MjMwLFxuXHRcdFx0MjIzLFxuXHRcdFx0MjM0LFxuXHRcdFx0MjMyLFxuXHRcdFx0MjMzLFxuXHRcdFx0MjM0LFxuXHRcdFx0MjMzLFxuXHRcdFx0MjE5LFxuXHRcdFx0MjM0LFxuXHRcdFx0MjE5LFxuXHRcdFx0MjMwLFxuXHRcdFx0MjE2LFxuXHRcdFx0MjMzLFxuXHRcdFx0MjM1LFxuXHRcdFx0MjE2LFxuXHRcdFx0MjM1LFxuXHRcdFx0MjI2LFxuXHRcdFx0MjE5LFxuXHRcdFx0MjMzLFxuXHRcdFx0MjE2LFxuXHRcdFx0MjI4LFxuXHRcdFx0MjMwLFxuXHRcdFx0MjE5LFxuXHRcdFx0MjMzLFxuXHRcdFx0MjMyLFxuXHRcdFx0MjM2LFxuXHRcdFx0MjMzLFxuXHRcdFx0MjM2LFxuXHRcdFx0MjM1LFxuXHRcdFx0MjIzLFxuXHRcdFx0MjI4LFxuXHRcdFx0MjI5LFxuXHRcdFx0MjIzLFxuXHRcdFx0MjI5LFxuXHRcdFx0MjI0LFxuXHRcdFx0MjI2LFxuXHRcdFx0MjM1LFxuXHRcdFx0NjQsXG5cdFx0XHQyMjYsXG5cdFx0XHQ2NCxcblx0XHRcdDYzLFxuXHRcdFx0MjM1LFxuXHRcdFx0MjM2LFxuXHRcdFx0NjUsXG5cdFx0XHQyMzUsXG5cdFx0XHQ2NSxcblx0XHRcdDY0LFxuXHRcdFx0MjE1LFxuXHRcdFx0MjI0LFxuXHRcdFx0MjEyLFxuXHRcdFx0MjI5LFxuXHRcdFx0MjEyLFxuXHRcdFx0MjI0LFxuXHRcdFx0MjI5LFxuXHRcdFx0MjE4LFxuXHRcdFx0MjEyLFxuXHRcdFx0MjA2LFxuXHRcdFx0MjEyLFxuXHRcdFx0MjE4LFxuXHRcdFx0MjE4LFxuXHRcdFx0MjE3LFxuXHRcdFx0MjA2LFxuXHRcdFx0MjA1LFxuXHRcdFx0MjA2LFxuXHRcdFx0MjE3LFxuXHRcdFx0MjA5LFxuXHRcdFx0MjA1LFxuXHRcdFx0MjM3LFxuXHRcdFx0MjE3LFxuXHRcdFx0MjM3LFxuXHRcdFx0MjA1LFxuXHRcdFx0MjI3LFxuXHRcdFx0MjM4LFxuXHRcdFx0MjM3LFxuXHRcdFx0MjE3LFxuXHRcdFx0MjI3LFxuXHRcdFx0MjM3LFxuXHRcdFx0MjI2LFxuXHRcdFx0NjMsXG5cdFx0XHQyMzksXG5cdFx0XHQyMzksXG5cdFx0XHQ2Myxcblx0XHRcdDY5LFxuXHRcdFx0MjM3LFxuXHRcdFx0MjQwLFxuXHRcdFx0MjA5LFxuXHRcdFx0MjQxLFxuXHRcdFx0MjA5LFxuXHRcdFx0MjQwLFxuXHRcdFx0MjM3LFxuXHRcdFx0MjM4LFxuXHRcdFx0MjQwLFxuXHRcdFx0MTk2LFxuXHRcdFx0MjQwLFxuXHRcdFx0MjM4LFxuXHRcdFx0NzIsXG5cdFx0XHQyMCxcblx0XHRcdDIzOCxcblx0XHRcdDE5Nixcblx0XHRcdDIzOCxcblx0XHRcdDIwLFxuXHRcdFx0MjA5LFxuXHRcdFx0MjQxLFxuXHRcdFx0MjA3LFxuXHRcdFx0MjAwLFxuXHRcdFx0MjA3LFxuXHRcdFx0MjQxLFxuXHRcdFx0MjA3LFxuXHRcdFx0MjAwLFxuXHRcdFx0MjA4LFxuXHRcdFx0MTk5LFxuXHRcdFx0MjA4LFxuXHRcdFx0MjAwLFxuXHRcdFx0MTkxLFxuXHRcdFx0MjQwLFxuXHRcdFx0MTk0LFxuXHRcdFx0MTk2LFxuXHRcdFx0MTk0LFxuXHRcdFx0MjQwLFxuXHRcdFx0MjQwLFxuXHRcdFx0MjQyLFxuXHRcdFx0MjQxLFxuXHRcdFx0MjQzLFxuXHRcdFx0NzQsXG5cdFx0XHQ0Nixcblx0XHRcdDI0Myxcblx0XHRcdDQ2LFxuXHRcdFx0MjIxLFxuXHRcdFx0MjM5LFxuXHRcdFx0NjksXG5cdFx0XHQ3Mixcblx0XHRcdDI0NSxcblx0XHRcdDI0NCxcblx0XHRcdDIxMyxcblx0XHRcdDIxNCxcblx0XHRcdDIxMyxcblx0XHRcdDI0NCxcblx0XHRcdDI0Nyxcblx0XHRcdDI0NSxcblx0XHRcdDI0Nixcblx0XHRcdDIxMyxcblx0XHRcdDI0Nixcblx0XHRcdDI0NSxcblx0XHRcdDI0OSxcblx0XHRcdDI0OCxcblx0XHRcdDI0Nixcblx0XHRcdDI0Nyxcblx0XHRcdDI0Nixcblx0XHRcdDI0OCxcblx0XHRcdDI1Mixcblx0XHRcdDI1MCxcblx0XHRcdDI1MSxcblx0XHRcdDI1Myxcblx0XHRcdDI1MSxcblx0XHRcdDI1MCxcblx0XHRcdDI1MCxcblx0XHRcdDI1NCxcblx0XHRcdDI1Myxcblx0XHRcdDI1NSxcblx0XHRcdDI1Myxcblx0XHRcdDI1NCxcblx0XHRcdDI1OCxcblx0XHRcdDI1Nixcblx0XHRcdDI1Nyxcblx0XHRcdDI1OSxcblx0XHRcdDI1Nyxcblx0XHRcdDI1Nixcblx0XHRcdDI0OCxcblx0XHRcdDI0OSxcblx0XHRcdDI2MCxcblx0XHRcdDI1MSxcblx0XHRcdDI2MSxcblx0XHRcdDI1Mixcblx0XHRcdDI2Mixcblx0XHRcdDI1Mixcblx0XHRcdDI2MSxcblx0XHRcdDI2Mixcblx0XHRcdDI2MSxcblx0XHRcdDI2Myxcblx0XHRcdDI2NCxcblx0XHRcdDI2Myxcblx0XHRcdDI2MSxcblx0XHRcdDIxNSxcblx0XHRcdDIyMSxcblx0XHRcdDIyMixcblx0XHRcdDI0Mixcblx0XHRcdDE5MSxcblx0XHRcdDE5Mixcblx0XHRcdDI0Mixcblx0XHRcdDI0MCxcblx0XHRcdDE5MSxcblx0XHRcdDIyNyxcblx0XHRcdDIyNixcblx0XHRcdDIzOSxcblx0XHRcdDI0Myxcblx0XHRcdDIxNCxcblx0XHRcdDI2NSxcblx0XHRcdDI0NCxcblx0XHRcdDI2NSxcblx0XHRcdDIxNCxcblx0XHRcdDI2OCxcblx0XHRcdDI2Nixcblx0XHRcdDI2Nyxcblx0XHRcdDI2OSxcblx0XHRcdDI2Nyxcblx0XHRcdDI2Nixcblx0XHRcdDI3Mixcblx0XHRcdDI3MCxcblx0XHRcdDI3MSxcblx0XHRcdDI3Myxcblx0XHRcdDI3MSxcblx0XHRcdDI3MCxcblx0XHRcdDI3Mixcblx0XHRcdDI3NCxcblx0XHRcdDI3MCxcblx0XHRcdDI3NSxcblx0XHRcdDI3MCxcblx0XHRcdDI3NCxcblx0XHRcdDI3OCxcblx0XHRcdDI3Nixcblx0XHRcdDI3Nyxcblx0XHRcdDI3OSxcblx0XHRcdDI3Nyxcblx0XHRcdDI3Nixcblx0XHRcdDI3Nyxcblx0XHRcdDI3OSxcblx0XHRcdDI4MCxcblx0XHRcdDI4MSxcblx0XHRcdDI4MCxcblx0XHRcdDI3OSxcblx0XHRcdDI4Mixcblx0XHRcdDI2MSxcblx0XHRcdDI1MSxcblx0XHRcdDI2Nixcblx0XHRcdDI4Myxcblx0XHRcdDI2OSxcblx0XHRcdDI4NCxcblx0XHRcdDI2OSxcblx0XHRcdDI4Myxcblx0XHRcdDI4Nixcblx0XHRcdDI3Mixcblx0XHRcdDI4NSxcblx0XHRcdDI3MSxcblx0XHRcdDI4NSxcblx0XHRcdDI3Mixcblx0XHRcdDI4Nixcblx0XHRcdDI4Nyxcblx0XHRcdDI3Mixcblx0XHRcdDI3NCxcblx0XHRcdDI3Mixcblx0XHRcdDI4Nyxcblx0XHRcdDI4OSxcblx0XHRcdDI4OCxcblx0XHRcdDI3Nixcblx0XHRcdDI3OSxcblx0XHRcdDI3Nixcblx0XHRcdDI4OCxcblx0XHRcdDI4NCxcblx0XHRcdDI4Myxcblx0XHRcdDI5MCxcblx0XHRcdDI5NCxcblx0XHRcdDI5MSxcblx0XHRcdDI5Mixcblx0XHRcdDI5NCxcblx0XHRcdDI5Mixcblx0XHRcdDI5Myxcblx0XHRcdDI5OCxcblx0XHRcdDI5NSxcblx0XHRcdDI5Nixcblx0XHRcdDI5OCxcblx0XHRcdDI5Nixcblx0XHRcdDI5Nyxcblx0XHRcdDI2Nyxcblx0XHRcdDI2OSxcblx0XHRcdDI3Myxcblx0XHRcdDI3MSxcblx0XHRcdDI3Myxcblx0XHRcdDI2OSxcblx0XHRcdDI2OSxcblx0XHRcdDI4NCxcblx0XHRcdDI3MSxcblx0XHRcdDI4NSxcblx0XHRcdDI3MSxcblx0XHRcdDI4NCxcblx0XHRcdDI3Nixcblx0XHRcdDI3OCxcblx0XHRcdDI3NCxcblx0XHRcdDI3NSxcblx0XHRcdDI3NCxcblx0XHRcdDI3OCxcblx0XHRcdDI4OSxcblx0XHRcdDI3Nixcblx0XHRcdDI4Nyxcblx0XHRcdDI3NCxcblx0XHRcdDI4Nyxcblx0XHRcdDI3Nixcblx0XHRcdDI2Nixcblx0XHRcdDI5NCxcblx0XHRcdDI5Myxcblx0XHRcdDI2Nixcblx0XHRcdDI5Myxcblx0XHRcdDI4Myxcblx0XHRcdDI5Nixcblx0XHRcdDI5MSxcblx0XHRcdDI5NCxcblx0XHRcdDI5Nixcblx0XHRcdDI5NCxcblx0XHRcdDI5Nyxcblx0XHRcdDI2OCxcblx0XHRcdDI2Nyxcblx0XHRcdDI5OSxcblx0XHRcdDMwMCxcblx0XHRcdDI5OSxcblx0XHRcdDI2Nyxcblx0XHRcdDI3Myxcblx0XHRcdDI3MCxcblx0XHRcdDE4OCxcblx0XHRcdDE5OCxcblx0XHRcdDE4OCxcblx0XHRcdDI3MCxcblx0XHRcdDI3MCxcblx0XHRcdDI3NSxcblx0XHRcdDE5OCxcblx0XHRcdDMwMSxcblx0XHRcdDE5OCxcblx0XHRcdDI3NSxcblx0XHRcdDI3OCxcblx0XHRcdDI3Nyxcblx0XHRcdDMwMixcblx0XHRcdDMwMyxcblx0XHRcdDMwMixcblx0XHRcdDI3Nyxcblx0XHRcdDI3Nyxcblx0XHRcdDI4MCxcblx0XHRcdDMwMyxcblx0XHRcdDMwNCxcblx0XHRcdDMwMyxcblx0XHRcdDI4MCxcblx0XHRcdDI5Nyxcblx0XHRcdDI5NCxcblx0XHRcdDI2Nixcblx0XHRcdDI5Nyxcblx0XHRcdDI2Nixcblx0XHRcdDI2OCxcblx0XHRcdDMwNixcblx0XHRcdDI5NSxcblx0XHRcdDMwNSxcblx0XHRcdDMwNixcblx0XHRcdDMwNSxcblx0XHRcdDI4Mixcblx0XHRcdDI2Nyxcblx0XHRcdDI3Myxcblx0XHRcdDMwMCxcblx0XHRcdDE4OCxcblx0XHRcdDMwMCxcblx0XHRcdDI3Myxcblx0XHRcdDI3NSxcblx0XHRcdDI3OCxcblx0XHRcdDMwMSxcblx0XHRcdDMwMixcblx0XHRcdDMwMSxcblx0XHRcdDI3OCxcblx0XHRcdDE4Nixcblx0XHRcdDMwNyxcblx0XHRcdDE4OCxcblx0XHRcdDMwMCxcblx0XHRcdDE4OCxcblx0XHRcdDMwNyxcblx0XHRcdDMwNyxcblx0XHRcdDMwOCxcblx0XHRcdDMwMCxcblx0XHRcdDI5OSxcblx0XHRcdDMwMCxcblx0XHRcdDMwOCxcblx0XHRcdDMwNCxcblx0XHRcdDMwNixcblx0XHRcdDI4Mixcblx0XHRcdDMwNCxcblx0XHRcdDI4Mixcblx0XHRcdDMwOSxcblx0XHRcdDI1MSxcblx0XHRcdDMwOSxcblx0XHRcdDI4Mixcblx0XHRcdDUsXG5cdFx0XHQxNDIsXG5cdFx0XHQxODYsXG5cdFx0XHQzMDcsXG5cdFx0XHQxODYsXG5cdFx0XHQxNDIsXG5cdFx0XHQxNDIsXG5cdFx0XHQxNDMsXG5cdFx0XHQzMDcsXG5cdFx0XHQzMDgsXG5cdFx0XHQzMDcsXG5cdFx0XHQxNDMsXG5cdFx0XHQzMTIsXG5cdFx0XHQzMTAsXG5cdFx0XHQzMTEsXG5cdFx0XHQzMTMsXG5cdFx0XHQzMTEsXG5cdFx0XHQzMTAsXG5cdFx0XHQyNjEsXG5cdFx0XHQyODIsXG5cdFx0XHQzMTIsXG5cdFx0XHQzMTAsXG5cdFx0XHQzMTIsXG5cdFx0XHQyODIsXG5cdFx0XHQzMTEsXG5cdFx0XHQzMTMsXG5cdFx0XHQxNDgsXG5cdFx0XHQxNDksXG5cdFx0XHQxNDgsXG5cdFx0XHQzMTMsXG5cdFx0XHQzMTEsXG5cdFx0XHQzMTQsXG5cdFx0XHQzMTIsXG5cdFx0XHQzMTUsXG5cdFx0XHQzMTIsXG5cdFx0XHQzMTQsXG5cdFx0XHQzMTIsXG5cdFx0XHQzMTUsXG5cdFx0XHQyNjEsXG5cdFx0XHQyNjQsXG5cdFx0XHQyNjEsXG5cdFx0XHQzMTUsXG5cdFx0XHQzMTEsXG5cdFx0XHQxNDgsXG5cdFx0XHQzMTQsXG5cdFx0XHQxNTIsXG5cdFx0XHQzMTQsXG5cdFx0XHQxNDgsXG5cdFx0XHQzMTcsXG5cdFx0XHQzMTYsXG5cdFx0XHQzMTUsXG5cdFx0XHQzMTYsXG5cdFx0XHQyNjQsXG5cdFx0XHQzMTUsXG5cdFx0XHQxNTIsXG5cdFx0XHQxNTUsXG5cdFx0XHQzMTQsXG5cdFx0XHQzMTgsXG5cdFx0XHQzMTQsXG5cdFx0XHQxNTUsXG5cdFx0XHQzMDMsXG5cdFx0XHQzMDQsXG5cdFx0XHQzMTksXG5cdFx0XHQzMDksXG5cdFx0XHQzMTksXG5cdFx0XHQzMDQsXG5cdFx0XHQzMTksXG5cdFx0XHQzMjAsXG5cdFx0XHQzMDMsXG5cdFx0XHQzMDIsXG5cdFx0XHQzMDMsXG5cdFx0XHQzMjAsXG5cdFx0XHQzMjAsXG5cdFx0XHQzMjEsXG5cdFx0XHQzMDIsXG5cdFx0XHQzMDEsXG5cdFx0XHQzMDIsXG5cdFx0XHQzMjEsXG5cdFx0XHQzMjEsXG5cdFx0XHQxOTksXG5cdFx0XHQzMDEsXG5cdFx0XHQxOTgsXG5cdFx0XHQzMDEsXG5cdFx0XHQxOTksXG5cdFx0XHQxOTksXG5cdFx0XHQzMjEsXG5cdFx0XHQyMDgsXG5cdFx0XHQzMjIsXG5cdFx0XHQyMDgsXG5cdFx0XHQzMjEsXG5cdFx0XHQyMDQsXG5cdFx0XHQzMjMsXG5cdFx0XHQyMDIsXG5cdFx0XHQzMjQsXG5cdFx0XHQyMDIsXG5cdFx0XHQzMjMsXG5cdFx0XHQyMDgsXG5cdFx0XHQzMjIsXG5cdFx0XHQyMDQsXG5cdFx0XHQzMjMsXG5cdFx0XHQyMDQsXG5cdFx0XHQzMjIsXG5cdFx0XHQyMDIsXG5cdFx0XHQzMjQsXG5cdFx0XHQyMTAsXG5cdFx0XHQzMjUsXG5cdFx0XHQyMTAsXG5cdFx0XHQzMjQsXG5cdFx0XHQyMTMsXG5cdFx0XHQyMTAsXG5cdFx0XHQyNDYsXG5cdFx0XHQzMjUsXG5cdFx0XHQyNDYsXG5cdFx0XHQyMTAsXG5cdFx0XHQzMjEsXG5cdFx0XHQzMjAsXG5cdFx0XHQzMjIsXG5cdFx0XHQzMjYsXG5cdFx0XHQzMjIsXG5cdFx0XHQzMjAsXG5cdFx0XHQzMjMsXG5cdFx0XHQzMjcsXG5cdFx0XHQzMjQsXG5cdFx0XHQzMjgsXG5cdFx0XHQzMjQsXG5cdFx0XHQzMjcsXG5cdFx0XHQzMjIsXG5cdFx0XHQzMjYsXG5cdFx0XHQzMjMsXG5cdFx0XHQzMjcsXG5cdFx0XHQzMjMsXG5cdFx0XHQzMjYsXG5cdFx0XHQzMjQsXG5cdFx0XHQzMjgsXG5cdFx0XHQzMjUsXG5cdFx0XHQzMjksXG5cdFx0XHQzMjUsXG5cdFx0XHQzMjgsXG5cdFx0XHQyNDYsXG5cdFx0XHQzMjUsXG5cdFx0XHQyNDksXG5cdFx0XHQzMjksXG5cdFx0XHQyNDksXG5cdFx0XHQzMjUsXG5cdFx0XHQzMjAsXG5cdFx0XHQzMTksXG5cdFx0XHQzMjYsXG5cdFx0XHQyNTMsXG5cdFx0XHQzMjYsXG5cdFx0XHQzMTksXG5cdFx0XHQzMjcsXG5cdFx0XHQyNTUsXG5cdFx0XHQzMjgsXG5cdFx0XHQyNTYsXG5cdFx0XHQzMjgsXG5cdFx0XHQyNTUsXG5cdFx0XHQzMjYsXG5cdFx0XHQyNTMsXG5cdFx0XHQzMjcsXG5cdFx0XHQyNTUsXG5cdFx0XHQzMjcsXG5cdFx0XHQyNTMsXG5cdFx0XHQzMjgsXG5cdFx0XHQyNTYsXG5cdFx0XHQzMjksXG5cdFx0XHQyNTgsXG5cdFx0XHQzMjksXG5cdFx0XHQyNTYsXG5cdFx0XHQyNDksXG5cdFx0XHQzMjksXG5cdFx0XHQyNjAsXG5cdFx0XHQyNTgsXG5cdFx0XHQyNjAsXG5cdFx0XHQzMjksXG5cdFx0XHQzMTksXG5cdFx0XHQzMDksXG5cdFx0XHQyNTMsXG5cdFx0XHQyNTEsXG5cdFx0XHQyNTMsXG5cdFx0XHQzMDksXG5cdFx0XHQzMzAsXG5cdFx0XHQyODEsXG5cdFx0XHQyODgsXG5cdFx0XHQyNzksXG5cdFx0XHQyODgsXG5cdFx0XHQyODEsXG5cdFx0XHQxODksXG5cdFx0XHQzMzEsXG5cdFx0XHQzMzIsXG5cdFx0XHQyNTYsXG5cdFx0XHQyNTUsXG5cdFx0XHQyNTksXG5cdFx0XHQyNTQsXG5cdFx0XHQyNTksXG5cdFx0XHQyNTUsXG5cdFx0XHQzMTUsXG5cdFx0XHQzMTQsXG5cdFx0XHQzMTcsXG5cdFx0XHQzMTgsXG5cdFx0XHQzMTcsXG5cdFx0XHQzMTQsXG5cdFx0XHQyNjMsXG5cdFx0XHQyNjQsXG5cdFx0XHQzMTYsXG5cdFx0XHQyMjMsXG5cdFx0XHQyMjUsXG5cdFx0XHQzMzMsXG5cdFx0XHQyMTUsXG5cdFx0XHQyMTQsXG5cdFx0XHQyMjEsXG5cdFx0XHQyNDMsXG5cdFx0XHQyMjEsXG5cdFx0XHQyMTQsXG5cdFx0XHQyMzksXG5cdFx0XHQyMzgsXG5cdFx0XHQyMjcsXG5cdFx0XHQyMzgsXG5cdFx0XHQyMzksXG5cdFx0XHQ3Mixcblx0XHRcdDI4NCxcblx0XHRcdDI5MCxcblx0XHRcdDI4NSxcblx0XHRcdDE0OSxcblx0XHRcdDMxMyxcblx0XHRcdDE0Myxcblx0XHRcdDMwOCxcblx0XHRcdDE0Myxcblx0XHRcdDMxMyxcblx0XHRcdDMwOCxcblx0XHRcdDMxMyxcblx0XHRcdDMzNCxcblx0XHRcdDI5OCxcblx0XHRcdDI5OSxcblx0XHRcdDMwOCxcblx0XHRcdDI5OCxcblx0XHRcdDMwOCxcblx0XHRcdDMzNCxcblx0XHRcdDI5OSxcblx0XHRcdDI5OCxcblx0XHRcdDI5Nyxcblx0XHRcdDI5OSxcblx0XHRcdDI5Nyxcblx0XHRcdDI2OCxcblx0XHRcdDMwNixcblx0XHRcdDMwNCxcblx0XHRcdDI4MCxcblx0XHRcdDMwNixcblx0XHRcdDI4MCxcblx0XHRcdDMzNSxcblx0XHRcdDMzNixcblx0XHRcdDMzNSxcblx0XHRcdDI4MCxcblx0XHRcdDMzNixcblx0XHRcdDI4MCxcblx0XHRcdDI4MSxcblx0XHRcdDMzMCxcblx0XHRcdDMzNyxcblx0XHRcdDMzNixcblx0XHRcdDMzMCxcblx0XHRcdDMzNixcblx0XHRcdDI4MSxcblx0XHRcdDI5NSxcblx0XHRcdDMwNixcblx0XHRcdDMzNSxcblx0XHRcdDI5NSxcblx0XHRcdDMzNSxcblx0XHRcdDI5Nixcblx0XHRcdDI5MSxcblx0XHRcdDI5Nixcblx0XHRcdDMzNSxcblx0XHRcdDI5MSxcblx0XHRcdDMzNSxcblx0XHRcdDMzNixcblx0XHRcdDMzNyxcblx0XHRcdDI5Mixcblx0XHRcdDI5MSxcblx0XHRcdDMzNyxcblx0XHRcdDI5MSxcblx0XHRcdDMzNixcblx0XHRcdDMzNCxcblx0XHRcdDMxMyxcblx0XHRcdDMxMCxcblx0XHRcdDI4Mixcblx0XHRcdDMwNSxcblx0XHRcdDMxMCxcblx0XHRcdDMxMCxcblx0XHRcdDMwNSxcblx0XHRcdDMzNCxcblx0XHRcdDI5NSxcblx0XHRcdDI5OCxcblx0XHRcdDMzNCxcblx0XHRcdDI5NSxcblx0XHRcdDMzNCxcblx0XHRcdDMwNSxcblx0XHRcdDIyNCxcblx0XHRcdDIxNSxcblx0XHRcdDIyMixcblx0XHRcdDI2MCxcblx0XHRcdDI1OCxcblx0XHRcdDI1Nyxcblx0XHRcdDMzOCxcblx0XHRcdDIzMSxcblx0XHRcdDIyMyxcblx0XHRcdDMzOCxcblx0XHRcdDIyMyxcblx0XHRcdDMzMyxcblx0XHRcdDI2NSxcblx0XHRcdDE3Nyxcblx0XHRcdDc0LFxuXHRcdFx0MjY1LFxuXHRcdFx0NzQsXG5cdFx0XHQyNDMsXG5cdFx0XHQxODQsXG5cdFx0XHQzMzIsXG5cdFx0XHQxODUsXG5cdFx0XHQxOTIsXG5cdFx0XHQxODUsXG5cdFx0XHQzMzIsXG5cdFx0XHQxODQsXG5cdFx0XHQxODcsXG5cdFx0XHQzMzIsXG5cdFx0XHQxODksXG5cdFx0XHQzMzIsXG5cdFx0XHQxODcsXG5cdFx0XHQzMzEsXG5cdFx0XHQxODksXG5cdFx0XHQxOTcsXG5cdFx0XHQxOTcsXG5cdFx0XHQyMDAsXG5cdFx0XHQzMzEsXG5cdFx0XHQyNDEsXG5cdFx0XHQzMzEsXG5cdFx0XHQyMDAsXG5cdFx0XHQyMjAsXG5cdFx0XHQzMzksXG5cdFx0XHQyMjUsXG5cdFx0XHQyMjAsXG5cdFx0XHQyMjUsXG5cdFx0XHQyMjIsXG5cdFx0XHQzMzksXG5cdFx0XHQzNDAsXG5cdFx0XHQzMzMsXG5cdFx0XHQzMzksXG5cdFx0XHQzMzMsXG5cdFx0XHQyMjUsXG5cdFx0XHQxODAsXG5cdFx0XHQzMzksXG5cdFx0XHQyMjAsXG5cdFx0XHQxODAsXG5cdFx0XHQyMjAsXG5cdFx0XHQ0NSxcblx0XHRcdDMzOSxcblx0XHRcdDE4MCxcblx0XHRcdDE4MSxcblx0XHRcdDMzOSxcblx0XHRcdDE4MSxcblx0XHRcdDM0MCxcblx0XHRcdDM0MCxcblx0XHRcdDE4MSxcblx0XHRcdDE4Myxcblx0XHRcdDM0MCxcblx0XHRcdDE4Myxcblx0XHRcdDM0MSxcblx0XHRcdDMzMSxcblx0XHRcdDI0MSxcblx0XHRcdDI0Mixcblx0XHRcdDI0Mixcblx0XHRcdDE5Mixcblx0XHRcdDMzMSxcblx0XHRcdDMzMixcblx0XHRcdDMzMSxcblx0XHRcdDE5Mixcblx0XHRcdDMzMyxcblx0XHRcdDM0MCxcblx0XHRcdDM0MSxcblx0XHRcdDMzMyxcblx0XHRcdDM0MSxcblx0XHRcdDMzOFxuXHRcdF0sXG5cdFx0XCJmZWF0dXJlUG9pbnRcIjogW1xuXHRcdFx0MjUwLFxuXHRcdFx0MjU5LFxuXHRcdFx0MjYwLFxuXHRcdFx0MjQ4LFxuXHRcdFx0MjQ1LFxuXHRcdFx0MjQ0LFxuXHRcdFx0MjY1LFxuXHRcdFx0MTc3LFxuXHRcdFx0OTcsXG5cdFx0XHQ3Nixcblx0XHRcdDc3LFxuXHRcdFx0ODAsXG5cdFx0XHQ5Mixcblx0XHRcdDkxLFxuXHRcdFx0ODIsXG5cdFx0XHQxNDEsXG5cdFx0XHQxMTQsXG5cdFx0XHQxNzIsXG5cdFx0XHQxNDAsXG5cdFx0XHQzMDksXG5cdFx0XHQyODIsXG5cdFx0XHQzMzQsXG5cdFx0XHQzMDgsXG5cdFx0XHQyODgsXG5cdFx0XHQyOTIsXG5cdFx0XHQyOTAsXG5cdFx0XHQyODcsXG5cdFx0XHQtMSxcblx0XHRcdDEyMCxcblx0XHRcdDEyNixcblx0XHRcdDEyMixcblx0XHRcdDExOSxcblx0XHRcdC0xLFxuXHRcdFx0NSxcblx0XHRcdDE4OSxcblx0XHRcdDMzMSxcblx0XHRcdDI0MCxcblx0XHRcdDIwLFxuXHRcdFx0NzAsXG5cdFx0XHQxNjksXG5cdFx0XHQ5LFxuXHRcdFx0Nixcblx0XHRcdDE5Myxcblx0XHRcdDE1LFxuXHRcdFx0MjMwLFxuXHRcdFx0MjI3LFxuXHRcdFx0MjM5LFxuXHRcdFx0NjksXG5cdFx0XHQ2OCxcblx0XHRcdDUyLFxuXHRcdFx0NTYsXG5cdFx0XHQ0OCxcblx0XHRcdDQ0LFxuXHRcdFx0NDUsXG5cdFx0XHQyMjAsXG5cdFx0XHQyMjIsXG5cdFx0XHQzNDEsXG5cdFx0XHQxODMsXG5cdFx0XHQxODIsXG5cdFx0XHQ2Mixcblx0XHRcdDY1LFxuXHRcdFx0MjM2LFxuXHRcdFx0Mixcblx0XHRcdDMzNyxcblx0XHRcdDI5Myxcblx0XHRcdDI4Nixcblx0XHRcdDI4OSxcblx0XHRcdDE3NSxcblx0XHRcdDEyNSxcblx0XHRcdDExNyxcblx0XHRcdDEyMSxcblx0XHRcdDgzLFxuXHRcdFx0OTUsXG5cdFx0XHQxNTMsXG5cdFx0XHQxNTYsXG5cdFx0XHQxNTUsXG5cdFx0XHQzMTgsXG5cdFx0XHQzMTYsXG5cdFx0XHQyNjMsXG5cdFx0XHQyNTJcblx0XHRdLFxuXHRcdFwid2VpZ2h0XCI6IFtcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDE4My45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQxNTguNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDMsXG5cdFx0XHRcdFx0NTEuNThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQwLFxuXHRcdFx0XHRcdDQzLjMxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Mixcblx0XHRcdFx0XHQzMDYuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0MTU3LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQyLFxuXHRcdFx0XHRcdDUuMDY0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQ1LjA2NFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjIsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjIsXG5cdFx0XHRcdFx0NTU3LjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDE1MC4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQ2NC40NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0NTYuMzNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMzLFxuXHRcdFx0XHRcdDY1MFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0ODIuMjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQwLFxuXHRcdFx0XHRcdDI4Ljg2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQyNS43N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzMsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0NDY0Ljhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQwLFxuXHRcdFx0XHRcdDE2MC45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMyxcblx0XHRcdFx0XHQzNS43OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjIsXG5cdFx0XHRcdFx0MzQuNDdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQwLFxuXHRcdFx0XHRcdDExOS41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMyxcblx0XHRcdFx0XHQ4NC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQ1MS4xN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0NDIuNjhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQwLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDM5Ny4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQzMjIuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0MzIyLjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDgyLjgyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQ3NTkuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjIsXG5cdFx0XHRcdFx0MTE1LjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQyLFxuXHRcdFx0XHRcdDg4LjQ0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQ1Ni4yNVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0MTE4Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDk4Ljk1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQ1My4wOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0NDEuMzZcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDExOS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQ4Mi42NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0NjQuNDFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDQyLjk3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQ2NjIuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDMsXG5cdFx0XHRcdFx0NjYyLjdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDE0MC4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Mixcblx0XHRcdFx0XHQ1NC40N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDMsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDMsXG5cdFx0XHRcdFx0MjQ2LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDE0My45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQxMTUuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0NTcuNDRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDgzOS40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQ0NTEuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0MjIzLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ3LFxuXHRcdFx0XHRcdDQ5LjE0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQ5NTkuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0MzE5LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDMxOS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nyxcblx0XHRcdFx0XHQ1LjQwNVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0OTA1LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDE0My44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OCxcblx0XHRcdFx0XHQ2My4yMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0NjIuNzVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQwLFxuXHRcdFx0XHRcdDMzMi42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQxODYuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0NTkuODVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDMwLjEyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQ4Mi44NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0NTUuNTNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQwLFxuXHRcdFx0XHRcdDUwLjA3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQzOS45MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0NTAuNDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDMwLjU0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQyNS44MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0MjQuNzZcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDMzOS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQxMzAuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDAsXG5cdFx0XHRcdFx0NDAuNDdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDE3LjE0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQ0NS4zMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0MzEuMDJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDIzLjAxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQyMi4yNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0NDYuNTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDI0LjAzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQyMi42OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MTguNTVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDIwLjc3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQxNC40NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0MTIuNjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDExLFxuXHRcdFx0XHRcdDExLjY1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQxNy4wMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0MTYuNTJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDEwLjQzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQ4Ljg5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQ3MC4xNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0NTcuMThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ5LFxuXHRcdFx0XHRcdDU0LjU2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQ0NC4wM1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MTY3LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ5LFxuXHRcdFx0XHRcdDUyLjk4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQzOS45NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0MzQuMzRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDM2LjA2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQyMy44M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0MTMuOTJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQwLFxuXHRcdFx0XHRcdDEzLjE3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQ4NC4wNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0NzkuODRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ5LFxuXHRcdFx0XHRcdDI0LjYxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQxOS44N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0MjgwLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDEzMS41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQ1NC4yMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDgsXG5cdFx0XHRcdFx0MjcuMzFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDM5LjQ0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQxOS43NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MTcuNDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDksXG5cdFx0XHRcdFx0MTIuMDhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDYxLjA5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQyNS4zOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0OSxcblx0XHRcdFx0XHQyMS4xN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTAsXG5cdFx0XHRcdFx0MTguMThcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDMyNC45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQ2OS40NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0MzEuMTVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ5LFxuXHRcdFx0XHRcdDMwLjAxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMCxcblx0XHRcdFx0XHQxNjIuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTEsXG5cdFx0XHRcdFx0MjUuMDJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDksXG5cdFx0XHRcdFx0MjQuODlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDEyLjk3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ5LFxuXHRcdFx0XHRcdDg2LjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQ0Ny45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQ0Ny40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTIsXG5cdFx0XHRcdFx0MjMuMzRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDE0OS41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQxNDYuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTIsXG5cdFx0XHRcdFx0MzcuNzJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDIzLjAzXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQzMDkuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTksXG5cdFx0XHRcdFx0MTE0Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ5LFxuXHRcdFx0XHRcdDg0Ljc2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OCxcblx0XHRcdFx0XHQ0MS44XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQzODY2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OSxcblx0XHRcdFx0XHQ2Ny44M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0NjIuNTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ5LFxuXHRcdFx0XHRcdDQ1LjAxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQ2MzQuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDksXG5cdFx0XHRcdFx0NzQuMDJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDY1LjY0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OSxcblx0XHRcdFx0XHQ1OC40NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MjEwLjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ5LFxuXHRcdFx0XHRcdDE5NC4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OSxcblx0XHRcdFx0XHQ3MS41NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDgsXG5cdFx0XHRcdFx0NTguMDRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUzLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUzLFxuXHRcdFx0XHRcdDY3OS40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nyxcblx0XHRcdFx0XHQ2My42NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTIsXG5cdFx0XHRcdFx0NDAuOTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU0LFxuXHRcdFx0XHRcdDQwLjk5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Mixcblx0XHRcdFx0XHQ0MzguMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MTgxLjdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDY2LjE3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Myxcblx0XHRcdFx0XHQ2My44N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0NzkxN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0NjEuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0MTguNzNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDE0OThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDI2Mi4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OCxcblx0XHRcdFx0XHQyNTEuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MjI1LjJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDU3MS45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQyNjkuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTIsXG5cdFx0XHRcdFx0NTcuMDFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDQ5LjI3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQxNTY0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OSxcblx0XHRcdFx0XHQ1NjMuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDgsXG5cdFx0XHRcdFx0NTYyLjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ3LFxuXHRcdFx0XHRcdDEzMy40XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQ2ODM3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQ5MC4zMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0NjQuMjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU5LFxuXHRcdFx0XHRcdDU0LjUxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQxMjkwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQxMDYuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0NDguNDhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU5LFxuXHRcdFx0XHRcdDQzLjI5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQ1MDgwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQxMjAuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0MTAyLjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDU5LjI5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQ0ODguOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTksXG5cdFx0XHRcdFx0MTU3LjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ5LFxuXHRcdFx0XHRcdDIyLjA3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQxNi4xMlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0NDY4OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTksXG5cdFx0XHRcdFx0ODUuODRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDcyLjY1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OCxcblx0XHRcdFx0XHQ1MC42MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0Mzc2LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU5LFxuXHRcdFx0XHRcdDE0My40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQzOS40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDgsXG5cdFx0XHRcdFx0MTAuODFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU5LFxuXHRcdFx0XHRcdDE3OTZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ5LFxuXHRcdFx0XHRcdDQ3Ny4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OCxcblx0XHRcdFx0XHQyMjguNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjAsXG5cdFx0XHRcdFx0MTQwLjNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU5LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ3LFxuXHRcdFx0XHRcdDI1ODhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYwLFxuXHRcdFx0XHRcdDY5NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDgsXG5cdFx0XHRcdFx0NDAxLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ2LFxuXHRcdFx0XHRcdDQwMS4xXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MCxcblx0XHRcdFx0XHQxODUxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nyxcblx0XHRcdFx0XHQ4MDUuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDYsXG5cdFx0XHRcdFx0MjAzLjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDIwMy44XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQ0MjcuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDksXG5cdFx0XHRcdFx0OTUuMjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDc2Ljk2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OCxcblx0XHRcdFx0XHQzMS42N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDgsXG5cdFx0XHRcdFx0MzU4LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ5LFxuXHRcdFx0XHRcdDIzNy45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQyMzQuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0MTEyLjhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ3LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDg1MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0Njk5Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQwLFxuXHRcdFx0XHRcdDQ5LjE3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQzMi43N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0Nzg1Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ3LFxuXHRcdFx0XHRcdDQyMi43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQzMDUuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDgsXG5cdFx0XHRcdFx0MzA1LjNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDEzODhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDEzMjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQwLFxuXHRcdFx0XHRcdDM4LjU1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQxNi43N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Nyxcblx0XHRcdFx0XHQxMzkuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTMsXG5cdFx0XHRcdFx0MTE5LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDgsXG5cdFx0XHRcdFx0NDIuODVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYsXG5cdFx0XHRcdFx0NDIuODVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDgsXG5cdFx0XHRcdFx0MTY5LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDk3Ljk5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQ2Mi40OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0MzUuMjFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDksXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTAsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTAsXG5cdFx0XHRcdFx0MTQ3Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDExLFxuXHRcdFx0XHRcdDYyLjY4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ5LFxuXHRcdFx0XHRcdDIuOTcyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHQwLjA2MzNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDc2LjQ1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQ2Ny4xOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTIsXG5cdFx0XHRcdFx0MTQuNjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDksXG5cdFx0XHRcdFx0MTMuMTdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDExLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDExLFxuXHRcdFx0XHRcdDIyNi42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHQzOC40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTAsXG5cdFx0XHRcdFx0MTguNzJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEzLFxuXHRcdFx0XHRcdDUuMDM3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNSxcblx0XHRcdFx0XHQ1Ny41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MSxcblx0XHRcdFx0XHQxMy4wNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTYsXG5cdFx0XHRcdFx0OS4xODdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE0LFxuXHRcdFx0XHRcdDcuOTQ1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNCxcblx0XHRcdFx0XHQyMi4yNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTMsXG5cdFx0XHRcdFx0MTcuNTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE1LFxuXHRcdFx0XHRcdDE2Ljg2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQxNi4xM1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTMsXG5cdFx0XHRcdFx0MTgzLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE0LFxuXHRcdFx0XHRcdDExNi4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MSxcblx0XHRcdFx0XHQ1LjE2NlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTMsXG5cdFx0XHRcdFx0NDIuODNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEyLFxuXHRcdFx0XHRcdDI0LjIzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNCxcblx0XHRcdFx0XHQxMS43OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTUsXG5cdFx0XHRcdFx0Ny4yMzlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEyLFxuXHRcdFx0XHRcdDU2LjIxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMyxcblx0XHRcdFx0XHQ0OS4wMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTEsXG5cdFx0XHRcdFx0OC44NjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE0LFxuXHRcdFx0XHRcdDguMzFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEyLFxuXHRcdFx0XHRcdDE1NC4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMyxcblx0XHRcdFx0XHQzMi4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQxNC43NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTQsXG5cdFx0XHRcdFx0Ni4yNDJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEzLFxuXHRcdFx0XHRcdDE1MS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHQ3Ni4wM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTQsXG5cdFx0XHRcdFx0My4yNTlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEzLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEyLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcyLFxuXHRcdFx0XHRcdDI2Ljk0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Myxcblx0XHRcdFx0XHQxNy4yNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTYsXG5cdFx0XHRcdFx0MTIuODZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE1LFxuXHRcdFx0XHRcdDExLjYyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Mixcblx0XHRcdFx0XHQ2Ny40NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzEsXG5cdFx0XHRcdFx0NTYuNDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE0LFxuXHRcdFx0XHRcdDcuNjcyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Myxcblx0XHRcdFx0XHQxLjg5MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzIsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzMsXG5cdFx0XHRcdFx0MTE4Ljhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcyLFxuXHRcdFx0XHRcdDQzLjc2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NCxcblx0XHRcdFx0XHQ1LjI5NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTYsXG5cdFx0XHRcdFx0NC42ODVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDgsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0NjY3Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY4LFxuXHRcdFx0XHRcdDQ0Mi42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQ5NS4xMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0ODMuNjFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDE3Ni45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQxMzkuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0NDguMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0NDMuNTdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDIzMy4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQ4Mi4wM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0NzQuMzNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDMyLjI0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQ3MzguOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0MTQwLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY4LFxuXHRcdFx0XHRcdDEzMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0NTEuOTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDM0M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0MTY5LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDEwMS41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQ1My42OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0MTQ3N1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0NDEzLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDIwMi4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQ4NC4yM1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0NjMxLjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDI0Mi4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQxMDkuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0ODIuNDRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDIwNi4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQxMDkuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0NjAuMDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDQ3LjcxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQxNTY2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQyMDIuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0MTUwLjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDcwLjY0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQzNjUuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0MTAzLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDgyLjkxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQ0NS4xMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0Mjc1NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0MzE0LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDI1NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0ODQuMzFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDUyNS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQxNTBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDEyOC43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQ1My44NFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0NzMzLjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDEyOS40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQ5NC4xMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0NDUuMjVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDQwNTVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDIzMC45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQxNTQuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0NjEuMjZcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDUwMi43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQxNTcuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0NzguMjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE1LFxuXHRcdFx0XHRcdDQ1LjE1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQxMzU3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQyOTAuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0MTQ4LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDYyLjExXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQyMjA4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQ2MzcuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0MTI2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOSxcblx0XHRcdFx0XHQ3Ni4wOFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0Mzc0MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0MjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQyMDQuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0NzguNTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDQxNjBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDQ2OFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0NTUzMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0MzEzLjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY4LFxuXHRcdFx0XHRcdDI0MS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQ2Mi45OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0NjM2NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0MzkxLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDE4Ny44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQ4OC4yOVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0ODkuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0NjguMDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY3LFxuXHRcdFx0XHRcdDM1LjU0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNixcblx0XHRcdFx0XHQzMC44OFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0MTY1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQxMDkuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0NzYuNjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE4LFxuXHRcdFx0XHRcdDYxLjg0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQ2NjEuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0MTQyLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDc4LjM2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQzMC41NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0NzEzLjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY4LFxuXHRcdFx0XHRcdDE0MC4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQxMjYuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0MjMuNDJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE4LFxuXHRcdFx0XHRcdDE0NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0NjAuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0NTkuMjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE3LFxuXHRcdFx0XHRcdDM3LjUyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQ2NS4xN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzMsXG5cdFx0XHRcdFx0NDQuNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE4LFxuXHRcdFx0XHRcdDQ0LjQyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQyOS42NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0MTA4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQ1Ny44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQ0OC4yMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0MzMuNTFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDE0Mi42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQ2NS44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQ1OS4wN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0MzAuMzlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDE5My44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQ2My45MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0NTAuMTNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDI3LjU0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNSxcblx0XHRcdFx0XHQyMTAuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0MTM5Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDg4LjEzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQ3Ny4wN1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTYsXG5cdFx0XHRcdFx0MjY5LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY3LFxuXHRcdFx0XHRcdDE1Mi44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOSxcblx0XHRcdFx0XHQ2NC40OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0NTUuNzJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDEzNi4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNyxcblx0XHRcdFx0XHQxMzFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDE0LjQ2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQ1LjYxN1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzMsXG5cdFx0XHRcdFx0MTUxLjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE4LFxuXHRcdFx0XHRcdDY4LjMyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQzOS42OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0MzMuOTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE4LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE1LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMzLFxuXHRcdFx0XHRcdDUwMy42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQ0Ny4xM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjIsXG5cdFx0XHRcdFx0MzkuNjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE4LFxuXHRcdFx0XHRcdDM5LjYxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQxNTguNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjIsXG5cdFx0XHRcdFx0MTU4LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMzLFxuXHRcdFx0XHRcdDE0LjI5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNyxcblx0XHRcdFx0XHQzLjA2MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTYsXG5cdFx0XHRcdFx0MTAwLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE3LFxuXHRcdFx0XHRcdDkyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOSxcblx0XHRcdFx0XHQxOC43OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTgsXG5cdFx0XHRcdFx0MTcuNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTYsXG5cdFx0XHRcdFx0NDEuNzdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE3LFxuXHRcdFx0XHRcdDI2Ljg0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNSxcblx0XHRcdFx0XHQ5LjA1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOSxcblx0XHRcdFx0XHQ3LjY1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNyxcblx0XHRcdFx0XHQyOS4xNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTgsXG5cdFx0XHRcdFx0MjEuNDZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDExLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc0LFxuXHRcdFx0XHRcdDcuMDA1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNyxcblx0XHRcdFx0XHQxMzcuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTgsXG5cdFx0XHRcdFx0ODAuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjIsXG5cdFx0XHRcdFx0MTUuNzJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDEzLjQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNyxcblx0XHRcdFx0XHQxNi4wNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjEsXG5cdFx0XHRcdFx0MTYuMDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDEyLjY4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQxMi42OFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjIsXG5cdFx0XHRcdFx0MzQuNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE4LFxuXHRcdFx0XHRcdDM0Ljc5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMSxcblx0XHRcdFx0XHQyMS43MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0MjEuNzFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc0LFxuXHRcdFx0XHRcdDMyLjA3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NSxcblx0XHRcdFx0XHQyMC45OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0NS40OTNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc2LFxuXHRcdFx0XHRcdDUuMTczXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Myxcblx0XHRcdFx0XHQxOS4yMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzQsXG5cdFx0XHRcdFx0OS4yMzVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDguNDhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcyLFxuXHRcdFx0XHRcdDcuMDQ5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NSxcblx0XHRcdFx0XHQzNS43N1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzYsXG5cdFx0XHRcdFx0OC42ODdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc0LFxuXHRcdFx0XHRcdDguNjg3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNyxcblx0XHRcdFx0XHQzLjIzOFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzMsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzMsXG5cdFx0XHRcdFx0NTAuMTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc0LFxuXHRcdFx0XHRcdDQ2LjI0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NSxcblx0XHRcdFx0XHQ0Ljk0M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzIsXG5cdFx0XHRcdFx0My4xNThcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc1LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc0LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDY1LjQ0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNSxcblx0XHRcdFx0XHQzMy42NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0MzAuMTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY3LFxuXHRcdFx0XHRcdDI0Ljg3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQ0NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0MjYuOTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDI0Ljg4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQxNC44NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0MzQuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0MjQuNTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDIzLjYzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQxOS44OFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0MTkuMTdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDE2LjUxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQxMy43OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0MTMuMzlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDEwLjU0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQxMC4yOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTAsXG5cdFx0XHRcdFx0OS43MTNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDExLFxuXHRcdFx0XHRcdDkuMTUzXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQxNS40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTAsXG5cdFx0XHRcdFx0MTUuMThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDcuODNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEyLFxuXHRcdFx0XHRcdDYuOTVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDExLFxuXHRcdFx0XHRcdDI4LjM1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMCxcblx0XHRcdFx0XHQyNS43M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTIsXG5cdFx0XHRcdFx0MTEuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0OS4xOTFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDIwLjkxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQxMy44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQxMi45MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0OC4xNzJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDExLFxuXHRcdFx0XHRcdDEyLjkxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQxMC4yOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTIsXG5cdFx0XHRcdFx0OC45NzRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDcuMTI0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQyNC45NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTIsXG5cdFx0XHRcdFx0MTYuNDZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDguMTYxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMyxcblx0XHRcdFx0XHQ4LjAzM1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTEsXG5cdFx0XHRcdFx0NTAuMzhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEyLFxuXHRcdFx0XHRcdDMwLjExXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMCxcblx0XHRcdFx0XHQ5LjE1M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTMsXG5cdFx0XHRcdFx0Ny43Njhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDE4MDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY3LFxuXHRcdFx0XHRcdDU3NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0MTQ3Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDc2LjY3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQyNDUuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0MTM4LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDM3Ljk2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQzMS45M1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0NjM3LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDQxMi45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQyNjYuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTIsXG5cdFx0XHRcdFx0MTc0LjVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE3LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY3LFxuXHRcdFx0XHRcdDExMTBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDE1MC41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQ5MS42OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTYsXG5cdFx0XHRcdFx0NDAuNDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY3LFxuXHRcdFx0XHRcdDYxMzRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDIyOS40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQxOTRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY4LFxuXHRcdFx0XHRcdDY2Ljg5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OCxcblx0XHRcdFx0XHQzNzcuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MzcwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQyODMuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTIsXG5cdFx0XHRcdFx0MTIwLjlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTIsXG5cdFx0XHRcdFx0MTU4N1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0ODE3LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDE0MC45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nyxcblx0XHRcdFx0XHQxMTcuNVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0NDU3OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTIsXG5cdFx0XHRcdFx0MzYxLjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU3LFxuXHRcdFx0XHRcdDg2Ljc5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQzLjk3NlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTMsXG5cdFx0XHRcdFx0MTI1NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTcsXG5cdFx0XHRcdFx0NjczLjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDEyNC4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NCxcblx0XHRcdFx0XHQxMjQuMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTcsXG5cdFx0XHRcdFx0NDQ5MFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTMsXG5cdFx0XHRcdFx0MzEzLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU2LFxuXHRcdFx0XHRcdDc1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OCxcblx0XHRcdFx0XHQ3NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTcsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjIsXG5cdFx0XHRcdFx0MTgzLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDE1OC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQ1MS41OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0NDMuMzFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDU1Ny42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQxNTAuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDMsXG5cdFx0XHRcdFx0NjQuNDZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDU2LjMzXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMyxcblx0XHRcdFx0XHQ2NTBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDgyLjIxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNCxcblx0XHRcdFx0XHQyOC44NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjIsXG5cdFx0XHRcdFx0MjUuNzdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDQ2NC44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNCxcblx0XHRcdFx0XHQxNjAuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzMsXG5cdFx0XHRcdFx0MzUuNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDM0LjQ3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNCxcblx0XHRcdFx0XHQxMTkuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzMsXG5cdFx0XHRcdFx0ODQuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0NTEuMTdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDQyLjY4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQ3NTkuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjIsXG5cdFx0XHRcdFx0MTE1LjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDg4LjQ0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQ1Ni4yNVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0MTE4Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQyLFxuXHRcdFx0XHRcdDk4Ljk1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQ1My4wOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0NDEuMzZcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDExOS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNCxcblx0XHRcdFx0XHQ4Mi42NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0NjQuNDFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQyLFxuXHRcdFx0XHRcdDQyLjk3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQyNDYuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0MTQzLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDExNS40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQ1Ny40NFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0ODM5LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDQ1MS40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQyMjMuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDcsXG5cdFx0XHRcdFx0NDkuMTRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDkwNS4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQxNDMuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDYsXG5cdFx0XHRcdFx0NjMuMjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDYyLjc1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNCxcblx0XHRcdFx0XHQzMzIuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0MTg2LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDU5Ljg1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQzMC4xMlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0ODIuODVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDU1LjUzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNCxcblx0XHRcdFx0XHQ1MC4wN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0MzkuOTFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDUwLjQzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQzMC41NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MjUuODJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDI0Ljc2XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQzMzkuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0MTMwLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM0LFxuXHRcdFx0XHRcdDQwLjQ3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQxNy4xNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0NDUuMzFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDMxLjAyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQyMy4wMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0MjIuMjRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0MjAuNzdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDE0LjQ1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQxMi42NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQxMS42NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0NDYuNTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDI0LjAzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NSxcblx0XHRcdFx0XHQyMi42OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0MTguNTVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDE3LjAxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQxNi41MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NCxcblx0XHRcdFx0XHQxMC40M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0OC44OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0NzAuMTRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDU3LjE4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NSxcblx0XHRcdFx0XHQ1NC41NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0NDQuMDNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDE2Ny40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NSxcblx0XHRcdFx0XHQ1Mi45OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0MzkuOTVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDM0LjM0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQ4NC4wNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0NzkuODRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDI0LjYxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNCxcblx0XHRcdFx0XHQxOS44N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0MzYuMDZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDIzLjgzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQxMy45MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MTMuMTdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDI4MC42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQxMzEuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0NTQuMjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ2LFxuXHRcdFx0XHRcdDI3LjMxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0LFxuXHRcdFx0XHRcdDM5LjQ0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzLFxuXHRcdFx0XHRcdDE5Ljc2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQxNy40M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NSxcblx0XHRcdFx0XHQxMi4wOFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0NjEuMDlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDI1LjM4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1LFxuXHRcdFx0XHRcdDIxLjE3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0LFxuXHRcdFx0XHRcdDE4LjE4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQzMjQuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0NjkuNDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU2LFxuXHRcdFx0XHRcdDMxLjE1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NSxcblx0XHRcdFx0XHQzMC4wMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NCxcblx0XHRcdFx0XHQxNjIuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQyNS4wMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NSxcblx0XHRcdFx0XHQyNC44OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MTIuOTdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUsXG5cdFx0XHRcdFx0ODYuNTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDQ3Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDQ3LjQ0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NCxcblx0XHRcdFx0XHQyMy4zNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MTQ5LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDE0Ni42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NCxcblx0XHRcdFx0XHQzNy43MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTYsXG5cdFx0XHRcdFx0MjMuMDNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDMwOS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MSxcblx0XHRcdFx0XHQxMTQuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0ODQuNzZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ2LFxuXHRcdFx0XHRcdDQxLjhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDIxMC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NSxcblx0XHRcdFx0XHQxOTQuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0NzEuNTRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ2LFxuXHRcdFx0XHRcdDU4LjA0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQ2MzQuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0NzQuMDJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDY1LjY0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MSxcblx0XHRcdFx0XHQ1OC40NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0Mzg2NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0NjcuODNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDYyLjUxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NSxcblx0XHRcdFx0XHQ0NS4wMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTQsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTQsXG5cdFx0XHRcdFx0NDM4LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDE4MS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ2Ni4xN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTMsXG5cdFx0XHRcdFx0NjMuODdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDc5MTdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDYxLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU2LFxuXHRcdFx0XHRcdDE4LjczXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQ1NzEuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0MjY5LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU0LFxuXHRcdFx0XHRcdDU3LjAxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ0OS4yN1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0MTQ5OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTQsXG5cdFx0XHRcdFx0MjYyLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU2LFxuXHRcdFx0XHRcdDI1MS40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQyMjUuMlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0MTU2NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0NTYzLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ2LFxuXHRcdFx0XHRcdDU2Mi4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nyxcblx0XHRcdFx0XHQxMzMuNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0NjgzN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0OTAuMzFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU2LFxuXHRcdFx0XHRcdDY0LjIyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MSxcblx0XHRcdFx0XHQ1NC41MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MTI5MFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0MTA2LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU2LFxuXHRcdFx0XHRcdDQ4LjQ4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MSxcblx0XHRcdFx0XHQ0My4yOVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0NTA4MFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0MTIwLjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU2LFxuXHRcdFx0XHRcdDEwMi4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NCxcblx0XHRcdFx0XHQ1OS4yOVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0NDg4Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYxLFxuXHRcdFx0XHRcdDE1Ny42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NSxcblx0XHRcdFx0XHQyMi4wN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0MTYuMTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDM3Ni40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MSxcblx0XHRcdFx0XHQxNDMuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0MzkuNDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ2LFxuXHRcdFx0XHRcdDEwLjgxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQ0Njg4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MSxcblx0XHRcdFx0XHQ4NS44NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0NzIuNjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU2LFxuXHRcdFx0XHRcdDUwLjYyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MSxcblx0XHRcdFx0XHQxNzk2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NSxcblx0XHRcdFx0XHQ0NzcuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDYsXG5cdFx0XHRcdFx0MjI4LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYwLFxuXHRcdFx0XHRcdDE0MC4zXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQ0MjcuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0OTUuMjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDc2Ljk2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQzMS42N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDYsXG5cdFx0XHRcdFx0MzU4LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDIzNy45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQyMzQuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0MTEyLjhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ2LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDg1MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0Njk5Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM0LFxuXHRcdFx0XHRcdDQ5LjE3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQzMi43N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0MTM4OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0MTMyNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MzguNTVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDE2Ljc3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2LFxuXHRcdFx0XHRcdDE2OS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NCxcblx0XHRcdFx0XHQ5Ny45OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0NjIuNDhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU2LFxuXHRcdFx0XHRcdDM1LjIxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NCxcblx0XHRcdFx0XHQ3Ni40NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQ2Ny4xOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Mixcblx0XHRcdFx0XHQxNC42MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NSxcblx0XHRcdFx0XHQxMy4xN1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NCxcblx0XHRcdFx0XHQxNDcuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQ2Mi42OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NSxcblx0XHRcdFx0XHQyLjk3MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Mixcblx0XHRcdFx0XHQwLjA2MzNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQyMjYuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Mixcblx0XHRcdFx0XHQzOC40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NCxcblx0XHRcdFx0XHQxOC43MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MSxcblx0XHRcdFx0XHQ1LjAzN1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOSxcblx0XHRcdFx0XHQ1Ny41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3OSxcblx0XHRcdFx0XHQxMy4wNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjAsXG5cdFx0XHRcdFx0OS4xODdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDAsXG5cdFx0XHRcdFx0Ny45NDVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc5LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDAsXG5cdFx0XHRcdFx0MjIuMjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEsXG5cdFx0XHRcdFx0MTcuNTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE5LFxuXHRcdFx0XHRcdDE2Ljg2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQxNi4xM1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MSxcblx0XHRcdFx0XHQxODMuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MCxcblx0XHRcdFx0XHQxMTYuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzksXG5cdFx0XHRcdFx0NS4xNjZcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEsXG5cdFx0XHRcdFx0NDIuODNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIsXG5cdFx0XHRcdFx0MjQuMjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDAsXG5cdFx0XHRcdFx0MTEuNzhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE5LFxuXHRcdFx0XHRcdDcuMjM5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyLFxuXHRcdFx0XHRcdDU2LjIxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxLFxuXHRcdFx0XHRcdDQ5LjAyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzLFxuXHRcdFx0XHRcdDguODY2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdDguMzFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEsXG5cdFx0XHRcdFx0MTUxLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIsXG5cdFx0XHRcdFx0NzYuMDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDAsXG5cdFx0XHRcdFx0My4yNTlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIsXG5cdFx0XHRcdFx0MTU0LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEsXG5cdFx0XHRcdFx0MzIuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQxNC43NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MCxcblx0XHRcdFx0XHQ2LjI0MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc4LFxuXHRcdFx0XHRcdDI2Ljk0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nyxcblx0XHRcdFx0XHQxNy4yNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjAsXG5cdFx0XHRcdFx0MTIuODZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE5LFxuXHRcdFx0XHRcdDExLjYyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3OCxcblx0XHRcdFx0XHQ2Ny40NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzksXG5cdFx0XHRcdFx0NTYuNDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDAsXG5cdFx0XHRcdFx0Ny42NzJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc3LFxuXHRcdFx0XHRcdDEuODkyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3OCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nyxcblx0XHRcdFx0XHQxMTguOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzgsXG5cdFx0XHRcdFx0NDMuNzZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc2LFxuXHRcdFx0XHRcdDUuMjk2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMCxcblx0XHRcdFx0XHQ0LjY4NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Nixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQ2NjcuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0NDQyLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDk1LjExXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQ4My42MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0MjMzLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDgyLjAzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQ3NC4zM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0MzIuMjRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDE3Ni45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQxMzkuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0NDguMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0NDMuNTdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDczOC44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQxNDAuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0MTMxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQ1MS45MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MzQzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQxNjkuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0MTAxLjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDUzLjY5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQ2MzEuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MjQyLjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDEwOS4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQ4Mi40NFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MTQ3N1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0NDEzLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDIwMi4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQ4NC4yM1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0MjA2LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDEwOS45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQ2MC4wNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0NDcuNzFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDE1NjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDIwMi4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQxNTAuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0NzAuNjRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDM2NS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQxMDMuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0ODIuOTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDQ1LjExXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQyNzU1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQzMTQuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0MjU0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQ4NC4zMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0NzMzLjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDEyOS40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQ5NC4xMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0NDUuMjVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDUyNS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQxNTBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDEyOC43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQ1My44NFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0NDA1NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MjMwLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDE1NC4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQ2MS4yNlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0NTAyLjdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDE1Ny41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQ3OC4yOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTksXG5cdFx0XHRcdFx0NDUuMTVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDEzNTdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDI5MC4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQxNDguM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0NjIuMTFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDIyMDhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDYzNy43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQxMjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI0LFxuXHRcdFx0XHRcdDc2LjA4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQzNzQxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQyNTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDIwNC4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQ3OC41MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0NDE2MFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0NDY4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQ1NTMyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQzMTMuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0MjQxLjdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDYyLjk5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQ2MzY2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQzOTEuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0MTg3Ljhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDg4LjI5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQ4OS4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMSxcblx0XHRcdFx0XHQ2OC4wM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjMsXG5cdFx0XHRcdFx0MzUuNTRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDMwLjg4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQ3MTMuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0MTQwLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDEyNi4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQyMy40MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0NjYxLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI0LFxuXHRcdFx0XHRcdDE0Mi45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQ3OC4zNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjMsXG5cdFx0XHRcdFx0MzAuNTVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIxLFxuXHRcdFx0XHRcdDE2NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0MTA5LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI0LFxuXHRcdFx0XHRcdDc2LjY1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMixcblx0XHRcdFx0XHQ2MS44NFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjIsXG5cdFx0XHRcdFx0MTQ0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQ2MC42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQ1OS4yNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjEsXG5cdFx0XHRcdFx0MzcuNTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDY1LjE3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMyxcblx0XHRcdFx0XHQ0NC43OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjIsXG5cdFx0XHRcdFx0NDQuNDJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDI5LjY1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQxMDhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDU3Ljhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDQ4LjIxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQzMy41MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MTQyLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDY1Ljhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDU5LjA3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQzMC4zOVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MTkzLjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDYzLjkxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQ1MC4xM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0MjcuNTRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE5LFxuXHRcdFx0XHRcdDIxMC42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQxMzkuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjAsXG5cdFx0XHRcdFx0ODguMTNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDc3LjA3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMCxcblx0XHRcdFx0XHQxMzYuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjEsXG5cdFx0XHRcdFx0MTMxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQxNC40NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjMsXG5cdFx0XHRcdFx0NS42MTdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDI2OS4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQxNTIuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0NjQuNDlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDU1LjcyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMyxcblx0XHRcdFx0XHQxNTEuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjIsXG5cdFx0XHRcdFx0NjguMzJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDM5LjY4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQzMy45MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjIsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTksXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjAsXG5cdFx0XHRcdFx0MTAwLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIxLFxuXHRcdFx0XHRcdDkyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQxOC43OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjIsXG5cdFx0XHRcdFx0MTcuNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjEsXG5cdFx0XHRcdFx0MjkuMTZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDIxLjQ2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMCxcblx0XHRcdFx0XHQxMS42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nixcblx0XHRcdFx0XHQ3LjAwNVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjAsXG5cdFx0XHRcdFx0NDEuNzdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIxLFxuXHRcdFx0XHRcdDI2Ljg0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOSxcblx0XHRcdFx0XHQ5LjA1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQ3LjY1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMSxcblx0XHRcdFx0XHQxMzcuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjIsXG5cdFx0XHRcdFx0ODAuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTgsXG5cdFx0XHRcdFx0MTUuNzJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDEzLjQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nixcblx0XHRcdFx0XHQzMi4wN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzUsXG5cdFx0XHRcdFx0MjAuOTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIxLFxuXHRcdFx0XHRcdDUuNDkzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NCxcblx0XHRcdFx0XHQ1LjE3M1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzcsXG5cdFx0XHRcdFx0MTkuMjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc2LFxuXHRcdFx0XHRcdDkuMjM1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMCxcblx0XHRcdFx0XHQ4LjQ4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3OCxcblx0XHRcdFx0XHQ3LjA0OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzcsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzcsXG5cdFx0XHRcdFx0NTAuMTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc2LFxuXHRcdFx0XHRcdDQ2LjI0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NSxcblx0XHRcdFx0XHQ0Ljk0M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzgsXG5cdFx0XHRcdFx0My4xNThcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc2LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDY1LjQ0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOSxcblx0XHRcdFx0XHQzMy42NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MzAuMTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDI0Ljg3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQ0NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MjYuOTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDI0Ljg4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQxNC44NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0MzQuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MjQuNTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDIzLjYzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQxOS44OFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0MTkuMTdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDE2LjUxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQxMy43OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MTMuMzlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDEwLjU0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQxMC4yOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NCxcblx0XHRcdFx0XHQ5LjcxM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQ5LjE1M1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQxNS40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NCxcblx0XHRcdFx0XHQxNS4xOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0Ny44M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Mixcblx0XHRcdFx0XHQ2Ljk1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzLFxuXHRcdFx0XHRcdDI4LjM1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0LFxuXHRcdFx0XHRcdDI1LjczXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyLFxuXHRcdFx0XHRcdDExLjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDkuMTkxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQyMC45MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MTMuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0MTIuOTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDguMTcyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzLFxuXHRcdFx0XHRcdDEyLjkxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQxMC4yOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Mixcblx0XHRcdFx0XHQ4Ljk3NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0Ny4xMjRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0MjQuOTZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIsXG5cdFx0XHRcdFx0MTYuNDZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0OC4xNjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEsXG5cdFx0XHRcdFx0OC4wMzNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0NTAuMzhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIsXG5cdFx0XHRcdFx0MzAuMTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0OS4xNTNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEsXG5cdFx0XHRcdFx0Ny43Njhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDE4MDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDU3NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MTQ3Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI0LFxuXHRcdFx0XHRcdDc2LjY3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNCxcblx0XHRcdFx0XHQyNDUuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0MTM4LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDM3Ljk2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQzMS45M1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0NjM3LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU2LFxuXHRcdFx0XHRcdDQxMi45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQyNjYuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTQsXG5cdFx0XHRcdFx0MTc0LjVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIxLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDExMTBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI0LFxuXHRcdFx0XHRcdDE1MC41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQ5MS42OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjAsXG5cdFx0XHRcdFx0NDAuNDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDYxMzRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI0LFxuXHRcdFx0XHRcdDIyOS40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQxOTRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDY2Ljg5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQzNzcuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0MzcwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQyODMuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTQsXG5cdFx0XHRcdFx0MTIwLjlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU0LFxuXHRcdFx0XHRcdDE1ODdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU2LFxuXHRcdFx0XHRcdDgxNy40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQxNDAuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTcsXG5cdFx0XHRcdFx0MTE3LjVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU2LFxuXHRcdFx0XHRcdDQ1Nzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU0LFxuXHRcdFx0XHRcdDM2MS40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nyxcblx0XHRcdFx0XHQ4Ni43OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0My45NzZcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU2LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XVxuXHRcdF1cblx0fSxcblx0XCJyaWdodEV5ZVwiOiB7XG5cdFx0XCJpbmRleFwiOiBbXG5cdFx0XHQyOTMsXG5cdFx0XHQyODYsXG5cdFx0XHQyODMsXG5cdFx0XHQyODgsXG5cdFx0XHQyODksXG5cdFx0XHQzMzAsXG5cdFx0XHQyODUsXG5cdFx0XHQyOTAsXG5cdFx0XHQyODMsXG5cdFx0XHQyODksXG5cdFx0XHQzMzcsXG5cdFx0XHQzMzAsXG5cdFx0XHQyODcsXG5cdFx0XHQyOTIsXG5cdFx0XHQzMzcsXG5cdFx0XHQyODcsXG5cdFx0XHQyODYsXG5cdFx0XHQyOTMsXG5cdFx0XHQyODYsXG5cdFx0XHQyODUsXG5cdFx0XHQyODMsXG5cdFx0XHQyODksXG5cdFx0XHQyODcsXG5cdFx0XHQzMzcsXG5cdFx0XHQyOTIsXG5cdFx0XHQyODcsXG5cdFx0XHQyOTNcblx0XHRdXG5cdH0sXG5cdFwibGVmdEV5ZVwiOiB7XG5cdFx0XCJpbmRleFwiOiBbXG5cdFx0XHQxNzUsXG5cdFx0XHQxMTksXG5cdFx0XHQxMjEsXG5cdFx0XHQxMjUsXG5cdFx0XHQxMTksXG5cdFx0XHQxMjYsXG5cdFx0XHQxMTUsXG5cdFx0XHQxMTcsXG5cdFx0XHQxMjUsXG5cdFx0XHQxNjgsXG5cdFx0XHQxMjEsXG5cdFx0XHQxMjAsXG5cdFx0XHQxMTUsXG5cdFx0XHQxMjIsXG5cdFx0XHQxMTgsXG5cdFx0XHQxNjgsXG5cdFx0XHQxNzUsXG5cdFx0XHQxMjEsXG5cdFx0XHQxNzUsXG5cdFx0XHQxMjYsXG5cdFx0XHQxMTksXG5cdFx0XHQxMjUsXG5cdFx0XHQxMTcsXG5cdFx0XHQxMTksXG5cdFx0XHQxMTUsXG5cdFx0XHQxMTgsXG5cdFx0XHQxMTdcblx0XHRdXG5cdH1cbn07XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9kYXRhL2ZhY2UyLmpzb25cbiAqKiBtb2R1bGUgaWQgPSAxNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==