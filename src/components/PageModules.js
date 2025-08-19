'use client';

import dynamic from 'next/dynamic';
import React from 'react';

import Img from '@/components/Image';

const Carousel = dynamic(() => import('./Carousel'));
const Freeform = dynamic(() => import('./Freeform'), {
	loading: () => <p>Loading...</p>,
});

export default function PageModules({ module }) {
	const type = module._type;

	switch (type) {
		case 'freeform':
			return <Freeform data={module} />;

		case 'carousel':
			return (
				<Carousel
					isShowDots={true}
					isAutoplay={module.autoplay}
					{...(module.autoplay
						? { autoplayInterval: module.autoplayInterval * 1000 }
						: {})}
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
