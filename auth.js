window.addEventListener('load', () => {
  const token = localStorage.getItem('jwt');

  // ✅ Secure Chat Navigation
  const chatLink = document.getElementById('chatLink');
  if (chatLink) {
    chatLink.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!token) return window.location.href = '/login';

      try {
        const res = await fetch('/chat', {
          method: 'GET',
          headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error('Unauthorized');
        const html = await res.text();
        document.body.innerHTML = html;
      } catch (err) {
        alert('Access denied. Please log in again.');
        localStorage.removeItem('jwt');
        window.location.href = '/login';
      }
    });
  } else {
    console.warn('chatLink not found');
  }

  // ✅ Dynamic Navbar Update
  const navActions = document.getElementById('navActions');
  if (navActions) {
    if (token) {
      navActions.innerHTML = `
        <button id="logoutBtn" class="bg-btn_bg text-white px-4 py-2 rounded hover:bg-hover">
          Logout
        </button>
      `;
      document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('jwt');
        window.location.href = '/login';
      });
    } else {
      navActions.innerHTML = `
        <a href="/login" class="bg-btn_bg text-white px-4 py-2 rounded hover:bg-hover mr-2">Login</a>
        <a href="/register" class="bg-btn_bg text-white px-4 py-2 rounded hover:bg-hover">Sign Up</a>
      `;
    }
  } else {
    console.warn('navActions not found');
  }
});