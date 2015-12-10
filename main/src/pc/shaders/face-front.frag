uniform vec2 clipRange;
uniform sampler2D map;

varying vec4 vWorldPos;
varying vec2 vUv;

void main() {
  if (vWorldPos.y < clipRange.x || clipRange.y < vWorldPos.y) discard;

  if (gl_FrontFacing) {
    gl_FragColor = texture2D(map, vUv);
  } else {
    gl_FragColor = texture2D(map, vUv);
    gl_FragColor.rgb *= 0.4;
  } 
}
