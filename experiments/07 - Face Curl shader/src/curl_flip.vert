const float PI = 3.14159265;

uniform float rate;
uniform float scaleZ;
uniform float radius;

uniform mat4 curlPushMatrix;
uniform mat4 curlPopMatrix;

varying vec2 vUv;

void main() {

  vec3 p = position;
  p.z *= scaleZ;

  // push matrix
  mat4 pushMatrix = curlPushMatrix;
  mat4 popMatrix = curlPopMatrix;

  vec4 p1 = pushMatrix * vec4(p, 1.0);
  vec4 p2 = p1;
  float theta = p1.x / radius;
  if(theta < 0.0) {
    float tx = radius * sin(theta);
    float ty = p1.y;
    float tz = p1.z + radius * (1.0 - cos(theta));
    p2 = vec4(tx, ty, tz, 1.0);
  }

  // pop matrix
  vec4 backedp = popMatrix * p2;

  // mix
  float mixRate = max((rate - scaleZ), 0.0);
  backedp = mix(vec4(p.x, p.y, p.z, 1), backedp, mixRate);

  vec4 mvPosition = modelViewMatrix * backedp;
  gl_Position = projectionMatrix * mvPosition;
  vUv = uv;
}