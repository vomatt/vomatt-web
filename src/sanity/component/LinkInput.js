import { LinkIcon, MasterDetailIcon, SearchIcon } from '@sanity/icons';
import { Autocomplete, Card, Flex, Stack, Text } from '@sanity/ui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { set, unset } from 'sanity';

import { getRoute } from '@/lib/routes';
import { client } from '@/sanity/lib/client';

export const LinkInput = (props) => {
	const { elementProps, onChange, schemaType, validation, value = '' } = props;

	const [loading, setLoading] = useState(true);
	const [options, setOptions] = useState([]);
	const [query, setQuery] = useState('');

	const handleChange = useCallback(
		(value) => {
			return onChange(value ? set(value) : unset());
		},
		[onChange]
	);

	const handleQueryChange = useCallback((query) => {
		setQuery(query);
	}, []);

	const optionsList = useMemo(() => {
		if (!query) {
			return options;
		}

		const queryInOptions = options.filter((item) => {
			const { value, payload } = item;
			const { pageTitle } = payload;

			if (value.includes(query.toLowerCase()) || pageTitle.includes(query)) {
				return item;
			}
		});

		if (queryInOptions.length === 0) {
			return [
				{
					value: getRoute({ documentType: 'externalUrl', slug: query }),
					payload: {
						pageTitle: query,
					},
					isNew: true,
				},
			];
		}

		return queryInOptions;
	}, [query, options]);

	useEffect(() => {
		const getOptionListData = async () => {
			const groqQuery = `*[_type == "pHome" || _type == "pGeneral" ]{
				title,
				_type,
				_id,
				"slug": slug.current,
			}`;

			const data = await client.fetch(groqQuery);
			const result = data.map((item) => {
				const { _type, slug, _id, title } = item;
				const pageTitle = _type === 'pHome' ? 'Home Page' : title;
				return {
					value: getRoute({ documentType: _type, slug: slug }),
					payload: {
						pageTitle,
						_id,
					},
				};
			});

			setOptions(result);
			setLoading(false);
		};

		getOptionListData();
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
				placeholder="Paste a link or search"
				renderOption={(option) => {
					const { value, isNew, payload } = option;
					return (
						<Card as="button" padding={[4, 2]}>
							<Flex align="center">
								{isNew ? (
									<LinkIcon style={{ fontSize: 36 }} />
								) : (
									<MasterDetailIcon style={{ fontSize: 36 }} />
								)}
								<Stack space={2}>
									<Text size={[1, 1, 2]}>{payload.pageTitle}</Text>
									<Text size={1} muted>
										{value}
									</Text>
								</Stack>
							</Flex>
						</Card>
					);
				}}
				renderValue={(value, option) => {
					if (!option) {
						return value;
					}

					return option.payload.pageTitle;
				}}
			/>
		</Card>
	);
};
