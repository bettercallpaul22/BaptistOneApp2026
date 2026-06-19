import type { AppScrollableTab } from '@/components/common';
import type { ProfileCompletion } from '@/types/profile';
import type { ProfileFieldSchema, ProfileTab } from '../types/profilePageTypes';

export const tabs: AppScrollableTab[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'church', label: 'Church' },
];

export const tabText: Record<ProfileTab, string> = {
  profile: 'Profile',
  church: 'Church',
};

export const informationGroups: Array<{ key: keyof ProfileCompletion; title: string }> = [
  { key: 'churchInformation', title: 'Church Information' },
  { key: 'personalInformation', title: 'Personal Information' },
  { key: 'contactInformation', title: 'Contact Information' },
  { key: 'identityInformation', title: 'Identity Information' },
  { key: 'membershipInformation', title: 'Membership Information' },
  { key: 'salvationInformation', title: 'Salvation Information' },
  { key: 'baptismInformation', title: 'Baptism Information' },
  { key: 'employmentInformation', title: 'Employment Information' },
  { key: 'ministryInformation', title: 'Ministry Information' },
  { key: 'familyInformation', title: 'Family Information' },
  { key: 'spouseInformation', title: 'Spouse Information' },
  { key: 'childrenInformation', title: 'Children Information' },
  { key: 'dependants', title: 'Dependants' },
  { key: 'emergencyContact', title: 'Emergency Contact' },
  { key: 'churchInterests', title: 'Church Interests' },
  { key: 'givingPreferences', title: 'Giving Preferences' },
  { key: 'documents', title: 'Documents' },
  { key: 'verification', title: 'Verification' },
];

export const memberUploadDefaults = {
  uploadModule: 'baptistone_member' as const,
  isPublic: true,
};

export const maritalStatusOptions = [
  { label: 'single', value: 'single' },
  { label: 'married', value: 'married' },
  { label: 'divorce', value: 'divorce' },
  { label: 'widow', value: 'widow' },
  { label: 'widower', value: 'widower' },
];

export const sectionFieldSchemas: Partial<Record<keyof ProfileCompletion, ProfileFieldSchema[]>> = {
  churchInformation: [
    { name: 'conferenceId' },
    { name: 'conventionId' },
    { name: 'associationId' },
    { name: 'preferredChurchId' },
    { name: 'previousChurchName' },
    { name: 'preferredChurchName' },
    { name: 'currentlyAttendsChurch', type: 'boolean' },
  ],
  personalInformation: [
    { name: 'avatarFileId', label: 'Avatar', type: 'file', ...memberUploadDefaults },
    { name: 'firstName' },
    { name: 'lastName' },
    { name: 'displayName' },
    { name: 'dob', label: 'Date Of Birth', type: 'date' },
    {
      name: 'gender',
      type: 'select',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
    },
    { name: 'country' },
    { name: 'countryCode' },
  ],
  contactInformation: [
    { name: 'phone', type: 'tel' },
    { name: 'email', type: 'email', disabled: true },
    { name: 'address', type: 'textarea' },
  ],
  identityInformation: [
    { name: 'nin', label: 'NIN' },
    {
      name: 'validIdType',
      type: 'select',
      options: [
        { label: 'national_id', value: 'national_id' },
        { label: 'passport', value: 'passport' },
      ],
    },
    { name: 'validIdFileId', type: 'file', ...memberUploadDefaults },
    { name: 'verificationConsent', type: 'boolean' },
  ],
  membershipInformation: [{ name: 'membershipType' }, { name: 'memberSince', type: 'date' }],
  salvationInformation: [
    { name: 'isBornAgain', type: 'boolean' },
    { name: 'salvationDate', type: 'date' },
  ],
  baptismInformation: [
    { name: 'passportPhotoFileId', label: 'Passport Photo', type: 'file', ...memberUploadDefaults },
    { name: 'validIdFileId', label: 'Valid ID', type: 'file', ...memberUploadDefaults },
    { name: 'baptismCertificateFileId', label: 'Baptism Certificate', type: 'file', ...memberUploadDefaults },
    { name: 'membershipTransferLetterFileId', label: 'Membership Transfer Letter', type: 'file', ...memberUploadDefaults },
    { name: 'otherDocumentFileIds', label: 'Other Documents', type: 'file-list', ...memberUploadDefaults },
  ],
  employmentInformation: [
    {
      name: 'employmentStatus',
      type: 'select',
      options: [
        { label: 'Student', value: 'student' },
        { label: 'Employed', value: 'employed' },
        { label: 'Unemployed', value: 'unemployed' },
      ],
    },
    { name: 'school' },
    { name: 'course' },
    { name: 'employer' },
    { name: 'occupation' },
    { name: 'workAddress', type: 'textarea' },
    { name: 'linkedIn', label: 'LinkedIn' },
  ],
  ministryInformation: [
    { name: 'ministryUnit' },
    { name: 'serviceRole' },
    { name: 'skills', type: 'list', placeholder: 'Separate items with commas' },
    { name: 'availability', type: 'list', placeholder: 'Separate items with commas' },
  ],
  familyInformation: [
    { name: 'maritalStatus', type: 'select', options: maritalStatusOptions },
    { name: 'familyRole' },
    { name: 'householdSize', type: 'number' },
    { name: 'hasChildren', type: 'boolean' },
    { name: 'nextOfKinName' },
    { name: 'nextOfKinPhone', type: 'tel' },
    { name: 'nextOfKinRelationship' },
  ],
  spouseInformation: [
    { name: 'spouseName', label: 'Spouse Name' },
    { name: 'spousePhone', label: 'Spouse Phone', type: 'tel' },
    { name: 'spouseEmail', label: 'Spouse Email', type: 'email' },
    { name: 'dateOfMarriage', label: 'Date of Marriage', type: 'date' },
    { name: 'weddingAnniversary', label: 'Wedding Anniversary', type: 'date' },
    { name: 'spouseIsMember', label: 'Spouse Is Member', type: 'boolean' },
  ],
  childrenInformation: [{ name: 'children', type: 'children-list' }],
  dependants: [{ name: 'dependants', type: 'dependants-list' }],
  emergencyContact: [
    { name: 'name' },
    { name: 'relationship' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'tel' },
    { name: 'alternatePhone', type: 'tel' },
    { name: 'address', type: 'textarea' },
  ],
  churchInterests: [
    { name: 'skills', type: 'list', placeholder: 'Separate items with commas' },
    { name: 'preferredServiceUnit' },
    { name: 'volunteerAvailability', type: 'list', placeholder: 'Separate items with commas' },
    { name: 'interestedInMinistries', type: 'list', placeholder: 'Separate items with commas' },
    { name: 'interestedInDepartments', type: 'list', placeholder: 'Separate items with commas' },
    { name: 'wouldLikePastoralFollowUp', type: 'boolean' },
  ],
  givingPreferences: [
    {
      name: 'givingCategories',
      type: 'multi-select',
      options: [
        { label: 'Tithe', value: 'tithe' },
        { label: 'Offering', value: 'offering' },
        { label: 'Due', value: 'due' },
      ],
    },
    {
      name: 'preferredGivingChannels',
      type: 'multi-select',
      options: [
        { label: 'Wallet', value: 'wallet' },
        { label: 'Bank Transfer', value: 'bank_transfer' },
        { label: 'Card', value: 'card' },
        { label: 'Cash', value: 'cash' },
      ],
    },
    { name: 'recurringGivingEnabled', type: 'boolean' },
    { name: 'recurringGivingAmount', type: 'number' },
    {
      name: 'recurringGivingFrequency',
      type: 'select',
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ],
    },
    { name: 'receiveGivingReceipts', type: 'boolean' },
    { name: 'receiveGivingReminders', type: 'boolean' },
    { name: 'anonymousGivingDefault', type: 'boolean' },
  ],
  documents: [
    { name: 'passportPhotoFileId', type: 'file', ...memberUploadDefaults },
    { name: 'validIdFileId', type: 'file', ...memberUploadDefaults },
    { name: 'baptismCertificateFileId', type: 'file', ...memberUploadDefaults },
    { name: 'membershipTransferLetterFileId', type: 'file', ...memberUploadDefaults },
    { name: 'otherDocumentFileIds', type: 'file-list', ...memberUploadDefaults },
  ],
  verification: [
    { name: 'verificationStatus' },
    { name: 'verifiedAt', type: 'date' },
    { name: 'notes', type: 'textarea' },
  ],
};

export const emptyText = 'Not provided';
export const churchAssociationFallback = 'Association not provided';
