import '@/styles/global.css';

import cx from 'classnames';
import { DM_Sans, Inter, Montagu_Slab } from 'next/font/google';
import React, { ReactNode } from 'react';
import { draftMode } from 'next/headers';
import { getCurrentUser } from '@/data/auth';
import Layout from '@/layout';
import { imageBuilder } from '@/sanity/lib/image';
import { sanityFetch } from '@/sanity/lib/live';
import { SanityLive } from '@/sanity/lib/live';
import { siteDataQuery } from '@/sanity/lib/queries';
import DraftModeToast from '@/components/DraftModeToast';
import { handleError } from '../client-utils';
import { Toaster } from 'sonner';
import { VisualEditing } from 'next-sanity';

const inter = Inter({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-inter',
});

const montagu_slab = Montagu_Slab({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-montagu-slab',
});

const dm_sans = DM_Sans({
	subsets: ['latin'],
	display: 'swap',
	weight: ['400', '500', '700'],
	style: ['normal', 'italic'],
	variable: '--font-dm-sans',
});

export async function generateMetadata() {
	const {
		data: { sharing },
	} = await sanityFetch({
		query: siteDataQuery,
		tags: ['settingsGeneral'],
		stega: false,
	});

	const { siteTitle } = sharing || {};
	const siteFavicon = sharing?.favicon || false;
	const siteFaviconUrl = siteFavicon
		? imageBuilder.image(siteFavicon).width(256).height(256).url()
		: '/favicon.ico';

	const siteFaviconLight = sharing?.faviconLight || false;
	const siteFaviconLightUrl = siteFaviconLight
		? imageBuilder.image(siteFaviconLight).width(256).height(256).url()
		: siteFaviconUrl;

	const shareGraphic = sharing?.shareGraphic?.asset;
	const shareGraphicUrl = shareGraphic
		? imageBuilder.image(shareGraphic).format('webp').width(1200).url()
		: null;

	const shareVideoUrl = sharing?.shareVideo || null;

	return {
		metadataBase: new URL(process.env.SITE_URL || ''),
		title: {
			template: `%s | ${siteTitle}`,
			default: siteTitle,
		},
		creator: siteTitle,
		publisher: siteTitle,
		applicationName: siteTitle,
		openGraph: {
			title: siteTitle,
			images: [
				{
					url: shareGraphicUrl,
					width: 1200,
					height: 630,
				},
			],
			videos: [
				{
					url: shareVideoUrl,
					width: 1200,
					height: 630,
					type: 'video/mp4',
				},
			],
			url: process.env.SITE_URL,
			siteName: siteTitle,
			locale: 'en_US',
			type: 'website',
		},
		icons: {
			icon: [
				{
					url: siteFaviconUrl,
					media: '(prefers-color-scheme: light)',
				},
				{
					url: siteFaviconLightUrl,
					media: '(prefers-color-scheme: dark)',
				},
			],
		},
	};
}

export default async function RootLayout({
	children,
}: {
	children: ReactNode;
}) {
	const { isEnabled } = await draftMode();
	const { data } = await sanityFetch({
		query: siteDataQuery,
		tags: [
			'gAnnouncement',
			'gHeader',
			'gFooter',
			'settingsMenu',
			'settingsGeneral',
			'settingsIntegration',
			'settingsBrandColors',
		],
	});
	const userSession = await getCurrentUser();

	return (
		<html
			lang="en"
			className={cx(
				'bg-black',
				inter.variable,
				montagu_slab.variable,
				dm_sans.variable
			)}
		>
			<body>
				<Layout siteData={data} userSession={userSession}>
					{children}
				</Layout>
				<SanityLive onError={handleError} />
				<Toaster />
				{isEnabled && (
					<>
						<DraftModeToast />
						<VisualEditing />
					</>
				)}
			</body>
		</html>
	);
}
