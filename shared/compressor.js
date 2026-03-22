import pako from './pako.js';

var Buffer = DeviceRuntimeCore ? DeviceRuntimeCore.Buffer : null;

export const Compressor = {
	encode(data) {
		try {
			const str = JSON.stringify(data);
			const compressed = pako.deflate(str);
			if (Buffer) {
				return Buffer.from(compressed).toString('base64');
			}
			var result = '';
			for (var i = 0; i < compressed.length; i++) {
				result += String.fromCharCode(compressed[i]);
			}
			return btoa(result);
		} catch (err) {
			console.log('Compressor encode error:', err);
			return null;
		}
	},

	decode(base64) {
		try {
			var binData;
			if (Buffer) {
				binData = Buffer.from(base64, 'base64');
			} else {
				var binary = atob(base64);
				var len = binary.length;
				var bytes = new Uint8Array(len);
				for (var i = 0; i < len; i++) {
					bytes[i] = binary.charCodeAt(i);
				}
				binData = bytes;
			}
			var data = pako.inflate(binData, { to: 'string' });
			return JSON.parse(data);
		} catch (err) {
			console.log('Compressor decode error:', err);
			return null;
		}
	}
};
