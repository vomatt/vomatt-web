import type { Metadata } from 'next';

import ProfileNotFound from './_components/ProfileNotFound';

export const metadata: Metadata = { title: 'Not found' };

export default function NotFound() {
	return <ProfileNotFound />;
}
