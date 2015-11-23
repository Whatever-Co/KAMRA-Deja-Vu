uniform vec2 clipRange;

varying vec4 vPos;

void main() {
  if (vPos.y < clipRange.x || clipRange.y < vPos.y) discard;
  gl_FragColor = vec4(0.106, 0.169, 0.204, 1);
}
