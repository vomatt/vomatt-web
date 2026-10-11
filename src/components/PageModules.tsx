'use client';

import dynamic from 'next/dynamic';
import React from 'react';

import type { FreeformData } from '@/components/Freeform';
import Img, { type ImgSource } from '@/components/Image';

const Carousel = dynamic(() => import('./Carousel'));
const Freeform = dynamic(() => import('./Freeform'), {
	loading: () => <p>Loading...</p>,
});

type PageModule = FreeformData & {
	_type: string;
	autoplay?: boolean;
	autoplayInterval?: number;
	items?: ImgSource[];
};

type PageModulesProps = {
	module: PageModule;
};

export default function PageModules({ module }: PageModulesProps) {
	const type = module._type;

	switch (type) {
		case 'freeform':
			return <Freeform data={module} />;

		case 'carousel':
			return (
				<Carousel
					isAutoplay={module.autoplay}
					autoplayDuration={(module.autoplayInterval ?? 3) * 1000}
				>
					{module.items?.map((el, index) => (
						<Img key={index} image={el} />
					))}
				</Carousel>
			);

		default:
			return null;
	}
}
