'use client';
import { RefObject, useEffect } from 'react';

export default function useOutsideAlerter(
	ref: RefObject<HTMLElement | null>,
	callBackFunc: () => void
) {
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				callBackFunc();
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [ref, callBackFunc]);
}
