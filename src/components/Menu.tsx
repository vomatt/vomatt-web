import cx from 'classnames';
import { usePathname } from 'next/navigation';
import React from 'react';

import CMSLink from '@/components/CMSLink';
import Dropdown from '@/components/MenuDropdown';
import { checkIfActive, getLinkRouteObject } from '@/lib/routes';
export interface MenuProps {
	items: any;
	hasFocus?: Boolean;
	onClick?: () => void;
	className?: string;
	ulClassName?: string;
}

const Menu = (props: MenuProps) => {
	const { items, hasFocus = true, onClick, className, ulClassName } = props;

	const pathName = usePathname();

	if (!items) return null;

	return (
		<div className={className || ''}>
			<ul className={ulClassName || ''}>
				{items.map((item, index) => {
					const { link, dropdownItems } = item ?? {};
					const isDropdown = !!dropdownItems;

					if (isDropdown) {
						const isActive =
							dropdownItems.filter((item) => {
								return checkIfActive({
									pathName: pathName,
									url: getLinkRouteObject(item?.link)?.route?.url,
								});
							}).length > 0;

						return (
							<li key={index} className={cx({ 'is-active': isActive })}>
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

					const isActive = checkIfActive({
						pathName: pathName,
						url: getLinkRouteObject(link)?.route?.url,
					});

					return (
						<li key={index} className={cx({ 'is-active': isActive })}>
							<CMSLink
								link={link}
								onClick={onClick}
								title={item.title}
								tabIndex={!hasFocus ? -1 : null}
								className="t-l-1"
							/>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default Menu;
