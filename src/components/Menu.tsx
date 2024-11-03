import cx from 'classnames';
import { usePathname } from 'next/navigation';
import React from 'react';

import CMSLink from '@/components/CMSLink';
import Dropdown from '@/components/MenuDropdown';
import { checkIfActive } from '@/lib/routes';
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
				{items.map((item: any, index: number) => {
					const { link, dropdownItems } = item ?? {};
					const isDropdown = !!dropdownItems;

					if (isDropdown) {
						const isActive =
							dropdownItems.filter((item: any) => {
								return checkIfActive({
									pathName: pathName,
									url: link.route,
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
						url: link.route,
					});

					return (
						<li key={index} className={cx({ 'is-active': isActive })}>
							<CMSLink
								link={link}
								onClick={onClick}
								title={item.title}
								tabIndex={!hasFocus ? -1 : 0}
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
