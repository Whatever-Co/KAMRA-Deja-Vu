varying vec4 vPos;
varying vec2 vUv;

void main() {
  vPos = modelMatrix * vec4(position, 1.0);
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
