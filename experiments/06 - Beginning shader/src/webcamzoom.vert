#define MIRROR

const float PI = 3.14159265;

uniform float rate;
uniform vec2 center;
uniform float waveForce;
uniform float zoomForce;

varying vec2 vUv;
varying float vRate;

void main() {

  float d = distance(uv, center);
  float area = max((rate - d), 0.0);
  vec2 _uv = uv + (uv - center) * area * zoomForce;

  _uv.x += sin(rate * uv.x * PI * 7.0) * area * waveForce;
  _uv.y += cos(rate * uv.y * PI * 5.0) * area * waveForce;


#ifdef MIRROR
  vUv = vec2(1.0 - _uv.x, _uv.y);
#elif
  vUv = _uv;
#endif

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  vRate = rate;
}