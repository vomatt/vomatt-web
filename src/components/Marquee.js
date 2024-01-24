import cx from 'classnames';
import React from 'react';

import Image from '@/components/Image';

export default function Marquee(data) {
	const { pausable, reverse, speed, items } = data;
	const animationSpeed = `${speed}s` || '30s';

	if (!items?.length && !props.children) return null;

	return (
		<>
			<div
				className={cx('marquee user-select-disable', {
					'is-pausable': pausable,
				})}
				data-direction={reverse ? 'right' : 'left'}
			>
				<div className="marquee-inner">
					{[...Array(3)].map((el, index) => {
						return (
							<div
								key={index}
								className="marquee-block"
								aria-hidden={i > 0 ? 'true' : 'false'}
							>
								{props.children && props.children}
								{items.map((item, index) => {
									switch (item._type) {
										case 'simple':
											return (
												<span
													key={index}
													className={cx('marquee-text', item.font)}
												>
													{item.text}
												</span>
											);
										case 'image':
											return (
												<div
													key={index}
													className="marquee-image"
													style={{ flex: item.image.aspectRatio }}
												>
													<Image image={item.image} alt={item.image.alt} />
												</div>
											);
									}
								})}
							</div>
						);
					})}
				</div>
			</div>
			<style jsx>{`
				.marquee {
					--gap: 1rem;
					position: relative;
					padding: 10px 0;

					&[data-direction='right'] {
						.marquee-block {
							animation-direction: reverse;
						}
					}

					@keyframes marquee {
						0% {
							transform: translate3d(0, 0, 0);
						}

						100% {
							transform: translate3d(calc(-100% - var(--gap)), 0, 0);
						}
					}

					.marquee-inner {
						position: relative;
						width: 100%;
						overflow: hidden;
						display: flex;
						gap: var(--gap);
					}

					.marquee-block {
						flex-shrink: 0;
						display: flex;
						justify-content: space-around;
						gap: var(--gap);
						min-width: 100%;
						animation: marquee ${animationSpeed} 0.5s linear infinite;
					}

					.marquee-text {
						white-space: nowrap;

						&:not(:last-child) {
							margin-right: var(--gap);
						}
					}

					&.is-pausable {
						@media (hover: hover) {
							&:hover {
								.marquee-block {
									animation-play-state: paused;
								}
							}
						}
					}
				}

				@media (prefers-reduced-motion: reduce) {
					.marquee-block {
						animation-play-state: paused !important;
					}
				}
			`}</style>
		</>
	);
}
