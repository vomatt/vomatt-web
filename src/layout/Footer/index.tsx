import {
	AnimatePresence,
	domAnimation,
	LazyMotion,
	motion,
} from 'framer-motion';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef } from 'react';

import Menu from '@/components/Menu';
import { pageTransitionFade } from '@/lib/animate';

function Footer({ siteData, data }) {
	const pathname = usePathname();
	const footerRef = useRef(undefined);

	return (
		<>
			<LazyMotion features={domAnimation}>
				<AnimatePresence mode="wait">
					<motion.footer
						ref={footerRef}
						key={pathname}
						initial="initial"
						animate="animate"
						exit="exit"
						variants={pageTransitionFade}
						className="g-footer cr-white bg-black"
					>
						<div className="footer-interior">
							{data?.menu?.items && (
								<Menu
									items={data.menu.items}
									className="footer-links"
									ulClassName="f-h f-a-c f-j-s t-b-2 user-select-disable"
								/>
							)}
						</div>

						<div className="footer-base f-h f-a-c">
							<div className="footer-copyright">
								© {new Date().getFullYear()} {siteData.title}
							</div>

							{data?.menuLegal?.items && (
								<Menu
									items={data.menuLegal.items}
									className="footer-legal"
									ulClassName="f-h f-a-c t-b-2"
								/>
							)}
						</div>
					</motion.footer>
				</AnimatePresence>
			</LazyMotion>

			<style global jsx>{`
				.footer-interior {
					padding: 20px var(--s-contain);
				}

				.footer-base {
					padding: 10px var(--s-contain);
					border-top: 1px solid var(--cr-subtle);
				}

				.footer-links {
					ul {
						gap: 10px;
					}
				}

				.footer-legal {
					ul {
						gap: 10px;
					}
				}
			`}</style>
		</>
	);
}

export default Footer;
