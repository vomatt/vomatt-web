import React from 'react';

export const PrevButton = ({ enabled, onClick }) => (
	<>
		<button
			className="carousel-button carousel-button--prev"
			onClick={onClick}
			aria-label="Navigation previous"
			disabled={!enabled}
		>
			<div className="icon-arrow-left" />
		</button>

		<style jsx>{`
			.carousel-button--prev {
				margin-left: 20px;
			}
		`}</style>
	</>
);

export const NextButton = ({ enabled, onClick }) => (
	<>
		<button
			className="carousel-button carousel-button--next"
			aria-label="Navigation next"
			onClick={onClick}
			disabled={!enabled}
		>
			<div className="icon-arrow-right" />
		</button>

		<style jsx>{`
			.carousel-button--next {
				margin-left: 20px;
			}
		`}</style>
	</>
);
