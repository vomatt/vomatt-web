import cx from 'classnames';
import { useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import React from 'react';

import CustomLink from '@/components/CustomLink';
import Dropdown from '@/components/MenuDropdown';
import { getActive, getLinkRouteObject } from '@/lib/routes';
import { MenuItem, MenuDropdownItems } from '@/types';

type MenuProps = {
	items: MenuItem[];
	hasFocus?: boolean;
	onClick?: () => void;
	className: string;
	ulClassName: string;
};

const Menu = ({
	items,
	hasFocus = true,
	onClick,
	className,
	ulClassName,
	...rest
}: MenuProps) => {
	const searchParams = useSearchParams();
	const pathName = usePathname();

	if (!items) return null;

	return (
		<div className={className || ''}>
			<ul className={ulClassName || ''} {...rest}>
				{items.map((item, key) => {
					const { link, dropdownItems } = item || {};
					const isDropdown = !!dropdownItems;

					if (isDropdown) {
						const activeDropdown =
							dropdownItems.filter((item) => {
								return getActive({
									pageSlug: getLinkRouteObject(item.link)?.slug,
									query: searchParams,
									pathName,
								});
							}).length > 0;

						return (
							<li key={key} className={cx({ 'is-active': activeDropdown })}>
								<Dropdown
									title={item.title}
									items={item.dropdownItems}
									onClick={onClick}
								/>
							</li>
						);
					}

					if (!link?.route) {
						return null;
					}

					const isActive = getActive({
						pageSlug: getLinkRouteObject(link)?.slug,
						query: searchParams,
						pathName,
					});

					return (
						<li key={key} className={cx({ 'is-active': isActive })}>
							<CustomLink
								tabIndex={!hasFocus ? -1 : null}
								link={link}
								onClick={onClick}
								title={item.title}
							/>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default Menu;
