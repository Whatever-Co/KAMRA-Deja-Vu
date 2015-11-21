// #define MIRROR

uniform float rate;
uniform float frame;
uniform vec2 faceCenter;
uniform float faceRadius;
uniform float waveForce;

varying vec2 vUv;
varying float vBrightness;

#pragma glslify: noise3d = require(glsl-noise/simplex/3d)


vec2 getWiggleUV() {
  float distanceFromFace = max(0., length((uv - faceCenter) * vec2(16. / 9., 1.)) - faceRadius * 0.5 * (1. - rate));

  // zoom
  vec2 _uv = (uv - faceCenter) * (1. + rate - distanceFromFace * rate) + faceCenter;

  // wiggle
  float force = mix(distanceFromFace * waveForce, waveForce * 2., rate);
  _uv.x += noise3d(vec3(uv.x * 3.5, uv.y * 2.5, frame * 0.01)) * force;
  _uv.y += noise3d(vec3(uv.x * 3.1, uv.y * 2.3, frame * 0.01)) * force;

  return _uv;
}


void main() {
  vec2 _uv = getWiggleUV();
#ifdef MIRROR
  vUv = vec2(1.0 - _uv.x, _uv.y);
#else
  vUv = _uv;
#endif
  vBrightness = (1.0 - rate);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
