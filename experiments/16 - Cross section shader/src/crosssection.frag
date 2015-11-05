uniform sampler2D map;
uniform float clipY;

varying vec2 vUv;
varying vec3 vPos;

void main() {
  if (vPos.y > clipY) discard;

  if (gl_FrontFacing) {
    gl_FragColor = texture2D(map, vUv);
  } else {
    vec3 origin = cameraPosition;
    vec3 direction = normalize(vPos - cameraPosition);
    vec3 planeNormal = vec3(0, 1, 0);
    float planeConstant = -clipY;
    float denominator = dot(planeNormal, direction);
    float t = -(dot(origin, planeNormal) + planeConstant) / denominator;
    vec3 p0 = direction * t + origin;
    // gl_FragColor = vec4(p0.xz / 200.0, 0, 1);
    gl_FragColor = texture2D(map, vec2(p0.x, clipY) / 200.0 + 0.5);
  }
}
