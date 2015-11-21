uniform sampler2D texture;
uniform float rate;
uniform float alpha;

varying vec2 vUv;

void main() {
  gl_FragColor = texture2D(texture, vUv);
  gl_FragColor.a = (1.0 - rate) * alpha;
}
