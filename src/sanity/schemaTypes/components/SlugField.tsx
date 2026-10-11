import { Card, Flex, Text } from '@sanity/ui';
import { type ObjectFieldProps, type SlugValue, useFormValue } from 'sanity';

import { getWindowURl } from '@/lib/routes';

export function getUrl({
	docType,
	slug,
	docId,
}: {
	docType: string | undefined;
	slug: string | undefined;
	docId: string | undefined;
}) {
	const baseUrl = getWindowURl(window.location.host);
	const baseApiUrl = '/api/view-page';
	const queryParams = [];

	queryParams.push(`documentType=${docType}`);
	queryParams.push(`docId=${docId}`);

	if (slug) {
		queryParams.push(`slug=${slug}`);
	}

	const queryString = queryParams.join('&');
	const url = `${baseUrl}${baseApiUrl}?${queryString}`;

	return url;
}

export const SlugField = (props: ObjectFieldProps<SlugValue>) => {
	const { children, title, description, value } = props;
	const docType = useFormValue([`_type`]) as string | undefined;
	const docId = useFormValue([`_id`]) as string | undefined;

	const pageUrl = getUrl({
		docType,
		docId,
		slug: value?.current,
	});

	return (
		<Card tone={(value?.current?.length ?? 0) > 15 ? 'caution' : 'positive'}>
			<Card paddingY={2}>
				<Flex>
					<Card flex={1}>
						<Text size={1} weight="semibold">
							{title}
						</Text>
					</Card>
					<Flex>
						<Text size={1} weight="semibold">
							<a href={pageUrl} target="_blank">
								View page
							</a>
						</Text>
					</Flex>
				</Flex>
			</Card>
			<Card paddingTop={1} paddingBottom={2}>
				<Text size={1} muted>
					{description}
				</Text>
			</Card>
			<Card>{children}</Card>
		</Card>
	);
};
