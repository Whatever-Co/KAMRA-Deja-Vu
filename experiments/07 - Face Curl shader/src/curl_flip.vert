const float PI = 3.141592653589793;

uniform float scaleZ;
uniform float curlOffset;
uniform float curlStrength;

varying vec2 vUv;


vec3 rotateZ(vec3 p, float psi) {
  float c = cos(psi);
  float s = sin(psi);
  return vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z);
}


void main() {
  if (scaleZ < 1.0) {
    vec3 p = (modelMatrix * vec4(position, 1.0)).xyz;
    p.z *= scaleZ;
    p.xy *= (500.0 - p.z) / 500.0;

    p = rotateZ(p, -30. * PI / 180.);

    float r = 200. / curlStrength;
    float a = (p.y - (curlOffset - 200.)) / r;
    if (a > 0.) {
      p.y = sin(a) * r + (curlOffset - 200.);
      p.z = r - cos(a) * r;
    }

    p = rotateZ(p, 30. * PI / 180.);

    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);

  } else {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }

  vUv = uv;
}
