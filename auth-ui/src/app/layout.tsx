import "./../styles/globals.css";
import Navbar from "../components/Navbar";

export default function RootLayout({children}:{children:React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div className="container py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
