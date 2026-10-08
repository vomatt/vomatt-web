'use client';

import { AnimatePresence, motion } from 'motion/react';

import { cn } from '@/lib/utils';

type AuthErrorProps = {
	/** The message to show; nothing renders while it is null. */
	message: string | null;
	className?: string;
};

/** A form-level error that slides down into place and folds away when cleared. */
export function AuthError({ message, className }: AuthErrorProps) {
	return (
		<AnimatePresence initial={false}>
			{message && (
				<motion.div
					key="error"
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: 'auto', opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					transition={{ duration: 0.2, ease: 'easeOut' }}
					className="overflow-hidden"
				>
					<p role="alert" className={cn('text-destructive text-center text-sm', className)}>
						{message}
					</p>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
