'use strict';

const minionBtn = document.querySelector('#minion-btn');
minionBtn.addEventListener('click', () => {
	const body = document.querySelector('body');
	body.classList.toggle('minion-bg');
});
