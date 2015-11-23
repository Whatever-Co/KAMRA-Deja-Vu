uniform sampler2D tDiffuse;
uniform sampler2D tLut;

varying vec2 vUv;

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

void main() {
  gl_FragColor = lookup(texture2D(tDiffuse, vUv), tLut);
}
