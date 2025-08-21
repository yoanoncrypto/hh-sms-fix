import { User, MessageTemplate } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    phoneNumber: '+359888123456',
    email: 'ivan.petrov@email.bg',
    name: 'Ivan Petrov',
    country: 'BG',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    lastContactedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    phoneNumber: '+380671234567',
    email: 'anna.kovalenko@email.ua',
    name: 'Anna Kovalenko',
    country: 'UA',
    status: 'active',
    createdAt: new Date('2024-01-16'),
  },
  {
    id: '3',
    phoneNumber: '+48123456789',
    email: 'jan.kowalski@email.pl',
    name: 'Jan Kowalski',
    country: 'PL',
    status: 'inactive',
    createdAt: new Date('2024-01-17'),
  },
];

export const mockTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Welcome SMS',
    type: 'sms',
    content: 'Welcome {{name}}! Thanks for joining us.',
    variables: ['name'],
  },
  {
    id: '2',
    name: 'Newsletter Email',
    type: 'email',
    subject: 'Weekly Newsletter - {{date}}',
    content: 'Hello {{name}},\n\nHere\'s your weekly update...',
    variables: ['name', 'date'],
  },
  {
    id: '3',
    name: 'Promotion SMS',
    type: 'sms',
    content: 'Special offer just for you! Get 20% off with code SAVE20.',
    variables: [],
  },
];