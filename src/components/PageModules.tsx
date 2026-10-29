import dynamic from 'next/dynamic';
import React from 'react';

import type { FreeformData } from '@/components/Freeform';
import Img, { type ImgSource } from '@/components/Image';
import AccordionList, { type AccordionListData } from '@/components/modules/AccordionList';
import Callout from '@/components/modules/Callout';
import Editorial, { type EditorialData } from '@/components/modules/Editorial';
import FeatureList, { type FeatureListData } from '@/components/modules/FeatureList';
import Hero from '@/components/modules/Hero';
import type { ActionsModuleData } from '@/components/modules/shared';

const Carousel = dynamic(() => import('./Carousel'));
const Freeform = dynamic(() => import('./Freeform'), {
	loading: () => <p>Loading...</p>,
});

// Every Sanity array member carries a _key
export type PageModule = { _key: string } & (
	| ({ _type: 'hero' } & ActionsModuleData)
	| ({ _type: 'editorial' } & EditorialData)
	| ({ _type: 'featureList' } & FeatureListData)
	| ({ _type: 'accordionList' } & AccordionListData)
	| ({ _type: 'callout' } & ActionsModuleData)
	| ({ _type: 'freeform' } & FreeformData)
	| {
			_type: 'carousel';
			autoplay?: boolean;
			autoplayInterval?: number;
			items?: ImgSource[];
	  }
	| { _type: 'marquee' }
);

type PageModulesProps = {
	module: PageModule;
};

export default function PageModules({ module }: PageModulesProps) {
	switch (module._type) {
		case 'hero':
			return <Hero data={module} />;

		case 'editorial':
			return <Editorial data={module} />;

		case 'featureList':
			return <FeatureList data={module} />;

		case 'accordionList':
			return <AccordionList data={module} />;

		case 'callout':
			return <Callout data={module} />;

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
