import { navigate } from './router';

window.addEventListener('click', e => {
	if (e.target.tagName == 'A' ) {
		e.preventDefault(); // Stop the browser from navigating to that link's location
		e.stopPropagation();
		navigate((new URL(e.target.href)).pathname);
	}
});
