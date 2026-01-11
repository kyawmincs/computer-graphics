// The value of the "varying" variable is interpolated between values computed in the vertex shader
// The varying variable we passed from the vertex shader is identified by the 'in' classifier
in float intensity;
in vec3 vWorldPos;

uniform vec3 orbPosition;
uniform float orbRadius;

void main() {
 	// TODO: Set final rendered colour to intensity (a grey level)
  float distBetween = distance(vWorldPos, orbPosition);
  if (distBetween < orbRadius) {
    gl_FragColor = vec4(intensity * vec3(0.0, 1.0, 1.0), 1.0); 
  } else {
    gl_FragColor = vec4(intensity * vec3(1.0,1.0,1.0), 1.0); 
  }
}
