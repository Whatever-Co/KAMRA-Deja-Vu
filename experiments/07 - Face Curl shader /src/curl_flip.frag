precision mediump float;

uniform sampler2D texture;
varying vec2 vUv;

void main() {
  vec4 c = texture2D(texture, vUv);
  if (!gl_FrontFacing) {
      c = mix(c, vec4(0, 0, 0, 1), 0.8);
  }
  gl_FragColor = c;
}