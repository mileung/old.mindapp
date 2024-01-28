import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/theme.ts';
import './styles/globals.css';
import '@fontsource-variable/quicksand';

ReactDOM.createRoot(document.getElementById('root')!).render(
	//<React.StrictMode>
	<App />
	//</React.StrictMode>
);
