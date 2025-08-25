import React, { ReactNode } from 'react';

type MainProps = {
	children: ReactNode;
};

export function Main({ children }: MainProps) {
	return (
		<main id="main" className="mt-header min-h-[var(--h-main)]">
			{children}
		</main>
	);
}
