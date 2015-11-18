// uniform float size;
uniform float scale;
uniform float time;
uniform mat4 faceMatrix;
uniform sampler2D facePosition;
uniform sampler2D faceTexture;
uniform sampler2D faceLUT;

attribute vec3 triangleIndices;
attribute vec3 weight;
attribute float delay;

varying vec4 vColor;
varying vec2 vFaceIndex;
varying float vBlend;

#pragma glslify: range = require(glsl-range)
#pragma glslify: easeOutSine = require(glsl-easings/sine-out)
#pragma glslify: easeInOutSine = require(glsl-easings/sine-in-out)
// #pragma glslify: easeOutCubic = require(glsl-easings/cubic-out)
// #pragma glslify: easeInOutCubic = require(glsl-easings/cubic-in-out)


vec3 getp(float index) {
  return texture2D(facePosition, vec2(mod(index, DATA_WIDTH) / DATA_WIDTH, floor(index / DATA_HEIGHT) / DATA_HEIGHT)).xyz;
}

vec3 getDest() {
  return getp(triangleIndices.x) * weight.x + getp(triangleIndices.y) * weight.y + getp(triangleIndices.z) * weight.z;
}

vec2 getu(float index) {
  return texture2D(facePosition, vec2(mod(index, DATA_WIDTH) / DATA_WIDTH, floor(index / DATA_HEIGHT) / DATA_HEIGHT + 0.5)).xy;
}

vec2 getUV() {
  return getu(triangleIndices.x) * weight.x + getu(triangleIndices.y) * weight.y + getu(triangleIndices.z) * weight.z;
}

vec4 lookup(in vec4 textureColor, in sampler2D lookupTable) {
  #ifndef LUT_NO_CLAMP
    textureColor = clamp(textureColor, 0.0, 1.0);
  #endif

  mediump float blueColor = textureColor.b * 63.0;

  mediump vec2 quad1;
  quad1.y = floor(floor(blueColor) / 8.0);
  quad1.x = floor(blueColor) - (quad1.y * 8.0);

  mediump vec2 quad2;
  quad2.y = floor(ceil(blueColor) / 8.0);
  quad2.x = ceil(blueColor) - (quad2.y * 8.0);

  highp vec2 texPos1;
  texPos1.x = (quad1.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.r);
  texPos1.y = (quad1.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.g);

  #ifdef LUT_FLIP_Y
    texPos1.y = 1.0-texPos1.y;
  #endif

  highp vec2 texPos2;
  texPos2.x = (quad2.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.r);
  texPos2.y = (quad2.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.g);

  #ifdef LUT_FLIP_Y
    texPos2.y = 1.0-texPos2.y;
  #endif

  lowp vec4 newColor1 = texture2D(lookupTable, texPos1);
  lowp vec4 newColor2 = texture2D(lookupTable, texPos2);

  lowp vec4 newColor = mix(newColor1, newColor2, fract(blueColor));
  return newColor;
}

vec2 lookup_face_uv(in vec4 textureColor, in sampler2D lookupTable) {
  vec2 index = lookup(textureColor, lookupTable).xy * 16.0;
  index.y += 1.0;
  index.x = floor(index.x);
  index.y = floor(index.y);
  index /= 16.0;
  return vec2(index.x, 1.0-index.y);
}


float getCurrentSize(float time) {
  if (time < 0.4) {
    float t = clamp(range(0.0, 0.1, time), 0.0, 1.0);
    return mix(0.0, 25.0, easeInOutSine(t));

  } else if (0.97 < time) {
    float t = range(0.97, 1.0, time);
    return mix(25.0, 0.0, easeInOutSine(t));

  // } else if (time < 15.0) {
  //   return 5.0;

  // } else {
    // float t = range(15.0, 17.0, time);
    // return mix(20.0, 0.0, t);
    // return 20.
  }
  return 25.0;
}


void main() {
  vec4 dest = faceMatrix * vec4(getDest(), 1.0);
  vec4 mvPosition = modelViewMatrix * vec4(mix(position, dest.xyz, time), 1.0);
  gl_PointSize = getCurrentSize(time) * (scale / abs(mvPosition.z));
  gl_Position = projectionMatrix * mvPosition;
  vColor = texture2D(faceTexture, getUV());
  vFaceIndex = lookup_face_uv(vColor, faceLUT);
  vBlend = easeOutSine(clamp(range(0.8, 1.0, time), 0.0, 1.0)) * 0.5;
}
