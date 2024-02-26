import cx from 'classnames';
import { useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

import CMSLink from '@/components/CMSLink';
import { checkIfActive } from '@/lib/routes';

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
							const { link } = item || {};
							const isActive = checkIfActive({
								pathName: pathName,
								url: link.route,
							});

							return (
								<li
									key={key}
									className={cx('t-l-2', { 'is-active': isActive })}
								>
									<CMSLink
										tabIndex={!isOpen ? -1 : null}
										link={link}
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
