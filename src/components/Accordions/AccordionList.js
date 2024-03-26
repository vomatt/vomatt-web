import React from 'react';

import Accordion from '@/components/Accordions/Accordion';
import CustomPortableText from '@/components/CustomPortableText';

export default function AccordionList({ data }) {
	const { items } = data;

	return (
		<div className="accordion-list">
			{items.map((accordion, index) => {
				return (
					<Accordion key={index} id={accordion.id} title={accordion.title}>
						<CustomPortableText blocks={accordion.content} />
					</Accordion>
				);
			})}
		</div>
	);
}
