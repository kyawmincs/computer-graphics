// The value of the "varying" variable is interpolated between values computed in the vertex shader
// The varying variable we passed from the vertex shader is identified by the 'in' classifier
in float intensity;

void main() {
 	// TODO: Set final rendered colour to intensity (a grey level)
	gl_FragColor = vec4(intensity*vec3(1.0,1.0,1.0), 1.0); 
}
