import { LinkIcon, MasterDetailIcon, SearchIcon } from '@sanity/icons';
import { Autocomplete, Card, Flex, Stack, Text } from '@sanity/ui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { set, unset } from 'sanity';

import { slugify } from '@/lib/helpers';
import { getRoute } from '@/lib/routes';
import { client } from '@/sanity/lib/client';
import * as queries from '@/sanity/lib/queries';

export const LinkInput = (props) => {
	const { elementProps, onChange, schemaType, validation, value = '' } = props;

	const [loading, setLoading] = useState(true);
	const [options, setOptions] = useState([]);
	const [query, setQuery] = useState('');

	const optionsList = useMemo(() => {
		if (!query) {
			return options;
		}

		const queryInOptions = options.filter((item) => {
			const { value } = item || null;
			const data = JSON.parse(value);
			if (
				slugify(data.title).includes(query.toLowerCase()) ||
				data.slug.includes(query.toLowerCase())
			) {
				return item;
			}
		});

		if (queryInOptions.length === 0) {
			return [
				{
					value: JSON.stringify({
						url: query,
						pageTitle: query,
						slug: query,
						_type: 'externalUrl',
					}),
					isNew: true,
				},
			];
		}
		return queryInOptions;
	}, [query, options]);

	const handleChange = useCallback(
		(value) => {
			return onChange(value ? set(value) : unset());
		},
		[onChange]
	);

	const handleQueryChange = useCallback((query) => {
		setQuery(query);
	}, []);

	const getOptionListData = async ({ groqQuery }) => {
		const homePageID = await client.fetch(queries.homeID);
		const data = await client.fetch(groqQuery);
		const result = data.map((item) => {
			const { _type, slug, _id, title } = item;
			const routeSlug = homePageID === _id ? '' : slug;

			return {
				value: JSON.stringify({
					url: getRoute({ type: _type, slug: routeSlug }),
					pageTitle: title,
					_type,
					_id,
					slug,
				}),
			};
		});

		setOptions(result);
		setLoading(false);
	};

	useEffect(() => {
		const groqQuery = `*[_type == "pGeneral"]{
			title,
			_type,
			_id,
			"slug": slug.current,
		}`;
		getOptionListData({ groqQuery });
	}, []);

	return (
		<Card>
			<Autocomplete
				{...elementProps}
				loading={loading}
				disabled={loading}
				options={optionsList}
				value={value}
				openButton
				onChange={handleChange}
				onQueryChange={handleQueryChange}
				icon={SearchIcon}
				placeholder="Type to find page"
				renderOption={(option) => {
					const { value, isNew } = option;
					const data = JSON.parse(value);

					return (
						<Card as="button" padding={[4, 2]}>
							<Flex align="center">
								{isNew ? (
									<LinkIcon style={{ fontSize: 36 }} />
								) : (
									<MasterDetailIcon style={{ fontSize: 36 }} />
								)}
								<Stack space={2}>
									<Text size={[1, 1, 2]}>{data.pageTitle}</Text>
									<Text size={1} muted>{`${isNew ? '' : '/'}${
										data.slug
									}`}</Text>
								</Stack>
							</Flex>
						</Card>
					);
				}}
				renderValue={(value, option) => {
					if (!value) {
						return null;
					}
					const data = JSON.parse(value);
					return data.pageTitle;
				}}
			/>
		</Card>
	);
};
