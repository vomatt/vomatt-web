import React, { ReactNode } from 'react';

type MainProps = {
	children: ReactNode;
};

export function Main({ children }: MainProps) {
	return (
		// Padding keeps content clear of the mobile header, the TabBar or a bottom prompt over it, and of a landscape
		// iPhone's notch: the expanded sidebar already covers the left one
		<main
			id="main"
			className="min-w-0 flex-1 min-h-svh pt-header-space-0 pb-[max(var(--tabbar-space),var(--cookie-banner-space,0px))] ps-[env(safe-area-inset-left)] pe-[env(safe-area-inset-right)] md:peer-data-[state=expanded]:ps-0"
		>
			{children}
		</main>
	);
}
