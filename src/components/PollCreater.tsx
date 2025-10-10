'use client';

import { Calendar, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { PollCreatorData, PollOption } from '@/types/poll';

interface PollCreatorProps {
	onSetPollData: (data: PollCreatorData) => void;
	initialData?: PollCreatorData;
}

export function PollCreator({ onSetPollData, initialData }: PollCreatorProps) {
	const optionsLimit = 10;
	const [question, setQuestion] = useState('');
	const [description, setDescription] = useState('');
	const [options, setOptions] = useState<PollOption[]>([
		{ id: 'option-1', text: '' },
		{ id: 'option-2', text: '' },
	]);

	const [isAllowMultipleChoices, setIsAllowMultipleChoices] = useState(false);
	const [startTime, setStartTime] = useState('');
	const [endTime, setEndTime] = useState('');
	const [isAnonymous, setIsAnonymous] = useState(false);

	const [showSaveDraftAlert, setShowSaveDraftAlert] = useState(false);
	const [pendingNavigation, setPendingNavigation] = useState(false);

	// Check if there's any unsaved data
	const hasUnsavedData = useCallback(() => {
		return (
			question.trim() !== '' ||
			description.trim() !== '' ||
			options.some((opt) => opt.text.trim() !== '')
		);
	}, [question, description, options]);

	// Handle browser close/refresh
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasUnsavedData()) {
				e.preventDefault();
				e.returnValue = '';
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [hasUnsavedData]);

	// Handle modal/page close
	const handleClose = () => {
		if (hasUnsavedData()) {
			setShowSaveDraftAlert(true);
			setPendingNavigation(true);
		} else {
			// onClose?.();
		}
	};

	const addOption = () => {
		setOptions([...options, { id: Date.now().toString(), text: '' }]);
	};

	const removeOption = (id: string) => {
		setOptions(options.filter((option) => option.id !== id));
	};

	const updateOption = (id: string, text: string) => {
		setOptions(
			options.map((option) => (option.id === id ? { ...option, text } : option))
		);
	};

	const handleSaveDraft = async () => {
		const response = await fetch('/api/save-draft', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				question,
				description,
				options,
				startTime,
				endTime,
				isAllowMultipleChoices,
				isAnonymous,
			}),
		});

		if (response.ok) {
			// Clear state after saving
			setQuestion('');
			setDescription('');
			setOptions([
				{ id: 'option-1', text: '' },
				{ id: 'option-2', text: '' },
			]);
			setIsAllowMultipleChoices(false);
			setStartTime('');
			setEndTime('');
			setIsAnonymous(false);
		}
	};

	const handleCreatePoll = async () => {
		const response = await fetch('/api/create-poll', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				question,
				description,
				options,
				startTime,
				endTime,
				isAllowMultipleChoices,
				isAnonymous,
			}),
		});

		if (response.ok) {
			// Clear state after successful creation
			setQuestion('');
			setDescription('');
			setOptions([
				{ id: 'option-1', text: '' },
				{ id: 'option-2', text: '' },
			]);
			setIsAllowMultipleChoices(false);
			setStartTime('');
			setEndTime('');
			setIsAnonymous(false);
			onClose?.();
		}
	};

	const handleConfirmSaveDraft = async () => {
		await handleSaveDraft();
		setShowSaveDraftAlert(false);
		if (pendingNavigation) {
			// onClose?.();
		}
	};

	const handleDiscardDraft = () => {
		setShowSaveDraftAlert(false);
		if (pendingNavigation) {
			// onClose?.();
		}
	};

	const isValid =
		question.trim() &&
		options.every((opt) => opt.text.trim()) &&
		options.length >= 2;

	const enableToAddMoreOption = options.every((opt) => opt.text.trim());

	return (
		<>
			<div className="space-y-10">
				<div className="space-y-6">
					<div className="space-y-2">
						<Label
							htmlFor="question"
							className="text-sm font-medium text-card-foreground"
						>
							What would you like to ask?
						</Label>
						<Textarea
							id="question"
							placeholder="Ask a question to start a discussion..."
							value={question}
							onChange={(e) => setQuestion(e.target.value)}
							className="min-h-[80px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground"
							maxLength={280}
						/>
						<div className="flex justify-between items-center text-xs text-muted-foreground">
							<span>Make it engaging and clear</span>
							<span>{question.length}/280</span>
						</div>
					</div>
					<div className="space-y-2">
						<Label
							htmlFor="description"
							className="text-sm font-medium text-card-foreground"
						>
							Description
						</Label>
						<Textarea
							id="description"
							placeholder="Description the background of the question"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="min-h-[80px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground"
						/>
					</div>
					<div className="space-y-3">
						<Label
							htmlFor={`options-${options[0].id}`}
							className="text-sm font-medium text-card-foreground"
						>
							Poll Options
						</Label>
						{options.map((option, index) => (
							<div key={option.id} className="flex items-center gap-2">
								<div className="flex-1">
									<Input
										id={`options-${option.id}`}
										placeholder={`Option ${index + 1}`}
										value={option.text}
										onChange={(e) => updateOption(option.id, e.target.value)}
										className="bg-input border-border text-foreground placeholder:text-muted-foreground"
										maxLength={100}
									/>
								</div>
								{options.length > 2 && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => removeOption(option.id)}
										className="text-muted-foreground hover:text-destructive"
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}

						{options.length < optionsLimit && (
							<Button
								variant="outline"
								size="sm"
								onClick={addOption}
								className="w-full border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary bg-transparent"
								disabled={!enableToAddMoreOption}
							>
								<Plus className="h-4 w-4 mr-2" />
								Add Option
							</Button>
						)}
					</div>
					<div className="flex gap-5">
						<div className="space-y-2">
							<Label htmlFor="startTime" className="text-sm font-medium">
								<Calendar className="w-4 h-4" />
								Start Date
							</Label>
							<Input
								id="startTime"
								type="datetime-local"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
								// defaultValue={Date.now()}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="endTime" className="text-sm font-medium">
								<Calendar className="w-4 h-4" />
								End Date (optional)
							</Label>
							<Input
								id="endTime"
								type="datetime-local"
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
							/>
						</div>
					</div>

					<div className="flex items-center gap-5">
						<div className="flex items-center space-x-2">
							<Label
								htmlFor="allowMultiple"
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
							>
								Allow multiple choices
							</Label>
							<Switch
								id="allowMultiple"
								checked={isAllowMultipleChoices}
								onCheckedChange={(checked) =>
									setIsAllowMultipleChoices(checked as boolean)
								}
							/>

							<div className="flex items-center space-x-2">
								<Label
									htmlFor="anonymous"
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
								>
									Anonymous voting
								</Label>
								<Switch
									id="anonymous"
									checked={isAnonymous}
									onCheckedChange={(checked) =>
										setIsAnonymous(checked as boolean)
									}
								/>
							</div>
						</div>
					</div>
				</div>
				{/* Action Buttons */}
				<div className="flex gap-3">
					<Button
						onClick={handleCreatePoll}
						disabled={!isValid}
						className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
					>
						Create Poll
					</Button>
					<Button
						variant="outline"
						className="border-border text-muted-foreground hover:text-foreground bg-transparent"
					>
						Save Draft
					</Button>
				</div>
			</div>
			<AlertDialog
				open={showSaveDraftAlert}
				onOpenChange={setShowSaveDraftAlert}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Save to drafts?</AlertDialogTitle>
						<AlertDialogDescription>
							You have unsaved changes. Would you like to save this poll as a
							draft before leaving?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={handleDiscardDraft}>
							Discard
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmSaveDraft}>
							Save Draft
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
