varying vec2 vUv;

uniform float offset;
uniform float amount;

void main() {
  vUv = uv;
  float scale = 1.0 - (cos(clamp(position.y * 10.0 + offset, -3.14, 3.14)) + 1.0) * amount;
  vec3 p = vec3(position.x * scale, position.y, (position.z + 0.3) * scale - 0.3);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
