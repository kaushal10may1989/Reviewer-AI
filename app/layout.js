export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Code Review AI Agent</title>
        <meta name="description" content="AI-powered code review with language autodetection" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" />
      </head>
      <body className="bg-gray-50">
        <main>{children}</main>
      </body>
    </html>
  );
}