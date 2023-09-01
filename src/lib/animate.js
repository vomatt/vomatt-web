export const pageTransitionFade = {
	initial: {
		opacity: 0,
	},
	animate: {
		opacity: 1,
		transition: { delay: 0.4, duration: 0.8 },
	},
	exit: {
		opacity: 0,
		transition: { duration: 0.4 },
	},
};

export const fadeAnim = {
	show: {
		opacity: 1,
		transition: {
			duration: 0.2,
			when: 'beforeChildren',
		},
	},
	hide: {
		opacity: 0,
		transition: {
			duration: 0.2,
			when: 'beforeChildren',
		},
	},
};
