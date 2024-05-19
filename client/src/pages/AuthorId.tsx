import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Results from '../components/Results';

export default function AuthorId() {
	const { authorId = '' } = useParams();
	const navigate = useNavigate();
	useEffect(() => {
		if (authorId[0] !== '@') navigate('/');
	}, [authorId]);

	return <div className="p-3">{<Results urlQuery={{ authorIds: [authorId.slice(1)] }} />}</div>;
}
