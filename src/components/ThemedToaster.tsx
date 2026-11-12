'use client';

import { useTheme } from 'next-themes';
import type { ComponentProps } from 'react';
import { Toaster } from 'sonner';

/** Sonner's own `system` theme follows the OS; the app's theme is the one picked in next-themes. */
export function ThemedToaster(props: Omit<ComponentProps<typeof Toaster>, 'theme'>) {
	const { resolvedTheme } = useTheme();
	return <Toaster theme={resolvedTheme === 'dark' ? 'dark' : 'light'} {...props} />;
}
