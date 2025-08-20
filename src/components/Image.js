import clsx from 'clsx';
import Image from 'next/image'; /* https://nextjs.org/docs/api-reference/next/image */
import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

import { buildImageSrc } from '@/lib/utils';

function getSanityRefId(image) {
	if (typeof image === 'string') {
		return image;
	}

	if (image?.asset) {
		return image?.asset?._ref || image?.asset?._id;
	}

	return image._ref || image._id || false;
}

function getImageDimensions(id) {
	const dimensions = id.split('-')[2];
	const [width, height] = dimensions.split('x').map((num) => parseInt(num, 10));
	const aspectRatio = width / height;

	return { width, height, aspectRatio };
}

export default function Img({
	image,
	alt,
	className,
	responsiveImage,
	breakpoint = 600,
	quality = 80,
}) {
	const { ref, inView } = useInView({
		triggerOnce: true,
	});
	const [isLoaded, setLoaded] = useState(false);
	const imageId = getSanityRefId(image) || false;

	// get image dimension and src
	const imageDimension = getImageDimensions(imageId);
	const aspectRatio =
		image.customRatio || imageDimension.aspectRatio || undefined;
	const imageWidth = imageDimension.width;
	const imageHeight = Math.round(imageWidth / aspectRatio);
	const src = buildImageSrc(image, {
		...{ width: inView ? imageWidth : 100 },
		...{
			height: inView ? imageHeight : Math.round(100 / aspectRatio),
		},
		quality,
	});
	const responsiveImageSrc = buildImageSrc(responsiveImage, {
		quality,
	});

	// get rendered dimension, to set size=""
	const pictureRef = useRef();
	const [renderedDimensions, setRenderedDimensions] = useState({
		width: 0,
		height: 0,
	});

	useEffect(() => {
		if (inView && pictureRef.current) {
			setRenderedDimensions({
				width: pictureRef.current.offsetWidth,
				height: pictureRef.current.offsetHeight,
			});
		}
	}, [inView]);

	if (!image || !imageId) {
		return false;
	}

	return (
		<picture ref={pictureRef} className={className}>
			{responsiveImageSrc && (
				<>
					<source
						media={`(min-width: ${breakpoint + 1}px)`}
						width={imageWidth}
						height={imageHeight}
						srcSet={src}
					/>

					<source
						media={`(max-width: ${breakpoint}px)`}
						width={imageWidth}
						height={imageHeight}
						srcSet={responsiveImageSrc}
					/>
				</>
			)}
			<Image
				ref={ref}
				width={imageWidth}
				height={imageHeight}
				sizes={inView ? `${renderedDimensions.width}px` : '0vw'}
				src={src}
				quality={quality}
				alt={alt || image.alt || 'image'}
				{...(inView && {
					onLoad: () => {
						setLoaded(true);
					},
				})}
				className={clsx({
					lazyload: !isLoaded,
					lazyloaded: isLoaded,
				})}
			/>
		</picture>
	);
}
