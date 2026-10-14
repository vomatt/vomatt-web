import Script from 'next/script';
import React from 'react';

export type Integrations = {
	gaIDs?: string[] | null;
	gtmIDs?: string[] | null;
};

// Rendered by CookieConsent only after the visitor accepts analytics cookies
export function HeadTrackingCode({ gaIDs, gtmIDs }: Integrations) {
	const gaList = gaIDs?.filter(Boolean) ?? [];
	const gtmList = gtmIDs?.filter(Boolean) ?? [];

	return (
		<>
			{gaList.length > 0 && (
				<>
					<Script
						src={`https://www.googletagmanager.com/gtag/js?id=${gaList[0]}`}
						async
					/>
					<Script
						id="tracking-gtag"
						dangerouslySetInnerHTML={{
							__html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
${gaList.map((id) => `gtag('config', '${id}', {page_path: window.location.pathname});`).join('\n')}`,
						}}
					/>
				</>
			)}
			{gtmList.map((id) => (
				<Script
					key={id}
					id={`tracking-gtm-${id}`}
					dangerouslySetInnerHTML={{
						__html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`,
					}}
				/>
			))}
		</>
	);
}
