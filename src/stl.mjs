// Contains classes that parse and represent .stl files

import Model from "./model.mjs";


class STLFile {
	#offset = 0;

	constructor() {
		this.name = "";
		this.triangles = 0;

		this.normals = null;
		this.vertices = null;
		this.attributes = null;

		this.bounds = {
			x: [0, 0],
			y: [0, 0],
			z: [0, 0]
		};
	}

	set_header_info(name, triangles) {
		this.name = name;
		this.triangles = triangles;

		this.normals = new Float32Array(9 * triangles);
		this.vertices = new Float32Array(9 * triangles);
		this.attributes = new Uint16Array(triangles);
	}

	add_triangle(normal, v1, v2, v3, attr) {
		const off = this.#offset * 9;
		const verts = [v1, v2, v3];

		for(let i = 0; i < 3; i++) {
			this.normals[off + i + 0] = normal[i % 3];
			this.normals[off + i + 3] = normal[i % 3];
			this.normals[off + i + 6] = normal[i % 3];

			this.vertices[off + i + 0] = v1[i];
			this.vertices[off + i + 3] = v2[i];
			this.vertices[off + i + 6] = v3[i];

			this.bounds.x[0] = Math.min(this.bounds.x[0], verts[i][0]);
			this.bounds.x[1] = Math.max(this.bounds.x[1], verts[i][0]);

			this.bounds.y[0] = Math.min(this.bounds.y[0], verts[i][1]);
			this.bounds.y[1] = Math.max(this.bounds.y[1], verts[i][1]);

			this.bounds.z[0] = Math.min(this.bounds.z[0], verts[i][2]);
			this.bounds.z[1] = Math.max(this.bounds.z[1], verts[i][2]);
		}

		this.attributes[this.#offset] = attr;
		this.#offset++;
	}

	to_model() {
		return new Model(this.name, {
			normals: this.normals,
			vertices: this.vertices,
			bounds: this.bounds
		});
	}
}


class STLParser {
	static None = 0;
	static InProgress = 1;

	constructor() {
		this.buffer = null;
		this.state = STLParser.None;
	}

	async load_file(file) {
		if(this.state !== STLParser.None)
			throw new Error("Cannot load a file when already in use");

		this.state = STLParser.InProgress;

		if(file instanceof Response)
			this.buffer = await file.arrayBuffer();
		else if(file instanceof File)
			file = await file.arrayBuffer();
		else if(file instanceof ArrayBuffer)
			this.buffer = file;
		else if(file instanceof Uint8Array)
			this.buffer = file.buffer;
		else
			throw new Error(`Unknown data type: ${file}`);
	}

	async parse() {
		const view = new DataView(this.buffer);
		let file = new STLFile();

		// Header
		const decoder = new TextDecoder();
		let name = decoder.decode(new Uint8Array(this.buffer).subarray(0, 80));
		if(name.endsWith('\0')) name = name.slice(0, name.indexOf('\0'));

		const triangles = view.getUint32(80, true);
		file.set_header_info(name.trim(), triangles);

		// Body
		const norm = new Float32Array(3); // Current normal
		const v1 = new Float32Array(3); // Current vertices
		const v2 = new Float32Array(3);
		const v3 = new Float32Array(3);

		for(let t = 0; t < triangles; t++) {
			const offset = 84 + t * 50;

			for(let v = 0; v < 3; v++) {
				norm[v] = view.getFloat32(offset + v * 4, true);

				v1[v] = view.getFloat32(offset + v * 4 + 12, true);
				v2[v] = view.getFloat32(offset + v * 4 + 24, true);
				v3[v] = view.getFloat32(offset + v * 4 + 36, true);
			}

			const attr = view.getUint16(offset + 48, true);
			file.add_triangle(norm, v1, v2, v3, attr);
		}

		this.state = STLParser.None;
		return file;
	}
}


export { STLFile, STLParser };
