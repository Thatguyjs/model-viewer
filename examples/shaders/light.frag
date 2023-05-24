#version 300 es
precision mediump float;


uniform vec3 reverse_light_dir;
uniform vec4 light_color;

in vec3 f_normal;

out vec4 color;

void main() {
	vec3 normal = normalize(f_normal);
	float light = dot(normal, reverse_light_dir);

	if(light < 0.1) {
		light = (light + 1.0) / 11.0;
	}

	color = vec4(light_color.rgb * light, light_color.a);
}
