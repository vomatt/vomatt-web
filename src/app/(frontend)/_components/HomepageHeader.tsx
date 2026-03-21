'use client';
import { useState } from 'react';

import { cn } from '@/lib/utils';

const tabs = [
	{ id: 'latest', label: 'Latest' },
	{ id: 'popular', label: 'Popular' },
	{ id: 'ending', label: 'Ending soon' },
];

export function HomepageHeader() {
	const [activeTab, setActiveTab] = useState('latest');

	return (
		<div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
			<div className="flex items-center gap-1 py-1">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={cn(
							'px-3 py-2 text-sm rounded-md transition-colors font-medium',
							activeTab === tab.id
								? 'text-foreground'
								: 'text-muted-foreground hover:text-foreground'
						)}
					>
						{tab.label}
						{activeTab === tab.id && (
							<span className="block mt-0.5 h-0.5 rounded-full bg-foreground" />
						)}
					</button>
				))}
			</div>
		</div>
	);
}
