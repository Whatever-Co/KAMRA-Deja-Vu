uniform vec2 clipRange;
uniform sampler2D map;

varying vec4 vWorldPos;
varying vec2 vUv;

void main() {
  if (vWorldPos.y < clipRange.x || clipRange.y < vWorldPos.y) discard;
  
  vec4 c = texture2D(map, vUv);
  if (!gl_FrontFacing) {
    c = mix(c, vec4(0, 0, 0, 1), 0.6);
  }
  gl_FragColor = c;
}
