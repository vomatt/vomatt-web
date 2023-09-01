'use client';
import { useEffect, useState } from 'react';

export function siteSetup() {
	// site credit
	console.log(
		'%cSite by View Source \n%cview-source.com',
		[
			'margin: 20px 0 0;',
			'font-size: 12px',
			'font-family: Helvetica, sans-serif',
			'font-weight: 700',
		].join(';'),
		[
			'margin: -5px 0 20px;',
			'font-size: 12px',
			'font-family: Helvetica, sans-serif',
			'font-weight: 400',
		].join(';')
	);

	// enable the possibility for browser-specific CSS
	document.documentElement.setAttribute('data-useragent', navigator.userAgent);

	// .avoid-style-flash elements turns visible
	setTimeout(() => {
		document.querySelectorAll('.avoid-style-flash').forEach((el) => {
			el.style.visibility = 'visible';
		});
	}, 400);

	// setup --s-vp-height variable
	document.documentElement.style.setProperty(
		'--s-vp-height',
		`${window.innerHeight}px`
	);
}

// ***GLOBAL VARIABLES***

function getVsObj() {
	const vs = {
		tabletBreakpoint: 1024,
		mobileBreakpoint: 600,
	};

	if (typeof window === 'undefined') {
		return false;
	}

	vs.isTouchDevice = window.matchMedia('(any-hover: none)').matches;
	vs.isTabletScreen = vs.tabletBreakpoint >= innerWidth ? true : false;
	vs.isMobileScreen = vs.mobileBreakpoint >= innerWidth ? true : false;
	vs.hasLocalStorage = () => {
		try {
			var storage = window['localStorage'],
				x = '__storage_test__';
			storage.setItem(x, x);
			storage.removeItem(x);
			return true;
		} catch (e) {
			return false;
		}
	};
	vs.browserType = () => {
		if (
			(navigator.userAgent.indexOf('Opera') ||
				navigator.userAgent.indexOf('OPR')) != -1
		) {
			return 'Opera';
		} else if (navigator.userAgent.indexOf('Chrome') != -1) {
			return 'Chrome';
		} else if (navigator.userAgent.indexOf('Safari') != -1) {
			return 'Safari';
		} else if (navigator.userAgent.indexOf('Firefox') != -1) {
			return 'Firefox';
		} else if (
			navigator.userAgent.indexOf('MSIE') != -1 ||
			!!document.documentMode === true
		) {
			return 'IE';
		} else {
			return 'Unknown';
		}
	};

	return vs;
}

export function VS() {
	const [vsObj, setVsObj] = useState(getVsObj());

	useEffect(() => {
		function handleResize() {
			setVsObj(getVsObj());
		}
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return vsObj;
}
