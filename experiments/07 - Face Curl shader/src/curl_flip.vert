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
  vec3 originalPos = p;

  // push matrix
  mat4 pushMatrix = curlPushMatrix;
  mat4 popMatrix = curlPopMatrix;

  vec4 p1 = pushMatrix * vec4(p, 1.0);
  float theta = p1.x / radius;

  float tx = radius * sin(theta);
  float ty = p1.y;
  float tz = p1.z + radius * (1.0 - cos(theta));
  p = vec3(tx, ty, tz);

  // pop matrix
  vec4 backedp = popMatrix * vec4(p, 1.0);

  // mix
  vec4 originalPos4 = vec4(originalPos.x, originalPos.y, originalPos.z, 1);
  float mixRate = max((rate - scaleZ), 0.0);
  backedp = mix(originalPos4, backedp, mixRate );

  vec4 mvPosition = modelViewMatrix * backedp;
  gl_Position = projectionMatrix * mvPosition;
  vUv = uv;
}