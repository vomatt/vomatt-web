'use client';

import { useEffect } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/types';

export const useUserLanguage = (userLanguagePreference?: Language) => {
	const { setLanguage } = useLanguage();

	useEffect(() => {
		// When user logs in, load their saved language preference
		if (userLanguagePreference) {
			setLanguage(userLanguagePreference);
		}
	}, [userLanguagePreference, setLanguage]);
};
