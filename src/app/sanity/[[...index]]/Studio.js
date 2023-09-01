'use client';

import { NextStudio } from 'next-sanity/studio';
import { StudioLayout, StudioProvider } from 'sanity';
import config from 'sanity.config';
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle(({ theme }) => ({
	html: { backgroundColor: theme.sanity.color.base.bg },
	body: { margin: '0' },
}));

export default function StudioPage() {
	return (
		<>
			<div className="sanity-studio-root">
				<NextStudio config={config}>
					<StudioProvider config={config}>
						<GlobalStyle />
						{/* Put components here and you'll have access to the same React hooks as Studio gives you when writing plugins */}
						<StudioLayout />
					</StudioProvider>
				</NextStudio>
			</div>
			<style global jsx>{`
				.sanity-studio-root button[aria-label='Create new document'] {
					display: none;
				}
			`}</style>
		</>
	);
}
