'use client';

import { useEffect } from 'react';

// This replaces the root layout, so neither global.css nor the reader's language reaches it:
// the styles are inline, follow the OS color scheme, and the text is in both languages.
const styles = {
	body: {
		margin: 0,
		minHeight: '100svh',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '0 16px',
		colorScheme: 'light dark',
		fontFamily: 'system-ui, -apple-system, "PingFang TC", "Noto Sans TC", sans-serif',
		textAlign: 'center',
	},
	main: { maxWidth: 400 },
	heading: { fontSize: 24, lineHeight: 1.3, margin: '0 0 12px' },
	body1: { fontSize: 16, lineHeight: 1.5, margin: '0 0 24px', opacity: 0.7 },
	button: {
		font: 'inherit',
		fontSize: 16,
		padding: '10px 20px',
		borderRadius: 8,
		border: '1px solid currentColor',
		background: 'transparent',
		color: 'inherit',
		cursor: 'pointer',
	},
} satisfies Record<string, React.CSSProperties>;

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<html lang="en">
			<body style={styles.body}>
				<title>Something went wrong · 發生錯誤</title>
				<main style={styles.main}>
					<h1 style={styles.heading}>
						Something went wrong
						<br />
						<span lang="zh-Hant">發生錯誤</span>
					</h1>
					<p style={styles.body1}>
						Please try again. If it keeps happening, come back in a few minutes.
						<br />
						<span lang="zh-Hant">請再試一次。如果問題持續發生，請過幾分鐘再回來。</span>
					</p>
					{/* retry refetches the page; reset would only re-render the same failure */}
					<button type="button" style={styles.button} onClick={() => retry()}>
						Try again · <span lang="zh-Hant">再試一次</span>
					</button>
				</main>
			</body>
		</html>
	);
}
