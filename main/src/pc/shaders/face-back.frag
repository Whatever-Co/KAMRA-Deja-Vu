uniform vec2 clipRange;

varying vec4 vPos;

void main() {
  if (vPos.y < clipRange.x || clipRange.y < vPos.y) discard;
  gl_FragColor = vec4(0.043137, 0.192157, 0.286275, 1);
}
