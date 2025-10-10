'use client';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { PollCreator } from '@/components/PollCreater';
import { Button } from '@/components/ui/Button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/Dialog';
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '@/components/ui/Drawer';
import { useMediaQuery } from '@/hooks/useMediaQuery';

type CreateVoteDialogProps = { triggerClassName?: string };
export function CreateVoteDialog({ triggerClassName }: CreateVoteDialogProps) {
	const initialData = {
		question: '',
		description: '',
		options: '',
		startTime: '',
		endTime: '',
		isAllowMultipleChoices: '',
		isAnonymous: '',
	};

	const [open, setOpen] = useState(false);
	const [pollData, setPollData] = useState(initialData);

	const isDesktop = useMediaQuery('(min-width: 768px)');

	if (isDesktop) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger className={triggerClassName}>
					<Plus />
				</DialogTrigger>
				<DialogContent className="sm:max-w-lg overflow-y-scroll max-h-[96vh] no-scrollbar">
					<DialogHeader>
						<DialogTitle>New Poll</DialogTitle>
						<DialogDescription>
							Make changes to your profile here. Click save when you&apos;re
							done.
						</DialogDescription>
					</DialogHeader>
					<PollCreator onSetPollData={setPollData} initialData={pollData} />
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger className={triggerClassName}>
				<Plus />
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle>Edit profile</DrawerTitle>
					<DrawerDescription>
						Make changes to your profile here. Click save when you&apos;re done.
					</DrawerDescription>
				</DrawerHeader>
				<PollCreator />
				<DrawerFooter className="pt-2">
					<DrawerClose asChild>
						<Button variant="outline">Cancel</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
