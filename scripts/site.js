export const setupSiteHeader = () => {
  const header = document.getElementById('site-header');
  if (!header) return;

  const updateState = () => {
    const isScrolled = window.scrollY > 12;
    header.classList.toggle('topbar--scrolled', isScrolled);
  };

  updateState();
  window.addEventListener('scroll', updateState, { passive: true });
};
