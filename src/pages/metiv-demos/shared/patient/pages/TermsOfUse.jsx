import React from 'react';
import LegalPage from './LegalPage';
import { TERMS_HE, TERMS_UPDATED_HE } from '../legal';

export default function TermsOfUse() {
  return (
    <LegalPage
      slug="terms-of-use"
      titleKey="terms_of_use"
      updated={TERMS_UPDATED_HE}
      content={TERMS_HE}
    />
  );
}
