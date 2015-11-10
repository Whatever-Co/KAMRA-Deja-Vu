uniform float size;
uniform float scale;
uniform float time;
uniform mat4 faceMatrix;
uniform sampler2D facePosition;
uniform sampler2D faceTexture;

attribute vec3 triangleIndices;
attribute vec3 weight;

varying vec3 vColor;

vec3 getp(float index) {
  return texture2D(facePosition, vec2(mod(index, 32.0) / 32.0, floor(index / 32.0) / 32.0)).xyz;
}

vec3 getDest() {
  return getp(triangleIndices.x) * weight.x + getp(triangleIndices.y) * weight.y + getp(triangleIndices.z) * weight.z;
}

vec2 getu(float index) {
  return texture2D(facePosition, vec2(mod(index, 32.0) / 32.0, floor(index / 32.0) / 32.0 + 0.5)).xy;
}

vec2 getUV() {
  return getu(triangleIndices.x) * weight.x + getu(triangleIndices.y) * weight.y + getu(triangleIndices.z) * weight.z;
}

void main() {
  vec4 dest = faceMatrix * vec4(getDest(), 1.0);
  vec4 mvPosition = modelViewMatrix * vec4(mix(position, dest.xyz, time), 1.0);
  gl_PointSize = size * (scale / abs(mvPosition.z));
  gl_Position = projectionMatrix * mvPosition;
  vColor = texture2D(faceTexture, getUV()).xyz;
}
