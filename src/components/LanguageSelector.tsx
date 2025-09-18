// 'use client';

// import React, { useState } from 'react';

// import {
// 	LanguageCode,
// 	SUPPORTED_LANGUAGES,
// 	useLanguage,
// } from '@/contexts/LanguageContext';

// // Language Switcher Dropdown Component
// export const LanguageSwitcher: React.FC = () => {
// 	const { currentLanguage, setLanguage } = useLanguage();
// 	const [isOpen, setIsOpen] = useState(false);

// 	const handleLanguageChange = (language: LanguageCode) => {
// 		setLanguage(language);
// 		setIsOpen(false);
// 	};

// 	return (
// 		<div className="relative">
// 			<button
// 				onClick={() => setIsOpen(!isOpen)}
// 				className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 dark:bg-gray-800 dark:hover:bg-gray-700"
// 				aria-label="Select language"
// 			>
// 				<span className="text-xl">🌐</span>
// 				<span className="text-sm font-medium">
// 					{SUPPORTED_LANGUAGES[currentLanguage]}
// 				</span>
// 				<svg
// 					className={`w-4 h-4 transition-transform duration-200 ${
// 						isOpen ? 'rotate-180' : ''
// 					}`}
// 					fill="none"
// 					stroke="currentColor"
// 					viewBox="0 0 24 24"
// 				>
// 					<path
// 						strokeLinecap="round"
// 						strokeLinejoin="round"
// 						strokeWidth={2}
// 						d="M19 9l-7 7-7-7"
// 					/>
// 				</svg>
// 			</button>

// 			{isOpen && (
// 				<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 dark:bg-gray-800 dark:border-gray-700">
// 					<div className="py-1">
// 						{Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
// 							<button
// 								key={code}
// 								onClick={() => handleLanguageChange(code as LanguageCode)}
// 								className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ${
// 									currentLanguage === code
// 										? 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
// 										: 'text-gray-700 dark:text-gray-300'
// 								}`}
// 							>
// 								<div className="flex items-center justify-between">
// 									<span>{name}</span>
// 									{currentLanguage === code && (
// 										<svg
// 											className="w-4 h-4"
// 											fill="currentColor"
// 											viewBox="0 0 20 20"
// 										>
// 											<path
// 												fillRule="evenodd"
// 												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
// 												clipRule="evenodd"
// 											/>
// 										</svg>
// 									)}
// 								</div>
// 							</button>
// 						))}
// 					</div>
// 				</div>
// 			)}

// 			{/* Backdrop to close dropdown when clicking outside */}
// 			{isOpen && (
// 				<div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
// 			)}
// 		</div>
// 	);
// };

// // Alternative: Icon-only language switcher for mobile
// export const CompactLanguageSwitcher: React.FC = () => {
// 	const { currentLanguage, setLanguage } = useLanguage();
// 	const [isOpen, setIsOpen] = useState(false);

// 	const handleLanguageChange = (language: LanguageCode) => {
// 		setLanguage(language);
// 		setIsOpen(false);
// 	};

// 	// Get flag emoji for language (simplified mapping)
// 	const getFlagEmoji = (lang: LanguageCode): string => {
// 		const flags: Record<LanguageCode, string> = {
// 			en: '🇺🇸',
// 			es: '🇪🇸',
// 			fr: '🇫🇷',
// 			de: '🇩🇪',
// 			zh: '🇨🇳',
// 			ja: '🇯🇵',
// 			ko: '🇰🇷',
// 		};
// 		return flags[lang] || '🌐';
// 	};

// 	return (
// 		<div className="relative">
// 			<button
// 				onClick={() => setIsOpen(!isOpen)}
// 				className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200 dark:bg-gray-800 dark:hover:bg-gray-700"
// 				aria-label="Select language"
// 			>
// 				<span className="text-xl">{getFlagEmoji(currentLanguage)}</span>
// 			</button>

// 			{isOpen && (
// 				<div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-50 dark:bg-gray-800 dark:border-gray-700">
// 					<div className="py-1">
// 						{Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
// 							<button
// 								key={code}
// 								onClick={() => handleLanguageChange(code as LanguageCode)}
// 								className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ${
// 									currentLanguage === code
// 										? 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
// 										: 'text-gray-700 dark:text-gray-300'
// 								}`}
// 							>
// 								<div className="flex items-center space-x-3">
// 									<span className="text-lg">
// 										{getFlagEmoji(code as LanguageCode)}
// 									</span>
// 									<span>{name}</span>
// 								</div>
// 							</button>
// 						))}
// 					</div>
// 				</div>
// 			)}

// 			{isOpen && (
// 				<div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
// 			)}
// 		</div>
// 	);
// };
