//#define MIRROR

const float PI = 3.14159265;

uniform float rate;
uniform float frame;
uniform vec4 centerRect; // x,y,width,height
uniform float waveForce;
uniform float zoomForce;

varying vec2 vUv;
varying float vBrightness;

#pragma glslify: noise3d = require(glsl-noise/simplex/3d)

float invLerp(float min, float max, float n) {
  return clamp((n - min) / (max - min), 0.0, 1.0);
}

vec2 invLerp(vec2 min, vec2 max, vec2 n) {
  return vec2(invLerp(min.x,max.x,n.x),invLerp(min.y,max.y,n.y));
}

float rectMask(vec2 center) {
  float size = distance(vec2(0, 0), centerRect.zw * 0.5);
  float d = distance(uv, center);

  float fallback = max(d - size, 0.0) * 2.0;
  if (fallback < d) {
    return fallback;
  }
  return d;
}

vec2 getWiggleUV() {
  vec2 center = centerRect.xy + centerRect.zw * 0.5;
  float d = rectMask(center);
  // zoom
  float area = max((rate - d), 0.0);
  vec2 _uv = uv + (uv - center) * area * zoomForce;
  // wiggle
  float force = max(waveForce, rate);
  _uv.x += (noise3d(vec3(uv.x*3.5, uv.y*2.5, frame*0.01))-0.5) * d * force;
  _uv.y += (noise3d(vec3(uv.x*3.1, uv.y+2.3, frame*0.01))-0.5) * d * force;

  return _uv;
}

void main() {
  //vec3 _position = _position;
  vec2 _uv = getWiggleUV();
#ifdef MIRROR
  vUv = vec2(1.0 - _uv.x, _uv.y);
#else
  vUv = _uv;
#endif

  vBrightness = (1.0 - rate);

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}