import { sectionFieldSchemas } from '../config/profileConfig';
import type {
  ChildFormValue,
  DependantFormValue,
  EditableFieldValue,
  ProfileFieldSchema,
  ProfileFieldType,
} from '../types/profilePageTypes';
import type {
  ProfileCompletion,
  ProfileInformationSection,
  ProfileSectionValue,
} from '@/types/profile';
import { getSectionEntries, getSectionObject } from './profileDisplayUtils';

export const createEmptyChild = (): ChildFormValue => ({
  name: '',
  gender: '',
  dob: '',
  age: '',
  school: '',
});

export const createEmptyDependant = (): DependantFormValue => ({
  name: '',
  relationship: '',
  phone: '',
  age: '',
  isLivingWithUser: false,
});

export const normalizeChildFormValue = (value: unknown): ChildFormValue => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return createEmptyChild();

  const child = value as Record<string, ProfileSectionValue>;

  return {
    name: typeof child.name === 'string' ? child.name : '',
    gender: typeof child.gender === 'string' ? child.gender : '',
    dob: typeof child.dob === 'string' ? child.dob.slice(0, 10) : '',
    age: typeof child.age === 'number' || typeof child.age === 'string' ? String(child.age) : '',
    school: typeof child.school === 'string' ? child.school : '',
  };
};

export const normalizeChildrenFormValue = (value: unknown): ChildFormValue[] => {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeChildFormValue);
};

export const normalizeDependantFormValue = (value: unknown): DependantFormValue => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return createEmptyDependant();

  const dependant = value as Record<string, ProfileSectionValue>;

  return {
    name: typeof dependant.name === 'string' ? dependant.name : '',
    relationship: typeof dependant.relationship === 'string' ? dependant.relationship : '',
    phone: typeof dependant.phone === 'string' ? dependant.phone : '',
    age:
      typeof dependant.age === 'number' || typeof dependant.age === 'string'
        ? String(dependant.age)
        : '',
    isLivingWithUser: Boolean(dependant.isLivingWithUser),
  };
};

export const normalizeDependantsFormValue = (value: unknown): DependantFormValue[] => {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeDependantFormValue);
};

export const isEmptyChild = (child: ChildFormValue) =>
  !child.name.trim() &&
  !child.gender.trim() &&
  !child.dob.trim() &&
  !child.age.trim() &&
  !child.school.trim();

export const isEmptyDependant = (dependant: DependantFormValue) =>
  !dependant.name.trim() &&
  !dependant.relationship.trim() &&
  !dependant.phone.trim() &&
  !dependant.age.trim() &&
  !dependant.isLivingWithUser;

export const isStringArray = (value: EditableFieldValue): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const parseChildrenFormValue = (value: EditableFieldValue): ProfileSectionValue[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is ChildFormValue =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item),
    )
    .filter((child) => !isEmptyChild(child))
    .map((child) => ({
      name: child.name.trim(),
      gender: child.gender,
      dob: child.dob,
      age: child.age.trim() ? Number(child.age) : null,
      school: child.school.trim(),
    }));
};

export const parseDependantsFormValue = (value: EditableFieldValue): ProfileSectionValue[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is DependantFormValue =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item),
    )
    .filter((dependant) => !isEmptyDependant(dependant))
    .map((dependant) => ({
      name: dependant.name.trim(),
      relationship: dependant.relationship.trim(),
      phone: dependant.phone.trim(),
      age: dependant.age.trim() ? Number(dependant.age) : null,
      isLivingWithUser: dependant.isLivingWithUser,
    }));
};

export const getNestedValue = (
  source: ProfileInformationSection,
  path: string,
): ProfileSectionValue => {
  return path.split('.').reduce<ProfileSectionValue>((currentValue, pathPart) => {
    if (!currentValue || typeof currentValue !== 'object' || Array.isArray(currentValue))
      return undefined;
    return (currentValue as ProfileInformationSection)[pathPart];
  }, source);
};

export const setNestedValue = (
  target: ProfileInformationSection,
  path: string,
  value: ProfileSectionValue,
) => {
  const pathParts = path.split('.');
  let cursor = target;

  pathParts.forEach((pathPart, index) => {
    if (index === pathParts.length - 1) {
      cursor[pathPart] = value;
      return;
    }

    const nextValue = cursor[pathPart];
    if (!nextValue || typeof nextValue !== 'object' || Array.isArray(nextValue)) {
      cursor[pathPart] = {};
    }

    cursor = cursor[pathPart] as ProfileInformationSection;
  });
};

export const stringifyFieldValue = (
  value: ProfileSectionValue,
  fieldType?: ProfileFieldType,
): EditableFieldValue => {
  if (fieldType === 'boolean') return Boolean(value);
  if (fieldType === 'file-list')
    return Array.isArray(value) ? value.map((item) => String(item)) : [];
  if (fieldType === 'children-list') return normalizeChildrenFormValue(value);
  if (fieldType === 'dependants-list') return normalizeDependantsFormValue(value);
  if (fieldType === 'family-children-list') {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const section = value as ProfileInformationSection;
      return { children: normalizeChildrenFormValue(section.children) } as EditableFieldValue;
    }
    return { children: [] } as EditableFieldValue;
  }
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.every((item) => ['string', 'number', 'boolean'].includes(typeof item))
      ? value.join(', ')
      : JSON.stringify(value, null, 2);
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, ProfileSectionValue>;
    const parts = Object.values(obj)
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
    return parts.length > 0 ? parts.join(', ') : JSON.stringify(value, null, 2);
  }
  if (fieldType === 'date' && typeof value === 'string') return value.slice(0, 10);
  return String(value);
};

export const getEditableFields = (
  key: keyof ProfileCompletion,
  section: unknown,
): ProfileFieldSchema[] => {
  const schema = sectionFieldSchemas[key];
  if (schema?.length) {
    const sectionObject = getSectionObject(section);
    if (key === 'membershipInformation' && typeof sectionObject.email === 'string') {
      return [{ name: 'email', type: 'email', disabled: true }, ...schema];
    }

    return schema;
  }

  return getSectionEntries(section).map(([fieldKey, value]) => ({
    name: fieldKey,
    disabled: fieldKey === 'email',
    type:
      typeof value === 'boolean'
        ? 'boolean'
        : Array.isArray(value)
          ? 'list'
          : typeof value === 'object'
            ? 'textarea'
            : 'text',
  }));
};

export const getVisibleFields = (
  sectionKey: keyof ProfileCompletion,
  fields: ProfileFieldSchema[],
  formValues: Record<string, EditableFieldValue>,
) => {
  if (sectionKey !== 'employmentInformation') return fields;

  const employmentStatus = String(formValues.employmentStatus ?? '');

  if (employmentStatus === 'student') {
    return fields.filter((field) =>
      ['employmentStatus', 'institution', 'courseOfStudy', 'levelOrYear'].includes(field.name),
    );
  }

  if (employmentStatus === 'employed') {
    return fields.filter((field) =>
      ['employmentStatus', 'occupation', 'employerOrBusinessName'].includes(field.name),
    );
  }

  if (employmentStatus === 'self_employed') {
    return fields.filter((field) =>
      ['employmentStatus', 'occupation', 'employerOrBusinessName'].includes(field.name),
    );
  }

  if (employmentStatus === 'business_owner') {
    return fields.filter((field) =>
      ['employmentStatus', 'occupation', 'employerOrBusinessName'].includes(field.name),
    );
  }

  if (employmentStatus === 'unemployed' || employmentStatus === 'retired') {
    return fields.filter((field) => field.name === 'employmentStatus');
  }

  return fields.filter((field) => field.name === 'employmentStatus');
};

export const buildInitialFormValues = (
  section: unknown,
  fields: ProfileFieldSchema[],
): Record<string, EditableFieldValue> => {
  const sectionData = getSectionObject(section);

  return fields.reduce<Record<string, EditableFieldValue>>((values, field) => {
    if (field.type === 'children-list') {
      const nestedChildren = getNestedValue(sectionData, field.name);
      values[field.name] = normalizeChildrenFormValue(
        Array.isArray(nestedChildren) ? nestedChildren : section,
      );
      return values;
    }

    if (field.type === 'dependants-list') {
      const nestedDependants = getNestedValue(sectionData, field.name);
      values[field.name] = normalizeDependantsFormValue(
        Array.isArray(nestedDependants) ? nestedDependants : section,
      );
      return values;
    }

    if (field.type === 'family-children-list') {
      const familyInfo = getNestedValue(sectionData, 'familyInformation.familyInformation');
      values[field.name] = {
        children: normalizeChildrenFormValue(
          familyInfo && typeof familyInfo === 'object' && !Array.isArray(familyInfo)
            ? (familyInfo as ProfileInformationSection).children
            : familyInfo,
        ),
      } as EditableFieldValue;
      return values;
    }

    values[field.name] = stringifyFieldValue(getNestedValue(sectionData, field.name), field.type);
    return values;
  }, {});
};

export const parseEditableValue = (
  value: EditableFieldValue,
  fieldType?: ProfileFieldType,
): ProfileSectionValue => {
  if (fieldType === 'boolean') return Boolean(value);
  if (fieldType === 'file-list') return isStringArray(value) ? value : [];
  if (fieldType === 'children-list') return parseChildrenFormValue(value);
  if (fieldType === 'dependants-list') return parseDependantsFormValue(value);
  if (fieldType === 'family-children-list') {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as { children?: EditableFieldValue };
      return { children: parseChildrenFormValue(obj.children ?? ([] as EditableFieldValue)) } as ProfileInformationSection;
    }
    return { children: [] } as ProfileInformationSection;
  }

  const stringValue = String(value).trim();

  if (fieldType === 'number') return stringValue ? Number(stringValue) : null;
  if (fieldType === 'list') {
    return stringValue
      ? stringValue
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  }
  if (fieldType === 'textarea' && /^[{[]/.test(stringValue)) {
    try {
      return JSON.parse(stringValue) as ProfileSectionValue;
    } catch {
      return stringValue;
    }
  }

  return stringValue;
};

export const buildSectionPayload = (
  fields: ProfileFieldSchema[],
  formValues: Record<string, EditableFieldValue>,
): ProfileInformationSection =>
  fields.reduce<ProfileInformationSection>((payload, field) => {
    if (field.disabled) return payload;

    setNestedValue(
      payload,
      field.name,
      parseEditableValue(formValues[field.name] ?? '', field.type),
    );
    return payload;
  }, {});
