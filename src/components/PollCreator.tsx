'use client';
import { Calendar, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { ButtonLoading } from '@/components/ButtonLoading';
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { PollOption } from '@/types/poll';

interface PollCreatorProps {
	triggerClassName?: string;
}

export function PollCreator({ triggerClassName }: PollCreatorProps) {
	const optionsLimit = 10;
	const { t } = useLanguage();
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
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
	const [error, setError] = useState('');

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
			setOpen(false);
		}
	};

	const onHandleOpenChange = (value: boolean) => {
		if (value === false) {
			handleClose();
			return;
		}
		setOpen(value);
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
		setIsLoading(true);
		const now = new Date();
		const currentTime = now.toISOString().slice(0, 16); // Slice to get YYYY-MM-DDTHH:mm

		const body = {
			question,
			description,
			options,
			startTime: startTime || currentTime,
			endTime,
			isAllowMultipleChoices,
			isAnonymous,
		};

		const bodyTest = {
			question: '誰最帥 Test Data',
			description: 'Static Test Des',
			options: [
				{
					text: '秦琴琴',
				},
				{
					text: '宜賢',
				},
			],
			startTime: '2025-10-16T14:43:54.753Z',
			endTime: '2025-10-17T14:43:54.753Z',
			isAllowMultipleChoices: true,
			isAnonymous: true,
		};

		try {
			const response = await fetch('/api/create-poll', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			const data = await response.json();

			if (data?.status === 'SUCCESS') {
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
				setOpen(false);
				return;
			}

			setError(data?.message);
		} catch (error) {
			setError('error');
		} finally {
			setIsLoading(false);
		}
	};

	const handleConfirmSaveDraft = async () => {
		await handleSaveDraft();
		setShowSaveDraftAlert(false);
		if (pendingNavigation) {
			setOpen(false);
		}
	};

	const handleDiscardDraft = () => {
		setShowSaveDraftAlert(false);
		if (pendingNavigation) {
			setOpen(false);
		}
	};

	const isValid =
		question.trim() &&
		options.every((opt) => opt.text.trim()) &&
		options.length >= 2;

	const enableToAddMoreOption = options.every((opt) => opt.text.trim());

	return (
		<>
			<Dialog open={open} onOpenChange={onHandleOpenChange}>
				<DialogTrigger className={triggerClassName}>
					<Plus />
				</DialogTrigger>
				<DialogContent className="sm:max-w-lg overflow-y-scroll max-h-[96vh] no-scrollbar">
					<DialogHeader>
						<DialogTitle>{t('pollCreator.title')}</DialogTitle>
						<DialogDescription>{t('pollCreator.subtitle')}</DialogDescription>
					</DialogHeader>
					<div className="space-y-10">
						<div className="space-y-6">
							<div className="space-y-2">
								<Label
									htmlFor="question"
									className="text-sm font-medium text-card-foreground"
								>
									{t('pollCreator.questionLabel')}
								</Label>
								<Textarea
									id="question"
									placeholder={t('pollCreator.questionPlaceholder')}
									value={question}
									onChange={(e) => setQuestion(e.target.value)}
									className="min-h-[80px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground"
									maxLength={280}
								/>
								<div className="flex justify-between items-center text-xs text-muted-foreground">
									<span>{t('pollCreator.questionNote')}</span>
									<span>{question.length}/280</span>
								</div>
							</div>
							<div className="space-y-2">
								<Label
									htmlFor="description"
									className="text-sm font-medium text-card-foreground"
								>
									{t('pollCreator.descriptionLabel')}
								</Label>
								<Textarea
									id="description"
									placeholder={t('pollCreator.descriptionPlaceholder')}
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
									{t('pollCreator.pollOptionsLabel')}
								</Label>
								{options.map((option, index) => (
									<div key={option.id} className="flex items-center gap-2">
										<div className="flex-1">
											<Input
												id={`options-${option.id}`}
												placeholder={`${t('pollCreator.optionsPlaceholder')} ${index + 1}`}
												value={option.text}
												onChange={(e) =>
													updateOption(option.id, e.target.value)
												}
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
										{t('pollCreator.addOptionLabel')}
									</Button>
								)}
							</div>
							<div className="flex gap-5">
								<div className="space-y-2">
									<Label htmlFor="startTime" className="text-sm font-medium">
										<Calendar className="w-4 h-4" />
										{t('pollCreator.startDateLabel')}
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
										{t('pollCreator.startDateLabel')} ({t('common.optional')})
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
										{t('pollCreator.allowMultipleChoicesLabel')}
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
											{t('pollCreator.anonymousVotingLabel')}
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
							<ButtonLoading
								onClick={handleCreatePoll}
								className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
								disabled={!isValid || isLoading}
								isLoading={isLoading}
							>
								{t('pollCreator.createPollLabel')}
							</ButtonLoading>
							<Button
								variant="outline"
								className="border-border text-muted-foreground hover:text-foreground bg-transparent"
							>
								{t('pollCreator.saveDraftLabel')}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

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
