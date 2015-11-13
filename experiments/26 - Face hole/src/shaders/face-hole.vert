
varying vec4 vPos;
varying vec2 vUv;
varying vec2 vUv2;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  vPos = modelMatrix * vec4(position, 1.0);
  vUv = uv;
  vUv2 = (vec2(position.x, position.y) + 1.0) * 0.5;
}