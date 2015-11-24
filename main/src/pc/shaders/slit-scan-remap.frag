uniform vec2 resolution;
uniform float blurSize;
uniform sampler2D remap;
uniform sampler2D face;

void main() {
  const int NUM_TAPS = 12;
  
  vec2 fTaps_Poisson[NUM_TAPS];
  fTaps_Poisson[0]  = vec2(-.326,-.406);
  fTaps_Poisson[1]  = vec2(-.840,-.074);
  fTaps_Poisson[2]  = vec2(-.696, .457);
  fTaps_Poisson[3]  = vec2(-.203, .621);
  fTaps_Poisson[4]  = vec2( .962,-.195);
  fTaps_Poisson[5]  = vec2( .473,-.480);
  fTaps_Poisson[6]  = vec2( .519, .767);
  fTaps_Poisson[7]  = vec2( .185,-.893);
  fTaps_Poisson[8]  = vec2( .507, .064);
  fTaps_Poisson[9]  = vec2( .896, .412);
  fTaps_Poisson[10] = vec2(-.322,-.933);
  fTaps_Poisson[11] = vec2(-.792,-.598);

  vec4 sum = vec4(0., 0., 0., 0.);
  for (int i = 0; i < NUM_TAPS; i++) {
    sum += texture2D(remap, (gl_FragCoord.xy + fTaps_Poisson[i] * blurSize) / resolution);
    sum += texture2D(remap, (gl_FragCoord.xy + fTaps_Poisson[i] * blurSize * 2.) / resolution);
    sum += texture2D(remap, (gl_FragCoord.xy + fTaps_Poisson[i] * blurSize * 3.) / resolution);
  }
  sum /= float(NUM_TAPS * 3);

  gl_FragColor = texture2D(face, sum.xy);
  // gl_FragColor.a = 0.5;

  // gl_FragColor = vec4(uv, 0., 1.);
  // gl_FragColor = vec4(gl_FragCoord.xy / resolution, 0, 1);
  // gl_FragColor = texture2D(face, gl_FragCoord.xy / resolution);
  // gl_FragColor = sum;
}
