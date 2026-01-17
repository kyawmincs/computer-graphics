// The uniform variable is set up in the javascript code and the same for all vertices
uniform vec3 orbPosition;
uniform float orbRadius;

// This is a "varying" variable and interpolated between vertices and across fragments.
// The shared variable is initialized in the vertex shader and passed to the fragment shader.
out float intensity;
out vec3 vWorldPos;


void main() {
    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz; 
    vWorldPos = worldPos;

    vec3 lightDir = normalize(orbPosition - worldPos);
    vec3 worldNorm = normalize(normalMatrix * normal);
    // Negative from cos(θ) -> removed 
    intensity = max(0.0, dot(lightDir, worldNorm));
    float dist = distance(worldPos, orbPosition);
    

    // Multiply each vertex by the model matrix to get the world position of each vertex, 
    // then the view matrix to get the position in the camera coordinate system, 
    // and finally the projection matrix to get final vertex position
    if (dist < orbRadius) {
        vec3 direction = normalize(worldPos - orbPosition);
        vec3 newWorldPos = orbPosition + direction * orbRadius;
        
        vWorldPos = newWorldPos;
        // Transform directly from world space (skip model matrix)
        gl_Position = projectionMatrix * viewMatrix * vec4(newWorldPos, 1.0);
    } else {
        vWorldPos = worldPos;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    }
}
