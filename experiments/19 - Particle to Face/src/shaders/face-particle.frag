#define LOG2 1.442695
#define saturate(a) clamp(a, 0.0, 1.0)
#define whiteCompliment(a) (1.0 - saturate(a))

varying vec3 vColor;

void main() {
  float depth = gl_FragCoord.z / gl_FragCoord.w;

  /*float fogNear = 1000.0;
  float fogFar = 5000.0;
  float fogFactor = smoothstep(fogNear, fogFar, depth);*/
  float fogDensity = 0.00035;
  float fogFactor = whiteCompliment( exp2( - fogDensity * fogDensity * depth * depth * LOG2 ) );

  // gl_FragColor = vec4(mix(vColor, vec3(0.027, 0.082, 0.125), fogFactor), 1);
  gl_FragColor = vec4(vColor, 1.0);
}
