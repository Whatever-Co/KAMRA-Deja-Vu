
uniform float scaleZ;
uniform float curlStrength;
uniform float curlRadius;
uniform mat4 curlPushMatrix;
uniform mat4 curlPopMatrix;

varying vec4 vPos;
varying vec2 vUv;

vec4 getCurlPosition() {
  vec3 p = position;
  p.z *= scaleZ;

  // push matrix
  vec4 p1 = curlPushMatrix * vec4(p, 1.0);
  vec4 p2 = p1;
  float theta = p1.x / curlRadius;
  if(theta < 0.0) {
    float tx = curlRadius * sin(theta);
    float ty = p1.y;
    float tz = p1.z + curlRadius * (1.0 - cos(theta));
    p2 = vec4(tx, ty, tz, 1.0);
  }
  // pop matrix
  vec4 backedp = curlPopMatrix * p2;

  // mix
  float mixRate = max((curlStrength - scaleZ), 0.0);
  backedp = mix(vec4(p.x, p.y, p.z, 1), backedp, mixRate);
  return projectionMatrix * modelViewMatrix * backedp;
}

void main() {
  vPos = modelMatrix * vec4(position, 1.0);
  vUv = uv;

  /* if(scaleZ < 1.0) {
    gl_Position = getCurlPosition();
  }
  else {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  } */
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
