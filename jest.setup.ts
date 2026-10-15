import '@testing-library/jest-dom';

// jsdom has no ResizeObserver; components measure with it on hover and open
global.ResizeObserver ??= class {
	observe() {}
	unobserve() {}
	disconnect() {}
};
