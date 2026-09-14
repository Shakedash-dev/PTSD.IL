import React from 'react';
import {
  Accessibility,
  Baby,
  BookOpen,
  Brain,
  Building2,
  CalendarDays,
  CircleDot,
  ClipboardList,
  Compass,
  FileText,
  GraduationCap,
  HandHeart,
  Heart,
  HeartHandshake,
  Landmark,
  Library,
  Mail,
  MapPin,
  MessageCircle,
  Microscope,
  Phone,
  Shield,
  Users,
  Wind,
  Youtube,
} from 'lucide-react';

const MAP = {
  Accessibility,
  Baby,
  BookOpen,
  Brain,
  Building2,
  CalendarDays,
  ClipboardList,
  Compass,
  FileText,
  GraduationCap,
  HandHeart,
  Heart,
  HeartHandshake,
  Landmark,
  Library,
  Mail,
  MapPin,
  MessageCircle,
  Microscope,
  Phone,
  Shield,
  Users,
  Wind,
  Youtube,
};

/** Lucide icon by name (names come from the shared data files). @param {{ name?: string, className?: string }} props */
export default function Icon({ name, className = 'w-5 h-5' }) {
  const Cmp = (name && MAP[name]) || CircleDot;
  return <Cmp aria-hidden="true" className={className} />;
}
