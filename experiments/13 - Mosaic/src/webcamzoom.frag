precision mediump float;

uniform sampler2D texture;
varying vec2 vUv;
varying float vRate;

void main() {
  gl_FragColor = texture2D(texture, vUv);
  gl_FragColor *= 1.0 - vRate;
}