import { navigate } from './router';

const planetsLink = document.getElementById('planets-link');
planetsLink.onclick = () => navigate('/planets');

const fallingLink = document.getElementById('falling-link');
fallingLink.onclick = () => navigate('/');

const pendulumsLink = document.getElementById('pendulums-link');
pendulumsLink.onclick = () => navigate('/');
