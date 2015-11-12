precision mediump float;

uniform sampler2D texture;
uniform float brightness;

varying vec2 vUv;

void main() {
  gl_FragColor = texture2D(texture, vUv) * brightness;
}