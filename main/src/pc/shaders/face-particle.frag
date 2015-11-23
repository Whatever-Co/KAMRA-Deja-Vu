uniform sampler2D faceSprite;

varying vec4 vColor;
varying vec2 vFaceIndex;
varying float vBlend;


vec4 lookup() {
  mediump vec2 uv = vec2(
    gl_PointCoord.x / 16.0 + vFaceIndex.x,
    (1.0 - gl_PointCoord.y) / 16.0 + vFaceIndex.y
  );
  return texture2D(faceSprite, uv);
}


void main() {
  vec4 c = lookup();
  if (c.a > 0.) {
    gl_FragColor = mix(c, vColor, vBlend);
    gl_FragColor.a = c.a;
  } else {
    discard;
  }
}
