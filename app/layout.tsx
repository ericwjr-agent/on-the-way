import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cyber Juice — Emergency EV Charging',
  description:
    'On-demand emergency EV charging powered by Cybertrucks. Stranded with a dead battery? We come to you.',
  keywords: ['EV charging', 'emergency charging', 'Cybertruck', 'electric vehicle', 'roadside assistance'],
  openGraph: {
    title: 'Cyber Juice — Emergency EV Charging',
    description: 'On-demand emergency EV charging. We come to you.',
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
  },
  themeColor: '#00d4ff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
