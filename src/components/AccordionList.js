import React from 'react';
import Accordion from '@/components/Accordion';
import CustomPortableText from '@/components/CustomPortableText';

const AccordionList = ({ data }) => {
	const { items } = data;

	return (
		<div className="accordion-group">
			{items.map((accordion, key) => {
				return (
					<Accordion key={key} id={accordion.id} title={accordion.title}>
						<CustomPortableText blocks={accordion.content} />
					</Accordion>
				);
			})}
		</div>
	);
};

export default AccordionList;
