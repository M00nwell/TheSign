/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            letterSpacing: {
                tighter: -0.8,
                tight: -0.4,
                normal: 0,
                wide: 0.4,
                wider: 0.8,
                widest: 1.6,
            }
        },
    },
    plugins: [],
}
