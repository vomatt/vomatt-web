'use client';

import { useEffect } from 'react';

import { Language, useLanguage } from '@/contexts/LanguageContext';

export const useUserLanguage = (userLanguagePreference?: Language) => {
	const { setLanguage } = useLanguage();

	useEffect(() => {
		// When user logs in, load their saved language preference
		if (userLanguagePreference) {
			setLanguage(userLanguagePreference);
		}
	}, [userLanguagePreference, setLanguage]);
};
