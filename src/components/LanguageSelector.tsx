// components/LanguageSelector.tsx
('use client');

import React, { useState } from 'react';

import { Language, useLanguage } from '../contexts/LanguageContext';

const languageOptions: { code: Language; name: string; flag: string }[] = [
	{ code: 'en', name: 'English', flag: '🇺🇸' },
	{ code: 'es', name: 'Español', flag: '🇪🇸' },
	{ code: 'fr', name: 'Français', flag: '🇫🇷' },
	{ code: 'de', name: 'Deutsch', flag: '🇩🇪' },
	{ code: 'zh', name: '中文', flag: '🇨🇳' },
	{ code: 'ja', name: '日本語', flag: '🇯🇵' },
	{ code: 'ko', name: '한국어', flag: '🇰🇷' },
];

export const LanguageSelector: React.FC = () => {
	const { language, setLanguage, t } = useLanguage();
	const [isOpen, setIsOpen] = useState(false);

	const handleLanguageChange = (newLanguage: Language) => {
		setLanguage(newLanguage);
		setIsOpen(false);
	};

	const currentLanguage = languageOptions.find(
		(lang) => lang.code === language
	);

	return (
		<div className="relative inline-block">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<span>{currentLanguage?.flag}</span>
				<span className="text-sm font-medium">{currentLanguage?.name}</span>
				<svg
					className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
					<div className="py-1">
						{languageOptions.map((option) => (
							<button
								key={option.code}
								onClick={() => handleLanguageChange(option.code)}
								className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 ${
									language === option.code
										? 'bg-blue-50 text-blue-700'
										: 'text-gray-700'
								}`}
							>
								<span>{option.flag}</span>
								<span>{option.name}</span>
								{language === option.code && (
									<svg
										className="w-4 h-4 ml-auto"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fillRule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clipRule="evenodd"
										/>
									</svg>
								)}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
