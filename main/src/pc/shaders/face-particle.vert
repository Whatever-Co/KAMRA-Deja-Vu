// uniform float size;
uniform float scale;
uniform float time;
uniform mat4 faceMatrix;
uniform sampler2D facePosition;
uniform sampler2D faceTexture;
uniform sampler2D faceLUT;

attribute vec3 triangleIndices;
attribute vec3 weight;
attribute float delay;

varying vec4 vColor;
varying vec2 vFaceIndex;
varying float vBlend;

#pragma glslify: range = require(glsl-range)
#pragma glslify: easeOutSine = require(glsl-easings/sine-out)
#pragma glslify: easeInOutSine = require(glsl-easings/sine-in-out)
// #pragma glslify: easeOutCubic = require(glsl-easings/cubic-out)
// #pragma glslify: easeInOutCubic = require(glsl-easings/cubic-in-out)


vec3 getp(float index) {
  return texture2D(facePosition, vec2(mod(index, DATA_WIDTH) / DATA_WIDTH, floor(index / DATA_HEIGHT) / DATA_HEIGHT)).xyz;
}

vec3 getDest() {
  return getp(triangleIndices.x) * weight.x + getp(triangleIndices.y) * weight.y + getp(triangleIndices.z) * weight.z;
}

vec2 getu(float index) {
  return texture2D(facePosition, vec2(mod(index, DATA_WIDTH) / DATA_WIDTH, floor(index / DATA_HEIGHT) / DATA_HEIGHT + 0.5)).xy;
}

vec2 getUV() {
  return getu(triangleIndices.x) * weight.x + getu(triangleIndices.y) * weight.y + getu(triangleIndices.z) * weight.z;
}


vec2 getSpriteUVLUT(vec3 c) {
  float x = (c.r + floor(mod(c.b * 16.0, 16.0))) / 16.0;
  float y = c.g;
  vec2 index = texture2D(faceLUT, vec2(x, y)).xy * 16.0;
  // R is index x
  // G is index y
  index.y += 1.0;
  index.x = floor(index.x);
  index.y = floor(index.y);
  index = index / 16.0;
  return vec2(index.x, 1.0 - index.y);
}


float getCurrentSize(float time) {
  if (time < 0.4) {
    float t = clamp(range(0.0, 0.1, time), 0.0, 1.0);
    return mix(0.0, 25.0, easeInOutSine(t));

  } else if (0.97 < time) {
    float t = range(0.97, 1.0, time);
    return mix(25.0, 0.0, easeInOutSine(t));

  // } else if (time < 15.0) {
  //   return 5.0;

  // } else {
    // float t = range(15.0, 17.0, time);
    // return mix(20.0, 0.0, t);
    // return 20.
  }
  return 25.0;
}


void main() {
  vec4 dest = faceMatrix * vec4(getDest(), 1.0);
  vec4 mvPosition = modelViewMatrix * vec4(mix(position, dest.xyz, time), 1.0);
  gl_PointSize = getCurrentSize(time) * (scale / abs(mvPosition.z));
  gl_Position = projectionMatrix * mvPosition;
  vColor = texture2D(faceTexture, getUV());
  vFaceIndex = getSpriteUVLUT(vColor.xyz);
  vBlend = easeOutSine(clamp(range(0.8, 1.0, time), 0.0, 1.0)) * 0.5;
}
