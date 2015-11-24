uniform vec2 clipRange;

varying vec4 vPos;

void main() {
  if (vPos.y < clipRange.x || clipRange.y < vPos.y) discard;
  gl_FragColor = vec4(0.3450980392, 0.231372549, 0.2470588235, 1);
}