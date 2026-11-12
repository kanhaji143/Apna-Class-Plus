/** Landing Page Builder — section types + defaults (original DIY ke template sections se) */

export type SectionType =
  | 'HERO' | 'BANNER_STRIP' | 'FEATURES' | 'TESTIMONIALS'
  | 'PRICING' | 'FAQ' | 'VIDEO' | 'FOOTER' | 'FREE_MATERIAL';

export interface BaseSection {
  id: string;
  type: SectionType;
  props: Record<string, any>;
}

export interface Theme {
  colors: { primary: string; bg: string };
  font: string;
  radius: number;
}

export const DEFAULT_THEME: Theme = {
  colors: { primary: '#6C5CE7', bg: '#FFFFFF' },
  font: 'Nunito Sans',
  radius: 12,
};

let uid = 0;
export const nextId = (type: string) => `${type.toLowerCase().replace('_', '-')}-${Date.now()}-${++uid}`;

export const SECTION_LIBRARY: { type: SectionType; label: string; icon: string }[] = [
  { type: 'HERO', label: 'Hero', icon: '🏆' },
  { type: 'BANNER_STRIP', label: 'Banner Strip', icon: '⭐' },
  { type: 'FEATURES', label: 'Features', icon: '🎯' },
  { type: 'TESTIMONIALS', label: 'Testimonials', icon: '💬' },
  { type: 'PRICING', label: 'Pricing', icon: '💰' },
  { type: 'FAQ', label: 'FAQ', icon: '❓' },
  { type: 'VIDEO', label: 'Video', icon: '🎬' },
  { type: 'FREE_MATERIAL', label: 'Free Material', icon: '🎁' },
  { type: 'FOOTER', label: 'Footer', icon: '📞' },
];

export function defaultSection(type: SectionType): BaseSection {
  const id = nextId(type);
  switch (type) {
    case 'HERO':
      return { id, type, props: { headline: 'Best Coaching in Town', subheadline: 'Padhai jo result deti hai', ctaText: 'Start Learning', ctaLink: '#lead-form', bgImage: '' } };
    case 'BANNER_STRIP':
      return { id, type, props: { text: '⭐ Free demo lecture every Sunday', speed: 20 } };
    case 'FEATURES':
      return { id, type, props: { items: [
        { icon: '🎯', title: 'Doubt Sessions', desc: 'Daily live doubt clearing' },
        { icon: '📚', title: 'Study Material', desc: 'Complete PDFs + notes' },
        { icon: '⏱', title: 'Test Series', desc: 'Weekly tests + analysis' },
      ] } };
    case 'TESTIMONIALS':
      return { id, type, props: { items: [
        { quote: 'Maine 68% se 92% kiya!', name: 'Ravi', rating: 5 },
        { quote: 'Teachers bahut supportive hain.', name: 'Meena', rating: 5 },
      ] } };
    case 'PRICING':
      return { id, type, props: { plans: [
        { name: 'Basic', price: 499, strike: 999, features: ['Recorded lectures', 'PDFs'], ctaText: 'Buy Now' },
        { name: 'Pro', price: 999, strike: 1999, features: ['Recorded lectures', 'PDFs', 'Live classes'], ctaText: 'Buy Now' },
      ] } };
    case 'FAQ':
      return { id, type, props: { items: [
        { q: 'Kya demo free hai?', a: 'Haan, har Sunday free demo hota hai.' },
        { q: 'Refund milega?', a: '7 din ke andar full refund.' },
      ] } };
    case 'VIDEO':
      return { id, type, props: { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Demo lecture' } };
    case 'FREE_MATERIAL':
      // items sirf fallback hain — public render pe live /lp/api/free-materials fetch hota hai
      return { id, type, props: { heading: 'Free Study Material', items: [
        { title: 'Class 10 Maths Formula Sheet', url: '' },
      ] } };
    case 'FOOTER':
      return { id, type, props: { contact: '📞 98XXXXXXXX', links: [{ text: 'About Us', url: '#' }, { text: 'Courses', url: '#' }], social: [{ text: 'Instagram', url: '#' }] } };
  }
}
