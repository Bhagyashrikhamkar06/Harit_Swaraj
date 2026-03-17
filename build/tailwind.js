/* Fallback styling for Harit Swaraj when Tailwind CDN is blocked */
console.log('🛡️ Harit Swaraj: Tailwind Fallback Loaded');

// Basic utility classes needed for the login screen and layout
const style = document.createElement('style');
style.innerHTML = `
:root {
  --green-600: #16a34a;
  --green-700: #15803d;
}
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
.bg-green-600 { background-color: var(--green-600); }
.bg-green-700 { background-color: var(--green-700); }
.text-green-600 { color: var(--green-600); }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.min-h-screen { min-height: 100vh; }
.p-4 { padding: 1rem; }
.m-4 { margin: 1rem; }
.w-full { width: 100%; }
.max-w-md { max-width: 28rem; }
.rounded-lg { border-radius: 0.5rem; }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
.bg-white { background-color: white; }
.border { border: 1px solid #e5e7eb; }
.p-2 { padding: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.font-bold { font-weight: 700; }
.text-lg { font-size: 1.125rem; }
.text-2xl { font-size: 1.5rem; }
.text-white { color: white; }
.cursor-pointer { cursor: pointer; }
`;
document.head.appendChild(style);
