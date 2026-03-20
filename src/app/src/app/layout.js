export const metadata = {
  title: 'SecurePlan — תכנון מערכת אבטחה',
  description: 'מיקום אופטימלי למצלמות אבטחה וגלאי אזעקה',
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Heebo', sans-serif" }}>{children}</body>
    </html>
  );
}
