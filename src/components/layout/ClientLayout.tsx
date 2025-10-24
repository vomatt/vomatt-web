'use client';
import { ReactNode, useEffect, useState } from 'react';

import BrandLogo from '@/components/BrandLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export const ClientLayout = ({ children }: { children: ReactNode }) => {
	const { isInitialized, isLoading } = useLanguage();
	const [showContent, setShowContent] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setShowContent(true), 200);

		if (isInitialized && !isLoading) {
			setShowContent(true);
		}

		return () => clearTimeout(timer);
	}, [isInitialized, isLoading]);

	return showContent ? (
		children
	) : (
		<div
			className={cn(
				'absolute top-1/2 left-1/2 w-xs -translate-1/2 animate-pulse'
			)}
		>
			<BrandLogo />
		</div>
	);
};
