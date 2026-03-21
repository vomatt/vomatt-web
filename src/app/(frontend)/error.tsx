'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/Button';

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4 text-center">
			<h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
			<p className="text-sm text-muted-foreground max-w-sm">
				{error.message || 'An unexpected error occurred. Please try again.'}
			</p>
			<Button variant="outline" onClick={reset}>
				Try again
			</Button>
		</div>
	);
}
