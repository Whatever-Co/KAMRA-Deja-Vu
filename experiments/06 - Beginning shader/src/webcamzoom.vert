//#define MIRROR

const float PI = 3.14159265;

uniform float rate;
uniform float frame;
uniform vec2 center;
uniform float waveForce;
uniform float zoomForce;
uniform float edgeAlpha;

varying vec2 vUv;
varying float vBrightness;

#pragma glslify: noise3d = require(glsl-noise/simplex/3d)

vec2 getWiggleUV() {
  float d = distance(uv, center);
  float area = max((rate - d), 0.0);
  // zoom
  vec2 _uv = uv + (uv - center) * area * zoomForce;
  // wiggle
  _uv.x += (noise3d(vec3(uv.x*3.5, uv.y*2.5, frame*0.01))-0.5) * d * waveForce;
  _uv.y += (noise3d(vec3(uv.x*3.1, uv.y+2.3, frame*0.01))-0.5) * d * waveForce;

  return _uv;
}

float invLerp(float min, float max, float n) {
  return clamp((n - min) / (max - min), 0.0, 1.0);
}

float edgeColor() {
  float d = distance(uv, vec2(0.5,0.5));
  float r = invLerp(edgeAlpha, 0.0, d);
  return mix(0.1, 1.0, r);
}

void main() {
  //vec3 _position = _position;
  vec2 _uv = getWiggleUV();
#ifdef MIRROR
  vUv = vec2(1.0 - _uv.x, _uv.y);
#else
  vUv = _uv;
#endif

  vBrightness = (1.0 - rate) * edgeColor();

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}