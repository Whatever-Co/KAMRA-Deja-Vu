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
	
	var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();
	
	var _delaunayFast = __webpack_require__(1);
	
	var _delaunayFast2 = _interopRequireDefault(_delaunayFast);
	
	var _simpleQuadtree = __webpack_require__(2);
	
	var _simpleQuadtree2 = _interopRequireDefault(_simpleQuadtree);
	
	var _standardFaceData = __webpack_require__(3);
	
	var _standardFaceData2 = _interopRequireDefault(_standardFaceData);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	self.THREE = {};
	importScripts('libs/three.min.js');
	
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
	
	  var tree = (0, _simpleQuadtree2.default)(-1, -1, 2, 2);
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
	
	  var getTriangleIndex = function getTriangleIndex(p) {
	    var candidate = tree.get({ x: p[0], y: p[1], w: 0, h: 0 });
	    for (var i = 0; i < candidate.length; i++) {
	      var node = candidate[i];
	      var uv = _delaunayFast2.default.contains([node.v0, node.v1, node.v2], p);
	      if (uv) {
	        uv.unshift(1 - uv[0] - uv[1]);
	        return [node.index, uv];
	      }
	    }
	    console.error('not found');
	  };
	
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNTczZGRlNTU1Y2ZhYjA2MWFkOWMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3BjL3ByZXByb2Nlc3Mtd29ya2VyLmpzIiwid2VicGFjazovLy8uL34vZGVsYXVuYXktZmFzdC9kZWxhdW5heS5qcyIsIndlYnBhY2s6Ly8vLi9+L3NpbXBsZS1xdWFkdHJlZS9xdHJlZS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvcGMvc3RhbmRhcmQtZmFjZS1kYXRhLmpzIiwid2VicGFjazovLy8uL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC9jb21tb24uanMiLCJ3ZWJwYWNrOi8vLy4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC9tYXQyLmpzIiwid2VicGFjazovLy8uL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvbWF0MmQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC9tYXQzLmpzIiwid2VicGFjazovLy8uL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvbWF0NC5qcyIsIndlYnBhY2s6Ly8vLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L3F1YXQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC92ZWMzLmpzIiwid2VicGFjazovLy8uL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvdmVjNC5qcyIsIndlYnBhY2s6Ly8vLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L3ZlYzIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3BjL2RhdGEvZmFjZTIuanNvbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVB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QTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEVBQUM7Ozs7Ozs7QUN6T0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx5QkFBd0Isb0JBQW9CO0FBQzVDO0FBQ0Esa0NBQWlDO0FBQ2pDO0FBQ0E7QUFDQSxrQkFBaUI7QUFDakI7QUFDQTs7QUFFQSxpQkFB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LFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsZ0I7QUFDQSxxQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsT0FBTztBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGVBQWM7QUFDZDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTs7QUFFQTtB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsZ0I7QUFDQSxxQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixjQUFhLE9BQU87QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHFEO0FBQ0E7QUFDQTtBQUNBO0FB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cEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLDRDQUEyQyxhQUFhOztBQUV4RDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxNQUFNO0FBQ2pCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLE1BQU07QUFDakIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxNQUFNO0FBQ2pCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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TztBQUNwQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLLE87QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsRUFBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsT0FBTztBQUNwQjtB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QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLE9BQU87QUFDcEI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLE9BQU87QUFDbEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsS0FBSztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsTUFBTTtBQUNqQixZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLFlBQVcsT0FBTztBQUNsQixZQUFXLFNBQVM7QUFDcEIsWUFBVyxPQUFPO0FBQ2xCLGNBQWEsTUFBTTtBQUNuQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0E7O0FBRUEsd0JBQXVCLE9BQU87QUFDOUIsMkJBQTBCLGlCQUFpQjtBQUMzQztBQUNBLDJCQUEwQixpQkFBaUI7QUFDM0M7O0FBRUE7QUFDQTtBQUNBLEVBQUM7O0FBRUQ7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxPQUFPO0FBQ3BCO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7QUFDQSxNO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLGNBQWEsT0FBTztBQUNwQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7OztBQ3BzQkE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixZQUFXLEtBQUs7QUFDaEIsY0FBYSxLQUFLO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsT0FBTztBQUNsQixZQUFXLE9BQU87QUFDbEIsWUFBVyxPQUFPO0FBQ2xCLFlBQVcsT0FBTztBQUNsQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFXLEtBQUs7QUFDaEIsWUFBVyxLQUFLO0FBQ2hCLFlBQVcsS0FBSztBQUNoQixjQUFhLEtBQUs7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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O0FBQ0EsMkJBQTBCO0FBQzFCOztBQUVBO0FBQ0E7QUFDQSxFQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBLFlBQVcsS0FBSztBQUNoQixjQUFhLE9BQU87QUFDcEI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7Ozs7Ozs7QUMxZ0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEciLCJmaWxlIjoiMC53b3JrZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIDU3M2RkZTU1NWNmYWIwNjFhZDljXG4gKiovIiwic2VsZi5USFJFRSA9IHt9XG5pbXBvcnRTY3JpcHRzKCdsaWJzL3RocmVlLm1pbi5qcycpXG5cbmltcG9ydCBEZWxhdW5heSBmcm9tICdkZWxhdW5heS1mYXN0J1xuaW1wb3J0IFF1YWRUcmVlIGZyb20gJ3NpbXBsZS1xdWFkdHJlZSdcblxuaW1wb3J0IFN0YW5kYXJkRmFjZURhdGEgZnJvbSAnLi9zdGFuZGFyZC1mYWNlLWRhdGEnXG5cblxuY29uc3QgY29udmVydERhdGEgPSAodmVydGljZXMpID0+IHtcbiAgbGV0IHN0YW5kYXJkRmFjZSA9IG5ldyBTdGFuZGFyZEZhY2VEYXRhKClcblxuICBsZXQgc3RhbmRhcmRGYWNlUG9pbnRzID0gW11cbiAgbGV0IHBvc2l0aW9uID0gc3RhbmRhcmRGYWNlLmRhdGEuZmFjZS5wb3NpdGlvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHBvc2l0aW9uLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgc3RhbmRhcmRGYWNlUG9pbnRzLnB1c2goW3Bvc2l0aW9uW2ldLCBwb3NpdGlvbltpICsgMV1dKVxuICB9XG4gIHN0YW5kYXJkRmFjZVBvaW50cy5wdXNoKFsxLCAxXSlcbiAgc3RhbmRhcmRGYWNlUG9pbnRzLnB1c2goWzEsIC0xXSlcbiAgc3RhbmRhcmRGYWNlUG9pbnRzLnB1c2goWy0xLCAtMV0pXG4gIHN0YW5kYXJkRmFjZVBvaW50cy5wdXNoKFstMSwgMV0pXG5cbiAgbGV0IHRyaWFuZ2xlSW5kaWNlcyA9IERlbGF1bmF5LnRyaWFuZ3VsYXRlKHN0YW5kYXJkRmFjZVBvaW50cylcblxuICBsZXQgdHJlZSA9IFF1YWRUcmVlKC0xLCAtMSwgMiwgMilcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0cmlhbmdsZUluZGljZXMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICBsZXQgdjAgPSBzdGFuZGFyZEZhY2VQb2ludHNbdHJpYW5nbGVJbmRpY2VzW2ldXVxuICAgIGxldCB2MSA9IHN0YW5kYXJkRmFjZVBvaW50c1t0cmlhbmdsZUluZGljZXNbaSArIDFdXVxuICAgIGxldCB2MiA9IHN0YW5kYXJkRmFjZVBvaW50c1t0cmlhbmdsZUluZGljZXNbaSArIDJdXVxuICAgIGxldCBtaW5YID0gTWF0aC5taW4odjBbMF0sIHYxWzBdLCB2MlswXSlcbiAgICBsZXQgbWluWSA9IE1hdGgubWluKHYwWzFdLCB2MVsxXSwgdjJbMV0pXG4gICAgbGV0IG1heFggPSBNYXRoLm1heCh2MFswXSwgdjFbMF0sIHYyWzBdKVxuICAgIGxldCBtYXhZID0gTWF0aC5tYXgodjBbMV0sIHYxWzFdLCB2MlsxXSlcbiAgICB0cmVlLnB1dCh7XG4gICAgICB4OiBtaW5YLFxuICAgICAgeTogbWluWSxcbiAgICAgIHc6IG1heFggLSBtaW5YLFxuICAgICAgaDogbWF4WSAtIG1pblksXG4gICAgICBpbmRleDogaSxcbiAgICAgIHYwLFxuICAgICAgdjEsXG4gICAgICB2MiAgICAgIFxuICAgIH0pXG4gIH1cblxuICBjb25zdCBnZXRUcmlhbmdsZUluZGV4ID0gKHApID0+IHtcbiAgICBsZXQgY2FuZGlkYXRlID0gdHJlZS5nZXQoe3g6IHBbMF0sIHk6IHBbMV0sIHc6IDAsIGg6IDB9KVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2FuZGlkYXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgbm9kZSA9IGNhbmRpZGF0ZVtpXVxuICAgICAgbGV0IHV2ID0gRGVsYXVuYXkuY29udGFpbnMoW25vZGUudjAsIG5vZGUudjEsIG5vZGUudjJdLCBwKVxuICAgICAgaWYgKHV2KSB7XG4gICAgICAgIHV2LnVuc2hpZnQoMSAtIHV2WzBdIC0gdXZbMV0pXG4gICAgICAgIHJldHVybiBbbm9kZS5pbmRleCwgdXZdXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnNvbGUuZXJyb3IoJ25vdCBmb3VuZCcpXG4gIH1cblxuICByZXR1cm4gdmVydGljZXMubWFwKCh2ZXJ0aWNlcykgPT4ge1xuICAgIGxldCB3ZWlnaHRzID0gW11cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZlcnRpY2VzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICBsZXQgW2luZGV4LCBjb29yZF0gPSBnZXRUcmlhbmdsZUluZGV4KFt2ZXJ0aWNlc1tpXSwgdmVydGljZXNbaSArIDFdXSwgc3RhbmRhcmRGYWNlUG9pbnRzKVxuICAgICAgd2VpZ2h0cy5wdXNoKHRyaWFuZ2xlSW5kaWNlc1tpbmRleCArIDBdLCB0cmlhbmdsZUluZGljZXNbaW5kZXggKyAxXSwgdHJpYW5nbGVJbmRpY2VzW2luZGV4ICsgMl0sIGNvb3JkWzBdLCBjb29yZFsxXSwgY29vcmRbMl0sIHZlcnRpY2VzW2kgKyAyXSlcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkod2VpZ2h0cylcbiAgfSlcbn1cblxuXG5vbm1lc3NhZ2UgPSAoZXZlbnQpID0+IHtcbiAgY29uc29sZS5sb2coJ3N0YXJ0JywgcGVyZm9ybWFuY2Uubm93KCkpXG4gIGxldCByZXN1bHQgPSBjb252ZXJ0RGF0YShldmVudC5kYXRhKVxuICBjb25zb2xlLmxvZygnZG9uZScsIHBlcmZvcm1hbmNlLm5vdygpKVxuICBwb3N0TWVzc2FnZShyZXN1bHQsIHJlc3VsdC5tYXAoKGEpID0+IGEuYnVmZmVyKSlcbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3BjL3ByZXByb2Nlc3Mtd29ya2VyLmpzXG4gKiovIiwidmFyIERlbGF1bmF5O1xuXG4oZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIHZhciBFUFNJTE9OID0gMS4wIC8gMTA0ODU3Ni4wO1xuXG4gIGZ1bmN0aW9uIHN1cGVydHJpYW5nbGUodmVydGljZXMpIHtcbiAgICB2YXIgeG1pbiA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcbiAgICAgICAgeW1pbiA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcbiAgICAgICAgeG1heCA9IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSxcbiAgICAgICAgeW1heCA9IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSxcbiAgICAgICAgaSwgZHgsIGR5LCBkbWF4LCB4bWlkLCB5bWlkO1xuXG4gICAgZm9yKGkgPSB2ZXJ0aWNlcy5sZW5ndGg7IGktLTsgKSB7XG4gICAgICBpZih2ZXJ0aWNlc1tpXVswXSA8IHhtaW4pIHhtaW4gPSB2ZXJ0aWNlc1tpXVswXTtcbiAgICAgIGlmKHZlcnRpY2VzW2ldWzBdID4geG1heCkgeG1heCA9IHZlcnRpY2VzW2ldWzBdO1xuICAgICAgaWYodmVydGljZXNbaV1bMV0gPCB5bWluKSB5bWluID0gdmVydGljZXNbaV1bMV07XG4gICAgICBpZih2ZXJ0aWNlc1tpXVsxXSA+IHltYXgpIHltYXggPSB2ZXJ0aWNlc1tpXVsxXTtcbiAgICB9XG5cbiAgICBkeCA9IHhtYXggLSB4bWluO1xuICAgIGR5ID0geW1heCAtIHltaW47XG4gICAgZG1heCA9IE1hdGgubWF4KGR4LCBkeSk7XG4gICAgeG1pZCA9IHhtaW4gKyBkeCAqIDAuNTtcbiAgICB5bWlkID0geW1pbiArIGR5ICogMC41O1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIFt4bWlkIC0gMjAgKiBkbWF4LCB5bWlkIC0gICAgICBkbWF4XSxcbiAgICAgIFt4bWlkICAgICAgICAgICAgLCB5bWlkICsgMjAgKiBkbWF4XSxcbiAgICAgIFt4bWlkICsgMjAgKiBkbWF4LCB5bWlkIC0gICAgICBkbWF4XVxuICAgIF07XG4gIH1cblxuICBmdW5jdGlvbiBjaXJjdW1jaXJjbGUodmVydGljZXMsIGksIGosIGspIHtcbiAgICB2YXIgeDEgPSB2ZXJ0aWNlc1tpXVswXSxcbiAgICAgICAgeTEgPSB2ZXJ0aWNlc1tpXVsxXSxcbiAgICAgICAgeDIgPSB2ZXJ0aWNlc1tqXVswXSxcbiAgICAgICAgeTIgPSB2ZXJ0aWNlc1tqXVsxXSxcbiAgICAgICAgeDMgPSB2ZXJ0aWNlc1trXVswXSxcbiAgICAgICAgeTMgPSB2ZXJ0aWNlc1trXVsxXSxcbiAgICAgICAgZmFic3kxeTIgPSBNYXRoLmFicyh5MSAtIHkyKSxcbiAgICAgICAgZmFic3kyeTMgPSBNYXRoLmFicyh5MiAtIHkzKSxcbiAgICAgICAgeGMsIHljLCBtMSwgbTIsIG14MSwgbXgyLCBteTEsIG15MiwgZHgsIGR5O1xuXG4gICAgLyogQ2hlY2sgZm9yIGNvaW5jaWRlbnQgcG9pbnRzICovXG4gICAgaWYoZmFic3kxeTIgPCBFUFNJTE9OICYmIGZhYnN5MnkzIDwgRVBTSUxPTilcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVlayEgQ29pbmNpZGVudCBwb2ludHMhXCIpO1xuXG4gICAgaWYoZmFic3kxeTIgPCBFUFNJTE9OKSB7XG4gICAgICBtMiAgPSAtKCh4MyAtIHgyKSAvICh5MyAtIHkyKSk7XG4gICAgICBteDIgPSAoeDIgKyB4MykgLyAyLjA7XG4gICAgICBteTIgPSAoeTIgKyB5MykgLyAyLjA7XG4gICAgICB4YyAgPSAoeDIgKyB4MSkgLyAyLjA7XG4gICAgICB5YyAgPSBtMiAqICh4YyAtIG14MikgKyBteTI7XG4gICAgfVxuXG4gICAgZWxzZSBpZihmYWJzeTJ5MyA8IEVQU0lMT04pIHtcbiAgICAgIG0xICA9IC0oKHgyIC0geDEpIC8gKHkyIC0geTEpKTtcbiAgICAgIG14MSA9ICh4MSArIHgyKSAvIDIuMDtcbiAgICAgIG15MSA9ICh5MSArIHkyKSAvIDIuMDtcbiAgICAgIHhjICA9ICh4MyArIHgyKSAvIDIuMDtcbiAgICAgIHljICA9IG0xICogKHhjIC0gbXgxKSArIG15MTtcbiAgICB9XG5cbiAgICBlbHNlIHtcbiAgICAgIG0xICA9IC0oKHgyIC0geDEpIC8gKHkyIC0geTEpKTtcbiAgICAgIG0yICA9IC0oKHgzIC0geDIpIC8gKHkzIC0geTIpKTtcbiAgICAgIG14MSA9ICh4MSArIHgyKSAvIDIuMDtcbiAgICAgIG14MiA9ICh4MiArIHgzKSAvIDIuMDtcbiAgICAgIG15MSA9ICh5MSArIHkyKSAvIDIuMDtcbiAgICAgIG15MiA9ICh5MiArIHkzKSAvIDIuMDtcbiAgICAgIHhjICA9IChtMSAqIG14MSAtIG0yICogbXgyICsgbXkyIC0gbXkxKSAvIChtMSAtIG0yKTtcbiAgICAgIHljICA9IChmYWJzeTF5MiA+IGZhYnN5MnkzKSA/XG4gICAgICAgIG0xICogKHhjIC0gbXgxKSArIG15MSA6XG4gICAgICAgIG0yICogKHhjIC0gbXgyKSArIG15MjtcbiAgICB9XG5cbiAgICBkeCA9IHgyIC0geGM7XG4gICAgZHkgPSB5MiAtIHljO1xuICAgIHJldHVybiB7aTogaSwgajogaiwgazogaywgeDogeGMsIHk6IHljLCByOiBkeCAqIGR4ICsgZHkgKiBkeX07XG4gIH1cblxuICBmdW5jdGlvbiBkZWR1cChlZGdlcykge1xuICAgIHZhciBpLCBqLCBhLCBiLCBtLCBuO1xuXG4gICAgZm9yKGogPSBlZGdlcy5sZW5ndGg7IGo7ICkge1xuICAgICAgYiA9IGVkZ2VzWy0tal07XG4gICAgICBhID0gZWRnZXNbLS1qXTtcblxuICAgICAgZm9yKGkgPSBqOyBpOyApIHtcbiAgICAgICAgbiA9IGVkZ2VzWy0taV07XG4gICAgICAgIG0gPSBlZGdlc1stLWldO1xuXG4gICAgICAgIGlmKChhID09PSBtICYmIGIgPT09IG4pIHx8IChhID09PSBuICYmIGIgPT09IG0pKSB7XG4gICAgICAgICAgZWRnZXMuc3BsaWNlKGosIDIpO1xuICAgICAgICAgIGVkZ2VzLnNwbGljZShpLCAyKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIERlbGF1bmF5ID0ge1xuICAgIHRyaWFuZ3VsYXRlOiBmdW5jdGlvbih2ZXJ0aWNlcywga2V5KSB7XG4gICAgICB2YXIgbiA9IHZlcnRpY2VzLmxlbmd0aCxcbiAgICAgICAgICBpLCBqLCBpbmRpY2VzLCBzdCwgb3BlbiwgY2xvc2VkLCBlZGdlcywgZHgsIGR5LCBhLCBiLCBjO1xuXG4gICAgICAvKiBCYWlsIGlmIHRoZXJlIGFyZW4ndCBlbm91Z2ggdmVydGljZXMgdG8gZm9ybSBhbnkgdHJpYW5nbGVzLiAqL1xuICAgICAgaWYobiA8IDMpXG4gICAgICAgIHJldHVybiBbXTtcblxuICAgICAgLyogU2xpY2Ugb3V0IHRoZSBhY3R1YWwgdmVydGljZXMgZnJvbSB0aGUgcGFzc2VkIG9iamVjdHMuIChEdXBsaWNhdGUgdGhlXG4gICAgICAgKiBhcnJheSBldmVuIGlmIHdlIGRvbid0LCB0aG91Z2gsIHNpbmNlIHdlIG5lZWQgdG8gbWFrZSBhIHN1cGVydHJpYW5nbGVcbiAgICAgICAqIGxhdGVyIG9uISkgKi9cbiAgICAgIHZlcnRpY2VzID0gdmVydGljZXMuc2xpY2UoMCk7XG5cbiAgICAgIGlmKGtleSlcbiAgICAgICAgZm9yKGkgPSBuOyBpLS07IClcbiAgICAgICAgICB2ZXJ0aWNlc1tpXSA9IHZlcnRpY2VzW2ldW2tleV07XG5cbiAgICAgIC8qIE1ha2UgYW4gYXJyYXkgb2YgaW5kaWNlcyBpbnRvIHRoZSB2ZXJ0ZXggYXJyYXksIHNvcnRlZCBieSB0aGVcbiAgICAgICAqIHZlcnRpY2VzJyB4LXBvc2l0aW9uLiAqL1xuICAgICAgaW5kaWNlcyA9IG5ldyBBcnJheShuKTtcblxuICAgICAgZm9yKGkgPSBuOyBpLS07IClcbiAgICAgICAgaW5kaWNlc1tpXSA9IGk7XG5cbiAgICAgIGluZGljZXMuc29ydChmdW5jdGlvbihpLCBqKSB7XG4gICAgICAgIHJldHVybiB2ZXJ0aWNlc1tqXVswXSAtIHZlcnRpY2VzW2ldWzBdO1xuICAgICAgfSk7XG5cbiAgICAgIC8qIE5leHQsIGZpbmQgdGhlIHZlcnRpY2VzIG9mIHRoZSBzdXBlcnRyaWFuZ2xlICh3aGljaCBjb250YWlucyBhbGwgb3RoZXJcbiAgICAgICAqIHRyaWFuZ2xlcyksIGFuZCBhcHBlbmQgdGhlbSBvbnRvIHRoZSBlbmQgb2YgYSAoY29weSBvZikgdGhlIHZlcnRleFxuICAgICAgICogYXJyYXkuICovXG4gICAgICBzdCA9IHN1cGVydHJpYW5nbGUodmVydGljZXMpO1xuICAgICAgdmVydGljZXMucHVzaChzdFswXSwgc3RbMV0sIHN0WzJdKTtcbiAgICAgIFxuICAgICAgLyogSW5pdGlhbGl6ZSB0aGUgb3BlbiBsaXN0IChjb250YWluaW5nIHRoZSBzdXBlcnRyaWFuZ2xlIGFuZCBub3RoaW5nXG4gICAgICAgKiBlbHNlKSBhbmQgdGhlIGNsb3NlZCBsaXN0ICh3aGljaCBpcyBlbXB0eSBzaW5jZSB3ZSBoYXZuJ3QgcHJvY2Vzc2VkXG4gICAgICAgKiBhbnkgdHJpYW5nbGVzIHlldCkuICovXG4gICAgICBvcGVuICAgPSBbY2lyY3VtY2lyY2xlKHZlcnRpY2VzLCBuICsgMCwgbiArIDEsIG4gKyAyKV07XG4gICAgICBjbG9zZWQgPSBbXTtcbiAgICAgIGVkZ2VzICA9IFtdO1xuXG4gICAgICAvKiBJbmNyZW1lbnRhbGx5IGFkZCBlYWNoIHZlcnRleCB0byB0aGUgbWVzaC4gKi9cbiAgICAgIGZvcihpID0gaW5kaWNlcy5sZW5ndGg7IGktLTsgZWRnZXMubGVuZ3RoID0gMCkge1xuICAgICAgICBjID0gaW5kaWNlc1tpXTtcblxuICAgICAgICAvKiBGb3IgZWFjaCBvcGVuIHRyaWFuZ2xlLCBjaGVjayB0byBzZWUgaWYgdGhlIGN1cnJlbnQgcG9pbnQgaXNcbiAgICAgICAgICogaW5zaWRlIGl0J3MgY2lyY3VtY2lyY2xlLiBJZiBpdCBpcywgcmVtb3ZlIHRoZSB0cmlhbmdsZSBhbmQgYWRkXG4gICAgICAgICAqIGl0J3MgZWRnZXMgdG8gYW4gZWRnZSBsaXN0LiAqL1xuICAgICAgICBmb3IoaiA9IG9wZW4ubGVuZ3RoOyBqLS07ICkge1xuICAgICAgICAgIC8qIElmIHRoaXMgcG9pbnQgaXMgdG8gdGhlIHJpZ2h0IG9mIHRoaXMgdHJpYW5nbGUncyBjaXJjdW1jaXJjbGUsXG4gICAgICAgICAgICogdGhlbiB0aGlzIHRyaWFuZ2xlIHNob3VsZCBuZXZlciBnZXQgY2hlY2tlZCBhZ2Fpbi4gUmVtb3ZlIGl0XG4gICAgICAgICAgICogZnJvbSB0aGUgb3BlbiBsaXN0LCBhZGQgaXQgdG8gdGhlIGNsb3NlZCBsaXN0LCBhbmQgc2tpcC4gKi9cbiAgICAgICAgICBkeCA9IHZlcnRpY2VzW2NdWzBdIC0gb3BlbltqXS54O1xuICAgICAgICAgIGlmKGR4ID4gMC4wICYmIGR4ICogZHggPiBvcGVuW2pdLnIpIHtcbiAgICAgICAgICAgIGNsb3NlZC5wdXNoKG9wZW5bal0pO1xuICAgICAgICAgICAgb3Blbi5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvKiBJZiB3ZSdyZSBvdXRzaWRlIHRoZSBjaXJjdW1jaXJjbGUsIHNraXAgdGhpcyB0cmlhbmdsZS4gKi9cbiAgICAgICAgICBkeSA9IHZlcnRpY2VzW2NdWzFdIC0gb3BlbltqXS55O1xuICAgICAgICAgIGlmKGR4ICogZHggKyBkeSAqIGR5IC0gb3BlbltqXS5yID4gRVBTSUxPTilcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgLyogUmVtb3ZlIHRoZSB0cmlhbmdsZSBhbmQgYWRkIGl0J3MgZWRnZXMgdG8gdGhlIGVkZ2UgbGlzdC4gKi9cbiAgICAgICAgICBlZGdlcy5wdXNoKFxuICAgICAgICAgICAgb3BlbltqXS5pLCBvcGVuW2pdLmosXG4gICAgICAgICAgICBvcGVuW2pdLmosIG9wZW5bal0uayxcbiAgICAgICAgICAgIG9wZW5bal0uaywgb3BlbltqXS5pXG4gICAgICAgICAgKTtcbiAgICAgICAgICBvcGVuLnNwbGljZShqLCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qIFJlbW92ZSBhbnkgZG91YmxlZCBlZGdlcy4gKi9cbiAgICAgICAgZGVkdXAoZWRnZXMpO1xuXG4gICAgICAgIC8qIEFkZCBhIG5ldyB0cmlhbmdsZSBmb3IgZWFjaCBlZGdlLiAqL1xuICAgICAgICBmb3IoaiA9IGVkZ2VzLmxlbmd0aDsgajsgKSB7XG4gICAgICAgICAgYiA9IGVkZ2VzWy0tal07XG4gICAgICAgICAgYSA9IGVkZ2VzWy0tal07XG4gICAgICAgICAgb3Blbi5wdXNoKGNpcmN1bWNpcmNsZSh2ZXJ0aWNlcywgYSwgYiwgYykpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8qIENvcHkgYW55IHJlbWFpbmluZyBvcGVuIHRyaWFuZ2xlcyB0byB0aGUgY2xvc2VkIGxpc3QsIGFuZCB0aGVuXG4gICAgICAgKiByZW1vdmUgYW55IHRyaWFuZ2xlcyB0aGF0IHNoYXJlIGEgdmVydGV4IHdpdGggdGhlIHN1cGVydHJpYW5nbGUsXG4gICAgICAgKiBidWlsZGluZyBhIGxpc3Qgb2YgdHJpcGxldHMgdGhhdCByZXByZXNlbnQgdHJpYW5nbGVzLiAqL1xuICAgICAgZm9yKGkgPSBvcGVuLmxlbmd0aDsgaS0tOyApXG4gICAgICAgIGNsb3NlZC5wdXNoKG9wZW5baV0pO1xuICAgICAgb3Blbi5sZW5ndGggPSAwO1xuXG4gICAgICBmb3IoaSA9IGNsb3NlZC5sZW5ndGg7IGktLTsgKVxuICAgICAgICBpZihjbG9zZWRbaV0uaSA8IG4gJiYgY2xvc2VkW2ldLmogPCBuICYmIGNsb3NlZFtpXS5rIDwgbilcbiAgICAgICAgICBvcGVuLnB1c2goY2xvc2VkW2ldLmksIGNsb3NlZFtpXS5qLCBjbG9zZWRbaV0uayk7XG5cbiAgICAgIC8qIFlheSwgd2UncmUgZG9uZSEgKi9cbiAgICAgIHJldHVybiBvcGVuO1xuICAgIH0sXG4gICAgY29udGFpbnM6IGZ1bmN0aW9uKHRyaSwgcCkge1xuICAgICAgLyogQm91bmRpbmcgYm94IHRlc3QgZmlyc3QsIGZvciBxdWljayByZWplY3Rpb25zLiAqL1xuICAgICAgaWYoKHBbMF0gPCB0cmlbMF1bMF0gJiYgcFswXSA8IHRyaVsxXVswXSAmJiBwWzBdIDwgdHJpWzJdWzBdKSB8fFxuICAgICAgICAgKHBbMF0gPiB0cmlbMF1bMF0gJiYgcFswXSA+IHRyaVsxXVswXSAmJiBwWzBdID4gdHJpWzJdWzBdKSB8fFxuICAgICAgICAgKHBbMV0gPCB0cmlbMF1bMV0gJiYgcFsxXSA8IHRyaVsxXVsxXSAmJiBwWzFdIDwgdHJpWzJdWzFdKSB8fFxuICAgICAgICAgKHBbMV0gPiB0cmlbMF1bMV0gJiYgcFsxXSA+IHRyaVsxXVsxXSAmJiBwWzFdID4gdHJpWzJdWzFdKSlcbiAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgIHZhciBhID0gdHJpWzFdWzBdIC0gdHJpWzBdWzBdLFxuICAgICAgICAgIGIgPSB0cmlbMl1bMF0gLSB0cmlbMF1bMF0sXG4gICAgICAgICAgYyA9IHRyaVsxXVsxXSAtIHRyaVswXVsxXSxcbiAgICAgICAgICBkID0gdHJpWzJdWzFdIC0gdHJpWzBdWzFdLFxuICAgICAgICAgIGkgPSBhICogZCAtIGIgKiBjO1xuXG4gICAgICAvKiBEZWdlbmVyYXRlIHRyaS4gKi9cbiAgICAgIGlmKGkgPT09IDAuMClcbiAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgIHZhciB1ID0gKGQgKiAocFswXSAtIHRyaVswXVswXSkgLSBiICogKHBbMV0gLSB0cmlbMF1bMV0pKSAvIGksXG4gICAgICAgICAgdiA9IChhICogKHBbMV0gLSB0cmlbMF1bMV0pIC0gYyAqIChwWzBdIC0gdHJpWzBdWzBdKSkgLyBpO1xuXG4gICAgICAvKiBJZiB3ZSdyZSBvdXRzaWRlIHRoZSB0cmksIGZhaWwuICovXG4gICAgICBpZih1IDwgMC4wIHx8IHYgPCAwLjAgfHwgKHUgKyB2KSA+IDEuMClcbiAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgIHJldHVybiBbdSwgdl07XG4gICAgfVxuICB9O1xuXG4gIGlmKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIpXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBEZWxhdW5heTtcbn0pKCk7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9kZWxhdW5heS1mYXN0L2RlbGF1bmF5LmpzXG4gKiogbW9kdWxlIGlkID0gMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyoqXG4qXG4qIHNpbXBsZS1xdWFkdHJlZSBpcyBhIG1pbmltYWwgcXVhZHRyZWUgaW1wbGVtZW50YXRpb24gdGhhdCBzdXBwb3J0cyBzaW1wbGUgcHV0LCBnZXQsXG4qIHJlbW92ZSBhbmQgY2xlYXIgb3BlcmF0aW9ucyBvbiBvYmplY3RzIGhhdmluZyBhIHgsIHkgcG9zaXRpb24gYW5kIHcsIGggZGltZW5zaW9uLlxuKlxuKiBDb3B5cmlnaHQgKGMpIDIwMTMgQW50dGkgU2FhcmluZW4gPGFudHRpLnAuc2FhcmluZW5AZ21haWwuY29tPlxuKiBodHRwczovL2dpdGh1Yi5jb20vYXNhYXJpbmVuL3F0cmVlXG4qXG4qL1xuZnVuY3Rpb24gUXVhZFRyZWUoeCwgeSwgdywgaCwgb3B0aW9ucykge1xuXG4gICAgaWYoIHR5cGVvZiB4ICE9ICdudW1iZXInIHx8IGlzTmFOKHgpIClcbiAgICAgICAgeCA9IDA7XG4gICAgaWYoIHR5cGVvZiB5ICE9ICdudW1iZXInIHx8IGlzTmFOKHkpIClcbiAgICAgICAgeSA9IDA7XG4gICAgaWYoIHR5cGVvZiB3ICE9ICdudW1iZXInIHx8IGlzTmFOKHcpIClcbiAgICAgICAgdyA9IDEwO1xuICAgIGlmKCB0eXBlb2YgaCAhPSAnbnVtYmVyJyB8fCBpc05hTihoKSApXG4gICAgICAgIGggPSAxMDtcbiAgICBcbiAgICB2YXIgbWF4YyA9IDI1O1xuICAgIHZhciBsZWFmcmF0aW8gPSAwLjU7XG4gICAgaWYoIG9wdGlvbnMgKSB7XG4gICAgICAgIGlmKCB0eXBlb2Ygb3B0aW9ucy5tYXhjaGlsZHJlbiA9PSAnbnVtYmVyJyApXG4gICAgICAgICAgICBpZiggb3B0aW9ucy5tYXhjaGlsZHJlbiA+IDAgKVxuICAgICAgICAgICAgICAgIG1heGMgPSBvcHRpb25zLm1heGNoaWxkcmVuO1xuICAgICAgICBpZiggdHlwZW9mIG9wdGlvbnMubGVhZnJhdGlvID09ICdudW1iZXInIClcbiAgICAgICAgICAgIGlmKCBvcHRpb25zLmxlYWZyYXRpbyA+PSAwIClcbiAgICAgICAgICAgICAgICBsZWFmcmF0aW8gPSBvcHRpb25zLmxlYWZyYXRpbztcbiAgICB9XG5cbiAgICAvLyB2YWxpZGF0ZSBhbiBpbnB1dCBvYmplY3RcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZShvYmopIHtcbiAgICAgICAgaWYoICFvYmogKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiggdHlwZW9mIG9iai54ICE9ICdudW1iZXInIHx8XG4gICAgICAgICAgICB0eXBlb2Ygb2JqLnkgIT0gJ251bWJlcicgfHxcbiAgICAgICAgICAgIHR5cGVvZiBvYmoudyAhPSAnbnVtYmVyJyB8fFxuICAgICAgICAgICAgdHlwZW9mIG9iai5oICE9ICdudW1iZXInIClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYoIGlzTmFOKG9iai54KSB8fCBpc05hTihvYmoueSkgfHxcbiAgICAgICAgICAgIGlzTmFOKG9iai53KSB8fCBpc05hTihvYmouaCkgKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiggb2JqLncgPCAwIHx8IG9iai5oIDwgMCApXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIHRlc3QgZm9yIGRlZXAgZXF1YWxpdHkgZm9yIHgseSx3LGhcbiAgICBmdW5jdGlvbiBpc2VxdWFsKG8xLCBvMikge1xuICAgICAgICBpZiggbzEueCA9PSBvMi54ICYmXG4gICAgICAgICAgICBvMS55ID09IG8yLnkgJiZcbiAgICAgICAgICAgIG8xLncgPT0gbzIudyAmJlxuICAgICAgICAgICAgbzEuaCA9PSBvMi5oIClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIGEgbmV3IHF1YWR0cmVlIG5vZGVcbiAgICBmdW5jdGlvbiBjcmVhdGVub2RlKHgsIHksIHcsIGgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgdzogdyxcbiAgICAgICAgICAgIGg6IGgsXG4gICAgICAgICAgICBjOiBbXSxcbiAgICAgICAgICAgIGw6IFtdLFxuICAgICAgICAgICAgbjogW11cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHJvb3Qgbm9kZSB1c2VkIGJ5IHRoaXMgcXVhZHRyZWVcbiAgICB2YXIgcm9vdCA9IGNyZWF0ZW5vZGUoeCwgeSwgdywgaCk7XG5cbiAgICAvLyBjYWxjdWxhdGUgZGlzdGFuY2UgYmV0d2VlbiB0d28gcG9pbnRzXG4gICAgZnVuY3Rpb24gZGlzdGFuY2UoeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCgoeDIteDEpKih4Mi14MSkrKHkyLXkxKSooeTIteTEpKTtcbiAgICB9XG4gICAgXG4gICAgLy8gY2FsY3VsYXRlIGRpc3RhbmNlIGJldHdlZW4gYSBwb2ludCBhbmQgYSBsaW5lIChzZWdtZW50KVxuICAgIGZ1bmN0aW9uIGRpc3RhbmNlUEwoeCwgeSwgeDEsIHkxLCBkeDEsIGR5MSwgbGVuMSApIHtcbiAgICAgICAgaWYoICFsZW4xICkgLy8gaW4gY2FzZSBsZW5ndGggaXMgbm90IHByb3ZpZGVkLCBhc3N1bWUgYSBsaW5lIFxuICAgICAgICAgICAgbGVuMSA9IC0xO1xuICAgICAgICBcbiAgICAgICAgLy8geCA9IHgxICsgcyAqIGR4MSArIHQgKiBkeTFcbiAgICAgICAgLy8geSA9IHkxICsgcyAqIGR5MSAtIHQgKiBkeDFcbiAgICAgICAgLy8geCAqIGR5MSAtIHkgKiBkeDEgPSB4MSAqIGR5MSAtIHkxICogZHgxICsgXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgdCAqICggZHkxICogZHkxICsgZHgxICogZHgxIClcbiAgICAgICAgdmFyIHQgPSBkeDEgKiBkeDEgKyBkeTEgKiBkeTE7XG4gICAgICAgIGlmKCB0ID09IDAgKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdCA9ICggeCAqIGR5MSAtIHkgKiBkeDEgLSB4MSAqIGR5MSArIHkxICogZHgxICkgLyB0O1xuICAgICAgICAgICAgaWYoIE1hdGguYWJzKGR4MSkgPiBNYXRoLmFicyhkeTEpIClcbiAgICAgICAgICAgICAgICB2YXIgcyA9ICggeCAtIHgxIC0gdCAqIGR5MSApIC8gZHgxO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHZhciBzID0gKCB5IC0geTEgKyB0ICogZHgxICkgLyBkeTE7XG4gICAgICAgICAgICBpZiggKCBzID49IDAgJiYgcyA8PSBsZW4xICkgfHwgbGVuMSA8IDAgKVxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHM6IHMsXG4gICAgICAgICAgICAgICAgICAgIHQ6IHQsXG4gICAgICAgICAgICAgICAgICAgIHg6IHgxICsgcyAqIGR4MSxcbiAgICAgICAgICAgICAgICAgICAgeTogeTEgKyBzICogZHkxLFxuICAgICAgICAgICAgICAgICAgICBkaXN0OiBNYXRoLmFicyh0KVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICBlbHNlIGlmKCBzIDwgMCApIHsgXG4gICAgICAgICAgICAgICAgdmFyIGRpc3QgPSBkaXN0YW5jZSh4LCB5LCB4MSwgeTEpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHM6IHMsXG4gICAgICAgICAgICAgICAgICAgIGRpc3Q6IGRpc3RcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgZGlzdCA9IGRpc3RhbmNlKHgsIHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4MSArIGxlbjEqZHgxLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkxICsgbGVuMSpkeTEpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHM6IHMsXG4gICAgICAgICAgICAgICAgICAgIGRpc3Q6IGRpc3RcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGRvZXMgYSBsaW5lIGFuZCBhIHJlY3RhbmdsZSBvdmVybGFwID9cbiAgICBmdW5jdGlvbiBvdmVybGFwX2xpbmUobzEsIG8yLCBidWYpIHtcbiAgICAgICAgaWYoICFvMSB8fCAhbzIgKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHZhciBkaXN0ID0gZGlzdGFuY2VQTChvMi54ICsgMC41ICogbzIudyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8yLnkgKyAwLjUgKiBvMi5oLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbzEueCwgbzEueSwgbzEuZHgsIG8xLmR5LCBvMS5kaXN0KTtcbiAgICAgICAgaWYoIGRpc3QgKSB7XG4gICAgICAgICAgICBkaXN0LmRpc3QgLT0gYnVmO1xuICAgICAgICAgICAgaWYoIGRpc3QuZGlzdCA8IDAgKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgaWYoIGRpc3QuZGlzdCAqIGRpc3QuZGlzdCA8PSBvMi53ICogbzIudyArIG8yLmggKiBvMi5oIClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gZG8gdHdvIHJlY3RhbmdsZXMgb3ZlcmxhcCA/XG4gICAgZnVuY3Rpb24gb3ZlcmxhcF9yZWN0KG8xLCBvMiwgYnVmKSB7XG4gICAgICAgIGlmKCAhbzEgfHwgIW8yIClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBpZiggbzEueCArIG8xLncgPCBvMi54IC0gYnVmIHx8XG4gICAgICAgICAgICBvMS55ICsgbzEuaCA8IG8yLnkgLSBidWYgfHxcbiAgICAgICAgICAgIG8xLnggLSBidWYgPiBvMi54ICsgbzIudyB8fFxuICAgICAgICAgICAgbzEueSAtIGJ1ZiA+IG8yLnkgKyBvMi5oIClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNsZWFmKG5vZGUsIG9iaikge1xuXG4gICAgICAgIHZhciBsZWFmID0gZmFsc2U7XG4gICAgICAgIGlmKCBvYmoudyAqIG9iai5oID4gbm9kZS53ICogbm9kZS5oICogbGVhZnJhdGlvIClcbiAgICAgICAgICAgIGxlYWYgPSB0cnVlO1xuXG4gICAgICAgIGlmKCBvYmoueCA8IG5vZGUueCB8fFxuICAgICAgICAgICAgb2JqLnkgPCBub2RlLnkgfHxcbiAgICAgICAgICAgIG9iai54ICsgb2JqLncgPiBub2RlLnggKyBub2RlLncgfHxcbiAgICAgICAgICAgIG9iai55ICsgb2JqLmggPiBub2RlLnkgKyBub2RlLmggKVxuICAgICAgICAgICAgbGVhZiA9IHRydWU7XG5cbiAgICAgICAgdmFyIGNoaWxkbm9kZSA9IG51bGw7XG4gICAgICAgIGZvciggdmFyIG5pID0gMDsgbmkgPCBub2RlLm4ubGVuZ3RoOyBuaSsrIClcbiAgICAgICAgICAgIGlmKCBvdmVybGFwX3JlY3Qob2JqLCBub2RlLm5bbmldLCAwKSApIHtcbiAgICAgICAgICAgICAgICBpZiggY2hpbGRub2RlICkgeyAvLyBtdWx0aXBsZSBoaXRzXG4gICAgICAgICAgICAgICAgICAgIGxlYWYgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRub2RlID0gbm9kZS5uW25pXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7IGxlYWY6IGxlYWYsXG4gICAgICAgICAgICAgICAgIGNoaWxkbm9kZTogY2hpbGRub2RlIH07XG4gICAgfVxuXG4gICAgLy8gcHV0IGFuIG9iamVjdCB0byBvbmUgb2YgdGhlIGNoaWxkIG5vZGVzIG9mIHRoaXMgbm9kZVxuICAgIGZ1bmN0aW9uIHB1dF90b19ub2Rlcyhub2RlLCBvYmopIHtcbiAgICAgICAgdmFyIGxlYWYgPSBpc2xlYWYobm9kZSwgb2JqKTtcbiAgICAgICAgaWYoIGxlYWYubGVhZiApXG4gICAgICAgICAgICBub2RlLmwucHVzaChvYmopO1xuICAgICAgICBlbHNlIGlmKCBsZWFmLmNoaWxkbm9kZSApXG4gICAgICAgICAgICBwdXQobGVhZi5jaGlsZG5vZGUsIG9iaik7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gdXBkYXRlX2Nvb3JkcyhvYmosIHVwZGF0ZWRjb29yZHMpIHtcbiAgICAgICAgb2JqLnggPSAoKHR5cGVvZiB1cGRhdGVkY29vcmRzLnggPT0gJ251bWJlcicpID8gdXBkYXRlZGNvb3Jkcy54IDogb2JqLngpO1xuICAgICAgICBvYmoueSA9ICgodHlwZW9mIHVwZGF0ZWRjb29yZHMueSA9PSAnbnVtYmVyJykgPyB1cGRhdGVkY29vcmRzLnkgOiBvYmoueSk7XG4gICAgICAgIG9iai53ID0gKCh0eXBlb2YgdXBkYXRlZGNvb3Jkcy53ID09ICdudW1iZXInKSA/IHVwZGF0ZWRjb29yZHMudyA6IG9iai53KTtcbiAgICAgICAgb2JqLmggPSAoKHR5cGVvZiB1cGRhdGVkY29vcmRzLmggPT0gJ251bWJlcicpID8gdXBkYXRlZGNvb3Jkcy5oIDogb2JqLmgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZShub2RlLCBvYmosIGF0dHIsIHVwZGF0ZWRjb29yZHMpIHtcbiAgICAgICAgaWYoIHR5cGVvZiBhdHRyID09ICdvYmplY3QnICYmIHR5cGVvZiB1cGRhdGVkY29vcmRzID09ICd1bmRlZmluZWQnICkge1xuICAgICAgICAgICAgdXBkYXRlZGNvb3JkcyA9IGF0dHI7XG4gICAgICAgICAgICBhdHRyID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiggIXZhbGlkYXRlKG9iaikgfHwgdHlwZW9mIHVwZGF0ZWRjb29yZHMgPT0gJ3VuZGVmaW5lZCcgKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIGlmKCAhYXR0ciApXG4gICAgICAgICAgICBhdHRyID0gZmFsc2U7XG4gICAgICAgIGVsc2UgaWYoIHR5cGVvZiBhdHRyICE9ICdzdHJpbmcnIClcbiAgICAgICAgICAgIGF0dHIgPSAnaWQnO1xuXG4gICAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICAgIGZvciggdmFyIGNpID0gMDsgY2kgPCBub2RlLmMubGVuZ3RoOyBjaSsrIClcbiAgICAgICAgICAgIGlmKCAoIGF0dHIgJiYgbm9kZS5jW2NpXVthdHRyXSA9PSBvYmpbYXR0cl0gKSB8fFxuICAgICAgICAgICAgICAgICggIWF0dHIgJiYgaXNlcXVhbChub2RlLmNbY2ldLCBvYmopICkgKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBmb3VuZCB0aGUgb2JqZWN0IHRvIGJlIHVwZGF0ZWRcbiAgICAgICAgICAgICAgICB2YXIgb3JpZyA9IG5vZGUuY1tjaV07XG4gICAgICAgICAgICAgICAgdXBkYXRlX2Nvb3JkcyhvcmlnLCB1cGRhdGVkY29vcmRzKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiggb3JpZy54ID4gbm9kZS54ICsgbm9kZS53IHx8XG4gICAgICAgICAgICAgICAgICAgIG9yaWcueSA+IG5vZGUueSArIG5vZGUuaCB8fFxuICAgICAgICAgICAgICAgICAgICBvcmlnLnggKyBvcmlnLncgPCBub2RlLnggfHxcbiAgICAgICAgICAgICAgICAgICAgb3JpZy55ICsgb3JpZy5oIDwgbm9kZS55ICkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgb2JqZWN0IG5lZWRzIHRvIGJlIHJlbW92ZWQgYW5kIGFkZGVkXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuYy5zcGxpY2UoY2ksIDEpO1xuICAgICAgICAgICAgICAgICAgICBwdXQocm9vdCwgb3JpZyk7XG4gICAgICAgICAgICAgICAgfSAvLyB1cGRhdGVkIG9iamVjdCBpcyBzdGlsbCBpbnNpZGUgc2FtZSBub2RlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3IoIHZhciBjaSA9IDA7IGNpIDwgbm9kZS5sLmxlbmd0aDsgY2krKyApXG4gICAgICAgICAgICBpZiggKCBhdHRyICYmIG5vZGUubFtjaV1bYXR0cl0gPT0gb2JqW2F0dHJdICkgfHxcbiAgICAgICAgICAgICAgICAoICFhdHRyICYmIGlzZXF1YWwobm9kZS5sW2NpXSwgb2JqKSApICkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBvcmlnID0gbm9kZS5sW2NpXTtcbiAgICAgICAgICAgICAgICB1cGRhdGVfY29vcmRzKG9yaWcsIHVwZGF0ZWRjb29yZHMpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIGZvdW5kIHRoZSBvYmplY3QgdG8gYmUgdXBkYXRlZFxuICAgICAgICAgICAgICAgIGlmKCBvcmlnLnggPiBub2RlLnggKyBub2RlLncgfHxcbiAgICAgICAgICAgICAgICAgICAgb3JpZy55ID4gbm9kZS55ICsgbm9kZS5oIHx8XG4gICAgICAgICAgICAgICAgICAgIG9yaWcueCArIG9yaWcudyA8IG5vZGUueCB8fFxuICAgICAgICAgICAgICAgICAgICBvcmlnLnkgKyBvcmlnLmggPCBub2RlLnkgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBvYmplY3QgbmVlZHMgdG8gYmUgcmVtb3ZlZCBhbmQgYWRkZWQgXG4gICAgICAgICAgICAgICAgICAgIG5vZGUubC5zcGxpY2UoY2ksIDEpO1xuICAgICAgICAgICAgICAgICAgICBwdXQocm9vdCwgb3JpZyk7XG4gICAgICAgICAgICAgICAgfSAvLyB1cGRhdGVkIG9iamVjdCBpcyBzdGlsbCBpbnNpZGUgc2FtZSBub2RlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlYWYgPSBpc2xlYWYobm9kZSwgb2JqKTtcbiAgICAgICAgaWYoICFsZWFmLmxlYWYgJiYgbGVhZi5jaGlsZG5vZGUgKVxuICAgICAgICAgICAgaWYoIHVwZGF0ZShsZWFmLmNoaWxkbm9kZSwgb2JqLCBhdHRyKSApXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyByZW1vdmUgYW4gb2JqZWN0IGZyb20gdGhpcyBub2RlXG4gICAgZnVuY3Rpb24gcmVtb3ZlKG5vZGUsIG9iaiwgYXR0cikge1xuICAgICAgICBpZiggIXZhbGlkYXRlKG9iaikgKVxuICAgICAgICAgICAgcmV0dXJuIDA7XG5cbiAgICAgICAgaWYoICFhdHRyIClcbiAgICAgICAgICAgIGF0dHIgPSBmYWxzZTtcbiAgICAgICAgZWxzZSBpZiggdHlwZW9mIGF0dHIgIT0gJ3N0cmluZycgKVxuICAgICAgICAgICAgYXR0ciA9ICdpZCc7XG5cbiAgICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgICAgZm9yKCB2YXIgY2kgPSAwOyBjaSA8IG5vZGUuYy5sZW5ndGg7IGNpKysgKVxuICAgICAgICAgICAgaWYoICggYXR0ciAmJiBub2RlLmNbY2ldW2F0dHJdID09IG9ialthdHRyXSApIHx8XG4gICAgICAgICAgICAgICAgKCAhYXR0ciAmJiBpc2VxdWFsKG5vZGUuY1tjaV0sIG9iaikgKSApIHtcbiAgICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgICAgIG5vZGUuYy5zcGxpY2UoY2ksIDEpO1xuICAgICAgICAgICAgICAgIGNpLS07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgZm9yKCB2YXIgY2kgPSAwOyBjaSA8IG5vZGUubC5sZW5ndGg7IGNpKysgKVxuICAgICAgICAgICAgaWYoICggYXR0ciAmJiBub2RlLmxbY2ldW2F0dHJdID09IG9ialthdHRyXSApIHx8XG4gICAgICAgICAgICAgICAgKCAhYXR0ciAmJiBpc2VxdWFsKG5vZGUubFtjaV0sIG9iaikgKSApIHtcbiAgICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgICAgIG5vZGUubC5zcGxpY2UoY2ksIDEpO1xuICAgICAgICAgICAgICAgIGNpLS07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlYWYgPSBpc2xlYWYobm9kZSwgb2JqKTtcbiAgICAgICAgaWYoICFsZWFmLmxlYWYgJiYgbGVhZi5jaGlsZG5vZGUgKVxuICAgICAgICAgICAgcmV0dXJuIGNvdW50ICsgcmVtb3ZlKGxlYWYuY2hpbGRub2RlLCBvYmosIGF0dHIpO1xuICAgICAgICByZXR1cm4gY291bnQ7XG4gICAgfVxuXG4gICAgLy8gcHV0IGFuIG9iamVjdCB0byB0aGlzIG5vZGVcbiAgICBmdW5jdGlvbiBwdXQobm9kZSwgb2JqKSB7XG5cbiAgICAgICAgaWYoICF2YWxpZGF0ZShvYmopIClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBpZiggbm9kZS5uLmxlbmd0aCA9PSAwICkge1xuICAgICAgICAgICAgbm9kZS5jLnB1c2gob2JqKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gc3ViZGl2aWRlXG4gICAgICAgICAgICBpZiggbm9kZS5jLmxlbmd0aCA+IG1heGMgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHcyID0gbm9kZS53IC8gMjtcbiAgICAgICAgICAgICAgICB2YXIgaDIgPSBub2RlLmggLyAyO1xuICAgICAgICAgICAgICAgIG5vZGUubi5wdXNoKGNyZWF0ZW5vZGUobm9kZS54LCBub2RlLnksIHcyLCBoMiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlbm9kZShub2RlLnggKyB3Miwgbm9kZS55LCB3MiwgaDIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZW5vZGUobm9kZS54LCBub2RlLnkgKyBoMiwgdzIsIGgyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVub2RlKG5vZGUueCArIHcyLCBub2RlLnkgKyBoMiwgdzIsIGgyKSk7XG4gICAgICAgICAgICAgICAgZm9yKCB2YXIgY2kgPSAwOyBjaSA8IG5vZGUuYy5sZW5ndGg7IGNpKysgKSBcbiAgICAgICAgICAgICAgICAgICAgcHV0X3RvX25vZGVzKG5vZGUsIG5vZGUuY1tjaV0pO1xuICAgICAgICAgICAgICAgIG5vZGUuYyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgXG4gICAgICAgICAgICBwdXRfdG9fbm9kZXMobm9kZSwgb2JqKTtcbiAgICB9XG5cbiAgICAvLyBpdGVyYXRlIHRocm91Z2ggYWxsIG9iamVjdHMgaW4gdGhpcyBub2RlIG1hdGNoaW5nIGdpdmVuIG92ZXJsYXBcbiAgICAvLyBmdW5jdGlvblxuICAgIGZ1bmN0aW9uIGdldHRlcihvdmVybGFwZnVuLCBub2RlLCBvYmosIGJ1Ziwgc3RyaWN0LCBjYWxsYmFja09yQXJyYXkpIHtcbiAgICAgICAgZm9yKCB2YXIgbGkgPSAwOyBsaSA8IG5vZGUubC5sZW5ndGg7IGxpKysgKVxuICAgICAgICAgICAgaWYoICFzdHJpY3QgfHwgb3ZlcmxhcGZ1bihvYmosIG5vZGUubFtsaV0sIGJ1ZikgKVxuICAgICAgICAgICAgICAgIGlmKCB0eXBlb2YgY2FsbGJhY2tPckFycmF5ID09ICdvYmplY3QnIClcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tPckFycmF5LnB1c2gobm9kZS5sW2xpXSk7XG4gICAgICAgICAgICAgICAgZWxzZSBpZiggIWNhbGxiYWNrT3JBcnJheShub2RlLmxbbGldKSApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgZm9yKCB2YXIgbGkgPSAwOyBsaSA8IG5vZGUuYy5sZW5ndGg7IGxpKysgKVxuICAgICAgICAgICAgaWYoICFzdHJpY3QgfHwgb3ZlcmxhcGZ1bihvYmosIG5vZGUuY1tsaV0sIGJ1ZikgKVxuICAgICAgICAgICAgICAgIGlmKCB0eXBlb2YgY2FsbGJhY2tPckFycmF5ID09ICdvYmplY3QnIClcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tPckFycmF5LnB1c2gobm9kZS5jW2xpXSk7XG4gICAgICAgICAgICAgICAgZWxzZSBpZiggIWNhbGxiYWNrT3JBcnJheShub2RlLmNbbGldKSApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgZm9yKCB2YXIgbmkgPSAwOyBuaSA8IG5vZGUubi5sZW5ndGg7IG5pKysgKSB7XG4gICAgICAgICAgICBpZiggb3ZlcmxhcGZ1bihvYmosIG5vZGUubltuaV0sIGJ1ZikgKSB7XG4gICAgICAgICAgICAgICAgaWYoIHR5cGVvZiBjYWxsYmFja09yQXJyYXkgPT0gJ29iamVjdCcgKVxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja09yQXJyYXkuY29uY2F0KGdldHRlcihvdmVybGFwZnVuLCBub2RlLm5bbmldLCBvYmosIGJ1Ziwgc3RyaWN0LCBjYWxsYmFja09yQXJyYXkpKTtcbiAgICAgICAgICAgICAgICBlbHNlIGlmKCAhZ2V0dGVyKG92ZXJsYXBmdW4sIG5vZGUubltuaV0sIG9iaiwgYnVmLCBzdHJpY3QsIGNhbGxiYWNrT3JBcnJheSkgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8gaXRlcmF0ZSB0aHJvdWdoIGFsbCBvYmplY3RzIGluIHRoaXMgbm9kZSBtYXRjaGluZyB0aGUgZ2l2ZW4gcmVjdGFuZ2xlXG4gICAgZnVuY3Rpb24gZ2V0X3JlY3Qobm9kZSwgb2JqLCBidWYsIGNhbGxiYWNrT3JBcnJheSkge1xuICAgICAgICByZXR1cm4gZ2V0dGVyKG92ZXJsYXBfcmVjdCwgbm9kZSwgb2JqLCBidWYsIHRydWUsIGNhbGxiYWNrT3JBcnJheSk7XG4gICAgfVxuXG4gICAgLy8gaXRlcmF0ZSB0aHJvdWdoIGFsbCBvYmplY3RzIGluIHRoaXMgbm9kZSBtYXRjaGluZyB0aGUgZ2l2ZW5cbiAgICAvLyBsaW5lIChzZWdtZW50KVxuICAgIGZ1bmN0aW9uIGdldF9saW5lKG5vZGUsIG9iaiwgYnVmLCBjYWxsYmFja09yQXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIGdldHRlcihvdmVybGFwX2xpbmUsIG5vZGUsIG9iaiwgYnVmLCBmYWxzZSwgY2FsbGJhY2tPckFycmF5KTtcbiAgICB9XG5cbiAgICAvLyBpdGVyYXRlIHRocm91Z2ggYWxsIG9iamVjdHMgaW4gdGhpcyBub2RlIG1hdGNoaW5nIGdpdmVuXG4gICAgLy8gZ2VvbWV0cnksIGVpdGhlciBhIHJlY3RhbmdsZSBvciBhIGxpbmUgc2VnbWVudFxuICAgIGZ1bmN0aW9uIGdldChub2RlLCBvYmosIGJ1ZiwgY2FsbGJhY2tPckFycmF5KSB7XG5cbiAgICAgICAgaWYoICh0eXBlb2YgYnVmID09ICdmdW5jdGlvbicgfHwgdHlwZW9mIGJ1ZiA9PSAnb2JqZWN0JykgJiYgdHlwZW9mIGNhbGxiYWNrT3JBcnJheSA9PSAndW5kZWZpbmVkJyApIHtcbiAgICAgICAgICAgIGNhbGxiYWNrT3JBcnJheSA9IGJ1ZjtcbiAgICAgICAgICAgIGJ1ZiA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYoIHR5cGVvZiBjYWxsYmFja09yQXJyYXkgPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICAgICAgICBjYWxsYmFja09yQXJyYXkgPSBbXTtcbiAgICAgICAgICAgIGJ1ZiA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYoIG9iaiA9PSBudWxsIClcbiAgICAgICAgICAgIGdldF9yZWN0KG5vZGUsIG9iaiwgYnVmLCBjYWxsYmFja09yQXJyYXkpO1xuICAgICAgICBlbHNlIGlmKCB0eXBlb2Ygb2JqLnggPT0gJ251bWJlcicgJiZcbiAgICAgICAgICAgICAgICAgdHlwZW9mIG9iai55ID09ICdudW1iZXInICYmXG4gICAgICAgICAgICAgICAgICFpc05hTihvYmoueCkgJiYgIWlzTmFOKG9iai55KSApIHtcbiAgICAgICAgICAgIGlmKCB0eXBlb2Ygb2JqLmR4ID09ICdudW1iZXInICYmXG4gICAgICAgICAgICAgICAgdHlwZW9mIG9iai5keSA9PSAnbnVtYmVyJyAmJlxuICAgICAgICAgICAgICAgICFpc05hTihvYmouZHgpICYmICFpc05hTihvYmouZHkpIClcbiAgICAgICAgICAgICAgICBnZXRfbGluZShub2RlLCBvYmosIGJ1ZiwgY2FsbGJhY2tPckFycmF5KTtcbiAgICAgICAgICAgIGVsc2UgaWYoIHR5cGVvZiBvYmoudyA9PSAnbnVtYmVyJyAmJlxuICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIG9iai5oID09ICdudW1iZXInICYmXG4gICAgICAgICAgICAgICAgICAgICAhaXNOYU4ob2JqLncpICYmICFpc05hTihvYmouaCkgKVxuICAgICAgICAgICAgICAgIGdldF9yZWN0KG5vZGUsIG9iaiwgYnVmLCBjYWxsYmFja09yQXJyYXkpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCB0eXBlb2YgY2FsbGJhY2tPckFycmF5ID09ICdvYmplY3QnICkgXG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2tPckFycmF5O1xuICAgIH1cblxuICAgIC8vIHJldHVybiB0aGUgb2JqZWN0IGludGVyZmFjZVxuICAgIHJldHVybiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24ob2JqLCBidWYsIGNhbGxiYWNrT3JBcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIGdldChyb290LCBvYmosIGJ1ZiwgY2FsbGJhY2tPckFycmF5KTtcbiAgICAgICAgfSxcbiAgICAgICAgcHV0OiBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgICAgIHB1dChyb290LCBvYmopO1xuICAgICAgICB9LFxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKG9iaiwgYXR0ciwgdXBkYXRlZGNvb3Jkcykge1xuICAgICAgICAgICAgcmV0dXJuIHVwZGF0ZShyb290LCBvYmosIGF0dHIsIHVwZGF0ZWRjb29yZHMpO1xuICAgICAgICB9LFxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKG9iaiwgYXR0cikge1xuICAgICAgICAgICAgcmV0dXJuIHJlbW92ZShyb290LCBvYmosIGF0dHIpO1xuICAgICAgICB9LFxuICAgICAgICBjbGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByb290ID0gY3JlYXRlbm9kZSh4LCB5LCB3LCBoKTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RyaW5naWZ5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBzdHJvYmogPSB7XG4gICAgICAgICAgICAgICAgeDogeCwgeTogeSwgdzogdywgaDogaCxcbiAgICAgICAgICAgICAgICBtYXhjOiBtYXhjLCBcbiAgICAgICAgICAgICAgICBsZWFmcmF0aW86IGxlYWZyYXRpbyxcbiAgICAgICAgICAgICAgICByb290OiByb290XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoc3Ryb2JqKTtcbiAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICAgICAgLy8gY291bGQgbm90IHN0cmluZ2lmeVxuICAgICAgICAgICAgICAgIC8vIHByb2JhYmx5IGR1ZSB0byBvYmplY3RzIGluY2x1ZGVkIGluIHF0cmVlIGJlaW5nIG5vbi1zdHJpbmdpZmlhYmxlXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7IFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBwYXJzZTogZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgICAgICBpZiggdHlwZW9mIHN0ciA9PSAnc3RyaW5nJyApXG4gICAgICAgICAgICAgICAgc3RyID0gSlNPTi5wYXJzZShzdHIpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB4ID0gc3RyLng7XG4gICAgICAgICAgICB5ID0gc3RyLnk7XG4gICAgICAgICAgICB3ID0gc3RyLnc7XG4gICAgICAgICAgICBoID0gc3RyLmg7XG4gICAgICAgICAgICBtYXhjID0gc3RyLm1heGM7XG4gICAgICAgICAgICBsZWFmcmF0aW8gPSBzdHIubGVhZnJhdGlvO1xuICAgICAgICAgICAgcm9vdCA9IHN0ci5yb290O1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuLy8gZm9yIHVzZSB3aXRoaW4gbm9kZS5qc1xuaWYoIHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgKVxuICAgIG1vZHVsZS5leHBvcnRzID0gUXVhZFRyZWU7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9zaW1wbGUtcXVhZHRyZWUvcXRyZWUuanNcbiAqKiBtb2R1bGUgaWQgPSAyXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiBnbG9iYWwgVEhSRUUgKi9cblxuaW1wb3J0IHt2ZWMyLCB2ZWMzfSBmcm9tICdnbC1tYXRyaXgnXG5cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3RhbmRhcmRGYWNlRGF0YSB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5kYXRhID0gcmVxdWlyZSgnLi9kYXRhL2ZhY2UyLmpzb24nKVxuXG4gICAgbGV0IGluZGV4ID0gdGhpcy5kYXRhLmZhY2UuaW5kZXguY29uY2F0KHRoaXMuZGF0YS5yaWdodEV5ZS5pbmRleCwgdGhpcy5kYXRhLmxlZnRFeWUuaW5kZXgpXG4gICAgdGhpcy5pbmRleCA9IG5ldyBUSFJFRS5VaW50MTZBdHRyaWJ1dGUoaW5kZXgsIDEpXG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBUSFJFRS5GbG9hdDMyQXR0cmlidXRlKHRoaXMuZGF0YS5mYWNlLnBvc2l0aW9uLCAzKVxuXG4gICAgdGhpcy5ib3VuZHMgPSB0aGlzLmdldEJvdW5kcygpXG4gICAgdGhpcy5zaXplID0gdmVjMi5sZW4odGhpcy5ib3VuZHMuc2l6ZSlcbiAgfVxuXG5cbiAgZ2V0Qm91bmRzKCkge1xuICAgIGxldCBtaW4gPSBbTnVtYmVyLk1BWF9WQUxVRSwgTnVtYmVyLk1BWF9WQUxVRSwgTnVtYmVyLk1BWF9WQUxVRV1cbiAgICBsZXQgbWF4ID0gW051bWJlci5NSU5fVkFMVUUsIE51bWJlci5NSU5fVkFMVUUsIE51bWJlci5NSU5fVkFMVUVdXG4gICAgbGV0IHBvc2l0aW9uID0gdGhpcy5kYXRhLmZhY2UucG9zaXRpb25cbiAgICBsZXQgbiA9IHBvc2l0aW9uLmxlbmd0aFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSArPSAzKSB7XG4gICAgICBsZXQgcCA9IFtwb3NpdGlvbltpXSwgcG9zaXRpb25baSArIDFdLCBwb3NpdGlvbltpICsgMl1dXG4gICAgICB2ZWMzLm1pbihtaW4sIG1pbiwgcClcbiAgICAgIHZlYzMubWF4KG1heCwgbWF4LCBwKVxuICAgIH1cbiAgICByZXR1cm4ge21pbiwgbWF4LCBzaXplOiB2ZWMzLnN1YihbXSwgbWF4LCBtaW4pLCBjZW50ZXI6IHZlYzMubGVycChbXSwgbWluLCBtYXgsIDAuNSl9XG4gIH1cblxuXG4gIGdldEZlYXR1cmVWZXJ0ZXgoaW5kZXgpIHtcbiAgICBsZXQgaSA9IHRoaXMuZGF0YS5mYWNlLmZlYXR1cmVQb2ludFtpbmRleF0gKiAzXG4gICAgbGV0IHAgPSB0aGlzLmRhdGEuZmFjZS5wb3NpdGlvblxuICAgIHJldHVybiBbcFtpXSwgcFtpICsgMV0sIHBbaSArIDJdXVxuICB9XG5cblxuICBnZXRWZXJ0ZXgoaW5kZXgpIHtcbiAgICBsZXQgaSA9IGluZGV4ICogM1xuICAgIGxldCBwID0gdGhpcy5kYXRhLmZhY2UucG9zaXRpb25cbiAgICByZXR1cm4gW3BbaV0sIHBbaSArIDFdLCBwW2kgKyAyXV1cbiAgfVxuIFxufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcGMvc3RhbmRhcmQtZmFjZS1kYXRhLmpzXG4gKiovIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IGdsLW1hdHJpeCAtIEhpZ2ggcGVyZm9ybWFuY2UgbWF0cml4IGFuZCB2ZWN0b3Igb3BlcmF0aW9uc1xuICogQGF1dGhvciBCcmFuZG9uIEpvbmVzXG4gKiBAYXV0aG9yIENvbGluIE1hY0tlbnppZSBJVlxuICogQHZlcnNpb24gMi4zLjBcbiAqL1xuXG4vKiBDb3B5cmlnaHQgKGMpIDIwMTUsIEJyYW5kb24gSm9uZXMsIENvbGluIE1hY0tlbnppZSBJVi5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLiAqL1xuLy8gRU5EIEhFQURFUlxuXG5leHBvcnRzLmdsTWF0cml4ID0gcmVxdWlyZShcIi4vZ2wtbWF0cml4L2NvbW1vbi5qc1wiKTtcbmV4cG9ydHMubWF0MiA9IHJlcXVpcmUoXCIuL2dsLW1hdHJpeC9tYXQyLmpzXCIpO1xuZXhwb3J0cy5tYXQyZCA9IHJlcXVpcmUoXCIuL2dsLW1hdHJpeC9tYXQyZC5qc1wiKTtcbmV4cG9ydHMubWF0MyA9IHJlcXVpcmUoXCIuL2dsLW1hdHJpeC9tYXQzLmpzXCIpO1xuZXhwb3J0cy5tYXQ0ID0gcmVxdWlyZShcIi4vZ2wtbWF0cml4L21hdDQuanNcIik7XG5leHBvcnRzLnF1YXQgPSByZXF1aXJlKFwiLi9nbC1tYXRyaXgvcXVhdC5qc1wiKTtcbmV4cG9ydHMudmVjMiA9IHJlcXVpcmUoXCIuL2dsLW1hdHJpeC92ZWMyLmpzXCIpO1xuZXhwb3J0cy52ZWMzID0gcmVxdWlyZShcIi4vZ2wtbWF0cml4L3ZlYzMuanNcIik7XG5leHBvcnRzLnZlYzQgPSByZXF1aXJlKFwiLi9nbC1tYXRyaXgvdmVjNC5qc1wiKTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC5qc1xuICoqIG1vZHVsZSBpZCA9IDRcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qIENvcHlyaWdodCAoYykgMjAxNSwgQnJhbmRvbiBKb25lcywgQ29saW4gTWFjS2VuemllIElWLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuICovXG5cbi8qKlxuICogQGNsYXNzIENvbW1vbiB1dGlsaXRpZXNcbiAqIEBuYW1lIGdsTWF0cml4XG4gKi9cbnZhciBnbE1hdHJpeCA9IHt9O1xuXG4vLyBDb25zdGFudHNcbmdsTWF0cml4LkVQU0lMT04gPSAwLjAwMDAwMTtcbmdsTWF0cml4LkFSUkFZX1RZUEUgPSAodHlwZW9mIEZsb2F0MzJBcnJheSAhPT0gJ3VuZGVmaW5lZCcpID8gRmxvYXQzMkFycmF5IDogQXJyYXk7XG5nbE1hdHJpeC5SQU5ET00gPSBNYXRoLnJhbmRvbTtcblxuLyoqXG4gKiBTZXRzIHRoZSB0eXBlIG9mIGFycmF5IHVzZWQgd2hlbiBjcmVhdGluZyBuZXcgdmVjdG9ycyBhbmQgbWF0cmljZXNcbiAqXG4gKiBAcGFyYW0ge1R5cGV9IHR5cGUgQXJyYXkgdHlwZSwgc3VjaCBhcyBGbG9hdDMyQXJyYXkgb3IgQXJyYXlcbiAqL1xuZ2xNYXRyaXguc2V0TWF0cml4QXJyYXlUeXBlID0gZnVuY3Rpb24odHlwZSkge1xuICAgIEdMTUFUX0FSUkFZX1RZUEUgPSB0eXBlO1xufVxuXG52YXIgZGVncmVlID0gTWF0aC5QSSAvIDE4MDtcblxuLyoqXG4qIENvbnZlcnQgRGVncmVlIFRvIFJhZGlhblxuKlxuKiBAcGFyYW0ge051bWJlcn0gQW5nbGUgaW4gRGVncmVlc1xuKi9cbmdsTWF0cml4LnRvUmFkaWFuID0gZnVuY3Rpb24oYSl7XG4gICAgIHJldHVybiBhICogZGVncmVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdsTWF0cml4O1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvY29tbW9uLmpzXG4gKiogbW9kdWxlIGlkID0gNVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyogQ29weXJpZ2h0IChjKSAyMDE1LCBCcmFuZG9uIEpvbmVzLCBDb2xpbiBNYWNLZW56aWUgSVYuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS4gKi9cblxudmFyIGdsTWF0cml4ID0gcmVxdWlyZShcIi4vY29tbW9uLmpzXCIpO1xuXG4vKipcbiAqIEBjbGFzcyAyeDIgTWF0cml4XG4gKiBAbmFtZSBtYXQyXG4gKi9cbnZhciBtYXQyID0ge307XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpZGVudGl0eSBtYXQyXG4gKlxuICogQHJldHVybnMge21hdDJ9IGEgbmV3IDJ4MiBtYXRyaXhcbiAqL1xubWF0Mi5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoNCk7XG4gICAgb3V0WzBdID0gMTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IG1hdDIgaW5pdGlhbGl6ZWQgd2l0aCB2YWx1ZXMgZnJvbSBhbiBleGlzdGluZyBtYXRyaXhcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IGEgbWF0cml4IHRvIGNsb25lXG4gKiBAcmV0dXJucyB7bWF0Mn0gYSBuZXcgMngyIG1hdHJpeFxuICovXG5tYXQyLmNsb25lID0gZnVuY3Rpb24oYSkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSg0KTtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSBtYXQyIHRvIGFub3RoZXJcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIuY29weSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2V0IGEgbWF0MiB0byB0aGUgaWRlbnRpdHkgbWF0cml4XG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQyfSBvdXRcbiAqL1xubWF0Mi5pZGVudGl0eSA9IGZ1bmN0aW9uKG91dCkge1xuICAgIG91dFswXSA9IDE7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNwb3NlIHRoZSB2YWx1ZXMgb2YgYSBtYXQyXG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDJ9IG91dFxuICovXG5tYXQyLnRyYW5zcG9zZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIC8vIElmIHdlIGFyZSB0cmFuc3Bvc2luZyBvdXJzZWx2ZXMgd2UgY2FuIHNraXAgYSBmZXcgc3RlcHMgYnV0IGhhdmUgdG8gY2FjaGUgc29tZSB2YWx1ZXNcbiAgICBpZiAob3V0ID09PSBhKSB7XG4gICAgICAgIHZhciBhMSA9IGFbMV07XG4gICAgICAgIG91dFsxXSA9IGFbMl07XG4gICAgICAgIG91dFsyXSA9IGExO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG91dFswXSA9IGFbMF07XG4gICAgICAgIG91dFsxXSA9IGFbMl07XG4gICAgICAgIG91dFsyXSA9IGFbMV07XG4gICAgICAgIG91dFszXSA9IGFbM107XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEludmVydHMgYSBtYXQyXG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDJ9IG91dFxuICovXG5tYXQyLmludmVydCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXSwgYTIgPSBhWzJdLCBhMyA9IGFbM10sXG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudFxuICAgICAgICBkZXQgPSBhMCAqIGEzIC0gYTIgKiBhMTtcblxuICAgIGlmICghZGV0KSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBkZXQgPSAxLjAgLyBkZXQ7XG4gICAgXG4gICAgb3V0WzBdID0gIGEzICogZGV0O1xuICAgIG91dFsxXSA9IC1hMSAqIGRldDtcbiAgICBvdXRbMl0gPSAtYTIgKiBkZXQ7XG4gICAgb3V0WzNdID0gIGEwICogZGV0O1xuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgYWRqdWdhdGUgb2YgYSBtYXQyXG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDJ9IG91dFxuICovXG5tYXQyLmFkam9pbnQgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICAvLyBDYWNoaW5nIHRoaXMgdmFsdWUgaXMgbmVzc2VjYXJ5IGlmIG91dCA9PSBhXG4gICAgdmFyIGEwID0gYVswXTtcbiAgICBvdXRbMF0gPSAgYVszXTtcbiAgICBvdXRbMV0gPSAtYVsxXTtcbiAgICBvdXRbMl0gPSAtYVsyXTtcbiAgICBvdXRbM10gPSAgYTA7XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBkZXRlcm1pbmFudCBvZiBhIG1hdDJcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRldGVybWluYW50IG9mIGFcbiAqL1xubWF0Mi5kZXRlcm1pbmFudCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuIGFbMF0gKiBhWzNdIC0gYVsyXSAqIGFbMV07XG59O1xuXG4vKipcbiAqIE11bHRpcGxpZXMgdHdvIG1hdDInc1xuICpcbiAqIEBwYXJhbSB7bWF0Mn0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7bWF0Mn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHttYXQyfSBvdXRcbiAqL1xubWF0Mi5tdWx0aXBseSA9IGZ1bmN0aW9uIChvdXQsIGEsIGIpIHtcbiAgICB2YXIgYTAgPSBhWzBdLCBhMSA9IGFbMV0sIGEyID0gYVsyXSwgYTMgPSBhWzNdO1xuICAgIHZhciBiMCA9IGJbMF0sIGIxID0gYlsxXSwgYjIgPSBiWzJdLCBiMyA9IGJbM107XG4gICAgb3V0WzBdID0gYTAgKiBiMCArIGEyICogYjE7XG4gICAgb3V0WzFdID0gYTEgKiBiMCArIGEzICogYjE7XG4gICAgb3V0WzJdID0gYTAgKiBiMiArIGEyICogYjM7XG4gICAgb3V0WzNdID0gYTEgKiBiMiArIGEzICogYjM7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayBtYXQyLm11bHRpcGx5fVxuICogQGZ1bmN0aW9uXG4gKi9cbm1hdDIubXVsID0gbWF0Mi5tdWx0aXBseTtcblxuLyoqXG4gKiBSb3RhdGVzIGEgbWF0MiBieSB0aGUgZ2l2ZW4gYW5nbGVcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyfSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDJ9IG91dFxuICovXG5tYXQyLnJvdGF0ZSA9IGZ1bmN0aW9uIChvdXQsIGEsIHJhZCkge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXSwgYTIgPSBhWzJdLCBhMyA9IGFbM10sXG4gICAgICAgIHMgPSBNYXRoLnNpbihyYWQpLFxuICAgICAgICBjID0gTWF0aC5jb3MocmFkKTtcbiAgICBvdXRbMF0gPSBhMCAqICBjICsgYTIgKiBzO1xuICAgIG91dFsxXSA9IGExICogIGMgKyBhMyAqIHM7XG4gICAgb3V0WzJdID0gYTAgKiAtcyArIGEyICogYztcbiAgICBvdXRbM10gPSBhMSAqIC1zICsgYTMgKiBjO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlcyB0aGUgbWF0MiBieSB0aGUgZGltZW5zaW9ucyBpbiB0aGUgZ2l2ZW4gdmVjMlxuICpcbiAqIEBwYXJhbSB7bWF0Mn0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJ9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcbiAqIEBwYXJhbSB7dmVjMn0gdiB0aGUgdmVjMiB0byBzY2FsZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKiovXG5tYXQyLnNjYWxlID0gZnVuY3Rpb24ob3V0LCBhLCB2KSB7XG4gICAgdmFyIGEwID0gYVswXSwgYTEgPSBhWzFdLCBhMiA9IGFbMl0sIGEzID0gYVszXSxcbiAgICAgICAgdjAgPSB2WzBdLCB2MSA9IHZbMV07XG4gICAgb3V0WzBdID0gYTAgKiB2MDtcbiAgICBvdXRbMV0gPSBhMSAqIHYwO1xuICAgIG91dFsyXSA9IGEyICogdjE7XG4gICAgb3V0WzNdID0gYTMgKiB2MTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSBnaXZlbiBhbmdsZVxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDIuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0Mi5yb3RhdGUoZGVzdCwgZGVzdCwgcmFkKTtcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG91dCBtYXQyIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDJ9IG91dFxuICovXG5tYXQyLmZyb21Sb3RhdGlvbiA9IGZ1bmN0aW9uKG91dCwgcmFkKSB7XG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpLFxuICAgICAgICBjID0gTWF0aC5jb3MocmFkKTtcbiAgICBvdXRbMF0gPSBjO1xuICAgIG91dFsxXSA9IHM7XG4gICAgb3V0WzJdID0gLXM7XG4gICAgb3V0WzNdID0gYztcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHZlY3RvciBzY2FsaW5nXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0Mi5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQyLnNjYWxlKGRlc3QsIGRlc3QsIHZlYyk7XG4gKlxuICogQHBhcmFtIHttYXQyfSBvdXQgbWF0MiByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHt2ZWMyfSB2IFNjYWxpbmcgdmVjdG9yXG4gKiBAcmV0dXJucyB7bWF0Mn0gb3V0XG4gKi9cbm1hdDIuZnJvbVNjYWxpbmcgPSBmdW5jdGlvbihvdXQsIHYpIHtcbiAgICBvdXRbMF0gPSB2WzBdO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSB2WzFdO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIG1hdDJcbiAqXG4gKiBAcGFyYW0ge21hdDJ9IG1hdCBtYXRyaXggdG8gcmVwcmVzZW50IGFzIGEgc3RyaW5nXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hdHJpeFxuICovXG5tYXQyLnN0ciA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuICdtYXQyKCcgKyBhWzBdICsgJywgJyArIGFbMV0gKyAnLCAnICsgYVsyXSArICcsICcgKyBhWzNdICsgJyknO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIEZyb2Jlbml1cyBub3JtIG9mIGEgbWF0MlxuICpcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgbWF0cml4IHRvIGNhbGN1bGF0ZSBGcm9iZW5pdXMgbm9ybSBvZlxuICogQHJldHVybnMge051bWJlcn0gRnJvYmVuaXVzIG5vcm1cbiAqL1xubWF0Mi5mcm9iID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4oTWF0aC5zcXJ0KE1hdGgucG93KGFbMF0sIDIpICsgTWF0aC5wb3coYVsxXSwgMikgKyBNYXRoLnBvdyhhWzJdLCAyKSArIE1hdGgucG93KGFbM10sIDIpKSlcbn07XG5cbi8qKlxuICogUmV0dXJucyBMLCBEIGFuZCBVIG1hdHJpY2VzIChMb3dlciB0cmlhbmd1bGFyLCBEaWFnb25hbCBhbmQgVXBwZXIgdHJpYW5ndWxhcikgYnkgZmFjdG9yaXppbmcgdGhlIGlucHV0IG1hdHJpeFxuICogQHBhcmFtIHttYXQyfSBMIHRoZSBsb3dlciB0cmlhbmd1bGFyIG1hdHJpeCBcbiAqIEBwYXJhbSB7bWF0Mn0gRCB0aGUgZGlhZ29uYWwgbWF0cml4IFxuICogQHBhcmFtIHttYXQyfSBVIHRoZSB1cHBlciB0cmlhbmd1bGFyIG1hdHJpeCBcbiAqIEBwYXJhbSB7bWF0Mn0gYSB0aGUgaW5wdXQgbWF0cml4IHRvIGZhY3Rvcml6ZVxuICovXG5cbm1hdDIuTERVID0gZnVuY3Rpb24gKEwsIEQsIFUsIGEpIHsgXG4gICAgTFsyXSA9IGFbMl0vYVswXTsgXG4gICAgVVswXSA9IGFbMF07IFxuICAgIFVbMV0gPSBhWzFdOyBcbiAgICBVWzNdID0gYVszXSAtIExbMl0gKiBVWzFdOyBcbiAgICByZXR1cm4gW0wsIEQsIFVdOyAgICAgICBcbn07IFxuXG5cbm1vZHVsZS5leHBvcnRzID0gbWF0MjtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L21hdDIuanNcbiAqKiBtb2R1bGUgaWQgPSA2XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiBDb3B5cmlnaHQgKGMpIDIwMTUsIEJyYW5kb24gSm9uZXMsIENvbGluIE1hY0tlbnppZSBJVi5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLiAqL1xuXG52YXIgZ2xNYXRyaXggPSByZXF1aXJlKFwiLi9jb21tb24uanNcIik7XG5cbi8qKlxuICogQGNsYXNzIDJ4MyBNYXRyaXhcbiAqIEBuYW1lIG1hdDJkXG4gKiBcbiAqIEBkZXNjcmlwdGlvbiBcbiAqIEEgbWF0MmQgY29udGFpbnMgc2l4IGVsZW1lbnRzIGRlZmluZWQgYXM6XG4gKiA8cHJlPlxuICogW2EsIGMsIHR4LFxuICogIGIsIGQsIHR5XVxuICogPC9wcmU+XG4gKiBUaGlzIGlzIGEgc2hvcnQgZm9ybSBmb3IgdGhlIDN4MyBtYXRyaXg6XG4gKiA8cHJlPlxuICogW2EsIGMsIHR4LFxuICogIGIsIGQsIHR5LFxuICogIDAsIDAsIDFdXG4gKiA8L3ByZT5cbiAqIFRoZSBsYXN0IHJvdyBpcyBpZ25vcmVkIHNvIHRoZSBhcnJheSBpcyBzaG9ydGVyIGFuZCBvcGVyYXRpb25zIGFyZSBmYXN0ZXIuXG4gKi9cbnZhciBtYXQyZCA9IHt9O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaWRlbnRpdHkgbWF0MmRcbiAqXG4gKiBAcmV0dXJucyB7bWF0MmR9IGEgbmV3IDJ4MyBtYXRyaXhcbiAqL1xubWF0MmQuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDYpO1xuICAgIG91dFswXSA9IDE7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDE7XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSAwO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgbWF0MmQgaW5pdGlhbGl6ZWQgd2l0aCB2YWx1ZXMgZnJvbSBhbiBleGlzdGluZyBtYXRyaXhcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBhIG1hdHJpeCB0byBjbG9uZVxuICogQHJldHVybnMge21hdDJkfSBhIG5ldyAyeDMgbWF0cml4XG4gKi9cbm1hdDJkLmNsb25lID0gZnVuY3Rpb24oYSkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSg2KTtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIG91dFs0XSA9IGFbNF07XG4gICAgb3V0WzVdID0gYVs1XTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDb3B5IHRoZSB2YWx1ZXMgZnJvbSBvbmUgbWF0MmQgdG8gYW5vdGhlclxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDJkfSBvdXRcbiAqL1xubWF0MmQuY29weSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgb3V0WzRdID0gYVs0XTtcbiAgICBvdXRbNV0gPSBhWzVdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNldCBhIG1hdDJkIHRvIHRoZSBpZGVudGl0eSBtYXRyaXhcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQyZH0gb3V0XG4gKi9cbm1hdDJkLmlkZW50aXR5ID0gZnVuY3Rpb24ob3V0KSB7XG4gICAgb3V0WzBdID0gMTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMTtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IDA7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogSW52ZXJ0cyBhIG1hdDJkXG4gKlxuICogQHBhcmFtIHttYXQyZH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJkfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0MmR9IG91dFxuICovXG5tYXQyZC5pbnZlcnQgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICB2YXIgYWEgPSBhWzBdLCBhYiA9IGFbMV0sIGFjID0gYVsyXSwgYWQgPSBhWzNdLFxuICAgICAgICBhdHggPSBhWzRdLCBhdHkgPSBhWzVdO1xuXG4gICAgdmFyIGRldCA9IGFhICogYWQgLSBhYiAqIGFjO1xuICAgIGlmKCFkZXQpe1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZGV0ID0gMS4wIC8gZGV0O1xuXG4gICAgb3V0WzBdID0gYWQgKiBkZXQ7XG4gICAgb3V0WzFdID0gLWFiICogZGV0O1xuICAgIG91dFsyXSA9IC1hYyAqIGRldDtcbiAgICBvdXRbM10gPSBhYSAqIGRldDtcbiAgICBvdXRbNF0gPSAoYWMgKiBhdHkgLSBhZCAqIGF0eCkgKiBkZXQ7XG4gICAgb3V0WzVdID0gKGFiICogYXR4IC0gYWEgKiBhdHkpICogZGV0O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGRldGVybWluYW50IG9mIGEgbWF0MmRcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkZXRlcm1pbmFudCBvZiBhXG4gKi9cbm1hdDJkLmRldGVybWluYW50ID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gYVswXSAqIGFbM10gLSBhWzFdICogYVsyXTtcbn07XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gbWF0MmQnc1xuICpcbiAqIEBwYXJhbSB7bWF0MmR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHttYXQyZH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHttYXQyZH0gb3V0XG4gKi9cbm1hdDJkLm11bHRpcGx5ID0gZnVuY3Rpb24gKG91dCwgYSwgYikge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXSwgYTIgPSBhWzJdLCBhMyA9IGFbM10sIGE0ID0gYVs0XSwgYTUgPSBhWzVdLFxuICAgICAgICBiMCA9IGJbMF0sIGIxID0gYlsxXSwgYjIgPSBiWzJdLCBiMyA9IGJbM10sIGI0ID0gYls0XSwgYjUgPSBiWzVdO1xuICAgIG91dFswXSA9IGEwICogYjAgKyBhMiAqIGIxO1xuICAgIG91dFsxXSA9IGExICogYjAgKyBhMyAqIGIxO1xuICAgIG91dFsyXSA9IGEwICogYjIgKyBhMiAqIGIzO1xuICAgIG91dFszXSA9IGExICogYjIgKyBhMyAqIGIzO1xuICAgIG91dFs0XSA9IGEwICogYjQgKyBhMiAqIGI1ICsgYTQ7XG4gICAgb3V0WzVdID0gYTEgKiBiNCArIGEzICogYjUgKyBhNTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIG1hdDJkLm11bHRpcGx5fVxuICogQGZ1bmN0aW9uXG4gKi9cbm1hdDJkLm11bCA9IG1hdDJkLm11bHRpcGx5O1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBtYXQyZCBieSB0aGUgZ2l2ZW4gYW5nbGVcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0MmR9IG91dFxuICovXG5tYXQyZC5yb3RhdGUgPSBmdW5jdGlvbiAob3V0LCBhLCByYWQpIHtcbiAgICB2YXIgYTAgPSBhWzBdLCBhMSA9IGFbMV0sIGEyID0gYVsyXSwgYTMgPSBhWzNdLCBhNCA9IGFbNF0sIGE1ID0gYVs1XSxcbiAgICAgICAgcyA9IE1hdGguc2luKHJhZCksXG4gICAgICAgIGMgPSBNYXRoLmNvcyhyYWQpO1xuICAgIG91dFswXSA9IGEwICogIGMgKyBhMiAqIHM7XG4gICAgb3V0WzFdID0gYTEgKiAgYyArIGEzICogcztcbiAgICBvdXRbMl0gPSBhMCAqIC1zICsgYTIgKiBjO1xuICAgIG91dFszXSA9IGExICogLXMgKyBhMyAqIGM7XG4gICAgb3V0WzRdID0gYTQ7XG4gICAgb3V0WzVdID0gYTU7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2NhbGVzIHRoZSBtYXQyZCBieSB0aGUgZGltZW5zaW9ucyBpbiB0aGUgZ2l2ZW4gdmVjMlxuICpcbiAqIEBwYXJhbSB7bWF0MmR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgbWF0cml4IHRvIHRyYW5zbGF0ZVxuICogQHBhcmFtIHt2ZWMyfSB2IHRoZSB2ZWMyIHRvIHNjYWxlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQyZH0gb3V0XG4gKiovXG5tYXQyZC5zY2FsZSA9IGZ1bmN0aW9uKG91dCwgYSwgdikge1xuICAgIHZhciBhMCA9IGFbMF0sIGExID0gYVsxXSwgYTIgPSBhWzJdLCBhMyA9IGFbM10sIGE0ID0gYVs0XSwgYTUgPSBhWzVdLFxuICAgICAgICB2MCA9IHZbMF0sIHYxID0gdlsxXTtcbiAgICBvdXRbMF0gPSBhMCAqIHYwO1xuICAgIG91dFsxXSA9IGExICogdjA7XG4gICAgb3V0WzJdID0gYTIgKiB2MTtcbiAgICBvdXRbM10gPSBhMyAqIHYxO1xuICAgIG91dFs0XSA9IGE0O1xuICAgIG91dFs1XSA9IGE1O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zbGF0ZXMgdGhlIG1hdDJkIGJ5IHRoZSBkaW1lbnNpb25zIGluIHRoZSBnaXZlbiB2ZWMyXG4gKlxuICogQHBhcmFtIHttYXQyZH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDJkfSBhIHRoZSBtYXRyaXggdG8gdHJhbnNsYXRlXG4gKiBAcGFyYW0ge3ZlYzJ9IHYgdGhlIHZlYzIgdG8gdHJhbnNsYXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQyZH0gb3V0XG4gKiovXG5tYXQyZC50cmFuc2xhdGUgPSBmdW5jdGlvbihvdXQsIGEsIHYpIHtcbiAgICB2YXIgYTAgPSBhWzBdLCBhMSA9IGFbMV0sIGEyID0gYVsyXSwgYTMgPSBhWzNdLCBhNCA9IGFbNF0sIGE1ID0gYVs1XSxcbiAgICAgICAgdjAgPSB2WzBdLCB2MSA9IHZbMV07XG4gICAgb3V0WzBdID0gYTA7XG4gICAgb3V0WzFdID0gYTE7XG4gICAgb3V0WzJdID0gYTI7XG4gICAgb3V0WzNdID0gYTM7XG4gICAgb3V0WzRdID0gYTAgKiB2MCArIGEyICogdjEgKyBhNDtcbiAgICBvdXRbNV0gPSBhMSAqIHYwICsgYTMgKiB2MSArIGE1O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIGdpdmVuIGFuZ2xlXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0MmQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0MmQucm90YXRlKGRlc3QsIGRlc3QsIHJhZCk7XG4gKlxuICogQHBhcmFtIHttYXQyZH0gb3V0IG1hdDJkIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDJkfSBvdXRcbiAqL1xubWF0MmQuZnJvbVJvdGF0aW9uID0gZnVuY3Rpb24ob3V0LCByYWQpIHtcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCksIGMgPSBNYXRoLmNvcyhyYWQpO1xuICAgIG91dFswXSA9IGM7XG4gICAgb3V0WzFdID0gcztcbiAgICBvdXRbMl0gPSAtcztcbiAgICBvdXRbM10gPSBjO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gMDtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHZlY3RvciBzY2FsaW5nXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0MmQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0MmQuc2NhbGUoZGVzdCwgZGVzdCwgdmVjKTtcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBvdXQgbWF0MmQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7dmVjMn0gdiBTY2FsaW5nIHZlY3RvclxuICogQHJldHVybnMge21hdDJkfSBvdXRcbiAqL1xubWF0MmQuZnJvbVNjYWxpbmcgPSBmdW5jdGlvbihvdXQsIHYpIHtcbiAgICBvdXRbMF0gPSB2WzBdO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSB2WzFdO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gMDtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHZlY3RvciB0cmFuc2xhdGlvblxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDJkLmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDJkLnRyYW5zbGF0ZShkZXN0LCBkZXN0LCB2ZWMpO1xuICpcbiAqIEBwYXJhbSB7bWF0MmR9IG91dCBtYXQyZCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHt2ZWMyfSB2IFRyYW5zbGF0aW9uIHZlY3RvclxuICogQHJldHVybnMge21hdDJkfSBvdXRcbiAqL1xubWF0MmQuZnJvbVRyYW5zbGF0aW9uID0gZnVuY3Rpb24ob3V0LCB2KSB7XG4gICAgb3V0WzBdID0gMTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMTtcbiAgICBvdXRbNF0gPSB2WzBdO1xuICAgIG91dFs1XSA9IHZbMV07XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgbWF0MmRcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBhIG1hdHJpeCB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4XG4gKi9cbm1hdDJkLnN0ciA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuICdtYXQyZCgnICsgYVswXSArICcsICcgKyBhWzFdICsgJywgJyArIGFbMl0gKyAnLCAnICsgXG4gICAgICAgICAgICAgICAgICAgIGFbM10gKyAnLCAnICsgYVs0XSArICcsICcgKyBhWzVdICsgJyknO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIEZyb2Jlbml1cyBub3JtIG9mIGEgbWF0MmRcbiAqXG4gKiBAcGFyYW0ge21hdDJkfSBhIHRoZSBtYXRyaXggdG8gY2FsY3VsYXRlIEZyb2Jlbml1cyBub3JtIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBGcm9iZW5pdXMgbm9ybVxuICovXG5tYXQyZC5mcm9iID0gZnVuY3Rpb24gKGEpIHsgXG4gICAgcmV0dXJuKE1hdGguc3FydChNYXRoLnBvdyhhWzBdLCAyKSArIE1hdGgucG93KGFbMV0sIDIpICsgTWF0aC5wb3coYVsyXSwgMikgKyBNYXRoLnBvdyhhWzNdLCAyKSArIE1hdGgucG93KGFbNF0sIDIpICsgTWF0aC5wb3coYVs1XSwgMikgKyAxKSlcbn07IFxuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdDJkO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvbWF0MmQuanNcbiAqKiBtb2R1bGUgaWQgPSA3XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiBDb3B5cmlnaHQgKGMpIDIwMTUsIEJyYW5kb24gSm9uZXMsIENvbGluIE1hY0tlbnppZSBJVi5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLiAqL1xuXG52YXIgZ2xNYXRyaXggPSByZXF1aXJlKFwiLi9jb21tb24uanNcIik7XG5cbi8qKlxuICogQGNsYXNzIDN4MyBNYXRyaXhcbiAqIEBuYW1lIG1hdDNcbiAqL1xudmFyIG1hdDMgPSB7fTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGlkZW50aXR5IG1hdDNcbiAqXG4gKiBAcmV0dXJucyB7bWF0M30gYSBuZXcgM3gzIG1hdHJpeFxuICovXG5tYXQzLmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSg5KTtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDE7XG4gICAgb3V0WzVdID0gMDtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDb3BpZXMgdGhlIHVwcGVyLWxlZnQgM3gzIHZhbHVlcyBpbnRvIHRoZSBnaXZlbiBtYXQzLlxuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgM3gzIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhICAgdGhlIHNvdXJjZSA0eDQgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMuZnJvbU1hdDQgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICBvdXRbM10gPSBhWzRdO1xuICAgIG91dFs0XSA9IGFbNV07XG4gICAgb3V0WzVdID0gYVs2XTtcbiAgICBvdXRbNl0gPSBhWzhdO1xuICAgIG91dFs3XSA9IGFbOV07XG4gICAgb3V0WzhdID0gYVsxMF07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBtYXQzIGluaXRpYWxpemVkIHdpdGggdmFsdWVzIGZyb20gYW4gZXhpc3RpbmcgbWF0cml4XG4gKlxuICogQHBhcmFtIHttYXQzfSBhIG1hdHJpeCB0byBjbG9uZVxuICogQHJldHVybnMge21hdDN9IGEgbmV3IDN4MyBtYXRyaXhcbiAqL1xubWF0My5jbG9uZSA9IGZ1bmN0aW9uKGEpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoOSk7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICBvdXRbNF0gPSBhWzRdO1xuICAgIG91dFs1XSA9IGFbNV07XG4gICAgb3V0WzZdID0gYVs2XTtcbiAgICBvdXRbN10gPSBhWzddO1xuICAgIG91dFs4XSA9IGFbOF07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ29weSB0aGUgdmFsdWVzIGZyb20gb25lIG1hdDMgdG8gYW5vdGhlclxuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My5jb3B5ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICBvdXRbNF0gPSBhWzRdO1xuICAgIG91dFs1XSA9IGFbNV07XG4gICAgb3V0WzZdID0gYVs2XTtcbiAgICBvdXRbN10gPSBhWzddO1xuICAgIG91dFs4XSA9IGFbOF07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2V0IGEgbWF0MyB0byB0aGUgaWRlbnRpdHkgbWF0cml4XG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My5pZGVudGl0eSA9IGZ1bmN0aW9uKG91dCkge1xuICAgIG91dFswXSA9IDE7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0gMTtcbiAgICBvdXRbNV0gPSAwO1xuICAgIG91dFs2XSA9IDA7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zcG9zZSB0aGUgdmFsdWVzIG9mIGEgbWF0M1xuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My50cmFuc3Bvc2UgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICAvLyBJZiB3ZSBhcmUgdHJhbnNwb3Npbmcgb3Vyc2VsdmVzIHdlIGNhbiBza2lwIGEgZmV3IHN0ZXBzIGJ1dCBoYXZlIHRvIGNhY2hlIHNvbWUgdmFsdWVzXG4gICAgaWYgKG91dCA9PT0gYSkge1xuICAgICAgICB2YXIgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTEyID0gYVs1XTtcbiAgICAgICAgb3V0WzFdID0gYVszXTtcbiAgICAgICAgb3V0WzJdID0gYVs2XTtcbiAgICAgICAgb3V0WzNdID0gYTAxO1xuICAgICAgICBvdXRbNV0gPSBhWzddO1xuICAgICAgICBvdXRbNl0gPSBhMDI7XG4gICAgICAgIG91dFs3XSA9IGExMjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBvdXRbMF0gPSBhWzBdO1xuICAgICAgICBvdXRbMV0gPSBhWzNdO1xuICAgICAgICBvdXRbMl0gPSBhWzZdO1xuICAgICAgICBvdXRbM10gPSBhWzFdO1xuICAgICAgICBvdXRbNF0gPSBhWzRdO1xuICAgICAgICBvdXRbNV0gPSBhWzddO1xuICAgICAgICBvdXRbNl0gPSBhWzJdO1xuICAgICAgICBvdXRbN10gPSBhWzVdO1xuICAgICAgICBvdXRbOF0gPSBhWzhdO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBJbnZlcnRzIGEgbWF0M1xuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My5pbnZlcnQgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSxcbiAgICAgICAgYTEwID0gYVszXSwgYTExID0gYVs0XSwgYTEyID0gYVs1XSxcbiAgICAgICAgYTIwID0gYVs2XSwgYTIxID0gYVs3XSwgYTIyID0gYVs4XSxcblxuICAgICAgICBiMDEgPSBhMjIgKiBhMTEgLSBhMTIgKiBhMjEsXG4gICAgICAgIGIxMSA9IC1hMjIgKiBhMTAgKyBhMTIgKiBhMjAsXG4gICAgICAgIGIyMSA9IGEyMSAqIGExMCAtIGExMSAqIGEyMCxcblxuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGRldGVybWluYW50XG4gICAgICAgIGRldCA9IGEwMCAqIGIwMSArIGEwMSAqIGIxMSArIGEwMiAqIGIyMTtcblxuICAgIGlmICghZGV0KSB7IFxuICAgICAgICByZXR1cm4gbnVsbDsgXG4gICAgfVxuICAgIGRldCA9IDEuMCAvIGRldDtcblxuICAgIG91dFswXSA9IGIwMSAqIGRldDtcbiAgICBvdXRbMV0gPSAoLWEyMiAqIGEwMSArIGEwMiAqIGEyMSkgKiBkZXQ7XG4gICAgb3V0WzJdID0gKGExMiAqIGEwMSAtIGEwMiAqIGExMSkgKiBkZXQ7XG4gICAgb3V0WzNdID0gYjExICogZGV0O1xuICAgIG91dFs0XSA9IChhMjIgKiBhMDAgLSBhMDIgKiBhMjApICogZGV0O1xuICAgIG91dFs1XSA9ICgtYTEyICogYTAwICsgYTAyICogYTEwKSAqIGRldDtcbiAgICBvdXRbNl0gPSBiMjEgKiBkZXQ7XG4gICAgb3V0WzddID0gKC1hMjEgKiBhMDAgKyBhMDEgKiBhMjApICogZGV0O1xuICAgIG91dFs4XSA9IChhMTEgKiBhMDAgLSBhMDEgKiBhMTApICogZGV0O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGFkanVnYXRlIG9mIGEgbWF0M1xuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My5hZGpvaW50ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sXG4gICAgICAgIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV0sXG4gICAgICAgIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF07XG5cbiAgICBvdXRbMF0gPSAoYTExICogYTIyIC0gYTEyICogYTIxKTtcbiAgICBvdXRbMV0gPSAoYTAyICogYTIxIC0gYTAxICogYTIyKTtcbiAgICBvdXRbMl0gPSAoYTAxICogYTEyIC0gYTAyICogYTExKTtcbiAgICBvdXRbM10gPSAoYTEyICogYTIwIC0gYTEwICogYTIyKTtcbiAgICBvdXRbNF0gPSAoYTAwICogYTIyIC0gYTAyICogYTIwKTtcbiAgICBvdXRbNV0gPSAoYTAyICogYTEwIC0gYTAwICogYTEyKTtcbiAgICBvdXRbNl0gPSAoYTEwICogYTIxIC0gYTExICogYTIwKTtcbiAgICBvdXRbN10gPSAoYTAxICogYTIwIC0gYTAwICogYTIxKTtcbiAgICBvdXRbOF0gPSAoYTAwICogYTExIC0gYTAxICogYTEwKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBkZXRlcm1pbmFudCBvZiBhIG1hdDNcbiAqXG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRldGVybWluYW50IG9mIGFcbiAqL1xubWF0My5kZXRlcm1pbmFudCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sXG4gICAgICAgIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV0sXG4gICAgICAgIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF07XG5cbiAgICByZXR1cm4gYTAwICogKGEyMiAqIGExMSAtIGExMiAqIGEyMSkgKyBhMDEgKiAoLWEyMiAqIGExMCArIGExMiAqIGEyMCkgKyBhMDIgKiAoYTIxICogYTEwIC0gYTExICogYTIwKTtcbn07XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gbWF0MydzXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHttYXQzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLm11bHRpcGx5ID0gZnVuY3Rpb24gKG91dCwgYSwgYikge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLFxuICAgICAgICBhMTAgPSBhWzNdLCBhMTEgPSBhWzRdLCBhMTIgPSBhWzVdLFxuICAgICAgICBhMjAgPSBhWzZdLCBhMjEgPSBhWzddLCBhMjIgPSBhWzhdLFxuXG4gICAgICAgIGIwMCA9IGJbMF0sIGIwMSA9IGJbMV0sIGIwMiA9IGJbMl0sXG4gICAgICAgIGIxMCA9IGJbM10sIGIxMSA9IGJbNF0sIGIxMiA9IGJbNV0sXG4gICAgICAgIGIyMCA9IGJbNl0sIGIyMSA9IGJbN10sIGIyMiA9IGJbOF07XG5cbiAgICBvdXRbMF0gPSBiMDAgKiBhMDAgKyBiMDEgKiBhMTAgKyBiMDIgKiBhMjA7XG4gICAgb3V0WzFdID0gYjAwICogYTAxICsgYjAxICogYTExICsgYjAyICogYTIxO1xuICAgIG91dFsyXSA9IGIwMCAqIGEwMiArIGIwMSAqIGExMiArIGIwMiAqIGEyMjtcblxuICAgIG91dFszXSA9IGIxMCAqIGEwMCArIGIxMSAqIGExMCArIGIxMiAqIGEyMDtcbiAgICBvdXRbNF0gPSBiMTAgKiBhMDEgKyBiMTEgKiBhMTEgKyBiMTIgKiBhMjE7XG4gICAgb3V0WzVdID0gYjEwICogYTAyICsgYjExICogYTEyICsgYjEyICogYTIyO1xuXG4gICAgb3V0WzZdID0gYjIwICogYTAwICsgYjIxICogYTEwICsgYjIyICogYTIwO1xuICAgIG91dFs3XSA9IGIyMCAqIGEwMSArIGIyMSAqIGExMSArIGIyMiAqIGEyMTtcbiAgICBvdXRbOF0gPSBiMjAgKiBhMDIgKyBiMjEgKiBhMTIgKyBiMjIgKiBhMjI7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayBtYXQzLm11bHRpcGx5fVxuICogQGZ1bmN0aW9uXG4gKi9cbm1hdDMubXVsID0gbWF0My5tdWx0aXBseTtcblxuLyoqXG4gKiBUcmFuc2xhdGUgYSBtYXQzIGJ5IHRoZSBnaXZlbiB2ZWN0b3JcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBtYXRyaXggdG8gdHJhbnNsYXRlXG4gKiBAcGFyYW0ge3ZlYzJ9IHYgdmVjdG9yIHRvIHRyYW5zbGF0ZSBieVxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKG91dCwgYSwgdikge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLFxuICAgICAgICBhMTAgPSBhWzNdLCBhMTEgPSBhWzRdLCBhMTIgPSBhWzVdLFxuICAgICAgICBhMjAgPSBhWzZdLCBhMjEgPSBhWzddLCBhMjIgPSBhWzhdLFxuICAgICAgICB4ID0gdlswXSwgeSA9IHZbMV07XG5cbiAgICBvdXRbMF0gPSBhMDA7XG4gICAgb3V0WzFdID0gYTAxO1xuICAgIG91dFsyXSA9IGEwMjtcblxuICAgIG91dFszXSA9IGExMDtcbiAgICBvdXRbNF0gPSBhMTE7XG4gICAgb3V0WzVdID0gYTEyO1xuXG4gICAgb3V0WzZdID0geCAqIGEwMCArIHkgKiBhMTAgKyBhMjA7XG4gICAgb3V0WzddID0geCAqIGEwMSArIHkgKiBhMTEgKyBhMjE7XG4gICAgb3V0WzhdID0geCAqIGEwMiArIHkgKiBhMTIgKyBhMjI7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUm90YXRlcyBhIG1hdDMgYnkgdGhlIGdpdmVuIGFuZ2xlXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My5yb3RhdGUgPSBmdW5jdGlvbiAob3V0LCBhLCByYWQpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSxcbiAgICAgICAgYTEwID0gYVszXSwgYTExID0gYVs0XSwgYTEyID0gYVs1XSxcbiAgICAgICAgYTIwID0gYVs2XSwgYTIxID0gYVs3XSwgYTIyID0gYVs4XSxcblxuICAgICAgICBzID0gTWF0aC5zaW4ocmFkKSxcbiAgICAgICAgYyA9IE1hdGguY29zKHJhZCk7XG5cbiAgICBvdXRbMF0gPSBjICogYTAwICsgcyAqIGExMDtcbiAgICBvdXRbMV0gPSBjICogYTAxICsgcyAqIGExMTtcbiAgICBvdXRbMl0gPSBjICogYTAyICsgcyAqIGExMjtcblxuICAgIG91dFszXSA9IGMgKiBhMTAgLSBzICogYTAwO1xuICAgIG91dFs0XSA9IGMgKiBhMTEgLSBzICogYTAxO1xuICAgIG91dFs1XSA9IGMgKiBhMTIgLSBzICogYTAyO1xuXG4gICAgb3V0WzZdID0gYTIwO1xuICAgIG91dFs3XSA9IGEyMTtcbiAgICBvdXRbOF0gPSBhMjI7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2NhbGVzIHRoZSBtYXQzIGJ5IHRoZSBkaW1lbnNpb25zIGluIHRoZSBnaXZlbiB2ZWMyXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHt2ZWMyfSB2IHRoZSB2ZWMyIHRvIHNjYWxlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqKi9cbm1hdDMuc2NhbGUgPSBmdW5jdGlvbihvdXQsIGEsIHYpIHtcbiAgICB2YXIgeCA9IHZbMF0sIHkgPSB2WzFdO1xuXG4gICAgb3V0WzBdID0geCAqIGFbMF07XG4gICAgb3V0WzFdID0geCAqIGFbMV07XG4gICAgb3V0WzJdID0geCAqIGFbMl07XG5cbiAgICBvdXRbM10gPSB5ICogYVszXTtcbiAgICBvdXRbNF0gPSB5ICogYVs0XTtcbiAgICBvdXRbNV0gPSB5ICogYVs1XTtcblxuICAgIG91dFs2XSA9IGFbNl07XG4gICAgb3V0WzddID0gYVs3XTtcbiAgICBvdXRbOF0gPSBhWzhdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHZlY3RvciB0cmFuc2xhdGlvblxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDMuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0My50cmFuc2xhdGUoZGVzdCwgZGVzdCwgdmVjKTtcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCBtYXQzIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3ZlYzJ9IHYgVHJhbnNsYXRpb24gdmVjdG9yXG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMuZnJvbVRyYW5zbGF0aW9uID0gZnVuY3Rpb24ob3V0LCB2KSB7XG4gICAgb3V0WzBdID0gMTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAxO1xuICAgIG91dFs1XSA9IDA7XG4gICAgb3V0WzZdID0gdlswXTtcbiAgICBvdXRbN10gPSB2WzFdO1xuICAgIG91dFs4XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSBnaXZlbiBhbmdsZVxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDMuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0My5yb3RhdGUoZGVzdCwgZGVzdCwgcmFkKTtcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCBtYXQzIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLmZyb21Sb3RhdGlvbiA9IGZ1bmN0aW9uKG91dCwgcmFkKSB7XG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpLCBjID0gTWF0aC5jb3MocmFkKTtcblxuICAgIG91dFswXSA9IGM7XG4gICAgb3V0WzFdID0gcztcbiAgICBvdXRbMl0gPSAwO1xuXG4gICAgb3V0WzNdID0gLXM7XG4gICAgb3V0WzRdID0gYztcbiAgICBvdXRbNV0gPSAwO1xuXG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSB2ZWN0b3Igc2NhbGluZ1xuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDMuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0My5zY2FsZShkZXN0LCBkZXN0LCB2ZWMpO1xuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IG1hdDMgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7dmVjMn0gdiBTY2FsaW5nIHZlY3RvclxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLmZyb21TY2FsaW5nID0gZnVuY3Rpb24ob3V0LCB2KSB7XG4gICAgb3V0WzBdID0gdlswXTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG5cbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IHZbMV07XG4gICAgb3V0WzVdID0gMDtcblxuICAgIG91dFs2XSA9IDA7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ29waWVzIHRoZSB2YWx1ZXMgZnJvbSBhIG1hdDJkIGludG8gYSBtYXQzXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0MmR9IGEgdGhlIG1hdHJpeCB0byBjb3B5XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKiovXG5tYXQzLmZyb21NYXQyZCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSAwO1xuXG4gICAgb3V0WzNdID0gYVsyXTtcbiAgICBvdXRbNF0gPSBhWzNdO1xuICAgIG91dFs1XSA9IDA7XG5cbiAgICBvdXRbNl0gPSBhWzRdO1xuICAgIG91dFs3XSA9IGFbNV07XG4gICAgb3V0WzhdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4qIENhbGN1bGF0ZXMgYSAzeDMgbWF0cml4IGZyb20gdGhlIGdpdmVuIHF1YXRlcm5pb25cbipcbiogQHBhcmFtIHttYXQzfSBvdXQgbWF0MyByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuKiBAcGFyYW0ge3F1YXR9IHEgUXVhdGVybmlvbiB0byBjcmVhdGUgbWF0cml4IGZyb21cbipcbiogQHJldHVybnMge21hdDN9IG91dFxuKi9cbm1hdDMuZnJvbVF1YXQgPSBmdW5jdGlvbiAob3V0LCBxKSB7XG4gICAgdmFyIHggPSBxWzBdLCB5ID0gcVsxXSwgeiA9IHFbMl0sIHcgPSBxWzNdLFxuICAgICAgICB4MiA9IHggKyB4LFxuICAgICAgICB5MiA9IHkgKyB5LFxuICAgICAgICB6MiA9IHogKyB6LFxuXG4gICAgICAgIHh4ID0geCAqIHgyLFxuICAgICAgICB5eCA9IHkgKiB4MixcbiAgICAgICAgeXkgPSB5ICogeTIsXG4gICAgICAgIHp4ID0geiAqIHgyLFxuICAgICAgICB6eSA9IHogKiB5MixcbiAgICAgICAgenogPSB6ICogejIsXG4gICAgICAgIHd4ID0gdyAqIHgyLFxuICAgICAgICB3eSA9IHcgKiB5MixcbiAgICAgICAgd3ogPSB3ICogejI7XG5cbiAgICBvdXRbMF0gPSAxIC0geXkgLSB6ejtcbiAgICBvdXRbM10gPSB5eCAtIHd6O1xuICAgIG91dFs2XSA9IHp4ICsgd3k7XG5cbiAgICBvdXRbMV0gPSB5eCArIHd6O1xuICAgIG91dFs0XSA9IDEgLSB4eCAtIHp6O1xuICAgIG91dFs3XSA9IHp5IC0gd3g7XG5cbiAgICBvdXRbMl0gPSB6eCAtIHd5O1xuICAgIG91dFs1XSA9IHp5ICsgd3g7XG4gICAgb3V0WzhdID0gMSAtIHh4IC0geXk7XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4qIENhbGN1bGF0ZXMgYSAzeDMgbm9ybWFsIG1hdHJpeCAodHJhbnNwb3NlIGludmVyc2UpIGZyb20gdGhlIDR4NCBtYXRyaXhcbipcbiogQHBhcmFtIHttYXQzfSBvdXQgbWF0MyByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuKiBAcGFyYW0ge21hdDR9IGEgTWF0NCB0byBkZXJpdmUgdGhlIG5vcm1hbCBtYXRyaXggZnJvbVxuKlxuKiBAcmV0dXJucyB7bWF0M30gb3V0XG4qL1xubWF0My5ub3JtYWxGcm9tTWF0NCA9IGZ1bmN0aW9uIChvdXQsIGEpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTAzID0gYVszXSxcbiAgICAgICAgYTEwID0gYVs0XSwgYTExID0gYVs1XSwgYTEyID0gYVs2XSwgYTEzID0gYVs3XSxcbiAgICAgICAgYTIwID0gYVs4XSwgYTIxID0gYVs5XSwgYTIyID0gYVsxMF0sIGEyMyA9IGFbMTFdLFxuICAgICAgICBhMzAgPSBhWzEyXSwgYTMxID0gYVsxM10sIGEzMiA9IGFbMTRdLCBhMzMgPSBhWzE1XSxcblxuICAgICAgICBiMDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTAsXG4gICAgICAgIGIwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMCxcbiAgICAgICAgYjAyID0gYTAwICogYTEzIC0gYTAzICogYTEwLFxuICAgICAgICBiMDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTEsXG4gICAgICAgIGIwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMSxcbiAgICAgICAgYjA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyLFxuICAgICAgICBiMDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzAsXG4gICAgICAgIGIwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMCxcbiAgICAgICAgYjA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwLFxuICAgICAgICBiMDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzEsXG4gICAgICAgIGIxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMSxcbiAgICAgICAgYjExID0gYTIyICogYTMzIC0gYTIzICogYTMyLFxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnRcbiAgICAgICAgZGV0ID0gYjAwICogYjExIC0gYjAxICogYjEwICsgYjAyICogYjA5ICsgYjAzICogYjA4IC0gYjA0ICogYjA3ICsgYjA1ICogYjA2O1xuXG4gICAgaWYgKCFkZXQpIHsgXG4gICAgICAgIHJldHVybiBudWxsOyBcbiAgICB9XG4gICAgZGV0ID0gMS4wIC8gZGV0O1xuXG4gICAgb3V0WzBdID0gKGExMSAqIGIxMSAtIGExMiAqIGIxMCArIGExMyAqIGIwOSkgKiBkZXQ7XG4gICAgb3V0WzFdID0gKGExMiAqIGIwOCAtIGExMCAqIGIxMSAtIGExMyAqIGIwNykgKiBkZXQ7XG4gICAgb3V0WzJdID0gKGExMCAqIGIxMCAtIGExMSAqIGIwOCArIGExMyAqIGIwNikgKiBkZXQ7XG5cbiAgICBvdXRbM10gPSAoYTAyICogYjEwIC0gYTAxICogYjExIC0gYTAzICogYjA5KSAqIGRldDtcbiAgICBvdXRbNF0gPSAoYTAwICogYjExIC0gYTAyICogYjA4ICsgYTAzICogYjA3KSAqIGRldDtcbiAgICBvdXRbNV0gPSAoYTAxICogYjA4IC0gYTAwICogYjEwIC0gYTAzICogYjA2KSAqIGRldDtcblxuICAgIG91dFs2XSA9IChhMzEgKiBiMDUgLSBhMzIgKiBiMDQgKyBhMzMgKiBiMDMpICogZGV0O1xuICAgIG91dFs3XSA9IChhMzIgKiBiMDIgLSBhMzAgKiBiMDUgLSBhMzMgKiBiMDEpICogZGV0O1xuICAgIG91dFs4XSA9IChhMzAgKiBiMDQgLSBhMzEgKiBiMDIgKyBhMzMgKiBiMDApICogZGV0O1xuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIG1hdDNcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG1hdCBtYXRyaXggdG8gcmVwcmVzZW50IGFzIGEgc3RyaW5nXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hdHJpeFxuICovXG5tYXQzLnN0ciA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuICdtYXQzKCcgKyBhWzBdICsgJywgJyArIGFbMV0gKyAnLCAnICsgYVsyXSArICcsICcgKyBcbiAgICAgICAgICAgICAgICAgICAgYVszXSArICcsICcgKyBhWzRdICsgJywgJyArIGFbNV0gKyAnLCAnICsgXG4gICAgICAgICAgICAgICAgICAgIGFbNl0gKyAnLCAnICsgYVs3XSArICcsICcgKyBhWzhdICsgJyknO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIEZyb2Jlbml1cyBub3JtIG9mIGEgbWF0M1xuICpcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgbWF0cml4IHRvIGNhbGN1bGF0ZSBGcm9iZW5pdXMgbm9ybSBvZlxuICogQHJldHVybnMge051bWJlcn0gRnJvYmVuaXVzIG5vcm1cbiAqL1xubWF0My5mcm9iID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4oTWF0aC5zcXJ0KE1hdGgucG93KGFbMF0sIDIpICsgTWF0aC5wb3coYVsxXSwgMikgKyBNYXRoLnBvdyhhWzJdLCAyKSArIE1hdGgucG93KGFbM10sIDIpICsgTWF0aC5wb3coYVs0XSwgMikgKyBNYXRoLnBvdyhhWzVdLCAyKSArIE1hdGgucG93KGFbNl0sIDIpICsgTWF0aC5wb3coYVs3XSwgMikgKyBNYXRoLnBvdyhhWzhdLCAyKSkpXG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gbWF0MztcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L21hdDMuanNcbiAqKiBtb2R1bGUgaWQgPSA4XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKiBDb3B5cmlnaHQgKGMpIDIwMTUsIEJyYW5kb24gSm9uZXMsIENvbGluIE1hY0tlbnppZSBJVi5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLiAqL1xuXG52YXIgZ2xNYXRyaXggPSByZXF1aXJlKFwiLi9jb21tb24uanNcIik7XG5cbi8qKlxuICogQGNsYXNzIDR4NCBNYXRyaXhcbiAqIEBuYW1lIG1hdDRcbiAqL1xudmFyIG1hdDQgPSB7fTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGlkZW50aXR5IG1hdDRcbiAqXG4gKiBAcmV0dXJucyB7bWF0NH0gYSBuZXcgNHg0IG1hdHJpeFxuICovXG5tYXQ0LmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSgxNik7XG4gICAgb3V0WzBdID0gMTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IDE7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDA7XG4gICAgb3V0WzldID0gMDtcbiAgICBvdXRbMTBdID0gMTtcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gMDtcbiAgICBvdXRbMTNdID0gMDtcbiAgICBvdXRbMTRdID0gMDtcbiAgICBvdXRbMTVdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IG1hdDQgaW5pdGlhbGl6ZWQgd2l0aCB2YWx1ZXMgZnJvbSBhbiBleGlzdGluZyBtYXRyaXhcbiAqXG4gKiBAcGFyYW0ge21hdDR9IGEgbWF0cml4IHRvIGNsb25lXG4gKiBAcmV0dXJucyB7bWF0NH0gYSBuZXcgNHg0IG1hdHJpeFxuICovXG5tYXQ0LmNsb25lID0gZnVuY3Rpb24oYSkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSgxNik7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICBvdXRbNF0gPSBhWzRdO1xuICAgIG91dFs1XSA9IGFbNV07XG4gICAgb3V0WzZdID0gYVs2XTtcbiAgICBvdXRbN10gPSBhWzddO1xuICAgIG91dFs4XSA9IGFbOF07XG4gICAgb3V0WzldID0gYVs5XTtcbiAgICBvdXRbMTBdID0gYVsxMF07XG4gICAgb3V0WzExXSA9IGFbMTFdO1xuICAgIG91dFsxMl0gPSBhWzEyXTtcbiAgICBvdXRbMTNdID0gYVsxM107XG4gICAgb3V0WzE0XSA9IGFbMTRdO1xuICAgIG91dFsxNV0gPSBhWzE1XTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDb3B5IHRoZSB2YWx1ZXMgZnJvbSBvbmUgbWF0NCB0byBhbm90aGVyXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgc291cmNlIG1hdHJpeFxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmNvcHkgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSBhWzBdO1xuICAgIG91dFsxXSA9IGFbMV07XG4gICAgb3V0WzJdID0gYVsyXTtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIG91dFs0XSA9IGFbNF07XG4gICAgb3V0WzVdID0gYVs1XTtcbiAgICBvdXRbNl0gPSBhWzZdO1xuICAgIG91dFs3XSA9IGFbN107XG4gICAgb3V0WzhdID0gYVs4XTtcbiAgICBvdXRbOV0gPSBhWzldO1xuICAgIG91dFsxMF0gPSBhWzEwXTtcbiAgICBvdXRbMTFdID0gYVsxMV07XG4gICAgb3V0WzEyXSA9IGFbMTJdO1xuICAgIG91dFsxM10gPSBhWzEzXTtcbiAgICBvdXRbMTRdID0gYVsxNF07XG4gICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNldCBhIG1hdDQgdG8gdGhlIGlkZW50aXR5IG1hdHJpeFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuaWRlbnRpdHkgPSBmdW5jdGlvbihvdXQpIHtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gMTtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMDtcbiAgICBvdXRbOV0gPSAwO1xuICAgIG91dFsxMF0gPSAxO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAwO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zcG9zZSB0aGUgdmFsdWVzIG9mIGEgbWF0NFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC50cmFuc3Bvc2UgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICAvLyBJZiB3ZSBhcmUgdHJhbnNwb3Npbmcgb3Vyc2VsdmVzIHdlIGNhbiBza2lwIGEgZmV3IHN0ZXBzIGJ1dCBoYXZlIHRvIGNhY2hlIHNvbWUgdmFsdWVzXG4gICAgaWYgKG91dCA9PT0gYSkge1xuICAgICAgICB2YXIgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTAzID0gYVszXSxcbiAgICAgICAgICAgIGExMiA9IGFbNl0sIGExMyA9IGFbN10sXG4gICAgICAgICAgICBhMjMgPSBhWzExXTtcblxuICAgICAgICBvdXRbMV0gPSBhWzRdO1xuICAgICAgICBvdXRbMl0gPSBhWzhdO1xuICAgICAgICBvdXRbM10gPSBhWzEyXTtcbiAgICAgICAgb3V0WzRdID0gYTAxO1xuICAgICAgICBvdXRbNl0gPSBhWzldO1xuICAgICAgICBvdXRbN10gPSBhWzEzXTtcbiAgICAgICAgb3V0WzhdID0gYTAyO1xuICAgICAgICBvdXRbOV0gPSBhMTI7XG4gICAgICAgIG91dFsxMV0gPSBhWzE0XTtcbiAgICAgICAgb3V0WzEyXSA9IGEwMztcbiAgICAgICAgb3V0WzEzXSA9IGExMztcbiAgICAgICAgb3V0WzE0XSA9IGEyMztcbiAgICB9IGVsc2Uge1xuICAgICAgICBvdXRbMF0gPSBhWzBdO1xuICAgICAgICBvdXRbMV0gPSBhWzRdO1xuICAgICAgICBvdXRbMl0gPSBhWzhdO1xuICAgICAgICBvdXRbM10gPSBhWzEyXTtcbiAgICAgICAgb3V0WzRdID0gYVsxXTtcbiAgICAgICAgb3V0WzVdID0gYVs1XTtcbiAgICAgICAgb3V0WzZdID0gYVs5XTtcbiAgICAgICAgb3V0WzddID0gYVsxM107XG4gICAgICAgIG91dFs4XSA9IGFbMl07XG4gICAgICAgIG91dFs5XSA9IGFbNl07XG4gICAgICAgIG91dFsxMF0gPSBhWzEwXTtcbiAgICAgICAgb3V0WzExXSA9IGFbMTRdO1xuICAgICAgICBvdXRbMTJdID0gYVszXTtcbiAgICAgICAgb3V0WzEzXSA9IGFbN107XG4gICAgICAgIG91dFsxNF0gPSBhWzExXTtcbiAgICAgICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBJbnZlcnRzIGEgbWF0NFxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5pbnZlcnQgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTAzID0gYVszXSxcbiAgICAgICAgYTEwID0gYVs0XSwgYTExID0gYVs1XSwgYTEyID0gYVs2XSwgYTEzID0gYVs3XSxcbiAgICAgICAgYTIwID0gYVs4XSwgYTIxID0gYVs5XSwgYTIyID0gYVsxMF0sIGEyMyA9IGFbMTFdLFxuICAgICAgICBhMzAgPSBhWzEyXSwgYTMxID0gYVsxM10sIGEzMiA9IGFbMTRdLCBhMzMgPSBhWzE1XSxcblxuICAgICAgICBiMDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTAsXG4gICAgICAgIGIwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMCxcbiAgICAgICAgYjAyID0gYTAwICogYTEzIC0gYTAzICogYTEwLFxuICAgICAgICBiMDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTEsXG4gICAgICAgIGIwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMSxcbiAgICAgICAgYjA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyLFxuICAgICAgICBiMDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzAsXG4gICAgICAgIGIwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMCxcbiAgICAgICAgYjA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwLFxuICAgICAgICBiMDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzEsXG4gICAgICAgIGIxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMSxcbiAgICAgICAgYjExID0gYTIyICogYTMzIC0gYTIzICogYTMyLFxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnRcbiAgICAgICAgZGV0ID0gYjAwICogYjExIC0gYjAxICogYjEwICsgYjAyICogYjA5ICsgYjAzICogYjA4IC0gYjA0ICogYjA3ICsgYjA1ICogYjA2O1xuXG4gICAgaWYgKCFkZXQpIHsgXG4gICAgICAgIHJldHVybiBudWxsOyBcbiAgICB9XG4gICAgZGV0ID0gMS4wIC8gZGV0O1xuXG4gICAgb3V0WzBdID0gKGExMSAqIGIxMSAtIGExMiAqIGIxMCArIGExMyAqIGIwOSkgKiBkZXQ7XG4gICAgb3V0WzFdID0gKGEwMiAqIGIxMCAtIGEwMSAqIGIxMSAtIGEwMyAqIGIwOSkgKiBkZXQ7XG4gICAgb3V0WzJdID0gKGEzMSAqIGIwNSAtIGEzMiAqIGIwNCArIGEzMyAqIGIwMykgKiBkZXQ7XG4gICAgb3V0WzNdID0gKGEyMiAqIGIwNCAtIGEyMSAqIGIwNSAtIGEyMyAqIGIwMykgKiBkZXQ7XG4gICAgb3V0WzRdID0gKGExMiAqIGIwOCAtIGExMCAqIGIxMSAtIGExMyAqIGIwNykgKiBkZXQ7XG4gICAgb3V0WzVdID0gKGEwMCAqIGIxMSAtIGEwMiAqIGIwOCArIGEwMyAqIGIwNykgKiBkZXQ7XG4gICAgb3V0WzZdID0gKGEzMiAqIGIwMiAtIGEzMCAqIGIwNSAtIGEzMyAqIGIwMSkgKiBkZXQ7XG4gICAgb3V0WzddID0gKGEyMCAqIGIwNSAtIGEyMiAqIGIwMiArIGEyMyAqIGIwMSkgKiBkZXQ7XG4gICAgb3V0WzhdID0gKGExMCAqIGIxMCAtIGExMSAqIGIwOCArIGExMyAqIGIwNikgKiBkZXQ7XG4gICAgb3V0WzldID0gKGEwMSAqIGIwOCAtIGEwMCAqIGIxMCAtIGEwMyAqIGIwNikgKiBkZXQ7XG4gICAgb3V0WzEwXSA9IChhMzAgKiBiMDQgLSBhMzEgKiBiMDIgKyBhMzMgKiBiMDApICogZGV0O1xuICAgIG91dFsxMV0gPSAoYTIxICogYjAyIC0gYTIwICogYjA0IC0gYTIzICogYjAwKSAqIGRldDtcbiAgICBvdXRbMTJdID0gKGExMSAqIGIwNyAtIGExMCAqIGIwOSAtIGExMiAqIGIwNikgKiBkZXQ7XG4gICAgb3V0WzEzXSA9IChhMDAgKiBiMDkgLSBhMDEgKiBiMDcgKyBhMDIgKiBiMDYpICogZGV0O1xuICAgIG91dFsxNF0gPSAoYTMxICogYjAxIC0gYTMwICogYjAzIC0gYTMyICogYjAwKSAqIGRldDtcbiAgICBvdXRbMTVdID0gKGEyMCAqIGIwMyAtIGEyMSAqIGIwMSArIGEyMiAqIGIwMCkgKiBkZXQ7XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBhZGp1Z2F0ZSBvZiBhIG1hdDRcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuYWRqb2ludCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMDMgPSBhWzNdLFxuICAgICAgICBhMTAgPSBhWzRdLCBhMTEgPSBhWzVdLCBhMTIgPSBhWzZdLCBhMTMgPSBhWzddLFxuICAgICAgICBhMjAgPSBhWzhdLCBhMjEgPSBhWzldLCBhMjIgPSBhWzEwXSwgYTIzID0gYVsxMV0sXG4gICAgICAgIGEzMCA9IGFbMTJdLCBhMzEgPSBhWzEzXSwgYTMyID0gYVsxNF0sIGEzMyA9IGFbMTVdO1xuXG4gICAgb3V0WzBdICA9ICAoYTExICogKGEyMiAqIGEzMyAtIGEyMyAqIGEzMikgLSBhMjEgKiAoYTEyICogYTMzIC0gYTEzICogYTMyKSArIGEzMSAqIChhMTIgKiBhMjMgLSBhMTMgKiBhMjIpKTtcbiAgICBvdXRbMV0gID0gLShhMDEgKiAoYTIyICogYTMzIC0gYTIzICogYTMyKSAtIGEyMSAqIChhMDIgKiBhMzMgLSBhMDMgKiBhMzIpICsgYTMxICogKGEwMiAqIGEyMyAtIGEwMyAqIGEyMikpO1xuICAgIG91dFsyXSAgPSAgKGEwMSAqIChhMTIgKiBhMzMgLSBhMTMgKiBhMzIpIC0gYTExICogKGEwMiAqIGEzMyAtIGEwMyAqIGEzMikgKyBhMzEgKiAoYTAyICogYTEzIC0gYTAzICogYTEyKSk7XG4gICAgb3V0WzNdICA9IC0oYTAxICogKGExMiAqIGEyMyAtIGExMyAqIGEyMikgLSBhMTEgKiAoYTAyICogYTIzIC0gYTAzICogYTIyKSArIGEyMSAqIChhMDIgKiBhMTMgLSBhMDMgKiBhMTIpKTtcbiAgICBvdXRbNF0gID0gLShhMTAgKiAoYTIyICogYTMzIC0gYTIzICogYTMyKSAtIGEyMCAqIChhMTIgKiBhMzMgLSBhMTMgKiBhMzIpICsgYTMwICogKGExMiAqIGEyMyAtIGExMyAqIGEyMikpO1xuICAgIG91dFs1XSAgPSAgKGEwMCAqIChhMjIgKiBhMzMgLSBhMjMgKiBhMzIpIC0gYTIwICogKGEwMiAqIGEzMyAtIGEwMyAqIGEzMikgKyBhMzAgKiAoYTAyICogYTIzIC0gYTAzICogYTIyKSk7XG4gICAgb3V0WzZdICA9IC0oYTAwICogKGExMiAqIGEzMyAtIGExMyAqIGEzMikgLSBhMTAgKiAoYTAyICogYTMzIC0gYTAzICogYTMyKSArIGEzMCAqIChhMDIgKiBhMTMgLSBhMDMgKiBhMTIpKTtcbiAgICBvdXRbN10gID0gIChhMDAgKiAoYTEyICogYTIzIC0gYTEzICogYTIyKSAtIGExMCAqIChhMDIgKiBhMjMgLSBhMDMgKiBhMjIpICsgYTIwICogKGEwMiAqIGExMyAtIGEwMyAqIGExMikpO1xuICAgIG91dFs4XSAgPSAgKGExMCAqIChhMjEgKiBhMzMgLSBhMjMgKiBhMzEpIC0gYTIwICogKGExMSAqIGEzMyAtIGExMyAqIGEzMSkgKyBhMzAgKiAoYTExICogYTIzIC0gYTEzICogYTIxKSk7XG4gICAgb3V0WzldICA9IC0oYTAwICogKGEyMSAqIGEzMyAtIGEyMyAqIGEzMSkgLSBhMjAgKiAoYTAxICogYTMzIC0gYTAzICogYTMxKSArIGEzMCAqIChhMDEgKiBhMjMgLSBhMDMgKiBhMjEpKTtcbiAgICBvdXRbMTBdID0gIChhMDAgKiAoYTExICogYTMzIC0gYTEzICogYTMxKSAtIGExMCAqIChhMDEgKiBhMzMgLSBhMDMgKiBhMzEpICsgYTMwICogKGEwMSAqIGExMyAtIGEwMyAqIGExMSkpO1xuICAgIG91dFsxMV0gPSAtKGEwMCAqIChhMTEgKiBhMjMgLSBhMTMgKiBhMjEpIC0gYTEwICogKGEwMSAqIGEyMyAtIGEwMyAqIGEyMSkgKyBhMjAgKiAoYTAxICogYTEzIC0gYTAzICogYTExKSk7XG4gICAgb3V0WzEyXSA9IC0oYTEwICogKGEyMSAqIGEzMiAtIGEyMiAqIGEzMSkgLSBhMjAgKiAoYTExICogYTMyIC0gYTEyICogYTMxKSArIGEzMCAqIChhMTEgKiBhMjIgLSBhMTIgKiBhMjEpKTtcbiAgICBvdXRbMTNdID0gIChhMDAgKiAoYTIxICogYTMyIC0gYTIyICogYTMxKSAtIGEyMCAqIChhMDEgKiBhMzIgLSBhMDIgKiBhMzEpICsgYTMwICogKGEwMSAqIGEyMiAtIGEwMiAqIGEyMSkpO1xuICAgIG91dFsxNF0gPSAtKGEwMCAqIChhMTEgKiBhMzIgLSBhMTIgKiBhMzEpIC0gYTEwICogKGEwMSAqIGEzMiAtIGEwMiAqIGEzMSkgKyBhMzAgKiAoYTAxICogYTEyIC0gYTAyICogYTExKSk7XG4gICAgb3V0WzE1XSA9ICAoYTAwICogKGExMSAqIGEyMiAtIGExMiAqIGEyMSkgLSBhMTAgKiAoYTAxICogYTIyIC0gYTAyICogYTIxKSArIGEyMCAqIChhMDEgKiBhMTIgLSBhMDIgKiBhMTEpKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBkZXRlcm1pbmFudCBvZiBhIG1hdDRcbiAqXG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIHNvdXJjZSBtYXRyaXhcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRldGVybWluYW50IG9mIGFcbiAqL1xubWF0NC5kZXRlcm1pbmFudCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sIGEwMyA9IGFbM10sXG4gICAgICAgIGExMCA9IGFbNF0sIGExMSA9IGFbNV0sIGExMiA9IGFbNl0sIGExMyA9IGFbN10sXG4gICAgICAgIGEyMCA9IGFbOF0sIGEyMSA9IGFbOV0sIGEyMiA9IGFbMTBdLCBhMjMgPSBhWzExXSxcbiAgICAgICAgYTMwID0gYVsxMl0sIGEzMSA9IGFbMTNdLCBhMzIgPSBhWzE0XSwgYTMzID0gYVsxNV0sXG5cbiAgICAgICAgYjAwID0gYTAwICogYTExIC0gYTAxICogYTEwLFxuICAgICAgICBiMDEgPSBhMDAgKiBhMTIgLSBhMDIgKiBhMTAsXG4gICAgICAgIGIwMiA9IGEwMCAqIGExMyAtIGEwMyAqIGExMCxcbiAgICAgICAgYjAzID0gYTAxICogYTEyIC0gYTAyICogYTExLFxuICAgICAgICBiMDQgPSBhMDEgKiBhMTMgLSBhMDMgKiBhMTEsXG4gICAgICAgIGIwNSA9IGEwMiAqIGExMyAtIGEwMyAqIGExMixcbiAgICAgICAgYjA2ID0gYTIwICogYTMxIC0gYTIxICogYTMwLFxuICAgICAgICBiMDcgPSBhMjAgKiBhMzIgLSBhMjIgKiBhMzAsXG4gICAgICAgIGIwOCA9IGEyMCAqIGEzMyAtIGEyMyAqIGEzMCxcbiAgICAgICAgYjA5ID0gYTIxICogYTMyIC0gYTIyICogYTMxLFxuICAgICAgICBiMTAgPSBhMjEgKiBhMzMgLSBhMjMgKiBhMzEsXG4gICAgICAgIGIxMSA9IGEyMiAqIGEzMyAtIGEyMyAqIGEzMjtcblxuICAgIC8vIENhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnRcbiAgICByZXR1cm4gYjAwICogYjExIC0gYjAxICogYjEwICsgYjAyICogYjA5ICsgYjAzICogYjA4IC0gYjA0ICogYjA3ICsgYjA1ICogYjA2O1xufTtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byBtYXQ0J3NcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge21hdDR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQubXVsdGlwbHkgPSBmdW5jdGlvbiAob3V0LCBhLCBiKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sIGEwMyA9IGFbM10sXG4gICAgICAgIGExMCA9IGFbNF0sIGExMSA9IGFbNV0sIGExMiA9IGFbNl0sIGExMyA9IGFbN10sXG4gICAgICAgIGEyMCA9IGFbOF0sIGEyMSA9IGFbOV0sIGEyMiA9IGFbMTBdLCBhMjMgPSBhWzExXSxcbiAgICAgICAgYTMwID0gYVsxMl0sIGEzMSA9IGFbMTNdLCBhMzIgPSBhWzE0XSwgYTMzID0gYVsxNV07XG5cbiAgICAvLyBDYWNoZSBvbmx5IHRoZSBjdXJyZW50IGxpbmUgb2YgdGhlIHNlY29uZCBtYXRyaXhcbiAgICB2YXIgYjAgID0gYlswXSwgYjEgPSBiWzFdLCBiMiA9IGJbMl0sIGIzID0gYlszXTsgIFxuICAgIG91dFswXSA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXRbMV0gPSBiMCphMDEgKyBiMSphMTEgKyBiMiphMjEgKyBiMyphMzE7XG4gICAgb3V0WzJdID0gYjAqYTAyICsgYjEqYTEyICsgYjIqYTIyICsgYjMqYTMyO1xuICAgIG91dFszXSA9IGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcblxuICAgIGIwID0gYls0XTsgYjEgPSBiWzVdOyBiMiA9IGJbNl07IGIzID0gYls3XTtcbiAgICBvdXRbNF0gPSBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzA7XG4gICAgb3V0WzVdID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dFs2XSA9IGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMjtcbiAgICBvdXRbN10gPSBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG5cbiAgICBiMCA9IGJbOF07IGIxID0gYls5XTsgYjIgPSBiWzEwXTsgYjMgPSBiWzExXTtcbiAgICBvdXRbOF0gPSBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzA7XG4gICAgb3V0WzldID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dFsxMF0gPSBiMCphMDIgKyBiMSphMTIgKyBiMiphMjIgKyBiMyphMzI7XG4gICAgb3V0WzExXSA9IGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcblxuICAgIGIwID0gYlsxMl07IGIxID0gYlsxM107IGIyID0gYlsxNF07IGIzID0gYlsxNV07XG4gICAgb3V0WzEyXSA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXRbMTNdID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dFsxNF0gPSBiMCphMDIgKyBiMSphMTIgKyBiMiphMjIgKyBiMyphMzI7XG4gICAgb3V0WzE1XSA9IGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIG1hdDQubXVsdGlwbHl9XG4gKiBAZnVuY3Rpb25cbiAqL1xubWF0NC5tdWwgPSBtYXQ0Lm11bHRpcGx5O1xuXG4vKipcbiAqIFRyYW5zbGF0ZSBhIG1hdDQgYnkgdGhlIGdpdmVuIHZlY3RvclxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIG1hdHJpeCB0byB0cmFuc2xhdGVcbiAqIEBwYXJhbSB7dmVjM30gdiB2ZWN0b3IgdG8gdHJhbnNsYXRlIGJ5XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQudHJhbnNsYXRlID0gZnVuY3Rpb24gKG91dCwgYSwgdikge1xuICAgIHZhciB4ID0gdlswXSwgeSA9IHZbMV0sIHogPSB2WzJdLFxuICAgICAgICBhMDAsIGEwMSwgYTAyLCBhMDMsXG4gICAgICAgIGExMCwgYTExLCBhMTIsIGExMyxcbiAgICAgICAgYTIwLCBhMjEsIGEyMiwgYTIzO1xuXG4gICAgaWYgKGEgPT09IG91dCkge1xuICAgICAgICBvdXRbMTJdID0gYVswXSAqIHggKyBhWzRdICogeSArIGFbOF0gKiB6ICsgYVsxMl07XG4gICAgICAgIG91dFsxM10gPSBhWzFdICogeCArIGFbNV0gKiB5ICsgYVs5XSAqIHogKyBhWzEzXTtcbiAgICAgICAgb3V0WzE0XSA9IGFbMl0gKiB4ICsgYVs2XSAqIHkgKyBhWzEwXSAqIHogKyBhWzE0XTtcbiAgICAgICAgb3V0WzE1XSA9IGFbM10gKiB4ICsgYVs3XSAqIHkgKyBhWzExXSAqIHogKyBhWzE1XTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBhMDAgPSBhWzBdOyBhMDEgPSBhWzFdOyBhMDIgPSBhWzJdOyBhMDMgPSBhWzNdO1xuICAgICAgICBhMTAgPSBhWzRdOyBhMTEgPSBhWzVdOyBhMTIgPSBhWzZdOyBhMTMgPSBhWzddO1xuICAgICAgICBhMjAgPSBhWzhdOyBhMjEgPSBhWzldOyBhMjIgPSBhWzEwXTsgYTIzID0gYVsxMV07XG5cbiAgICAgICAgb3V0WzBdID0gYTAwOyBvdXRbMV0gPSBhMDE7IG91dFsyXSA9IGEwMjsgb3V0WzNdID0gYTAzO1xuICAgICAgICBvdXRbNF0gPSBhMTA7IG91dFs1XSA9IGExMTsgb3V0WzZdID0gYTEyOyBvdXRbN10gPSBhMTM7XG4gICAgICAgIG91dFs4XSA9IGEyMDsgb3V0WzldID0gYTIxOyBvdXRbMTBdID0gYTIyOyBvdXRbMTFdID0gYTIzO1xuXG4gICAgICAgIG91dFsxMl0gPSBhMDAgKiB4ICsgYTEwICogeSArIGEyMCAqIHogKyBhWzEyXTtcbiAgICAgICAgb3V0WzEzXSA9IGEwMSAqIHggKyBhMTEgKiB5ICsgYTIxICogeiArIGFbMTNdO1xuICAgICAgICBvdXRbMTRdID0gYTAyICogeCArIGExMiAqIHkgKyBhMjIgKiB6ICsgYVsxNF07XG4gICAgICAgIG91dFsxNV0gPSBhMDMgKiB4ICsgYTEzICogeSArIGEyMyAqIHogKyBhWzE1XTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTY2FsZXMgdGhlIG1hdDQgYnkgdGhlIGRpbWVuc2lvbnMgaW4gdGhlIGdpdmVuIHZlYzNcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gc2NhbGVcbiAqIEBwYXJhbSB7dmVjM30gdiB0aGUgdmVjMyB0byBzY2FsZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKiovXG5tYXQ0LnNjYWxlID0gZnVuY3Rpb24ob3V0LCBhLCB2KSB7XG4gICAgdmFyIHggPSB2WzBdLCB5ID0gdlsxXSwgeiA9IHZbMl07XG5cbiAgICBvdXRbMF0gPSBhWzBdICogeDtcbiAgICBvdXRbMV0gPSBhWzFdICogeDtcbiAgICBvdXRbMl0gPSBhWzJdICogeDtcbiAgICBvdXRbM10gPSBhWzNdICogeDtcbiAgICBvdXRbNF0gPSBhWzRdICogeTtcbiAgICBvdXRbNV0gPSBhWzVdICogeTtcbiAgICBvdXRbNl0gPSBhWzZdICogeTtcbiAgICBvdXRbN10gPSBhWzddICogeTtcbiAgICBvdXRbOF0gPSBhWzhdICogejtcbiAgICBvdXRbOV0gPSBhWzldICogejtcbiAgICBvdXRbMTBdID0gYVsxMF0gKiB6O1xuICAgIG91dFsxMV0gPSBhWzExXSAqIHo7XG4gICAgb3V0WzEyXSA9IGFbMTJdO1xuICAgIG91dFsxM10gPSBhWzEzXTtcbiAgICBvdXRbMTRdID0gYVsxNF07XG4gICAgb3V0WzE1XSA9IGFbMTVdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBtYXQ0IGJ5IHRoZSBnaXZlbiBhbmdsZSBhcm91bmQgdGhlIGdpdmVuIGF4aXNcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHBhcmFtIHt2ZWMzfSBheGlzIHRoZSBheGlzIHRvIHJvdGF0ZSBhcm91bmRcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5yb3RhdGUgPSBmdW5jdGlvbiAob3V0LCBhLCByYWQsIGF4aXMpIHtcbiAgICB2YXIgeCA9IGF4aXNbMF0sIHkgPSBheGlzWzFdLCB6ID0gYXhpc1syXSxcbiAgICAgICAgbGVuID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeiksXG4gICAgICAgIHMsIGMsIHQsXG4gICAgICAgIGEwMCwgYTAxLCBhMDIsIGEwMyxcbiAgICAgICAgYTEwLCBhMTEsIGExMiwgYTEzLFxuICAgICAgICBhMjAsIGEyMSwgYTIyLCBhMjMsXG4gICAgICAgIGIwMCwgYjAxLCBiMDIsXG4gICAgICAgIGIxMCwgYjExLCBiMTIsXG4gICAgICAgIGIyMCwgYjIxLCBiMjI7XG5cbiAgICBpZiAoTWF0aC5hYnMobGVuKSA8IGdsTWF0cml4LkVQU0lMT04pIHsgcmV0dXJuIG51bGw7IH1cbiAgICBcbiAgICBsZW4gPSAxIC8gbGVuO1xuICAgIHggKj0gbGVuO1xuICAgIHkgKj0gbGVuO1xuICAgIHogKj0gbGVuO1xuXG4gICAgcyA9IE1hdGguc2luKHJhZCk7XG4gICAgYyA9IE1hdGguY29zKHJhZCk7XG4gICAgdCA9IDEgLSBjO1xuXG4gICAgYTAwID0gYVswXTsgYTAxID0gYVsxXTsgYTAyID0gYVsyXTsgYTAzID0gYVszXTtcbiAgICBhMTAgPSBhWzRdOyBhMTEgPSBhWzVdOyBhMTIgPSBhWzZdOyBhMTMgPSBhWzddO1xuICAgIGEyMCA9IGFbOF07IGEyMSA9IGFbOV07IGEyMiA9IGFbMTBdOyBhMjMgPSBhWzExXTtcblxuICAgIC8vIENvbnN0cnVjdCB0aGUgZWxlbWVudHMgb2YgdGhlIHJvdGF0aW9uIG1hdHJpeFxuICAgIGIwMCA9IHggKiB4ICogdCArIGM7IGIwMSA9IHkgKiB4ICogdCArIHogKiBzOyBiMDIgPSB6ICogeCAqIHQgLSB5ICogcztcbiAgICBiMTAgPSB4ICogeSAqIHQgLSB6ICogczsgYjExID0geSAqIHkgKiB0ICsgYzsgYjEyID0geiAqIHkgKiB0ICsgeCAqIHM7XG4gICAgYjIwID0geCAqIHogKiB0ICsgeSAqIHM7IGIyMSA9IHkgKiB6ICogdCAtIHggKiBzOyBiMjIgPSB6ICogeiAqIHQgKyBjO1xuXG4gICAgLy8gUGVyZm9ybSByb3RhdGlvbi1zcGVjaWZpYyBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICBvdXRbMF0gPSBhMDAgKiBiMDAgKyBhMTAgKiBiMDEgKyBhMjAgKiBiMDI7XG4gICAgb3V0WzFdID0gYTAxICogYjAwICsgYTExICogYjAxICsgYTIxICogYjAyO1xuICAgIG91dFsyXSA9IGEwMiAqIGIwMCArIGExMiAqIGIwMSArIGEyMiAqIGIwMjtcbiAgICBvdXRbM10gPSBhMDMgKiBiMDAgKyBhMTMgKiBiMDEgKyBhMjMgKiBiMDI7XG4gICAgb3V0WzRdID0gYTAwICogYjEwICsgYTEwICogYjExICsgYTIwICogYjEyO1xuICAgIG91dFs1XSA9IGEwMSAqIGIxMCArIGExMSAqIGIxMSArIGEyMSAqIGIxMjtcbiAgICBvdXRbNl0gPSBhMDIgKiBiMTAgKyBhMTIgKiBiMTEgKyBhMjIgKiBiMTI7XG4gICAgb3V0WzddID0gYTAzICogYjEwICsgYTEzICogYjExICsgYTIzICogYjEyO1xuICAgIG91dFs4XSA9IGEwMCAqIGIyMCArIGExMCAqIGIyMSArIGEyMCAqIGIyMjtcbiAgICBvdXRbOV0gPSBhMDEgKiBiMjAgKyBhMTEgKiBiMjEgKyBhMjEgKiBiMjI7XG4gICAgb3V0WzEwXSA9IGEwMiAqIGIyMCArIGExMiAqIGIyMSArIGEyMiAqIGIyMjtcbiAgICBvdXRbMTFdID0gYTAzICogYjIwICsgYTEzICogYjIxICsgYTIzICogYjIyO1xuXG4gICAgaWYgKGEgIT09IG91dCkgeyAvLyBJZiB0aGUgc291cmNlIGFuZCBkZXN0aW5hdGlvbiBkaWZmZXIsIGNvcHkgdGhlIHVuY2hhbmdlZCBsYXN0IHJvd1xuICAgICAgICBvdXRbMTJdID0gYVsxMl07XG4gICAgICAgIG91dFsxM10gPSBhWzEzXTtcbiAgICAgICAgb3V0WzE0XSA9IGFbMTRdO1xuICAgICAgICBvdXRbMTVdID0gYVsxNV07XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBtYXRyaXggYnkgdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgWCBheGlzXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSB0aGUgbWF0cml4IHRvIHJvdGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5yb3RhdGVYID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkKSB7XG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpLFxuICAgICAgICBjID0gTWF0aC5jb3MocmFkKSxcbiAgICAgICAgYTEwID0gYVs0XSxcbiAgICAgICAgYTExID0gYVs1XSxcbiAgICAgICAgYTEyID0gYVs2XSxcbiAgICAgICAgYTEzID0gYVs3XSxcbiAgICAgICAgYTIwID0gYVs4XSxcbiAgICAgICAgYTIxID0gYVs5XSxcbiAgICAgICAgYTIyID0gYVsxMF0sXG4gICAgICAgIGEyMyA9IGFbMTFdO1xuXG4gICAgaWYgKGEgIT09IG91dCkgeyAvLyBJZiB0aGUgc291cmNlIGFuZCBkZXN0aW5hdGlvbiBkaWZmZXIsIGNvcHkgdGhlIHVuY2hhbmdlZCByb3dzXG4gICAgICAgIG91dFswXSAgPSBhWzBdO1xuICAgICAgICBvdXRbMV0gID0gYVsxXTtcbiAgICAgICAgb3V0WzJdICA9IGFbMl07XG4gICAgICAgIG91dFszXSAgPSBhWzNdO1xuICAgICAgICBvdXRbMTJdID0gYVsxMl07XG4gICAgICAgIG91dFsxM10gPSBhWzEzXTtcbiAgICAgICAgb3V0WzE0XSA9IGFbMTRdO1xuICAgICAgICBvdXRbMTVdID0gYVsxNV07XG4gICAgfVxuXG4gICAgLy8gUGVyZm9ybSBheGlzLXNwZWNpZmljIG1hdHJpeCBtdWx0aXBsaWNhdGlvblxuICAgIG91dFs0XSA9IGExMCAqIGMgKyBhMjAgKiBzO1xuICAgIG91dFs1XSA9IGExMSAqIGMgKyBhMjEgKiBzO1xuICAgIG91dFs2XSA9IGExMiAqIGMgKyBhMjIgKiBzO1xuICAgIG91dFs3XSA9IGExMyAqIGMgKyBhMjMgKiBzO1xuICAgIG91dFs4XSA9IGEyMCAqIGMgLSBhMTAgKiBzO1xuICAgIG91dFs5XSA9IGEyMSAqIGMgLSBhMTEgKiBzO1xuICAgIG91dFsxMF0gPSBhMjIgKiBjIC0gYTEyICogcztcbiAgICBvdXRbMTFdID0gYTIzICogYyAtIGExMyAqIHM7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUm90YXRlcyBhIG1hdHJpeCBieSB0aGUgZ2l2ZW4gYW5nbGUgYXJvdW5kIHRoZSBZIGF4aXNcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gcm90YXRlXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LnJvdGF0ZVkgPSBmdW5jdGlvbiAob3V0LCBhLCByYWQpIHtcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCksXG4gICAgICAgIGMgPSBNYXRoLmNvcyhyYWQpLFxuICAgICAgICBhMDAgPSBhWzBdLFxuICAgICAgICBhMDEgPSBhWzFdLFxuICAgICAgICBhMDIgPSBhWzJdLFxuICAgICAgICBhMDMgPSBhWzNdLFxuICAgICAgICBhMjAgPSBhWzhdLFxuICAgICAgICBhMjEgPSBhWzldLFxuICAgICAgICBhMjIgPSBhWzEwXSxcbiAgICAgICAgYTIzID0gYVsxMV07XG5cbiAgICBpZiAoYSAhPT0gb3V0KSB7IC8vIElmIHRoZSBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uIGRpZmZlciwgY29weSB0aGUgdW5jaGFuZ2VkIHJvd3NcbiAgICAgICAgb3V0WzRdICA9IGFbNF07XG4gICAgICAgIG91dFs1XSAgPSBhWzVdO1xuICAgICAgICBvdXRbNl0gID0gYVs2XTtcbiAgICAgICAgb3V0WzddICA9IGFbN107XG4gICAgICAgIG91dFsxMl0gPSBhWzEyXTtcbiAgICAgICAgb3V0WzEzXSA9IGFbMTNdO1xuICAgICAgICBvdXRbMTRdID0gYVsxNF07XG4gICAgICAgIG91dFsxNV0gPSBhWzE1XTtcbiAgICB9XG5cbiAgICAvLyBQZXJmb3JtIGF4aXMtc3BlY2lmaWMgbWF0cml4IG11bHRpcGxpY2F0aW9uXG4gICAgb3V0WzBdID0gYTAwICogYyAtIGEyMCAqIHM7XG4gICAgb3V0WzFdID0gYTAxICogYyAtIGEyMSAqIHM7XG4gICAgb3V0WzJdID0gYTAyICogYyAtIGEyMiAqIHM7XG4gICAgb3V0WzNdID0gYTAzICogYyAtIGEyMyAqIHM7XG4gICAgb3V0WzhdID0gYTAwICogcyArIGEyMCAqIGM7XG4gICAgb3V0WzldID0gYTAxICogcyArIGEyMSAqIGM7XG4gICAgb3V0WzEwXSA9IGEwMiAqIHMgKyBhMjIgKiBjO1xuICAgIG91dFsxMV0gPSBhMDMgKiBzICsgYTIzICogYztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSb3RhdGVzIGEgbWF0cml4IGJ5IHRoZSBnaXZlbiBhbmdsZSBhcm91bmQgdGhlIFogYXhpc1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDR9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQucm90YXRlWiA9IGZ1bmN0aW9uIChvdXQsIGEsIHJhZCkge1xuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKSxcbiAgICAgICAgYyA9IE1hdGguY29zKHJhZCksXG4gICAgICAgIGEwMCA9IGFbMF0sXG4gICAgICAgIGEwMSA9IGFbMV0sXG4gICAgICAgIGEwMiA9IGFbMl0sXG4gICAgICAgIGEwMyA9IGFbM10sXG4gICAgICAgIGExMCA9IGFbNF0sXG4gICAgICAgIGExMSA9IGFbNV0sXG4gICAgICAgIGExMiA9IGFbNl0sXG4gICAgICAgIGExMyA9IGFbN107XG5cbiAgICBpZiAoYSAhPT0gb3V0KSB7IC8vIElmIHRoZSBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uIGRpZmZlciwgY29weSB0aGUgdW5jaGFuZ2VkIGxhc3Qgcm93XG4gICAgICAgIG91dFs4XSAgPSBhWzhdO1xuICAgICAgICBvdXRbOV0gID0gYVs5XTtcbiAgICAgICAgb3V0WzEwXSA9IGFbMTBdO1xuICAgICAgICBvdXRbMTFdID0gYVsxMV07XG4gICAgICAgIG91dFsxMl0gPSBhWzEyXTtcbiAgICAgICAgb3V0WzEzXSA9IGFbMTNdO1xuICAgICAgICBvdXRbMTRdID0gYVsxNF07XG4gICAgICAgIG91dFsxNV0gPSBhWzE1XTtcbiAgICB9XG5cbiAgICAvLyBQZXJmb3JtIGF4aXMtc3BlY2lmaWMgbWF0cml4IG11bHRpcGxpY2F0aW9uXG4gICAgb3V0WzBdID0gYTAwICogYyArIGExMCAqIHM7XG4gICAgb3V0WzFdID0gYTAxICogYyArIGExMSAqIHM7XG4gICAgb3V0WzJdID0gYTAyICogYyArIGExMiAqIHM7XG4gICAgb3V0WzNdID0gYTAzICogYyArIGExMyAqIHM7XG4gICAgb3V0WzRdID0gYTEwICogYyAtIGEwMCAqIHM7XG4gICAgb3V0WzVdID0gYTExICogYyAtIGEwMSAqIHM7XG4gICAgb3V0WzZdID0gYTEyICogYyAtIGEwMiAqIHM7XG4gICAgb3V0WzddID0gYTEzICogYyAtIGEwMyAqIHM7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgdmVjdG9yIHRyYW5zbGF0aW9uXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0NC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQ0LnRyYW5zbGF0ZShkZXN0LCBkZXN0LCB2ZWMpO1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7dmVjM30gdiBUcmFuc2xhdGlvbiB2ZWN0b3JcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5mcm9tVHJhbnNsYXRpb24gPSBmdW5jdGlvbihvdXQsIHYpIHtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gMTtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMDtcbiAgICBvdXRbOV0gPSAwO1xuICAgIG91dFsxMF0gPSAxO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSB2WzBdO1xuICAgIG91dFsxM10gPSB2WzFdO1xuICAgIG91dFsxNF0gPSB2WzJdO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgdmVjdG9yIHNjYWxpbmdcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQ0LmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDQuc2NhbGUoZGVzdCwgZGVzdCwgdmVjKTtcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3ZlYzN9IHYgU2NhbGluZyB2ZWN0b3JcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5mcm9tU2NhbGluZyA9IGZ1bmN0aW9uKG91dCwgdikge1xuICAgIG91dFswXSA9IHZbMF07XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSB2WzFdO1xuICAgIG91dFs2XSA9IDA7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSAwO1xuICAgIG91dFs5XSA9IDA7XG4gICAgb3V0WzEwXSA9IHZbMl07XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IDA7XG4gICAgb3V0WzEzXSA9IDA7XG4gICAgb3V0WzE0XSA9IDA7XG4gICAgb3V0WzE1XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gYSBnaXZlbiBhbmdsZSBhcm91bmQgYSBnaXZlbiBheGlzXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0NC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQ0LnJvdGF0ZShkZXN0LCBkZXN0LCByYWQsIGF4aXMpO1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcGFyYW0ge3ZlYzN9IGF4aXMgdGhlIGF4aXMgdG8gcm90YXRlIGFyb3VuZFxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmZyb21Sb3RhdGlvbiA9IGZ1bmN0aW9uKG91dCwgcmFkLCBheGlzKSB7XG4gICAgdmFyIHggPSBheGlzWzBdLCB5ID0gYXhpc1sxXSwgeiA9IGF4aXNbMl0sXG4gICAgICAgIGxlbiA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopLFxuICAgICAgICBzLCBjLCB0O1xuICAgIFxuICAgIGlmIChNYXRoLmFicyhsZW4pIDwgZ2xNYXRyaXguRVBTSUxPTikgeyByZXR1cm4gbnVsbDsgfVxuICAgIFxuICAgIGxlbiA9IDEgLyBsZW47XG4gICAgeCAqPSBsZW47XG4gICAgeSAqPSBsZW47XG4gICAgeiAqPSBsZW47XG4gICAgXG4gICAgcyA9IE1hdGguc2luKHJhZCk7XG4gICAgYyA9IE1hdGguY29zKHJhZCk7XG4gICAgdCA9IDEgLSBjO1xuICAgIFxuICAgIC8vIFBlcmZvcm0gcm90YXRpb24tc3BlY2lmaWMgbWF0cml4IG11bHRpcGxpY2F0aW9uXG4gICAgb3V0WzBdID0geCAqIHggKiB0ICsgYztcbiAgICBvdXRbMV0gPSB5ICogeCAqIHQgKyB6ICogcztcbiAgICBvdXRbMl0gPSB6ICogeCAqIHQgLSB5ICogcztcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IHggKiB5ICogdCAtIHogKiBzO1xuICAgIG91dFs1XSA9IHkgKiB5ICogdCArIGM7XG4gICAgb3V0WzZdID0geiAqIHkgKiB0ICsgeCAqIHM7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSB4ICogeiAqIHQgKyB5ICogcztcbiAgICBvdXRbOV0gPSB5ICogeiAqIHQgLSB4ICogcztcbiAgICBvdXRbMTBdID0geiAqIHogKiB0ICsgYztcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gMDtcbiAgICBvdXRbMTNdID0gMDtcbiAgICBvdXRbMTRdID0gMDtcbiAgICBvdXRbMTVdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSB0aGUgZ2l2ZW4gYW5nbGUgYXJvdW5kIHRoZSBYIGF4aXNcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byAoYnV0IG11Y2ggZmFzdGVyIHRoYW4pOlxuICpcbiAqICAgICBtYXQ0LmlkZW50aXR5KGRlc3QpO1xuICogICAgIG1hdDQucm90YXRlWChkZXN0LCBkZXN0LCByYWQpO1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuZnJvbVhSb3RhdGlvbiA9IGZ1bmN0aW9uKG91dCwgcmFkKSB7XG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpLFxuICAgICAgICBjID0gTWF0aC5jb3MocmFkKTtcbiAgICBcbiAgICAvLyBQZXJmb3JtIGF4aXMtc3BlY2lmaWMgbWF0cml4IG11bHRpcGxpY2F0aW9uXG4gICAgb3V0WzBdICA9IDE7XG4gICAgb3V0WzFdICA9IDA7XG4gICAgb3V0WzJdICA9IDA7XG4gICAgb3V0WzNdICA9IDA7XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSBjO1xuICAgIG91dFs2XSA9IHM7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSAwO1xuICAgIG91dFs5XSA9IC1zO1xuICAgIG91dFsxMF0gPSBjO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAwO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIHRoZSBnaXZlbiBhbmdsZSBhcm91bmQgdGhlIFkgYXhpc1xuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0NC5yb3RhdGVZKGRlc3QsIGRlc3QsIHJhZCk7XG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZCB0aGUgYW5nbGUgdG8gcm90YXRlIHRoZSBtYXRyaXggYnlcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5mcm9tWVJvdGF0aW9uID0gZnVuY3Rpb24ob3V0LCByYWQpIHtcbiAgICB2YXIgcyA9IE1hdGguc2luKHJhZCksXG4gICAgICAgIGMgPSBNYXRoLmNvcyhyYWQpO1xuICAgIFxuICAgIC8vIFBlcmZvcm0gYXhpcy1zcGVjaWZpYyBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICBvdXRbMF0gID0gYztcbiAgICBvdXRbMV0gID0gMDtcbiAgICBvdXRbMl0gID0gLXM7XG4gICAgb3V0WzNdICA9IDA7XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSAxO1xuICAgIG91dFs2XSA9IDA7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSBzO1xuICAgIG91dFs5XSA9IDA7XG4gICAgb3V0WzEwXSA9IGM7XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IDA7XG4gICAgb3V0WzEzXSA9IDA7XG4gICAgb3V0WzE0XSA9IDA7XG4gICAgb3V0WzE1XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWF0cml4IGZyb20gdGhlIGdpdmVuIGFuZ2xlIGFyb3VuZCB0aGUgWiBheGlzXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0NC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQ0LnJvdGF0ZVooZGVzdCwgZGVzdCwgcmFkKTtcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge051bWJlcn0gcmFkIHRoZSBhbmdsZSB0byByb3RhdGUgdGhlIG1hdHJpeCBieVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LmZyb21aUm90YXRpb24gPSBmdW5jdGlvbihvdXQsIHJhZCkge1xuICAgIHZhciBzID0gTWF0aC5zaW4ocmFkKSxcbiAgICAgICAgYyA9IE1hdGguY29zKHJhZCk7XG4gICAgXG4gICAgLy8gUGVyZm9ybSBheGlzLXNwZWNpZmljIG1hdHJpeCBtdWx0aXBsaWNhdGlvblxuICAgIG91dFswXSAgPSBjO1xuICAgIG91dFsxXSAgPSBzO1xuICAgIG91dFsyXSAgPSAwO1xuICAgIG91dFszXSAgPSAwO1xuICAgIG91dFs0XSA9IC1zO1xuICAgIG91dFs1XSA9IGM7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDA7XG4gICAgb3V0WzldID0gMDtcbiAgICBvdXRbMTBdID0gMTtcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gMDtcbiAgICBvdXRbMTNdID0gMDtcbiAgICBvdXRbMTRdID0gMDtcbiAgICBvdXRbMTVdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHF1YXRlcm5pb24gcm90YXRpb24gYW5kIHZlY3RvciB0cmFuc2xhdGlvblxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIChidXQgbXVjaCBmYXN0ZXIgdGhhbik6XG4gKlxuICogICAgIG1hdDQuaWRlbnRpdHkoZGVzdCk7XG4gKiAgICAgbWF0NC50cmFuc2xhdGUoZGVzdCwgdmVjKTtcbiAqICAgICB2YXIgcXVhdE1hdCA9IG1hdDQuY3JlYXRlKCk7XG4gKiAgICAgcXVhdDQudG9NYXQ0KHF1YXQsIHF1YXRNYXQpO1xuICogICAgIG1hdDQubXVsdGlwbHkoZGVzdCwgcXVhdE1hdCk7XG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCByZWNlaXZpbmcgb3BlcmF0aW9uIHJlc3VsdFxuICogQHBhcmFtIHtxdWF0NH0gcSBSb3RhdGlvbiBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3ZlYzN9IHYgVHJhbnNsYXRpb24gdmVjdG9yXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuZnJvbVJvdGF0aW9uVHJhbnNsYXRpb24gPSBmdW5jdGlvbiAob3V0LCBxLCB2KSB7XG4gICAgLy8gUXVhdGVybmlvbiBtYXRoXG4gICAgdmFyIHggPSBxWzBdLCB5ID0gcVsxXSwgeiA9IHFbMl0sIHcgPSBxWzNdLFxuICAgICAgICB4MiA9IHggKyB4LFxuICAgICAgICB5MiA9IHkgKyB5LFxuICAgICAgICB6MiA9IHogKyB6LFxuXG4gICAgICAgIHh4ID0geCAqIHgyLFxuICAgICAgICB4eSA9IHggKiB5MixcbiAgICAgICAgeHogPSB4ICogejIsXG4gICAgICAgIHl5ID0geSAqIHkyLFxuICAgICAgICB5eiA9IHkgKiB6MixcbiAgICAgICAgenogPSB6ICogejIsXG4gICAgICAgIHd4ID0gdyAqIHgyLFxuICAgICAgICB3eSA9IHcgKiB5MixcbiAgICAgICAgd3ogPSB3ICogejI7XG5cbiAgICBvdXRbMF0gPSAxIC0gKHl5ICsgenopO1xuICAgIG91dFsxXSA9IHh5ICsgd3o7XG4gICAgb3V0WzJdID0geHogLSB3eTtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IHh5IC0gd3o7XG4gICAgb3V0WzVdID0gMSAtICh4eCArIHp6KTtcbiAgICBvdXRbNl0gPSB5eiArIHd4O1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0geHogKyB3eTtcbiAgICBvdXRbOV0gPSB5eiAtIHd4O1xuICAgIG91dFsxMF0gPSAxIC0gKHh4ICsgeXkpO1xuICAgIG91dFsxMV0gPSAwO1xuICAgIG91dFsxMl0gPSB2WzBdO1xuICAgIG91dFsxM10gPSB2WzFdO1xuICAgIG91dFsxNF0gPSB2WzJdO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIFxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXRyaXggZnJvbSBhIHF1YXRlcm5pb24gcm90YXRpb24sIHZlY3RvciB0cmFuc2xhdGlvbiBhbmQgdmVjdG9yIHNjYWxlXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0NC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQ0LnRyYW5zbGF0ZShkZXN0LCB2ZWMpO1xuICogICAgIHZhciBxdWF0TWF0ID0gbWF0NC5jcmVhdGUoKTtcbiAqICAgICBxdWF0NC50b01hdDQocXVhdCwgcXVhdE1hdCk7XG4gKiAgICAgbWF0NC5tdWx0aXBseShkZXN0LCBxdWF0TWF0KTtcbiAqICAgICBtYXQ0LnNjYWxlKGRlc3QsIHNjYWxlKVxuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7cXVhdDR9IHEgUm90YXRpb24gcXVhdGVybmlvblxuICogQHBhcmFtIHt2ZWMzfSB2IFRyYW5zbGF0aW9uIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBzIFNjYWxpbmcgdmVjdG9yXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuZnJvbVJvdGF0aW9uVHJhbnNsYXRpb25TY2FsZSA9IGZ1bmN0aW9uIChvdXQsIHEsIHYsIHMpIHtcbiAgICAvLyBRdWF0ZXJuaW9uIG1hdGhcbiAgICB2YXIgeCA9IHFbMF0sIHkgPSBxWzFdLCB6ID0gcVsyXSwgdyA9IHFbM10sXG4gICAgICAgIHgyID0geCArIHgsXG4gICAgICAgIHkyID0geSArIHksXG4gICAgICAgIHoyID0geiArIHosXG5cbiAgICAgICAgeHggPSB4ICogeDIsXG4gICAgICAgIHh5ID0geCAqIHkyLFxuICAgICAgICB4eiA9IHggKiB6MixcbiAgICAgICAgeXkgPSB5ICogeTIsXG4gICAgICAgIHl6ID0geSAqIHoyLFxuICAgICAgICB6eiA9IHogKiB6MixcbiAgICAgICAgd3ggPSB3ICogeDIsXG4gICAgICAgIHd5ID0gdyAqIHkyLFxuICAgICAgICB3eiA9IHcgKiB6MixcbiAgICAgICAgc3ggPSBzWzBdLFxuICAgICAgICBzeSA9IHNbMV0sXG4gICAgICAgIHN6ID0gc1syXTtcblxuICAgIG91dFswXSA9ICgxIC0gKHl5ICsgenopKSAqIHN4O1xuICAgIG91dFsxXSA9ICh4eSArIHd6KSAqIHN4O1xuICAgIG91dFsyXSA9ICh4eiAtIHd5KSAqIHN4O1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0gKHh5IC0gd3opICogc3k7XG4gICAgb3V0WzVdID0gKDEgLSAoeHggKyB6eikpICogc3k7XG4gICAgb3V0WzZdID0gKHl6ICsgd3gpICogc3k7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSAoeHogKyB3eSkgKiBzejtcbiAgICBvdXRbOV0gPSAoeXogLSB3eCkgKiBzejtcbiAgICBvdXRbMTBdID0gKDEgLSAoeHggKyB5eSkpICogc3o7XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IHZbMF07XG4gICAgb3V0WzEzXSA9IHZbMV07XG4gICAgb3V0WzE0XSA9IHZbMl07XG4gICAgb3V0WzE1XSA9IDE7XG4gICAgXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hdHJpeCBmcm9tIGEgcXVhdGVybmlvbiByb3RhdGlvbiwgdmVjdG9yIHRyYW5zbGF0aW9uIGFuZCB2ZWN0b3Igc2NhbGUsIHJvdGF0aW5nIGFuZCBzY2FsaW5nIGFyb3VuZCB0aGUgZ2l2ZW4gb3JpZ2luXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gKGJ1dCBtdWNoIGZhc3RlciB0aGFuKTpcbiAqXG4gKiAgICAgbWF0NC5pZGVudGl0eShkZXN0KTtcbiAqICAgICBtYXQ0LnRyYW5zbGF0ZShkZXN0LCB2ZWMpO1xuICogICAgIG1hdDQudHJhbnNsYXRlKGRlc3QsIG9yaWdpbik7XG4gKiAgICAgdmFyIHF1YXRNYXQgPSBtYXQ0LmNyZWF0ZSgpO1xuICogICAgIHF1YXQ0LnRvTWF0NChxdWF0LCBxdWF0TWF0KTtcbiAqICAgICBtYXQ0Lm11bHRpcGx5KGRlc3QsIHF1YXRNYXQpO1xuICogICAgIG1hdDQuc2NhbGUoZGVzdCwgc2NhbGUpXG4gKiAgICAgbWF0NC50cmFuc2xhdGUoZGVzdCwgbmVnYXRpdmVPcmlnaW4pO1xuICpcbiAqIEBwYXJhbSB7bWF0NH0gb3V0IG1hdDQgcmVjZWl2aW5nIG9wZXJhdGlvbiByZXN1bHRcbiAqIEBwYXJhbSB7cXVhdDR9IHEgUm90YXRpb24gcXVhdGVybmlvblxuICogQHBhcmFtIHt2ZWMzfSB2IFRyYW5zbGF0aW9uIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBzIFNjYWxpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IG8gVGhlIG9yaWdpbiB2ZWN0b3IgYXJvdW5kIHdoaWNoIHRvIHNjYWxlIGFuZCByb3RhdGVcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5mcm9tUm90YXRpb25UcmFuc2xhdGlvblNjYWxlT3JpZ2luID0gZnVuY3Rpb24gKG91dCwgcSwgdiwgcywgbykge1xuICAvLyBRdWF0ZXJuaW9uIG1hdGhcbiAgdmFyIHggPSBxWzBdLCB5ID0gcVsxXSwgeiA9IHFbMl0sIHcgPSBxWzNdLFxuICAgICAgeDIgPSB4ICsgeCxcbiAgICAgIHkyID0geSArIHksXG4gICAgICB6MiA9IHogKyB6LFxuXG4gICAgICB4eCA9IHggKiB4MixcbiAgICAgIHh5ID0geCAqIHkyLFxuICAgICAgeHogPSB4ICogejIsXG4gICAgICB5eSA9IHkgKiB5MixcbiAgICAgIHl6ID0geSAqIHoyLFxuICAgICAgenogPSB6ICogejIsXG4gICAgICB3eCA9IHcgKiB4MixcbiAgICAgIHd5ID0gdyAqIHkyLFxuICAgICAgd3ogPSB3ICogejIsXG4gICAgICBcbiAgICAgIHN4ID0gc1swXSxcbiAgICAgIHN5ID0gc1sxXSxcbiAgICAgIHN6ID0gc1syXSxcblxuICAgICAgb3ggPSBvWzBdLFxuICAgICAgb3kgPSBvWzFdLFxuICAgICAgb3ogPSBvWzJdO1xuICAgICAgXG4gIG91dFswXSA9ICgxIC0gKHl5ICsgenopKSAqIHN4O1xuICBvdXRbMV0gPSAoeHkgKyB3eikgKiBzeDtcbiAgb3V0WzJdID0gKHh6IC0gd3kpICogc3g7XG4gIG91dFszXSA9IDA7XG4gIG91dFs0XSA9ICh4eSAtIHd6KSAqIHN5O1xuICBvdXRbNV0gPSAoMSAtICh4eCArIHp6KSkgKiBzeTtcbiAgb3V0WzZdID0gKHl6ICsgd3gpICogc3k7XG4gIG91dFs3XSA9IDA7XG4gIG91dFs4XSA9ICh4eiArIHd5KSAqIHN6O1xuICBvdXRbOV0gPSAoeXogLSB3eCkgKiBzejtcbiAgb3V0WzEwXSA9ICgxIC0gKHh4ICsgeXkpKSAqIHN6O1xuICBvdXRbMTFdID0gMDtcbiAgb3V0WzEyXSA9IHZbMF0gKyBveCAtIChvdXRbMF0gKiBveCArIG91dFs0XSAqIG95ICsgb3V0WzhdICogb3opO1xuICBvdXRbMTNdID0gdlsxXSArIG95IC0gKG91dFsxXSAqIG94ICsgb3V0WzVdICogb3kgKyBvdXRbOV0gKiBveik7XG4gIG91dFsxNF0gPSB2WzJdICsgb3ogLSAob3V0WzJdICogb3ggKyBvdXRbNl0gKiBveSArIG91dFsxMF0gKiBveik7XG4gIG91dFsxNV0gPSAxO1xuICAgICAgICBcbiAgcmV0dXJuIG91dDtcbn07XG5cbm1hdDQuZnJvbVF1YXQgPSBmdW5jdGlvbiAob3V0LCBxKSB7XG4gICAgdmFyIHggPSBxWzBdLCB5ID0gcVsxXSwgeiA9IHFbMl0sIHcgPSBxWzNdLFxuICAgICAgICB4MiA9IHggKyB4LFxuICAgICAgICB5MiA9IHkgKyB5LFxuICAgICAgICB6MiA9IHogKyB6LFxuXG4gICAgICAgIHh4ID0geCAqIHgyLFxuICAgICAgICB5eCA9IHkgKiB4MixcbiAgICAgICAgeXkgPSB5ICogeTIsXG4gICAgICAgIHp4ID0geiAqIHgyLFxuICAgICAgICB6eSA9IHogKiB5MixcbiAgICAgICAgenogPSB6ICogejIsXG4gICAgICAgIHd4ID0gdyAqIHgyLFxuICAgICAgICB3eSA9IHcgKiB5MixcbiAgICAgICAgd3ogPSB3ICogejI7XG5cbiAgICBvdXRbMF0gPSAxIC0geXkgLSB6ejtcbiAgICBvdXRbMV0gPSB5eCArIHd6O1xuICAgIG91dFsyXSA9IHp4IC0gd3k7XG4gICAgb3V0WzNdID0gMDtcblxuICAgIG91dFs0XSA9IHl4IC0gd3o7XG4gICAgb3V0WzVdID0gMSAtIHh4IC0geno7XG4gICAgb3V0WzZdID0genkgKyB3eDtcbiAgICBvdXRbN10gPSAwO1xuXG4gICAgb3V0WzhdID0genggKyB3eTtcbiAgICBvdXRbOV0gPSB6eSAtIHd4O1xuICAgIG91dFsxMF0gPSAxIC0geHggLSB5eTtcbiAgICBvdXRbMTFdID0gMDtcblxuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAwO1xuICAgIG91dFsxNV0gPSAxO1xuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgZnJ1c3R1bSBtYXRyaXggd2l0aCB0aGUgZ2l2ZW4gYm91bmRzXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCBmcnVzdHVtIG1hdHJpeCB3aWxsIGJlIHdyaXR0ZW4gaW50b1xuICogQHBhcmFtIHtOdW1iZXJ9IGxlZnQgTGVmdCBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtOdW1iZXJ9IHJpZ2h0IFJpZ2h0IGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge051bWJlcn0gYm90dG9tIEJvdHRvbSBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtOdW1iZXJ9IHRvcCBUb3AgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7TnVtYmVyfSBuZWFyIE5lYXIgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7TnVtYmVyfSBmYXIgRmFyIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQuZnJ1c3R1bSA9IGZ1bmN0aW9uIChvdXQsIGxlZnQsIHJpZ2h0LCBib3R0b20sIHRvcCwgbmVhciwgZmFyKSB7XG4gICAgdmFyIHJsID0gMSAvIChyaWdodCAtIGxlZnQpLFxuICAgICAgICB0YiA9IDEgLyAodG9wIC0gYm90dG9tKSxcbiAgICAgICAgbmYgPSAxIC8gKG5lYXIgLSBmYXIpO1xuICAgIG91dFswXSA9IChuZWFyICogMikgKiBybDtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IChuZWFyICogMikgKiB0YjtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gKHJpZ2h0ICsgbGVmdCkgKiBybDtcbiAgICBvdXRbOV0gPSAodG9wICsgYm90dG9tKSAqIHRiO1xuICAgIG91dFsxMF0gPSAoZmFyICsgbmVhcikgKiBuZjtcbiAgICBvdXRbMTFdID0gLTE7XG4gICAgb3V0WzEyXSA9IDA7XG4gICAgb3V0WzEzXSA9IDA7XG4gICAgb3V0WzE0XSA9IChmYXIgKiBuZWFyICogMikgKiBuZjtcbiAgICBvdXRbMTVdID0gMDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSBwZXJzcGVjdGl2ZSBwcm9qZWN0aW9uIG1hdHJpeCB3aXRoIHRoZSBnaXZlbiBib3VuZHNcbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IGZydXN0dW0gbWF0cml4IHdpbGwgYmUgd3JpdHRlbiBpbnRvXG4gKiBAcGFyYW0ge251bWJlcn0gZm92eSBWZXJ0aWNhbCBmaWVsZCBvZiB2aWV3IGluIHJhZGlhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSBhc3BlY3QgQXNwZWN0IHJhdGlvLiB0eXBpY2FsbHkgdmlld3BvcnQgd2lkdGgvaGVpZ2h0XG4gKiBAcGFyYW0ge251bWJlcn0gbmVhciBOZWFyIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge251bWJlcn0gZmFyIEZhciBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LnBlcnNwZWN0aXZlID0gZnVuY3Rpb24gKG91dCwgZm92eSwgYXNwZWN0LCBuZWFyLCBmYXIpIHtcbiAgICB2YXIgZiA9IDEuMCAvIE1hdGgudGFuKGZvdnkgLyAyKSxcbiAgICAgICAgbmYgPSAxIC8gKG5lYXIgLSBmYXIpO1xuICAgIG91dFswXSA9IGYgLyBhc3BlY3Q7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0gMDtcbiAgICBvdXRbNV0gPSBmO1xuICAgIG91dFs2XSA9IDA7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSAwO1xuICAgIG91dFs5XSA9IDA7XG4gICAgb3V0WzEwXSA9IChmYXIgKyBuZWFyKSAqIG5mO1xuICAgIG91dFsxMV0gPSAtMTtcbiAgICBvdXRbMTJdID0gMDtcbiAgICBvdXRbMTNdID0gMDtcbiAgICBvdXRbMTRdID0gKDIgKiBmYXIgKiBuZWFyKSAqIG5mO1xuICAgIG91dFsxNV0gPSAwO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHBlcnNwZWN0aXZlIHByb2plY3Rpb24gbWF0cml4IHdpdGggdGhlIGdpdmVuIGZpZWxkIG9mIHZpZXcuXG4gKiBUaGlzIGlzIHByaW1hcmlseSB1c2VmdWwgZm9yIGdlbmVyYXRpbmcgcHJvamVjdGlvbiBtYXRyaWNlcyB0byBiZSB1c2VkXG4gKiB3aXRoIHRoZSBzdGlsbCBleHBlcmllbWVudGFsIFdlYlZSIEFQSS5cbiAqXG4gKiBAcGFyYW0ge21hdDR9IG91dCBtYXQ0IGZydXN0dW0gbWF0cml4IHdpbGwgYmUgd3JpdHRlbiBpbnRvXG4gKiBAcGFyYW0ge251bWJlcn0gZm92IE9iamVjdCBjb250YWluaW5nIHRoZSBmb2xsb3dpbmcgdmFsdWVzOiB1cERlZ3JlZXMsIGRvd25EZWdyZWVzLCBsZWZ0RGVncmVlcywgcmlnaHREZWdyZWVzXG4gKiBAcGFyYW0ge251bWJlcn0gbmVhciBOZWFyIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge251bWJlcn0gZmFyIEZhciBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHJldHVybnMge21hdDR9IG91dFxuICovXG5tYXQ0LnBlcnNwZWN0aXZlRnJvbUZpZWxkT2ZWaWV3ID0gZnVuY3Rpb24gKG91dCwgZm92LCBuZWFyLCBmYXIpIHtcbiAgICB2YXIgdXBUYW4gPSBNYXRoLnRhbihmb3YudXBEZWdyZWVzICogTWF0aC5QSS8xODAuMCksXG4gICAgICAgIGRvd25UYW4gPSBNYXRoLnRhbihmb3YuZG93bkRlZ3JlZXMgKiBNYXRoLlBJLzE4MC4wKSxcbiAgICAgICAgbGVmdFRhbiA9IE1hdGgudGFuKGZvdi5sZWZ0RGVncmVlcyAqIE1hdGguUEkvMTgwLjApLFxuICAgICAgICByaWdodFRhbiA9IE1hdGgudGFuKGZvdi5yaWdodERlZ3JlZXMgKiBNYXRoLlBJLzE4MC4wKSxcbiAgICAgICAgeFNjYWxlID0gMi4wIC8gKGxlZnRUYW4gKyByaWdodFRhbiksXG4gICAgICAgIHlTY2FsZSA9IDIuMCAvICh1cFRhbiArIGRvd25UYW4pO1xuXG4gICAgb3V0WzBdID0geFNjYWxlO1xuICAgIG91dFsxXSA9IDAuMDtcbiAgICBvdXRbMl0gPSAwLjA7XG4gICAgb3V0WzNdID0gMC4wO1xuICAgIG91dFs0XSA9IDAuMDtcbiAgICBvdXRbNV0gPSB5U2NhbGU7XG4gICAgb3V0WzZdID0gMC4wO1xuICAgIG91dFs3XSA9IDAuMDtcbiAgICBvdXRbOF0gPSAtKChsZWZ0VGFuIC0gcmlnaHRUYW4pICogeFNjYWxlICogMC41KTtcbiAgICBvdXRbOV0gPSAoKHVwVGFuIC0gZG93blRhbikgKiB5U2NhbGUgKiAwLjUpO1xuICAgIG91dFsxMF0gPSBmYXIgLyAobmVhciAtIGZhcik7XG4gICAgb3V0WzExXSA9IC0xLjA7XG4gICAgb3V0WzEyXSA9IDAuMDtcbiAgICBvdXRbMTNdID0gMC4wO1xuICAgIG91dFsxNF0gPSAoZmFyICogbmVhcikgLyAobmVhciAtIGZhcik7XG4gICAgb3V0WzE1XSA9IDAuMDtcbiAgICByZXR1cm4gb3V0O1xufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhIG9ydGhvZ29uYWwgcHJvamVjdGlvbiBtYXRyaXggd2l0aCB0aGUgZ2l2ZW4gYm91bmRzXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCBmcnVzdHVtIG1hdHJpeCB3aWxsIGJlIHdyaXR0ZW4gaW50b1xuICogQHBhcmFtIHtudW1iZXJ9IGxlZnQgTGVmdCBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtudW1iZXJ9IHJpZ2h0IFJpZ2h0IGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcGFyYW0ge251bWJlcn0gYm90dG9tIEJvdHRvbSBib3VuZCBvZiB0aGUgZnJ1c3R1bVxuICogQHBhcmFtIHtudW1iZXJ9IHRvcCBUb3AgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7bnVtYmVyfSBuZWFyIE5lYXIgYm91bmQgb2YgdGhlIGZydXN0dW1cbiAqIEBwYXJhbSB7bnVtYmVyfSBmYXIgRmFyIGJvdW5kIG9mIHRoZSBmcnVzdHVtXG4gKiBAcmV0dXJucyB7bWF0NH0gb3V0XG4gKi9cbm1hdDQub3J0aG8gPSBmdW5jdGlvbiAob3V0LCBsZWZ0LCByaWdodCwgYm90dG9tLCB0b3AsIG5lYXIsIGZhcikge1xuICAgIHZhciBsciA9IDEgLyAobGVmdCAtIHJpZ2h0KSxcbiAgICAgICAgYnQgPSAxIC8gKGJvdHRvbSAtIHRvcCksXG4gICAgICAgIG5mID0gMSAvIChuZWFyIC0gZmFyKTtcbiAgICBvdXRbMF0gPSAtMiAqIGxyO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gLTIgKiBidDtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMDtcbiAgICBvdXRbOV0gPSAwO1xuICAgIG91dFsxMF0gPSAyICogbmY7XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IChsZWZ0ICsgcmlnaHQpICogbHI7XG4gICAgb3V0WzEzXSA9ICh0b3AgKyBib3R0b20pICogYnQ7XG4gICAgb3V0WzE0XSA9IChmYXIgKyBuZWFyKSAqIG5mO1xuICAgIG91dFsxNV0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlcyBhIGxvb2stYXQgbWF0cml4IHdpdGggdGhlIGdpdmVuIGV5ZSBwb3NpdGlvbiwgZm9jYWwgcG9pbnQsIGFuZCB1cCBheGlzXG4gKlxuICogQHBhcmFtIHttYXQ0fSBvdXQgbWF0NCBmcnVzdHVtIG1hdHJpeCB3aWxsIGJlIHdyaXR0ZW4gaW50b1xuICogQHBhcmFtIHt2ZWMzfSBleWUgUG9zaXRpb24gb2YgdGhlIHZpZXdlclxuICogQHBhcmFtIHt2ZWMzfSBjZW50ZXIgUG9pbnQgdGhlIHZpZXdlciBpcyBsb29raW5nIGF0XG4gKiBAcGFyYW0ge3ZlYzN9IHVwIHZlYzMgcG9pbnRpbmcgdXBcbiAqIEByZXR1cm5zIHttYXQ0fSBvdXRcbiAqL1xubWF0NC5sb29rQXQgPSBmdW5jdGlvbiAob3V0LCBleWUsIGNlbnRlciwgdXApIHtcbiAgICB2YXIgeDAsIHgxLCB4MiwgeTAsIHkxLCB5MiwgejAsIHoxLCB6MiwgbGVuLFxuICAgICAgICBleWV4ID0gZXllWzBdLFxuICAgICAgICBleWV5ID0gZXllWzFdLFxuICAgICAgICBleWV6ID0gZXllWzJdLFxuICAgICAgICB1cHggPSB1cFswXSxcbiAgICAgICAgdXB5ID0gdXBbMV0sXG4gICAgICAgIHVweiA9IHVwWzJdLFxuICAgICAgICBjZW50ZXJ4ID0gY2VudGVyWzBdLFxuICAgICAgICBjZW50ZXJ5ID0gY2VudGVyWzFdLFxuICAgICAgICBjZW50ZXJ6ID0gY2VudGVyWzJdO1xuXG4gICAgaWYgKE1hdGguYWJzKGV5ZXggLSBjZW50ZXJ4KSA8IGdsTWF0cml4LkVQU0lMT04gJiZcbiAgICAgICAgTWF0aC5hYnMoZXlleSAtIGNlbnRlcnkpIDwgZ2xNYXRyaXguRVBTSUxPTiAmJlxuICAgICAgICBNYXRoLmFicyhleWV6IC0gY2VudGVyeikgPCBnbE1hdHJpeC5FUFNJTE9OKSB7XG4gICAgICAgIHJldHVybiBtYXQ0LmlkZW50aXR5KG91dCk7XG4gICAgfVxuXG4gICAgejAgPSBleWV4IC0gY2VudGVyeDtcbiAgICB6MSA9IGV5ZXkgLSBjZW50ZXJ5O1xuICAgIHoyID0gZXlleiAtIGNlbnRlcno7XG5cbiAgICBsZW4gPSAxIC8gTWF0aC5zcXJ0KHowICogejAgKyB6MSAqIHoxICsgejIgKiB6Mik7XG4gICAgejAgKj0gbGVuO1xuICAgIHoxICo9IGxlbjtcbiAgICB6MiAqPSBsZW47XG5cbiAgICB4MCA9IHVweSAqIHoyIC0gdXB6ICogejE7XG4gICAgeDEgPSB1cHogKiB6MCAtIHVweCAqIHoyO1xuICAgIHgyID0gdXB4ICogejEgLSB1cHkgKiB6MDtcbiAgICBsZW4gPSBNYXRoLnNxcnQoeDAgKiB4MCArIHgxICogeDEgKyB4MiAqIHgyKTtcbiAgICBpZiAoIWxlbikge1xuICAgICAgICB4MCA9IDA7XG4gICAgICAgIHgxID0gMDtcbiAgICAgICAgeDIgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGxlbiA9IDEgLyBsZW47XG4gICAgICAgIHgwICo9IGxlbjtcbiAgICAgICAgeDEgKj0gbGVuO1xuICAgICAgICB4MiAqPSBsZW47XG4gICAgfVxuXG4gICAgeTAgPSB6MSAqIHgyIC0gejIgKiB4MTtcbiAgICB5MSA9IHoyICogeDAgLSB6MCAqIHgyO1xuICAgIHkyID0gejAgKiB4MSAtIHoxICogeDA7XG5cbiAgICBsZW4gPSBNYXRoLnNxcnQoeTAgKiB5MCArIHkxICogeTEgKyB5MiAqIHkyKTtcbiAgICBpZiAoIWxlbikge1xuICAgICAgICB5MCA9IDA7XG4gICAgICAgIHkxID0gMDtcbiAgICAgICAgeTIgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGxlbiA9IDEgLyBsZW47XG4gICAgICAgIHkwICo9IGxlbjtcbiAgICAgICAgeTEgKj0gbGVuO1xuICAgICAgICB5MiAqPSBsZW47XG4gICAgfVxuXG4gICAgb3V0WzBdID0geDA7XG4gICAgb3V0WzFdID0geTA7XG4gICAgb3V0WzJdID0gejA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSB4MTtcbiAgICBvdXRbNV0gPSB5MTtcbiAgICBvdXRbNl0gPSB6MTtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IHgyO1xuICAgIG91dFs5XSA9IHkyO1xuICAgIG91dFsxMF0gPSB6MjtcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gLSh4MCAqIGV5ZXggKyB4MSAqIGV5ZXkgKyB4MiAqIGV5ZXopO1xuICAgIG91dFsxM10gPSAtKHkwICogZXlleCArIHkxICogZXlleSArIHkyICogZXlleik7XG4gICAgb3V0WzE0XSA9IC0oejAgKiBleWV4ICsgejEgKiBleWV5ICsgejIgKiBleWV6KTtcbiAgICBvdXRbMTVdID0gMTtcblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBtYXQ0XG4gKlxuICogQHBhcmFtIHttYXQ0fSBtYXQgbWF0cml4IHRvIHJlcHJlc2VudCBhcyBhIHN0cmluZ1xuICogQHJldHVybnMge1N0cmluZ30gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBtYXRyaXhcbiAqL1xubWF0NC5zdHIgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiAnbWF0NCgnICsgYVswXSArICcsICcgKyBhWzFdICsgJywgJyArIGFbMl0gKyAnLCAnICsgYVszXSArICcsICcgK1xuICAgICAgICAgICAgICAgICAgICBhWzRdICsgJywgJyArIGFbNV0gKyAnLCAnICsgYVs2XSArICcsICcgKyBhWzddICsgJywgJyArXG4gICAgICAgICAgICAgICAgICAgIGFbOF0gKyAnLCAnICsgYVs5XSArICcsICcgKyBhWzEwXSArICcsICcgKyBhWzExXSArICcsICcgKyBcbiAgICAgICAgICAgICAgICAgICAgYVsxMl0gKyAnLCAnICsgYVsxM10gKyAnLCAnICsgYVsxNF0gKyAnLCAnICsgYVsxNV0gKyAnKSc7XG59O1xuXG4vKipcbiAqIFJldHVybnMgRnJvYmVuaXVzIG5vcm0gb2YgYSBtYXQ0XG4gKlxuICogQHBhcmFtIHttYXQ0fSBhIHRoZSBtYXRyaXggdG8gY2FsY3VsYXRlIEZyb2Jlbml1cyBub3JtIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBGcm9iZW5pdXMgbm9ybVxuICovXG5tYXQ0LmZyb2IgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybihNYXRoLnNxcnQoTWF0aC5wb3coYVswXSwgMikgKyBNYXRoLnBvdyhhWzFdLCAyKSArIE1hdGgucG93KGFbMl0sIDIpICsgTWF0aC5wb3coYVszXSwgMikgKyBNYXRoLnBvdyhhWzRdLCAyKSArIE1hdGgucG93KGFbNV0sIDIpICsgTWF0aC5wb3coYVs2XSwgMikgKyBNYXRoLnBvdyhhWzddLCAyKSArIE1hdGgucG93KGFbOF0sIDIpICsgTWF0aC5wb3coYVs5XSwgMikgKyBNYXRoLnBvdyhhWzEwXSwgMikgKyBNYXRoLnBvdyhhWzExXSwgMikgKyBNYXRoLnBvdyhhWzEyXSwgMikgKyBNYXRoLnBvdyhhWzEzXSwgMikgKyBNYXRoLnBvdyhhWzE0XSwgMikgKyBNYXRoLnBvdyhhWzE1XSwgMikgKSlcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBtYXQ0O1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvbWF0NC5qc1xuICoqIG1vZHVsZSBpZCA9IDlcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qIENvcHlyaWdodCAoYykgMjAxNSwgQnJhbmRvbiBKb25lcywgQ29saW4gTWFjS2VuemllIElWLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuICovXG5cbnZhciBnbE1hdHJpeCA9IHJlcXVpcmUoXCIuL2NvbW1vbi5qc1wiKTtcbnZhciBtYXQzID0gcmVxdWlyZShcIi4vbWF0My5qc1wiKTtcbnZhciB2ZWMzID0gcmVxdWlyZShcIi4vdmVjMy5qc1wiKTtcbnZhciB2ZWM0ID0gcmVxdWlyZShcIi4vdmVjNC5qc1wiKTtcblxuLyoqXG4gKiBAY2xhc3MgUXVhdGVybmlvblxuICogQG5hbWUgcXVhdFxuICovXG52YXIgcXVhdCA9IHt9O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaWRlbnRpdHkgcXVhdFxuICpcbiAqIEByZXR1cm5zIHtxdWF0fSBhIG5ldyBxdWF0ZXJuaW9uXG4gKi9cbnF1YXQuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDQpO1xuICAgIG91dFswXSA9IDA7XG4gICAgb3V0WzFdID0gMDtcbiAgICBvdXRbMl0gPSAwO1xuICAgIG91dFszXSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2V0cyBhIHF1YXRlcm5pb24gdG8gcmVwcmVzZW50IHRoZSBzaG9ydGVzdCByb3RhdGlvbiBmcm9tIG9uZVxuICogdmVjdG9yIHRvIGFub3RoZXIuXG4gKlxuICogQm90aCB2ZWN0b3JzIGFyZSBhc3N1bWVkIHRvIGJlIHVuaXQgbGVuZ3RoLlxuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvbi5cbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgaW5pdGlhbCB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgZGVzdGluYXRpb24gdmVjdG9yXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKi9cbnF1YXQucm90YXRpb25UbyA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgdG1wdmVjMyA9IHZlYzMuY3JlYXRlKCk7XG4gICAgdmFyIHhVbml0VmVjMyA9IHZlYzMuZnJvbVZhbHVlcygxLDAsMCk7XG4gICAgdmFyIHlVbml0VmVjMyA9IHZlYzMuZnJvbVZhbHVlcygwLDEsMCk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgICAgIHZhciBkb3QgPSB2ZWMzLmRvdChhLCBiKTtcbiAgICAgICAgaWYgKGRvdCA8IC0wLjk5OTk5OSkge1xuICAgICAgICAgICAgdmVjMy5jcm9zcyh0bXB2ZWMzLCB4VW5pdFZlYzMsIGEpO1xuICAgICAgICAgICAgaWYgKHZlYzMubGVuZ3RoKHRtcHZlYzMpIDwgMC4wMDAwMDEpXG4gICAgICAgICAgICAgICAgdmVjMy5jcm9zcyh0bXB2ZWMzLCB5VW5pdFZlYzMsIGEpO1xuICAgICAgICAgICAgdmVjMy5ub3JtYWxpemUodG1wdmVjMywgdG1wdmVjMyk7XG4gICAgICAgICAgICBxdWF0LnNldEF4aXNBbmdsZShvdXQsIHRtcHZlYzMsIE1hdGguUEkpO1xuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfSBlbHNlIGlmIChkb3QgPiAwLjk5OTk5OSkge1xuICAgICAgICAgICAgb3V0WzBdID0gMDtcbiAgICAgICAgICAgIG91dFsxXSA9IDA7XG4gICAgICAgICAgICBvdXRbMl0gPSAwO1xuICAgICAgICAgICAgb3V0WzNdID0gMTtcbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2ZWMzLmNyb3NzKHRtcHZlYzMsIGEsIGIpO1xuICAgICAgICAgICAgb3V0WzBdID0gdG1wdmVjM1swXTtcbiAgICAgICAgICAgIG91dFsxXSA9IHRtcHZlYzNbMV07XG4gICAgICAgICAgICBvdXRbMl0gPSB0bXB2ZWMzWzJdO1xuICAgICAgICAgICAgb3V0WzNdID0gMSArIGRvdDtcbiAgICAgICAgICAgIHJldHVybiBxdWF0Lm5vcm1hbGl6ZShvdXQsIG91dCk7XG4gICAgICAgIH1cbiAgICB9O1xufSkoKTtcblxuLyoqXG4gKiBTZXRzIHRoZSBzcGVjaWZpZWQgcXVhdGVybmlvbiB3aXRoIHZhbHVlcyBjb3JyZXNwb25kaW5nIHRvIHRoZSBnaXZlblxuICogYXhlcy4gRWFjaCBheGlzIGlzIGEgdmVjMyBhbmQgaXMgZXhwZWN0ZWQgdG8gYmUgdW5pdCBsZW5ndGggYW5kXG4gKiBwZXJwZW5kaWN1bGFyIHRvIGFsbCBvdGhlciBzcGVjaWZpZWQgYXhlcy5cbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IHZpZXcgIHRoZSB2ZWN0b3IgcmVwcmVzZW50aW5nIHRoZSB2aWV3aW5nIGRpcmVjdGlvblxuICogQHBhcmFtIHt2ZWMzfSByaWdodCB0aGUgdmVjdG9yIHJlcHJlc2VudGluZyB0aGUgbG9jYWwgXCJyaWdodFwiIGRpcmVjdGlvblxuICogQHBhcmFtIHt2ZWMzfSB1cCAgICB0aGUgdmVjdG9yIHJlcHJlc2VudGluZyB0aGUgbG9jYWwgXCJ1cFwiIGRpcmVjdGlvblxuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0LnNldEF4ZXMgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1hdHIgPSBtYXQzLmNyZWF0ZSgpO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKG91dCwgdmlldywgcmlnaHQsIHVwKSB7XG4gICAgICAgIG1hdHJbMF0gPSByaWdodFswXTtcbiAgICAgICAgbWF0clszXSA9IHJpZ2h0WzFdO1xuICAgICAgICBtYXRyWzZdID0gcmlnaHRbMl07XG5cbiAgICAgICAgbWF0clsxXSA9IHVwWzBdO1xuICAgICAgICBtYXRyWzRdID0gdXBbMV07XG4gICAgICAgIG1hdHJbN10gPSB1cFsyXTtcblxuICAgICAgICBtYXRyWzJdID0gLXZpZXdbMF07XG4gICAgICAgIG1hdHJbNV0gPSAtdmlld1sxXTtcbiAgICAgICAgbWF0cls4XSA9IC12aWV3WzJdO1xuXG4gICAgICAgIHJldHVybiBxdWF0Lm5vcm1hbGl6ZShvdXQsIHF1YXQuZnJvbU1hdDMob3V0LCBtYXRyKSk7XG4gICAgfTtcbn0pKCk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBxdWF0IGluaXRpYWxpemVkIHdpdGggdmFsdWVzIGZyb20gYW4gZXhpc3RpbmcgcXVhdGVybmlvblxuICpcbiAqIEBwYXJhbSB7cXVhdH0gYSBxdWF0ZXJuaW9uIHRvIGNsb25lXG4gKiBAcmV0dXJucyB7cXVhdH0gYSBuZXcgcXVhdGVybmlvblxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQuY2xvbmUgPSB2ZWM0LmNsb25lO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgcXVhdCBpbml0aWFsaXplZCB3aXRoIHRoZSBnaXZlbiB2YWx1ZXNcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgWSBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFogY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0gdyBXIGNvbXBvbmVudFxuICogQHJldHVybnMge3F1YXR9IGEgbmV3IHF1YXRlcm5pb25cbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LmZyb21WYWx1ZXMgPSB2ZWM0LmZyb21WYWx1ZXM7XG5cbi8qKlxuICogQ29weSB0aGUgdmFsdWVzIGZyb20gb25lIHF1YXQgdG8gYW5vdGhlclxuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHtxdWF0fSBhIHRoZSBzb3VyY2UgcXVhdGVybmlvblxuICogQHJldHVybnMge3F1YXR9IG91dFxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQuY29weSA9IHZlYzQuY29weTtcblxuLyoqXG4gKiBTZXQgdGhlIGNvbXBvbmVudHMgb2YgYSBxdWF0IHRvIHRoZSBnaXZlbiB2YWx1ZXNcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFggY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geSBZIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHogWiBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB3IFcgY29tcG9uZW50XG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5zZXQgPSB2ZWM0LnNldDtcblxuLyoqXG4gKiBTZXQgYSBxdWF0IHRvIHRoZSBpZGVudGl0eSBxdWF0ZXJuaW9uXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKi9cbnF1YXQuaWRlbnRpdHkgPSBmdW5jdGlvbihvdXQpIHtcbiAgICBvdXRbMF0gPSAwO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNldHMgYSBxdWF0IGZyb20gdGhlIGdpdmVuIGFuZ2xlIGFuZCByb3RhdGlvbiBheGlzLFxuICogdGhlbiByZXR1cm5zIGl0LlxuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHt2ZWMzfSBheGlzIHRoZSBheGlzIGFyb3VuZCB3aGljaCB0byByb3RhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIGluIHJhZGlhbnNcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqKi9cbnF1YXQuc2V0QXhpc0FuZ2xlID0gZnVuY3Rpb24ob3V0LCBheGlzLCByYWQpIHtcbiAgICByYWQgPSByYWQgKiAwLjU7XG4gICAgdmFyIHMgPSBNYXRoLnNpbihyYWQpO1xuICAgIG91dFswXSA9IHMgKiBheGlzWzBdO1xuICAgIG91dFsxXSA9IHMgKiBheGlzWzFdO1xuICAgIG91dFsyXSA9IHMgKiBheGlzWzJdO1xuICAgIG91dFszXSA9IE1hdGguY29zKHJhZCk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWRkcyB0d28gcXVhdCdzXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3F1YXR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7cXVhdH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LmFkZCA9IHZlYzQuYWRkO1xuXG4vKipcbiAqIE11bHRpcGxpZXMgdHdvIHF1YXQnc1xuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHtxdWF0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3F1YXR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKi9cbnF1YXQubXVsdGlwbHkgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICB2YXIgYXggPSBhWzBdLCBheSA9IGFbMV0sIGF6ID0gYVsyXSwgYXcgPSBhWzNdLFxuICAgICAgICBieCA9IGJbMF0sIGJ5ID0gYlsxXSwgYnogPSBiWzJdLCBidyA9IGJbM107XG5cbiAgICBvdXRbMF0gPSBheCAqIGJ3ICsgYXcgKiBieCArIGF5ICogYnogLSBheiAqIGJ5O1xuICAgIG91dFsxXSA9IGF5ICogYncgKyBhdyAqIGJ5ICsgYXogKiBieCAtIGF4ICogYno7XG4gICAgb3V0WzJdID0gYXogKiBidyArIGF3ICogYnogKyBheCAqIGJ5IC0gYXkgKiBieDtcbiAgICBvdXRbM10gPSBhdyAqIGJ3IC0gYXggKiBieCAtIGF5ICogYnkgLSBheiAqIGJ6O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgcXVhdC5tdWx0aXBseX1cbiAqIEBmdW5jdGlvblxuICovXG5xdWF0Lm11bCA9IHF1YXQubXVsdGlwbHk7XG5cbi8qKlxuICogU2NhbGVzIGEgcXVhdCBieSBhIHNjYWxhciBudW1iZXJcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHtxdWF0fSBhIHRoZSB2ZWN0b3IgdG8gc2NhbGVcbiAqIEBwYXJhbSB7TnVtYmVyfSBiIGFtb3VudCB0byBzY2FsZSB0aGUgdmVjdG9yIGJ5XG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5zY2FsZSA9IHZlYzQuc2NhbGU7XG5cbi8qKlxuICogUm90YXRlcyBhIHF1YXRlcm5pb24gYnkgdGhlIGdpdmVuIGFuZ2xlIGFib3V0IHRoZSBYIGF4aXNcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCBxdWF0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3F1YXR9IGEgcXVhdCB0byByb3RhdGVcbiAqIEBwYXJhbSB7bnVtYmVyfSByYWQgYW5nbGUgKGluIHJhZGlhbnMpIHRvIHJvdGF0ZVxuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0LnJvdGF0ZVggPSBmdW5jdGlvbiAob3V0LCBhLCByYWQpIHtcbiAgICByYWQgKj0gMC41OyBcblxuICAgIHZhciBheCA9IGFbMF0sIGF5ID0gYVsxXSwgYXogPSBhWzJdLCBhdyA9IGFbM10sXG4gICAgICAgIGJ4ID0gTWF0aC5zaW4ocmFkKSwgYncgPSBNYXRoLmNvcyhyYWQpO1xuXG4gICAgb3V0WzBdID0gYXggKiBidyArIGF3ICogYng7XG4gICAgb3V0WzFdID0gYXkgKiBidyArIGF6ICogYng7XG4gICAgb3V0WzJdID0gYXogKiBidyAtIGF5ICogYng7XG4gICAgb3V0WzNdID0gYXcgKiBidyAtIGF4ICogYng7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUm90YXRlcyBhIHF1YXRlcm5pb24gYnkgdGhlIGdpdmVuIGFuZ2xlIGFib3V0IHRoZSBZIGF4aXNcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCBxdWF0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3F1YXR9IGEgcXVhdCB0byByb3RhdGVcbiAqIEBwYXJhbSB7bnVtYmVyfSByYWQgYW5nbGUgKGluIHJhZGlhbnMpIHRvIHJvdGF0ZVxuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0LnJvdGF0ZVkgPSBmdW5jdGlvbiAob3V0LCBhLCByYWQpIHtcbiAgICByYWQgKj0gMC41OyBcblxuICAgIHZhciBheCA9IGFbMF0sIGF5ID0gYVsxXSwgYXogPSBhWzJdLCBhdyA9IGFbM10sXG4gICAgICAgIGJ5ID0gTWF0aC5zaW4ocmFkKSwgYncgPSBNYXRoLmNvcyhyYWQpO1xuXG4gICAgb3V0WzBdID0gYXggKiBidyAtIGF6ICogYnk7XG4gICAgb3V0WzFdID0gYXkgKiBidyArIGF3ICogYnk7XG4gICAgb3V0WzJdID0gYXogKiBidyArIGF4ICogYnk7XG4gICAgb3V0WzNdID0gYXcgKiBidyAtIGF5ICogYnk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUm90YXRlcyBhIHF1YXRlcm5pb24gYnkgdGhlIGdpdmVuIGFuZ2xlIGFib3V0IHRoZSBaIGF4aXNcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCBxdWF0IHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4gKiBAcGFyYW0ge3F1YXR9IGEgcXVhdCB0byByb3RhdGVcbiAqIEBwYXJhbSB7bnVtYmVyfSByYWQgYW5nbGUgKGluIHJhZGlhbnMpIHRvIHJvdGF0ZVxuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0LnJvdGF0ZVogPSBmdW5jdGlvbiAob3V0LCBhLCByYWQpIHtcbiAgICByYWQgKj0gMC41OyBcblxuICAgIHZhciBheCA9IGFbMF0sIGF5ID0gYVsxXSwgYXogPSBhWzJdLCBhdyA9IGFbM10sXG4gICAgICAgIGJ6ID0gTWF0aC5zaW4ocmFkKSwgYncgPSBNYXRoLmNvcyhyYWQpO1xuXG4gICAgb3V0WzBdID0gYXggKiBidyArIGF5ICogYno7XG4gICAgb3V0WzFdID0gYXkgKiBidyAtIGF4ICogYno7XG4gICAgb3V0WzJdID0gYXogKiBidyArIGF3ICogYno7XG4gICAgb3V0WzNdID0gYXcgKiBidyAtIGF6ICogYno7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgVyBjb21wb25lbnQgb2YgYSBxdWF0IGZyb20gdGhlIFgsIFksIGFuZCBaIGNvbXBvbmVudHMuXG4gKiBBc3N1bWVzIHRoYXQgcXVhdGVybmlvbiBpcyAxIHVuaXQgaW4gbGVuZ3RoLlxuICogQW55IGV4aXN0aW5nIFcgY29tcG9uZW50IHdpbGwgYmUgaWdub3JlZC5cbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSBxdWF0IHRvIGNhbGN1bGF0ZSBXIGNvbXBvbmVudCBvZlxuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0LmNhbGN1bGF0ZVcgPSBmdW5jdGlvbiAob3V0LCBhKSB7XG4gICAgdmFyIHggPSBhWzBdLCB5ID0gYVsxXSwgeiA9IGFbMl07XG5cbiAgICBvdXRbMF0gPSB4O1xuICAgIG91dFsxXSA9IHk7XG4gICAgb3V0WzJdID0gejtcbiAgICBvdXRbM10gPSBNYXRoLnNxcnQoTWF0aC5hYnMoMS4wIC0geCAqIHggLSB5ICogeSAtIHogKiB6KSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZG90IHByb2R1Y3Qgb2YgdHdvIHF1YXQnc1xuICpcbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHtxdWF0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gZG90IHByb2R1Y3Qgb2YgYSBhbmQgYlxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQuZG90ID0gdmVjNC5kb3Q7XG5cbi8qKlxuICogUGVyZm9ybXMgYSBsaW5lYXIgaW50ZXJwb2xhdGlvbiBiZXR3ZWVuIHR3byBxdWF0J3NcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IG91dCB0aGUgcmVjZWl2aW5nIHF1YXRlcm5pb25cbiAqIEBwYXJhbSB7cXVhdH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHtxdWF0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHtOdW1iZXJ9IHQgaW50ZXJwb2xhdGlvbiBhbW91bnQgYmV0d2VlbiB0aGUgdHdvIGlucHV0c1xuICogQHJldHVybnMge3F1YXR9IG91dFxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQubGVycCA9IHZlYzQubGVycDtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIHNwaGVyaWNhbCBsaW5lYXIgaW50ZXJwb2xhdGlvbiBiZXR3ZWVuIHR3byBxdWF0XG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge3F1YXR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7cXVhdH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSB0IGludGVycG9sYXRpb24gYW1vdW50IGJldHdlZW4gdGhlIHR3byBpbnB1dHNcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5zbGVycCA9IGZ1bmN0aW9uIChvdXQsIGEsIGIsIHQpIHtcbiAgICAvLyBiZW5jaG1hcmtzOlxuICAgIC8vICAgIGh0dHA6Ly9qc3BlcmYuY29tL3F1YXRlcm5pb24tc2xlcnAtaW1wbGVtZW50YXRpb25zXG5cbiAgICB2YXIgYXggPSBhWzBdLCBheSA9IGFbMV0sIGF6ID0gYVsyXSwgYXcgPSBhWzNdLFxuICAgICAgICBieCA9IGJbMF0sIGJ5ID0gYlsxXSwgYnogPSBiWzJdLCBidyA9IGJbM107XG5cbiAgICB2YXIgICAgICAgIG9tZWdhLCBjb3NvbSwgc2lub20sIHNjYWxlMCwgc2NhbGUxO1xuXG4gICAgLy8gY2FsYyBjb3NpbmVcbiAgICBjb3NvbSA9IGF4ICogYnggKyBheSAqIGJ5ICsgYXogKiBieiArIGF3ICogYnc7XG4gICAgLy8gYWRqdXN0IHNpZ25zIChpZiBuZWNlc3NhcnkpXG4gICAgaWYgKCBjb3NvbSA8IDAuMCApIHtcbiAgICAgICAgY29zb20gPSAtY29zb207XG4gICAgICAgIGJ4ID0gLSBieDtcbiAgICAgICAgYnkgPSAtIGJ5O1xuICAgICAgICBieiA9IC0gYno7XG4gICAgICAgIGJ3ID0gLSBidztcbiAgICB9XG4gICAgLy8gY2FsY3VsYXRlIGNvZWZmaWNpZW50c1xuICAgIGlmICggKDEuMCAtIGNvc29tKSA+IDAuMDAwMDAxICkge1xuICAgICAgICAvLyBzdGFuZGFyZCBjYXNlIChzbGVycClcbiAgICAgICAgb21lZ2EgID0gTWF0aC5hY29zKGNvc29tKTtcbiAgICAgICAgc2lub20gID0gTWF0aC5zaW4ob21lZ2EpO1xuICAgICAgICBzY2FsZTAgPSBNYXRoLnNpbigoMS4wIC0gdCkgKiBvbWVnYSkgLyBzaW5vbTtcbiAgICAgICAgc2NhbGUxID0gTWF0aC5zaW4odCAqIG9tZWdhKSAvIHNpbm9tO1xuICAgIH0gZWxzZSB7ICAgICAgICBcbiAgICAgICAgLy8gXCJmcm9tXCIgYW5kIFwidG9cIiBxdWF0ZXJuaW9ucyBhcmUgdmVyeSBjbG9zZSBcbiAgICAgICAgLy8gIC4uLiBzbyB3ZSBjYW4gZG8gYSBsaW5lYXIgaW50ZXJwb2xhdGlvblxuICAgICAgICBzY2FsZTAgPSAxLjAgLSB0O1xuICAgICAgICBzY2FsZTEgPSB0O1xuICAgIH1cbiAgICAvLyBjYWxjdWxhdGUgZmluYWwgdmFsdWVzXG4gICAgb3V0WzBdID0gc2NhbGUwICogYXggKyBzY2FsZTEgKiBieDtcbiAgICBvdXRbMV0gPSBzY2FsZTAgKiBheSArIHNjYWxlMSAqIGJ5O1xuICAgIG91dFsyXSA9IHNjYWxlMCAqIGF6ICsgc2NhbGUxICogYno7XG4gICAgb3V0WzNdID0gc2NhbGUwICogYXcgKyBzY2FsZTEgKiBidztcbiAgICBcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIHNwaGVyaWNhbCBsaW5lYXIgaW50ZXJwb2xhdGlvbiB3aXRoIHR3byBjb250cm9sIHBvaW50c1xuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHtxdWF0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3F1YXR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge3F1YXR9IGMgdGhlIHRoaXJkIG9wZXJhbmRcbiAqIEBwYXJhbSB7cXVhdH0gZCB0aGUgZm91cnRoIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSB0IGludGVycG9sYXRpb24gYW1vdW50XG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKi9cbnF1YXQuc3FsZXJwID0gKGZ1bmN0aW9uICgpIHtcbiAgdmFyIHRlbXAxID0gcXVhdC5jcmVhdGUoKTtcbiAgdmFyIHRlbXAyID0gcXVhdC5jcmVhdGUoKTtcbiAgXG4gIHJldHVybiBmdW5jdGlvbiAob3V0LCBhLCBiLCBjLCBkLCB0KSB7XG4gICAgcXVhdC5zbGVycCh0ZW1wMSwgYSwgZCwgdCk7XG4gICAgcXVhdC5zbGVycCh0ZW1wMiwgYiwgYywgdCk7XG4gICAgcXVhdC5zbGVycChvdXQsIHRlbXAxLCB0ZW1wMiwgMiAqIHQgKiAoMSAtIHQpKTtcbiAgICBcbiAgICByZXR1cm4gb3V0O1xuICB9O1xufSgpKTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBpbnZlcnNlIG9mIGEgcXVhdFxuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXQgdG8gY2FsY3VsYXRlIGludmVyc2Ugb2ZcbiAqIEByZXR1cm5zIHtxdWF0fSBvdXRcbiAqL1xucXVhdC5pbnZlcnQgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICB2YXIgYTAgPSBhWzBdLCBhMSA9IGFbMV0sIGEyID0gYVsyXSwgYTMgPSBhWzNdLFxuICAgICAgICBkb3QgPSBhMCphMCArIGExKmExICsgYTIqYTIgKyBhMyphMyxcbiAgICAgICAgaW52RG90ID0gZG90ID8gMS4wL2RvdCA6IDA7XG4gICAgXG4gICAgLy8gVE9ETzogV291bGQgYmUgZmFzdGVyIHRvIHJldHVybiBbMCwwLDAsMF0gaW1tZWRpYXRlbHkgaWYgZG90ID09IDBcblxuICAgIG91dFswXSA9IC1hMCppbnZEb3Q7XG4gICAgb3V0WzFdID0gLWExKmludkRvdDtcbiAgICBvdXRbMl0gPSAtYTIqaW52RG90O1xuICAgIG91dFszXSA9IGEzKmludkRvdDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBjb25qdWdhdGUgb2YgYSBxdWF0XG4gKiBJZiB0aGUgcXVhdGVybmlvbiBpcyBub3JtYWxpemVkLCB0aGlzIGZ1bmN0aW9uIGlzIGZhc3RlciB0aGFuIHF1YXQuaW52ZXJzZSBhbmQgcHJvZHVjZXMgdGhlIHNhbWUgcmVzdWx0LlxuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXQgdG8gY2FsY3VsYXRlIGNvbmp1Z2F0ZSBvZlxuICogQHJldHVybnMge3F1YXR9IG91dFxuICovXG5xdWF0LmNvbmp1Z2F0ZSA9IGZ1bmN0aW9uIChvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSAtYVswXTtcbiAgICBvdXRbMV0gPSAtYVsxXTtcbiAgICBvdXRbMl0gPSAtYVsyXTtcbiAgICBvdXRbM10gPSBhWzNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGxlbmd0aCBvZiBhIHF1YXRcbiAqXG4gKiBAcGFyYW0ge3F1YXR9IGEgdmVjdG9yIHRvIGNhbGN1bGF0ZSBsZW5ndGggb2ZcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGxlbmd0aCBvZiBhXG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5sZW5ndGggPSB2ZWM0Lmxlbmd0aDtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHF1YXQubGVuZ3RofVxuICogQGZ1bmN0aW9uXG4gKi9cbnF1YXQubGVuID0gcXVhdC5sZW5ndGg7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgc3F1YXJlZCBsZW5ndGggb2YgYSBxdWF0XG4gKlxuICogQHBhcmFtIHtxdWF0fSBhIHZlY3RvciB0byBjYWxjdWxhdGUgc3F1YXJlZCBsZW5ndGggb2ZcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IHNxdWFyZWQgbGVuZ3RoIG9mIGFcbiAqIEBmdW5jdGlvblxuICovXG5xdWF0LnNxdWFyZWRMZW5ndGggPSB2ZWM0LnNxdWFyZWRMZW5ndGg7XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayBxdWF0LnNxdWFyZWRMZW5ndGh9XG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5zcXJMZW4gPSBxdWF0LnNxdWFyZWRMZW5ndGg7XG5cbi8qKlxuICogTm9ybWFsaXplIGEgcXVhdFxuICpcbiAqIEBwYXJhbSB7cXVhdH0gb3V0IHRoZSByZWNlaXZpbmcgcXVhdGVybmlvblxuICogQHBhcmFtIHtxdWF0fSBhIHF1YXRlcm5pb24gdG8gbm9ybWFsaXplXG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5ub3JtYWxpemUgPSB2ZWM0Lm5vcm1hbGl6ZTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgcXVhdGVybmlvbiBmcm9tIHRoZSBnaXZlbiAzeDMgcm90YXRpb24gbWF0cml4LlxuICpcbiAqIE5PVEU6IFRoZSByZXN1bHRhbnQgcXVhdGVybmlvbiBpcyBub3Qgbm9ybWFsaXplZCwgc28geW91IHNob3VsZCBiZSBzdXJlXG4gKiB0byByZW5vcm1hbGl6ZSB0aGUgcXVhdGVybmlvbiB5b3Vyc2VsZiB3aGVyZSBuZWNlc3NhcnkuXG4gKlxuICogQHBhcmFtIHtxdWF0fSBvdXQgdGhlIHJlY2VpdmluZyBxdWF0ZXJuaW9uXG4gKiBAcGFyYW0ge21hdDN9IG0gcm90YXRpb24gbWF0cml4XG4gKiBAcmV0dXJucyB7cXVhdH0gb3V0XG4gKiBAZnVuY3Rpb25cbiAqL1xucXVhdC5mcm9tTWF0MyA9IGZ1bmN0aW9uKG91dCwgbSkge1xuICAgIC8vIEFsZ29yaXRobSBpbiBLZW4gU2hvZW1ha2UncyBhcnRpY2xlIGluIDE5ODcgU0lHR1JBUEggY291cnNlIG5vdGVzXG4gICAgLy8gYXJ0aWNsZSBcIlF1YXRlcm5pb24gQ2FsY3VsdXMgYW5kIEZhc3QgQW5pbWF0aW9uXCIuXG4gICAgdmFyIGZUcmFjZSA9IG1bMF0gKyBtWzRdICsgbVs4XTtcbiAgICB2YXIgZlJvb3Q7XG5cbiAgICBpZiAoIGZUcmFjZSA+IDAuMCApIHtcbiAgICAgICAgLy8gfHd8ID4gMS8yLCBtYXkgYXMgd2VsbCBjaG9vc2UgdyA+IDEvMlxuICAgICAgICBmUm9vdCA9IE1hdGguc3FydChmVHJhY2UgKyAxLjApOyAgLy8gMndcbiAgICAgICAgb3V0WzNdID0gMC41ICogZlJvb3Q7XG4gICAgICAgIGZSb290ID0gMC41L2ZSb290OyAgLy8gMS8oNHcpXG4gICAgICAgIG91dFswXSA9IChtWzVdLW1bN10pKmZSb290O1xuICAgICAgICBvdXRbMV0gPSAobVs2XS1tWzJdKSpmUm9vdDtcbiAgICAgICAgb3V0WzJdID0gKG1bMV0tbVszXSkqZlJvb3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gfHd8IDw9IDEvMlxuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIGlmICggbVs0XSA+IG1bMF0gKVxuICAgICAgICAgIGkgPSAxO1xuICAgICAgICBpZiAoIG1bOF0gPiBtW2kqMytpXSApXG4gICAgICAgICAgaSA9IDI7XG4gICAgICAgIHZhciBqID0gKGkrMSklMztcbiAgICAgICAgdmFyIGsgPSAoaSsyKSUzO1xuICAgICAgICBcbiAgICAgICAgZlJvb3QgPSBNYXRoLnNxcnQobVtpKjMraV0tbVtqKjMral0tbVtrKjMra10gKyAxLjApO1xuICAgICAgICBvdXRbaV0gPSAwLjUgKiBmUm9vdDtcbiAgICAgICAgZlJvb3QgPSAwLjUgLyBmUm9vdDtcbiAgICAgICAgb3V0WzNdID0gKG1baiozK2tdIC0gbVtrKjMral0pICogZlJvb3Q7XG4gICAgICAgIG91dFtqXSA9IChtW2oqMytpXSArIG1baSozK2pdKSAqIGZSb290O1xuICAgICAgICBvdXRba10gPSAobVtrKjMraV0gKyBtW2kqMytrXSkgKiBmUm9vdDtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIHF1YXRlbmlvblxuICpcbiAqIEBwYXJhbSB7cXVhdH0gdmVjIHZlY3RvciB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdmVjdG9yXG4gKi9cbnF1YXQuc3RyID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gJ3F1YXQoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcsICcgKyBhWzJdICsgJywgJyArIGFbM10gKyAnKSc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHF1YXQ7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC9xdWF0LmpzXG4gKiogbW9kdWxlIGlkID0gMTBcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qIENvcHlyaWdodCAoYykgMjAxNSwgQnJhbmRvbiBKb25lcywgQ29saW4gTWFjS2VuemllIElWLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuICovXG5cbnZhciBnbE1hdHJpeCA9IHJlcXVpcmUoXCIuL2NvbW1vbi5qc1wiKTtcblxuLyoqXG4gKiBAY2xhc3MgMyBEaW1lbnNpb25hbCBWZWN0b3JcbiAqIEBuYW1lIHZlYzNcbiAqL1xudmFyIHZlYzMgPSB7fTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3LCBlbXB0eSB2ZWMzXG4gKlxuICogQHJldHVybnMge3ZlYzN9IGEgbmV3IDNEIHZlY3RvclxuICovXG52ZWMzLmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSgzKTtcbiAgICBvdXRbMF0gPSAwO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHZlYzMgaW5pdGlhbGl6ZWQgd2l0aCB2YWx1ZXMgZnJvbSBhbiBleGlzdGluZyB2ZWN0b3JcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdmVjdG9yIHRvIGNsb25lXG4gKiBAcmV0dXJucyB7dmVjM30gYSBuZXcgM0QgdmVjdG9yXG4gKi9cbnZlYzMuY2xvbmUgPSBmdW5jdGlvbihhKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDMpO1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgdmVjMyBpbml0aWFsaXplZCB3aXRoIHRoZSBnaXZlbiB2YWx1ZXNcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgWSBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFogY29tcG9uZW50XG4gKiBAcmV0dXJucyB7dmVjM30gYSBuZXcgM0QgdmVjdG9yXG4gKi9cbnZlYzMuZnJvbVZhbHVlcyA9IGZ1bmN0aW9uKHgsIHksIHopIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMyk7XG4gICAgb3V0WzBdID0geDtcbiAgICBvdXRbMV0gPSB5O1xuICAgIG91dFsyXSA9IHo7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ29weSB0aGUgdmFsdWVzIGZyb20gb25lIHZlYzMgdG8gYW5vdGhlclxuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIHNvdXJjZSB2ZWN0b3JcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5jb3B5ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjb21wb25lbnRzIG9mIGEgdmVjMyB0byB0aGUgZ2l2ZW4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFggY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geSBZIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHogWiBjb21wb25lbnRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5zZXQgPSBmdW5jdGlvbihvdXQsIHgsIHksIHopIHtcbiAgICBvdXRbMF0gPSB4O1xuICAgIG91dFsxXSA9IHk7XG4gICAgb3V0WzJdID0gejtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBZGRzIHR3byB2ZWMzJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMuYWRkID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSArIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSArIGJbMV07XG4gICAgb3V0WzJdID0gYVsyXSArIGJbMl07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU3VidHJhY3RzIHZlY3RvciBiIGZyb20gdmVjdG9yIGFcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMuc3VidHJhY3QgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdIC0gYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdIC0gYlsxXTtcbiAgICBvdXRbMl0gPSBhWzJdIC0gYlsyXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzMuc3VidHJhY3R9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMy5zdWIgPSB2ZWMzLnN1YnRyYWN0O1xuXG4vKipcbiAqIE11bHRpcGxpZXMgdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5tdWx0aXBseSA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKiBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gKiBiWzFdO1xuICAgIG91dFsyXSA9IGFbMl0gKiBiWzJdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMy5tdWx0aXBseX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMzLm11bCA9IHZlYzMubXVsdGlwbHk7XG5cbi8qKlxuICogRGl2aWRlcyB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLmRpdmlkZSA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gLyBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gLyBiWzFdO1xuICAgIG91dFsyXSA9IGFbMl0gLyBiWzJdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMy5kaXZpZGV9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMy5kaXYgPSB2ZWMzLmRpdmlkZTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtaW5pbXVtIG9mIHR3byB2ZWMzJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMubWluID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gTWF0aC5taW4oYVswXSwgYlswXSk7XG4gICAgb3V0WzFdID0gTWF0aC5taW4oYVsxXSwgYlsxXSk7XG4gICAgb3V0WzJdID0gTWF0aC5taW4oYVsyXSwgYlsyXSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbWF4aW11bSBvZiB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLm1heCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IE1hdGgubWF4KGFbMF0sIGJbMF0pO1xuICAgIG91dFsxXSA9IE1hdGgubWF4KGFbMV0sIGJbMV0pO1xuICAgIG91dFsyXSA9IE1hdGgubWF4KGFbMl0sIGJbMl0pO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlcyBhIHZlYzMgYnkgYSBzY2FsYXIgbnVtYmVyXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgdmVjdG9yIHRvIHNjYWxlXG4gKiBAcGFyYW0ge051bWJlcn0gYiBhbW91bnQgdG8gc2NhbGUgdGhlIHZlY3RvciBieVxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnNjYWxlID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAqIGI7XG4gICAgb3V0WzFdID0gYVsxXSAqIGI7XG4gICAgb3V0WzJdID0gYVsyXSAqIGI7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWRkcyB0d28gdmVjMydzIGFmdGVyIHNjYWxpbmcgdGhlIHNlY29uZCBvcGVyYW5kIGJ5IGEgc2NhbGFyIHZhbHVlXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHtOdW1iZXJ9IHNjYWxlIHRoZSBhbW91bnQgdG8gc2NhbGUgYiBieSBiZWZvcmUgYWRkaW5nXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMuc2NhbGVBbmRBZGQgPSBmdW5jdGlvbihvdXQsIGEsIGIsIHNjYWxlKSB7XG4gICAgb3V0WzBdID0gYVswXSArIChiWzBdICogc2NhbGUpO1xuICAgIG91dFsxXSA9IGFbMV0gKyAoYlsxXSAqIHNjYWxlKTtcbiAgICBvdXRbMl0gPSBhWzJdICsgKGJbMl0gKiBzY2FsZSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZXVjbGlkaWFuIGRpc3RhbmNlIGJldHdlZW4gdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gZGlzdGFuY2UgYmV0d2VlbiBhIGFuZCBiXG4gKi9cbnZlYzMuZGlzdGFuY2UgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIHggPSBiWzBdIC0gYVswXSxcbiAgICAgICAgeSA9IGJbMV0gLSBhWzFdLFxuICAgICAgICB6ID0gYlsyXSAtIGFbMl07XG4gICAgcmV0dXJuIE1hdGguc3FydCh4KnggKyB5KnkgKyB6KnopO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzMuZGlzdGFuY2V9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMy5kaXN0ID0gdmVjMy5kaXN0YW5jZTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGV1Y2xpZGlhbiBkaXN0YW5jZSBiZXR3ZWVuIHR3byB2ZWMzJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IHNxdWFyZWQgZGlzdGFuY2UgYmV0d2VlbiBhIGFuZCBiXG4gKi9cbnZlYzMuc3F1YXJlZERpc3RhbmNlID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciB4ID0gYlswXSAtIGFbMF0sXG4gICAgICAgIHkgPSBiWzFdIC0gYVsxXSxcbiAgICAgICAgeiA9IGJbMl0gLSBhWzJdO1xuICAgIHJldHVybiB4KnggKyB5KnkgKyB6Kno7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMy5zcXVhcmVkRGlzdGFuY2V9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMy5zcXJEaXN0ID0gdmVjMy5zcXVhcmVkRGlzdGFuY2U7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgbGVuZ3RoIG9mIGEgdmVjM1xuICpcbiAqIEBwYXJhbSB7dmVjM30gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIGxlbmd0aCBvZlxuICogQHJldHVybnMge051bWJlcn0gbGVuZ3RoIG9mIGFcbiAqL1xudmVjMy5sZW5ndGggPSBmdW5jdGlvbiAoYSkge1xuICAgIHZhciB4ID0gYVswXSxcbiAgICAgICAgeSA9IGFbMV0sXG4gICAgICAgIHogPSBhWzJdO1xuICAgIHJldHVybiBNYXRoLnNxcnQoeCp4ICsgeSp5ICsgeip6KTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMzLmxlbmd0aH1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMzLmxlbiA9IHZlYzMubGVuZ3RoO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgbGVuZ3RoIG9mIGEgdmVjM1xuICpcbiAqIEBwYXJhbSB7dmVjM30gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIHNxdWFyZWQgbGVuZ3RoIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBzcXVhcmVkIGxlbmd0aCBvZiBhXG4gKi9cbnZlYzMuc3F1YXJlZExlbmd0aCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXSxcbiAgICAgICAgeiA9IGFbMl07XG4gICAgcmV0dXJuIHgqeCArIHkqeSArIHoqejtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMzLnNxdWFyZWRMZW5ndGh9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMy5zcXJMZW4gPSB2ZWMzLnNxdWFyZWRMZW5ndGg7XG5cbi8qKlxuICogTmVnYXRlcyB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzNcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHZlY3RvciB0byBuZWdhdGVcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5uZWdhdGUgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSAtYVswXTtcbiAgICBvdXRbMV0gPSAtYVsxXTtcbiAgICBvdXRbMl0gPSAtYVsyXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbnZlcnNlIG9mIHRoZSBjb21wb25lbnRzIG9mIGEgdmVjM1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdmVjdG9yIHRvIGludmVydFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLmludmVyc2UgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgb3V0WzBdID0gMS4wIC8gYVswXTtcbiAgb3V0WzFdID0gMS4wIC8gYVsxXTtcbiAgb3V0WzJdID0gMS4wIC8gYVsyXTtcbiAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogTm9ybWFsaXplIGEgdmVjM1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdmVjdG9yIHRvIG5vcm1hbGl6ZVxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciB4ID0gYVswXSxcbiAgICAgICAgeSA9IGFbMV0sXG4gICAgICAgIHogPSBhWzJdO1xuICAgIHZhciBsZW4gPSB4KnggKyB5KnkgKyB6Kno7XG4gICAgaWYgKGxlbiA+IDApIHtcbiAgICAgICAgLy9UT0RPOiBldmFsdWF0ZSB1c2Ugb2YgZ2xtX2ludnNxcnQgaGVyZT9cbiAgICAgICAgbGVuID0gMSAvIE1hdGguc3FydChsZW4pO1xuICAgICAgICBvdXRbMF0gPSBhWzBdICogbGVuO1xuICAgICAgICBvdXRbMV0gPSBhWzFdICogbGVuO1xuICAgICAgICBvdXRbMl0gPSBhWzJdICogbGVuO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBkb3QgcHJvZHVjdCBvZiB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkb3QgcHJvZHVjdCBvZiBhIGFuZCBiXG4gKi9cbnZlYzMuZG90ID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gYVswXSAqIGJbMF0gKyBhWzFdICogYlsxXSArIGFbMl0gKiBiWzJdO1xufTtcblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgY3Jvc3MgcHJvZHVjdCBvZiB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLmNyb3NzID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgdmFyIGF4ID0gYVswXSwgYXkgPSBhWzFdLCBheiA9IGFbMl0sXG4gICAgICAgIGJ4ID0gYlswXSwgYnkgPSBiWzFdLCBieiA9IGJbMl07XG5cbiAgICBvdXRbMF0gPSBheSAqIGJ6IC0gYXogKiBieTtcbiAgICBvdXRbMV0gPSBheiAqIGJ4IC0gYXggKiBiejtcbiAgICBvdXRbMl0gPSBheCAqIGJ5IC0gYXkgKiBieDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIGxpbmVhciBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSB0IGludGVycG9sYXRpb24gYW1vdW50IGJldHdlZW4gdGhlIHR3byBpbnB1dHNcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5sZXJwID0gZnVuY3Rpb24gKG91dCwgYSwgYiwgdCkge1xuICAgIHZhciBheCA9IGFbMF0sXG4gICAgICAgIGF5ID0gYVsxXSxcbiAgICAgICAgYXogPSBhWzJdO1xuICAgIG91dFswXSA9IGF4ICsgdCAqIChiWzBdIC0gYXgpO1xuICAgIG91dFsxXSA9IGF5ICsgdCAqIChiWzFdIC0gYXkpO1xuICAgIG91dFsyXSA9IGF6ICsgdCAqIChiWzJdIC0gYXopO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgaGVybWl0ZSBpbnRlcnBvbGF0aW9uIHdpdGggdHdvIGNvbnRyb2wgcG9pbnRzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBjIHRoZSB0aGlyZCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGQgdGhlIGZvdXJ0aCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudCBiZXR3ZWVuIHRoZSB0d28gaW5wdXRzXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMuaGVybWl0ZSA9IGZ1bmN0aW9uIChvdXQsIGEsIGIsIGMsIGQsIHQpIHtcbiAgdmFyIGZhY3RvclRpbWVzMiA9IHQgKiB0LFxuICAgICAgZmFjdG9yMSA9IGZhY3RvclRpbWVzMiAqICgyICogdCAtIDMpICsgMSxcbiAgICAgIGZhY3RvcjIgPSBmYWN0b3JUaW1lczIgKiAodCAtIDIpICsgdCxcbiAgICAgIGZhY3RvcjMgPSBmYWN0b3JUaW1lczIgKiAodCAtIDEpLFxuICAgICAgZmFjdG9yNCA9IGZhY3RvclRpbWVzMiAqICgzIC0gMiAqIHQpO1xuICBcbiAgb3V0WzBdID0gYVswXSAqIGZhY3RvcjEgKyBiWzBdICogZmFjdG9yMiArIGNbMF0gKiBmYWN0b3IzICsgZFswXSAqIGZhY3RvcjQ7XG4gIG91dFsxXSA9IGFbMV0gKiBmYWN0b3IxICsgYlsxXSAqIGZhY3RvcjIgKyBjWzFdICogZmFjdG9yMyArIGRbMV0gKiBmYWN0b3I0O1xuICBvdXRbMl0gPSBhWzJdICogZmFjdG9yMSArIGJbMl0gKiBmYWN0b3IyICsgY1syXSAqIGZhY3RvcjMgKyBkWzJdICogZmFjdG9yNDtcbiAgXG4gIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgYmV6aWVyIGludGVycG9sYXRpb24gd2l0aCB0d28gY29udHJvbCBwb2ludHNcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGMgdGhlIHRoaXJkIG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjM30gZCB0aGUgZm91cnRoIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSB0IGludGVycG9sYXRpb24gYW1vdW50IGJldHdlZW4gdGhlIHR3byBpbnB1dHNcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy5iZXppZXIgPSBmdW5jdGlvbiAob3V0LCBhLCBiLCBjLCBkLCB0KSB7XG4gIHZhciBpbnZlcnNlRmFjdG9yID0gMSAtIHQsXG4gICAgICBpbnZlcnNlRmFjdG9yVGltZXNUd28gPSBpbnZlcnNlRmFjdG9yICogaW52ZXJzZUZhY3RvcixcbiAgICAgIGZhY3RvclRpbWVzMiA9IHQgKiB0LFxuICAgICAgZmFjdG9yMSA9IGludmVyc2VGYWN0b3JUaW1lc1R3byAqIGludmVyc2VGYWN0b3IsXG4gICAgICBmYWN0b3IyID0gMyAqIHQgKiBpbnZlcnNlRmFjdG9yVGltZXNUd28sXG4gICAgICBmYWN0b3IzID0gMyAqIGZhY3RvclRpbWVzMiAqIGludmVyc2VGYWN0b3IsXG4gICAgICBmYWN0b3I0ID0gZmFjdG9yVGltZXMyICogdDtcbiAgXG4gIG91dFswXSA9IGFbMF0gKiBmYWN0b3IxICsgYlswXSAqIGZhY3RvcjIgKyBjWzBdICogZmFjdG9yMyArIGRbMF0gKiBmYWN0b3I0O1xuICBvdXRbMV0gPSBhWzFdICogZmFjdG9yMSArIGJbMV0gKiBmYWN0b3IyICsgY1sxXSAqIGZhY3RvcjMgKyBkWzFdICogZmFjdG9yNDtcbiAgb3V0WzJdID0gYVsyXSAqIGZhY3RvcjEgKyBiWzJdICogZmFjdG9yMiArIGNbMl0gKiBmYWN0b3IzICsgZFsyXSAqIGZhY3RvcjQ7XG4gIFxuICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSByYW5kb20gdmVjdG9yIHdpdGggdGhlIGdpdmVuIHNjYWxlXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7TnVtYmVyfSBbc2NhbGVdIExlbmd0aCBvZiB0aGUgcmVzdWx0aW5nIHZlY3Rvci4gSWYgb21taXR0ZWQsIGEgdW5pdCB2ZWN0b3Igd2lsbCBiZSByZXR1cm5lZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnJhbmRvbSA9IGZ1bmN0aW9uIChvdXQsIHNjYWxlKSB7XG4gICAgc2NhbGUgPSBzY2FsZSB8fCAxLjA7XG5cbiAgICB2YXIgciA9IGdsTWF0cml4LlJBTkRPTSgpICogMi4wICogTWF0aC5QSTtcbiAgICB2YXIgeiA9IChnbE1hdHJpeC5SQU5ET00oKSAqIDIuMCkgLSAxLjA7XG4gICAgdmFyIHpTY2FsZSA9IE1hdGguc3FydCgxLjAteip6KSAqIHNjYWxlO1xuXG4gICAgb3V0WzBdID0gTWF0aC5jb3MocikgKiB6U2NhbGU7XG4gICAgb3V0WzFdID0gTWF0aC5zaW4ocikgKiB6U2NhbGU7XG4gICAgb3V0WzJdID0geiAqIHNjYWxlO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzMgd2l0aCBhIG1hdDQuXG4gKiA0dGggdmVjdG9yIGNvbXBvbmVudCBpcyBpbXBsaWNpdGx5ICcxJ1xuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7bWF0NH0gbSBtYXRyaXggdG8gdHJhbnNmb3JtIHdpdGhcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy50cmFuc2Zvcm1NYXQ0ID0gZnVuY3Rpb24ob3V0LCBhLCBtKSB7XG4gICAgdmFyIHggPSBhWzBdLCB5ID0gYVsxXSwgeiA9IGFbMl0sXG4gICAgICAgIHcgPSBtWzNdICogeCArIG1bN10gKiB5ICsgbVsxMV0gKiB6ICsgbVsxNV07XG4gICAgdyA9IHcgfHwgMS4wO1xuICAgIG91dFswXSA9IChtWzBdICogeCArIG1bNF0gKiB5ICsgbVs4XSAqIHogKyBtWzEyXSkgLyB3O1xuICAgIG91dFsxXSA9IChtWzFdICogeCArIG1bNV0gKiB5ICsgbVs5XSAqIHogKyBtWzEzXSkgLyB3O1xuICAgIG91dFsyXSA9IChtWzJdICogeCArIG1bNl0gKiB5ICsgbVsxMF0gKiB6ICsgbVsxNF0pIC8gdztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMzIHdpdGggYSBtYXQzLlxuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7bWF0NH0gbSB0aGUgM3gzIG1hdHJpeCB0byB0cmFuc2Zvcm0gd2l0aFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnRyYW5zZm9ybU1hdDMgPSBmdW5jdGlvbihvdXQsIGEsIG0pIHtcbiAgICB2YXIgeCA9IGFbMF0sIHkgPSBhWzFdLCB6ID0gYVsyXTtcbiAgICBvdXRbMF0gPSB4ICogbVswXSArIHkgKiBtWzNdICsgeiAqIG1bNl07XG4gICAgb3V0WzFdID0geCAqIG1bMV0gKyB5ICogbVs0XSArIHogKiBtWzddO1xuICAgIG91dFsyXSA9IHggKiBtWzJdICsgeSAqIG1bNV0gKyB6ICogbVs4XTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMzIHdpdGggYSBxdWF0XG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICogQHBhcmFtIHtxdWF0fSBxIHF1YXRlcm5pb24gdG8gdHJhbnNmb3JtIHdpdGhcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMy50cmFuc2Zvcm1RdWF0ID0gZnVuY3Rpb24ob3V0LCBhLCBxKSB7XG4gICAgLy8gYmVuY2htYXJrczogaHR0cDovL2pzcGVyZi5jb20vcXVhdGVybmlvbi10cmFuc2Zvcm0tdmVjMy1pbXBsZW1lbnRhdGlvbnNcblxuICAgIHZhciB4ID0gYVswXSwgeSA9IGFbMV0sIHogPSBhWzJdLFxuICAgICAgICBxeCA9IHFbMF0sIHF5ID0gcVsxXSwgcXogPSBxWzJdLCBxdyA9IHFbM10sXG5cbiAgICAgICAgLy8gY2FsY3VsYXRlIHF1YXQgKiB2ZWNcbiAgICAgICAgaXggPSBxdyAqIHggKyBxeSAqIHogLSBxeiAqIHksXG4gICAgICAgIGl5ID0gcXcgKiB5ICsgcXogKiB4IC0gcXggKiB6LFxuICAgICAgICBpeiA9IHF3ICogeiArIHF4ICogeSAtIHF5ICogeCxcbiAgICAgICAgaXcgPSAtcXggKiB4IC0gcXkgKiB5IC0gcXogKiB6O1xuXG4gICAgLy8gY2FsY3VsYXRlIHJlc3VsdCAqIGludmVyc2UgcXVhdFxuICAgIG91dFswXSA9IGl4ICogcXcgKyBpdyAqIC1xeCArIGl5ICogLXF6IC0gaXogKiAtcXk7XG4gICAgb3V0WzFdID0gaXkgKiBxdyArIGl3ICogLXF5ICsgaXogKiAtcXggLSBpeCAqIC1xejtcbiAgICBvdXRbMl0gPSBpeiAqIHF3ICsgaXcgKiAtcXogKyBpeCAqIC1xeSAtIGl5ICogLXF4O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZSBhIDNEIHZlY3RvciBhcm91bmQgdGhlIHgtYXhpc1xuICogQHBhcmFtIHt2ZWMzfSBvdXQgVGhlIHJlY2VpdmluZyB2ZWMzXG4gKiBAcGFyYW0ge3ZlYzN9IGEgVGhlIHZlYzMgcG9pbnQgdG8gcm90YXRlXG4gKiBAcGFyYW0ge3ZlYzN9IGIgVGhlIG9yaWdpbiBvZiB0aGUgcm90YXRpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSBjIFRoZSBhbmdsZSBvZiByb3RhdGlvblxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMzLnJvdGF0ZVggPSBmdW5jdGlvbihvdXQsIGEsIGIsIGMpe1xuICAgdmFyIHAgPSBbXSwgcj1bXTtcblx0ICAvL1RyYW5zbGF0ZSBwb2ludCB0byB0aGUgb3JpZ2luXG5cdCAgcFswXSA9IGFbMF0gLSBiWzBdO1xuXHQgIHBbMV0gPSBhWzFdIC0gYlsxXTtcbiAgXHRwWzJdID0gYVsyXSAtIGJbMl07XG5cblx0ICAvL3BlcmZvcm0gcm90YXRpb25cblx0ICByWzBdID0gcFswXTtcblx0ICByWzFdID0gcFsxXSpNYXRoLmNvcyhjKSAtIHBbMl0qTWF0aC5zaW4oYyk7XG5cdCAgclsyXSA9IHBbMV0qTWF0aC5zaW4oYykgKyBwWzJdKk1hdGguY29zKGMpO1xuXG5cdCAgLy90cmFuc2xhdGUgdG8gY29ycmVjdCBwb3NpdGlvblxuXHQgIG91dFswXSA9IHJbMF0gKyBiWzBdO1xuXHQgIG91dFsxXSA9IHJbMV0gKyBiWzFdO1xuXHQgIG91dFsyXSA9IHJbMl0gKyBiWzJdO1xuXG4gIFx0cmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUm90YXRlIGEgM0QgdmVjdG9yIGFyb3VuZCB0aGUgeS1heGlzXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCBUaGUgcmVjZWl2aW5nIHZlYzNcbiAqIEBwYXJhbSB7dmVjM30gYSBUaGUgdmVjMyBwb2ludCB0byByb3RhdGVcbiAqIEBwYXJhbSB7dmVjM30gYiBUaGUgb3JpZ2luIG9mIHRoZSByb3RhdGlvblxuICogQHBhcmFtIHtOdW1iZXJ9IGMgVGhlIGFuZ2xlIG9mIHJvdGF0aW9uXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMucm90YXRlWSA9IGZ1bmN0aW9uKG91dCwgYSwgYiwgYyl7XG4gIFx0dmFyIHAgPSBbXSwgcj1bXTtcbiAgXHQvL1RyYW5zbGF0ZSBwb2ludCB0byB0aGUgb3JpZ2luXG4gIFx0cFswXSA9IGFbMF0gLSBiWzBdO1xuICBcdHBbMV0gPSBhWzFdIC0gYlsxXTtcbiAgXHRwWzJdID0gYVsyXSAtIGJbMl07XG4gIFxuICBcdC8vcGVyZm9ybSByb3RhdGlvblxuICBcdHJbMF0gPSBwWzJdKk1hdGguc2luKGMpICsgcFswXSpNYXRoLmNvcyhjKTtcbiAgXHRyWzFdID0gcFsxXTtcbiAgXHRyWzJdID0gcFsyXSpNYXRoLmNvcyhjKSAtIHBbMF0qTWF0aC5zaW4oYyk7XG4gIFxuICBcdC8vdHJhbnNsYXRlIHRvIGNvcnJlY3QgcG9zaXRpb25cbiAgXHRvdXRbMF0gPSByWzBdICsgYlswXTtcbiAgXHRvdXRbMV0gPSByWzFdICsgYlsxXTtcbiAgXHRvdXRbMl0gPSByWzJdICsgYlsyXTtcbiAgXG4gIFx0cmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUm90YXRlIGEgM0QgdmVjdG9yIGFyb3VuZCB0aGUgei1heGlzXG4gKiBAcGFyYW0ge3ZlYzN9IG91dCBUaGUgcmVjZWl2aW5nIHZlYzNcbiAqIEBwYXJhbSB7dmVjM30gYSBUaGUgdmVjMyBwb2ludCB0byByb3RhdGVcbiAqIEBwYXJhbSB7dmVjM30gYiBUaGUgb3JpZ2luIG9mIHRoZSByb3RhdGlvblxuICogQHBhcmFtIHtOdW1iZXJ9IGMgVGhlIGFuZ2xlIG9mIHJvdGF0aW9uXG4gKiBAcmV0dXJucyB7dmVjM30gb3V0XG4gKi9cbnZlYzMucm90YXRlWiA9IGZ1bmN0aW9uKG91dCwgYSwgYiwgYyl7XG4gIFx0dmFyIHAgPSBbXSwgcj1bXTtcbiAgXHQvL1RyYW5zbGF0ZSBwb2ludCB0byB0aGUgb3JpZ2luXG4gIFx0cFswXSA9IGFbMF0gLSBiWzBdO1xuICBcdHBbMV0gPSBhWzFdIC0gYlsxXTtcbiAgXHRwWzJdID0gYVsyXSAtIGJbMl07XG4gIFxuICBcdC8vcGVyZm9ybSByb3RhdGlvblxuICBcdHJbMF0gPSBwWzBdKk1hdGguY29zKGMpIC0gcFsxXSpNYXRoLnNpbihjKTtcbiAgXHRyWzFdID0gcFswXSpNYXRoLnNpbihjKSArIHBbMV0qTWF0aC5jb3MoYyk7XG4gIFx0clsyXSA9IHBbMl07XG4gIFxuICBcdC8vdHJhbnNsYXRlIHRvIGNvcnJlY3QgcG9zaXRpb25cbiAgXHRvdXRbMF0gPSByWzBdICsgYlswXTtcbiAgXHRvdXRbMV0gPSByWzFdICsgYlsxXTtcbiAgXHRvdXRbMl0gPSByWzJdICsgYlsyXTtcbiAgXG4gIFx0cmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUGVyZm9ybSBzb21lIG9wZXJhdGlvbiBvdmVyIGFuIGFycmF5IG9mIHZlYzNzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGEgdGhlIGFycmF5IG9mIHZlY3RvcnMgdG8gaXRlcmF0ZSBvdmVyXG4gKiBAcGFyYW0ge051bWJlcn0gc3RyaWRlIE51bWJlciBvZiBlbGVtZW50cyBiZXR3ZWVuIHRoZSBzdGFydCBvZiBlYWNoIHZlYzMuIElmIDAgYXNzdW1lcyB0aWdodGx5IHBhY2tlZFxuICogQHBhcmFtIHtOdW1iZXJ9IG9mZnNldCBOdW1iZXIgb2YgZWxlbWVudHMgdG8gc2tpcCBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhcnJheVxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IE51bWJlciBvZiB2ZWMzcyB0byBpdGVyYXRlIG92ZXIuIElmIDAgaXRlcmF0ZXMgb3ZlciBlbnRpcmUgYXJyYXlcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIEZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggdmVjdG9yIGluIHRoZSBhcnJheVxuICogQHBhcmFtIHtPYmplY3R9IFthcmddIGFkZGl0aW9uYWwgYXJndW1lbnQgdG8gcGFzcyB0byBmblxuICogQHJldHVybnMge0FycmF5fSBhXG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMy5mb3JFYWNoID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciB2ZWMgPSB2ZWMzLmNyZWF0ZSgpO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGEsIHN0cmlkZSwgb2Zmc2V0LCBjb3VudCwgZm4sIGFyZykge1xuICAgICAgICB2YXIgaSwgbDtcbiAgICAgICAgaWYoIXN0cmlkZSkge1xuICAgICAgICAgICAgc3RyaWRlID0gMztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCFvZmZzZXQpIHtcbiAgICAgICAgICAgIG9mZnNldCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmKGNvdW50KSB7XG4gICAgICAgICAgICBsID0gTWF0aC5taW4oKGNvdW50ICogc3RyaWRlKSArIG9mZnNldCwgYS5sZW5ndGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbCA9IGEubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKGkgPSBvZmZzZXQ7IGkgPCBsOyBpICs9IHN0cmlkZSkge1xuICAgICAgICAgICAgdmVjWzBdID0gYVtpXTsgdmVjWzFdID0gYVtpKzFdOyB2ZWNbMl0gPSBhW2krMl07XG4gICAgICAgICAgICBmbih2ZWMsIHZlYywgYXJnKTtcbiAgICAgICAgICAgIGFbaV0gPSB2ZWNbMF07IGFbaSsxXSA9IHZlY1sxXTsgYVtpKzJdID0gdmVjWzJdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYTtcbiAgICB9O1xufSkoKTtcblxuLyoqXG4gKiBHZXQgdGhlIGFuZ2xlIGJldHdlZW4gdHdvIDNEIHZlY3RvcnNcbiAqIEBwYXJhbSB7dmVjM30gYSBUaGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIFRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gVGhlIGFuZ2xlIGluIHJhZGlhbnNcbiAqL1xudmVjMy5hbmdsZSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgIFxuICAgIHZhciB0ZW1wQSA9IHZlYzMuZnJvbVZhbHVlcyhhWzBdLCBhWzFdLCBhWzJdKTtcbiAgICB2YXIgdGVtcEIgPSB2ZWMzLmZyb21WYWx1ZXMoYlswXSwgYlsxXSwgYlsyXSk7XG4gXG4gICAgdmVjMy5ub3JtYWxpemUodGVtcEEsIHRlbXBBKTtcbiAgICB2ZWMzLm5vcm1hbGl6ZSh0ZW1wQiwgdGVtcEIpO1xuIFxuICAgIHZhciBjb3NpbmUgPSB2ZWMzLmRvdCh0ZW1wQSwgdGVtcEIpO1xuXG4gICAgaWYoY29zaW5lID4gMS4wKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYWNvcyhjb3NpbmUpO1xuICAgIH0gICAgIFxufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgdmVjdG9yXG4gKlxuICogQHBhcmFtIHt2ZWMzfSB2ZWMgdmVjdG9yIHRvIHJlcHJlc2VudCBhcyBhIHN0cmluZ1xuICogQHJldHVybnMge1N0cmluZ30gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3JcbiAqL1xudmVjMy5zdHIgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiAndmVjMygnICsgYVswXSArICcsICcgKyBhWzFdICsgJywgJyArIGFbMl0gKyAnKSc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHZlYzM7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi9nbC1tYXRyaXgvc3JjL2dsLW1hdHJpeC92ZWMzLmpzXG4gKiogbW9kdWxlIGlkID0gMTFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIi8qIENvcHlyaWdodCAoYykgMjAxNSwgQnJhbmRvbiBKb25lcywgQ29saW4gTWFjS2VuemllIElWLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuICovXG5cbnZhciBnbE1hdHJpeCA9IHJlcXVpcmUoXCIuL2NvbW1vbi5qc1wiKTtcblxuLyoqXG4gKiBAY2xhc3MgNCBEaW1lbnNpb25hbCBWZWN0b3JcbiAqIEBuYW1lIHZlYzRcbiAqL1xudmFyIHZlYzQgPSB7fTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3LCBlbXB0eSB2ZWM0XG4gKlxuICogQHJldHVybnMge3ZlYzR9IGEgbmV3IDREIHZlY3RvclxuICovXG52ZWM0LmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSg0KTtcbiAgICBvdXRbMF0gPSAwO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgdmVjNCBpbml0aWFsaXplZCB3aXRoIHZhbHVlcyBmcm9tIGFuIGV4aXN0aW5nIHZlY3RvclxuICpcbiAqIEBwYXJhbSB7dmVjNH0gYSB2ZWN0b3IgdG8gY2xvbmVcbiAqIEByZXR1cm5zIHt2ZWM0fSBhIG5ldyA0RCB2ZWN0b3JcbiAqL1xudmVjNC5jbG9uZSA9IGZ1bmN0aW9uKGEpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoNCk7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHZlYzQgaW5pdGlhbGl6ZWQgd2l0aCB0aGUgZ2l2ZW4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggWCBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFkgY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geiBaIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHcgVyBjb21wb25lbnRcbiAqIEByZXR1cm5zIHt2ZWM0fSBhIG5ldyA0RCB2ZWN0b3JcbiAqL1xudmVjNC5mcm9tVmFsdWVzID0gZnVuY3Rpb24oeCwgeSwgeiwgdykge1xuICAgIHZhciBvdXQgPSBuZXcgZ2xNYXRyaXguQVJSQVlfVFlQRSg0KTtcbiAgICBvdXRbMF0gPSB4O1xuICAgIG91dFsxXSA9IHk7XG4gICAgb3V0WzJdID0gejtcbiAgICBvdXRbM10gPSB3O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSB2ZWM0IHRvIGFub3RoZXJcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBzb3VyY2UgdmVjdG9yXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQuY29weSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjb21wb25lbnRzIG9mIGEgdmVjNCB0byB0aGUgZ2l2ZW4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFggY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geSBZIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHogWiBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB3IFcgY29tcG9uZW50XG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQuc2V0ID0gZnVuY3Rpb24ob3V0LCB4LCB5LCB6LCB3KSB7XG4gICAgb3V0WzBdID0geDtcbiAgICBvdXRbMV0gPSB5O1xuICAgIG91dFsyXSA9IHo7XG4gICAgb3V0WzNdID0gdztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBZGRzIHR3byB2ZWM0J3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQuYWRkID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSArIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSArIGJbMV07XG4gICAgb3V0WzJdID0gYVsyXSArIGJbMl07XG4gICAgb3V0WzNdID0gYVszXSArIGJbM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU3VidHJhY3RzIHZlY3RvciBiIGZyb20gdmVjdG9yIGFcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQuc3VidHJhY3QgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdIC0gYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdIC0gYlsxXTtcbiAgICBvdXRbMl0gPSBhWzJdIC0gYlsyXTtcbiAgICBvdXRbM10gPSBhWzNdIC0gYlszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzQuc3VidHJhY3R9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjNC5zdWIgPSB2ZWM0LnN1YnRyYWN0O1xuXG4vKipcbiAqIE11bHRpcGxpZXMgdHdvIHZlYzQnc1xuICpcbiAqIEBwYXJhbSB7dmVjNH0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5tdWx0aXBseSA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKiBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gKiBiWzFdO1xuICAgIG91dFsyXSA9IGFbMl0gKiBiWzJdO1xuICAgIG91dFszXSA9IGFbM10gKiBiWzNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjNC5tdWx0aXBseX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWM0Lm11bCA9IHZlYzQubXVsdGlwbHk7XG5cbi8qKlxuICogRGl2aWRlcyB0d28gdmVjNCdzXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LmRpdmlkZSA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gLyBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gLyBiWzFdO1xuICAgIG91dFsyXSA9IGFbMl0gLyBiWzJdO1xuICAgIG91dFszXSA9IGFbM10gLyBiWzNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjNC5kaXZpZGV9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjNC5kaXYgPSB2ZWM0LmRpdmlkZTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtaW5pbXVtIG9mIHR3byB2ZWM0J3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQubWluID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gTWF0aC5taW4oYVswXSwgYlswXSk7XG4gICAgb3V0WzFdID0gTWF0aC5taW4oYVsxXSwgYlsxXSk7XG4gICAgb3V0WzJdID0gTWF0aC5taW4oYVsyXSwgYlsyXSk7XG4gICAgb3V0WzNdID0gTWF0aC5taW4oYVszXSwgYlszXSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbWF4aW11bSBvZiB0d28gdmVjNCdzXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0Lm1heCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IE1hdGgubWF4KGFbMF0sIGJbMF0pO1xuICAgIG91dFsxXSA9IE1hdGgubWF4KGFbMV0sIGJbMV0pO1xuICAgIG91dFsyXSA9IE1hdGgubWF4KGFbMl0sIGJbMl0pO1xuICAgIG91dFszXSA9IE1hdGgubWF4KGFbM10sIGJbM10pO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlcyBhIHZlYzQgYnkgYSBzY2FsYXIgbnVtYmVyXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgdmVjdG9yIHRvIHNjYWxlXG4gKiBAcGFyYW0ge051bWJlcn0gYiBhbW91bnQgdG8gc2NhbGUgdGhlIHZlY3RvciBieVxuICogQHJldHVybnMge3ZlYzR9IG91dFxuICovXG52ZWM0LnNjYWxlID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAqIGI7XG4gICAgb3V0WzFdID0gYVsxXSAqIGI7XG4gICAgb3V0WzJdID0gYVsyXSAqIGI7XG4gICAgb3V0WzNdID0gYVszXSAqIGI7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWRkcyB0d28gdmVjNCdzIGFmdGVyIHNjYWxpbmcgdGhlIHNlY29uZCBvcGVyYW5kIGJ5IGEgc2NhbGFyIHZhbHVlXG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWM0fSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHBhcmFtIHtOdW1iZXJ9IHNjYWxlIHRoZSBhbW91bnQgdG8gc2NhbGUgYiBieSBiZWZvcmUgYWRkaW5nXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQuc2NhbGVBbmRBZGQgPSBmdW5jdGlvbihvdXQsIGEsIGIsIHNjYWxlKSB7XG4gICAgb3V0WzBdID0gYVswXSArIChiWzBdICogc2NhbGUpO1xuICAgIG91dFsxXSA9IGFbMV0gKyAoYlsxXSAqIHNjYWxlKTtcbiAgICBvdXRbMl0gPSBhWzJdICsgKGJbMl0gKiBzY2FsZSk7XG4gICAgb3V0WzNdID0gYVszXSArIChiWzNdICogc2NhbGUpO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGV1Y2xpZGlhbiBkaXN0YW5jZSBiZXR3ZWVuIHR3byB2ZWM0J3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRpc3RhbmNlIGJldHdlZW4gYSBhbmQgYlxuICovXG52ZWM0LmRpc3RhbmNlID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciB4ID0gYlswXSAtIGFbMF0sXG4gICAgICAgIHkgPSBiWzFdIC0gYVsxXSxcbiAgICAgICAgeiA9IGJbMl0gLSBhWzJdLFxuICAgICAgICB3ID0gYlszXSAtIGFbM107XG4gICAgcmV0dXJuIE1hdGguc3FydCh4KnggKyB5KnkgKyB6KnogKyB3KncpO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzQuZGlzdGFuY2V9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjNC5kaXN0ID0gdmVjNC5kaXN0YW5jZTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGV1Y2xpZGlhbiBkaXN0YW5jZSBiZXR3ZWVuIHR3byB2ZWM0J3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IHNxdWFyZWQgZGlzdGFuY2UgYmV0d2VlbiBhIGFuZCBiXG4gKi9cbnZlYzQuc3F1YXJlZERpc3RhbmNlID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciB4ID0gYlswXSAtIGFbMF0sXG4gICAgICAgIHkgPSBiWzFdIC0gYVsxXSxcbiAgICAgICAgeiA9IGJbMl0gLSBhWzJdLFxuICAgICAgICB3ID0gYlszXSAtIGFbM107XG4gICAgcmV0dXJuIHgqeCArIHkqeSArIHoqeiArIHcqdztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWM0LnNxdWFyZWREaXN0YW5jZX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWM0LnNxckRpc3QgPSB2ZWM0LnNxdWFyZWREaXN0YW5jZTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBsZW5ndGggb2YgYSB2ZWM0XG4gKlxuICogQHBhcmFtIHt2ZWM0fSBhIHZlY3RvciB0byBjYWxjdWxhdGUgbGVuZ3RoIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBsZW5ndGggb2YgYVxuICovXG52ZWM0Lmxlbmd0aCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXSxcbiAgICAgICAgeiA9IGFbMl0sXG4gICAgICAgIHcgPSBhWzNdO1xuICAgIHJldHVybiBNYXRoLnNxcnQoeCp4ICsgeSp5ICsgeip6ICsgdyp3KTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWM0Lmxlbmd0aH1cbiAqIEBmdW5jdGlvblxuICovXG52ZWM0LmxlbiA9IHZlYzQubGVuZ3RoO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgbGVuZ3RoIG9mIGEgdmVjNFxuICpcbiAqIEBwYXJhbSB7dmVjNH0gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIHNxdWFyZWQgbGVuZ3RoIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBzcXVhcmVkIGxlbmd0aCBvZiBhXG4gKi9cbnZlYzQuc3F1YXJlZExlbmd0aCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXSxcbiAgICAgICAgeiA9IGFbMl0sXG4gICAgICAgIHcgPSBhWzNdO1xuICAgIHJldHVybiB4KnggKyB5KnkgKyB6KnogKyB3Knc7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjNC5zcXVhcmVkTGVuZ3RofVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzQuc3FyTGVuID0gdmVjNC5zcXVhcmVkTGVuZ3RoO1xuXG4vKipcbiAqIE5lZ2F0ZXMgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWM0XG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB2ZWN0b3IgdG8gbmVnYXRlXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQubmVnYXRlID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gLWFbMF07XG4gICAgb3V0WzFdID0gLWFbMV07XG4gICAgb3V0WzJdID0gLWFbMl07XG4gICAgb3V0WzNdID0gLWFbM107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW52ZXJzZSBvZiB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzRcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHZlY3RvciB0byBpbnZlcnRcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5pbnZlcnNlID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gIG91dFswXSA9IDEuMCAvIGFbMF07XG4gIG91dFsxXSA9IDEuMCAvIGFbMV07XG4gIG91dFsyXSA9IDEuMCAvIGFbMl07XG4gIG91dFszXSA9IDEuMCAvIGFbM107XG4gIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIHZlYzRcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHZlY3RvciB0byBub3JtYWxpemVcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC5ub3JtYWxpemUgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdLFxuICAgICAgICB6ID0gYVsyXSxcbiAgICAgICAgdyA9IGFbM107XG4gICAgdmFyIGxlbiA9IHgqeCArIHkqeSArIHoqeiArIHcqdztcbiAgICBpZiAobGVuID4gMCkge1xuICAgICAgICBsZW4gPSAxIC8gTWF0aC5zcXJ0KGxlbik7XG4gICAgICAgIG91dFswXSA9IHggKiBsZW47XG4gICAgICAgIG91dFsxXSA9IHkgKiBsZW47XG4gICAgICAgIG91dFsyXSA9IHogKiBsZW47XG4gICAgICAgIG91dFszXSA9IHcgKiBsZW47XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGRvdCBwcm9kdWN0IG9mIHR3byB2ZWM0J3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjNH0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRvdCBwcm9kdWN0IG9mIGEgYW5kIGJcbiAqL1xudmVjNC5kb3QgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhWzBdICogYlswXSArIGFbMV0gKiBiWzFdICsgYVsyXSAqIGJbMl0gKyBhWzNdICogYlszXTtcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgYSBsaW5lYXIgaW50ZXJwb2xhdGlvbiBiZXR3ZWVuIHR3byB2ZWM0J3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzR9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudCBiZXR3ZWVuIHRoZSB0d28gaW5wdXRzXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQubGVycCA9IGZ1bmN0aW9uIChvdXQsIGEsIGIsIHQpIHtcbiAgICB2YXIgYXggPSBhWzBdLFxuICAgICAgICBheSA9IGFbMV0sXG4gICAgICAgIGF6ID0gYVsyXSxcbiAgICAgICAgYXcgPSBhWzNdO1xuICAgIG91dFswXSA9IGF4ICsgdCAqIChiWzBdIC0gYXgpO1xuICAgIG91dFsxXSA9IGF5ICsgdCAqIChiWzFdIC0gYXkpO1xuICAgIG91dFsyXSA9IGF6ICsgdCAqIChiWzJdIC0gYXopO1xuICAgIG91dFszXSA9IGF3ICsgdCAqIChiWzNdIC0gYXcpO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHJhbmRvbSB2ZWN0b3Igd2l0aCB0aGUgZ2l2ZW4gc2NhbGVcbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHtOdW1iZXJ9IFtzY2FsZV0gTGVuZ3RoIG9mIHRoZSByZXN1bHRpbmcgdmVjdG9yLiBJZiBvbW1pdHRlZCwgYSB1bml0IHZlY3RvciB3aWxsIGJlIHJldHVybmVkXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQucmFuZG9tID0gZnVuY3Rpb24gKG91dCwgc2NhbGUpIHtcbiAgICBzY2FsZSA9IHNjYWxlIHx8IDEuMDtcblxuICAgIC8vVE9ETzogVGhpcyBpcyBhIHByZXR0eSBhd2Z1bCB3YXkgb2YgZG9pbmcgdGhpcy4gRmluZCBzb21ldGhpbmcgYmV0dGVyLlxuICAgIG91dFswXSA9IGdsTWF0cml4LlJBTkRPTSgpO1xuICAgIG91dFsxXSA9IGdsTWF0cml4LlJBTkRPTSgpO1xuICAgIG91dFsyXSA9IGdsTWF0cml4LlJBTkRPTSgpO1xuICAgIG91dFszXSA9IGdsTWF0cml4LlJBTkRPTSgpO1xuICAgIHZlYzQubm9ybWFsaXplKG91dCwgb3V0KTtcbiAgICB2ZWM0LnNjYWxlKG91dCwgb3V0LCBzY2FsZSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNmb3JtcyB0aGUgdmVjNCB3aXRoIGEgbWF0NC5cbiAqXG4gKiBAcGFyYW0ge3ZlYzR9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWM0fSBhIHRoZSB2ZWN0b3IgdG8gdHJhbnNmb3JtXG4gKiBAcGFyYW0ge21hdDR9IG0gbWF0cml4IHRvIHRyYW5zZm9ybSB3aXRoXG4gKiBAcmV0dXJucyB7dmVjNH0gb3V0XG4gKi9cbnZlYzQudHJhbnNmb3JtTWF0NCA9IGZ1bmN0aW9uKG91dCwgYSwgbSkge1xuICAgIHZhciB4ID0gYVswXSwgeSA9IGFbMV0sIHogPSBhWzJdLCB3ID0gYVszXTtcbiAgICBvdXRbMF0gPSBtWzBdICogeCArIG1bNF0gKiB5ICsgbVs4XSAqIHogKyBtWzEyXSAqIHc7XG4gICAgb3V0WzFdID0gbVsxXSAqIHggKyBtWzVdICogeSArIG1bOV0gKiB6ICsgbVsxM10gKiB3O1xuICAgIG91dFsyXSA9IG1bMl0gKiB4ICsgbVs2XSAqIHkgKyBtWzEwXSAqIHogKyBtWzE0XSAqIHc7XG4gICAgb3V0WzNdID0gbVszXSAqIHggKyBtWzddICogeSArIG1bMTFdICogeiArIG1bMTVdICogdztcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWM0IHdpdGggYSBxdWF0XG4gKlxuICogQHBhcmFtIHt2ZWM0fSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjNH0gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICogQHBhcmFtIHtxdWF0fSBxIHF1YXRlcm5pb24gdG8gdHJhbnNmb3JtIHdpdGhcbiAqIEByZXR1cm5zIHt2ZWM0fSBvdXRcbiAqL1xudmVjNC50cmFuc2Zvcm1RdWF0ID0gZnVuY3Rpb24ob3V0LCBhLCBxKSB7XG4gICAgdmFyIHggPSBhWzBdLCB5ID0gYVsxXSwgeiA9IGFbMl0sXG4gICAgICAgIHF4ID0gcVswXSwgcXkgPSBxWzFdLCBxeiA9IHFbMl0sIHF3ID0gcVszXSxcblxuICAgICAgICAvLyBjYWxjdWxhdGUgcXVhdCAqIHZlY1xuICAgICAgICBpeCA9IHF3ICogeCArIHF5ICogeiAtIHF6ICogeSxcbiAgICAgICAgaXkgPSBxdyAqIHkgKyBxeiAqIHggLSBxeCAqIHosXG4gICAgICAgIGl6ID0gcXcgKiB6ICsgcXggKiB5IC0gcXkgKiB4LFxuICAgICAgICBpdyA9IC1xeCAqIHggLSBxeSAqIHkgLSBxeiAqIHo7XG5cbiAgICAvLyBjYWxjdWxhdGUgcmVzdWx0ICogaW52ZXJzZSBxdWF0XG4gICAgb3V0WzBdID0gaXggKiBxdyArIGl3ICogLXF4ICsgaXkgKiAtcXogLSBpeiAqIC1xeTtcbiAgICBvdXRbMV0gPSBpeSAqIHF3ICsgaXcgKiAtcXkgKyBpeiAqIC1xeCAtIGl4ICogLXF6O1xuICAgIG91dFsyXSA9IGl6ICogcXcgKyBpdyAqIC1xeiArIGl4ICogLXF5IC0gaXkgKiAtcXg7XG4gICAgb3V0WzNdID0gYVszXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBQZXJmb3JtIHNvbWUgb3BlcmF0aW9uIG92ZXIgYW4gYXJyYXkgb2YgdmVjNHMuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYSB0aGUgYXJyYXkgb2YgdmVjdG9ycyB0byBpdGVyYXRlIG92ZXJcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdHJpZGUgTnVtYmVyIG9mIGVsZW1lbnRzIGJldHdlZW4gdGhlIHN0YXJ0IG9mIGVhY2ggdmVjNC4gSWYgMCBhc3N1bWVzIHRpZ2h0bHkgcGFja2VkXG4gKiBAcGFyYW0ge051bWJlcn0gb2Zmc2V0IE51bWJlciBvZiBlbGVtZW50cyB0byBza2lwIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFycmF5XG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgTnVtYmVyIG9mIHZlYzRzIHRvIGl0ZXJhdGUgb3Zlci4gSWYgMCBpdGVyYXRlcyBvdmVyIGVudGlyZSBhcnJheVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCB2ZWN0b3IgaW4gdGhlIGFycmF5XG4gKiBAcGFyYW0ge09iamVjdH0gW2FyZ10gYWRkaXRpb25hbCBhcmd1bWVudCB0byBwYXNzIHRvIGZuXG4gKiBAcmV0dXJucyB7QXJyYXl9IGFcbiAqIEBmdW5jdGlvblxuICovXG52ZWM0LmZvckVhY2ggPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZlYyA9IHZlYzQuY3JlYXRlKCk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oYSwgc3RyaWRlLCBvZmZzZXQsIGNvdW50LCBmbiwgYXJnKSB7XG4gICAgICAgIHZhciBpLCBsO1xuICAgICAgICBpZighc3RyaWRlKSB7XG4gICAgICAgICAgICBzdHJpZGUgPSA0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIW9mZnNldCkge1xuICAgICAgICAgICAgb2Zmc2V0ID0gMDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYoY291bnQpIHtcbiAgICAgICAgICAgIGwgPSBNYXRoLm1pbigoY291bnQgKiBzdHJpZGUpICsgb2Zmc2V0LCBhLmxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsID0gYS5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaSA9IG9mZnNldDsgaSA8IGw7IGkgKz0gc3RyaWRlKSB7XG4gICAgICAgICAgICB2ZWNbMF0gPSBhW2ldOyB2ZWNbMV0gPSBhW2krMV07IHZlY1syXSA9IGFbaSsyXTsgdmVjWzNdID0gYVtpKzNdO1xuICAgICAgICAgICAgZm4odmVjLCB2ZWMsIGFyZyk7XG4gICAgICAgICAgICBhW2ldID0gdmVjWzBdOyBhW2krMV0gPSB2ZWNbMV07IGFbaSsyXSA9IHZlY1syXTsgYVtpKzNdID0gdmVjWzNdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYTtcbiAgICB9O1xufSkoKTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgdmVjdG9yXG4gKlxuICogQHBhcmFtIHt2ZWM0fSB2ZWMgdmVjdG9yIHRvIHJlcHJlc2VudCBhcyBhIHN0cmluZ1xuICogQHJldHVybnMge1N0cmluZ30gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3JcbiAqL1xudmVjNC5zdHIgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiAndmVjNCgnICsgYVswXSArICcsICcgKyBhWzFdICsgJywgJyArIGFbMl0gKyAnLCAnICsgYVszXSArICcpJztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdmVjNDtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2dsLW1hdHJpeC9zcmMvZ2wtbWF0cml4L3ZlYzQuanNcbiAqKiBtb2R1bGUgaWQgPSAxMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiLyogQ29weXJpZ2h0IChjKSAyMDE1LCBCcmFuZG9uIEpvbmVzLCBDb2xpbiBNYWNLZW56aWUgSVYuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS4gKi9cblxudmFyIGdsTWF0cml4ID0gcmVxdWlyZShcIi4vY29tbW9uLmpzXCIpO1xuXG4vKipcbiAqIEBjbGFzcyAyIERpbWVuc2lvbmFsIFZlY3RvclxuICogQG5hbWUgdmVjMlxuICovXG52YXIgdmVjMiA9IHt9O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcsIGVtcHR5IHZlYzJcbiAqXG4gKiBAcmV0dXJucyB7dmVjMn0gYSBuZXcgMkQgdmVjdG9yXG4gKi9cbnZlYzIuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDIpO1xuICAgIG91dFswXSA9IDA7XG4gICAgb3V0WzFdID0gMDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHZlYzIgaW5pdGlhbGl6ZWQgd2l0aCB2YWx1ZXMgZnJvbSBhbiBleGlzdGluZyB2ZWN0b3JcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdmVjdG9yIHRvIGNsb25lXG4gKiBAcmV0dXJucyB7dmVjMn0gYSBuZXcgMkQgdmVjdG9yXG4gKi9cbnZlYzIuY2xvbmUgPSBmdW5jdGlvbihhKSB7XG4gICAgdmFyIG91dCA9IG5ldyBnbE1hdHJpeC5BUlJBWV9UWVBFKDIpO1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHZlYzIgaW5pdGlhbGl6ZWQgd2l0aCB0aGUgZ2l2ZW4gdmFsdWVzXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggWCBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFkgY29tcG9uZW50XG4gKiBAcmV0dXJucyB7dmVjMn0gYSBuZXcgMkQgdmVjdG9yXG4gKi9cbnZlYzIuZnJvbVZhbHVlcyA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB2YXIgb3V0ID0gbmV3IGdsTWF0cml4LkFSUkFZX1RZUEUoMik7XG4gICAgb3V0WzBdID0geDtcbiAgICBvdXRbMV0gPSB5O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSB2ZWMyIHRvIGFub3RoZXJcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBzb3VyY2UgdmVjdG9yXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIuY29weSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWMyIHRvIHRoZSBnaXZlbiB2YWx1ZXNcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHtOdW1iZXJ9IHggWCBjb21wb25lbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFkgY29tcG9uZW50XG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIuc2V0ID0gZnVuY3Rpb24ob3V0LCB4LCB5KSB7XG4gICAgb3V0WzBdID0geDtcbiAgICBvdXRbMV0gPSB5O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFkZHMgdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5hZGQgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdICsgYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdICsgYlsxXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdHMgdmVjdG9yIGIgZnJvbSB2ZWN0b3IgYVxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5zdWJ0cmFjdCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gLSBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gLSBiWzFdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMi5zdWJ0cmFjdH1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMyLnN1YiA9IHZlYzIuc3VidHJhY3Q7XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gdmVjMidzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLm11bHRpcGx5ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAqIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAqIGJbMV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMyLm11bHRpcGx5fVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzIubXVsID0gdmVjMi5tdWx0aXBseTtcblxuLyoqXG4gKiBEaXZpZGVzIHR3byB2ZWMyJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIuZGl2aWRlID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAvIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAvIGJbMV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMyLmRpdmlkZX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMyLmRpdiA9IHZlYzIuZGl2aWRlO1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG1pbmltdW0gb2YgdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5taW4gPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBNYXRoLm1pbihhWzBdLCBiWzBdKTtcbiAgICBvdXRbMV0gPSBNYXRoLm1pbihhWzFdLCBiWzFdKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtYXhpbXVtIG9mIHR3byB2ZWMyJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIubWF4ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gTWF0aC5tYXgoYVswXSwgYlswXSk7XG4gICAgb3V0WzFdID0gTWF0aC5tYXgoYVsxXSwgYlsxXSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogU2NhbGVzIGEgdmVjMiBieSBhIHNjYWxhciBudW1iZXJcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSB2ZWN0b3IgdG8gc2NhbGVcbiAqIEBwYXJhbSB7TnVtYmVyfSBiIGFtb3VudCB0byBzY2FsZSB0aGUgdmVjdG9yIGJ5XG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIuc2NhbGUgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdICogYjtcbiAgICBvdXRbMV0gPSBhWzFdICogYjtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBZGRzIHR3byB2ZWMyJ3MgYWZ0ZXIgc2NhbGluZyB0aGUgc2Vjb25kIG9wZXJhbmQgYnkgYSBzY2FsYXIgdmFsdWVcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gc2NhbGUgdGhlIGFtb3VudCB0byBzY2FsZSBiIGJ5IGJlZm9yZSBhZGRpbmdcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5zY2FsZUFuZEFkZCA9IGZ1bmN0aW9uKG91dCwgYSwgYiwgc2NhbGUpIHtcbiAgICBvdXRbMF0gPSBhWzBdICsgKGJbMF0gKiBzY2FsZSk7XG4gICAgb3V0WzFdID0gYVsxXSArIChiWzFdICogc2NhbGUpO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGV1Y2xpZGlhbiBkaXN0YW5jZSBiZXR3ZWVuIHR3byB2ZWMyJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IGRpc3RhbmNlIGJldHdlZW4gYSBhbmQgYlxuICovXG52ZWMyLmRpc3RhbmNlID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciB4ID0gYlswXSAtIGFbMF0sXG4gICAgICAgIHkgPSBiWzFdIC0gYVsxXTtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHgqeCArIHkqeSk7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMi5kaXN0YW5jZX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMyLmRpc3QgPSB2ZWMyLmRpc3RhbmNlO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgZXVjbGlkaWFuIGRpc3RhbmNlIGJldHdlZW4gdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gc3F1YXJlZCBkaXN0YW5jZSBiZXR3ZWVuIGEgYW5kIGJcbiAqL1xudmVjMi5zcXVhcmVkRGlzdGFuY2UgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIHggPSBiWzBdIC0gYVswXSxcbiAgICAgICAgeSA9IGJbMV0gLSBhWzFdO1xuICAgIHJldHVybiB4KnggKyB5Knk7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMi5zcXVhcmVkRGlzdGFuY2V9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMi5zcXJEaXN0ID0gdmVjMi5zcXVhcmVkRGlzdGFuY2U7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgbGVuZ3RoIG9mIGEgdmVjMlxuICpcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIGxlbmd0aCBvZlxuICogQHJldHVybnMge051bWJlcn0gbGVuZ3RoIG9mIGFcbiAqL1xudmVjMi5sZW5ndGggPSBmdW5jdGlvbiAoYSkge1xuICAgIHZhciB4ID0gYVswXSxcbiAgICAgICAgeSA9IGFbMV07XG4gICAgcmV0dXJuIE1hdGguc3FydCh4KnggKyB5KnkpO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzIubGVuZ3RofVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzIubGVuID0gdmVjMi5sZW5ndGg7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgc3F1YXJlZCBsZW5ndGggb2YgYSB2ZWMyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBhIHZlY3RvciB0byBjYWxjdWxhdGUgc3F1YXJlZCBsZW5ndGggb2ZcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IHNxdWFyZWQgbGVuZ3RoIG9mIGFcbiAqL1xudmVjMi5zcXVhcmVkTGVuZ3RoID0gZnVuY3Rpb24gKGEpIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdO1xuICAgIHJldHVybiB4KnggKyB5Knk7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMi5zcXVhcmVkTGVuZ3RofVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzIuc3FyTGVuID0gdmVjMi5zcXVhcmVkTGVuZ3RoO1xuXG4vKipcbiAqIE5lZ2F0ZXMgdGhlIGNvbXBvbmVudHMgb2YgYSB2ZWMyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gbmVnYXRlXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIubmVnYXRlID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gLWFbMF07XG4gICAgb3V0WzFdID0gLWFbMV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW52ZXJzZSBvZiB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzJcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHZlY3RvciB0byBpbnZlcnRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5pbnZlcnNlID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gIG91dFswXSA9IDEuMCAvIGFbMF07XG4gIG91dFsxXSA9IDEuMCAvIGFbMV07XG4gIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIE5vcm1hbGl6ZSBhIHZlYzJcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHZlY3RvciB0byBub3JtYWxpemVcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5ub3JtYWxpemUgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdO1xuICAgIHZhciBsZW4gPSB4KnggKyB5Knk7XG4gICAgaWYgKGxlbiA+IDApIHtcbiAgICAgICAgLy9UT0RPOiBldmFsdWF0ZSB1c2Ugb2YgZ2xtX2ludnNxcnQgaGVyZT9cbiAgICAgICAgbGVuID0gMSAvIE1hdGguc3FydChsZW4pO1xuICAgICAgICBvdXRbMF0gPSBhWzBdICogbGVuO1xuICAgICAgICBvdXRbMV0gPSBhWzFdICogbGVuO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBkb3QgcHJvZHVjdCBvZiB0d28gdmVjMidzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkb3QgcHJvZHVjdCBvZiBhIGFuZCBiXG4gKi9cbnZlYzIuZG90ID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gYVswXSAqIGJbMF0gKyBhWzFdICogYlsxXTtcbn07XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIGNyb3NzIHByb2R1Y3Qgb2YgdHdvIHZlYzInc1xuICogTm90ZSB0aGF0IHRoZSBjcm9zcyBwcm9kdWN0IG11c3QgYnkgZGVmaW5pdGlvbiBwcm9kdWNlIGEgM0QgdmVjdG9yXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG52ZWMyLmNyb3NzID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgdmFyIHogPSBhWzBdICogYlsxXSAtIGFbMV0gKiBiWzBdO1xuICAgIG91dFswXSA9IG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gejtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIGxpbmVhciBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSB0IGludGVycG9sYXRpb24gYW1vdW50IGJldHdlZW4gdGhlIHR3byBpbnB1dHNcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5sZXJwID0gZnVuY3Rpb24gKG91dCwgYSwgYiwgdCkge1xuICAgIHZhciBheCA9IGFbMF0sXG4gICAgICAgIGF5ID0gYVsxXTtcbiAgICBvdXRbMF0gPSBheCArIHQgKiAoYlswXSAtIGF4KTtcbiAgICBvdXRbMV0gPSBheSArIHQgKiAoYlsxXSAtIGF5KTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSByYW5kb20gdmVjdG9yIHdpdGggdGhlIGdpdmVuIHNjYWxlXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7TnVtYmVyfSBbc2NhbGVdIExlbmd0aCBvZiB0aGUgcmVzdWx0aW5nIHZlY3Rvci4gSWYgb21taXR0ZWQsIGEgdW5pdCB2ZWN0b3Igd2lsbCBiZSByZXR1cm5lZFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnJhbmRvbSA9IGZ1bmN0aW9uIChvdXQsIHNjYWxlKSB7XG4gICAgc2NhbGUgPSBzY2FsZSB8fCAxLjA7XG4gICAgdmFyIHIgPSBnbE1hdHJpeC5SQU5ET00oKSAqIDIuMCAqIE1hdGguUEk7XG4gICAgb3V0WzBdID0gTWF0aC5jb3MocikgKiBzY2FsZTtcbiAgICBvdXRbMV0gPSBNYXRoLnNpbihyKSAqIHNjYWxlO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzIgd2l0aCBhIG1hdDJcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSB2ZWN0b3IgdG8gdHJhbnNmb3JtXG4gKiBAcGFyYW0ge21hdDJ9IG0gbWF0cml4IHRvIHRyYW5zZm9ybSB3aXRoXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIudHJhbnNmb3JtTWF0MiA9IGZ1bmN0aW9uKG91dCwgYSwgbSkge1xuICAgIHZhciB4ID0gYVswXSxcbiAgICAgICAgeSA9IGFbMV07XG4gICAgb3V0WzBdID0gbVswXSAqIHggKyBtWzJdICogeTtcbiAgICBvdXRbMV0gPSBtWzFdICogeCArIG1bM10gKiB5O1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzIgd2l0aCBhIG1hdDJkXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICogQHBhcmFtIHttYXQyZH0gbSBtYXRyaXggdG8gdHJhbnNmb3JtIHdpdGhcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi50cmFuc2Zvcm1NYXQyZCA9IGZ1bmN0aW9uKG91dCwgYSwgbSkge1xuICAgIHZhciB4ID0gYVswXSxcbiAgICAgICAgeSA9IGFbMV07XG4gICAgb3V0WzBdID0gbVswXSAqIHggKyBtWzJdICogeSArIG1bNF07XG4gICAgb3V0WzFdID0gbVsxXSAqIHggKyBtWzNdICogeSArIG1bNV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNmb3JtcyB0aGUgdmVjMiB3aXRoIGEgbWF0M1xuICogM3JkIHZlY3RvciBjb21wb25lbnQgaXMgaW1wbGljaXRseSAnMSdcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSB2ZWN0b3IgdG8gdHJhbnNmb3JtXG4gKiBAcGFyYW0ge21hdDN9IG0gbWF0cml4IHRvIHRyYW5zZm9ybSB3aXRoXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIudHJhbnNmb3JtTWF0MyA9IGZ1bmN0aW9uKG91dCwgYSwgbSkge1xuICAgIHZhciB4ID0gYVswXSxcbiAgICAgICAgeSA9IGFbMV07XG4gICAgb3V0WzBdID0gbVswXSAqIHggKyBtWzNdICogeSArIG1bNl07XG4gICAgb3V0WzFdID0gbVsxXSAqIHggKyBtWzRdICogeSArIG1bN107XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogVHJhbnNmb3JtcyB0aGUgdmVjMiB3aXRoIGEgbWF0NFxuICogM3JkIHZlY3RvciBjb21wb25lbnQgaXMgaW1wbGljaXRseSAnMCdcbiAqIDR0aCB2ZWN0b3IgY29tcG9uZW50IGlzIGltcGxpY2l0bHkgJzEnXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICogQHBhcmFtIHttYXQ0fSBtIG1hdHJpeCB0byB0cmFuc2Zvcm0gd2l0aFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnRyYW5zZm9ybU1hdDQgPSBmdW5jdGlvbihvdXQsIGEsIG0pIHtcbiAgICB2YXIgeCA9IGFbMF0sIFxuICAgICAgICB5ID0gYVsxXTtcbiAgICBvdXRbMF0gPSBtWzBdICogeCArIG1bNF0gKiB5ICsgbVsxMl07XG4gICAgb3V0WzFdID0gbVsxXSAqIHggKyBtWzVdICogeSArIG1bMTNdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFBlcmZvcm0gc29tZSBvcGVyYXRpb24gb3ZlciBhbiBhcnJheSBvZiB2ZWMycy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBhIHRoZSBhcnJheSBvZiB2ZWN0b3JzIHRvIGl0ZXJhdGUgb3ZlclxuICogQHBhcmFtIHtOdW1iZXJ9IHN0cmlkZSBOdW1iZXIgb2YgZWxlbWVudHMgYmV0d2VlbiB0aGUgc3RhcnQgb2YgZWFjaCB2ZWMyLiBJZiAwIGFzc3VtZXMgdGlnaHRseSBwYWNrZWRcbiAqIEBwYXJhbSB7TnVtYmVyfSBvZmZzZXQgTnVtYmVyIG9mIGVsZW1lbnRzIHRvIHNraXAgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgYXJyYXlcbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBOdW1iZXIgb2YgdmVjMnMgdG8gaXRlcmF0ZSBvdmVyLiBJZiAwIGl0ZXJhdGVzIG92ZXIgZW50aXJlIGFycmF5XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBGdW5jdGlvbiB0byBjYWxsIGZvciBlYWNoIHZlY3RvciBpbiB0aGUgYXJyYXlcbiAqIEBwYXJhbSB7T2JqZWN0fSBbYXJnXSBhZGRpdGlvbmFsIGFyZ3VtZW50IHRvIHBhc3MgdG8gZm5cbiAqIEByZXR1cm5zIHtBcnJheX0gYVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzIuZm9yRWFjaCA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgdmVjID0gdmVjMi5jcmVhdGUoKTtcblxuICAgIHJldHVybiBmdW5jdGlvbihhLCBzdHJpZGUsIG9mZnNldCwgY291bnQsIGZuLCBhcmcpIHtcbiAgICAgICAgdmFyIGksIGw7XG4gICAgICAgIGlmKCFzdHJpZGUpIHtcbiAgICAgICAgICAgIHN0cmlkZSA9IDI7XG4gICAgICAgIH1cblxuICAgICAgICBpZighb2Zmc2V0KSB7XG4gICAgICAgICAgICBvZmZzZXQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZihjb3VudCkge1xuICAgICAgICAgICAgbCA9IE1hdGgubWluKChjb3VudCAqIHN0cmlkZSkgKyBvZmZzZXQsIGEubGVuZ3RoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGwgPSBhLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpID0gb2Zmc2V0OyBpIDwgbDsgaSArPSBzdHJpZGUpIHtcbiAgICAgICAgICAgIHZlY1swXSA9IGFbaV07IHZlY1sxXSA9IGFbaSsxXTtcbiAgICAgICAgICAgIGZuKHZlYywgdmVjLCBhcmcpO1xuICAgICAgICAgICAgYVtpXSA9IHZlY1swXTsgYVtpKzFdID0gdmVjWzFdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYTtcbiAgICB9O1xufSkoKTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgdmVjdG9yXG4gKlxuICogQHBhcmFtIHt2ZWMyfSB2ZWMgdmVjdG9yIHRvIHJlcHJlc2VudCBhcyBhIHN0cmluZ1xuICogQHJldHVybnMge1N0cmluZ30gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3JcbiAqL1xudmVjMi5zdHIgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiAndmVjMignICsgYVswXSArICcsICcgKyBhWzFdICsgJyknO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB2ZWMyO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vZ2wtbWF0cml4L3NyYy9nbC1tYXRyaXgvdmVjMi5qc1xuICoqIG1vZHVsZSBpZCA9IDEzXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0XCJmYWNlXCI6IHtcblx0XHRcInBvc2l0aW9uXCI6IFtcblx0XHRcdDAuMDM4Mixcblx0XHRcdC0wLjA2MzcsXG5cdFx0XHQwLjAyMzEsXG5cdFx0XHQwLFxuXHRcdFx0LTAuMDU5NSxcblx0XHRcdDAuMDM5Mixcblx0XHRcdDAsXG5cdFx0XHQtMC4xMDM1LFxuXHRcdFx0MC4wNyxcblx0XHRcdDAuMDM4NSxcblx0XHRcdC0wLjEwNDYsXG5cdFx0XHQwLjA1MjgsXG5cdFx0XHQwLjAzNjIsXG5cdFx0XHQwLjA4MTYsXG5cdFx0XHQtMC4wNTI4LFxuXHRcdFx0MCxcblx0XHRcdDAuMDg4NCxcblx0XHRcdC0wLjA0MDMsXG5cdFx0XHQwLFxuXHRcdFx0MCxcblx0XHRcdDAsXG5cdFx0XHQwLjA0MjQsXG5cdFx0XHQtMC4wMDg2LFxuXHRcdFx0LTAuMDE0MSxcblx0XHRcdDAuMDc1LFxuXHRcdFx0MC4wNDU4LFxuXHRcdFx0LTAuMDk2OCxcblx0XHRcdDAuMDc2OCxcblx0XHRcdC0wLjA0MTQsXG5cdFx0XHQtMC4wNzE4LFxuXHRcdFx0MCxcblx0XHRcdC0wLjE1MzUsXG5cdFx0XHQwLjA3MTYsXG5cdFx0XHQwLjAzODUsXG5cdFx0XHQtMC4xNDksXG5cdFx0XHQwLjA1NjEsXG5cdFx0XHQwLjA5MTUsXG5cdFx0XHQtMC4xNTE0LFxuXHRcdFx0LTAuMDExMSxcblx0XHRcdDAuMDkzLFxuXHRcdFx0LTAuMTE5OSxcblx0XHRcdC0wLjAyMTEsXG5cdFx0XHQwLFxuXHRcdFx0LTAuMTg0OCxcblx0XHRcdDAuMDQ3MSxcblx0XHRcdDAuMDMzOSxcblx0XHRcdC0wLjE3NzUsXG5cdFx0XHQwLjAzNDgsXG5cdFx0XHQwLjA4MDMsXG5cdFx0XHQtMC4xNzExLFxuXHRcdFx0LTAuMDA4LFxuXHRcdFx0MC4wMTQ3LFxuXHRcdFx0LTAuMTkwMyxcblx0XHRcdDAuMDA5NCxcblx0XHRcdDAsXG5cdFx0XHQtMC4xOTUzLFxuXHRcdFx0MC4wMTEsXG5cdFx0XHQwLjAzMDgsXG5cdFx0XHQtMC4yMDEsXG5cdFx0XHQtMC4wMjM3LFxuXHRcdFx0MCxcblx0XHRcdC0wLjIwODUsXG5cdFx0XHQtMC4wMTcsXG5cdFx0XHQwLjEyMTIsXG5cdFx0XHQtMC4wNTQ3LFxuXHRcdFx0LTAuMTAwNyxcblx0XHRcdDAuMTgzMixcblx0XHRcdC0wLjAxMDUsXG5cdFx0XHQtMC4xMjk1LFxuXHRcdFx0MC4yMzQzLFxuXHRcdFx0LTAuMDg1NSxcblx0XHRcdC0wLjEzODMsXG5cdFx0XHQwLjE3NjEsXG5cdFx0XHQtMC4xMzI5LFxuXHRcdFx0LTAuMTEzMSxcblx0XHRcdDAuMjIxOSxcblx0XHRcdC0wLjIzMDgsXG5cdFx0XHQtMC4xNDQyLFxuXHRcdFx0MC4yNDIsXG5cdFx0XHQtMC4yNzk0LFxuXHRcdFx0LTAuMTU3OSxcblx0XHRcdDAuMzA2NSxcblx0XHRcdC0wLjI0MDcsXG5cdFx0XHQtMC4yMjU1LFxuXHRcdFx0MC4yOTA2LFxuXHRcdFx0LTAuMTkxNSxcblx0XHRcdC0wLjE5NjMsXG5cdFx0XHQwLjE3Myxcblx0XHRcdC0wLjI1NzksXG5cdFx0XHQtMC4xMTM0LFxuXHRcdFx0MC4xOTM1LFxuXHRcdFx0LTAuMzAzMyxcblx0XHRcdC0wLjExOTIsXG5cdFx0XHQwLjI2ODMsXG5cdFx0XHQtMC4xMzk1LFxuXHRcdFx0LTAuMTYzMyxcblx0XHRcdDAuMjAwMixcblx0XHRcdC0wLjE4MDMsXG5cdFx0XHQtMC4xMjg2LFxuXHRcdFx0MC4xNTMyLFxuXHRcdFx0LTAuMjA3MSxcblx0XHRcdC0wLjEwNjgsXG5cdFx0XHQwLjMxNixcblx0XHRcdC0wLjI4NjksXG5cdFx0XHQtMC4yNDgyLFxuXHRcdFx0MC4yNTY1LFxuXHRcdFx0LTAuMzI0NCxcblx0XHRcdC0wLjE3MDEsXG5cdFx0XHQwLjIwNjIsXG5cdFx0XHQtMC4zMzk5LFxuXHRcdFx0LTAuMTI2Nixcblx0XHRcdDAuMzIwOCxcblx0XHRcdC0wLjM1ODUsXG5cdFx0XHQtMC4yNzg4LFxuXHRcdFx0MC4yMzg0LFxuXHRcdFx0LTAuNDEyMSxcblx0XHRcdC0wLjE2NzgsXG5cdFx0XHQwLjE5NDIsXG5cdFx0XHQtMC4zOTgsXG5cdFx0XHQtMC4xMjI2LFxuXHRcdFx0MC4xMzg5LFxuXHRcdFx0LTAuMzE5NSxcblx0XHRcdC0wLjA3Myxcblx0XHRcdDAuMTQ5NCxcblx0XHRcdC0wLjMzOTQsXG5cdFx0XHQtMC4xMDQ2LFxuXHRcdFx0MC4xNjc1LFxuXHRcdFx0LTAuMzI0Myxcblx0XHRcdC0wLjEwMzMsXG5cdFx0XHQwLjE0NDEsXG5cdFx0XHQtMC4yOTQ3LFxuXHRcdFx0LTAuMDc5Nyxcblx0XHRcdDAuMDc3Mixcblx0XHRcdC0wLjQyOTMsXG5cdFx0XHQtMC4wNjM1LFxuXHRcdFx0MCxcblx0XHRcdC0wLjQ0MDMsXG5cdFx0XHQtMC4wMzU1LFxuXHRcdFx0MCxcblx0XHRcdC0wLjQ3NTEsXG5cdFx0XHQtMC4wNDk2LFxuXHRcdFx0MC4wOTU4LFxuXHRcdFx0LTAuNDcwNCxcblx0XHRcdC0wLjA3NTEsXG5cdFx0XHQwLjEyNjYsXG5cdFx0XHQtMC40MDgzLFxuXHRcdFx0LTAuMDg0Nyxcblx0XHRcdDAuMTQ3NCxcblx0XHRcdC0wLjM1MzgsXG5cdFx0XHQtMC4xMTQyLFxuXHRcdFx0MC4xMTYsXG5cdFx0XHQtMC4zODUsXG5cdFx0XHQtMC4wODEzLFxuXHRcdFx0MC4xNjc5LFxuXHRcdFx0LTAuMzc1Nixcblx0XHRcdC0wLjExMTUsXG5cdFx0XHQwLjA4OTMsXG5cdFx0XHQtMC4yODkyLFxuXHRcdFx0LTAuMDM2Myxcblx0XHRcdDAuMDc1Nixcblx0XHRcdC0wLjMwNDMsXG5cdFx0XHQtMC4wMjE1LFxuXHRcdFx0MC4xNjYsXG5cdFx0XHQtMC4zNDc4LFxuXHRcdFx0LTAuMTE2NSxcblx0XHRcdDAuMTgxMyxcblx0XHRcdC0wLjM0NDUsXG5cdFx0XHQtMC4xMTcxLFxuXHRcdFx0MC4xNTQyLFxuXHRcdFx0LTAuMzQ2LFxuXHRcdFx0LTAuMTE4NCxcblx0XHRcdDAuMTQxOSxcblx0XHRcdC0wLjM1MjQsXG5cdFx0XHQtMC4xMjA1LFxuXHRcdFx0MC4xMjE5LFxuXHRcdFx0LTAuMzM2NSxcblx0XHRcdC0wLjA5MjcsXG5cdFx0XHQwLjE0MTEsXG5cdFx0XHQtMC4zNDIsXG5cdFx0XHQtMC4xMTM0LFxuXHRcdFx0MC4xMzI1LFxuXHRcdFx0LTAuMzI4Nyxcblx0XHRcdC0wLjA3OSxcblx0XHRcdDAuMDcyNixcblx0XHRcdC0wLjMyMSxcblx0XHRcdC0wLjAyODcsXG5cdFx0XHQwLjA2NjUsXG5cdFx0XHQtMC4zMzAyLFxuXHRcdFx0LTAuMDQ5Mixcblx0XHRcdDAsXG5cdFx0XHQtMC4zMDY3LFxuXHRcdFx0LTAuMDA1NCxcblx0XHRcdDAsXG5cdFx0XHQtMC4zMjExLFxuXHRcdFx0LTAuMDA4OCxcblx0XHRcdDAsXG5cdFx0XHQtMC4zMjkzLFxuXHRcdFx0LTAuMDMwMyxcblx0XHRcdDAuMTI1LFxuXHRcdFx0LTAuMjE5Nyxcblx0XHRcdC0wLjA4NjIsXG5cdFx0XHQwLjA1NTQsXG5cdFx0XHQtMC4yMzQ3LFxuXHRcdFx0LTAuMDM3Nixcblx0XHRcdDAuMDQwMyxcblx0XHRcdC0wLjI4Mixcblx0XHRcdC0wLjAyMDYsXG5cdFx0XHQwLFxuXHRcdFx0LTAuMjg4OSxcblx0XHRcdC0wLjAxMzcsXG5cdFx0XHQwLjEwNzQsXG5cdFx0XHQtMC4xNzU5LFxuXHRcdFx0LTAuMDg2MSxcblx0XHRcdDAuMTM0OSxcblx0XHRcdC0wLjE2MzIsXG5cdFx0XHQtMC4xMDIsXG5cdFx0XHQwLFxuXHRcdFx0LTAuMjQyNSxcblx0XHRcdC0wLjAyNzUsXG5cdFx0XHQwLjExODYsXG5cdFx0XHQtMC4xNTExLFxuXHRcdFx0LTAuMDg2Nyxcblx0XHRcdDAsXG5cdFx0XHQtMC41MjczLFxuXHRcdFx0LTAuMDM5Myxcblx0XHRcdDAuMTEzNixcblx0XHRcdC0wLjUxOTQsXG5cdFx0XHQtMC4wNzcsXG5cdFx0XHQwLjIyOSxcblx0XHRcdC0wLjUxMDIsXG5cdFx0XHQtMC4yMDgzLFxuXHRcdFx0MC4zMTg1LFxuXHRcdFx0LTAuNDI4Nyxcblx0XHRcdC0wLjMxMjEsXG5cdFx0XHQwLjM1MDEsXG5cdFx0XHQtMC4zODM2LFxuXHRcdFx0LTAuMzY3MSxcblx0XHRcdDAuMzQ1Mixcblx0XHRcdC0wLjMyMDUsXG5cdFx0XHQtMC4zMzIsXG5cdFx0XHQwLjM4MjIsXG5cdFx0XHQtMC4zMTExLFxuXHRcdFx0LTAuNDQ2NCxcblx0XHRcdDAuMzc0OSxcblx0XHRcdC0wLjI2MjgsXG5cdFx0XHQtMC40MDIzLFxuXHRcdFx0MC40Mzc0LFxuXHRcdFx0MC4xMzY0LFxuXHRcdFx0LTAuNTc5Mixcblx0XHRcdDAuNDI5Myxcblx0XHRcdDAuMjMwOCxcblx0XHRcdC0wLjU3MjUsXG5cdFx0XHQwLjM5NjgsXG5cdFx0XHQwLjIzODIsXG5cdFx0XHQtMC4zNjQ2LFxuXHRcdFx0MC40MTY2LFxuXHRcdFx0MC4wNDU2LFxuXHRcdFx0LTAuMzk5Mixcblx0XHRcdDAuNDM4Myxcblx0XHRcdDAuMDUzOCxcblx0XHRcdC0wLjU4MDIsXG5cdFx0XHQwLjQxNDYsXG5cdFx0XHQtMC4wMjc1LFxuXHRcdFx0LTAuNDI3Nixcblx0XHRcdDAuNDA5Nyxcblx0XHRcdC0wLjA4MTcsXG5cdFx0XHQtMC40NTU3LFxuXHRcdFx0MC40MDg3LFxuXHRcdFx0LTAuMTI1NCxcblx0XHRcdC0wLjQ3ODksXG5cdFx0XHQwLjQyODksXG5cdFx0XHQtMC4wODkyLFxuXHRcdFx0LTAuNTU4OCxcblx0XHRcdDAuNDM2Mixcblx0XHRcdC0wLjAxNCxcblx0XHRcdC0wLjU3MjQsXG5cdFx0XHQwLjQxMDQsXG5cdFx0XHQtMC4xODYzLFxuXHRcdFx0LTAuNTMsXG5cdFx0XHQwLjM1NjQsXG5cdFx0XHQwLjM1ODcsXG5cdFx0XHQtMC4zNjUzLFxuXHRcdFx0MC40MTI2LFxuXHRcdFx0MC4zNDUsXG5cdFx0XHQtMC41NDk1LFxuXHRcdFx0MC4zOTA4LFxuXHRcdFx0MC40NDcsXG5cdFx0XHQtMC41MTU5LFxuXHRcdFx0MC4zMjUzLFxuXHRcdFx0MC40NzU4LFxuXHRcdFx0LTAuMzg4NSxcblx0XHRcdDAuMTE4Mixcblx0XHRcdC0wLjU4OTcsXG5cdFx0XHQtMC4xMDUyLFxuXHRcdFx0MC4xMzg0LFxuXHRcdFx0MC4xMzY2LFxuXHRcdFx0LTAuMTU2OCxcblx0XHRcdDAuMTIyLFxuXHRcdFx0MC4xNDU3LFxuXHRcdFx0LTAuMTI4NCxcblx0XHRcdDAuMDg5Mixcblx0XHRcdDAuMTEwMixcblx0XHRcdC0wLjE0MjQsXG5cdFx0XHQwLjExMDIsXG5cdFx0XHQwLjEwNzUsXG5cdFx0XHQtMC4xNixcblx0XHRcdDAuMTg5MSxcblx0XHRcdDAuMDQwNSxcblx0XHRcdC0wLjE0NSxcblx0XHRcdDAuMTg2MSxcblx0XHRcdDAuMDY3Mixcblx0XHRcdC0wLjE1MTcsXG5cdFx0XHQwLjEzNjMsXG5cdFx0XHQwLjA4ODksXG5cdFx0XHQtMC4xNTczLFxuXHRcdFx0MC4xMjAxLFxuXHRcdFx0MC4wNjk5LFxuXHRcdFx0LTAuMTQzNCxcblx0XHRcdDAuMjMyMyxcblx0XHRcdDAuMDYxOCxcblx0XHRcdC0wLjE2MSxcblx0XHRcdDAuMjM4MSxcblx0XHRcdDAuMDM1Nixcblx0XHRcdC0wLjE2MjIsXG5cdFx0XHQwLjI4NDMsXG5cdFx0XHQwLjA3NzYsXG5cdFx0XHQtMC4xOTA2LFxuXHRcdFx0MC4yOTQ3LFxuXHRcdFx0MC4wNTY3LFxuXHRcdFx0LTAuMTk3OCxcblx0XHRcdDAuMzM2Nyxcblx0XHRcdDAuMTAyNCxcblx0XHRcdC0wLjI0MzMsXG5cdFx0XHQwLjMyMTUsXG5cdFx0XHQwLjExMDMsXG5cdFx0XHQtMC4yMzEsXG5cdFx0XHQwLjMzMTgsXG5cdFx0XHQwLjE0MjEsXG5cdFx0XHQtMC4yMDA1LFxuXHRcdFx0MC4zMTg0LFxuXHRcdFx0MC4xMzQ2LFxuXHRcdFx0LTAuMjA0OSxcblx0XHRcdDAuMzA5OSxcblx0XHRcdDAuMjYzLFxuXHRcdFx0LTAuMTUwNixcblx0XHRcdDAuMTUxNCxcblx0XHRcdDAuMTI3Myxcblx0XHRcdC0wLjE2MjUsXG5cdFx0XHQwLjEyODgsXG5cdFx0XHQwLjEwODEsXG5cdFx0XHQtMC4xNjc4LFxuXHRcdFx0MC4xODU3LFxuXHRcdFx0MC4wOTI3LFxuXHRcdFx0LTAuMTU2Nyxcblx0XHRcdDAuMTUxMSxcblx0XHRcdDAuMTA2OCxcblx0XHRcdC0wLjE2NTIsXG5cdFx0XHQwLjIyOTcsXG5cdFx0XHQwLjA4NjksXG5cdFx0XHQtMC4xNjE5LFxuXHRcdFx0MC4zMDk3LFxuXHRcdFx0MC4xMTYyLFxuXHRcdFx0LTAuMjIyNSxcblx0XHRcdDAuMjc5Nyxcblx0XHRcdDAuMDk2LFxuXHRcdFx0LTAuMTg4OSxcblx0XHRcdDAuMTQyMixcblx0XHRcdDAuMTEzNSxcblx0XHRcdC0wLjE3NTQsXG5cdFx0XHQwLjIzMzUsXG5cdFx0XHQwLjE3MDEsXG5cdFx0XHQtMC4xNTYsXG5cdFx0XHQwLjE4MjMsXG5cdFx0XHQwLjE2LFxuXHRcdFx0LTAuMTU2NCxcblx0XHRcdDAuMTgzMSxcblx0XHRcdDAuMTQ4LFxuXHRcdFx0LTAuMTU5OSxcblx0XHRcdDAuMjMyMixcblx0XHRcdDAuMTU2OCxcblx0XHRcdC0wLjE1NzQsXG5cdFx0XHQwLjI1MjMsXG5cdFx0XHQwLjIxNyxcblx0XHRcdC0wLjEwNDYsXG5cdFx0XHQwLjE4NTIsXG5cdFx0XHQwLjIwMTcsXG5cdFx0XHQtMC4wODg1LFxuXHRcdFx0MC4xODEzLFxuXHRcdFx0MC4xNjQzLFxuXHRcdFx0LTAuMTMxNCxcblx0XHRcdDAuMjM5OCxcblx0XHRcdDAuMTc0LFxuXHRcdFx0LTAuMTM0MSxcblx0XHRcdDAuMTA4Nyxcblx0XHRcdDAuMTcyNSxcblx0XHRcdC0wLjA4MSxcblx0XHRcdDAuMDY1Nixcblx0XHRcdDAuMTE5NSxcblx0XHRcdC0wLjEwMSxcblx0XHRcdDAuMjUzOCxcblx0XHRcdC0wLjAwMzQsXG5cdFx0XHQtMC4xNTQ1LFxuXHRcdFx0MC4zMTg5LFxuXHRcdFx0MC4wMjc0LFxuXHRcdFx0LTAuMjA3LFxuXHRcdFx0MC4zNjIyLFxuXHRcdFx0MC4wODYyLFxuXHRcdFx0LTAuMjU5MSxcblx0XHRcdDAuMzUyMyxcblx0XHRcdDAuMTc2OCxcblx0XHRcdC0wLjE5MzEsXG5cdFx0XHQwLjMwNDUsXG5cdFx0XHQwLjIwMzIsXG5cdFx0XHQtMC4xNDExLFxuXHRcdFx0MC4yNTM5LFxuXHRcdFx0MC4yODgsXG5cdFx0XHQtMC4xMDE3LFxuXHRcdFx0MC4wMzQxLFxuXHRcdFx0MC4xMjg5LFxuXHRcdFx0LTAuMDYyNCxcblx0XHRcdDAuMDcyOCxcblx0XHRcdDAuMjM5Myxcblx0XHRcdC0wLjA0NzcsXG5cdFx0XHQwLjM3MDEsXG5cdFx0XHQwLjIxMjgsXG5cdFx0XHQtMC4yNDg2LFxuXHRcdFx0MCxcblx0XHRcdDAuMTMxMyxcblx0XHRcdC0wLjA1MTksXG5cdFx0XHQwLFxuXHRcdFx0MC4yNDM3LFxuXHRcdFx0LTAuMDQzMixcblx0XHRcdDAuMjUxMSxcblx0XHRcdDAuMzM1Mixcblx0XHRcdC0wLjEyLFxuXHRcdFx0MC4yNTMzLFxuXHRcdFx0MC4zOTc5LFxuXHRcdFx0LTAuMTYzLFxuXHRcdFx0MC4xMixcblx0XHRcdDAuNDE3NSxcblx0XHRcdC0wLjEwMzksXG5cdFx0XHQwLjExODksXG5cdFx0XHQwLjMzNTcsXG5cdFx0XHQtMC4wNjc5LFxuXHRcdFx0MCxcblx0XHRcdDAuNDE5Mixcblx0XHRcdC0wLjA5MTksXG5cdFx0XHQwLFxuXHRcdFx0MC4zMzI2LFxuXHRcdFx0LTAuMDYxMixcblx0XHRcdDAuMTIzNSxcblx0XHRcdDAuNTI3Nixcblx0XHRcdC0wLjE4ODgsXG5cdFx0XHQwLjI0NDksXG5cdFx0XHQwLjUxMTksXG5cdFx0XHQtMC4yNTAxLFxuXHRcdFx0MCxcblx0XHRcdDAuNTM1OSxcblx0XHRcdC0wLjE3MzYsXG5cdFx0XHQwLjMyODYsXG5cdFx0XHQwLjU1MTEsXG5cdFx0XHQtMC40Mzg3LFxuXHRcdFx0MC4yMzgxLFxuXHRcdFx0MC42MDUxLFxuXHRcdFx0LTAuMzY3OCxcblx0XHRcdDAsXG5cdFx0XHQwLjYzNjUsXG5cdFx0XHQtMC4yOTU1LFxuXHRcdFx0MC4xMTk1LFxuXHRcdFx0MC42Mjk4LFxuXHRcdFx0LTAuMzE3Mixcblx0XHRcdDAuMzg4OCxcblx0XHRcdDAuMDU4NCxcblx0XHRcdC0wLjI4NzksXG5cdFx0XHQwLjM0OTYsXG5cdFx0XHQtMC4wMjI3LFxuXHRcdFx0LTAuMjIwNSxcblx0XHRcdDAuMjg1LFxuXHRcdFx0LTAuMDY0NCxcblx0XHRcdC0wLjE2MjgsXG5cdFx0XHQwLjMwOSxcblx0XHRcdC0wLjExNjYsXG5cdFx0XHQtMC4xOTEzLFxuXHRcdFx0MC4zMjQ1LFxuXHRcdFx0LTAuMTY4Myxcblx0XHRcdC0wLjIzMDgsXG5cdFx0XHQwLjMzMzgsXG5cdFx0XHQtMC4yMTQ4LFxuXHRcdFx0LTAuMjY2LFxuXHRcdFx0MC4zMzg1LFxuXHRcdFx0LTAuMjU2OSxcblx0XHRcdC0wLjI5NTQsXG5cdFx0XHQwLjM2MzIsXG5cdFx0XHQtMC4wNjk2LFxuXHRcdFx0LTAuMjUxMixcblx0XHRcdDAuMzY3LFxuXHRcdFx0LTAuMTIxMyxcblx0XHRcdC0wLjI5MzIsXG5cdFx0XHQwLjM3MDUsXG5cdFx0XHQtMC4xNjUzLFxuXHRcdFx0LTAuMzMxNyxcblx0XHRcdDAuMzcxOSxcblx0XHRcdC0wLjIwNDUsXG5cdFx0XHQtMC4zNjM3LFxuXHRcdFx0MC4zMDUyLFxuXHRcdFx0MC4xMjU4LFxuXHRcdFx0LTAuMjAxOCxcblx0XHRcdDAuMTI1LFxuXHRcdFx0LTAuMTI3Mixcblx0XHRcdC0wLjA5NjUsXG5cdFx0XHQwLjA4OCxcblx0XHRcdC0wLjA5MDMsXG5cdFx0XHQtMC4wMzYyLFxuXHRcdFx0MC4xMTEsXG5cdFx0XHQtMC4zNzMyLFxuXHRcdFx0LTAuMDg2Mixcblx0XHRcdDAuMTc5NSxcblx0XHRcdDAuMjc3Nyxcblx0XHRcdC0wLjA3NDksXG5cdFx0XHQwLjI5MDUsXG5cdFx0XHQwLjE2MTUsXG5cdFx0XHQtMC4xNjcxLFxuXHRcdFx0MC4yNzk4LFxuXHRcdFx0MC4xNTgzLFxuXHRcdFx0LTAuMTc5NSxcblx0XHRcdDAuMjc3Mixcblx0XHRcdDAuMTQ1OSxcblx0XHRcdC0wLjE4MSxcblx0XHRcdDAuMTA2Nixcblx0XHRcdC0wLjM2NjEsXG5cdFx0XHQtMC4wOTQzLFxuXHRcdFx0MCxcblx0XHRcdC0wLjYwNTMsXG5cdFx0XHQtMC4wNzAyLFxuXHRcdFx0MC4wNzExLFxuXHRcdFx0LTAuNDA4Nyxcblx0XHRcdC0wLjA1MDYsXG5cdFx0XHQwLjA2NzcsXG5cdFx0XHQtMC4zODkzLFxuXHRcdFx0LTAuMDU1NSxcblx0XHRcdDAsXG5cdFx0XHQtMC40MTUyLFxuXHRcdFx0LTAuMDIyNyxcblx0XHRcdDAsXG5cdFx0XHQtMC4zOTIsXG5cdFx0XHQtMC4wMjcxLFxuXHRcdFx0MC4wNjYzLFxuXHRcdFx0LTAuMzgxMyxcblx0XHRcdC0wLjA2NzYsXG5cdFx0XHQwLFxuXHRcdFx0LTAuMzgyOSxcblx0XHRcdC0wLjAzODgsXG5cdFx0XHQtMC4wMzgyLFxuXHRcdFx0LTAuMDYzNyxcblx0XHRcdDAuMDIzMSxcblx0XHRcdC0wLjAzODUsXG5cdFx0XHQtMC4xMDQ2LFxuXHRcdFx0MC4wNTI4LFxuXHRcdFx0LTAuMDM2Mixcblx0XHRcdDAuMDgxNixcblx0XHRcdC0wLjA1MjgsXG5cdFx0XHQtMC4wNDI0LFxuXHRcdFx0LTAuMDA4Nixcblx0XHRcdC0wLjAxNDEsXG5cdFx0XHQtMC4wNzUsXG5cdFx0XHQwLjA0NTgsXG5cdFx0XHQtMC4wOTY4LFxuXHRcdFx0LTAuMDc2OCxcblx0XHRcdC0wLjA0MTQsXG5cdFx0XHQtMC4wNzE4LFxuXHRcdFx0LTAuMDM4NSxcblx0XHRcdC0wLjE0OSxcblx0XHRcdDAuMDU2MSxcblx0XHRcdC0wLjA5MTUsXG5cdFx0XHQtMC4xNTE0LFxuXHRcdFx0LTAuMDExMSxcblx0XHRcdC0wLjA5Myxcblx0XHRcdC0wLjExOTksXG5cdFx0XHQtMC4wMjExLFxuXHRcdFx0LTAuMDMzOSxcblx0XHRcdC0wLjE3NzUsXG5cdFx0XHQwLjAzNDgsXG5cdFx0XHQtMC4wODAzLFxuXHRcdFx0LTAuMTcxMSxcblx0XHRcdC0wLjAwOCxcblx0XHRcdC0wLjAxNDcsXG5cdFx0XHQtMC4xOTAzLFxuXHRcdFx0MC4wMDk0LFxuXHRcdFx0LTAuMDMwOCxcblx0XHRcdC0wLjIwMSxcblx0XHRcdC0wLjAyMzcsXG5cdFx0XHQtMC4xMjEyLFxuXHRcdFx0LTAuMDU0Nyxcblx0XHRcdC0wLjEwMDcsXG5cdFx0XHQtMC4xODMyLFxuXHRcdFx0LTAuMDEwNSxcblx0XHRcdC0wLjEyOTUsXG5cdFx0XHQtMC4yMzQzLFxuXHRcdFx0LTAuMDg1NSxcblx0XHRcdC0wLjEzODMsXG5cdFx0XHQtMC4xNzYxLFxuXHRcdFx0LTAuMTMyOSxcblx0XHRcdC0wLjExMzEsXG5cdFx0XHQtMC4yMjE5LFxuXHRcdFx0LTAuMjMwOCxcblx0XHRcdC0wLjE0NDIsXG5cdFx0XHQtMC4zMDY1LFxuXHRcdFx0LTAuMjQwNyxcblx0XHRcdC0wLjIyNTUsXG5cdFx0XHQtMC4yNDIsXG5cdFx0XHQtMC4yNzk0LFxuXHRcdFx0LTAuMTU3OSxcblx0XHRcdC0wLjI5MDYsXG5cdFx0XHQtMC4xOTE1LFxuXHRcdFx0LTAuMTk2Myxcblx0XHRcdC0wLjE3Myxcblx0XHRcdC0wLjI1NzksXG5cdFx0XHQtMC4xMTM0LFxuXHRcdFx0LTAuMTkzNSxcblx0XHRcdC0wLjMwMzMsXG5cdFx0XHQtMC4xMTkyLFxuXHRcdFx0LTAuMjAwMixcblx0XHRcdC0wLjE4MDMsXG5cdFx0XHQtMC4xMjg2LFxuXHRcdFx0LTAuMjY4Myxcblx0XHRcdC0wLjEzOTUsXG5cdFx0XHQtMC4xNjMzLFxuXHRcdFx0LTAuMTUzMixcblx0XHRcdC0wLjIwNzEsXG5cdFx0XHQtMC4xMDY4LFxuXHRcdFx0LTAuMzE2LFxuXHRcdFx0LTAuMjg2OSxcblx0XHRcdC0wLjI0ODIsXG5cdFx0XHQtMC4yNTY1LFxuXHRcdFx0LTAuMzI0NCxcblx0XHRcdC0wLjE3MDEsXG5cdFx0XHQtMC4yMDYyLFxuXHRcdFx0LTAuMzM5OSxcblx0XHRcdC0wLjEyNjYsXG5cdFx0XHQtMC4zMjA4LFxuXHRcdFx0LTAuMzU4NSxcblx0XHRcdC0wLjI3ODgsXG5cdFx0XHQtMC4yMzg0LFxuXHRcdFx0LTAuNDEyMSxcblx0XHRcdC0wLjE2NzgsXG5cdFx0XHQtMC4xOTQyLFxuXHRcdFx0LTAuMzk4LFxuXHRcdFx0LTAuMTIyNixcblx0XHRcdC0wLjEzODksXG5cdFx0XHQtMC4zMTk1LFxuXHRcdFx0LTAuMDczLFxuXHRcdFx0LTAuMTQ0MSxcblx0XHRcdC0wLjI5NDcsXG5cdFx0XHQtMC4wNzk3LFxuXHRcdFx0LTAuMTY3NSxcblx0XHRcdC0wLjMyNDMsXG5cdFx0XHQtMC4xMDMzLFxuXHRcdFx0LTAuMTQ5NCxcblx0XHRcdC0wLjMzOTQsXG5cdFx0XHQtMC4xMDQ2LFxuXHRcdFx0LTAuMDc3Mixcblx0XHRcdC0wLjQyOTMsXG5cdFx0XHQtMC4wNjM1LFxuXHRcdFx0LTAuMDk1OCxcblx0XHRcdC0wLjQ3MDQsXG5cdFx0XHQtMC4wNzUxLFxuXHRcdFx0LTAuMTI2Nixcblx0XHRcdC0wLjQwODMsXG5cdFx0XHQtMC4wODQ3LFxuXHRcdFx0LTAuMTQ3NCxcblx0XHRcdC0wLjM1MzgsXG5cdFx0XHQtMC4xMTQyLFxuXHRcdFx0LTAuMTY3OSxcblx0XHRcdC0wLjM3NTYsXG5cdFx0XHQtMC4xMTE1LFxuXHRcdFx0LTAuMTE2LFxuXHRcdFx0LTAuMzg1LFxuXHRcdFx0LTAuMDgxMyxcblx0XHRcdC0wLjA3NTYsXG5cdFx0XHQtMC4zMDQzLFxuXHRcdFx0LTAuMDIxNSxcblx0XHRcdC0wLjA4OTMsXG5cdFx0XHQtMC4yODkyLFxuXHRcdFx0LTAuMDM2Myxcblx0XHRcdC0wLjE2Nixcblx0XHRcdC0wLjM0NzgsXG5cdFx0XHQtMC4xMTY1LFxuXHRcdFx0LTAuMTgxMyxcblx0XHRcdC0wLjM0NDUsXG5cdFx0XHQtMC4xMTcxLFxuXHRcdFx0LTAuMTU0Mixcblx0XHRcdC0wLjM0Nixcblx0XHRcdC0wLjExODQsXG5cdFx0XHQtMC4xNDE5LFxuXHRcdFx0LTAuMzUyNCxcblx0XHRcdC0wLjEyMDUsXG5cdFx0XHQtMC4xMjE5LFxuXHRcdFx0LTAuMzM2NSxcblx0XHRcdC0wLjA5MjcsXG5cdFx0XHQtMC4xMzI1LFxuXHRcdFx0LTAuMzI4Nyxcblx0XHRcdC0wLjA3OSxcblx0XHRcdC0wLjE0MTEsXG5cdFx0XHQtMC4zNDIsXG5cdFx0XHQtMC4xMTM0LFxuXHRcdFx0LTAuMDcyNixcblx0XHRcdC0wLjMyMSxcblx0XHRcdC0wLjAyODcsXG5cdFx0XHQtMC4wNjY1LFxuXHRcdFx0LTAuMzMwMixcblx0XHRcdC0wLjA0OTIsXG5cdFx0XHQtMC4xMjUsXG5cdFx0XHQtMC4yMTk3LFxuXHRcdFx0LTAuMDg2Mixcblx0XHRcdC0wLjA1NTQsXG5cdFx0XHQtMC4yMzQ3LFxuXHRcdFx0LTAuMDM3Nixcblx0XHRcdC0wLjA0MDMsXG5cdFx0XHQtMC4yODIsXG5cdFx0XHQtMC4wMjA2LFxuXHRcdFx0LTAuMTA3NCxcblx0XHRcdC0wLjE3NTksXG5cdFx0XHQtMC4wODYxLFxuXHRcdFx0LTAuMTM0OSxcblx0XHRcdC0wLjE2MzIsXG5cdFx0XHQtMC4xMDIsXG5cdFx0XHQtMC4xMTg2LFxuXHRcdFx0LTAuMTUxMSxcblx0XHRcdC0wLjA4NjcsXG5cdFx0XHQtMC4xMTM2LFxuXHRcdFx0LTAuNTE5NCxcblx0XHRcdC0wLjA3Nyxcblx0XHRcdC0wLjIyOSxcblx0XHRcdC0wLjUxMDIsXG5cdFx0XHQtMC4yMDgzLFxuXHRcdFx0LTAuMzE4NSxcblx0XHRcdC0wLjQyODcsXG5cdFx0XHQtMC4zMTIxLFxuXHRcdFx0LTAuMzQ1Mixcblx0XHRcdC0wLjMyMDUsXG5cdFx0XHQtMC4zMzIsXG5cdFx0XHQtMC4zNTAxLFxuXHRcdFx0LTAuMzgzNixcblx0XHRcdC0wLjM2NzEsXG5cdFx0XHQtMC4zODIyLFxuXHRcdFx0LTAuMzExMSxcblx0XHRcdC0wLjQ0NjQsXG5cdFx0XHQtMC4zNzQ5LFxuXHRcdFx0LTAuMjYyOCxcblx0XHRcdC0wLjQwMjMsXG5cdFx0XHQtMC40Mzc0LFxuXHRcdFx0MC4xMzY0LFxuXHRcdFx0LTAuNTc5Mixcblx0XHRcdC0wLjM5NjgsXG5cdFx0XHQwLjIzODIsXG5cdFx0XHQtMC4zNjQ2LFxuXHRcdFx0LTAuNDI5Myxcblx0XHRcdDAuMjMwOCxcblx0XHRcdC0wLjU3MjUsXG5cdFx0XHQtMC40MTY2LFxuXHRcdFx0MC4wNDU2LFxuXHRcdFx0LTAuMzk5Mixcblx0XHRcdC0wLjQzODMsXG5cdFx0XHQwLjA1MzgsXG5cdFx0XHQtMC41ODAyLFxuXHRcdFx0LTAuNDE0Nixcblx0XHRcdC0wLjAyNzUsXG5cdFx0XHQtMC40Mjc2LFxuXHRcdFx0LTAuNDA5Nyxcblx0XHRcdC0wLjA4MTcsXG5cdFx0XHQtMC40NTU3LFxuXHRcdFx0LTAuNDI4OSxcblx0XHRcdC0wLjA4OTIsXG5cdFx0XHQtMC41NTg4LFxuXHRcdFx0LTAuNDA4Nyxcblx0XHRcdC0wLjEyNTQsXG5cdFx0XHQtMC40Nzg5LFxuXHRcdFx0LTAuNDM2Mixcblx0XHRcdC0wLjAxNCxcblx0XHRcdC0wLjU3MjQsXG5cdFx0XHQtMC40MTA0LFxuXHRcdFx0LTAuMTg2Myxcblx0XHRcdC0wLjUzLFxuXHRcdFx0LTAuMzU2NCxcblx0XHRcdDAuMzU4Nyxcblx0XHRcdC0wLjM2NTMsXG5cdFx0XHQtMC40MTI2LFxuXHRcdFx0MC4zNDUsXG5cdFx0XHQtMC41NDk1LFxuXHRcdFx0LTAuMzkwOCxcblx0XHRcdDAuNDQ3LFxuXHRcdFx0LTAuNTE1OSxcblx0XHRcdC0wLjMyNTMsXG5cdFx0XHQwLjQ3NTgsXG5cdFx0XHQtMC4zODg1LFxuXHRcdFx0LTAuMTE4Mixcblx0XHRcdC0wLjU4OTcsXG5cdFx0XHQtMC4xMDUyLFxuXHRcdFx0LTAuMTM4NCxcblx0XHRcdDAuMTM2Nixcblx0XHRcdC0wLjE1NjgsXG5cdFx0XHQtMC4wODkyLFxuXHRcdFx0MC4xMTAyLFxuXHRcdFx0LTAuMTQyNCxcblx0XHRcdC0wLjEyMixcblx0XHRcdDAuMTQ1Nyxcblx0XHRcdC0wLjEyODQsXG5cdFx0XHQtMC4xMTAyLFxuXHRcdFx0MC4xMDc1LFxuXHRcdFx0LTAuMTYsXG5cdFx0XHQtMC4xODkxLFxuXHRcdFx0MC4wNDA1LFxuXHRcdFx0LTAuMTQ1LFxuXHRcdFx0LTAuMTM2Myxcblx0XHRcdDAuMDg4OSxcblx0XHRcdC0wLjE1NzMsXG5cdFx0XHQtMC4xODYxLFxuXHRcdFx0MC4wNjcyLFxuXHRcdFx0LTAuMTUxNyxcblx0XHRcdC0wLjEyMDEsXG5cdFx0XHQwLjA2OTksXG5cdFx0XHQtMC4xNDM0LFxuXHRcdFx0LTAuMjMyMyxcblx0XHRcdDAuMDYxOCxcblx0XHRcdC0wLjE2MSxcblx0XHRcdC0wLjIzODEsXG5cdFx0XHQwLjAzNTYsXG5cdFx0XHQtMC4xNjIyLFxuXHRcdFx0LTAuMjg0Myxcblx0XHRcdDAuMDc3Nixcblx0XHRcdC0wLjE5MDYsXG5cdFx0XHQtMC4zMzY3LFxuXHRcdFx0MC4xMDI0LFxuXHRcdFx0LTAuMjQzMyxcblx0XHRcdC0wLjI5NDcsXG5cdFx0XHQwLjA1NjcsXG5cdFx0XHQtMC4xOTc4LFxuXHRcdFx0LTAuMzIxNSxcblx0XHRcdDAuMTEwMyxcblx0XHRcdC0wLjIzMSxcblx0XHRcdC0wLjMzMTgsXG5cdFx0XHQwLjE0MjEsXG5cdFx0XHQtMC4yMDA1LFxuXHRcdFx0LTAuMzE4NCxcblx0XHRcdDAuMTM0Nixcblx0XHRcdC0wLjIwNDksXG5cdFx0XHQtMC4zMDk5LFxuXHRcdFx0MC4yNjMsXG5cdFx0XHQtMC4xNTA2LFxuXHRcdFx0LTAuMTUxNCxcblx0XHRcdDAuMTI3Myxcblx0XHRcdC0wLjE2MjUsXG5cdFx0XHQtMC4xMjg4LFxuXHRcdFx0MC4xMDgxLFxuXHRcdFx0LTAuMTY3OCxcblx0XHRcdC0wLjE1MTEsXG5cdFx0XHQwLjEwNjgsXG5cdFx0XHQtMC4xNjUyLFxuXHRcdFx0LTAuMTg1Nyxcblx0XHRcdDAuMDkyNyxcblx0XHRcdC0wLjE1NjcsXG5cdFx0XHQtMC4yMjk3LFxuXHRcdFx0MC4wODY5LFxuXHRcdFx0LTAuMTYxOSxcblx0XHRcdC0wLjMwOTcsXG5cdFx0XHQwLjExNjIsXG5cdFx0XHQtMC4yMjI1LFxuXHRcdFx0LTAuMjc5Nyxcblx0XHRcdDAuMDk2LFxuXHRcdFx0LTAuMTg4OSxcblx0XHRcdC0wLjE0MjIsXG5cdFx0XHQwLjExMzUsXG5cdFx0XHQtMC4xNzU0LFxuXHRcdFx0LTAuMjMzNSxcblx0XHRcdDAuMTcwMSxcblx0XHRcdC0wLjE1Nixcblx0XHRcdC0wLjIzMjIsXG5cdFx0XHQwLjE1NjgsXG5cdFx0XHQtMC4xNTc0LFxuXHRcdFx0LTAuMTgzMSxcblx0XHRcdDAuMTQ4LFxuXHRcdFx0LTAuMTU5OSxcblx0XHRcdC0wLjE4MjMsXG5cdFx0XHQwLjE2LFxuXHRcdFx0LTAuMTU2NCxcblx0XHRcdC0wLjI1MjMsXG5cdFx0XHQwLjIxNyxcblx0XHRcdC0wLjEwNDYsXG5cdFx0XHQtMC4yMzk4LFxuXHRcdFx0MC4xNzQsXG5cdFx0XHQtMC4xMzQxLFxuXHRcdFx0LTAuMTgxMyxcblx0XHRcdDAuMTY0Myxcblx0XHRcdC0wLjEzMTQsXG5cdFx0XHQtMC4xODUyLFxuXHRcdFx0MC4yMDE3LFxuXHRcdFx0LTAuMDg4NSxcblx0XHRcdC0wLjEwODcsXG5cdFx0XHQwLjE3MjUsXG5cdFx0XHQtMC4wODEsXG5cdFx0XHQtMC4wNjU2LFxuXHRcdFx0MC4xMTk1LFxuXHRcdFx0LTAuMTAxLFxuXHRcdFx0LTAuMjUzOCxcblx0XHRcdC0wLjAwMzQsXG5cdFx0XHQtMC4xNTQ1LFxuXHRcdFx0LTAuMzE4OSxcblx0XHRcdDAuMDI3NCxcblx0XHRcdC0wLjIwNyxcblx0XHRcdC0wLjM2MjIsXG5cdFx0XHQwLjA4NjIsXG5cdFx0XHQtMC4yNTkxLFxuXHRcdFx0LTAuMzUyMyxcblx0XHRcdDAuMTc2OCxcblx0XHRcdC0wLjE5MzEsXG5cdFx0XHQtMC4yNTM5LFxuXHRcdFx0MC4yODgsXG5cdFx0XHQtMC4xMDE3LFxuXHRcdFx0LTAuMzA0NSxcblx0XHRcdDAuMjAzMixcblx0XHRcdC0wLjE0MTEsXG5cdFx0XHQtMC4wMzQxLFxuXHRcdFx0MC4xMjg5LFxuXHRcdFx0LTAuMDYyNCxcblx0XHRcdC0wLjA3MjgsXG5cdFx0XHQwLjIzOTMsXG5cdFx0XHQtMC4wNDc3LFxuXHRcdFx0LTAuMzcwMSxcblx0XHRcdDAuMjEyOCxcblx0XHRcdC0wLjI0ODYsXG5cdFx0XHQtMC4yNTExLFxuXHRcdFx0MC4zMzUyLFxuXHRcdFx0LTAuMTIsXG5cdFx0XHQtMC4xMixcblx0XHRcdDAuNDE3NSxcblx0XHRcdC0wLjEwMzksXG5cdFx0XHQtMC4yNTMzLFxuXHRcdFx0MC4zOTc5LFxuXHRcdFx0LTAuMTYzLFxuXHRcdFx0LTAuMTE4OSxcblx0XHRcdDAuMzM1Nyxcblx0XHRcdC0wLjA2NzksXG5cdFx0XHQtMC4xMjM1LFxuXHRcdFx0MC41Mjc2LFxuXHRcdFx0LTAuMTg4OCxcblx0XHRcdC0wLjI0NDksXG5cdFx0XHQwLjUxMTksXG5cdFx0XHQtMC4yNTAxLFxuXHRcdFx0LTAuMzI4Nixcblx0XHRcdDAuNTUxMSxcblx0XHRcdC0wLjQzODcsXG5cdFx0XHQtMC4yMzgxLFxuXHRcdFx0MC42MDUxLFxuXHRcdFx0LTAuMzY3OCxcblx0XHRcdC0wLjExOTUsXG5cdFx0XHQwLjYyOTgsXG5cdFx0XHQtMC4zMTcyLFxuXHRcdFx0LTAuMzg4OCxcblx0XHRcdDAuMDU4NCxcblx0XHRcdC0wLjI4NzksXG5cdFx0XHQtMC4zNDk2LFxuXHRcdFx0LTAuMDIyNyxcblx0XHRcdC0wLjIyMDUsXG5cdFx0XHQtMC4yODUsXG5cdFx0XHQtMC4wNjQ0LFxuXHRcdFx0LTAuMTYyOCxcblx0XHRcdC0wLjMwOSxcblx0XHRcdC0wLjExNjYsXG5cdFx0XHQtMC4xOTEzLFxuXHRcdFx0LTAuMzI0NSxcblx0XHRcdC0wLjE2ODMsXG5cdFx0XHQtMC4yMzA4LFxuXHRcdFx0LTAuMzMzOCxcblx0XHRcdC0wLjIxNDgsXG5cdFx0XHQtMC4yNjYsXG5cdFx0XHQtMC4zMzg1LFxuXHRcdFx0LTAuMjU2OSxcblx0XHRcdC0wLjI5NTQsXG5cdFx0XHQtMC4zNjMyLFxuXHRcdFx0LTAuMDY5Nixcblx0XHRcdC0wLjI1MTIsXG5cdFx0XHQtMC4zNjcsXG5cdFx0XHQtMC4xMjEzLFxuXHRcdFx0LTAuMjkzMixcblx0XHRcdC0wLjM3MDUsXG5cdFx0XHQtMC4xNjUzLFxuXHRcdFx0LTAuMzMxNyxcblx0XHRcdC0wLjM3MTksXG5cdFx0XHQtMC4yMDQ1LFxuXHRcdFx0LTAuMzYzNyxcblx0XHRcdC0wLjMwNTIsXG5cdFx0XHQwLjEyNTgsXG5cdFx0XHQtMC4yMDE4LFxuXHRcdFx0LTAuMTI1LFxuXHRcdFx0LTAuMTI3Mixcblx0XHRcdC0wLjA5NjUsXG5cdFx0XHQtMC4wODgsXG5cdFx0XHQtMC4wOTAzLFxuXHRcdFx0LTAuMDM2Mixcblx0XHRcdC0wLjExMSxcblx0XHRcdC0wLjM3MzIsXG5cdFx0XHQtMC4wODYyLFxuXHRcdFx0LTAuMTc5NSxcblx0XHRcdDAuMjc3Nyxcblx0XHRcdC0wLjA3NDksXG5cdFx0XHQtMC4yOTA1LFxuXHRcdFx0MC4xNjE1LFxuXHRcdFx0LTAuMTY3MSxcblx0XHRcdC0wLjI3OTgsXG5cdFx0XHQwLjE1ODMsXG5cdFx0XHQtMC4xNzk1LFxuXHRcdFx0LTAuMjc3Mixcblx0XHRcdDAuMTQ1OSxcblx0XHRcdC0wLjE4MSxcblx0XHRcdC0wLjEwNjYsXG5cdFx0XHQtMC4zNjYxLFxuXHRcdFx0LTAuMDk0Myxcblx0XHRcdC0wLjA3MTEsXG5cdFx0XHQtMC40MDg3LFxuXHRcdFx0LTAuMDUwNixcblx0XHRcdC0wLjA2NzcsXG5cdFx0XHQtMC4zODkzLFxuXHRcdFx0LTAuMDU1NSxcblx0XHRcdC0wLjA2NjMsXG5cdFx0XHQtMC4zODEzLFxuXHRcdFx0LTAuMDY3NlxuXHRcdF0sXG5cdFx0XCJpbmRleFwiOiBbXG5cdFx0XHQyLFxuXHRcdFx0MCxcblx0XHRcdDEsXG5cdFx0XHQwLFxuXHRcdFx0Mixcblx0XHRcdDMsXG5cdFx0XHQ2LFxuXHRcdFx0NCxcblx0XHRcdDUsXG5cdFx0XHQ0LFxuXHRcdFx0Nixcblx0XHRcdDcsXG5cdFx0XHQ3LFxuXHRcdFx0OCxcblx0XHRcdDQsXG5cdFx0XHQ4LFxuXHRcdFx0Nyxcblx0XHRcdDksXG5cdFx0XHQxMCxcblx0XHRcdDMsXG5cdFx0XHQyLFxuXHRcdFx0Myxcblx0XHRcdDEwLFxuXHRcdFx0MTEsXG5cdFx0XHQxMixcblx0XHRcdDMsXG5cdFx0XHQxMSxcblx0XHRcdDMsXG5cdFx0XHQxMixcblx0XHRcdDEzLFxuXHRcdFx0MTUsXG5cdFx0XHQxMCxcblx0XHRcdDE0LFxuXHRcdFx0MTAsXG5cdFx0XHQxNSxcblx0XHRcdDExLFxuXHRcdFx0MTYsXG5cdFx0XHQxMSxcblx0XHRcdDE1LFxuXHRcdFx0MTEsXG5cdFx0XHQxNixcblx0XHRcdDEyLFxuXHRcdFx0MTQsXG5cdFx0XHQxNyxcblx0XHRcdDE1LFxuXHRcdFx0MTcsXG5cdFx0XHQxNCxcblx0XHRcdDE4LFxuXHRcdFx0MTgsXG5cdFx0XHQxOSxcblx0XHRcdDE3LFxuXHRcdFx0MTksXG5cdFx0XHQxOCxcblx0XHRcdDIwLFxuXHRcdFx0MTcsXG5cdFx0XHQxNixcblx0XHRcdDE1LFxuXHRcdFx0MTYsXG5cdFx0XHQxNyxcblx0XHRcdDE5LFxuXHRcdFx0MCxcblx0XHRcdDYsXG5cdFx0XHQxLFxuXHRcdFx0Nixcblx0XHRcdDAsXG5cdFx0XHQ3LFxuXHRcdFx0OSxcblx0XHRcdDIxLFxuXHRcdFx0OCxcblx0XHRcdDIxLFxuXHRcdFx0MjIsXG5cdFx0XHQ4LFxuXHRcdFx0MjEsXG5cdFx0XHQyMyxcblx0XHRcdDIyLFxuXHRcdFx0MjMsXG5cdFx0XHQyMSxcblx0XHRcdDI0LFxuXHRcdFx0MjcsXG5cdFx0XHQyNSxcblx0XHRcdDI2LFxuXHRcdFx0MjUsXG5cdFx0XHQyNyxcblx0XHRcdDI4LFxuXHRcdFx0MjYsXG5cdFx0XHQyOSxcblx0XHRcdDMwLFxuXHRcdFx0MjksXG5cdFx0XHQyNixcblx0XHRcdDI1LFxuXHRcdFx0MzIsXG5cdFx0XHQyOCxcblx0XHRcdDMxLFxuXHRcdFx0MjgsXG5cdFx0XHQzMixcblx0XHRcdDI1LFxuXHRcdFx0MzMsXG5cdFx0XHQyNSxcblx0XHRcdDMyLFxuXHRcdFx0MjUsXG5cdFx0XHQzMyxcblx0XHRcdDI5LFxuXHRcdFx0MjYsXG5cdFx0XHQzNCxcblx0XHRcdDI3LFxuXHRcdFx0MzQsXG5cdFx0XHQyNixcblx0XHRcdDM1LFxuXHRcdFx0MzAsXG5cdFx0XHQzNSxcblx0XHRcdDI2LFxuXHRcdFx0MzUsXG5cdFx0XHQzMCxcblx0XHRcdDM2LFxuXHRcdFx0MzUsXG5cdFx0XHQzNyxcblx0XHRcdDM0LFxuXHRcdFx0MzcsXG5cdFx0XHQzNSxcblx0XHRcdDM4LFxuXHRcdFx0MzYsXG5cdFx0XHQzOCxcblx0XHRcdDM1LFxuXHRcdFx0MzgsXG5cdFx0XHQzNixcblx0XHRcdDM5LFxuXHRcdFx0NDMsXG5cdFx0XHQ0MCxcblx0XHRcdDQxLFxuXHRcdFx0NDMsXG5cdFx0XHQ0MSxcblx0XHRcdDQyLFxuXHRcdFx0NDcsXG5cdFx0XHQ0NCxcblx0XHRcdDQ1LFxuXHRcdFx0NDcsXG5cdFx0XHQ0NSxcblx0XHRcdDQ2LFxuXHRcdFx0NDgsXG5cdFx0XHQ0NCxcblx0XHRcdDQ3LFxuXHRcdFx0NTEsXG5cdFx0XHQ0OSxcblx0XHRcdDUwLFxuXHRcdFx0NTEsXG5cdFx0XHQ1MCxcblx0XHRcdDQ4LFxuXHRcdFx0NTMsXG5cdFx0XHQ0MCxcblx0XHRcdDQzLFxuXHRcdFx0NTMsXG5cdFx0XHQ0Myxcblx0XHRcdDUyLFxuXHRcdFx0NDEsXG5cdFx0XHQ1NCxcblx0XHRcdDU1LFxuXHRcdFx0NDEsXG5cdFx0XHQ1NSxcblx0XHRcdDQyLFxuXHRcdFx0NTYsXG5cdFx0XHQ0OSxcblx0XHRcdDU0LFxuXHRcdFx0NTYsXG5cdFx0XHQ1Nyxcblx0XHRcdDQ5LFxuXHRcdFx0NjAsXG5cdFx0XHQ1OCxcblx0XHRcdDU5LFxuXHRcdFx0NjAsXG5cdFx0XHQ1OSxcblx0XHRcdDQxLFxuXHRcdFx0NTYsXG5cdFx0XHQ0MSxcblx0XHRcdDU5LFxuXHRcdFx0NjEsXG5cdFx0XHQ2MCxcblx0XHRcdDQwLFxuXHRcdFx0NjEsXG5cdFx0XHQ0MCxcblx0XHRcdDUzLFxuXHRcdFx0NjAsXG5cdFx0XHQ0MSxcblx0XHRcdDQwLFxuXHRcdFx0NDEsXG5cdFx0XHQ1Nixcblx0XHRcdDU0LFxuXHRcdFx0NjIsXG5cdFx0XHQ1OCxcblx0XHRcdDYwLFxuXHRcdFx0NjIsXG5cdFx0XHQ2MCxcblx0XHRcdDYxLFxuXHRcdFx0NTUsXG5cdFx0XHQ1NCxcblx0XHRcdDQ5LFxuXHRcdFx0NTUsXG5cdFx0XHQ0OSxcblx0XHRcdDUxLFxuXHRcdFx0NjQsXG5cdFx0XHQ2MSxcblx0XHRcdDUzLFxuXHRcdFx0NjQsXG5cdFx0XHQ1Myxcblx0XHRcdDYzLFxuXHRcdFx0NjUsXG5cdFx0XHQ2Mixcblx0XHRcdDYxLFxuXHRcdFx0NjUsXG5cdFx0XHQ2MSxcblx0XHRcdDY0LFxuXHRcdFx0MzYsXG5cdFx0XHQ1MSxcblx0XHRcdDM5LFxuXHRcdFx0NTEsXG5cdFx0XHQzNixcblx0XHRcdDU1LFxuXHRcdFx0MzYsXG5cdFx0XHQ0Mixcblx0XHRcdDU1LFxuXHRcdFx0NDIsXG5cdFx0XHQzNixcblx0XHRcdDMwLFxuXHRcdFx0MzAsXG5cdFx0XHQ0Myxcblx0XHRcdDQyLFxuXHRcdFx0NDMsXG5cdFx0XHQzMCxcblx0XHRcdDI5LFxuXHRcdFx0NjYsXG5cdFx0XHQyOSxcblx0XHRcdDMzLFxuXHRcdFx0MjksXG5cdFx0XHQ2Nixcblx0XHRcdDQzLFxuXHRcdFx0NjYsXG5cdFx0XHQ2Nyxcblx0XHRcdDUyLFxuXHRcdFx0NjYsXG5cdFx0XHQ1Mixcblx0XHRcdDQzLFxuXHRcdFx0NjgsXG5cdFx0XHQ2Myxcblx0XHRcdDUzLFxuXHRcdFx0NjksXG5cdFx0XHQ2Myxcblx0XHRcdDY4LFxuXHRcdFx0MzMsXG5cdFx0XHQ3MCxcblx0XHRcdDY2LFxuXHRcdFx0NzAsXG5cdFx0XHQzMyxcblx0XHRcdDcxLFxuXHRcdFx0NzAsXG5cdFx0XHQ2Nyxcblx0XHRcdDY2LFxuXHRcdFx0NjcsXG5cdFx0XHQ3MCxcblx0XHRcdDE5LFxuXHRcdFx0NjcsXG5cdFx0XHQyMCxcblx0XHRcdDcyLFxuXHRcdFx0MjAsXG5cdFx0XHQ2Nyxcblx0XHRcdDE5LFxuXHRcdFx0MzIsXG5cdFx0XHQ3MSxcblx0XHRcdDMzLFxuXHRcdFx0NzEsXG5cdFx0XHQzMixcblx0XHRcdDI0LFxuXHRcdFx0MzEsXG5cdFx0XHQyNCxcblx0XHRcdDMyLFxuXHRcdFx0MjQsXG5cdFx0XHQzMSxcblx0XHRcdDIzLFxuXHRcdFx0MTYsXG5cdFx0XHQ3MCxcblx0XHRcdDEyLFxuXHRcdFx0NzAsXG5cdFx0XHQxNixcblx0XHRcdDE5LFxuXHRcdFx0NzEsXG5cdFx0XHQ3Myxcblx0XHRcdDcwLFxuXHRcdFx0NDYsXG5cdFx0XHQ3NCxcblx0XHRcdDc1LFxuXHRcdFx0NDYsXG5cdFx0XHQ3NSxcblx0XHRcdDQ3LFxuXHRcdFx0NzIsXG5cdFx0XHQ2OSxcblx0XHRcdDY4LFxuXHRcdFx0MzcsXG5cdFx0XHQ3Nixcblx0XHRcdDc3LFxuXHRcdFx0NzYsXG5cdFx0XHQzNyxcblx0XHRcdDM4LFxuXHRcdFx0NzksXG5cdFx0XHQ3Nyxcblx0XHRcdDc4LFxuXHRcdFx0NzcsXG5cdFx0XHQ3OSxcblx0XHRcdDM3LFxuXHRcdFx0NzksXG5cdFx0XHQ4MCxcblx0XHRcdDgxLFxuXHRcdFx0ODAsXG5cdFx0XHQ3OSxcblx0XHRcdDc4LFxuXHRcdFx0ODQsXG5cdFx0XHQ4Mixcblx0XHRcdDgzLFxuXHRcdFx0ODIsXG5cdFx0XHQ4NCxcblx0XHRcdDg1LFxuXHRcdFx0ODUsXG5cdFx0XHQ4Nixcblx0XHRcdDgyLFxuXHRcdFx0ODYsXG5cdFx0XHQ4NSxcblx0XHRcdDg3LFxuXHRcdFx0OTAsXG5cdFx0XHQ4OCxcblx0XHRcdDg5LFxuXHRcdFx0ODgsXG5cdFx0XHQ5MCxcblx0XHRcdDkxLFxuXHRcdFx0OTIsXG5cdFx0XHQ4MSxcblx0XHRcdDgwLFxuXHRcdFx0ODMsXG5cdFx0XHQ5Myxcblx0XHRcdDg0LFxuXHRcdFx0OTMsXG5cdFx0XHQ4Myxcblx0XHRcdDk0LFxuXHRcdFx0OTUsXG5cdFx0XHQ5Myxcblx0XHRcdDk0LFxuXHRcdFx0OTMsXG5cdFx0XHQ5NSxcblx0XHRcdDk2LFxuXHRcdFx0NDgsXG5cdFx0XHQ0Nyxcblx0XHRcdDM5LFxuXHRcdFx0MTMsXG5cdFx0XHQxMixcblx0XHRcdDczLFxuXHRcdFx0MTIsXG5cdFx0XHQ3MCxcblx0XHRcdDczLFxuXHRcdFx0NjgsXG5cdFx0XHQ1Myxcblx0XHRcdDUyLFxuXHRcdFx0OTcsXG5cdFx0XHQzOCxcblx0XHRcdDc1LFxuXHRcdFx0MzgsXG5cdFx0XHQ5Nyxcblx0XHRcdDc2LFxuXHRcdFx0MTAwLFxuXHRcdFx0OTgsXG5cdFx0XHQ5OSxcblx0XHRcdDk4LFxuXHRcdFx0MTAwLFxuXHRcdFx0MTAxLFxuXHRcdFx0MTA0LFxuXHRcdFx0MTAyLFxuXHRcdFx0MTAzLFxuXHRcdFx0MTAyLFxuXHRcdFx0MTA0LFxuXHRcdFx0MTA1LFxuXHRcdFx0MTAyLFxuXHRcdFx0MTA2LFxuXHRcdFx0MTAzLFxuXHRcdFx0MTA2LFxuXHRcdFx0MTAyLFxuXHRcdFx0MTA3LFxuXHRcdFx0MTEwLFxuXHRcdFx0MTA4LFxuXHRcdFx0MTA5LFxuXHRcdFx0MTA4LFxuXHRcdFx0MTEwLFxuXHRcdFx0MTExLFxuXHRcdFx0MTEyLFxuXHRcdFx0MTExLFxuXHRcdFx0MTEwLFxuXHRcdFx0MTExLFxuXHRcdFx0MTEyLFxuXHRcdFx0MTEzLFxuXHRcdFx0ODQsXG5cdFx0XHQ5Myxcblx0XHRcdDExNCxcblx0XHRcdDEwMSxcblx0XHRcdDExNSxcblx0XHRcdDk4LFxuXHRcdFx0MTE1LFxuXHRcdFx0MTAxLFxuXHRcdFx0MTE2LFxuXHRcdFx0MTE4LFxuXHRcdFx0MTAzLFxuXHRcdFx0MTE3LFxuXHRcdFx0MTAzLFxuXHRcdFx0MTE4LFxuXHRcdFx0MTA0LFxuXHRcdFx0MTAzLFxuXHRcdFx0MTE5LFxuXHRcdFx0MTE3LFxuXHRcdFx0MTE5LFxuXHRcdFx0MTAzLFxuXHRcdFx0MTA2LFxuXHRcdFx0MTA4LFxuXHRcdFx0MTIwLFxuXHRcdFx0MTIxLFxuXHRcdFx0MTIwLFxuXHRcdFx0MTA4LFxuXHRcdFx0MTExLFxuXHRcdFx0MTIyLFxuXHRcdFx0MTE1LFxuXHRcdFx0MTE2LFxuXHRcdFx0MTI2LFxuXHRcdFx0MTIzLFxuXHRcdFx0MTI0LFxuXHRcdFx0MTI2LFxuXHRcdFx0MTI0LFxuXHRcdFx0MTI1LFxuXHRcdFx0MTMwLFxuXHRcdFx0MTI3LFxuXHRcdFx0MTI4LFxuXHRcdFx0MTMwLFxuXHRcdFx0MTI4LFxuXHRcdFx0MTI5LFxuXHRcdFx0MTA1LFxuXHRcdFx0MTAxLFxuXHRcdFx0MTAwLFxuXHRcdFx0MTAxLFxuXHRcdFx0MTA1LFxuXHRcdFx0MTA0LFxuXHRcdFx0MTA0LFxuXHRcdFx0MTE2LFxuXHRcdFx0MTAxLFxuXHRcdFx0MTE2LFxuXHRcdFx0MTA0LFxuXHRcdFx0MTE4LFxuXHRcdFx0MTA2LFxuXHRcdFx0MTA5LFxuXHRcdFx0MTA4LFxuXHRcdFx0MTA5LFxuXHRcdFx0MTA2LFxuXHRcdFx0MTA3LFxuXHRcdFx0MTE5LFxuXHRcdFx0MTA4LFxuXHRcdFx0MTIxLFxuXHRcdFx0MTA4LFxuXHRcdFx0MTE5LFxuXHRcdFx0MTA2LFxuXHRcdFx0MTI1LFxuXHRcdFx0MTI0LFxuXHRcdFx0OTgsXG5cdFx0XHQxMjUsXG5cdFx0XHQ5OCxcblx0XHRcdDExNSxcblx0XHRcdDEyNCxcblx0XHRcdDEyMyxcblx0XHRcdDEzMCxcblx0XHRcdDEyNCxcblx0XHRcdDEzMCxcblx0XHRcdDEyOSxcblx0XHRcdDEzMSxcblx0XHRcdDEwMCxcblx0XHRcdDk5LFxuXHRcdFx0MTAwLFxuXHRcdFx0MTMxLFxuXHRcdFx0MTMyLFxuXHRcdFx0OCxcblx0XHRcdDEwMixcblx0XHRcdDEwNSxcblx0XHRcdDEwMixcblx0XHRcdDgsXG5cdFx0XHQyMixcblx0XHRcdDIyLFxuXHRcdFx0MTA3LFxuXHRcdFx0MTAyLFxuXHRcdFx0MTA3LFxuXHRcdFx0MjIsXG5cdFx0XHQxMzMsXG5cdFx0XHQxMzQsXG5cdFx0XHQxMTAsXG5cdFx0XHQxMDksXG5cdFx0XHQxMTAsXG5cdFx0XHQxMzQsXG5cdFx0XHQxMzUsXG5cdFx0XHQxMzUsXG5cdFx0XHQxMTIsXG5cdFx0XHQxMTAsXG5cdFx0XHQxMTIsXG5cdFx0XHQxMzUsXG5cdFx0XHQxMzYsXG5cdFx0XHQ5OCxcblx0XHRcdDEyNCxcblx0XHRcdDEyOSxcblx0XHRcdDk4LFxuXHRcdFx0MTI5LFxuXHRcdFx0OTksXG5cdFx0XHQxMzgsXG5cdFx0XHQxMjcsXG5cdFx0XHQxMzcsXG5cdFx0XHQxMzgsXG5cdFx0XHQxMzcsXG5cdFx0XHQxMTQsXG5cdFx0XHQxMzIsXG5cdFx0XHQxMDUsXG5cdFx0XHQxMDAsXG5cdFx0XHQxMDUsXG5cdFx0XHQxMzIsXG5cdFx0XHQ4LFxuXHRcdFx0MTMzLFxuXHRcdFx0MTA5LFxuXHRcdFx0MTA3LFxuXHRcdFx0MTA5LFxuXHRcdFx0MTMzLFxuXHRcdFx0MTM0LFxuXHRcdFx0OCxcblx0XHRcdDEzOSxcblx0XHRcdDQsXG5cdFx0XHQxMzksXG5cdFx0XHQ4LFxuXHRcdFx0MTMyLFxuXHRcdFx0MTMyLFxuXHRcdFx0MTQwLFxuXHRcdFx0MTM5LFxuXHRcdFx0MTQwLFxuXHRcdFx0MTMyLFxuXHRcdFx0MTMxLFxuXHRcdFx0MTE0LFxuXHRcdFx0MTM3LFxuXHRcdFx0MTM2LFxuXHRcdFx0MTE0LFxuXHRcdFx0MTM2LFxuXHRcdFx0MTQxLFxuXHRcdFx0MTE0LFxuXHRcdFx0MTQxLFxuXHRcdFx0ODQsXG5cdFx0XHQ0LFxuXHRcdFx0MTQyLFxuXHRcdFx0NSxcblx0XHRcdDE0Mixcblx0XHRcdDQsXG5cdFx0XHQxMzksXG5cdFx0XHQxMzksXG5cdFx0XHQxNDMsXG5cdFx0XHQxNDIsXG5cdFx0XHQxNDMsXG5cdFx0XHQxMzksXG5cdFx0XHQxNDAsXG5cdFx0XHQxNDYsXG5cdFx0XHQxNDQsXG5cdFx0XHQxNDUsXG5cdFx0XHQxNDQsXG5cdFx0XHQxNDYsXG5cdFx0XHQxNDcsXG5cdFx0XHQxNDUsXG5cdFx0XHQxMTQsXG5cdFx0XHQ5Myxcblx0XHRcdDExNCxcblx0XHRcdDE0NSxcblx0XHRcdDE0NCxcblx0XHRcdDE0OCxcblx0XHRcdDE0Nyxcblx0XHRcdDE0Nixcblx0XHRcdDE0Nyxcblx0XHRcdDE0OCxcblx0XHRcdDE0OSxcblx0XHRcdDE0NSxcblx0XHRcdDE1MCxcblx0XHRcdDE0Nixcblx0XHRcdDE1MCxcblx0XHRcdDE0NSxcblx0XHRcdDE1MSxcblx0XHRcdDkzLFxuXHRcdFx0MTUxLFxuXHRcdFx0MTQ1LFxuXHRcdFx0MTUxLFxuXHRcdFx0OTMsXG5cdFx0XHQ5Nixcblx0XHRcdDE1MCxcblx0XHRcdDE0OCxcblx0XHRcdDE0Nixcblx0XHRcdDE0OCxcblx0XHRcdDE1MCxcblx0XHRcdDE1Mixcblx0XHRcdDE1MSxcblx0XHRcdDE1Myxcblx0XHRcdDE1NCxcblx0XHRcdDE1MSxcblx0XHRcdDk2LFxuXHRcdFx0MTUzLFxuXHRcdFx0MTUwLFxuXHRcdFx0MTU1LFxuXHRcdFx0MTUyLFxuXHRcdFx0MTU1LFxuXHRcdFx0MTUwLFxuXHRcdFx0MTU2LFxuXHRcdFx0MTU3LFxuXHRcdFx0MTM2LFxuXHRcdFx0MTM1LFxuXHRcdFx0MTM2LFxuXHRcdFx0MTU3LFxuXHRcdFx0MTQxLFxuXHRcdFx0MTM1LFxuXHRcdFx0MTU4LFxuXHRcdFx0MTU3LFxuXHRcdFx0MTU4LFxuXHRcdFx0MTM1LFxuXHRcdFx0MTM0LFxuXHRcdFx0MTM0LFxuXHRcdFx0MTU5LFxuXHRcdFx0MTU4LFxuXHRcdFx0MTU5LFxuXHRcdFx0MTM0LFxuXHRcdFx0MTMzLFxuXHRcdFx0MTMzLFxuXHRcdFx0MjMsXG5cdFx0XHQxNTksXG5cdFx0XHQyMyxcblx0XHRcdDEzMyxcblx0XHRcdDIyLFxuXHRcdFx0MzEsXG5cdFx0XHQxNTksXG5cdFx0XHQyMyxcblx0XHRcdDE1OSxcblx0XHRcdDMxLFxuXHRcdFx0MTYwLFxuXHRcdFx0MjcsXG5cdFx0XHQxNjEsXG5cdFx0XHQyOCxcblx0XHRcdDE2MSxcblx0XHRcdDI3LFxuXHRcdFx0MTYyLFxuXHRcdFx0MjgsXG5cdFx0XHQxNjAsXG5cdFx0XHQzMSxcblx0XHRcdDE2MCxcblx0XHRcdDI4LFxuXHRcdFx0MTYxLFxuXHRcdFx0MzQsXG5cdFx0XHQxNjIsXG5cdFx0XHQyNyxcblx0XHRcdDE2Mixcblx0XHRcdDM0LFxuXHRcdFx0MTYzLFxuXHRcdFx0NzksXG5cdFx0XHQzNCxcblx0XHRcdDM3LFxuXHRcdFx0MzQsXG5cdFx0XHQ3OSxcblx0XHRcdDE2Myxcblx0XHRcdDE2MCxcblx0XHRcdDE1OCxcblx0XHRcdDE1OSxcblx0XHRcdDE1OCxcblx0XHRcdDE2MCxcblx0XHRcdDE2NCxcblx0XHRcdDE2Mixcblx0XHRcdDE2NSxcblx0XHRcdDE2MSxcblx0XHRcdDE2NSxcblx0XHRcdDE2Mixcblx0XHRcdDE2Nixcblx0XHRcdDE2MSxcblx0XHRcdDE2NCxcblx0XHRcdDE2MCxcblx0XHRcdDE2NCxcblx0XHRcdDE2MSxcblx0XHRcdDE2NSxcblx0XHRcdDE2Myxcblx0XHRcdDE2Nixcblx0XHRcdDE2Mixcblx0XHRcdDE2Nixcblx0XHRcdDE2Myxcblx0XHRcdDE2Nyxcblx0XHRcdDgxLFxuXHRcdFx0MTYzLFxuXHRcdFx0NzksXG5cdFx0XHQxNjMsXG5cdFx0XHQ4MSxcblx0XHRcdDE2Nyxcblx0XHRcdDE2NCxcblx0XHRcdDE1Nyxcblx0XHRcdDE1OCxcblx0XHRcdDE1Nyxcblx0XHRcdDE2NCxcblx0XHRcdDg1LFxuXHRcdFx0MTY2LFxuXHRcdFx0ODcsXG5cdFx0XHQxNjUsXG5cdFx0XHQ4Nyxcblx0XHRcdDE2Nixcblx0XHRcdDg4LFxuXHRcdFx0MTY1LFxuXHRcdFx0ODUsXG5cdFx0XHQxNjQsXG5cdFx0XHQ4NSxcblx0XHRcdDE2NSxcblx0XHRcdDg3LFxuXHRcdFx0MTY3LFxuXHRcdFx0ODgsXG5cdFx0XHQxNjYsXG5cdFx0XHQ4OCxcblx0XHRcdDE2Nyxcblx0XHRcdDg5LFxuXHRcdFx0OTIsXG5cdFx0XHQxNjcsXG5cdFx0XHQ4MSxcblx0XHRcdDE2Nyxcblx0XHRcdDkyLFxuXHRcdFx0ODksXG5cdFx0XHQ4NSxcblx0XHRcdDE0MSxcblx0XHRcdDE1Nyxcblx0XHRcdDE0MSxcblx0XHRcdDg1LFxuXHRcdFx0ODQsXG5cdFx0XHQxMjAsXG5cdFx0XHQxMTMsXG5cdFx0XHQxNjgsXG5cdFx0XHQxMTMsXG5cdFx0XHQxMjAsXG5cdFx0XHQxMTEsXG5cdFx0XHQxNzAsXG5cdFx0XHQxNjksXG5cdFx0XHQ5LFxuXHRcdFx0OTEsXG5cdFx0XHQ4Nyxcblx0XHRcdDg4LFxuXHRcdFx0ODcsXG5cdFx0XHQ5MSxcblx0XHRcdDg2LFxuXHRcdFx0MTU0LFxuXHRcdFx0MTUwLFxuXHRcdFx0MTUxLFxuXHRcdFx0MTUwLFxuXHRcdFx0MTU0LFxuXHRcdFx0MTU2LFxuXHRcdFx0MTUzLFxuXHRcdFx0OTYsXG5cdFx0XHQ5NSxcblx0XHRcdDUwLFxuXHRcdFx0NDksXG5cdFx0XHQxNzEsXG5cdFx0XHQ0Nyxcblx0XHRcdDM4LFxuXHRcdFx0MzksXG5cdFx0XHQzOCxcblx0XHRcdDQ3LFxuXHRcdFx0NzUsXG5cdFx0XHQ1Mixcblx0XHRcdDY3LFxuXHRcdFx0NjgsXG5cdFx0XHQ3Mixcblx0XHRcdDY4LFxuXHRcdFx0NjcsXG5cdFx0XHQxMTgsXG5cdFx0XHQxMjIsXG5cdFx0XHQxMTYsXG5cdFx0XHQxNDMsXG5cdFx0XHQxNDcsXG5cdFx0XHQxNDksXG5cdFx0XHQxNDcsXG5cdFx0XHQxNDMsXG5cdFx0XHQxNDAsXG5cdFx0XHQxNzIsXG5cdFx0XHQxNDcsXG5cdFx0XHQxNDAsXG5cdFx0XHQxNDAsXG5cdFx0XHQxMzEsXG5cdFx0XHQxMjgsXG5cdFx0XHQxNDAsXG5cdFx0XHQxMjgsXG5cdFx0XHQxNzIsXG5cdFx0XHQxMjksXG5cdFx0XHQxMjgsXG5cdFx0XHQxMzEsXG5cdFx0XHQxMjksXG5cdFx0XHQxMzEsXG5cdFx0XHQ5OSxcblx0XHRcdDExMixcblx0XHRcdDEzNixcblx0XHRcdDEzNyxcblx0XHRcdDExMixcblx0XHRcdDEzNyxcblx0XHRcdDE3Myxcblx0XHRcdDExMixcblx0XHRcdDE3Myxcblx0XHRcdDE3NCxcblx0XHRcdDExMixcblx0XHRcdDE3NCxcblx0XHRcdDExMyxcblx0XHRcdDE3NCxcblx0XHRcdDE3NSxcblx0XHRcdDE2OCxcblx0XHRcdDE3NCxcblx0XHRcdDE2OCxcblx0XHRcdDExMyxcblx0XHRcdDE3Myxcblx0XHRcdDEzNyxcblx0XHRcdDEyNyxcblx0XHRcdDE3Myxcblx0XHRcdDEyNyxcblx0XHRcdDEzMCxcblx0XHRcdDE3Myxcblx0XHRcdDEzMCxcblx0XHRcdDEyMyxcblx0XHRcdDE3Myxcblx0XHRcdDEyMyxcblx0XHRcdDE3NCxcblx0XHRcdDEyMyxcblx0XHRcdDEyNixcblx0XHRcdDE3NSxcblx0XHRcdDEyMyxcblx0XHRcdDE3NSxcblx0XHRcdDE3NCxcblx0XHRcdDE0NCxcblx0XHRcdDE0Nyxcblx0XHRcdDE3Mixcblx0XHRcdDE0NCxcblx0XHRcdDEzOCxcblx0XHRcdDExNCxcblx0XHRcdDE3Mixcblx0XHRcdDEzOCxcblx0XHRcdDE0NCxcblx0XHRcdDE3Mixcblx0XHRcdDEyOCxcblx0XHRcdDEyNyxcblx0XHRcdDE3Mixcblx0XHRcdDEyNyxcblx0XHRcdDEzOCxcblx0XHRcdDQ4LFxuXHRcdFx0MzksXG5cdFx0XHQ1MSxcblx0XHRcdDkwLFxuXHRcdFx0ODksXG5cdFx0XHQ5Mixcblx0XHRcdDQ5LFxuXHRcdFx0NTcsXG5cdFx0XHQxNzYsXG5cdFx0XHQ0OSxcblx0XHRcdDE3Nixcblx0XHRcdDE3MSxcblx0XHRcdDc0LFxuXHRcdFx0MTc3LFxuXHRcdFx0OTcsXG5cdFx0XHQ3NCxcblx0XHRcdDk3LFxuXHRcdFx0NzUsXG5cdFx0XHQzLFxuXHRcdFx0MTcwLFxuXHRcdFx0MCxcblx0XHRcdDE3MCxcblx0XHRcdDMsXG5cdFx0XHQxMyxcblx0XHRcdDE3MCxcblx0XHRcdDcsXG5cdFx0XHQwLFxuXHRcdFx0Nyxcblx0XHRcdDE3MCxcblx0XHRcdDksXG5cdFx0XHQyMSxcblx0XHRcdDksXG5cdFx0XHQxNjksXG5cdFx0XHQxNjksXG5cdFx0XHQyNCxcblx0XHRcdDIxLFxuXHRcdFx0MjQsXG5cdFx0XHQxNjksXG5cdFx0XHQ3MSxcblx0XHRcdDUwLFxuXHRcdFx0MTc4LFxuXHRcdFx0NDQsXG5cdFx0XHQ1MCxcblx0XHRcdDQ0LFxuXHRcdFx0NDgsXG5cdFx0XHQxNzEsXG5cdFx0XHQxNzksXG5cdFx0XHQxNzgsXG5cdFx0XHQxNzEsXG5cdFx0XHQxNzgsXG5cdFx0XHQ1MCxcblx0XHRcdDQ0LFxuXHRcdFx0MTc4LFxuXHRcdFx0MTgwLFxuXHRcdFx0NDQsXG5cdFx0XHQxODAsXG5cdFx0XHQ0NSxcblx0XHRcdDE4MSxcblx0XHRcdDE4MCxcblx0XHRcdDE3OCxcblx0XHRcdDE4MSxcblx0XHRcdDE3OCxcblx0XHRcdDE3OSxcblx0XHRcdDE4Myxcblx0XHRcdDE4MSxcblx0XHRcdDE3OSxcblx0XHRcdDE4Myxcblx0XHRcdDE3OSxcblx0XHRcdDE4Mixcblx0XHRcdDczLFxuXHRcdFx0NzEsXG5cdFx0XHQxNjksXG5cdFx0XHQxNjksXG5cdFx0XHQxMyxcblx0XHRcdDczLFxuXHRcdFx0MTMsXG5cdFx0XHQxNjksXG5cdFx0XHQxNzAsXG5cdFx0XHQxODIsXG5cdFx0XHQxNzksXG5cdFx0XHQxNzEsXG5cdFx0XHQxODIsXG5cdFx0XHQxNzEsXG5cdFx0XHQxNzYsXG5cdFx0XHQxLFxuXHRcdFx0MTg0LFxuXHRcdFx0Mixcblx0XHRcdDE4NSxcblx0XHRcdDIsXG5cdFx0XHQxODQsXG5cdFx0XHQ1LFxuXHRcdFx0MTg2LFxuXHRcdFx0Nixcblx0XHRcdDE4Nyxcblx0XHRcdDYsXG5cdFx0XHQxODYsXG5cdFx0XHQxODYsXG5cdFx0XHQxODgsXG5cdFx0XHQxODcsXG5cdFx0XHQxODksXG5cdFx0XHQxODcsXG5cdFx0XHQxODgsXG5cdFx0XHQyLFxuXHRcdFx0MTg1LFxuXHRcdFx0MTAsXG5cdFx0XHQxOTAsXG5cdFx0XHQxMCxcblx0XHRcdDE4NSxcblx0XHRcdDE5MCxcblx0XHRcdDE4NSxcblx0XHRcdDE5MSxcblx0XHRcdDE5Mixcblx0XHRcdDE5MSxcblx0XHRcdDE4NSxcblx0XHRcdDE0LFxuXHRcdFx0MTAsXG5cdFx0XHQxOTMsXG5cdFx0XHQxOTAsXG5cdFx0XHQxOTMsXG5cdFx0XHQxMCxcblx0XHRcdDE5Myxcblx0XHRcdDE5MCxcblx0XHRcdDE5NCxcblx0XHRcdDE5MSxcblx0XHRcdDE5NCxcblx0XHRcdDE5MCxcblx0XHRcdDE5Myxcblx0XHRcdDE5NSxcblx0XHRcdDE0LFxuXHRcdFx0MTgsXG5cdFx0XHQxNCxcblx0XHRcdDE5NSxcblx0XHRcdDE5NSxcblx0XHRcdDE5Nixcblx0XHRcdDE4LFxuXHRcdFx0MjAsXG5cdFx0XHQxOCxcblx0XHRcdDE5Nixcblx0XHRcdDE5Myxcblx0XHRcdDE5NCxcblx0XHRcdDE5NSxcblx0XHRcdDE5Nixcblx0XHRcdDE5NSxcblx0XHRcdDE5NCxcblx0XHRcdDEsXG5cdFx0XHQ2LFxuXHRcdFx0MTg0LFxuXHRcdFx0MTg3LFxuXHRcdFx0MTg0LFxuXHRcdFx0Nixcblx0XHRcdDE4OCxcblx0XHRcdDE5Nyxcblx0XHRcdDE4OSxcblx0XHRcdDE4OCxcblx0XHRcdDE5OCxcblx0XHRcdDE5Nyxcblx0XHRcdDE5OCxcblx0XHRcdDE5OSxcblx0XHRcdDE5Nyxcblx0XHRcdDIwMCxcblx0XHRcdDE5Nyxcblx0XHRcdDE5OSxcblx0XHRcdDIwMyxcblx0XHRcdDIwMSxcblx0XHRcdDIwMixcblx0XHRcdDIwNCxcblx0XHRcdDIwMixcblx0XHRcdDIwMSxcblx0XHRcdDIwNixcblx0XHRcdDIwNSxcblx0XHRcdDIwMyxcblx0XHRcdDIwMSxcblx0XHRcdDIwMyxcblx0XHRcdDIwNSxcblx0XHRcdDIwOCxcblx0XHRcdDIwNCxcblx0XHRcdDIwNyxcblx0XHRcdDIwMSxcblx0XHRcdDIwNyxcblx0XHRcdDIwNCxcblx0XHRcdDIwNyxcblx0XHRcdDIwMSxcblx0XHRcdDIwOSxcblx0XHRcdDIwNSxcblx0XHRcdDIwOSxcblx0XHRcdDIwMSxcblx0XHRcdDIwMixcblx0XHRcdDIxMCxcblx0XHRcdDIwMyxcblx0XHRcdDIxMSxcblx0XHRcdDIwMyxcblx0XHRcdDIxMCxcblx0XHRcdDIwMyxcblx0XHRcdDIxMSxcblx0XHRcdDIwNixcblx0XHRcdDIxMixcblx0XHRcdDIwNixcblx0XHRcdDIxMSxcblx0XHRcdDIxMCxcblx0XHRcdDIxMyxcblx0XHRcdDIxMSxcblx0XHRcdDIxNCxcblx0XHRcdDIxMSxcblx0XHRcdDIxMyxcblx0XHRcdDIxMSxcblx0XHRcdDIxNCxcblx0XHRcdDIxMixcblx0XHRcdDIxNSxcblx0XHRcdDIxMixcblx0XHRcdDIxNCxcblx0XHRcdDIxOSxcblx0XHRcdDIxNixcblx0XHRcdDIxNyxcblx0XHRcdDIxOSxcblx0XHRcdDIxNyxcblx0XHRcdDIxOCxcblx0XHRcdDQ1LFxuXHRcdFx0MjIwLFxuXHRcdFx0MjIxLFxuXHRcdFx0NDUsXG5cdFx0XHQyMjEsXG5cdFx0XHQ0Nixcblx0XHRcdDIyMSxcblx0XHRcdDIyMCxcblx0XHRcdDIyMixcblx0XHRcdDIyNSxcblx0XHRcdDIyMyxcblx0XHRcdDIyNCxcblx0XHRcdDIyNSxcblx0XHRcdDIyNCxcblx0XHRcdDIyMixcblx0XHRcdDIxNyxcblx0XHRcdDIxNixcblx0XHRcdDIyNixcblx0XHRcdDIxNyxcblx0XHRcdDIyNixcblx0XHRcdDIyNyxcblx0XHRcdDIyOSxcblx0XHRcdDIyOCxcblx0XHRcdDIxOSxcblx0XHRcdDIyOSxcblx0XHRcdDIxOSxcblx0XHRcdDIxOCxcblx0XHRcdDIyMyxcblx0XHRcdDIzMCxcblx0XHRcdDIyOCxcblx0XHRcdDIzMSxcblx0XHRcdDIzMCxcblx0XHRcdDIyMyxcblx0XHRcdDIzNCxcblx0XHRcdDIzMixcblx0XHRcdDIzMyxcblx0XHRcdDIzNCxcblx0XHRcdDIzMyxcblx0XHRcdDIxOSxcblx0XHRcdDIzNCxcblx0XHRcdDIxOSxcblx0XHRcdDIzMCxcblx0XHRcdDIxNixcblx0XHRcdDIzMyxcblx0XHRcdDIzNSxcblx0XHRcdDIxNixcblx0XHRcdDIzNSxcblx0XHRcdDIyNixcblx0XHRcdDIxOSxcblx0XHRcdDIzMyxcblx0XHRcdDIxNixcblx0XHRcdDIyOCxcblx0XHRcdDIzMCxcblx0XHRcdDIxOSxcblx0XHRcdDIzMyxcblx0XHRcdDIzMixcblx0XHRcdDIzNixcblx0XHRcdDIzMyxcblx0XHRcdDIzNixcblx0XHRcdDIzNSxcblx0XHRcdDIyMyxcblx0XHRcdDIyOCxcblx0XHRcdDIyOSxcblx0XHRcdDIyMyxcblx0XHRcdDIyOSxcblx0XHRcdDIyNCxcblx0XHRcdDIyNixcblx0XHRcdDIzNSxcblx0XHRcdDY0LFxuXHRcdFx0MjI2LFxuXHRcdFx0NjQsXG5cdFx0XHQ2Myxcblx0XHRcdDIzNSxcblx0XHRcdDIzNixcblx0XHRcdDY1LFxuXHRcdFx0MjM1LFxuXHRcdFx0NjUsXG5cdFx0XHQ2NCxcblx0XHRcdDIxNSxcblx0XHRcdDIyNCxcblx0XHRcdDIxMixcblx0XHRcdDIyOSxcblx0XHRcdDIxMixcblx0XHRcdDIyNCxcblx0XHRcdDIyOSxcblx0XHRcdDIxOCxcblx0XHRcdDIxMixcblx0XHRcdDIwNixcblx0XHRcdDIxMixcblx0XHRcdDIxOCxcblx0XHRcdDIxOCxcblx0XHRcdDIxNyxcblx0XHRcdDIwNixcblx0XHRcdDIwNSxcblx0XHRcdDIwNixcblx0XHRcdDIxNyxcblx0XHRcdDIwOSxcblx0XHRcdDIwNSxcblx0XHRcdDIzNyxcblx0XHRcdDIxNyxcblx0XHRcdDIzNyxcblx0XHRcdDIwNSxcblx0XHRcdDIyNyxcblx0XHRcdDIzOCxcblx0XHRcdDIzNyxcblx0XHRcdDIxNyxcblx0XHRcdDIyNyxcblx0XHRcdDIzNyxcblx0XHRcdDIyNixcblx0XHRcdDYzLFxuXHRcdFx0MjM5LFxuXHRcdFx0MjM5LFxuXHRcdFx0NjMsXG5cdFx0XHQ2OSxcblx0XHRcdDIzNyxcblx0XHRcdDI0MCxcblx0XHRcdDIwOSxcblx0XHRcdDI0MSxcblx0XHRcdDIwOSxcblx0XHRcdDI0MCxcblx0XHRcdDIzNyxcblx0XHRcdDIzOCxcblx0XHRcdDI0MCxcblx0XHRcdDE5Nixcblx0XHRcdDI0MCxcblx0XHRcdDIzOCxcblx0XHRcdDcyLFxuXHRcdFx0MjAsXG5cdFx0XHQyMzgsXG5cdFx0XHQxOTYsXG5cdFx0XHQyMzgsXG5cdFx0XHQyMCxcblx0XHRcdDIwOSxcblx0XHRcdDI0MSxcblx0XHRcdDIwNyxcblx0XHRcdDIwMCxcblx0XHRcdDIwNyxcblx0XHRcdDI0MSxcblx0XHRcdDIwNyxcblx0XHRcdDIwMCxcblx0XHRcdDIwOCxcblx0XHRcdDE5OSxcblx0XHRcdDIwOCxcblx0XHRcdDIwMCxcblx0XHRcdDE5MSxcblx0XHRcdDI0MCxcblx0XHRcdDE5NCxcblx0XHRcdDE5Nixcblx0XHRcdDE5NCxcblx0XHRcdDI0MCxcblx0XHRcdDI0MCxcblx0XHRcdDI0Mixcblx0XHRcdDI0MSxcblx0XHRcdDI0Myxcblx0XHRcdDc0LFxuXHRcdFx0NDYsXG5cdFx0XHQyNDMsXG5cdFx0XHQ0Nixcblx0XHRcdDIyMSxcblx0XHRcdDIzOSxcblx0XHRcdDY5LFxuXHRcdFx0NzIsXG5cdFx0XHQyNDUsXG5cdFx0XHQyNDQsXG5cdFx0XHQyMTMsXG5cdFx0XHQyMTQsXG5cdFx0XHQyMTMsXG5cdFx0XHQyNDQsXG5cdFx0XHQyNDcsXG5cdFx0XHQyNDUsXG5cdFx0XHQyNDYsXG5cdFx0XHQyMTMsXG5cdFx0XHQyNDYsXG5cdFx0XHQyNDUsXG5cdFx0XHQyNDksXG5cdFx0XHQyNDgsXG5cdFx0XHQyNDYsXG5cdFx0XHQyNDcsXG5cdFx0XHQyNDYsXG5cdFx0XHQyNDgsXG5cdFx0XHQyNTIsXG5cdFx0XHQyNTAsXG5cdFx0XHQyNTEsXG5cdFx0XHQyNTMsXG5cdFx0XHQyNTEsXG5cdFx0XHQyNTAsXG5cdFx0XHQyNTAsXG5cdFx0XHQyNTQsXG5cdFx0XHQyNTMsXG5cdFx0XHQyNTUsXG5cdFx0XHQyNTMsXG5cdFx0XHQyNTQsXG5cdFx0XHQyNTgsXG5cdFx0XHQyNTYsXG5cdFx0XHQyNTcsXG5cdFx0XHQyNTksXG5cdFx0XHQyNTcsXG5cdFx0XHQyNTYsXG5cdFx0XHQyNDgsXG5cdFx0XHQyNDksXG5cdFx0XHQyNjAsXG5cdFx0XHQyNTEsXG5cdFx0XHQyNjEsXG5cdFx0XHQyNTIsXG5cdFx0XHQyNjIsXG5cdFx0XHQyNTIsXG5cdFx0XHQyNjEsXG5cdFx0XHQyNjIsXG5cdFx0XHQyNjEsXG5cdFx0XHQyNjMsXG5cdFx0XHQyNjQsXG5cdFx0XHQyNjMsXG5cdFx0XHQyNjEsXG5cdFx0XHQyMTUsXG5cdFx0XHQyMjEsXG5cdFx0XHQyMjIsXG5cdFx0XHQyNDIsXG5cdFx0XHQxOTEsXG5cdFx0XHQxOTIsXG5cdFx0XHQyNDIsXG5cdFx0XHQyNDAsXG5cdFx0XHQxOTEsXG5cdFx0XHQyMjcsXG5cdFx0XHQyMjYsXG5cdFx0XHQyMzksXG5cdFx0XHQyNDMsXG5cdFx0XHQyMTQsXG5cdFx0XHQyNjUsXG5cdFx0XHQyNDQsXG5cdFx0XHQyNjUsXG5cdFx0XHQyMTQsXG5cdFx0XHQyNjgsXG5cdFx0XHQyNjYsXG5cdFx0XHQyNjcsXG5cdFx0XHQyNjksXG5cdFx0XHQyNjcsXG5cdFx0XHQyNjYsXG5cdFx0XHQyNzIsXG5cdFx0XHQyNzAsXG5cdFx0XHQyNzEsXG5cdFx0XHQyNzMsXG5cdFx0XHQyNzEsXG5cdFx0XHQyNzAsXG5cdFx0XHQyNzIsXG5cdFx0XHQyNzQsXG5cdFx0XHQyNzAsXG5cdFx0XHQyNzUsXG5cdFx0XHQyNzAsXG5cdFx0XHQyNzQsXG5cdFx0XHQyNzgsXG5cdFx0XHQyNzYsXG5cdFx0XHQyNzcsXG5cdFx0XHQyNzksXG5cdFx0XHQyNzcsXG5cdFx0XHQyNzYsXG5cdFx0XHQyNzcsXG5cdFx0XHQyNzksXG5cdFx0XHQyODAsXG5cdFx0XHQyODEsXG5cdFx0XHQyODAsXG5cdFx0XHQyNzksXG5cdFx0XHQyODIsXG5cdFx0XHQyNjEsXG5cdFx0XHQyNTEsXG5cdFx0XHQyNjYsXG5cdFx0XHQyODMsXG5cdFx0XHQyNjksXG5cdFx0XHQyODQsXG5cdFx0XHQyNjksXG5cdFx0XHQyODMsXG5cdFx0XHQyODYsXG5cdFx0XHQyNzIsXG5cdFx0XHQyODUsXG5cdFx0XHQyNzEsXG5cdFx0XHQyODUsXG5cdFx0XHQyNzIsXG5cdFx0XHQyODYsXG5cdFx0XHQyODcsXG5cdFx0XHQyNzIsXG5cdFx0XHQyNzQsXG5cdFx0XHQyNzIsXG5cdFx0XHQyODcsXG5cdFx0XHQyODksXG5cdFx0XHQyODgsXG5cdFx0XHQyNzYsXG5cdFx0XHQyNzksXG5cdFx0XHQyNzYsXG5cdFx0XHQyODgsXG5cdFx0XHQyODQsXG5cdFx0XHQyODMsXG5cdFx0XHQyOTAsXG5cdFx0XHQyOTQsXG5cdFx0XHQyOTEsXG5cdFx0XHQyOTIsXG5cdFx0XHQyOTQsXG5cdFx0XHQyOTIsXG5cdFx0XHQyOTMsXG5cdFx0XHQyOTgsXG5cdFx0XHQyOTUsXG5cdFx0XHQyOTYsXG5cdFx0XHQyOTgsXG5cdFx0XHQyOTYsXG5cdFx0XHQyOTcsXG5cdFx0XHQyNjcsXG5cdFx0XHQyNjksXG5cdFx0XHQyNzMsXG5cdFx0XHQyNzEsXG5cdFx0XHQyNzMsXG5cdFx0XHQyNjksXG5cdFx0XHQyNjksXG5cdFx0XHQyODQsXG5cdFx0XHQyNzEsXG5cdFx0XHQyODUsXG5cdFx0XHQyNzEsXG5cdFx0XHQyODQsXG5cdFx0XHQyNzYsXG5cdFx0XHQyNzgsXG5cdFx0XHQyNzQsXG5cdFx0XHQyNzUsXG5cdFx0XHQyNzQsXG5cdFx0XHQyNzgsXG5cdFx0XHQyODksXG5cdFx0XHQyNzYsXG5cdFx0XHQyODcsXG5cdFx0XHQyNzQsXG5cdFx0XHQyODcsXG5cdFx0XHQyNzYsXG5cdFx0XHQyNjYsXG5cdFx0XHQyOTQsXG5cdFx0XHQyOTMsXG5cdFx0XHQyNjYsXG5cdFx0XHQyOTMsXG5cdFx0XHQyODMsXG5cdFx0XHQyOTYsXG5cdFx0XHQyOTEsXG5cdFx0XHQyOTQsXG5cdFx0XHQyOTYsXG5cdFx0XHQyOTQsXG5cdFx0XHQyOTcsXG5cdFx0XHQyNjgsXG5cdFx0XHQyNjcsXG5cdFx0XHQyOTksXG5cdFx0XHQzMDAsXG5cdFx0XHQyOTksXG5cdFx0XHQyNjcsXG5cdFx0XHQyNzMsXG5cdFx0XHQyNzAsXG5cdFx0XHQxODgsXG5cdFx0XHQxOTgsXG5cdFx0XHQxODgsXG5cdFx0XHQyNzAsXG5cdFx0XHQyNzAsXG5cdFx0XHQyNzUsXG5cdFx0XHQxOTgsXG5cdFx0XHQzMDEsXG5cdFx0XHQxOTgsXG5cdFx0XHQyNzUsXG5cdFx0XHQyNzgsXG5cdFx0XHQyNzcsXG5cdFx0XHQzMDIsXG5cdFx0XHQzMDMsXG5cdFx0XHQzMDIsXG5cdFx0XHQyNzcsXG5cdFx0XHQyNzcsXG5cdFx0XHQyODAsXG5cdFx0XHQzMDMsXG5cdFx0XHQzMDQsXG5cdFx0XHQzMDMsXG5cdFx0XHQyODAsXG5cdFx0XHQyOTcsXG5cdFx0XHQyOTQsXG5cdFx0XHQyNjYsXG5cdFx0XHQyOTcsXG5cdFx0XHQyNjYsXG5cdFx0XHQyNjgsXG5cdFx0XHQzMDYsXG5cdFx0XHQyOTUsXG5cdFx0XHQzMDUsXG5cdFx0XHQzMDYsXG5cdFx0XHQzMDUsXG5cdFx0XHQyODIsXG5cdFx0XHQyNjcsXG5cdFx0XHQyNzMsXG5cdFx0XHQzMDAsXG5cdFx0XHQxODgsXG5cdFx0XHQzMDAsXG5cdFx0XHQyNzMsXG5cdFx0XHQyNzUsXG5cdFx0XHQyNzgsXG5cdFx0XHQzMDEsXG5cdFx0XHQzMDIsXG5cdFx0XHQzMDEsXG5cdFx0XHQyNzgsXG5cdFx0XHQxODYsXG5cdFx0XHQzMDcsXG5cdFx0XHQxODgsXG5cdFx0XHQzMDAsXG5cdFx0XHQxODgsXG5cdFx0XHQzMDcsXG5cdFx0XHQzMDcsXG5cdFx0XHQzMDgsXG5cdFx0XHQzMDAsXG5cdFx0XHQyOTksXG5cdFx0XHQzMDAsXG5cdFx0XHQzMDgsXG5cdFx0XHQzMDQsXG5cdFx0XHQzMDYsXG5cdFx0XHQyODIsXG5cdFx0XHQzMDQsXG5cdFx0XHQyODIsXG5cdFx0XHQzMDksXG5cdFx0XHQyNTEsXG5cdFx0XHQzMDksXG5cdFx0XHQyODIsXG5cdFx0XHQ1LFxuXHRcdFx0MTQyLFxuXHRcdFx0MTg2LFxuXHRcdFx0MzA3LFxuXHRcdFx0MTg2LFxuXHRcdFx0MTQyLFxuXHRcdFx0MTQyLFxuXHRcdFx0MTQzLFxuXHRcdFx0MzA3LFxuXHRcdFx0MzA4LFxuXHRcdFx0MzA3LFxuXHRcdFx0MTQzLFxuXHRcdFx0MzEyLFxuXHRcdFx0MzEwLFxuXHRcdFx0MzExLFxuXHRcdFx0MzEzLFxuXHRcdFx0MzExLFxuXHRcdFx0MzEwLFxuXHRcdFx0MjYxLFxuXHRcdFx0MjgyLFxuXHRcdFx0MzEyLFxuXHRcdFx0MzEwLFxuXHRcdFx0MzEyLFxuXHRcdFx0MjgyLFxuXHRcdFx0MzExLFxuXHRcdFx0MzEzLFxuXHRcdFx0MTQ4LFxuXHRcdFx0MTQ5LFxuXHRcdFx0MTQ4LFxuXHRcdFx0MzEzLFxuXHRcdFx0MzExLFxuXHRcdFx0MzE0LFxuXHRcdFx0MzEyLFxuXHRcdFx0MzE1LFxuXHRcdFx0MzEyLFxuXHRcdFx0MzE0LFxuXHRcdFx0MzEyLFxuXHRcdFx0MzE1LFxuXHRcdFx0MjYxLFxuXHRcdFx0MjY0LFxuXHRcdFx0MjYxLFxuXHRcdFx0MzE1LFxuXHRcdFx0MzExLFxuXHRcdFx0MTQ4LFxuXHRcdFx0MzE0LFxuXHRcdFx0MTUyLFxuXHRcdFx0MzE0LFxuXHRcdFx0MTQ4LFxuXHRcdFx0MzE3LFxuXHRcdFx0MzE2LFxuXHRcdFx0MzE1LFxuXHRcdFx0MzE2LFxuXHRcdFx0MjY0LFxuXHRcdFx0MzE1LFxuXHRcdFx0MTUyLFxuXHRcdFx0MTU1LFxuXHRcdFx0MzE0LFxuXHRcdFx0MzE4LFxuXHRcdFx0MzE0LFxuXHRcdFx0MTU1LFxuXHRcdFx0MzAzLFxuXHRcdFx0MzA0LFxuXHRcdFx0MzE5LFxuXHRcdFx0MzA5LFxuXHRcdFx0MzE5LFxuXHRcdFx0MzA0LFxuXHRcdFx0MzE5LFxuXHRcdFx0MzIwLFxuXHRcdFx0MzAzLFxuXHRcdFx0MzAyLFxuXHRcdFx0MzAzLFxuXHRcdFx0MzIwLFxuXHRcdFx0MzIwLFxuXHRcdFx0MzIxLFxuXHRcdFx0MzAyLFxuXHRcdFx0MzAxLFxuXHRcdFx0MzAyLFxuXHRcdFx0MzIxLFxuXHRcdFx0MzIxLFxuXHRcdFx0MTk5LFxuXHRcdFx0MzAxLFxuXHRcdFx0MTk4LFxuXHRcdFx0MzAxLFxuXHRcdFx0MTk5LFxuXHRcdFx0MTk5LFxuXHRcdFx0MzIxLFxuXHRcdFx0MjA4LFxuXHRcdFx0MzIyLFxuXHRcdFx0MjA4LFxuXHRcdFx0MzIxLFxuXHRcdFx0MjA0LFxuXHRcdFx0MzIzLFxuXHRcdFx0MjAyLFxuXHRcdFx0MzI0LFxuXHRcdFx0MjAyLFxuXHRcdFx0MzIzLFxuXHRcdFx0MjA4LFxuXHRcdFx0MzIyLFxuXHRcdFx0MjA0LFxuXHRcdFx0MzIzLFxuXHRcdFx0MjA0LFxuXHRcdFx0MzIyLFxuXHRcdFx0MjAyLFxuXHRcdFx0MzI0LFxuXHRcdFx0MjEwLFxuXHRcdFx0MzI1LFxuXHRcdFx0MjEwLFxuXHRcdFx0MzI0LFxuXHRcdFx0MjEzLFxuXHRcdFx0MjEwLFxuXHRcdFx0MjQ2LFxuXHRcdFx0MzI1LFxuXHRcdFx0MjQ2LFxuXHRcdFx0MjEwLFxuXHRcdFx0MzIxLFxuXHRcdFx0MzIwLFxuXHRcdFx0MzIyLFxuXHRcdFx0MzI2LFxuXHRcdFx0MzIyLFxuXHRcdFx0MzIwLFxuXHRcdFx0MzIzLFxuXHRcdFx0MzI3LFxuXHRcdFx0MzI0LFxuXHRcdFx0MzI4LFxuXHRcdFx0MzI0LFxuXHRcdFx0MzI3LFxuXHRcdFx0MzIyLFxuXHRcdFx0MzI2LFxuXHRcdFx0MzIzLFxuXHRcdFx0MzI3LFxuXHRcdFx0MzIzLFxuXHRcdFx0MzI2LFxuXHRcdFx0MzI0LFxuXHRcdFx0MzI4LFxuXHRcdFx0MzI1LFxuXHRcdFx0MzI5LFxuXHRcdFx0MzI1LFxuXHRcdFx0MzI4LFxuXHRcdFx0MjQ2LFxuXHRcdFx0MzI1LFxuXHRcdFx0MjQ5LFxuXHRcdFx0MzI5LFxuXHRcdFx0MjQ5LFxuXHRcdFx0MzI1LFxuXHRcdFx0MzIwLFxuXHRcdFx0MzE5LFxuXHRcdFx0MzI2LFxuXHRcdFx0MjUzLFxuXHRcdFx0MzI2LFxuXHRcdFx0MzE5LFxuXHRcdFx0MzI3LFxuXHRcdFx0MjU1LFxuXHRcdFx0MzI4LFxuXHRcdFx0MjU2LFxuXHRcdFx0MzI4LFxuXHRcdFx0MjU1LFxuXHRcdFx0MzI2LFxuXHRcdFx0MjUzLFxuXHRcdFx0MzI3LFxuXHRcdFx0MjU1LFxuXHRcdFx0MzI3LFxuXHRcdFx0MjUzLFxuXHRcdFx0MzI4LFxuXHRcdFx0MjU2LFxuXHRcdFx0MzI5LFxuXHRcdFx0MjU4LFxuXHRcdFx0MzI5LFxuXHRcdFx0MjU2LFxuXHRcdFx0MjQ5LFxuXHRcdFx0MzI5LFxuXHRcdFx0MjYwLFxuXHRcdFx0MjU4LFxuXHRcdFx0MjYwLFxuXHRcdFx0MzI5LFxuXHRcdFx0MzE5LFxuXHRcdFx0MzA5LFxuXHRcdFx0MjUzLFxuXHRcdFx0MjUxLFxuXHRcdFx0MjUzLFxuXHRcdFx0MzA5LFxuXHRcdFx0MzMwLFxuXHRcdFx0MjgxLFxuXHRcdFx0Mjg4LFxuXHRcdFx0Mjc5LFxuXHRcdFx0Mjg4LFxuXHRcdFx0MjgxLFxuXHRcdFx0MTg5LFxuXHRcdFx0MzMxLFxuXHRcdFx0MzMyLFxuXHRcdFx0MjU2LFxuXHRcdFx0MjU1LFxuXHRcdFx0MjU5LFxuXHRcdFx0MjU0LFxuXHRcdFx0MjU5LFxuXHRcdFx0MjU1LFxuXHRcdFx0MzE1LFxuXHRcdFx0MzE0LFxuXHRcdFx0MzE3LFxuXHRcdFx0MzE4LFxuXHRcdFx0MzE3LFxuXHRcdFx0MzE0LFxuXHRcdFx0MjYzLFxuXHRcdFx0MjY0LFxuXHRcdFx0MzE2LFxuXHRcdFx0MjIzLFxuXHRcdFx0MjI1LFxuXHRcdFx0MzMzLFxuXHRcdFx0MjE1LFxuXHRcdFx0MjE0LFxuXHRcdFx0MjIxLFxuXHRcdFx0MjQzLFxuXHRcdFx0MjIxLFxuXHRcdFx0MjE0LFxuXHRcdFx0MjM5LFxuXHRcdFx0MjM4LFxuXHRcdFx0MjI3LFxuXHRcdFx0MjM4LFxuXHRcdFx0MjM5LFxuXHRcdFx0NzIsXG5cdFx0XHQyODQsXG5cdFx0XHQyOTAsXG5cdFx0XHQyODUsXG5cdFx0XHQxNDksXG5cdFx0XHQzMTMsXG5cdFx0XHQxNDMsXG5cdFx0XHQzMDgsXG5cdFx0XHQxNDMsXG5cdFx0XHQzMTMsXG5cdFx0XHQzMDgsXG5cdFx0XHQzMTMsXG5cdFx0XHQzMzQsXG5cdFx0XHQyOTgsXG5cdFx0XHQyOTksXG5cdFx0XHQzMDgsXG5cdFx0XHQyOTgsXG5cdFx0XHQzMDgsXG5cdFx0XHQzMzQsXG5cdFx0XHQyOTksXG5cdFx0XHQyOTgsXG5cdFx0XHQyOTcsXG5cdFx0XHQyOTksXG5cdFx0XHQyOTcsXG5cdFx0XHQyNjgsXG5cdFx0XHQzMDYsXG5cdFx0XHQzMDQsXG5cdFx0XHQyODAsXG5cdFx0XHQzMDYsXG5cdFx0XHQyODAsXG5cdFx0XHQzMzUsXG5cdFx0XHQzMzYsXG5cdFx0XHQzMzUsXG5cdFx0XHQyODAsXG5cdFx0XHQzMzYsXG5cdFx0XHQyODAsXG5cdFx0XHQyODEsXG5cdFx0XHQzMzAsXG5cdFx0XHQzMzcsXG5cdFx0XHQzMzYsXG5cdFx0XHQzMzAsXG5cdFx0XHQzMzYsXG5cdFx0XHQyODEsXG5cdFx0XHQyOTUsXG5cdFx0XHQzMDYsXG5cdFx0XHQzMzUsXG5cdFx0XHQyOTUsXG5cdFx0XHQzMzUsXG5cdFx0XHQyOTYsXG5cdFx0XHQyOTEsXG5cdFx0XHQyOTYsXG5cdFx0XHQzMzUsXG5cdFx0XHQyOTEsXG5cdFx0XHQzMzUsXG5cdFx0XHQzMzYsXG5cdFx0XHQzMzcsXG5cdFx0XHQyOTIsXG5cdFx0XHQyOTEsXG5cdFx0XHQzMzcsXG5cdFx0XHQyOTEsXG5cdFx0XHQzMzYsXG5cdFx0XHQzMzQsXG5cdFx0XHQzMTMsXG5cdFx0XHQzMTAsXG5cdFx0XHQyODIsXG5cdFx0XHQzMDUsXG5cdFx0XHQzMTAsXG5cdFx0XHQzMTAsXG5cdFx0XHQzMDUsXG5cdFx0XHQzMzQsXG5cdFx0XHQyOTUsXG5cdFx0XHQyOTgsXG5cdFx0XHQzMzQsXG5cdFx0XHQyOTUsXG5cdFx0XHQzMzQsXG5cdFx0XHQzMDUsXG5cdFx0XHQyMjQsXG5cdFx0XHQyMTUsXG5cdFx0XHQyMjIsXG5cdFx0XHQyNjAsXG5cdFx0XHQyNTgsXG5cdFx0XHQyNTcsXG5cdFx0XHQzMzgsXG5cdFx0XHQyMzEsXG5cdFx0XHQyMjMsXG5cdFx0XHQzMzgsXG5cdFx0XHQyMjMsXG5cdFx0XHQzMzMsXG5cdFx0XHQyNjUsXG5cdFx0XHQxNzcsXG5cdFx0XHQ3NCxcblx0XHRcdDI2NSxcblx0XHRcdDc0LFxuXHRcdFx0MjQzLFxuXHRcdFx0MTg0LFxuXHRcdFx0MzMyLFxuXHRcdFx0MTg1LFxuXHRcdFx0MTkyLFxuXHRcdFx0MTg1LFxuXHRcdFx0MzMyLFxuXHRcdFx0MTg0LFxuXHRcdFx0MTg3LFxuXHRcdFx0MzMyLFxuXHRcdFx0MTg5LFxuXHRcdFx0MzMyLFxuXHRcdFx0MTg3LFxuXHRcdFx0MzMxLFxuXHRcdFx0MTg5LFxuXHRcdFx0MTk3LFxuXHRcdFx0MTk3LFxuXHRcdFx0MjAwLFxuXHRcdFx0MzMxLFxuXHRcdFx0MjQxLFxuXHRcdFx0MzMxLFxuXHRcdFx0MjAwLFxuXHRcdFx0MjIwLFxuXHRcdFx0MzM5LFxuXHRcdFx0MjI1LFxuXHRcdFx0MjIwLFxuXHRcdFx0MjI1LFxuXHRcdFx0MjIyLFxuXHRcdFx0MzM5LFxuXHRcdFx0MzQwLFxuXHRcdFx0MzMzLFxuXHRcdFx0MzM5LFxuXHRcdFx0MzMzLFxuXHRcdFx0MjI1LFxuXHRcdFx0MTgwLFxuXHRcdFx0MzM5LFxuXHRcdFx0MjIwLFxuXHRcdFx0MTgwLFxuXHRcdFx0MjIwLFxuXHRcdFx0NDUsXG5cdFx0XHQzMzksXG5cdFx0XHQxODAsXG5cdFx0XHQxODEsXG5cdFx0XHQzMzksXG5cdFx0XHQxODEsXG5cdFx0XHQzNDAsXG5cdFx0XHQzNDAsXG5cdFx0XHQxODEsXG5cdFx0XHQxODMsXG5cdFx0XHQzNDAsXG5cdFx0XHQxODMsXG5cdFx0XHQzNDEsXG5cdFx0XHQzMzEsXG5cdFx0XHQyNDEsXG5cdFx0XHQyNDIsXG5cdFx0XHQyNDIsXG5cdFx0XHQxOTIsXG5cdFx0XHQzMzEsXG5cdFx0XHQzMzIsXG5cdFx0XHQzMzEsXG5cdFx0XHQxOTIsXG5cdFx0XHQzMzMsXG5cdFx0XHQzNDAsXG5cdFx0XHQzNDEsXG5cdFx0XHQzMzMsXG5cdFx0XHQzNDEsXG5cdFx0XHQzMzhcblx0XHRdLFxuXHRcdFwiZmVhdHVyZVBvaW50XCI6IFtcblx0XHRcdDI1MCxcblx0XHRcdDI1OSxcblx0XHRcdDI2MCxcblx0XHRcdDI0OCxcblx0XHRcdDI0NSxcblx0XHRcdDI0NCxcblx0XHRcdDI2NSxcblx0XHRcdDE3Nyxcblx0XHRcdDk3LFxuXHRcdFx0NzYsXG5cdFx0XHQ3Nyxcblx0XHRcdDgwLFxuXHRcdFx0OTIsXG5cdFx0XHQ5MSxcblx0XHRcdDgyLFxuXHRcdFx0MTQxLFxuXHRcdFx0MTE0LFxuXHRcdFx0MTcyLFxuXHRcdFx0MTQwLFxuXHRcdFx0MzA5LFxuXHRcdFx0MjgyLFxuXHRcdFx0MzM0LFxuXHRcdFx0MzA4LFxuXHRcdFx0Mjg4LFxuXHRcdFx0MjkyLFxuXHRcdFx0MjkwLFxuXHRcdFx0Mjg3LFxuXHRcdFx0LTEsXG5cdFx0XHQxMjAsXG5cdFx0XHQxMjYsXG5cdFx0XHQxMjIsXG5cdFx0XHQxMTksXG5cdFx0XHQtMSxcblx0XHRcdDUsXG5cdFx0XHQxODksXG5cdFx0XHQzMzEsXG5cdFx0XHQyNDAsXG5cdFx0XHQyMCxcblx0XHRcdDcwLFxuXHRcdFx0MTY5LFxuXHRcdFx0OSxcblx0XHRcdDYsXG5cdFx0XHQxOTMsXG5cdFx0XHQxNSxcblx0XHRcdDIzMCxcblx0XHRcdDIyNyxcblx0XHRcdDIzOSxcblx0XHRcdDY5LFxuXHRcdFx0NjgsXG5cdFx0XHQ1Mixcblx0XHRcdDU2LFxuXHRcdFx0NDgsXG5cdFx0XHQ0NCxcblx0XHRcdDQ1LFxuXHRcdFx0MjIwLFxuXHRcdFx0MjIyLFxuXHRcdFx0MzQxLFxuXHRcdFx0MTgzLFxuXHRcdFx0MTgyLFxuXHRcdFx0NjIsXG5cdFx0XHQ2NSxcblx0XHRcdDIzNixcblx0XHRcdDIsXG5cdFx0XHQzMzcsXG5cdFx0XHQyOTMsXG5cdFx0XHQyODYsXG5cdFx0XHQyODksXG5cdFx0XHQxNzUsXG5cdFx0XHQxMjUsXG5cdFx0XHQxMTcsXG5cdFx0XHQxMjEsXG5cdFx0XHQ4Myxcblx0XHRcdDk1LFxuXHRcdFx0MTUzLFxuXHRcdFx0MTU2LFxuXHRcdFx0MTU1LFxuXHRcdFx0MzE4LFxuXHRcdFx0MzE2LFxuXHRcdFx0MjYzLFxuXHRcdFx0MjUyXG5cdFx0XSxcblx0XHRcIndlaWdodFwiOiBbXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Mixcblx0XHRcdFx0XHQxODMuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0MTU4LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDUxLjU4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQ0My4zMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjIsXG5cdFx0XHRcdFx0MzA2LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDE1Ny40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQ1LjA2NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDMsXG5cdFx0XHRcdFx0NS4wNjRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDU1Ny42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQxNTAuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0NjQuNDZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDU2LjMzXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMyxcblx0XHRcdFx0XHQ2NTBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDgyLjIxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQyOC44NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTgsXG5cdFx0XHRcdFx0MjUuNzdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMzLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDQ2NC44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQxNjAuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzMsXG5cdFx0XHRcdFx0MzUuNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDM0LjQ3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQxMTkuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzMsXG5cdFx0XHRcdFx0ODQuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0NTEuMTdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQxLFxuXHRcdFx0XHRcdDQyLjY4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Mixcblx0XHRcdFx0XHQzOTcuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDMsXG5cdFx0XHRcdFx0MzIyLjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQyLFxuXHRcdFx0XHRcdDMyMi4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQ4Mi44MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDMsXG5cdFx0XHRcdFx0NzU5LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDExNS42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQ4OC40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0NTYuMjVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDExOC45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQ5OC45NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0NTMuMDhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDQxLjM2XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQxMTkuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDAsXG5cdFx0XHRcdFx0ODIuNjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDY0LjQxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQ0Mi45N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0NjYyLjdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDY2Mi43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQxNDAuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjIsXG5cdFx0XHRcdFx0NTQuNDdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDI0Ni41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQxNDMuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0MTE1LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDU3LjQ0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQ4MzkuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0NDUxLjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQyLFxuXHRcdFx0XHRcdDIyMy4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nyxcblx0XHRcdFx0XHQ0OS4xNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0OTU5Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQyLFxuXHRcdFx0XHRcdDMxOS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQzMTkuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDcsXG5cdFx0XHRcdFx0NS40MDVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDkwNS4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQxNDMuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDgsXG5cdFx0XHRcdFx0NjMuMjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQyLFxuXHRcdFx0XHRcdDYyLjc1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQzMzIuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0MTg2LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDU5Ljg1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQzMC4xMlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0ODIuODVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDU1LjUzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQ1MC4wN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0MzkuOTFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDUwLjQzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQzMC41NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDAsXG5cdFx0XHRcdFx0MjUuODJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDI0Ljc2XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQzMzkuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0MTMwLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQwLFxuXHRcdFx0XHRcdDQwLjQ3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQxNy4xNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0NDUuMzFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDMxLjAyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQyMy4wMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDksXG5cdFx0XHRcdFx0MjIuMjRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDQ2LjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQyNC4wM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDksXG5cdFx0XHRcdFx0MjIuNjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDE4LjU1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMCxcblx0XHRcdFx0XHQyMC43N1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MTQuNDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDEyLjY1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQxMS42NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0MTcuMDFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDE2LjUyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMCxcblx0XHRcdFx0XHQxMC40M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0OC44OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0NzAuMTRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDU3LjE4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQ1NC41NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0NDQuMDNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDE2Ny40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQ1Mi45OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MzkuOTVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDM0LjM0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQzNi4wNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0MjMuODNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDEzLjkyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQxMy4xN1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0ODQuMDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDc5Ljg0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQyNC42MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDAsXG5cdFx0XHRcdFx0MTkuODdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDI4MC42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQxMzEuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDksXG5cdFx0XHRcdFx0NTQuMjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDI3LjMxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMCxcblx0XHRcdFx0XHQzOS40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTEsXG5cdFx0XHRcdFx0MTkuNzZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDE3LjQzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ5LFxuXHRcdFx0XHRcdDEyLjA4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQ2MS4wOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MjUuMzhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDksXG5cdFx0XHRcdFx0MjEuMTdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDE4LjE4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQzMjQuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0NjkuNDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDMxLjE1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQzMC4wMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTAsXG5cdFx0XHRcdFx0MTYyLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDExLFxuXHRcdFx0XHRcdDI1LjAyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ5LFxuXHRcdFx0XHRcdDI0Ljg5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQxMi45N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0OSxcblx0XHRcdFx0XHQ4Ni41OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0NDcuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0NDcuNDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDIzLjM0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQxNDkuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MTQ2LjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDM3LjcyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OCxcblx0XHRcdFx0XHQyMy4wM1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MzA5LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU5LFxuXHRcdFx0XHRcdDExNC43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQ4NC43NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDgsXG5cdFx0XHRcdFx0NDEuOFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0Mzg2NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTksXG5cdFx0XHRcdFx0NjcuODNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDYyLjUxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQ0NS4wMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0NjM0LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ5LFxuXHRcdFx0XHRcdDc0LjAyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQ2NS42NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTksXG5cdFx0XHRcdFx0NTguNDVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDIxMC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQxOTQuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTksXG5cdFx0XHRcdFx0NzEuNTRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDU4LjA0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Mixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Myxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Myxcblx0XHRcdFx0XHQ2NzkuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTcsXG5cdFx0XHRcdFx0NjMuNjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDQwLjk5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NCxcblx0XHRcdFx0XHQ0MC45OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTIsXG5cdFx0XHRcdFx0NDM4LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDE4MS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OCxcblx0XHRcdFx0XHQ2Ni4xN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTMsXG5cdFx0XHRcdFx0NjMuODdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDc5MTdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDYxLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDE4LjczXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQxNDk4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Mixcblx0XHRcdFx0XHQyNjIuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0MjUxLjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDIyNS4yXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQ1NzEuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MjY5LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDU3LjAxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OCxcblx0XHRcdFx0XHQ0OS4yN1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDksXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDksXG5cdFx0XHRcdFx0MTU2NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTksXG5cdFx0XHRcdFx0NTYzLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDU2Mi4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nyxcblx0XHRcdFx0XHQxMzMuNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0NjgzN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0OTAuMzFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDY0LjIyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OSxcblx0XHRcdFx0XHQ1NC41MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MTI5MFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MTA2LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDQ4LjQ4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OSxcblx0XHRcdFx0XHQ0My4yOVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0NTA4MFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MTIwLjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDEwMi4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Mixcblx0XHRcdFx0XHQ1OS4yOVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0NDg4Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU5LFxuXHRcdFx0XHRcdDE1Ny42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQyMi4wN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0MTYuMTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDQ2ODhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU5LFxuXHRcdFx0XHRcdDg1Ljg0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQ3Mi42NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0NTAuNjJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDM3Ni40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OSxcblx0XHRcdFx0XHQxNDMuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDksXG5cdFx0XHRcdFx0MzkuNDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDEwLjgxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OSxcblx0XHRcdFx0XHQxNzk2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQ0NzcuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDgsXG5cdFx0XHRcdFx0MjI4LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYwLFxuXHRcdFx0XHRcdDE0MC4zXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nyxcblx0XHRcdFx0XHQyNTg4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MCxcblx0XHRcdFx0XHQ2OTVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDQwMS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQ0MDEuMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjAsXG5cdFx0XHRcdFx0MTg1MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDcsXG5cdFx0XHRcdFx0ODA1Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ2LFxuXHRcdFx0XHRcdDIwMy44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OCxcblx0XHRcdFx0XHQyMDMuOFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjAsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0NDI3LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ5LFxuXHRcdFx0XHRcdDk1LjIyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQ3Ni45NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDgsXG5cdFx0XHRcdFx0MzEuNjdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDM1OC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OSxcblx0XHRcdFx0XHQyMzcuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0MjM0LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM4LFxuXHRcdFx0XHRcdDExMi44XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0OCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nyxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQ4NTJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDY5OS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQ0OS4xN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0MzIuNzdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDc4NS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nyxcblx0XHRcdFx0XHQ0MjIuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDYsXG5cdFx0XHRcdFx0MzA1LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ4LFxuXHRcdFx0XHRcdDMwNS4zXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQxMzg4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQxMzI2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MCxcblx0XHRcdFx0XHQzOC41NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0MTYuNzdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcsXG5cdFx0XHRcdFx0MTM5Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUzLFxuXHRcdFx0XHRcdDExOS4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ4LFxuXHRcdFx0XHRcdDQyLjg1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2LFxuXHRcdFx0XHRcdDQyLjg1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ4LFxuXHRcdFx0XHRcdDE2OS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Mixcblx0XHRcdFx0XHQ5Ny45OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0NjIuNDhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDM1LjIxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ5LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDE0Ny45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQ2Mi42OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0OSxcblx0XHRcdFx0XHQyLjk3MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTIsXG5cdFx0XHRcdFx0MC4wNjMzXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMCxcblx0XHRcdFx0XHQ3Ni40NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTEsXG5cdFx0XHRcdFx0NjcuMThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEyLFxuXHRcdFx0XHRcdDE0LjYxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ5LFxuXHRcdFx0XHRcdDEzLjE3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQyMjYuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTIsXG5cdFx0XHRcdFx0MzguNDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDE4LjcyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMyxcblx0XHRcdFx0XHQ1LjAzN1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTQsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzEsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTUsXG5cdFx0XHRcdFx0NTcuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzEsXG5cdFx0XHRcdFx0MTMuMDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDkuMTg3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNCxcblx0XHRcdFx0XHQ3Ljk0NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTQsXG5cdFx0XHRcdFx0MjIuMjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEzLFxuXHRcdFx0XHRcdDE3LjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNSxcblx0XHRcdFx0XHQxNi44NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0MTYuMTNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEzLFxuXHRcdFx0XHRcdDE4My45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNCxcblx0XHRcdFx0XHQxMTYuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzEsXG5cdFx0XHRcdFx0NS4xNjZcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEzLFxuXHRcdFx0XHRcdDQyLjgzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHQyNC4yM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTQsXG5cdFx0XHRcdFx0MTEuNzhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE1LFxuXHRcdFx0XHRcdDcuMjM5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHQ1Ni4yMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTMsXG5cdFx0XHRcdFx0NDkuMDJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDExLFxuXHRcdFx0XHRcdDguODY2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNCxcblx0XHRcdFx0XHQ4LjMxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHQxNTQuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTMsXG5cdFx0XHRcdFx0MzIuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTEsXG5cdFx0XHRcdFx0MTQuNzRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE0LFxuXHRcdFx0XHRcdDYuMjQyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMyxcblx0XHRcdFx0XHQxNTEuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTIsXG5cdFx0XHRcdFx0NzYuMDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE0LFxuXHRcdFx0XHRcdDMuMjU5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMyxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Mixcblx0XHRcdFx0XHQyNi45NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzMsXG5cdFx0XHRcdFx0MTcuMjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDEyLjg2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNSxcblx0XHRcdFx0XHQxMS42MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzIsXG5cdFx0XHRcdFx0NjcuNDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcxLFxuXHRcdFx0XHRcdDU2LjQ1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNCxcblx0XHRcdFx0XHQ3LjY3MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzMsXG5cdFx0XHRcdFx0MS44OTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcyLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDczLFxuXHRcdFx0XHRcdDExOC44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Mixcblx0XHRcdFx0XHQ0My43NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzQsXG5cdFx0XHRcdFx0NS4yOTZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDQuNjg1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ4LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDY2Ny45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQ0NDIuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0OTUuMTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDgzLjYxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQxNzYuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0MTM5LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDQ4LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDQzLjU3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQyMzMuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0ODIuMDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDc0LjMzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQzMi4yNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0NzM4Ljhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDE0MC45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQxMzFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDUxLjkyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQzNDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDE2OS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQxMDEuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0NTMuNjlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDE0Nzdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDQxMy45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQyMDIuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0ODQuMjNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDYzMS4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQyNDIuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0MTA5LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDgyLjQ0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQyMDYuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0MTA5Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY4LFxuXHRcdFx0XHRcdDYwLjA1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQ0Ny43MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0MTU2NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0MjAyLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDE1MC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQ3MC42NFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0MzY1LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDEwMy42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQ4Mi45MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0NDUuMTFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDI3NTVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDMxNC4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQyNTRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDg0LjMxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQ1MjUuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0MTUwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQxMjguN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0NTMuODRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDczMy44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQxMjkuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0OTQuMTJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDQ1LjI1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQ0MDU1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQyMzAuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0MTU0LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDYxLjI2XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQ1MDIuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0MTU3LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDc4LjI5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNSxcblx0XHRcdFx0XHQ0NS4xNVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0MTM1N1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0MjkwLjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDE0OC4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOSxcblx0XHRcdFx0XHQ2Mi4xMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTYsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0MjIwOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0NjM3Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDEyNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0NzYuMDhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDM3NDFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDI1OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0MjA0LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDc4LjUyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQ0MTYwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OSxcblx0XHRcdFx0XHQ0Njhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDU1MzJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY3LFxuXHRcdFx0XHRcdDMxMy4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQyNDEuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0NjIuOTlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY4LFxuXHRcdFx0XHRcdDYzNjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDM5MS45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQxODcuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0ODguMjlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY4LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDg5LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE3LFxuXHRcdFx0XHRcdDY4LjAzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQzNS41NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTYsXG5cdFx0XHRcdFx0MzAuODhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE3LFxuXHRcdFx0XHRcdDE2NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0MTA5LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDc2LjY1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQ2MS44NFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0NjYxLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDE0Mi45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMCxcblx0XHRcdFx0XHQ3OC4zNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0MzAuNTVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI5LFxuXHRcdFx0XHRcdDcxMy4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQxNDAuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0MTI2LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDIzLjQyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQxNDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY4LFxuXHRcdFx0XHRcdDYwLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDU5LjI1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNyxcblx0XHRcdFx0XHQzNy41MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzAsXG5cdFx0XHRcdFx0NjUuMTdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMzLFxuXHRcdFx0XHRcdDQ0Ljc5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQ0NC40MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjgsXG5cdFx0XHRcdFx0MjkuNjVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDEwOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0NTcuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0NDguMjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDMzLjUxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQxNDIuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0NjUuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0NTkuMDdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDMwLjM5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQxOTMuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0NjMuOTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY3LFxuXHRcdFx0XHRcdDUwLjEzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQyNy41NFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTUsXG5cdFx0XHRcdFx0MjEwLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDEzOS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNixcblx0XHRcdFx0XHQ4OC4xM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0NzcuMDdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDI2OS4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQxNTIuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0NjQuNDlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDU1LjcyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNixcblx0XHRcdFx0XHQxMzYuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0MTMxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOSxcblx0XHRcdFx0XHQxNC40NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0NS42MTdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMzLFxuXHRcdFx0XHRcdDE1MS44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQ2OC4zMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0MzkuNjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMwLFxuXHRcdFx0XHRcdDMzLjkyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMyxcblx0XHRcdFx0XHQ1MDMuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0NDcuMTNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDM5LjYxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQzOS42MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTgsXG5cdFx0XHRcdFx0MTU4LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDE1OC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMyxcblx0XHRcdFx0XHQxNC4yOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0My4wNjJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDEwMC42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNyxcblx0XHRcdFx0XHQ5MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0MTguNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE4LFxuXHRcdFx0XHRcdDE3LjRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDQxLjc3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNyxcblx0XHRcdFx0XHQyNi44NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTUsXG5cdFx0XHRcdFx0OS4wNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjksXG5cdFx0XHRcdFx0Ny42NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0MjkuMTZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE4LFxuXHRcdFx0XHRcdDIxLjQ2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNixcblx0XHRcdFx0XHQxMS42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NCxcblx0XHRcdFx0XHQ3LjAwNVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0MTM3LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE4LFxuXHRcdFx0XHRcdDgwLjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDE1LjcyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNixcblx0XHRcdFx0XHQxMy40MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0MTYuMDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIxLFxuXHRcdFx0XHRcdDE2LjA0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMixcblx0XHRcdFx0XHQxMi42OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTgsXG5cdFx0XHRcdFx0MTIuNjhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDM0Ljc5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOCxcblx0XHRcdFx0XHQzNC43OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjEsXG5cdFx0XHRcdFx0MjEuNzFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE3LFxuXHRcdFx0XHRcdDIxLjcxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NCxcblx0XHRcdFx0XHQzMi4wN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzUsXG5cdFx0XHRcdFx0MjAuOTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE3LFxuXHRcdFx0XHRcdDUuNDkzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nixcblx0XHRcdFx0XHQ1LjE3M1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzMsXG5cdFx0XHRcdFx0MTkuMjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc0LFxuXHRcdFx0XHRcdDkuMjM1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNixcblx0XHRcdFx0XHQ4LjQ4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Mixcblx0XHRcdFx0XHQ3LjA0OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzUsXG5cdFx0XHRcdFx0MzUuNzdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc2LFxuXHRcdFx0XHRcdDguNjg3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NCxcblx0XHRcdFx0XHQ4LjY4N1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTcsXG5cdFx0XHRcdFx0My4yMzhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDczLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDczLFxuXHRcdFx0XHRcdDUwLjE5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NCxcblx0XHRcdFx0XHQ0Ni4yNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzUsXG5cdFx0XHRcdFx0NC45NDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcyLFxuXHRcdFx0XHRcdDMuMTU4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3NCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQ2NS40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTUsXG5cdFx0XHRcdFx0MzMuNjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDMwLjExXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQyNC44N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0NDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI4LFxuXHRcdFx0XHRcdDI2LjkxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQyNC44OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0MTQuODVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMxLFxuXHRcdFx0XHRcdDM0LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDI0LjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOSxcblx0XHRcdFx0XHQyMy42M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjksXG5cdFx0XHRcdFx0MTkuODhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDE5LjE3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzMSxcblx0XHRcdFx0XHQxNi41MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzgsXG5cdFx0XHRcdFx0MTMuNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDEzLjM5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQxMC41NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0MTAuMjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDkuNzEzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQ5LjE1M1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTEsXG5cdFx0XHRcdFx0MTUuNDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEwLFxuXHRcdFx0XHRcdDE1LjE4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MCxcblx0XHRcdFx0XHQ3LjgzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHQ2Ljk1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQyOC4zNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTAsXG5cdFx0XHRcdFx0MjUuNzNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEyLFxuXHRcdFx0XHRcdDExLjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUwLFxuXHRcdFx0XHRcdDkuMTkxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3MCxcblx0XHRcdFx0XHQyMC45MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0MTMuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzEsXG5cdFx0XHRcdFx0MTIuOTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY5LFxuXHRcdFx0XHRcdDguMTcyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMSxcblx0XHRcdFx0XHQxMi45MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzAsXG5cdFx0XHRcdFx0MTAuMjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEyLFxuXHRcdFx0XHRcdDguOTc0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQ3LjEyNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTEsXG5cdFx0XHRcdFx0MjQuOTZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEyLFxuXHRcdFx0XHRcdDE2LjQ2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMCxcblx0XHRcdFx0XHQ4LjE2MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTMsXG5cdFx0XHRcdFx0OC4wMzNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDExLFxuXHRcdFx0XHRcdDUwLjM4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHQzMC4xMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTAsXG5cdFx0XHRcdFx0OS4xNTNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEzLFxuXHRcdFx0XHRcdDcuNzY4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOCxcblx0XHRcdFx0XHQxODA1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQ1NzRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDcwLFxuXHRcdFx0XHRcdDE0Ny43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOSxcblx0XHRcdFx0XHQ3Ni42N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzksXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDAsXG5cdFx0XHRcdFx0MjQ1LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM5LFxuXHRcdFx0XHRcdDEzOC4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzOCxcblx0XHRcdFx0XHQzNy45NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0MzEuOTNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDYzNy40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1OCxcblx0XHRcdFx0XHQ0MTIuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MjY2LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDE3NC41XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxNyxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQxMTEwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOSxcblx0XHRcdFx0XHQxNTAuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0OTEuNjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE2LFxuXHRcdFx0XHRcdDQwLjQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nyxcblx0XHRcdFx0XHQ2MTM0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyOSxcblx0XHRcdFx0XHQyMjkuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjgsXG5cdFx0XHRcdFx0MTk0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2OCxcblx0XHRcdFx0XHQ2Ni44OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjcsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0Mzc3Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUxLFxuXHRcdFx0XHRcdDM3MFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTAsXG5cdFx0XHRcdFx0MjgzLjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDEyMC45XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDE1ODdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDgxNy40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1MSxcblx0XHRcdFx0XHQxNDAuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTcsXG5cdFx0XHRcdFx0MTE3LjVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDQ1Nzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUyLFxuXHRcdFx0XHRcdDM2MS40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nyxcblx0XHRcdFx0XHQ4Ni43OVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTEsXG5cdFx0XHRcdFx0My45NzZcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUzLFxuXHRcdFx0XHRcdDEyNTZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU3LFxuXHRcdFx0XHRcdDY3My4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Mixcblx0XHRcdFx0XHQxMjQuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTQsXG5cdFx0XHRcdFx0MTI0LjFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU3LFxuXHRcdFx0XHRcdDQ0OTBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUzLFxuXHRcdFx0XHRcdDMxMy4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ3NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTgsXG5cdFx0XHRcdFx0NzVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU4LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU3LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDE4My45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQxNTguNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0NTEuNThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM0LFxuXHRcdFx0XHRcdDQzLjMxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Mixcblx0XHRcdFx0XHQ1NTcuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0MTUwLjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQzLFxuXHRcdFx0XHRcdDY0LjQ2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQ1Ni4zM1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzMsXG5cdFx0XHRcdFx0NjUwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQ4Mi4yMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MjguODZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDI1Ljc3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQ0NjQuOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MTYwLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMzLFxuXHRcdFx0XHRcdDM1Ljc5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Mixcblx0XHRcdFx0XHQzNC40N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MTE5LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMzLFxuXHRcdFx0XHRcdDg0LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDUxLjE3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQ0Mi42OFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0NzU5LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYyLFxuXHRcdFx0XHRcdDExNS42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQ4OC40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0NTYuMjVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDExOC45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQ5OC45NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0NTMuMDhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM3LFxuXHRcdFx0XHRcdDQxLjM2XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQxMTkuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0ODIuNjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDY0LjQxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Mixcblx0XHRcdFx0XHQ0Mi45N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0MjQ2LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDE0My45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQxMTUuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0NTcuNDRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQyLFxuXHRcdFx0XHRcdDgzOS40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQ0NTEuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDMsXG5cdFx0XHRcdFx0MjIzLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ3LFxuXHRcdFx0XHRcdDQ5LjE0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQ5MDUuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDIsXG5cdFx0XHRcdFx0MTQzLjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ2LFxuXHRcdFx0XHRcdDYzLjIxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Myxcblx0XHRcdFx0XHQ2Mi43NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MzMyLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDE4Ni41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQ1OS44NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0MzAuMTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDgyLjg1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQ1NS41M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0NTAuMDdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDM5LjkxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQ1MC40M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0MzAuNTRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM0LFxuXHRcdFx0XHRcdDI1LjgyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQyNC43NlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0MzM5LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDEzMC4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNCxcblx0XHRcdFx0XHQ0MC40N1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0MTcuMTRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDQ1LjMxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQzMS4wMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MjMuMDFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDIyLjI0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0LFxuXHRcdFx0XHRcdDIwLjc3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQxNC40NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0MTIuNjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0MTEuNjVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDQ2LjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQyNC4wM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0MjIuNjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDE4LjU1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQxNy4wMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0MTYuNTJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0MTAuNDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDguODlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDcwLjE0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQ1Ny4xOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0NTQuNTZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDQ0LjAzXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQxNjcuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0NTIuOThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDM5Ljk1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQzNC4zNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0ODQuMDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDc5Ljg0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NSxcblx0XHRcdFx0XHQyNC42MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MTkuODdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDM2LjA2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQyMy44M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0MTMuOTJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM0LFxuXHRcdFx0XHRcdDEzLjE3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQyODAuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0MTMxLjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDU0LjIyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQyNy4zMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NCxcblx0XHRcdFx0XHQzOS40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQxOS43NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MTcuNDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUsXG5cdFx0XHRcdFx0MTIuMDhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDYxLjA5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQyNS4zOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NSxcblx0XHRcdFx0XHQyMS4xN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NCxcblx0XHRcdFx0XHQxOC4xOFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MzI0Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDY5LjQ1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQzMS4xNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0MzAuMDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0MTYyLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0MjUuMDJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUsXG5cdFx0XHRcdFx0MjQuODlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDEyLjk3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1LFxuXHRcdFx0XHRcdDg2LjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQ0Ny45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQ0Ny40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTQsXG5cdFx0XHRcdFx0MjMuMzRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDE0OS41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQxNDYuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTQsXG5cdFx0XHRcdFx0MzcuNzJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU2LFxuXHRcdFx0XHRcdDIzLjAzXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQzMDkuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0MTE0Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDg0Ljc2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQ0MS44XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQyMTAuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0MTk0LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYxLFxuXHRcdFx0XHRcdDcxLjU0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQ1OC4wNFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0NjM0LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDc0LjAyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQ2NS42NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0NTguNDVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDM4NjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYxLFxuXHRcdFx0XHRcdDY3LjgzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQ2Mi41MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0NDUuMDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU0LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU0LFxuXHRcdFx0XHRcdDQzOC4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQxODEuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTYsXG5cdFx0XHRcdFx0NjYuMTdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUzLFxuXHRcdFx0XHRcdDYzLjg3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQ3OTE3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NSxcblx0XHRcdFx0XHQ2MS45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQxOC43M1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0NTcxLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDI2OS41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NCxcblx0XHRcdFx0XHQ1Ny4wMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTYsXG5cdFx0XHRcdFx0NDkuMjdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDE0OThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU0LFxuXHRcdFx0XHRcdDI2Mi4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQyNTEuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MjI1LjJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDE1NjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYxLFxuXHRcdFx0XHRcdDU2My42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQ1NjIuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDcsXG5cdFx0XHRcdFx0MTMzLjRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDY4Mzdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDkwLjMxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ2NC4yMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0NTQuNTFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDEyOTBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDEwNi40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ0OC40OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0NDMuMjlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDUwODBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDEyMC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQxMDIuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTQsXG5cdFx0XHRcdFx0NTkuMjlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDQ4OC45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MSxcblx0XHRcdFx0XHQxNTcuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0MjIuMDdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDE2LjEyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQzNzYuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0MTQzLjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDM5LjQ0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQxMC44MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0NDY4OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0ODUuODRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDcyLjY1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ1MC42MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0MTc5NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDUsXG5cdFx0XHRcdFx0NDc3LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ2LFxuXHRcdFx0XHRcdDIyOC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2MCxcblx0XHRcdFx0XHQxNDAuM1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjEsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0NDI3LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ1LFxuXHRcdFx0XHRcdDk1LjIyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQ3Ni45NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDYsXG5cdFx0XHRcdFx0MzEuNjdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ2LFxuXHRcdFx0XHRcdDM1OC40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NSxcblx0XHRcdFx0XHQyMzcuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0MjM0LjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDExMi44XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0Nixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQ4NTJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDY5OS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNCxcblx0XHRcdFx0XHQ0OS4xN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzcsXG5cdFx0XHRcdFx0MzIuNzdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDEzODhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM2LFxuXHRcdFx0XHRcdDEzMjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM0LFxuXHRcdFx0XHRcdDM4LjU1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNyxcblx0XHRcdFx0XHQxNi43N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Nixcblx0XHRcdFx0XHQxNjkuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTQsXG5cdFx0XHRcdFx0OTcuOTlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDYyLjQ4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQzNS4yMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0NzYuNDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0NjcuMThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIsXG5cdFx0XHRcdFx0MTQuNjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUsXG5cdFx0XHRcdFx0MTMuMTdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0MTQ3Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0NjIuNjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDUsXG5cdFx0XHRcdFx0Mi45NzJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIsXG5cdFx0XHRcdFx0MC4wNjMzXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0MjI2LjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIsXG5cdFx0XHRcdFx0MzguNDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0MTguNzJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEsXG5cdFx0XHRcdFx0NS4wMzdcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDAsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTksXG5cdFx0XHRcdFx0NTcuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzksXG5cdFx0XHRcdFx0MTMuMDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDkuMTg3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdDcuOTQ1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3OSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdDIyLjI1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxLFxuXHRcdFx0XHRcdDE3LjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOSxcblx0XHRcdFx0XHQxNi44NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MTYuMTNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEsXG5cdFx0XHRcdFx0MTgzLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDAsXG5cdFx0XHRcdFx0MTE2LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc5LFxuXHRcdFx0XHRcdDUuMTY2XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxLFxuXHRcdFx0XHRcdDQyLjgzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyLFxuXHRcdFx0XHRcdDI0LjIzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdDExLjc4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOSxcblx0XHRcdFx0XHQ3LjIzOVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Mixcblx0XHRcdFx0XHQ1Ni4yMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MSxcblx0XHRcdFx0XHQ0OS4wMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQ4Ljg2NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MCxcblx0XHRcdFx0XHQ4LjMxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxLFxuXHRcdFx0XHRcdDE1MS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyLFxuXHRcdFx0XHRcdDc2LjAzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdDMuMjU5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyLFxuXHRcdFx0XHRcdDE1NC4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxLFxuXHRcdFx0XHRcdDMyLjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0MTQuNzRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDAsXG5cdFx0XHRcdFx0Ni4yNDJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDEsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Mixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3OCxcblx0XHRcdFx0XHQyNi45NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzcsXG5cdFx0XHRcdFx0MTcuMjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDEyLjg2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOSxcblx0XHRcdFx0XHQxMS42MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzgsXG5cdFx0XHRcdFx0NjcuNDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc5LFxuXHRcdFx0XHRcdDU2LjQ1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdDcuNjcyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nyxcblx0XHRcdFx0XHQxLjg5MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzgsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzcsXG5cdFx0XHRcdFx0MTE4Ljhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc4LFxuXHRcdFx0XHRcdDQzLjc2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nixcblx0XHRcdFx0XHQ1LjI5NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjAsXG5cdFx0XHRcdFx0NC42ODVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0NjY3Ljlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDQ0Mi42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQ5NS4xMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0ODMuNjFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDIzMy4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQ4Mi4wM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0NzQuMzNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDMyLjI0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQxNzYuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0MTM5LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDQ4LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI0LFxuXHRcdFx0XHRcdDQzLjU3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQ3MzguOFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MTQwLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDEzMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0NTEuOTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDM0M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0MTY5LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDEwMS41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQ1My42OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0NjMxLjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDI0Mi4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQxMDkuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0ODIuNDRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDE0Nzdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDQxMy45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQyMDIuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0ODQuMjNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDIwNi4yXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQxMDkuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0NjAuMDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDQ3LjcxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQxNTY2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQyMDIuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MTUwLjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDcwLjY0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQzNjUuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MTAzLjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDgyLjkxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQ0NS4xMVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0Mjc1NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MzE0LjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDI1NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0ODQuMzFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDczMy44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQxMjkuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjMsXG5cdFx0XHRcdFx0OTQuMTJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDQ1LjI1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQ1MjUuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MTUwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQxMjguN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0NTMuODRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDQwNTVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDIzMC45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQxNTQuMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0NjEuMjZcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDUwMi43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQxNTcuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0NzguMjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE5LFxuXHRcdFx0XHRcdDQ1LjE1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQxMzU3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQyOTAuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MTQ4LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI0LFxuXHRcdFx0XHRcdDYyLjExXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMCxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQyMjA4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQ2MzcuN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MTI2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQ3Ni4wOFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0Mzc0MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQyMDQuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0NzguNTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDQxNjBcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY1LFxuXHRcdFx0XHRcdDQ2OFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0NTUzMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjMsXG5cdFx0XHRcdFx0MzEzLjJcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDI0MS43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQ2Mi45OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0NjM2NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0MzkxLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI1LFxuXHRcdFx0XHRcdDE4Ny44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQ4OC4yOVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0ODkuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjEsXG5cdFx0XHRcdFx0NjguMDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDM1LjU0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMCxcblx0XHRcdFx0XHQzMC44OFxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0NzEzLjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDE0MC4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQxMjYuM1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0MjMuNDJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDY2MS45XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQxNDIuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0NzguMzZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDMwLjU1XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMSxcblx0XHRcdFx0XHQxNjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY0LFxuXHRcdFx0XHRcdDEwOS4xXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQ3Ni42NVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjIsXG5cdFx0XHRcdFx0NjEuODRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDE0NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjQsXG5cdFx0XHRcdFx0NjAuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0NTkuMjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIxLFxuXHRcdFx0XHRcdDM3LjUyXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNSxcblx0XHRcdFx0XHQ2NS4xN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzMsXG5cdFx0XHRcdFx0NDQuNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDQ0LjQyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQyOS42NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjYsXG5cdFx0XHRcdFx0MTA4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQ1Ny44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQ0OC4yMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MzMuNTFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDE0Mi42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQ2NS44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQ1OS4wN1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MzAuMzlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDE5My44XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Nixcblx0XHRcdFx0XHQ2My45MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjMsXG5cdFx0XHRcdFx0NTAuMTNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDI3LjU0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxOSxcblx0XHRcdFx0XHQyMTAuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MTM5Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDg4LjEzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQ3Ny4wN1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjAsXG5cdFx0XHRcdFx0MTM2LjNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIxLFxuXHRcdFx0XHRcdDEzMVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0MTQuNDZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDYzLFxuXHRcdFx0XHRcdDUuNjE3XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMCxcblx0XHRcdFx0XHQyNjkuMlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjMsXG5cdFx0XHRcdFx0MTUyLjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI0LFxuXHRcdFx0XHRcdDY0LjQ5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQ1NS43MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzMsXG5cdFx0XHRcdFx0MTUxLjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDY4LjMyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0MSxcblx0XHRcdFx0XHQzOS42OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjUsXG5cdFx0XHRcdFx0MzMuOTJcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE5LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDEwMC42XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMSxcblx0XHRcdFx0XHQ5MlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0MTguNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDE3LjRcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIxLFxuXHRcdFx0XHRcdDI5LjE2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMixcblx0XHRcdFx0XHQyMS40NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjAsXG5cdFx0XHRcdFx0MTEuNlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzYsXG5cdFx0XHRcdFx0Ny4wMDVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDQxLjc3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMSxcblx0XHRcdFx0XHQyNi44NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTksXG5cdFx0XHRcdFx0OS4wNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjQsXG5cdFx0XHRcdFx0Ny42NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjEsXG5cdFx0XHRcdFx0MTM3LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIyLFxuXHRcdFx0XHRcdDgwLjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDE4LFxuXHRcdFx0XHRcdDE1LjcyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMCxcblx0XHRcdFx0XHQxMy40MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzYsXG5cdFx0XHRcdFx0MzIuMDdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc1LFxuXHRcdFx0XHRcdDIwLjk5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMSxcblx0XHRcdFx0XHQ1LjQ5M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzQsXG5cdFx0XHRcdFx0NS4xNzNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc3LFxuXHRcdFx0XHRcdDE5LjIyXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nixcblx0XHRcdFx0XHQ5LjIzNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjAsXG5cdFx0XHRcdFx0OC40OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzgsXG5cdFx0XHRcdFx0Ny4wNDlcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc3LFxuXHRcdFx0XHRcdDFcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc3LFxuXHRcdFx0XHRcdDUwLjE5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nixcblx0XHRcdFx0XHQ0Ni4yNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NzUsXG5cdFx0XHRcdFx0NC45NDNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDc4LFxuXHRcdFx0XHRcdDMuMTU4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ3Nixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQ2NS40NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MTksXG5cdFx0XHRcdFx0MzMuNjZcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDMwLjExXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQyNC44N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0NDVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDI2LjkxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQyNC44OFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MTQuODVcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDM0LjFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDI0LjU5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNSxcblx0XHRcdFx0XHQyMy42M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjUsXG5cdFx0XHRcdFx0MTkuODhcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDE5LjE3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNixcblx0XHRcdFx0XHQxNi41MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzYsXG5cdFx0XHRcdFx0MTMuNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDEzLjM5XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQxMC41NFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0MTAuMjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0OS43MTNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0OS4xNTNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDMsXG5cdFx0XHRcdFx0MTUuNDRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQsXG5cdFx0XHRcdFx0MTUuMThcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDQ0LFxuXHRcdFx0XHRcdDcuODNcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIsXG5cdFx0XHRcdFx0Ni45NVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQyOC4zNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NCxcblx0XHRcdFx0XHQyNS43M1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Mixcblx0XHRcdFx0XHQxMS41XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0NCxcblx0XHRcdFx0XHQ5LjE5MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MjAuOTFcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDEzLjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDI2LFxuXHRcdFx0XHRcdDEyLjkxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NSxcblx0XHRcdFx0XHQ4LjE3MlxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0Myxcblx0XHRcdFx0XHQxMi45MVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjYsXG5cdFx0XHRcdFx0MTAuMjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIsXG5cdFx0XHRcdFx0OC45NzRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIzLFxuXHRcdFx0XHRcdDcuMTI0XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzLFxuXHRcdFx0XHRcdDI0Ljk2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyLFxuXHRcdFx0XHRcdDE2LjQ2XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0LFxuXHRcdFx0XHRcdDguMTYxXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxLFxuXHRcdFx0XHRcdDguMDMzXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzLFxuXHRcdFx0XHRcdDUwLjM4XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyLFxuXHRcdFx0XHRcdDMwLjExXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ0LFxuXHRcdFx0XHRcdDkuMTUzXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQxLFxuXHRcdFx0XHRcdDcuNzY4XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMyxcblx0XHRcdFx0XHQxODA1XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQ1NzRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDY2LFxuXHRcdFx0XHRcdDE0Ny43XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQ3Ni42N1xuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzUsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MzQsXG5cdFx0XHRcdFx0MjQ1LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDM1LFxuXHRcdFx0XHRcdDEzOC4zXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQzNixcblx0XHRcdFx0XHQzNy45NlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDEsXG5cdFx0XHRcdFx0MzEuOTNcblx0XHRcdFx0XVxuXHRcdFx0XSxcblx0XHRcdFtcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDYzNy40XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ0MTIuOVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MjY2LjRcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU0LFxuXHRcdFx0XHRcdDE3NC41XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyMSxcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQxMTEwXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQxNTAuNVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0OTEuNjhcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDIwLFxuXHRcdFx0XHRcdDQwLjQxXG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2Myxcblx0XHRcdFx0XHQ2MTM0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQyNCxcblx0XHRcdFx0XHQyMjkuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0MjMsXG5cdFx0XHRcdFx0MTk0XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ2NCxcblx0XHRcdFx0XHQ2Ni44OVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NjMsXG5cdFx0XHRcdFx0MVxuXHRcdFx0XHRdXG5cdFx0XHRdLFxuXHRcdFx0W1xuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTYsXG5cdFx0XHRcdFx0Mzc3Ljdcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDM3MFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NDQsXG5cdFx0XHRcdFx0MjgzLjVcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU0LFxuXHRcdFx0XHRcdDEyMC45XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NCxcblx0XHRcdFx0XHQxNTg3XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ4MTcuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTUsXG5cdFx0XHRcdFx0MTQwLjlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU3LFxuXHRcdFx0XHRcdDExNy41XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQ0NTc5XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1NCxcblx0XHRcdFx0XHQzNjEuNFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0NTcsXG5cdFx0XHRcdFx0ODYuNzlcblx0XHRcdFx0XSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdDU1LFxuXHRcdFx0XHRcdDMuOTc2XG5cdFx0XHRcdF1cblx0XHRcdF0sXG5cdFx0XHRbXG5cdFx0XHRcdFtcblx0XHRcdFx0XHQ1Nixcblx0XHRcdFx0XHQxXG5cdFx0XHRcdF1cblx0XHRcdF1cblx0XHRdXG5cdH0sXG5cdFwicmlnaHRFeWVcIjoge1xuXHRcdFwiaW5kZXhcIjogW1xuXHRcdFx0MjkzLFxuXHRcdFx0Mjg2LFxuXHRcdFx0MjgzLFxuXHRcdFx0Mjg4LFxuXHRcdFx0Mjg5LFxuXHRcdFx0MzMwLFxuXHRcdFx0Mjg1LFxuXHRcdFx0MjkwLFxuXHRcdFx0MjgzLFxuXHRcdFx0Mjg5LFxuXHRcdFx0MzM3LFxuXHRcdFx0MzMwLFxuXHRcdFx0Mjg3LFxuXHRcdFx0MjkyLFxuXHRcdFx0MzM3LFxuXHRcdFx0Mjg3LFxuXHRcdFx0Mjg2LFxuXHRcdFx0MjkzLFxuXHRcdFx0Mjg2LFxuXHRcdFx0Mjg1LFxuXHRcdFx0MjgzLFxuXHRcdFx0Mjg5LFxuXHRcdFx0Mjg3LFxuXHRcdFx0MzM3LFxuXHRcdFx0MjkyLFxuXHRcdFx0Mjg3LFxuXHRcdFx0MjkzXG5cdFx0XVxuXHR9LFxuXHRcImxlZnRFeWVcIjoge1xuXHRcdFwiaW5kZXhcIjogW1xuXHRcdFx0MTc1LFxuXHRcdFx0MTE5LFxuXHRcdFx0MTIxLFxuXHRcdFx0MTI1LFxuXHRcdFx0MTE5LFxuXHRcdFx0MTI2LFxuXHRcdFx0MTE1LFxuXHRcdFx0MTE3LFxuXHRcdFx0MTI1LFxuXHRcdFx0MTY4LFxuXHRcdFx0MTIxLFxuXHRcdFx0MTIwLFxuXHRcdFx0MTE1LFxuXHRcdFx0MTIyLFxuXHRcdFx0MTE4LFxuXHRcdFx0MTY4LFxuXHRcdFx0MTc1LFxuXHRcdFx0MTIxLFxuXHRcdFx0MTc1LFxuXHRcdFx0MTI2LFxuXHRcdFx0MTE5LFxuXHRcdFx0MTI1LFxuXHRcdFx0MTE3LFxuXHRcdFx0MTE5LFxuXHRcdFx0MTE1LFxuXHRcdFx0MTE4LFxuXHRcdFx0MTE3XG5cdFx0XVxuXHR9LFxuXHRcImJhY2tcIjoge1xuXHRcdFwiaW5kZXhcIjogW1xuXHRcdFx0OTEsXG5cdFx0XHQ5MCxcblx0XHRcdDI1Nyxcblx0XHRcdDI1NCxcblx0XHRcdDg2LFxuXHRcdFx0OTEsXG5cdFx0XHQyNTAsXG5cdFx0XHQ4Myxcblx0XHRcdDgyLFxuXHRcdFx0MTU0LFxuXHRcdFx0OTUsXG5cdFx0XHQ5NCxcblx0XHRcdDk1LFxuXHRcdFx0MTU0LFxuXHRcdFx0MTUzLFxuXHRcdFx0ODMsXG5cdFx0XHQxNTUsXG5cdFx0XHQxNTYsXG5cdFx0XHQyNjIsXG5cdFx0XHQzMTcsXG5cdFx0XHQzMTgsXG5cdFx0XHQzMTcsXG5cdFx0XHQyNjMsXG5cdFx0XHQzMTYsXG5cdFx0XHQzMTgsXG5cdFx0XHQyNTIsXG5cdFx0XHQyNjIsXG5cdFx0XHQ4Nixcblx0XHRcdDI1NCxcblx0XHRcdDI1MCxcblx0XHRcdDkxLFxuXHRcdFx0MjU3LFxuXHRcdFx0MjU5LFxuXHRcdFx0ODAsXG5cdFx0XHQyNDgsXG5cdFx0XHQyNjAsXG5cdFx0XHQ3Nyxcblx0XHRcdDI0NSxcblx0XHRcdDI0Nyxcblx0XHRcdDE3Nyxcblx0XHRcdDI2NSxcblx0XHRcdDI0NCxcblx0XHRcdDc2LFxuXHRcdFx0OTcsXG5cdFx0XHQxNzcsXG5cdFx0XHQyNDUsXG5cdFx0XHQ3Nyxcblx0XHRcdDc2LFxuXHRcdFx0MjQ4LFxuXHRcdFx0ODAsXG5cdFx0XHQ3OCxcblx0XHRcdDI2MCxcblx0XHRcdDkwLFxuXHRcdFx0OTIsXG5cdFx0XHQyNTAsXG5cdFx0XHQ4Mixcblx0XHRcdDg2LFxuXHRcdFx0MTU2LFxuXHRcdFx0MTU0LFxuXHRcdFx0OTQsXG5cdFx0XHQ4Myxcblx0XHRcdDI1Mixcblx0XHRcdDE1NSxcblx0XHRcdDMxNyxcblx0XHRcdDI2Mixcblx0XHRcdDI2Myxcblx0XHRcdDkxLFxuXHRcdFx0MjU5LFxuXHRcdFx0MjU0LFxuXHRcdFx0NzgsXG5cdFx0XHQyNDcsXG5cdFx0XHQyNDgsXG5cdFx0XHQ3Nixcblx0XHRcdDE3Nyxcblx0XHRcdDI0NCxcblx0XHRcdDI0Nyxcblx0XHRcdDc4LFxuXHRcdFx0NzcsXG5cdFx0XHQyNjAsXG5cdFx0XHQyNTcsXG5cdFx0XHQ5MCxcblx0XHRcdDgzLFxuXHRcdFx0MTU2LFxuXHRcdFx0OTQsXG5cdFx0XHQzMTgsXG5cdFx0XHQxNTUsXG5cdFx0XHQyNTIsXG5cdFx0XHQ3Nixcblx0XHRcdDI0NCxcblx0XHRcdDI0NSxcblx0XHRcdDI2MCxcblx0XHRcdDkyLFxuXHRcdFx0ODAsXG5cdFx0XHQ4Myxcblx0XHRcdDI1MCxcblx0XHRcdDI1MlxuXHRcdF1cblx0fVxufTtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL3BjL2RhdGEvZmFjZTIuanNvblxuICoqIG1vZHVsZSBpZCA9IDE0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9