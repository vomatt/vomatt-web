import cx from 'classnames';
import { useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

import CustomLink from '@/components/CustomLink';
import { checkIfActive, getLinkRouteObject } from '@/lib/routes';

const MenuDropdown = ({ title, items, onClick }) => {
	const searchParams = useSearchParams();
	const pathName = usePathname();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<div className={cx('dropdown', { 'is-open': isOpen })}>
				<button
					onClick={() => setIsOpen(!isOpen)}
					aria-expanded={isOpen}
					className="dropdown-toggle"
				>
					{title}
				</button>
				<div className="dropdown-content">
					<ul className="dropdown-nav">
						{items.map((item, key) => {
							const isActive = checkIfActive({
								pageSlug: getLinkRouteObject(item.link)?.slug,
								query: searchParams,
								pathName,
							});

							return (
								<li
									key={key}
									className={cx('t-l-2', { 'is-active': isActive })}
								>
									<CustomLink
										tabIndex={!isOpen ? -1 : null}
										link={item.link}
										title={item.title}
										onClick={onClick}
									/>
								</li>
							);
						})}
					</ul>
				</div>
			</div>
			<style jsx>{`
				.dropdown {
					&.is-open {
						.dropdown-content {
							opacity: 1;
							pointer-event: auto;
						}
					}
				}
				.dropdown-content {
					opacity: 0;
					pointer-event: none;
				}
				.dropdown-nav {
					position: absolute;
				}
			`}</style>
		</>
	);
};

export default MenuDropdown;
