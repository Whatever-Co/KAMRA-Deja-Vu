// uniform float size;
uniform float scale;
uniform float time;
uniform mat4 faceMatrix;
uniform sampler2D facePosition;
uniform sampler2D faceTexture;
uniform sampler2D faceLUT;

attribute vec3 triangleIndices;
attribute vec3 weight;
attribute float startZ;
attribute float delay;

varying vec4 vColor;
varying vec2 vFaceIndex;
varying float vBlend;

#pragma glslify: range = require(glsl-range)
#pragma glslify: lookup = require(glsl-lut)
#pragma glslify: easeOutSine = require(glsl-easings/sine-out)
#pragma glslify: easeInOutSine = require(glsl-easings/sine-in-out)
// #pragma glslify: easeOutCubic = require(glsl-easings/cubic-out)
// #pragma glslify: easeInOutCubic = require(glsl-easings/cubic-in-out)


float saturate(float value) {
  return clamp(value, 0., 1.);
}


vec3 _getpos(float index) {
  vec2 uv = vec2(
    mod(index, DATA_WIDTH) / DATA_WIDTH,
    floor(index / DATA_HEIGHT) / DATA_HEIGHT
  );
  return texture2D(facePosition, uv).xyz;
}

vec3 getDest() {
  return _getpos(triangleIndices.x) * weight.x + _getpos(triangleIndices.y) * weight.y + _getpos(triangleIndices.z) * weight.z;
}

vec2 _getuv(float index) {
  vec2 uv = vec2(
    mod(index, DATA_WIDTH) / DATA_WIDTH,
    floor(index / DATA_HEIGHT) / DATA_HEIGHT + 0.5
  );
  return texture2D(facePosition, uv).xy;
}

vec2 getUV() {
  return _getuv(triangleIndices.x) * weight.x + _getuv(triangleIndices.y) * weight.y + _getuv(triangleIndices.z) * weight.z;
}


vec2 getFaceIndex(in vec4 textureColor, in sampler2D lookupTable) {
  vec2 index = lookup(textureColor, lookupTable).xy * 16.;
  index.y += 1.0;
  index.x = floor(index.x);
  index.y = floor(index.y);
  index /= 16.0;
  return vec2(index.x, 1.0-index.y);
}


void main() {
  float t = saturate(range(0., 1. - delay * 0.5, time));

  vec4 dest = faceMatrix * vec4(getDest(), 1.);
  vec4 mvPosition = modelViewMatrix * vec4(dest.xy, mix(startZ, dest.z, t), 1.);
  gl_Position = projectionMatrix * mvPosition;

  float t2 = clamp(range(1., 1.1 - delay * 0.07, time), 0., 1.);
  gl_PointSize = mix(40., 0., easeInOutSine(t2)) * (scale / abs(mvPosition.z));

  vColor = texture2D(faceTexture, getUV());
  vColor.a = min(1., gl_PointSize);
  vFaceIndex = getFaceIndex(vColor, faceLUT);
  vBlend = easeOutSine(saturate(range(0.9, 1.05, t))) * 0.4;
}
