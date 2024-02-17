import cx from 'classnames';
import Link from 'next/link';
import {
	FC,
	FocusEvent,
	FormEvent,
	KeyboardEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import AuthContainer from './AuthContainer';

type InputOrNull = HTMLInputElement | null;

interface Props {
	email: string;
	length?: number;
}

const VerificationForm: FC<Props> = ({ email, length = 6 }) => {
	const [code, setCode] = useState<string[]>(Array(length).fill(''));

	const update = useCallback((index: number, val: string) => {
		return setCode((prevState) => {
			const slice = prevState.slice();
			slice[index] = val;
			return slice;
		});
	}, []);

	const formRef = useRef<HTMLFormElement>(null);

	function handleKeyDown(evt: KeyboardEvent<HTMLInputElement>) {
		const index = parseInt(evt.currentTarget.dataset.index as string);
		const form = formRef.current;
		if (isNaN(index) || form === null) return; // just in case

		const prevIndex = index - 1;
		const nextIndex = index + 1;
		const prevInput: InputOrNull = form.querySelector(`.input-${prevIndex}`);
		const nextInput: InputOrNull = form.querySelector(`.input-${nextIndex}`);
		switch (evt.key) {
			case 'Backspace':
				if (code[index]) update(index, '');
				else if (prevInput) prevInput.select();
				break;
			case 'ArrowRight':
				evt.preventDefault();
				if (nextInput) nextInput.focus();
				break;
			case 'ArrowLeft':
				evt.preventDefault();
				if (prevInput) prevInput.focus();
		}
	}

	function handleChange(evt: FormEvent<HTMLInputElement>) {
		const value = evt.currentTarget.value;
		const index = parseInt(evt.currentTarget.dataset.index as string);
		const form = formRef.current;
		if (isNaN(index) || form === null) return; // just in case

		let nextIndex = index + 1;
		let nextInput: InputOrNull = form.querySelector(`.input-${nextIndex}`);

		update(index, value[0] || '');
		if (value.length === 1) nextInput?.focus();
		else if (index < length - 1) {
			const split = value.slice(index + 1, length).split('');
			split.forEach((val) => {
				update(nextIndex, val);
				nextInput?.focus();
				nextIndex++;
				nextInput = form.querySelector(`.input-${nextIndex}`);
			});
		}
	}

	function handleFocus(evt: FocusEvent<HTMLInputElement>) {
		evt.currentTarget.select();
	}

	async function handleSubmit(evt: FormEvent<HTMLFormElement>) {
		evt.preventDefault();

		try {
			// const data = await schema.validate(code, { context: { length } });
			// alert(`Code is ${data?.join('')}`);
		} catch (e) {}
	}

	return (
		<AuthContainer
			type="verification"
			className="c-auth__verification"
			title="your voice awaits"
		>
			<p className="c-auth__verification-subheading t-b-2">
				We sent an email to {email} for your login credentials
			</p>
			<form
				className="c-auth__verification-form"
				ref={formRef}
				onSubmit={handleSubmit}
			>
				<div className="c-auth__verification-inputs f-h f-a-c">
					{code.map((value, index) => (
						<input
							key={index}
							value={value}
							type="number"
							aria-label={`Number ${index}`}
							data-index={index}
							pattern="[0-9]*"
							onChange={handleChange}
							onKeyDown={handleKeyDown}
							onFocus={handleFocus}
							className={cx('', `input-${index}`)}
						/>
					))}
				</div>
				<button
					type="submit"
					className="c-auth__verification-submit-btn btn btn--primary t-uppercase"
				>
					enter
				</button>
			</form>
			<div className="c-auth__info">
				Need help? <Link href="/contact">Contact support</Link>
			</div>
		</AuthContainer>
	);
};

export default VerificationForm;
