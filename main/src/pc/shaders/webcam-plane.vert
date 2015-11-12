//#define MIRROR

const float PI = 3.14159265;

uniform float rate;
uniform float frame;
uniform vec2 center;
uniform float waveForce;
uniform float zoomForce;

varying vec2 vUv;

void main() {

  float d = distance(uv, center);
  float area = max((rate - d), 0.0);
  vec2 _uv = uv + (uv - center) * area * zoomForce;

  _uv.x += sin(frame * uv.x * PI * 0.07) * area * waveForce;
  _uv.y += cos(frame * uv.y * PI * 0.05) * area * waveForce;


#ifdef MIRROR
  vUv = vec2(1.0 - _uv.x, _uv.y);
#else
  vUv = _uv;
#endif

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}