import cx from 'classnames';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import CustomPortableText from '@/components/CustomPortableText';

import { formatNumberSuffix } from '../../lib/helpers';

const Announcement = ({ data }) => {
	const pathname = usePathname();
	const { display, messages } = data || {};
	const announcementRef = useRef();
	const [isDisplay, setDisplay] = useState(false);
	const [activeBlock, setActiveBlock] = useState(0);
	const [isAutoplay, setAutoplay] = useState(data?.autoplay);

	const updateActiveBlock = (key) => {
		setActiveBlock(key);
		setAutoplay(false);
	};

	const getAnnouncementHeight = useCallback(() => {
		const blockHeight =
			announcementRef.current?.querySelector('.block.is-active')
				?.offsetHeight || 0;
		const dotsHeight =
			announcementRef.current?.querySelector('.announcement-dots')
				?.offsetHeight || 0;

		const height = blockHeight + dotsHeight;

		return {
			height: height,
			visibleHeight: isDisplay ? height : 0,
		};
	}, [announcementRef, isDisplay]);

	// show announcement after page load, to avoid style flash
	useEffect(() => {
		announcementRef.current.style.display = 'block';
	}, []);

	// determine whether to display announcement bar
	useEffect(() => {
		setDisplay(
			display === 'all' || (display === 'homepage' && pathname == '/')
		);
	}, [display, pathname]);

	// changes on display change
	useEffect(() => {
		const updateRootVariable = () => {
			const { visibleHeight } = getAnnouncementHeight();

			document.documentElement.style.setProperty(
				'--s-announcement',
				`${visibleHeight}px`
			);
		};

		updateRootVariable();
		const { height, visibleHeight } = getAnnouncementHeight();
		announcementRef.current.style.marginTop = `${visibleHeight - height}px`;

		setTimeout(() => {
			announcementRef.current.style.transition = `margin 0.4s, height 0.4s 0.2s`;
		}, 400);
	}, [isDisplay, getAnnouncementHeight]);

	// changes on active block change
	useEffect(() => {
		// update announcement height, so it transitions nicely
		const { height, visibleHeight } = getAnnouncementHeight();
		announcementRef.current.style.height = `${height}px`;

		// set dynamic announcement height at root
		setTimeout(() => {
			document.documentElement.style.setProperty(
				'--s-announcement-dynamic',
				`${visibleHeight}px`
			);
		}, 600);

		// autoplay
		const interval = data?.autoplay_interval || 8;
		const autoplayInterval =
			isAutoplay && isDisplay
				? setInterval(() => {
						const activeBlockNext =
							activeBlock < data?.messages.length - 1 ? activeBlock + 1 : 0;
						setActiveBlock(activeBlockNext);
				  }, interval * 1000)
				: null;

		return () => clearInterval(autoplayInterval);
	}, [activeBlock, isAutoplay, isDisplay, data, getAnnouncementHeight]);

	return (
		<>
			<div ref={announcementRef} className="g-announcement">
				{messages && (
					<div className="announcement-blocks">
						{messages.map((el, key) => {
							if (el.content)
								return (
									<div
										key={key}
										className={cx('block', { 'is-active': activeBlock == key })}
									>
										<CustomPortableText blocks={el.content} />
									</div>
								);
						})}
					</div>
				)}
				{messages && (
					<div className="announcement-dots f-h f-a-c f-j-c">
						{messages.map((el, key) => {
							return (
								<button
									type="button"
									key={key}
									data-announcement-trigger={key}
									aria-label={`Jump to the ${formatNumberSuffix(
										key + 1
									)} message`}
									className={cx({ 'is-active': activeBlock == key })}
									onClick={() => updateActiveBlock(key)}
								></button>
							);
						})}
					</div>
				)}
			</div>
			<style jsx>{`
				.g-announcement {
					--dot-size: 10px;
					--dot-gap: 8px;
					--color: ${data?.textColor?.hex || '#FFFFFF'};
					--background: ${data?.backgroundColor?.hex || '#000000'};
					--emphasize: ${data?.emphasizeColor?.hex || '#D5FF00'};
					display: none;
					position: relative;
					text-align: center;
					color: var(--color);
					background-color: var(--background);

					&:empty {
						display: none;
					}

					.announcement-blocks {
						position: relative;

						.block {
							position: relative;
							width: 100%;
							top: 0;
							left: 0;
							padding: 10px 0;
							transition: opacity 0.4s 0.4s;

							:global(b),
							:global(strong) {
								color: var(--emphasize);
							}

							&:not(.is-active) {
								position: absolute;
								opacity: 0;
								pointer-events: none;
								transition-delay: 0s;
							}
						}
					}

					.announcement-dots {
						position: absolute;
						width: 100%;
						left: 0;
						bottom: 0;
						padding: 0 10px 6px;
						gap: var(--dot-gap);

						button {
							position: relative;
							width: var(--dot-size);
							height: var(--dot-size);
							border: 1px solid;
							border-radius: 100%;
							transition: background 0.2s, border 0.2s;

							&:after {
								content: '';
								position: absolute;
								top: 50%;
								left: 50%;
								width: calc(var(--dot-size) + var(--dot-gap));
								height: calc(var(--dot-size) + var(--dot-gap));
								transform: translate3d(-50%, -50%, 0);
							}

							&.is-active {
								color: var(--emphasize);
								background-color: var(--emphasize);
							}

							@media (hover: hover) {
								&:hover {
									color: var(--emphasize);
								}
							}
						}
					}
				}
			`}</style>
		</>
	);
};

export default Announcement;
