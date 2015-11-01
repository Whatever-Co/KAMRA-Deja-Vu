varying vec2 vUv;

uniform float morphTargetInfluences[11];

attribute vec3 morphTarget0;
attribute vec3 morphTarget1;
attribute vec3 morphTarget2;
attribute vec3 morphTarget3;
attribute vec3 morphTarget4;
attribute vec3 morphTarget5;
attribute vec3 morphTarget6;
attribute vec3 morphTarget7;
attribute vec3 morphTarget8;
attribute vec3 morphTarget9;
attribute vec3 morphTarget10;

void main() {
  vUv = uv;

  vec3 transformed = position;
  transformed += (morphTarget0 - position) * morphTargetInfluences[0];
  transformed += (morphTarget1 - position) * morphTargetInfluences[1];
  transformed += (morphTarget2 - position) * morphTargetInfluences[2];
  transformed += (morphTarget3 - position) * morphTargetInfluences[3];
  transformed += (morphTarget4 - position) * morphTargetInfluences[4];
  transformed += (morphTarget5 - position) * morphTargetInfluences[5];
  transformed += (morphTarget6 - position) * morphTargetInfluences[6];
  transformed += (morphTarget7 - position) * morphTargetInfluences[7];
  transformed += (morphTarget8 - position) * morphTargetInfluences[8];
  transformed += (morphTarget9 - position) * morphTargetInfluences[9];
  transformed += (morphTarget10 - position) * morphTargetInfluences[10];

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
