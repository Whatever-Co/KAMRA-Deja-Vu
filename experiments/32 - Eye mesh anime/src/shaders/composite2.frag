#pragma glslify: chromaticAberration = require(./chromatic-aberration)

uniform vec2 resolution;
uniform sampler2D tDiffuse;
uniform sampler2D tNoise;
uniform vec2 noiseSize;
uniform vec2 noiseOffset;
uniform int noiseEnabled;

varying vec2 vUv;


void main() {
  vec2 fragCoord = vUv * resolution;

  // TODO: aspect correction
  vec4 color = chromaticAberration(tDiffuse, vUv);

  // vignette
  // color.rgb = vec3(1.);
  const float darkness = 1.0;
  // const float offset = 1.0;
  const vec2 aspectCorrection = vec2(1., 9. / 16.);
  vec2 uv = (vUv - vec2(0.5)) * aspectCorrection;// * vec2(offset);
  color = vec4(mix(color.rgb, vec3(1.0 - darkness), dot(uv, uv)), color.a);

  // noise
  if (noiseEnabled > 0) {
    vec4 noise = texture2D(tNoise, vUv * resolution / noiseSize + noiseOffset);
    color.rgb *= vec3(1. - noise.a * 0.6);
  }

  gl_FragColor = color;
}
