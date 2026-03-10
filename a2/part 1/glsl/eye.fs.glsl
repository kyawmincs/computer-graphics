in vec3 modelPos;

void main() {
	if (modelPos.z > 0.96) {
		// Pupil
  		gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
	} else if (modelPos.z > 0.8) {
  		gl_FragColor = vec4(0.4, 0.0, 0.4, 1.0);
	} else {
  		gl_FragColor = vec4(1.0, 0.9, 0.9, 1.0);
	}
}