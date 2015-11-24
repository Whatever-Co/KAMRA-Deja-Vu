#define LOG2 1.442695
#define saturate(a) clamp(a, 0.0, 1.0)
#define whiteCompliment(a) (1.0 - saturate(a))
#define TILE 16

uniform sampler2D spriteTexture;

varying vec3 vColor;
varying vec2 lutIndex;

vec4 lookup() {
  mediump vec2 uv = vec2(
    gl_PointCoord.x / 16.0 + lutIndex.x,
    (1.0-gl_PointCoord.y) / 16.0 + lutIndex.y
  );
  return texture2D(spriteTexture, uv);
}

void main() {
  vec4 c = lookup();
  if (c.a < 0.1) discard;

//  c.rgb = mix(c.rgb, vColor, 0.8);


  float depth = gl_FragCoord.z / gl_FragCoord.w;

  float fogDensity = 0.00035;
  float fogFactor = whiteCompliment( exp2( - fogDensity * fogDensity * depth * depth * LOG2 ) );

//  gl_FragColor  = mix(c, vec4(vColor, 0.0), 0.1);
  gl_FragColor.rgb = mix(c.rgb, vec3(0.027, 0.082, 0.125), fogFactor);
  gl_FragColor.a = c.a;
}
