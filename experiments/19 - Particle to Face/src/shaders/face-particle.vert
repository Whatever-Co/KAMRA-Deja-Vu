// uniform float size;
uniform float scale;
uniform float time;
uniform mat4 faceMatrix;
uniform sampler2D facePosition;
uniform sampler2D faceTexture;

attribute vec3 triangleIndices;
attribute vec3 weight;
attribute float delay;

varying vec4 vColor;

#pragma glslify: range = require(glsl-range)
#pragma glslify: easeOutSine = require(glsl-easings/sine-out)
#pragma glslify: easeInOutSine = require(glsl-easings/sine-in-out)
#pragma glslify: easeOutCubic = require(glsl-easings/cubic-out)
#pragma glslify: easeInOutCubic = require(glsl-easings/cubic-in-out)


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


float getCurrentSize(float time) {
  if (time < 5.0) {
    float t = range(0.0, 5.0, time);
    return mix(0.0, 20.0, easeInOutSine(t));

  } else if (time < 12.0) {
    float t = range(5.0, 12.0, time);
    return mix(20.0, 5.0, easeInOutSine(t));

  } else if (time < 15.0) {
    return 5.0;

  } else {
    float t = range(15.0, 17.0, time);
    return mix(5.0, 0.0, t);
  }
  return 0.0;
}


void main() {
  vec4 dest = faceMatrix * vec4(getDest(), 1.0);
  float t = clamp(range(0.0, 13.0, time - delay), 0.0, 1.0);
  vec4 mvPosition = modelViewMatrix * vec4(mix(position, dest.xyz, easeInOutCubic(t)), 1.0);
  gl_PointSize = getCurrentSize(max(0.0, time - delay)) * (scale / abs(mvPosition.z));
  gl_Position = projectionMatrix * mvPosition;
  vColor = texture2D(faceTexture, getUV());
  // vColor.a = clamp(range(17.0, 15.0, time - delay), 0.0, 1.0);
}
