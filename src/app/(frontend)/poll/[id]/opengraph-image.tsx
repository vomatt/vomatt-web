import { ImageResponse } from 'next/og';

import { getPoll } from '@/features/polls/service';

export const alt = 'A poll on vomatt';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const MAX_OPTIONS = 4;

// Hex approximations of the light theme tokens in styles/global.css (Satori has no oklch)
const color = {
	background: '#f2f3f6',
	card: '#ffffff',
	foreground: '#1e2b4d',
	muted: '#5d6580',
	border: '#e4e6eb',
};

// Noto Sans TC subset to the drawn text, so Traditional Chinese polls render too.
// Without a browser User-Agent, Google Fonts serves TTF, which Satori can read.
async function loadFont(text: string): Promise<ArrayBuffer | null> {
	try {
		const css = await fetch(
			`https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@500&text=${encodeURIComponent(text)}`,
		).then((res) => res.text());
		const url = css.match(/src: url\((.+?)\) format/)?.[1];
		if (!url) return null;
		const res = await fetch(url);
		return res.ok ? await res.arrayBuffer() : null;
	} catch {
		return null;
	}
}

type Props = { params: Promise<{ id: string }> };

export default async function Image({ params }: Props) {
	const { id } = await params;
	// Unfurlers send no cookies: a Poll this viewer can't open gets the brand card
	const poll = await getPoll(id).catch(() => null);

	const title = poll?.title ?? 'vomatt';
	const context = poll?.description?.trim() ?? '';
	const options = poll?.options.slice(0, MAX_OPTIONS).map((option) => option.text) ?? [];
	const more = (poll?.options.length ?? 0) - options.length;
	const moreLabel = more > 0 ? `+${more}` : '';

	const font = await loadFont(['vomatt', title, context, moreLabel, ...options].join(''));

	return new ImageResponse(
		(
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					width: '100%',
					height: '100%',
					padding: 64,
					background: color.background,
					color: color.foreground,
					fontFamily: font ? 'Noto Sans TC' : undefined,
				}}
			>
				<div style={{ display: 'flex', fontSize: 28, color: color.muted }}>vomatt</div>
				<div
					style={{
						display: 'block',
						marginTop: 20,
						fontSize: 56,
						lineHeight: 1.15,
						letterSpacing: '-0.02em',
						lineClamp: 2,
					}}
				>
					{title}
				</div>
				{context && (
					<div
						style={{
							display: 'block',
							marginTop: 16,
							fontSize: 28,
							lineHeight: 1.35,
							color: color.muted,
							lineClamp: 2,
						}}
					>
						{context}
					</div>
				)}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
					{options.map((text) => (
						<div
							key={text}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 16,
								padding: '14px 24px',
								borderRadius: 16,
								border: `1px solid ${color.border}`,
								background: color.card,
								fontSize: 28,
							}}
						>
							<div
								style={{
									width: 20,
									height: 20,
									borderRadius: 999,
									border: `2px solid ${color.foreground}`,
								}}
							/>
							<div style={{ display: 'block', lineClamp: 1 }}>{text}</div>
						</div>
					))}
					{moreLabel && (
						<div style={{ display: 'flex', fontSize: 24, color: color.muted }}>{moreLabel}</div>
					)}
				</div>
			</div>
		),
		{
			...size,
			fonts: font ? [{ name: 'Noto Sans TC', data: font, weight: 500, style: 'normal' }] : undefined,
		},
	);
}
