import React, { ReactNode } from 'react';

type MainProps = {
	children: ReactNode;
};

export function Main({ children }: MainProps) {
	return (
		// Padding keeps content clear of the mobile header and TabBar
		<main id="main" className="min-w-0 flex-1 min-h-svh pt-header-space-0 pb-(--tabbar-space)">
			{children}
		</main>
	);
}
