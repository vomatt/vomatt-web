import Player from '@vimeo/player';
import cx from 'classnames';
import Image from 'next/image';
import React, {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from 'react';
import useInView from 'react-cool-inview';

import { imageBuilder } from '@/sanity/lib/image';

const VimeoVideo = forwardRef(function VimeoVideo(
	{
		data,
		className,
		width = '100vw',
		height = '56.25vw',
		autoPlay = true,
		autoPause = false,
		loop = false,
		videoPlayCallBackFunc,
		videoPauseCallBackFunc,
		videoEndCallBackFunc,
		videoTimeupdateCallBackFunc,
		...rest
	},
	ref
) {
	const videoRef = useRef();
	const [iframePlayer, setIframePlayer] = useState(null);
	const { observe, inView } = useInView();
	const videoTitle = data.title ? data.title : '';

	useEffect(() => {
		if (videoRef.current && iframePlayer === null) {
			setIframePlayer(new Player(videoRef.current));
		}
	}, [iframePlayer]);

	useImperativeHandle(ref, () => ({
		playVideo: () => {
			iframePlayer.play();
		},
		pauseVideo: () => {
			iframePlayer.pause();
		},
	}));

	useEffect(() => {
		if (iframePlayer) {
			iframePlayer.on('play', function (e) {
				videoPlayCallBackFunc(e);
			});
			iframePlayer.on('pause', function (e) {
				videoPauseCallBackFunc(e);
			});
		}
	}, [iframePlayer, videoPlayCallBackFunc, videoPauseCallBackFunc]);

	useEffect(() => {
		if (iframePlayer) {
			iframePlayer.on('ended', function (e) {
				videoEndCallBackFunc(e);
			});
		}
	}, [iframePlayer, videoEndCallBackFunc]);

	useEffect(() => {
		if (iframePlayer) {
			iframePlayer.on('timeupdate', function (e) {
				videoTimeupdateCallBackFunc(e);
			});
		}
	}, [iframePlayer, videoTimeupdateCallBackFunc]);

	useEffect(() => {
		if (iframePlayer) {
			if (inView && autoPlay === true) {
				iframePlayer.play();
			} else {
				iframePlayer.pause();
			}
		}
	}, [iframePlayer, inView, autoPlay]);

	useEffect(() => {
		if (iframePlayer) {
			iframePlayer.on('error', function () {
				setIframePlayer(null);
				console.log('Error in loading video');
			});
		}
	}, [iframePlayer]);

	return (
		<>
			<div
				className={cx('vimeo-video', className, { 'is-ready': iframePlayer })}
				{...rest}
			>
				{data.thumbnail && (
					<div className="thumbnail">
						<Image
							src={imageBuilder.image(data.thumbnail).width(2000).url()}
							alt={videoTitle}
							fill
							quality={100}
						/>
					</div>
				)}
				{data.id && (
					<iframe
						ref={(node) => {
							observe(node);
							videoRef.current = node;
						}}
						title={videoTitle}
						src={`https://player.vimeo.com/video/${data.id}?${
							autoPlay
								? 'background=1&autoplay=1&autopause=0'
								: 'controls=0&muted=1'
						}${loop || autoPlay ? '&loop=1' : '&loop=0'}`}
						frameBorder="0"
						allow="autoplay; fullscreen;"
					/>
				)}
			</div>
			<style jsx>{`
				.vimeo-video {
					overflow: hidden;
					pointer-events: none;
					user-select: none;

					.thumbnail {
						position: relative;
						height: 100vh;
						width: 100vw;
						overflow: hidden;
						z-index: -1;
					}
					iframe {
						opacity: 0;
						height: ${height};
						width: ${width};
						pointer-events: none;
						transition: 0.6s;
					}
					&.is-ready {
						iframe {
							opacity: 1;
						}
					}

					@media screen and (min-aspect-ratio: 16 / 9) {
						iframe {
							width: 101vw;
							height: 56.25vw;
						}
					}
				}
			`}</style>
		</>
	);
});

export default VimeoVideo;
