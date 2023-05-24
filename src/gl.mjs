// WebGL + Rendering Math helper utilities


export function canvas_to_display_size(canvas) {
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
}


export function create_shader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
	}

	else return shader;
}

export function create_program(gl, vert_shader, frag_shader) {
	if(typeof vert_shader === 'string')
		vert_shader = create_shader(gl, gl.VERTEX_SHADER, vert_shader);
	if(typeof frag_shader === 'string')
		frag_shader = create_shader(gl, gl.FRAGMENT_SHADER, frag_shader);

	const program = gl.createProgram();
	gl.attachShader(program, vert_shader);
	gl.attachShader(program, frag_shader);
	gl.linkProgram(program);

	if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
	}

	else return program;
}


export function get_attribute_locations(gl, program) {
	const n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
	let attrs = {};

	for(let a = 0; a < n; a++) {
		const name = gl.getActiveAttrib(program, a).name;
		attrs[name] = gl.getAttribLocation(program, name);
	}

	return attrs;
}

export function get_uniform_locations(gl, program) {
	const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	let unis = {};

	for(let u = 0; u < n; u++) {
		const name = gl.getActiveUniform(program, u).name;
		unis[name] = gl.getUniformLocation(program, name);
	}

	return unis;
}


export const vec3 = {
	create(x, y, z) {
		x ??= 0;
		y ??= x;
		z ??= x;

		return new Float32Array([x, y, z]);
	},

	from_coord(obj) {
		return new Float32Array([obj.x, obj.y, obj.z]);
	},

	// Equivalent to multiplying by -1
	negative(v) {
		v[0] = -v[0];
		v[1] = -v[1];
		v[2] = -v[2];

		return v;
	},

	normalize(v) {
		const len = vec3.length(v);
		v[0] /= len;
		v[1] /= len;
		v[2] /= len;

		return v;
	},

	length(v) {
		return Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
	},

	distance(v1, v2) {
		const dx = Math.abs(v2[0] - v1[0]);
		const dy = Math.abs(v2[1] - v1[1]);
		const dz = Math.abs(v2[2] - v1[2]);

		return vec3.length([dx, dy, dz]);
	}
};


export const mat4 = {
	clone(m) {
		let other = new Float32Array(16);

		for(let i = 0; i < 16; i++)
			other[i] = m[i];

		return other;
	},

	identity() {
		return new Float32Array([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		]);
	},

	perspective(fov, aspect, near, far) {
		const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
		const range_inv = 1 / (near - far);

		return new Float32Array([
			f / aspect, 0, 0, 0,
			0, f, 0, 0,
			0, 0, (near + far) * range_inv, -1,
			0, 0, near * far * range_inv * 2, 0
		]);
	},

	look_at(m, eye, center, up) {
		let len;

		let z0 = eye[0] - center[0];
		let z1 = eye[1] - center[1];
		let z2 = eye[2] - center[2];
		len = 1 / Math.hypot(z0, z1, z2);
		z0 *= len;
		z1 *= len;
		z2 *= len;

		let x0 = up[1] * z2 - up[2] * z1;
		let x1 = up[2] * z0 - up[0] * z2;
		let x2 = up[0] * z1 - up[1] * z0;
		len = Math.hypot(x0, x1, x2);

		if(!len) {
			x0 = 0;
			x1 = 0;
			x2 = 0;
		}
		else {
			len = 1 / len;
			x0 *= len;
			x1 *= len;
			x2 *= len;
		}

		let y0 = z1 * x2 - z2 * x1;
		let y1 = z2 * x0 - z0 * x2;
		let y2 = z0 * x1 - z1 * x0;
		len = Math.hypot(y0, y1, y2);

		if(!len) {
			y0 = 0;
			y1 = 0;
			y2 = 0;
		}
		else {
			len = 1 / len;
			y0 *= len;
			y1 *= len;
			y2 *= len;
		}

		m[0] = x0;
		m[1] = y0;
		m[2] = z0;
		m[3] = 0;
		m[4] = x1;
		m[5] = y1;
		m[6] = z1;
		m[7] = 0;
		m[8] = x2;
		m[9] = y2;
		m[10] = z2;
		m[11] = 0;
		m[12] = -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]);
		m[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]);
		m[14] = -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]);
		m[15] = 1;

		return m;
	},

	translate(m, v) {
		m[12] += m[0] * v[0] + m[4] * v[1] + m[8] * v[2];
		m[13] += m[1] * v[0] + m[5] * v[1] + m[9] * v[2];
		m[14] += m[2] * v[0] + m[6] * v[1] + m[10] * v[2];
		m[15] += m[3] * v[0] + m[7] * v[1] + m[11] * v[2];

		return m;
	},

	rotate(m, radians, axis) {
		let x = axis[0];
		let y = axis[1];
		let z = axis[2];

		const len = 1 / Math.hypot(x, y, z);
		x *= len;
		y *= len;
		z *= len;

		const s = Math.sin(radians);
		const c = Math.cos(radians);
		const t = 1 - c;

		let b00 = x * x * t + c;
		let b01 = y * x * t + z * s;
		let b02 = z * x * t - y * s;
		let b10 = x * y * t - z * s;
		let b11 = y * y * t + c;
		let b12 = z * y * t + x * s;
		let b20 = x * z * t + y * s;
		let b21 = y * z * t - x * s;
		let b22 = z * z * t + c;

		m[0] = m[0] * b00 + m[4] * b01 + m[8] * b02;
		m[1] = m[1] * b00 + m[5] * b01 + m[9] * b02;
		m[2] = m[2] * b00 + m[6] * b01 + m[10] * b02;
		m[3] = m[3] * b00 + m[7] * b01 + m[11] * b02;
		m[4] = m[0] * b10 + m[4] * b11 + m[8]  * b12;
		m[5] = m[1] * b10 + m[5] * b11 + m[9] * b12;
		m[6] = m[2] * b10 + m[6] * b11 + m[10] * b12;
		m[7] = m[3] * b10 + m[7] * b11 + m[11] * b12;
		m[8] = m[0] * b20 + m[4] * b21 + m[8] * b22;
		m[9] = m[1] * b20 + m[5] * b21 + m[9] * b22;
		m[10] = m[2] * b20 + m[6] * b21 + m[10] * b22;
		m[11] = m[3] * b20 + m[7] * b21 + m[11] * b22;

		return m;
	}
};
