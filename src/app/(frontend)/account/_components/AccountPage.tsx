'use client';
import Button from '@/components/Button';
import { logout } from '@/lib/auth';
import defineMetadata from '@/lib/defineMetadata';

export async function generateMetadata({}) {
	return defineMetadata({ data: {} });
}

export type AccountPageType = {
	userData: any;
};

export default function AccountPage({ userData }: AccountPageType) {
	return (
		<div className="min-h-screen px-contain">
			<h1 className="text-white mb-12">Hi {userData?.nickName}</h1>
			<Button onClick={() => logout()}>Log out</Button>
		</div>
	);
}
