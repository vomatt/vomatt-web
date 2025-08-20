import clsx from 'clsx';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { NextButton, PrevButton } from './nav-button';

const Carousel = ({
	itemWidth,
	gap,
	children,
	align,
	isLoop,
	overflow,
	draggable = true,
	className,
	isShowNavButton = true,
	autoplayDuration = 3000,
	isAutoplay = false,
}) => {
	const autoplay = useRef(
		Autoplay(
			{
				delay: autoplayDuration,
				stopOnInteraction: false,
				playOnInit: isAutoplay,
			},
			(emblaRoot) => emblaRoot.parentElement
		)
	);

	const [viewportRef, embla] = useEmblaCarousel(
		{
			align: align ? align : 'start',
			draggable: draggable,
			loop: isLoop,
			containScroll: 'trimSnaps',
		},
		[WheelGesturesPlugin(), autoplay.current]
	);

	const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
	const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

	const scrollPrev = useCallback(() => embla && embla.scrollPrev(), [embla]);
	const scrollNext = useCallback(() => embla && embla.scrollNext(), [embla]);
	const onSelect = useCallback(() => {
		if (!embla) return;
		setPrevBtnEnabled(embla.canScrollPrev());
		setNextBtnEnabled(embla.canScrollNext());
	}, [embla]);

	useEffect(() => {
		if (!embla) return;

		embla.on('select', onSelect);
		onSelect();
	}, [embla, onSelect]);

	return (
		<>
			<div className={clsx('carousel', className)}>
				<div
					ref={viewportRef}
					className="carousel-viewport"
					style={{ padding: overflow ? '40px 0 0' : null }}
				>
					<div className="carousel-container">
						{children.map((set, i) => (
							<div className="carousel-slide" key={i}>
								{set}
							</div>
						))}
					</div>
				</div>
				{isShowNavButton && (
					<div className="nav-buttons f-h-center c">
						<PrevButton onClick={scrollPrev} enabled={prevBtnEnabled} />
						<NextButton onClick={scrollNext} enabled={nextBtnEnabled} />
					</div>
				)}
			</div>
			<style jsx>{`
				.carousel {
					position: relative;
					overflow: hidden;
				}

				.carousel-viewport {
					overflow: hidden;
					width: 100%;
				}

				.carousel-container {
					display: flex;
					user-select: none;
					-webkit-touch-callout: none;
					-khtml-user-select: none;
					-webkit-tap-highlight-color: transparent;
				}

				.carousel-slide {
					position: relative;
					flex: 0 0 ${itemWidth};
					margin-right: ${gap ? gap : '0'};
				}

				:global(.carousel-button) {
					width: 40px;
					height: 40px;
					padding: 6px;
					color: var(--cr-blue);
					border-radius: 50%;
					background-color: transparent;
					touch-action: manipulation;
					z-index: 1;
					&:disabled {
						cursor: default;
						opacity: 0.3;
					}
				}

				.nav-buttons {
					margin: 30px auto 0;
				}
			`}</style>
		</>
	);
};

export default Carousel;
