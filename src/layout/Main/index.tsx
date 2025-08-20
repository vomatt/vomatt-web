import React, { ReactNode } from 'react';

type MainProps = {
	children: ReactNode;
};

export default function Main({ children }: MainProps) {
	return <main id="main">{children}</main>;
}
