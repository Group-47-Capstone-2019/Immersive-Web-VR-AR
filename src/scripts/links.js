import { navigate } from './router';

for (let el of document.links) {
	el.addEventListener('click', e => {
		e.preventDefault(); // Stop the browser from navigating to the link's location.
		e.stopPropagation();
		navigate((new URL(el.href)).pathname);
	});
}
