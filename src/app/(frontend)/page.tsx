import { getCurrentUser } from '@/data/auth';
import { FeedList } from './_components/FeedList';
import Link from 'next/link';
import { Button } from '@/components/Button';
// export async function generateMetadata({}) {}

const fakeData = [
	{
		title:
			'您是否同意中油第三天然氣接收站遷離桃園大潭藻礁海岸及海域？（即北起觀音溪出海口，南至新屋溪出海口之海岸，及由上述海岸最低潮線往外平行延伸五公里之海域）',
		description: 'Description',
	},
	{
		title:
			'你是否同意公民投票案公告成立後半年內，若該期間內遇有全國性選舉時，在符合公民投票法規定之情形下，公民投票應與該選舉同日舉行？',
		description: 'Description',
	},
	{
		title:
			'你是否同意政府應全面禁止進口含有萊克多巴胺之乙型受體素豬隻之肉品、內臟及其相關產製品？',
		description: 'Description',
	},
];

export default async function Page() {
	const user = await getCurrentUser();

	return (
		<div className="px-contain">
			<div className="flex justify-center gap-10">
				<FeedList data={fakeData} className="" />
				{!user && (
					<div className=" bg-gray-800 rounded-lg p-6 h-fit text-center max-w-sm">
						<h4 className="text-white font-bold text-2xl">
							Log in or sign up for Vomatt
						</h4>
						<p className="text-gray mt-2">
							See what people are talking about and join the conversation.
						</p>
						<Button asChild className="mt-5">
							<Link href="/login">Log in</Link>
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
