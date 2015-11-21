const float PI = 3.141592653589793;

uniform float cameraZ;
uniform mat4 inverseModelMatrix;
uniform float scaleZ;
uniform float curlOffset;
uniform float curlStrength;
uniform float curlRotateX;

varying vec2 vUv;

const float MODEL_SCALE = 150.;

// https://gist.github.com/patriciogonzalezvivo/986341af1560138dde52
vec4 rotateX(vec4 p, float phi) {
  float c = cos(phi);
  float s = sin(phi);
  const float offsetY = 100. / MODEL_SCALE;
  float y = p.y + offsetY;
  return vec4(p.x, y * c - p.z * s - offsetY, y * s + p.z * c, 1.);
}

vec4 rotateZ(vec4 p, float psi) {
  float c = cos(psi);
  float s = sin(psi);
  return vec4(p.x * c - p.y * s, p.x * s + p.y * c, p.z, 1.);
}


const float rotZ = -30. * PI / 180.;

void main() {
  if (scaleZ < 1. || curlStrength > 0. || curlRotateX > 0.) {
    vec4 p = modelMatrix * vec4(position, 1.0);
    float s = max(0.0001, scaleZ);
    p.xy /= (cameraZ - p.z * (1. - s)) / cameraZ;
    p.z *= s;
    p = inverseModelMatrix * p;

    p = rotateZ(p, rotZ);

    float r = 200. / MODEL_SCALE / curlStrength;
    float offset = (curlOffset - 200.) / MODEL_SCALE;
    float a = (p.y - offset) / r;
    if (a > 0.) {
      p.y = sin(a) * r + offset;
      p.z = r - cos(a) * (r - p.z);
    }

    p = rotateX(p, curlRotateX);
    p = rotateZ(p, -rotZ);

    gl_Position = projectionMatrix * modelViewMatrix * p;

  } else {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }

  vUv = uv;
}
