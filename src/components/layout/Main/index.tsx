import React, { ReactNode } from 'react';

type MainProps = {
	children: ReactNode;
};

export function Main({ children }: MainProps) {
	return (
		<main id="main" className="flex-1 min-h-[var(--h-main)]">
			{children}
		</main>
	);
}
