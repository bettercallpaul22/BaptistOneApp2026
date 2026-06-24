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
  { key: 'personalInformation', title: 'Personal Information' },
  { key: 'contactInformation', title: 'Contact Information' },
  { key: 'identityInformation', title: 'Identity Information' },
  { key: 'membershipInformation', title: 'Membership Information' },
  { key: 'salvationInformation', title: 'Salvation Information' },
  { key: 'baptismInformation', title: 'Baptism Information' },
  { key: 'employmentInformation', title: 'Employment Information' },
  { key: 'familyInformation', title: 'Family Information' },
  { key: 'spouseInformation', title: 'Spouse Information' },
  { key: 'childrenInformation', title: 'Children Information' },
  { key: 'dependants', title: 'Dependants' },
  { key: 'givingPreferences', title: 'Giving Preferences' },
  { key: 'documents', title: 'Documents' },
];

export const memberUploadDefaults = {
  uploadModule: 'baptistone_member' as const,
  isPublic: true,
};

export const titleOptions = [
  { label: 'Mr', value: 'mr' },
  { label: 'Mrs', value: 'mrs' },
  { label: 'Miss', value: 'miss' },
  { label: 'Master', value: 'master' },
  { label: 'Dr', value: 'dr' },
  { label: 'Prof', value: 'prof' },
  { label: 'Rev', value: 'rev' },
  { label: 'Pastor', value: 'pastor' },
  { label: 'Deacon', value: 'deacon' },
  { label: 'Deaconess', value: 'deaconess' },
  { label: 'Evangelist', value: 'evangelist' },
  { label: 'Other', value: 'other' },
];

export const maritalStatusOptions = [
  { label: 'Single', value: 'single' },
  { label: 'Married', value: 'married' },
  { label: 'Engaged', value: 'engaged' },
  { label: 'Widowed', value: 'widowed' },
  { label: 'Divorced', value: 'divorced' },
  { label: 'Separated', value: 'separated' },
];

export const ethnicGroups = [
  { label: 'Yoruba', value: 'yoruba' },
  { label: 'Hausa', value: 'hausa' },
  { label: 'Fulani', value: 'fulani' },
  { label: 'Igbo', value: 'igbo' },
  { label: 'Tiv', value: 'tiv' },
  { label: 'Ibibio', value: 'ibibio' },
  { label: 'Efik', value: 'efik' },
  { label: 'Edo', value: 'edo' },
  { label: 'Urhobo', value: 'urhobo' },
  { label: 'Itsekiri', value: 'itsekiri' },
  { label: 'Ijaw', value: 'ijaw' },
  { label: 'Kanuri', value: 'kanuri' },
  { label: 'Nupe', value: 'nupe' },
  { label: 'Gwari', value: 'gwari' },
  { label: 'Berom', value: 'berom' },
  { label: 'Jukun', value: 'jukun' },
  { label: 'Idoma', value: 'idoma' },
];

export const nigerianStates = [
  { label: 'Abia', value: 'abia' },
  { label: 'Adamawa', value: 'adamawa' },
  { label: 'Akwa Ibom', value: 'akwa_ibom' },
  { label: 'Anambra', value: 'anambra' },
  { label: 'Bauchi', value: 'bauchi' },
  { label: 'Bayelsa', value: 'bayelsa' },
  { label: 'Benue', value: 'benue' },
  { label: 'Borno', value: 'borno' },
  { label: 'Cross River', value: 'cross_river' },
  { label: 'Delta', value: 'delta' },
  { label: 'Ebonyi', value: 'ebonyi' },
  { label: 'Edo', value: 'edo' },
  { label: 'Ekiti', value: 'ekiti' },
  { label: 'Enugu', value: 'enugu' },
  { label: 'FCT', value: 'fct' },
  { label: 'Gombe', value: 'gombe' },
  { label: 'Imo', value: 'imo' },
  { label: 'Jigawa', value: 'jigawa' },
  { label: 'Kaduna', value: 'kaduna' },
  { label: 'Kano', value: 'kano' },
  { label: 'Katsina', value: 'katsina' },
  { label: 'Kebbi', value: 'kebbi' },
  { label: 'Kogi', value: 'kogi' },
  { label: 'Kwara', value: 'kwara' },
  { label: 'Lagos', value: 'lagos' },
  { label: 'Nasarawa', value: 'nasarawa' },
  { label: 'Niger', value: 'niger' },
  { label: 'Ogun', value: 'ogun' },
  { label: 'Ondo', value: 'ondo' },
  { label: 'Osun', value: 'osun' },
  { label: 'Oyo', value: 'oyo' },
  { label: 'Plateau', value: 'plateau' },
  { label: 'Rivers', value: 'rivers' },
  { label: 'Sokoto', value: 'sokoto' },
  { label: 'Taraba', value: 'taraba' },
  { label: 'Yobe', value: 'yobe' },
  { label: 'Zamfara', value: 'zamfara' },
];

export const languageOptions = [
  { label: 'English', value: 'english' },
  { label: 'Yoruba', value: 'yoruba' },
  { label: 'Hausa', value: 'hausa' },
  { label: 'Igbo', value: 'igbo' },
  { label: 'Tiv', value: 'tiv' },
  { label: 'Ibibio', value: 'ibibio' },
  { label: 'Efik', value: 'efik' },
  { label: 'Ijaw', value: 'ijaw' },
  { label: 'Fulfulde', value: 'fulfulde' },
  { label: 'Kanuri', value: 'kanuri' },
  { label: 'Nupe', value: 'nupe' },
  { label: 'French', value: 'french' },
  { label: 'Arabic', value: 'arabic' },
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
    { name: 'avatarFileId', label: 'Profile Photo', type: 'file', ...memberUploadDefaults },
    {
      name: 'title',
      type: 'select',
      options: titleOptions,
      placeholder: 'Select title',
    },
    { name: 'firstName', label: 'First Name' },
    { name: 'middleName', label: 'Middle Name' },
    { name: 'lastName', label: 'Last Name' },
    {
      name: 'gender',
      type: 'radio',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
    },
    { name: 'dob', label: 'Date of Birth', type: 'date' },
    {
      name: 'maritalStatus',
      type: 'select',
      options: maritalStatusOptions,
      placeholder: 'Select marital status',
    },
    {
      name: 'tribe',
      type: 'search-select',
      options: ethnicGroups,
      placeholder: 'Search ethnic group...',
      searchable: true,
    },
    { name: 'hometown', label: 'Hometown' },
    {
      name: 'stateOfOrigin',
      type: 'select',
      options: nigerianStates,
      placeholder: 'Select state',
    },
    {
      name: 'languagesSpoken',
      type: 'multi-select',
      options: languageOptions,
    },
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
  membershipInformation: [
    {
      name: 'membershipType',
      type: 'select',
      options: [
        { label: 'Diaspora', value: 'diaspora' },
        { label: 'Resident/In-Town', value: 'resident' },
        { label: 'Out-of-town', value: 'out_of_town' },
        { label: 'Online', value: 'online' },
      ],
    },
    { name: 'memberSince', type: 'date' },
  ],
  salvationInformation: [
    { name: 'isBornAgain', type: 'boolean' },
    { name: 'salvationDate', type: 'date' },
  ],
  baptismInformation: [
    { name: 'membershipTransferLetterFileId', label: 'Membership Transfer Letter', type: 'file', ...memberUploadDefaults },
  ],
  employmentInformation: [
    {
      name: 'employmentStatus',
      type: 'select',
      options: [
        { label: 'Student', value: 'student' },
        { label: 'Employed', value: 'employed' },
        { label: 'Self Employed', value: 'self_employed' },
        { label: 'Unemployed', value: 'unemployed' },
      ],
    },
    { name: 'school' },
    { name: 'course' },
    { name: 'employer', label: "Employer's Name" },
    { name: 'occupation' },
    { name: 'businessName', label: 'Business Name' },
    { name: 'businessAddress', label: 'Business Address', type: 'textarea' },
    { name: 'workAddress', label: "Employer's Address", type: 'textarea' },
    { name: 'linkedIn', label: 'LinkedIn' },
  ],
  ministryInformation: [
    { name: 'ministryUnit' },
    { name: 'serviceRole' },
    { name: 'skills', type: 'list', placeholder: 'Separate items with commas' },
    { name: 'availability', type: 'list', placeholder: 'Separate items with commas' },
  ],
  familyInformation: [
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
