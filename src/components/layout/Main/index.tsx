import React, { ReactNode } from 'react';

type MainProps = {
	children: ReactNode;
};

export function Main({ children }: MainProps) {
	return (
		// Bottom padding keeps content clear of the mobile TabBar
		<main id="main" className="flex-1 min-h-svh pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
			{children}
		</main>
	);
}
