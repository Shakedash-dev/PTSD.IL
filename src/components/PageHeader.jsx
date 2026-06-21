import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function PageHeader({ icon: Icon = HelpCircle, title, subtitle }) {
  return (
    <div className="w-full bg-card border-b border-border">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-24 pb-10 flex flex-col items-center text-center">
        {/* Row 1: main header */}
        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-2 leading-snug">
          {title}
        </h1>
        {/* Row 2: sub-header context */}
        {subtitle && (
          <p className="font-body text-card-foreground leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}