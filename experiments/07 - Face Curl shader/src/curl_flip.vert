const float PI = 3.141592653589793;

uniform float cameraZ;
uniform float scaleZ;
uniform float curlOffset;
uniform float curlStrength;
uniform float curlRotateX;

varying vec2 vUv;


// https://gist.github.com/patriciogonzalezvivo/986341af1560138dde52
vec3 rotateX(vec3 p, float phi) {
  float c = cos(phi);
  float s = sin(phi);
  const float offsetY = 100.;
  float y = p.y + offsetY;
  return vec3(p.x, y * c - p.z * s - offsetY, y * s + p.z * c);
}

vec3 rotateZ(vec3 p, float psi) {
  float c = cos(psi);
  float s = sin(psi);
  return vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z);
}


const float rotZ = -30. * PI / 180.;

void main() {
  if (scaleZ < 1.0 || curlStrength > 0.0 || curlRotateX > 0.0) {
    vec3 p = (modelMatrix * vec4(position, 1.0)).xyz;
    p.xy /= (cameraZ - p.z * (1. - scaleZ)) / cameraZ;
    p.z *= scaleZ;

    p = rotateZ(p, rotZ);

    float r = 200. / curlStrength;
    float a = (p.y - (curlOffset - 200.)) / r;
    if (a > 0.) {
      p.y = sin(a) * r + (curlOffset - 200.);
      p.z = r - cos(a) * (r - p.z);
    }

    p = rotateX(p, curlRotateX);
    p = rotateZ(p, -rotZ);

    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);

  } else {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }

  vUv = uv;
}
