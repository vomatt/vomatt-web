'use client';

import dynamic from 'next/dynamic';
import React from 'react';

import Img from '@/components/Image';

const Marquee = dynamic(() => import('./Marquee'));
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

		case 'marquee':
			return <Marquee data={module} />;

		default:
			return null;
	}
}
