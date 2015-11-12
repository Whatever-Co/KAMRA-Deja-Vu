precision mediump float;

uniform sampler2D texture;

varying vec2 vUv;
varying float vBrightness;


void main() {
  gl_FragColor = texture2D(texture, vUv);
  gl_FragColor.a = vBrightness;
}