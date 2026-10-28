import type { IContact } from '@/src/core/domain/models';
import contactData from '@/src/infrastructure/data/contact.json';

// A runtime join: a fixed string here would be merged whole into the bundle by the minifier.
export const contactEmail = (contactData as IContact).emailParts.join('@');
