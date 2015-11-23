precision mediump float;

uniform sampler2D texture;
uniform sampler2D holeTexture;

varying vec2 vUv;
varying float vBrightness;


void main() {
  vec4 hole = texture2D(holeTexture, vUv);
  if (hole.a > 0.5) {
    gl_FragColor = texture2D(holeTexture, vUv);
  } else {
    gl_FragColor = texture2D(texture, vUv);
  }
  // gl_FragColor = vec4(vec3(hole.a), 1);
  // gl_FragColor.a = vBrightness;
  gl_FragColor.a = 1.0;
}