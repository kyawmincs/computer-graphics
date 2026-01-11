// The uniform variable is set up in the javascript code and the same for all vertices
uniform vec3 orbPosition;

void main() {

    // Multiply each vertex by the model matrix to get the world position of each vertex, 
    // then the view matrix to get the position in the camera coordinate system, 
    // and finally the projection matrix to get final vertex position.

    // Claude mentioned this was better but why? Ask in OH
    // vec4 worldPos = modelMatrix * vec4(position, 1.0);
    // worldPos.xyz += orbPosition;
    // gl_Position = projectionMatrix * viewMatrix * worldPos;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position + orbPosition, 1);
}
