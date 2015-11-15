var data = require("./keyframes.json");

function v3(data, frame) {

	var x = data[frame * 3 ],
		y = data[frame * 3 + 1],
		z = data[frame * 3 + 2];

	console.log("[" + x + ", " + y + ", " + z + "]");
}