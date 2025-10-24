import '@/styles/global.css';

import clsx from 'clsx';
import { Geist, Geist_Mono } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';

import BrandLogo from '@/components/BrandLogo';
import { Layout } from '@/components/layout';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { imageBuilder } from '@/sanity/lib/image';
import { sanityFetch } from '@/sanity/lib/live';
import { siteDataQuery } from '@/sanity/lib/queries';

import { handleError } from '../client-utils';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

async function getServerLanguage(): Promise<string> {
	try {
		const cookieStore = await cookies();
		const headersList = await headers();

		// Try cookie first
		const cookieLanguage = cookieStore.get('preferred-language')?.value;
		if (cookieLanguage) return cookieLanguage;

		// Fallback to middleware-detected language
		const detectedLanguage = headersList.get('x-detected-language');
		return detectedLanguage || 'en';
	} catch {
		return 'en';
	}
}

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

	const serverLanguage = await getServerLanguage();

	return (
		<html
			lang={serverLanguage}
			className={clsx('dark', geistSans.variable, geistMono.variable)}
		>
			<body className="text-foreground font-sans">
				{process.env.NODE_ENV === 'production' ? (
					<div className="h-screen flex flex-col justify-center items-center gap-5">
						<div className="md:w-40 text-secondary-foreground w-28">
							<BrandLogo />
						</div>
						<h2>Coming soon</h2>
					</div>
				) : (
					<LanguageProvider>
						<Layout siteData={data}>{children}</Layout>
						<Toaster />
					</LanguageProvider>
				)}
			</body>
		</html>
	);
}
