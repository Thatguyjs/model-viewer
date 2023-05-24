import { Model, ModelViewer, canvas_to_display_size } from "/src/exports.mjs";


// -- Boilerplate --

const el = document.querySelector.bind(document);
const fetch_text = async (...args) => {
	return await (await fetch(...args)).text();
}

const cnv = el('canvas');
const gl = cnv.getContext('webgl2');

function resize() {
	canvas_to_display_size(cnv);
	gl.viewport(0, 0, cnv.width, cnv.height);
}

window.addEventListener('resize', resize);
resize();


// -- Relevant Code --

const viewer = new ModelViewer(gl, {
	v_shader: await fetch_text('../shaders/light.vert'),
	f_shader: await fetch_text('../shaders/light.frag')
});

const file = await fetch('../models/Sample_Model_Logo.stl');
const model = await Model.load_model('stl', file);

viewer.set_model(model);


gl.enable(gl.DEPTH_TEST);
gl.clearColor(0, 0, 0, 1);

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	viewer.rotate();
	viewer.render();

	window.requestAnimationFrame(render);
}

window.requestAnimationFrame(render);
