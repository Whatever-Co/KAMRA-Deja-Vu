/**
 * FaceDeformer
 */
export default class FaceDeformer {

  /**
   * Init with weggl canvas
   * @param canvas
   */
  constructor(canvas) {
    this.gl = getWebGLContext(canvas);
    this.first = true;
    this.usegrid = false;
  }

  /**
   *
   * @param element
   * @param points
   * @param pModel
   * @param vertices
   */
  load(element, points, pModel, vertices) {
    let gl = this.gl;
    this.pdmModel = pModel;
    if (vertices) {
      this.verticeMap = vertices;
    } else {
      this.verticeMap = pdmModel.path.vertices;
    }
    this.numTriangles = this.verticeMap.length;

    // get cropping
    let maxx = 0;
    let minx = element.width;
    let maxy = 0;
    let miny = element.height;
    for (var i = 0;i < points.length;i++) {
      if (points[i][0] > maxx) maxx = points[i][0];
      if (points[i][0] < minx) minx = points[i][0];
      if (points[i][1] > maxy) maxy = points[i][1];
      if (points[i][1] < miny) miny = points[i][1];
    }
    this.minx = Math.floor(minx);
    this.maxx = Math.ceil(maxx);
    this.miny = Math.floor(miny);
    this.maxy = Math.ceil(maxy);
    let width = this.width = maxx-minx;
    let height = this.height = maxy-miny;
    let cc;
    if (element.tagName == 'VIDEO' || element.tagName == 'IMG') {
      let ca = document.createElement('canvas');
      ca.width = element.width;
      ca.height = element.height;
      cc = ca.getContext('2d');
      cc.drawImage(element, 0, 0, element.width, element.height);
    } else if (element.tagName == 'CANVAS') {
      cc = element.getContext('2d');
    }
    let image = cc.getImageData(minx, miny, width, height);

    // correct points
    let nupoints = [];
    for (let i = 0;i < points.length;i++) {
      nupoints[i] = [];
      nupoints[i][0] = points[i][0] - minx;
      nupoints[i][1] = points[i][1] - miny;
    }

    // create vertices based on points
    let verticeMap = this.verticeMap;
    let textureVertices = [];
    for (let i = 0;i < verticeMap.length;i++) {
      textureVertices.push(nupoints[verticeMap[i][0]][0]/width);
      textureVertices.push(nupoints[verticeMap[i][0]][1]/height);
      textureVertices.push(nupoints[verticeMap[i][1]][0]/width);
      textureVertices.push(nupoints[verticeMap[i][1]][1]/height);
      textureVertices.push(nupoints[verticeMap[i][2]][0]/width);
      textureVertices.push(nupoints[verticeMap[i][2]][1]/height);
    }

    if(this.first) {
      // create program for drawing grid
      let gridVertexShaderProg = [
        "attribute vec2 a_position;",
        "",
        "uniform vec2 u_resolution;",
        "",
        "void main() {",
        "  vec2 zeroToOne = a_position / u_resolution;",
        "  vec2 zeroToTwo = zeroToOne * 2.0;",
        "  vec2 clipSpace = zeroToTwo - 1.0;",
        "  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);",
        "}"
      ].join('\n');

      let gridFragmentShaderProg = [
        "void main() {",
        "  gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0);",
        "}"
      ].join('\n');

      var gridVertexShader = loadShader(gl, gridVertexShaderProg, gl.VERTEX_SHADER);
      var gridFragmentShader = loadShader(gl, gridFragmentShaderProg, gl.FRAGMENT_SHADER);
      try {
        this.gridProgram = createProgram(gl, [gridVertexShader, gridFragmentShader]);
      } catch(err) {
        alert("There was a problem setting up the webGL programs. Maybe you should try it in another browser. :(");
      }

      this.gridCoordbuffer = gl.createBuffer();

      // create program for drawing deformed face
      var vertexShaderProg = [
        "attribute vec2 a_texCoord;",
        "attribute vec2 a_position;",
        "",
        "varying vec2 v_texCoord;",
        "",
        "uniform vec2 u_resolution;",
        "",
        "void main() {",
        "  vec2 zeroToOne = a_position / u_resolution;",
        "  vec2 zeroToTwo = zeroToOne * 2.0;",
        "  vec2 clipSpace = zeroToTwo - 1.0;",
        "  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);",
        "  ",
        "  v_texCoord = a_texCoord;",
        "}"
      ].join('\n');

      var fragmentShaderProg = [
        "precision mediump float;",
        "",
        "uniform sampler2D u_image;",
        "",
        "varying vec2 v_texCoord;",
        "",
        "void main() {",
        "  gl_FragColor = texture2D(u_image, v_texCoord);",
        "}"
      ].join('\n');

      const vertexShader = loadShader(gl, vertexShaderProg, gl.VERTEX_SHADER);
      const fragmentShader = loadShader(gl, fragmentShaderProg, gl.FRAGMENT_SHADER);
      this.drawProgram = createProgram(gl, [vertexShader, fragmentShader]);

      this.texCoordBuffer = gl.createBuffer();
      this.first = false;
    }

    // load program for drawing grid
    gl.useProgram(this.gridProgram);

    // set the resolution for grid program
    let resolutionLocation = gl.getUniformLocation(this.gridProgram, "u_resolution");
    gl.uniform2f(resolutionLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // load program for drawing deformed face
    gl.useProgram(this.drawProgram);

    // look up where the vertex data needs to go.
    this.texCoordLocation = gl.getAttribLocation(this.drawProgram, "a_texCoord");

    // provide texture coordinates for face vertices (i.e. where we're going to copy face vertices from).
    gl.enableVertexAttribArray(this.texCoordLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureVertices), gl.STATIC_DRAW);

    gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Create the texture.
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // set the resolution for draw program
    resolutionLocation = gl.getUniformLocation(this.drawProgram, "u_resolution");
    gl.uniform2f(resolutionLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  /**
   *
   * @param points
   */
  draw(points) {
    const gl = this.gl;

    if (this.usegrid) {
      // switch program if needed
      gl.useProgram(this.drawProgram);

      gl.enableVertexAttribArray(this.texCoordLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

      this.usegrid = false;
    }

    // create drawvertices based on points
    const verticeMap = this.verticeMap;
    let vertices = [];
    for (var i = 0;i < this.verticeMap.length;i++) {
      vertices.push(points[verticeMap[i][0]][0]);
      vertices.push(points[verticeMap[i][0]][1]);
      vertices.push(points[verticeMap[i][1]][0]);
      vertices.push(points[verticeMap[i][1]][1]);
      vertices.push(points[verticeMap[i][2]][0]);
      vertices.push(points[verticeMap[i][2]][1]);
    }

    const positionLocation = gl.getAttribLocation(this.drawProgram, "a_position");

    // Create a buffer for the position of the vertices.
    let drawPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, drawPosBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Draw the face vertices
    gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles*3);
  }

  /**
   *
   * @param points
   */
  drawGrid(points) {
    const gl = this.gl;

    if (!this.usegrid) {
      gl.useProgram(this.gridProgram);
      this.usegrid = true;
    }

    // create drawvertices based on points
    const verticeMap = this.verticeMap;
    let vertices = [];
    // create new texturegrid
    for (var i = 0;i < verticeMap.length;i++) {
      vertices.push(points[verticeMap[i][0]][0]);
      vertices.push(points[verticeMap[i][0]][1]);
      vertices.push(points[verticeMap[i][1]][0]);
      vertices.push(points[verticeMap[i][1]][1]);

      vertices.push(points[verticeMap[i][1]][0]);
      vertices.push(points[verticeMap[i][1]][1]);
      vertices.push(points[verticeMap[i][2]][0]);
      vertices.push(points[verticeMap[i][2]][1]);

      vertices.push(points[verticeMap[i][2]][0]);
      vertices.push(points[verticeMap[i][2]][1]);
      vertices.push(points[verticeMap[i][0]][0]);
      vertices.push(points[verticeMap[i][0]][1]);
    }

    const positionLocation = gl.getAttribLocation(this.gridProgram, "a_position");

    // Create a buffer for position of the vertices (lines)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridCoordbuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Draw the lines
    gl.drawArrays(gl.LINES, 0, this.numTriangles*6);
  }

  clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  calculatePositions(parameters, useTransforms) {
    let x, y, a, b;
    const numParameters = parameters.length;
    let positions = [];
    for (let i = 0;i < this.pdmModel.patchModel.numPatches;i++) {
      x = this.pdmModel.shapeModel.meanShape[i][0];
      y = this.pdmModel.shapeModel.meanShape[i][1];
      for (var j = 0;j < numParameters-4;j++) {
        x += this.pdmModel.shapeModel.eigenVectors[(i*2)][j]*parameters[j+4];
        y += this.pdmModel.shapeModel.eigenVectors[(i*2)+1][j]*parameters[j+4];
      }
      if (useTransforms) {
        a = parameters[0]*x - parameters[1]*y + parameters[2];
        b = parameters[0]*y + parameters[1]*x + parameters[3];
        x += a;
        y += b;
      }
      positions[i] = [x,y];
    }

    return positions;
  }
}

