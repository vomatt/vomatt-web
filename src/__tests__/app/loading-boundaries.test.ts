import { existsSync } from 'fs';
import path from 'path';

const app = path.join(__dirname, '../../app/(frontend)');
const hasLoading = (segment: string) => existsSync(path.join(app, segment, 'loading.tsx'));

// Without a loading boundary a dynamic route isn't prefetched, so a tap waits on the whole server render
it.each(['(home)', 'explore', 'notifications', 'following', 'results-in', 'closing-soon', 'settings'])('%s navigates to its skeleton at once', (segment) => {
	expect(hasLoading(segment)).toBe(true);
});

// A loading boundary starts the response before notFound(), so these would answer 200 instead of 404
it.each(['[slug]', 'poll/[id]', '.'])('%s keeps a real 404 for unknown pages', (segment) => {
	expect(hasLoading(segment)).toBe(false);
});
