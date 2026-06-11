import { type ReactNode } from 'react';
import { AppText } from '@/components/common';

interface HomeSectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export const HomeSection = ({ eyebrow, title, description, children }: HomeSectionProps) => (
  <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16">
    <div className="mx-auto grid max-w-2xl justify-items-center gap-2 text-center">
      {eyebrow && (
        <AppText variant="overline" color="secondary">
          {eyebrow}
        </AppText>
      )}
      <AppText variant="h2">{title}</AppText>
      {description && (
        <AppText variant="bodyLarge" color="textSecondary">
          {description}
        </AppText>
      )}
    </div>
    {children}
  </section>
);
