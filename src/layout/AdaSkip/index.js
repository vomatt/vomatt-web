import React from 'react';

function AdaSkip() {
	return (
		<>
			<a className="g-ada-skip btn" href="#main">
				Skip to content
			</a>

			<style global jsx>{`
				.g-ada-skip {
					position: fixed;
					top: calc(
						var(--s-announcement-dynamic, var(--s-announcement, 0px)) + 10px
					);
					left: 10px;
					transform: translateY(-100vh);
					z-index: 1000;

					&:focus {
						transform: translateY(0);
					}
				}
			`}</style>
		</>
	);
}

export default AdaSkip;
