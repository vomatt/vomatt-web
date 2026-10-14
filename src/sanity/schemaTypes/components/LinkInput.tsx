'use client';

import { LinkIcon } from '@sanity/icons/Link';
import { MasterDetailIcon } from '@sanity/icons/MasterDetail';
import { SearchIcon } from '@sanity/icons/Search';
import { Card, Flex, Stack, Text } from '@sanity/ui';
import { Autocomplete } from '@sanity/ui/autocomplete';
import { type PortableTextBlock, toPlainText } from 'next-sanity';
import React, { useCallback, useEffect, useState } from 'react';
import { type ObjectInputProps, type SanityClient, set, useClient } from 'sanity';

import { resolveHref } from '@/lib/utils';
import { isValidUrl } from '@/lib/utils';
import { apiVersion } from '@/sanity/env';

// Page types a link can point to, in picker order; linkInput's reference field uses the same list
export const pageDocumentOrder = ['pHome', 'pGeneral'];

const typeRank = (type: string | undefined) => {
	const index = pageDocumentOrder.indexOf(type ?? '');
	return index === -1 ? pageDocumentOrder.length : index;
};

type PageQueryResult = {
	title: string | PortableTextBlock[];
	_type: string;
	_id: string;
	slug?: string;
};

type LinkOption = {
	value: string;
	payload: {
		pageTitle: string;
		route?: string;
		isInternal: boolean;
		_id?: string;
		_type?: string;
		slug?: string;
	};
	isNew?: boolean;
};

type LinkInputValue = {
	linkType?: 'internal' | 'external';
	internalLink?: { _ref: string };
	externalUrl?: string;
};

// Published pages only: a link must reference a published document
const fetchOptions = async (client: SanityClient): Promise<LinkOption[]> => {
	const groqQuery = `*[_type in $types && !(_id in path("drafts.**"))] {
		title,
		_type,
		_id,
		"slug": slug.current,
	}`;

	const data = await client.fetch<PageQueryResult[]>(groqQuery, {
		types: pageDocumentOrder,
	});

	return data
		.map(({ _type, slug, _id, title }) => ({
			value: _id,
			payload: {
				pageTitle:
					_type === 'pHome'
						? 'Home Page'
						: Array.isArray(title)
							? toPlainText(title)
							: title,
				_id,
				_type,
				slug,
				route: resolveHref({ documentType: _type, slug }),
				isInternal: true,
			},
		}))
		.sort((a, b) => typeRank(a.payload._type) - typeRank(b.payload._type));
};

const renderOption = (option: LinkOption) => {
	const { isNew, payload } = option;
	const { pageTitle, route } = payload;

	return (
		<Card as="button" padding={[4, 2]}>
			<Flex>
				{isNew ? (
					<LinkIcon style={{ fontSize: 36 }} />
				) : (
					<MasterDetailIcon style={{ fontSize: 36 }} />
				)}
				<Stack gap={2} flex={1} paddingLeft={1}>
					<Text size={[1, 1, 2]} textOverflow="ellipsis">
						{pageTitle}
					</Text>
					<Text size={1} muted>
						{route || option.value}
					</Text>
				</Stack>
			</Flex>
		</Card>
	);
};

export const LinkInput = (props: ObjectInputProps<LinkInputValue>) => {
	const { elementProps, onChange, value } = props;
	const client = useClient({ apiVersion });
	const [loading, setLoading] = useState(true);
	const [pageItemData, setPageItemData] = useState<LinkOption[]>([]);
	const [optionsList, setOptionsList] = useState<LinkOption[]>([]);

	const handleChange = useCallback(
		(selectedValue: string) => {
			if (!selectedValue) {
				const linkValue = {
					_type: 'linkInput',
					linkType: 'internal',
					internalLink: undefined,
					externalUrl: undefined,
				};
				onChange(set(linkValue));

				return;
			}

			// Find the selected option to determine if it's internal or external
			const selectedOption = optionsList.find(
				(option) => option.value === selectedValue
			);

			if (selectedOption?.payload?.isInternal) {
				// For internal pages, create the link object with reference
				const linkValue = {
					_type: 'linkInput',
					linkType: 'internal',
					internalLink: {
						_type: 'reference',
						_ref: selectedValue,
					},
					externalUrl: undefined,
				};
				return onChange(set(linkValue));
			} else {
				// For external links, create the link object with URL
				const linkValue = {
					_type: 'linkInput',
					linkType: 'external',
					internalLink: undefined,
					externalUrl: selectedValue,
				};
				return onChange(set(linkValue));
			}
		},
		[onChange, optionsList]
	);

	const handleQueryChange = useCallback(
		(query: string | null) => {
			const filteredOptions = pageItemData.filter(({ payload }) => {
				const queryLower = query?.toLowerCase() ?? '';

				return (
					payload.route?.toLowerCase().includes(queryLower) ||
					payload.pageTitle.toLowerCase().includes(queryLower) ||
					payload._id?.toLowerCase().includes(queryLower)
				);
			});

			const result: LinkOption[] = filteredOptions.length
				? filteredOptions
				: query && isValidUrl(query)
					? [
							{
								value: query,
								payload: { pageTitle: query, route: query, isInternal: false },
								isNew: true,
							},
						]
					: pageItemData;

			setOptionsList(result);
		},
		[pageItemData]
	);

	useEffect(() => {
		const loadPageItems = async () => {
			setLoading(true);
			const result = await fetchOptions(client);
			setPageItemData(result);
			setOptionsList(result);
			setLoading(false);
		};
		loadPageItems();
	}, [client]);

	// Helper function to get the current value for display
	const getCurrentValue = useCallback(() => {
		if (!value) return '';
		const { internalLink, linkType } = value;

		if (linkType === 'internal' && internalLink?._ref) {
			const referencedPage = pageItemData.find(
				(page) => page.value === internalLink._ref
			);
			if (referencedPage) {
				return referencedPage.value;
			}
			return internalLink._ref;
		}

		if (linkType === 'external' && value.externalUrl) {
			return value.externalUrl;
		}

		return '';
	}, [value, pageItemData]);

	// Helper function to get display title
	const getDisplayTitle = useCallback(
		(value: LinkInputValue | undefined) => {
			if (!value) return '';

			if (value.linkType === 'internal' && value.internalLink?._ref) {
				const referencedPage = pageItemData.find(
					(page) => page.value === value.internalLink?._ref
				);
				return referencedPage
					? referencedPage.payload.pageTitle
					: value.internalLink._ref;
			}

			if (value.linkType === 'external' && value.externalUrl) {
				return value.externalUrl;
			}

			return '';
		},

		[pageItemData]
	);

	return (
		<Autocomplete
			{...elementProps}
			loading={loading}
			disabled={loading}
			options={optionsList}
			value={getCurrentValue()}
			openButton
			filterOption={() => true}
			onChange={handleChange}
			onQueryChange={handleQueryChange}
			icon={SearchIcon}
			placeholder="Paste a link or search"
			renderOption={renderOption}
			renderValue={(currentValue, option) => {
				if (!option) {
					return getDisplayTitle(value);
				}
				return option.payload.pageTitle;
			}}
		/>
	);
};
