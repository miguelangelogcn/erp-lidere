// src/lib/firebase/firestore-types.ts

import type { Timestamp } from 'firebase/firestore';

export interface Pipeline {
    id: string;
    name: string;
    stages: string[];
    deals?: Deal[];
    order: number;
}
  
export interface Deal {
    id: string;
    title: string;
    value: number;
    pipelineId: string;
    stage: string;
    order: number;
    contactId: string;
    ownerId: string;

    // Optional fields populated after fetching
    contactName?: string;
    ownerName?: string;
    createdAt?: Timestamp;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tags?: string[];
  userId?: string | null;
  customData?: { [key: string]: any };
  createdAt?: Timestamp;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  roleId: string;
  role?: string;
  assignedCourses?: string[];
  customData?: { [key: string]: any };
}

export interface Role {
  id: string;
  name: string;
  permissions: { [key: string]: boolean };
}

export interface Product {
    id: string;
    name: string;
    value: number;
    onboardingPlan: {
        [day: string]: string[];
    };
}

export interface OnboardingDailyTask {
    text: string;
    completed: boolean;
}

export interface Onboarding {
    id: string;
    contactId: string;
    contactName: string;
    productId: string;
    productName: string;
    status: 'A Fazer' | 'Fazendo' | 'Feito';
    startDate: Timestamp;
    dailyTasks: {
        [day: string]: OnboardingDailyTask[];
    };
}

export type FinancialAccountType = 'receivable' | 'payable';
export type RecurrenceType = 'none' | 'weekly' | 'monthly' | 'yearly';

export interface FinancialAccount {
    id: string;
    description: string;
    value: number;
    dueDate: Timestamp;
    type: FinancialAccountType;
    category: string;
    recurrence: RecurrenceType;
    createdAt: Timestamp;
}

export interface FinancialDebt {
    id: string;
    name: string;
    creditor: string;
    totalValue: number;
    interestRate: string;
}

export interface Course {
    id: string;
    title: string;
    description: string;
}

export interface Module {
    id: string;
    title: string;
    order: number;
}

export interface Lesson {
    id: string;
    title: string;
    order: number;
    videoUrl?: string;
    content: string;
    attachments: { name: string; url: string }[];
}

export interface UserProgress {
    [lessonId: string]: boolean;
}

export interface FollowUp {
    id: string;
    studentUserId: string;
    contactName: string;
    productId: string;
    productName: string;
    createdAt: Timestamp;
}

export interface ActionPlanTask {
    id: string;
    text: string;
    status: 'pending' | 'completed' | 'validated';
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    submittedText?: string;
    submittedFileUrl?: string;
}

export interface Mentorship {
    id: string;
    videoUrl: string;
    transcript: string;
    attachments: { name: string; url: string }[];
    createdAt: string; // Should be Date or Timestamp, but keeping as string to match current usage
}

export interface Campaign {
    id: string;
    name: string;
    segmentType: 'individual' | 'tags';
    contactIds: string[];
    targetTags: string[];
    channels: ('email' | 'whatsapp')[];
    emailContent?: {
        subject: string;
        body: string;
    };
    whatsappContent?: {
        templateName: string;
    };
    status: 'draft' | 'sent';
    createdAt: Timestamp;
    updatedAt: Timestamp;
    sentAt?: Timestamp;
    stats?: {
        sent: number;
        opened: number;
        clicked: number;
    };
}

export interface Dispatch {
    id: string;
    campaignId: string;
    contactId: string;
    channel: 'email' | 'whatsapp';
    status: 'pending' | 'sent' | 'failed' | 'opened' | 'clicked';
    sentAt: Timestamp;
    error?: string;
}
