// Импортируйте pako, если используете сборщик, 
// или просто добавьте код библиотеки выше в этом же файле
import pako from './pako.js';

export const Compressor = {
	// Кодируем JSON в сжатую строку (Base64)
	encode(data) {
		try {
			const str = JSON.stringify(data);
			// Сжимаем в Uint8Array
			const compressed = pako.deflate(str);
			// Конвертируем байты в строку для передачи (Base64)
			return btoa(String.fromCharCode.apply(null, compressed));
		} catch (err) {
			console.log('Ошибка сжатия:', err);
			return null;
		}
	},

	// Декодируем обратно в JSON
	decode(base64) {
		try {
			// Из Base64 обратно в байты
			const strData = atob(base64);
			const charData = strData.split('').map(x => x.charCodeAt(0));
			const binData = new Uint8Array(charData);

			// Разжимаем
			const data = pako.inflate(binData, { to: 'string' });
			return JSON.parse(data);
		} catch (err) {
			console.log('Ошибка разжатия:', err);
			return null;
		}
	}
};
