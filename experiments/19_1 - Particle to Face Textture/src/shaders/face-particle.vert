uniform float size;
uniform float scale;
uniform float time;
uniform mat4 faceMatrix;
uniform sampler2D facePosition;
uniform sampler2D faceTexture;
uniform sampler2D spritePosition; // 256x16 LUT

attribute vec3 triangleIndices;
attribute vec3 weight;
attribute vec3 faceUv;

varying vec3 vColor;
varying vec2 lutIndex;

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

vec4 lookup(in vec4 textureColor, in sampler2D lookupTable) {
  #ifndef LUT_NO_CLAMP
    textureColor = clamp(textureColor, 0.0, 1.0);
  #endif

  float blueColor = textureColor.b * 63.0;

  vec2 quad1;
  quad1.y = floor(floor(blueColor) / 8.0);
  quad1.x = floor(blueColor) - (quad1.y * 8.0);

  vec2 quad2;
  quad2.y = floor(ceil(blueColor) / 8.0);
  quad2.x = ceil(blueColor) - (quad2.y * 8.0);

  vec2 texPos1;
  texPos1.x = (quad1.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.r);
  texPos1.y = (quad1.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.g);

  #ifdef LUT_FLIP_Y
    texPos1.y = 1.0-texPos1.y;
  #endif

  vec2 texPos2;
  texPos2.x = (quad2.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.r);
  texPos2.y = (quad2.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.g);

  #ifdef LUT_FLIP_Y
    texPos2.y = 1.0-texPos2.y;
  #endif

  vec4 newColor1 = texture2D(lookupTable, texPos1);
  vec4 newColor2 = texture2D(lookupTable, texPos2);

  return mix(newColor1, newColor2, fract(blueColor));
}

vec2 lookup_face_uv(in vec4 textureColor, in sampler2D lookupTable) {
  vec2 index = lookup(textureColor, lookupTable).xy * 16.0;
  index.x = floor(index.x) / 16.0;
  index.y = 1.0 - floor(index.y) / 16.0 - 1.0 / 16.0;
  return index;
}

void main() {
  vec4 dest = faceMatrix * vec4(getDest(), 1.0);
  vec4 mvPosition = modelViewMatrix * vec4(mix(position, dest.xyz, time), 1.0);
  gl_PointSize = size * (scale / abs(mvPosition.z));
  gl_Position = projectionMatrix * mvPosition;

  vec3 c = texture2D(faceTexture, getUV()).xyz;
  vColor = c;
  vColor = faceUv;

  lutIndex = lookup_face_uv(vec4(c, 1), spritePosition);
//  lutIndex = faceUv;
}
