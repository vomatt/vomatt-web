'use client';

import { AnimatePresence } from 'motion/react';

import { FieldError } from '@/components/ui/Field';
import { Unfold } from '@/components/Unfold';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AuthErrorKey } from '@/lib/api/auth-errors';

type AuthErrorProps = {
	/** Nothing renders while it is null. */
	error: AuthErrorKey | null;
	className?: string;
};

/** A form-level auth error that slides down into place and folds away when cleared. */
export function AuthError({ error, className }: AuthErrorProps) {
	const { t } = useLanguage();
	return (
		<AnimatePresence initial={false}>
			{error && (
				<Unfold key="error">
					<FieldError className={className}>{t(error.startsWith('apiError.') ? error : `authError.${error}`)}</FieldError>
				</Unfold>
			)}
		</AnimatePresence>
	);
}
