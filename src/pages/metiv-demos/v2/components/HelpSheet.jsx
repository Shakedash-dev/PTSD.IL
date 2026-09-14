import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Phone, MessageCircle, MapPin, LogOut, HeartHandshake } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from './Sheet';import { DemoLink } from '@/pages/metiv-demos/shared/DemoChrome';
import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { PATIENT_HUB } from '@/pages/metiv-demos/shared/patient';
import { cn } from '@/lib/utils';
import { ERAN_PHONE, ERAN_WHATSAPP, FOCUS_LIGHT, telHref } from '../lib';
import { quickExit } from './QuickExit';

const HelpContext = createContext({ openHelp: () => {} });
export const useHelp = () => useContext(HelpContext);

/** Holds the "עזרה עכשיו" sheet so the header button and the bottom bar share one. */
export function HelpProvider({ children, area }) {
  const [open, setOpen] = useState(false);
  const openHelp = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ openHelp }), [openHelp]);
  return (
    <HelpContext.Provider value={value}>
      {children}
      <HelpSheet open={open} onOpenChange={setOpen} area={area} />
    </HelpContext.Provider>
  );
}

const ROW = cn(
  'flex items-center gap-4 w-full rounded-super-sm border border-border bg-card p-4 text-foreground transition-colors duration-300 hover:bg-muted',
  FOCUS_LIGHT
);

/** Bottom sheet with crisis and next-step contacts (ERAN pattern). Always light: it is for people, not a place. */
function HelpSheet({ open, onOpenChange, area }) {
  const close = () => onOpenChange(false);
  const consultation = PATIENT_HUB.consultation;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-super bg-background border-border max-h-[90vh] overflow-y-auto pb-8" dir="rtl">
        <div className="mx-auto max-w-lg">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" aria-hidden="true" />
          <SheetTitle className="font-heading font-semibold text-2xl text-foreground text-start">עזרה עכשיו</SheetTitle>
          <SheetDescription className="text-card-foreground text-start mt-1 mb-5">
            אם קשה עכשיו, אפשר לדבר עם מישהו. השיחה אנונימית.
          </SheetDescription>

          <div className="space-y-3">
            <a href={telHref(ERAN_PHONE)} className={cn(ROW, 'bg-primary text-primary-foreground border-primary hover:bg-accent')}>
              <span className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-primary-foreground/15">
                <Phone className="w-6 h-6" aria-hidden="true" />
              </span>
              <span className="flex-1 text-start">
                <span className="block font-heading font-semibold text-lg">חיוג לער&quot;ן {ERAN_PHONE}</span>
                <span className="block text-sm opacity-90">עזרה ראשונה נפשית, בכל שעה</span>
              </span>
            </a>
            <a href={ERAN_WHATSAPP} target="_blank" rel="noopener noreferrer" className={ROW}>
              <span className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-primary/10 text-accent">
                <MessageCircle className="w-6 h-6" aria-hidden="true" />
              </span>
              <span className="flex-1 text-start">
                <span className="block font-heading font-semibold">ער&quot;ן בוואטסאפ</span>
                <span className="block text-sm text-card-foreground">כתיבה במקום שיחה</span>
              </span>
            </a>
            <a href={telHref(consultation.phone)} className={ROW}>
              <span className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-primary/10 text-accent">
                <HeartHandshake className="w-6 h-6" aria-hidden="true" />
              </span>
              <span className="flex-1 text-start">
                <span className="block font-heading font-semibold">{consultation.title}</span>
                <span className="block text-sm text-card-foreground">
                  מטיב: <span dir="ltr">{consultation.phone}</span>
                </span>
              </span>
            </a>
            <DemoLink to={ROUTES.whereToGetHelp} onClick={close} className={ROW}>
              <span className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-primary/10 text-accent">
                <MapPin className="w-6 h-6" aria-hidden="true" />
              </span>
              <span className="flex-1 text-start">
                <span className="block font-heading font-semibold">איפה מקבלים טיפול</span>
                <span className="block text-sm text-card-foreground">מסגרות ופרטי פנייה</span>
              </span>
            </DemoLink>
          </div>

          {area === 'patient' && (
            <a
              href="#quick-exit"
              onClick={(e) => {
                e.preventDefault();
                quickExit();
              }}
              className={cn('mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground underline underline-offset-4', FOCUS_LIGHT)}
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              יציאה מהירה מהאתר
            </a>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
