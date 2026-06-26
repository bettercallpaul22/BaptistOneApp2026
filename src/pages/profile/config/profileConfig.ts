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
  // { key: 'identityInformation', title: 'Identity Information' },
  // { key: 'membershipInformation', title: 'Membership Information' },
  { key: 'salvationInformation', title: 'Salvation Information' },
  { key: 'baptismInformation', title: 'Baptism Information' },
  { key: 'employmentInformation', title: 'Employment Information' },
  { key: 'familyInformation', title: 'Household Information' },
  // { key: 'spouseInformation', title: 'Spouse Information' },
  // { key: 'childrenInformation', title: 'Children Information' },
  // { key: 'dependants', title: 'Dependants' },
  { key: 'emergencyContact', title: 'Emergency Contact' },
  // { key: 'givingPreferences', title: 'Giving Preferences' }, 
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

export const lgaOptions = [
  { label: 'Select LGA', value: '' },
  { label: 'Agege', value: 'agege' },
  { label: 'Ajeromi-Ifelodun', value: 'ajeromi_ifelodun' },
  { label: 'Alimosho', value: 'alimosho' },
  { label: 'Amuwo-Odofin', value: 'amuwo_odofin' },
  { label: 'Badagry', value: 'badagry' },
  { label: 'Epe', value: 'epe' },
  { label: 'Eti-Osa', value: 'eti_osa' },
  { label: 'Ibeju-Lekki', value: 'ibeju_lekki' },
  { label: 'Ikeja', value: 'ikeja' },
  { label: 'Ikorodu', value: 'ikorodu' },
  { label: 'Kosofe', value: 'kosofe' },
  { label: 'Lagos Island', value: 'lagos_island' },
  { label: 'Lagos Mainland', value: 'lagos_mainland' },
  { label: 'Mushin', value: 'mushin' },
  { label: 'Ojo', value: 'ojo' },
  { label: 'Oshodi-Isolo', value: 'oshodi_isolo' },
  { label: 'Shomolu', value: 'shomolu' },
  { label: 'Surulere', value: 'surulere' },
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
    { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+2348030000000' },
    { name: 'whatsappNumber', label: 'WhatsApp Number', type: 'tel', placeholder: '+2348030000000' },
    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'example@email.com', disabled: true },
    { name: 'homeAddress', label: 'Home Address', type: 'textarea', placeholder: 'Enter your home address' },
    { name: 'landmark', label: 'Landmark Near Home', placeholder: 'e.g. Near shopping mall' },
    { name: 'city', label: 'City / Town', placeholder: 'e.g. Lagos' },
    {
      name: 'lga',
      label: 'LGA',
      type: 'select',
      options: lgaOptions.filter((opt) => opt.value !== ''),
      placeholder: 'Select LGA',
    },
    {
      name: 'state',
      label: 'State',
      type: 'select',
      options: nigerianStates,
      placeholder: 'Select State',
    },
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
    {
      name: 'isBornAgain',
      label: 'Born Again',
      type: 'radio',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
    { name: 'salvationDate', label: 'Date of Salvation', type: 'date' },
    { name: 'placeOfSalvation', label: 'Place of Salvation', placeholder: 'Optional' },
    {
      name: 'wouldLikeSpiritualMentorship',
      label: 'Would Like Spiritual Mentorship',
      type: 'radio',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  ],
  baptismInformation: [
    {
      name: 'isBaptized',
      label: 'Baptized',
      type: 'radio',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
    {
      name: 'baptismType',
      label: 'Baptism Type',
      type: 'select',
      options: [
        { label: 'Immersion', value: 'immersion' },
        { label: 'Sprinkling', value: 'sprinkling' },
        { label: 'Other', value: 'other' },
      ],
      placeholder: 'Select baptism type',
    },
    { name: 'dateOfBaptism', label: 'Date of Baptism', type: 'date' },
    { name: 'churchBaptized', label: 'Church Baptized' },
  ],
  employmentInformation: [
    {
      name: 'employmentStatus',
      label: 'Employment Status',
      type: 'select',
      options: [
        { label: 'Employed', value: 'employed' },
        { label: 'Self-Employed', value: 'self_employed' },
        { label: 'Business Owner', value: 'business_owner' },
        { label: 'Student', value: 'student' },
        { label: 'Retired', value: 'retired' },
        { label: 'Unemployed', value: 'unemployed' },
      ],
      placeholder: 'Select employment status',
    },
    { name: 'institution', label: 'Institution' },
    { name: 'courseOfStudy', label: 'Course of Study' },
    { name: 'levelOrYear', label: 'Level / Year' },
    { name: 'occupation', label: 'Occupation' },
    { name: 'employerOrBusinessName', label: 'Employer / Business Name' },
  ],
  ministryInformation: [
    { name: 'ministryUnit' },
    { name: 'serviceRole' },
    { name: 'skills', type: 'list', placeholder: 'Separate items with commas' },
    { name: 'availability', type: 'list', placeholder: 'Separate items with commas' },
  ],
  familyInformation: [
    { name: 'spouseName', label: 'Spouse Name', placeholder: 'Enter spouse name' },
    { name: 'spousePhone', label: 'Spouse Phone', type: 'tel', placeholder: '+2348030000000' },
    { name: 'familyInformation.familyInformation', label: 'Children', type: 'family-children-list' },
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
    { name: 'name', label: 'Full Name' },
    { name: 'address', label: 'Address', type: 'textarea' },
    {
      name: 'relationship',
      label: 'Relationship',
      type: 'select',
      options: [
        { label: 'Spouse', value: 'spouse' },
        { label: 'Father', value: 'father' },
        { label: 'Mother', value: 'mother' },
        { label: 'Son', value: 'son' },
        { label: 'Daughter', value: 'daughter' },
        { label: 'Brother', value: 'brother' },
        { label: 'Sister', value: 'sister' },
        { label: 'Uncle', value: 'uncle' },
        { label: 'Aunt', value: 'aunt' },
        { label: 'Cousin', value: 'cousin' },
        { label: 'Guardian', value: 'guardian' },
        { label: 'Friend', value: 'friend' },
        { label: 'Relative', value: 'relative' },
        { label: 'Other', value: 'other' },
      ],
      placeholder: 'Select relationship',
    },
    { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+2348030000000' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'example@email.com' },
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
    { name: 'membershipTransferLetterFileId', label: 'Membership Transfer Letter', type: 'file', ...memberUploadDefaults },
    { name: 'marriageCertificateFileId', label: 'Marriage Certificate', type: 'file', ...memberUploadDefaults },
  ],
  verification: [
    { name: 'verificationStatus' },
    { name: 'verifiedAt', type: 'date' },
    { name: 'notes', type: 'textarea' },
  ],
};

export const emptyText = 'Not provided';
export const churchAssociationFallback = 'Association not provided';
