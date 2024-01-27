import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function IpcListener() {
	const navigate = useNavigate();

	useEffect(() => {
		navigate(window.location.pathname);

		// @ts-ignore
		window.api.handle(
			'go-to',
			// @ts-ignore
			(event, data) =>
				// @ts-ignore
				(event, route) => {
					navigate(route);
				}
		);
	}, []);
	return null;
}
