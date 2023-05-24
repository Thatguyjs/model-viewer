// Code to render models, includes modules that:
//  - Correctly position the camera to account for model size & positioning
//  - Apply basic lighting and/or color information to models

import * as glh from "./gl.mjs";


class ModelViewer {
	constructor(gl, { v_shader, f_shader }) {
		this.gl = gl;
		this.program = glh.create_program(gl, v_shader, f_shader);

		this.a_locations = glh.get_attribute_locations(gl, this.program);
		this.u_locations = glh.get_uniform_locations(gl, this.program);

		const w = this.gl.canvas.width;
		const h = this.gl.canvas.height;

		this.uniforms = {
			proj_mat: glh.mat4.perspective(65 * Math.PI / 180, w / h, 0.1, 100),


			reverse_light_dir: glh.vec3.normalize(glh.vec3.create(0.5, 0.7, -0.2)),
			light_color: new Float32Array([1, 1, 1, 1])
		};

		this.model = null;
	}

	set_model(model) {
		model.init_buffers(this.gl, this.a_locations);
		this.model = model;

		const w = this.gl.canvas.width;
		const h = this.gl.canvas.height;

		const max_all = Math.max(
			model.bounds.x[0] - model.center.x, model.bounds.x[1] - model.center.x,
			model.bounds.y[0] - model.center.y, model.bounds.y[1] - model.center.y,
			model.bounds.z[0] - model.center.z, model.bounds.z[1] - model.center.z
		);

		const eye_y = Math.sin(Math.PI / 6) * max_all * 2;
		const eye_z = Math.cos(Math.PI / 6) * max_all * 2;
		const eye = glh.vec3.create(0, eye_y, eye_z);

		this.uniforms.proj_mat = glh.mat4.perspective(65 * Math.PI / 180, w / h, 0.1, max_all * 5);
		this.uniforms.view_mat = glh.mat4.look_at(glh.mat4.identity(), eye, [0, 0, 0], [0, 1, 0]);
		this.uniforms.model_mat = glh.mat4.identity();
	}

	// Rotates the model
	rotate(speed=1) {
		// mat4.rotate(unis.model_mat, unis.model_mat, 0.005, [0, 1, 0]);
		glh.mat4.rotate(this.uniforms.model_mat, 0.005 * speed, [0, 1, 0]);
	}

	render() {
		this.gl.useProgram(this.program);

		let centered_model = glh.mat4.clone(this.uniforms.model_mat);
		glh.mat4.translate(centered_model, glh.vec3.negative(glh.vec3.from_coord(this.model.center)));

		this.gl.uniformMatrix4fv(this.u_locations.proj_mat, false, this.uniforms.proj_mat);
		this.gl.uniformMatrix4fv(this.u_locations.view_mat, false, this.uniforms.view_mat);
		this.gl.uniformMatrix4fv(this.u_locations.model_mat, false, centered_model);

		this.gl.uniform3fv(this.u_locations.reverse_light_dir, this.uniforms.reverse_light_dir);
		this.gl.uniform4fv(this.u_locations.light_color, this.uniforms.light_color);

		this.model.render(this.gl);
	}
}


export default ModelViewer;
