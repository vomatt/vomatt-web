import {
	ImageFormat,
	SanityImageSource,
} from '@sanity/image-url/lib/types/types';
import cx from 'classnames';
import { twMerge } from 'tailwind-merge';

import { imageBuilder } from '@/sanity/lib/image';

// ***UTILITIES / GET***

export function cn(...inputs: string[]) {
	return twMerge(cx(inputs));
}

export function getRandomInt(min: number, max: number) {
	const _min = Math.ceil(min);
	const _max = Math.floor(max);

	// inclusive of max and min
	return Math.floor(Math.random() * (_max - _min + 1) + _min);
}

export function getUrlBaseAndPath(url: string) {
	if (url.includes('?')) {
		return url.split('?')[0];
	} else {
		return url;
	}
}

// ***UTILITIES / FORMAT***

export function formatNumberSuffix(value: string, suffixOnly: string) {
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

export function formatHandleize(string: string) {
	return String(string)
		.normalize('NFKD') // split accented characters into their base characters and diacritical marks
		.replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
		.replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
		.replace(/\s+/g, '-') // replace spaces with hyphens
		.replace(/-+/g, '-') // remove consecutive hyphens
		.trim() // trim leading or trailing whitespace
		.toLowerCase(); // convert to lowercase
}

export function formatNumberWithCommas(string: string) {
	// example, formatNumberWithCommas(3000.12) = 3,000.12
	const parts = string.toString().split('.');
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

	return parts.join('.');
}

// ***UTILITIES / VALIDATION***

export function validateEmail(email: string) {
	const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

	return regex.test(email);
}

export function validateUsPhone(phoneNumber: string) {
	const regex = /^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/;

	return regex.test(phoneNumber);
}

export function validateAndReturnJson(json: string) {
	try {
		JSON.parse(json);
	} catch (e) {
		console.error(e);
		return false;
	}

	return JSON.parse(json);
}

// ***REACT SPECIFIC***

export function buildRgbaCssString(color: any) {
	if (!color) {
		return false;
	}

	const r = color?.rgb?.r || 255;
	const g = color?.rgb?.g || 255;
	const b = color?.rgb?.b || 255;
	const a = color?.rgb?.a || 1;

	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function slugify(str: string) {
	return String(str)
		.normalize('NFKD') // split accented characters into their base characters and diacritical marks
		.replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
		.trim() // trim leading or trailing whitespace
		.toLowerCase() // convert to lowercase
		.replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
		.replace(/\s+/g, '-') // replace spaces with hyphens
		.replace(/-+/g, '-'); // remove consecutive hyphens
}

export function buildImageSrc(
	image: SanityImageSource,
	{
		width,
		height,
		format,
		quality = 80,
	}: {
		width: number;
		height: number;
		format: ImageFormat | undefined;
		quality: number;
	}
) {
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
