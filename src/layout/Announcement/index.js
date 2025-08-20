import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import CustomPortableText from '@/components/CustomPortableText';

import { formatNumberSuffix } from '../../lib/utils';

export default function Announcement({ data }) {
	const pathname = usePathname();
	const { display, messages } = data || {};
	const announcementRef = useRef(null);

	const [isDisplay, setDisplay] = useState(false);
	const [activeBlock, setActiveBlock] = useState(0);
	const [isAutoplay, setAutoplay] = useState(data?.autoplay);

	const updateActiveBlock = (index) => {
		setActiveBlock(index);
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
		const announcementElement = announcementRef.current;
		const updateRootVariable = () => {
			const { visibleHeight } = getAnnouncementHeight();

			document.documentElement.style.setProperty(
				'--s-announcement',
				`${visibleHeight}px`
			);
		};

		updateRootVariable();
		if (announcementElement) {
			const { height, visibleHeight } = getAnnouncementHeight();
			announcementElement.style.marginTop = `${visibleHeight - height}px`;

			setTimeout(() => {
				announcementElement.style.transition = `margin 0.4s, height 0.4s 0.2s`;
			}, 400);
		}
	}, [isDisplay, announcementRef, getAnnouncementHeight]);

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
		const interval = data?.autoplayInterval || 8;
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
						{messages.map((el, index) => {
							if (el.content)
								return (
									<div
										key={index}
										className={clsx('block', {
											'is-active': activeBlock == index,
										})}
									>
										<CustomPortableText blocks={el.content} />
									</div>
								);
						})}
					</div>
				)}
				{messages && messages.length > 1 && (
					<div className="announcement-dots f-h f-a-c f-j-c">
						{messages.map((el, index) => {
							return (
								<button
									type="button"
									key={index}
									data-announcement-trigger={index}
									aria-label={`Jump to the ${formatNumberSuffix(
										index + 1
									)} message`}
									className={clsx({ 'is-active': activeBlock == index })}
									onClick={() => updateActiveBlock(index)}
								></button>
							);
						})}
					</div>
				)}
			</div>

			<style jsx>{`
				.g-announcement {
					--color: ${data?.textColor?.hex || '#FFFFFF'};
					--background: ${data?.backgroundColor?.hex || '#000000'};
					--emphasize: ${data?.emphasizeColor?.hex || '#D5FF00'};
				}
			`}</style>
		</>
	);
}
