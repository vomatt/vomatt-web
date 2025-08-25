import React, { useRef } from 'react';

export function Footer({ siteData, data }: { siteData: any; data: any }) {
	return (
		<footer>
			<div className="footer-copyright">
				© {new Date().getFullYear()} {siteData.title}
			</div>
		</footer>
	);
}
