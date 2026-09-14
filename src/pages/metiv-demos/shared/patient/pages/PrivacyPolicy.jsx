import React from 'react';
import LegalPage from './LegalPage';
import { PRIVACY_HE, PRIVACY_UPDATED_HE } from '../legal';

export default function PrivacyPolicy() {
  return (
    <LegalPage
      slug="privacy-policy"
      titleKey="privacy_policy"
      updated={PRIVACY_UPDATED_HE}
      content={PRIVACY_HE}
    />
  );
}
