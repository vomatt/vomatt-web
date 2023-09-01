import cx from 'classnames';
import React from 'react';

const Logo = ({ projectName }) => {
	return (
		<div className={cx('icon', { 'is-login': projectName })}>
			<svg
				viewBox="0 0 110 110"
				className="svg-logo"
				xmlns="http://www.w3.org/2000/svg"
				xlinkHref="http://www.w3.org/1999/xlink"
			>
				<linearGradient
					id="a"
					x1="50%"
					x2="53.412855%"
					y1="36.926558%"
					y2="75.590262%"
				>
					<stop offset="0" />
					<stop offset="1" stopColor="#fff" />
				</linearGradient>
				<linearGradient
					id="b"
					x1="50%"
					x2="50%"
					y1="30.374372%"
					y2="60.388542%"
				>
					<stop offset="0" stopColor="#fff" />
					<stop offset="1" />
				</linearGradient>
				<g fill="none" fillRule="evenodd" transform="translate(10 11)">
					<path
						d="m44.572.0001c24.617 0 44.572 19.956 44.572 44.572l-.0059712.7370667c-.393595 24.2760577-20.1951988 43.8349333-44.5660288 43.8349333l-.7370667-.0059715c-24.2760577-.3936145-43.8349333-20.1961885-43.8349333-44.5660285l.0059715-.7370667c.3936145-24.2760577 20.1961885-43.8349333 44.5660285-43.8349333zm.0001 24.9221c-10.853 0-19.65 8.797-19.65 19.65s8.797 19.65 19.65 19.65c10.852 0 19.65-8.797 19.65-19.65s-8.798-19.65-19.65-19.65z"
						fill="url(#a)"
					/>
					<path
						d="m44.572 12.1561.5360619.0043428c17.6557468.2862562 31.8799381 14.6876872 31.8799381 32.4116572l-.0043428.5360325c-.2862562 17.6547961-14.6876872 31.8799675-32.4116572 31.8799675l-.5360328-.0043431c-17.6548157-.2862757-31.8809672-14.6886769-31.8809672-32.4116569 0-17.903 14.515-32.416 32.417-32.416zm.0001 12.7661c-10.853 0-19.65 8.797-19.65 19.65s8.797 19.65 19.65 19.65c10.852 0 19.65-8.797 19.65-19.65s-8.798-19.65-19.65-19.65z"
						fill="url(#b)"
					/>
				</g>
			</svg>
			<style jsx>{`
				.icon {
					display: block;
					width: auto;
					height: 2em;
					&.is-login {
						display: block;
						margin: 0 auto;
						width: 90px;
						height: 90px;
						color: black;
					}
					.svg-logo {
						display: block;
						margin: 0 auto;
						height: 100% !important;
						width: auto;
					}
				}
			`}</style>
		</div>
	);
};

export default Logo;
