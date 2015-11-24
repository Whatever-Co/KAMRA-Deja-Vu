uniform sampler2D faceSprite;

varying vec4 vColor;
varying vec2 vFaceIndex;
varying float vBlend;
varying float vRotation;


vec2 rotate(vec2 p, float psi) {
  float c = cos(psi);
  float s = sin(psi);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

vec4 lookup() {
  vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
  uv = rotate((uv - 0.5) * 1.4, vRotation) + 0.5;
  if (uv.x < 0. || 1. < uv.x || uv.y < 0. || 1. < uv.y) {
    discard;
  }
  return texture2D(faceSprite, uv / 16.0 + vFaceIndex);
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
