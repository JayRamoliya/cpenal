// Apex Cloud Client Script
console.log('Site initialized successfully on cPanel server.');

document.addEventListener('DOMContentLoaded', () => {
  const currentYear = new Date().getFullYear();
  const yearElem = document.querySelector('.current-year');
  if (yearElem) {
    yearElem.textContent = currentYear;
  }
});
