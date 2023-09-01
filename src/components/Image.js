/* https://nextjs.org/docs/api-reference/next/image */
import cx from 'classnames';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

import { buildImageSrc } from '@/lib/helpers';

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

const ImageFunc = ({
	image,
	alt,
	className,
	responsiveImage,
	breakpoint = 600,
	quality = 80,
}) => {
	const [isLoading, setLoading] = useState(true);
	const [isLoaded, setLoaded] = useState(true);
	const imageId = getSanityRefId(image) || false;

	// get image dimension and src
	const aspectRatio = image.customRatio || undefined;
	const imageDimension = getImageDimensions(imageId);
	const imageWidth = imageDimension.width;
	const imageHeight = Math.round(
		imageWidth / (aspectRatio || imageDimension.aspectRatio)
	);
	const src = buildImageSrc(image, {
		...{ width: imageWidth },
		...{ height: imageHeight },
		quality,
	});
	const responsiveImageSrc = buildImageSrc(responsiveImage, {
		...{ width: imageWidth },
		...{ height: imageHeight },
		quality,
	});

	// get rendered dimension, to set size=""
	const pictureRef = useRef();
	const [renderedDimensions, setRenderedDimensions] = useState({
		width: 0,
		height: 0,
	});

	useEffect(() => {
		if (pictureRef.current) {
			setRenderedDimensions({
				width: pictureRef.current.offsetWidth,
				height: pictureRef.current.offsetHeight,
			});
		}
	}, []);

	if (!image || !imageId) {
		return false;
	}

	return (
		<>
			<picture
				ref={pictureRef}
				className={className}
				style={{ aspectRatio: aspectRatio || 'unset' }}
			>
				{responsiveImageSrc && (
					<>
						<source
							media={`(min-width: ${breakpoint + 1}px)`}
							width={imageWidth}
							height={imageHeight}
							srcset={src}
						/>

						<source
							media={`(max-width: ${breakpoint}px)`}
							width={imageWidth}
							height={imageHeight}
							srcset={responsiveImageSrc}
						/>
					</>
				)}

				<Image
					src={src}
					width={imageWidth}
					height={imageHeight}
					sizes={`${renderedDimensions.width}px`}
					quality={quality}
					alt={alt || image.alt || 'image'}
					onLoad={() => setLoading(false)}
					onLoadingComplete={() => setLoaded(false)}
					className={cx({
						lazyload: isLoading,
						lazyloading: isLoading,
						lazyloaded: !isLoaded,
					})}
				/>
			</picture>

			<style jsx>{`
				:global(img) {
					width: 100%;
				}
			`}</style>
		</>
	);
};

export default ImageFunc;
