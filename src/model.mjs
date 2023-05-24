// Basic model class, contains generic model information

import { STLParser } from "./stl.mjs";


class Model {
	constructor(name, { normals, vertices, colors=null, indices=null, bounds=null }) {
		this.name = name;
		this.normals = normals;
		this.vertices = vertices;
		this.colors = colors;
		this.indices = indices;
		this.triangle_count = vertices.length / 3;

		if(bounds === null)
			bounds = Model.get_bounds(this.vertices);

		this.bounds = bounds;
		this.center = {
			x: (this.bounds.x[0] + this.bounds.x[1]) / 2,
			y: (this.bounds.y[0] + this.bounds.y[1]) / 2,
			z: (this.bounds.z[0] + this.bounds.z[1]) / 2
		};

		this.buf = {
			normal: null,
			position: null,
			color: null,
			index: null
		};
	}

	// Load models with the correct parser
	static async load_model(ext, file) {
		if(ext.toLowerCase() === 'stl') {
			const parser = new STLParser();
			await parser.load_file(file);

			return (await parser.parse()).to_model();
		}

		else throw new Error(`Unknown model type: ${ext}`);
	}

	// Finds the min / max values for x, y, z
	static get_bounds(vertices) {
		const tris = vertices.length / 3;
		let bounds = {
			x: [0, 0],
			y: [0, 0],
			z: [0, 0]
		};

		for(let v = 0; v < tris; v++) {
			const vx = vertices[v * 3 + 0],
				  vy = vertices[v * 3 + 1],
				  vz = vertices[v * 3 + 2];

			bounds.x[0] = Math.min(bounds.x[0], vx);
			bounds.x[1] = Math.max(bounds.x[1], vx);

			bounds.y[0] = Math.min(bounds.y[0], vy);
			bounds.y[1] = Math.max(bounds.y[1], vy);

			bounds.z[0] = Math.min(bounds.z[0], vz);
			bounds.z[1] = Math.max(bounds.z[1], vz);
		}

		return bounds;
	}

	// Create necessary buffers for rendering
	init_buffers(gl, attributes) {
		this.buf.normal = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buf.normal);
		gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(attributes.normal);
		gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, 0, 0);

		this.buf.position = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buf.position);
		gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(attributes.position);
		gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, 0, 0);

		if(this.colors !== null) {
			this.buf.color = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.buf.color);
			gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
			gl.enableVertexAttribArray(attributes.color);
			gl.vertexAttribPointer(attributes.color, 4, gl.FLOAT, false, 0, 0);
		}

		if(this.indices !== null) {
			this.buf.index = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buf.index);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
		}
	}

	// Render the model
	render(gl) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buf.position);

		if(this.indices !== null) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buf.index);
			// TODO: Check for UNSIGNED_BYTE usage (constructor this.buf.index uses)
			gl.drawElements(gl.TRIANGLES, this.triangle_count, gl.UNSIGNED_SHORT, 0);
		}

		else gl.drawArrays(gl.TRIANGLES, 0, this.triangle_count);
	}
}


export default Model;
