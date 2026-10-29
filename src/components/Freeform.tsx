'use client';

import type { PortableTextBlock } from '@portabletext/react';
import clsx from 'clsx';
import React from 'react';

import CustomPortableText from '@/components/CustomPortableText';
import { buildRgbaCssString } from '@/lib/utils';

type RgbaColor = {
	rgb?: { r?: number; g?: number; b?: number; a?: number };
};

export type FreeformData = {
	content?: PortableTextBlock[];
	sectionAppearance?: {
		backgroundColor?: RgbaColor;
		textColor?: RgbaColor;
		textAlign?: string;
		maxWidth?: string;
		spacingTop?: number;
		spacingBottom?: number;
		spacingTopMobile?: number;
		spacingBottomMobile?: number;
	};
};

type FreeformProps = {
	data: FreeformData;
	className?: string;
};

export default function Freeform({ data, className }: FreeformProps) {
	const { content, sectionAppearance } = data;
	const mobileBreakpoint = 600;
	const isPadding = sectionAppearance?.backgroundColor;
	const spacingTop = sectionAppearance?.spacingTop || 0;
	const spacingBottom = sectionAppearance?.spacingBottom || 0;
	const spacingTopMobile = sectionAppearance?.spacingTopMobile || spacingTop;
	const spacingBottomMobile =
		sectionAppearance?.spacingBottomMobile || spacingBottom;

	return (
		<>
			<section
				className={clsx(
					'free-form',
					'wysiwyg',
					`text-align-${sectionAppearance?.textAlign || 'none'}`,
					sectionAppearance?.maxWidth,
					className
				)}
			>
				<CustomPortableText blocks={content} />
			</section>

			<style jsx>{`
				.free-form {
					margin-left: auto;
					margin-right: auto;
					color: ${buildRgbaCssString(sectionAppearance?.textColor) ||
					'inherit'};
					background-color: ${buildRgbaCssString(
						sectionAppearance?.backgroundColor
					) || 'transparent'};

					&.text-align-left {
						text-align: left;
					}

					&.text-align-center {
						text-align: center;
					}

					&.text-align-right {
						text-align: right;
					}

					&.text-align-justify {
						text-align: justify;
					}

					${isPadding
						? `padding-top: ${spacingTop}px;
							padding-bottom: ${spacingBottom}px;`
						: `margin-top: ${spacingTop}px;
							margin-bottom: ${spacingBottom}px;`}
				}

				@media screen and (max-width: ${mobileBreakpoint}px) {
					.free-form {
						${isPadding
							? `padding-top: ${spacingTopMobile}px;
								padding-bottom: ${spacingBottomMobile}px;`
							: `margin-top: ${spacingTopMobile}px;
								margin-bottom: ${spacingBottomMobile}px;
						`}
					}
				}
			`}</style>
		</>
	);
}
