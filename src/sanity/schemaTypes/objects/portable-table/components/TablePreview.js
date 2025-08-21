import { Box, Stack, Card, Text } from '@sanity/ui';
import TablePortableText from '@/components/PortableTable/TablePortableText';

const Table = ({ rows }) => {
	return (
		<div style={{ minWidth: '700px' }}>
			<table
				style={{
					borderCollapse: 'collapse',
				}}
			>
				<tbody>
					{rows.map((row) => (
						<tr key={row._key}>
							{row?.cells?.map((cell) => {
								return (
									<td
										key={cell._key}
										style={{ border: '1px solid #d4d5db', padding: '12px' }}
									>
										<TablePortableText blocks={cell.text} />
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export function TablePreview(props) {
	const { rows } = props;

	return (
		<Stack>
			<Card borderBottom padding={4}>
				<Text size={4} weight="bold">
					Table
				</Text>
			</Card>
			<Box overflow={'auto'}>
				{rows.length === 0 ? (
					<Card padding={4}>
						<Text>EmptyTable</Text>
					</Card>
				) : (
					<Table rows={rows} />
				)}
			</Box>
		</Stack>
	);
}
