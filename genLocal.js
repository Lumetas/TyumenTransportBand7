const API_BASE = 'https://api.tgt72.ru/api/v5';
import { STOPS } from "./config.js";
import fs from 'node:fs';
let result = {};
let i;
async function processStation(id) {
	let i;
	let busName;
	let busData;
	let dataObject;
	result[id] = {};
	let data = await fetch(API_BASE + "/times/?checkpoint_id=" + String(id));
	data = await data.json();
	for ( i in data.objects) {
		dataObject = data.objects[i];
		busData = await fetch(API_BASE + "/routesforsearch/" + String(dataObject.route_id) + "/");
		busData = await busData.json();
		busName = busData.name;
		result[id][busName] = dataObject.times;
	}
}
let promises = [];

for ( i in STOPS) {
	console.log('Processing: ' + i + '...');
	promises.push(processStation(STOPS[i]));
}

await Promise.all(promises);


result = JSON.stringify(result);
result = "export const _LOCAL_API = " + result;
fs.writeFileSync('localAPI.js', result);
