// no third-party scripts in head component: https://nextjs.org/docs/messages/no-script-tags-in-head-component
// https://stackoverflow.com/questions/68058814/next-11-and-adding-script-tags-not-working-no-scripts-are-rendered
// import Head from 'next/head';
import Script from 'next/script';
import React from 'react';

const HeadTrackingCode = ({ siteData = {} }) => {
	const { integrations } = siteData || {};

	return (
		<>
			{integrations?.gaID && (
				<>
					<Script
						src={`https://www.googletagmanager.com/gtag/js?id=${integrations?.gaID}`}
						async
					/>
					<Script
						id="tracking-gtag"
						dangerouslySetInnerHTML={{
							__html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${integrations?.gaID}', {page_path: window.location.pathname,});
							`,
						}}
					/>
				</>
			)}
			{integrations?.gtmID && (
				<Script
					id="tracking-gtm"
					dangerouslySetInnerHTML={{
						__html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${integrations?.gtmID}');`,
					}}
				/>
			)}
		</>
	);
};

export default HeadTrackingCode;
