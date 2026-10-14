import { Card, Flex, Text } from '@sanity/ui';
import {
	getPublishedId,
	type ObjectFieldProps,
	type SlugValue,
	useEditState,
	useFormValue,
} from 'sanity';

import { resolveHref } from '@/lib/utils';

// The Studio is served from the site itself, so the page lives on the same origin
export function getUrl({
	docType,
	slug,
}: {
	docType: string | undefined;
	slug: string | undefined;
}) {
	const href = resolveHref({ documentType: docType, slug });
	if (!href) return undefined;

	return new URL(href, window.location.origin).toString();
}

export const SlugField = (props: ObjectFieldProps<SlugValue>) => {
	const { children, title, description, value } = props;
	const docType = useFormValue([`_type`]) as string | undefined;
	const docId = useFormValue([`_id`]) as string | undefined;
	// The site only serves published content, so link to the published slug
	const { published } = useEditState(getPublishedId(docId ?? ''), docType ?? '');
	const publishedSlug = (published?.slug as SlugValue | undefined)?.current;

	const pageUrl = published
		? getUrl({ docType, slug: publishedSlug })
		: undefined;

	return (
		<Card tone={(value?.current?.length ?? 0) > 15 ? 'caution' : 'positive'}>
			<Card paddingY={2}>
				<Flex>
					<Card flex={1}>
						<Text size={1} weight="semibold">
							{title}
						</Text>
					</Card>
					{pageUrl && (
						<Flex>
							<Text size={1} weight="semibold">
								<a href={pageUrl} target="_blank" rel="noreferrer">
									View page
								</a>
							</Text>
						</Flex>
					)}
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
