/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // หรือ path ที่โปรเจกต์คุณใช้
  ],
  theme: {
    extend: {
      fontFamily: {
        // ตั้งชื่อว่า 'sans' เพื่อให้มันทับฟอนต์ default ของ Tailwind ไปเลย
        // สังเกตชื่อ 'IBM Plex Sans Thai' ต้องตรงกับใน @import เป๊ะๆ
        sans: ['"IBM Plex Sans Thai"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}