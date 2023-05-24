#version 300 es
precision mediump float;


uniform mat4 proj_mat;
uniform mat4 view_mat;
uniform mat4 model_mat;

in vec4 position;
in vec3 normal;

out vec3 f_normal;

void main() {
	gl_Position = proj_mat * view_mat * model_mat * position;
	f_normal = mat3(model_mat) * normal;
}
