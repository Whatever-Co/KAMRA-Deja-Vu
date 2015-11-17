precision mediump float;

uniform sampler2D texture;
// hole uniforms
uniform sampler2D holeTexture;
uniform vec3 holeKeyColor;
uniform float holeKeyThreshold;

varying vec2 vUv;
varying float vBrightness;


void main() {
  vec4 c1 = texture2D(texture, vUv);

  if (distance(holeKeyColor, c1.rgb) < holeKeyThreshold) {
    gl_FragColor = texture2D(holeTexture, vUv);
  }
  else {
    gl_FragColor = c1;
  }
  gl_FragColor.a = vBrightness;
}