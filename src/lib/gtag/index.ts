declare global {
	interface Window {
		gtag: (...args: unknown[]) => void;
		dataLayer: unknown[];
	}
}

// log page views
export const pageview = (url: string, gaID: string) => {
	if (typeof window.gtag !== 'undefined') {
		window.gtag('config', gaID, {
			page_path: url,
		});
	}
};

// log specific events
type GtagEvent = {
	action: string;
	params?: Record<string, unknown>;
};

export const event = ({ action, params }: GtagEvent) => {
	window?.gtag('event', action, params);
};
