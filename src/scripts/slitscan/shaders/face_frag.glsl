precision mediump float;

const float ellipsoid_rate = 0.86;
const vec2 center = vec2(0.5, 0.4);

uniform sampler2D u_image;
varying vec2 v_texCoord;

varying float v_fallbackLength;
varying float v_fallbackPower;

float egg_mask(vec2 coord){
  vec2 diff = center - coord;
  diff.y *= ellipsoid_rate;
  float fade_len = abs(length(diff)) - v_fallbackLength;
  if (fade_len < 0.0) {
    return 1.0;
  }
  return 1.0 - fade_len * v_fallbackPower;
}

void main() {
  gl_FragColor = texture2D(u_image, v_texCoord) * egg_mask(v_texCoord);
}