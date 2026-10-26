import '@testing-library/jest-dom';

// jsdom has no ResizeObserver; components measure with it on hover and open
global.ResizeObserver ??= class {
	observe() {}
	unobserve() {}
	disconnect() {}
};

// Base UI dispatches a PointerEvent on click, which jsdom lacks (node-environment suites have no window)
if (typeof window !== 'undefined') window.PointerEvent ??= MouseEvent as unknown as typeof PointerEvent;

// Every profile hover card carries the Follow button, whose Server Actions reach the
// auth stack (jose, cookies). Client tests get stubs; the service's own test unmocks it.
jest.mock('@/features/follows/service', () => ({
	followUser: jest.fn().mockResolvedValue({ ok: true }),
	unfollowUser: jest.fn().mockResolvedValue({ ok: true }),
	getFollowedUsers: jest.fn().mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } }),
	getFollowers: jest.fn().mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } }),
	getFollowing: jest.fn().mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } }),
}));
