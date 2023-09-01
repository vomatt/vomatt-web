import { imageBuilder } from '@/sanity/lib/image';

// ***UTILITIES / GET***

export function getRandomInt(min, max) {
	const _min = Math.ceil(min);
	const _max = Math.floor(max);

	// inclusive of max and min
	return Math.floor(Math.random() * (_max - _min + 1) + _min);
}

export function getUrlBaseAndPath(url) {
	if (url.includes('?')) {
		return url.split('?')[0];
	} else {
		return url;
	}
}

// ***UTILITIES / FORMAT***

export function formatNumberSuffix(value, suffixOnly) {
	let int = parseInt(value);
	let integer = suffixOnly ? '' : int;

	if (int > 3 && int < 21) return `${integer}th`;

	switch (int % 10) {
		case 1:
			return `${integer}st`;
		case 2:
			return `${integer}nd`;
		case 3:
			return `${integer}rd`;
		default:
			return `${integer}th`;
	}
}

export function formatHandleize(str) {
	return String(string)
		.normalize('NFKD') // split accented characters into their base characters and diacritical marks
		.replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
		.replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
		.replace(/\s+/g, '-') // replace spaces with hyphens
		.replace(/-+/g, '-') // remove consecutive hyphens
		.trim() // trim leading or trailing whitespace
		.toLowerCase(); // convert to lowercase
}

export function formatPad(val, length = 2, char = 0) {
	// example, leading zero: 8 = "08",
	// example, password: 000088885581 = "********5581"
	return val.toString().padStart(length, char);
}

export function formatClamp(value, min = 0, max = 1) {
	// example, formatClamp(999, 0, 300) = 300
	return value < min ? min : value > max ? max : value;
}

export function formatNumberWithCommas(string) {
	// example, formatNumberWithCommas(3000.12) = 3,000.12
	const parts = string.toString().split('.');
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

	return parts.join('.');
}

export function formatDateUsStandard(date) {
	return [
		formatPad(date.getDate()),
		formatPad(date.getMonth() + 1),
		date.getFullYear(),
	].join('/');
}

// ***UTILITIES / VALIDATION***

export function validateEmail(string) {
	const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

	return regex.test(string);
}

export function validateUsPhone(string) {
	const regex = /^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/;

	return regex.test(string);
}

export function validateAndReturnJson(json) {
	try {
		JSON.parse(json);
	} catch (e) {
		console.error(e);
		return false;
	}

	return JSON.parse(string);
}

// ***UTILITIES / ARRAY***

export function arrayIntersection(a1, a2) {
	return a1.filter(function (n) {
		return a2.indexOf(n) !== -1;
	});
}

// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
export const arrayUniqueValues = (array) => {
	let unique = [...new Set(array)];

	return unique;
};

// sorting array of objects asc
export function arraySortObjValAsc(arr, objVal) {
	return arr.sort(function (a, b) {
		if (a[objVal] > b[objVal]) {
			return 1;
		}
		if (b[objVal] > a[objVal]) {
			return -1;
		}
		return 0;
	});
}

// sorting array of objects desc
export function arraySortObjValDesc(arr, objVal) {
	return arr.sort(function (a, b) {
		if (a[objVal] > b[objVal]) {
			return -1;
		}
		if (b[objVal] > a[objVal]) {
			return 1;
		}
		return 0;
	});
}

// https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
export function arrayCartesian(...arrays) {
	return [...arrays].reduce(
		(a, b) =>
			a.map((x) => b.map((y) => x.concat(y))).reduce((a, b) => a.concat(b), []),
		[[]]
	);
}

// ***ACTIONS***

export function scrollDisable() {
	document.documentElement.style.overflow = 'hidden';
	document.querySelector('body').style.overflow = 'hidden';
}

export function scrollEnable() {
	document.documentElement.style.overflow = 'auto';
	document.querySelector('body').style.overflow = 'auto';
}

// simple debounce
export function debounce(fn, ms) {
	let timer;

	return (_) => {
		clearTimeout(timer);
		timer = setTimeout((_) => {
			timer = null;
			fn.apply(this, arguments);
		}, ms);
	};
}

// delay with promise
export function sleeper(ms) {
	return function (x) {
		return new Promise((resolve) => setTimeout(() => resolve(x), ms));
	};
}

// ***REACT SPECIFIC***

export function buildImageSrc(image, { width, height, format, quality = 80 }) {
	if (!image) {
		return false;
	}

	let imgSrc = imageBuilder.image(image);

	if (width) {
		imgSrc = imgSrc.width(Math.round(width));
	}

	if (height) {
		imgSrc = imgSrc.height(Math.round(height));
	}

	if (format) {
		imgSrc = imgSrc.format(format);
	}

	if (quality) {
		imgSrc = imgSrc.quality(quality);
	}

	return imgSrc.fit('max').auto('format').url();
}

export function buildImageSrcSet(
	image,
	{ srcSizes, aspectRatio = 1, format, quality = 80 }
) {
	if (!image) {
		return false;
	}

	const sizes = srcSizes.map((width) => {
		let imgSrc = buildImageSrc(image, {
			...{ width },
			height: aspectRatio && Math.round(width * aspectRatio) / 100,
			...{ format },
			...{ quality },
		});

		if (format) {
			imgSrc = imgSrc.format(format);
		}

		return `${imgSrc} ${width}w`;
	});

	return sizes.join(',');
}

export function buildRgbaCssString(color) {
	if (!color) {
		return false;
	}

	const r = color?.rgb?.r || 255;
	const g = color?.rgb?.g || 255;
	const b = color?.rgb?.b || 255;
	const a = color?.rgb?.a || 1;

	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function slugify(str) {
	return String(str)
		.normalize('NFKD') // split accented characters into their base characters and diacritical marks
		.replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
		.trim() // trim leading or trailing whitespace
		.toLowerCase() // convert to lowercase
		.replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
		.replace(/\s+/g, '-') // replace spaces with hyphens
		.replace(/-+/g, '-'); // remove consecutive hyphens
}
