
uniform sampler2D map;
uniform sampler2D hole;
uniform vec3 keyColor;
uniform float keyThreshold;

varying vec4 vPos;
varying vec2 vUv;
varying vec2 vUv2;

void main() {
  vec4 c1 = texture2D(map, vUv);
  if (c1.a == 0.0) {
    discard;
  }
  // #071520
  // 2.7, 8.2, 12.5
  if (distance(keyColor, c1.rgb) < keyThreshold) {
    gl_FragColor = texture2D(hole, vUv);
  }
  else {
    gl_FragColor = c1;
  }

  gl_FragColor.a = 0.5;
}
