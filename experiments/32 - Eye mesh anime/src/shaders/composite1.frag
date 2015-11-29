#pragma glslify: fxaa = require(glsl-fxaa) 
#pragma glslify: lookup = require(glsl-lut)

uniform vec2 resolution;
uniform sampler2D tDiffuse;
uniform sampler2D tLut;
uniform float lutBlend;
uniform sampler2D tOverlay;

varying vec2 vUv;


void main() {
  vec2 fragCoord = vUv * resolution;

  vec4 color = fxaa(tDiffuse, fragCoord, resolution);
  color = mix(color, lookup(color, tLut), lutBlend);
  gl_FragColor = max(color, texture2D(tOverlay, vUv));

  // gl_FragColor = texture2D(tDiffuse, vUv);
  // gl_FragColor.rgb = 1. - gl_FragColor.rgb;
}
