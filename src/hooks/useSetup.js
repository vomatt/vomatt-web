'use client';

export function siteSetup() {
	// site credit
	console.log(
		'%cSite by Eric, Klaus and Ryan \n%c',
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
