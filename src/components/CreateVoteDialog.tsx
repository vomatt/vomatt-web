import { Plus } from 'lucide-react';
import React, { ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

type CreateVoteDialogProps = { triggerClassName?: string };
export function CreateVoteDialog({ triggerClassName }: CreateVoteDialogProps) {
	return (
		<Dialog>
			<DialogTrigger className={triggerClassName}>
				<Plus />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>New Poll</DialogTitle>
				</DialogHeader>
				<Textarea placeholder="Poll title" />

				<div className="flex flex-col gap-2">
					<Input id="option1" placeholder="Option 1" />
					<Input id="option2" placeholder="Option 2" />
					<Input id="anotherOption" placeholder="Add another option" />
				</div>

				<DialogFooter className="sm:justify-start">
					<Button type="button" variant="secondary">
						Post
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
