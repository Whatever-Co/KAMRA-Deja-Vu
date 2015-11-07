uniform vec2 clipRange;

varying vec4 vPos;

void main() {
  if (vPos.y < clipRange.x || clipRange.y < vPos.y) discard;
  gl_FragColor = vec4(0.106, 0.169, 0.204, 1);

  // if (gl_FrontFacing) {
  //   gl_FragColor = texture2D(map, vUv);
  // } else {
  //   gl_FragColor = vec4(0.106, 0.169, 0.204, 1);
    /*
    vec3 origin = cameraPosition;
    vec3 direction = normalize(vPos.xyz - cameraPosition);
    vec3 planeNormal = vec3(0, 1, 0);
    float planeConstant = -clipY;
    float denominator = dot(planeNormal, direction);
    float t = -(dot(origin, planeNormal) + planeConstant) / denominator;
    vec3 p0 = direction * t + origin;
    gl_FragColor = texture2D(map, vec2(p0.x, clipY) / 200.0 + 0.5);
    gl_FragColor.a = 1.0;
    //*/
  // }

}
