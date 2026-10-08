'use client';

import { AnimatePresence, motion } from 'motion/react';

import { FieldError } from '@/components/ui/Field';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AuthErrorKey } from '@/lib/api/auth-errors';
import { cn } from '@/lib/utils';

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
				<motion.div
					key="error"
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: 'auto', opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					transition={{ duration: 0.2, ease: 'easeOut' }}
					className="overflow-hidden"
				>
					<FieldError className={cn('text-center', className)}>{t(`authError.${error}`)}</FieldError>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
