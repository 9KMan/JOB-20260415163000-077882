import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LeadGen Pro - AI-Powered Lead Generation Platform',
  description: 'Modern lead generation and workflow automation platform with AI-powered assistants',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
