import { useMemo, useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { pushNotification } from '@/store/slices/notificationSlice';
import { updateProfileCompletionSectionThunk } from '@/store/thunks/profileThunk';
import { AppButton, AppText } from '@/components/common';
import { AppSwitch } from '@/components/form';
import type { ProfileCompletion } from '@/types/profile';
import { SectionShell } from './SectionShell';

const consentItems = [
  {
    key: 'membershipDeclaration',
    label: 'Membership Declaration',
    required: true,
    text: 'I confirm that the information I have provided is accurate and complete to the best of my knowledge.',
  },
  {
    key: 'privacyConsent',
    label: 'Privacy & Data Processing Consent',
    required: true,
    text: 'I consent to BaptistOne, the Nigerian Baptist Convention, my Church, Association, and Conference collecting, storing, and processing my personal information for church administration, pastoral care, membership management, communication, ministry participation, and related church activities in accordance with applicable data protection laws.',
  },
  {
    key: 'churchCommunicationConsent',
    label: 'Church Communication Consent',
    required: true,
    text: 'I agree to receive church-related communications, including announcements, event notifications, ministry updates, prayer requests, pastoral messages, and important membership information through email, SMS, WhatsApp, phone calls, or other approved communication channels.',
  },
  {
    key: 'familyLinkingConsent',
    label: 'Family & Household Linking Consent',
    required: true,
    text: 'I understand that my profile may be linked to my spouse, children, or household members who are registered within the church system for membership administration and family record purposes.',
  },
  {
    key: 'givingConsent',
    label: 'Giving & Financial Records Consent',
    required: false,
    text: 'I consent to the recording and management of my giving, donations, offerings, and other financial contributions made through the church platform for accounting, reporting, and stewardship purposes.',
  },
  {
    key: 'termsAcceptance',
    label: 'Terms of Use Acceptance',
    required: true,
    text: 'I have read and agree to the Church Membership Terms of Use and Privacy Policy.',
  },
];

export const ConsentSection = ({
  profile,
}: {
  profile: ProfileCompletion;
}) => {
  const dispatch = useAppDispatch();
  const verification = profile.verification as Record<string, unknown> | undefined;

  const initialConsentValues = useMemo(() => {
    if (!verification) {
      return consentItems.reduce(
        (acc, item) => ({ ...acc, [item.key]: false }),
        {} as Record<string, boolean>,
      );
    }
    return consentItems.reduce(
      (acc, item) => ({ ...acc, [item.key]: Boolean(verification[item.key]) }),
      {} as Record<string, boolean>,
    );
  }, [verification]);

  const [consentValues, setConsentValues] = useState<Record<string, boolean>>(initialConsentValues);
  const [submitting, setSubmitting] = useState(false);

  const allRequiredChecked = consentItems
    .filter((item) => item.required)
    .every((item) => consentValues[item.key]);

  const fullName = (verification?.fullName as string) ||
    [profile.personalInformation?.firstName, profile.personalInformation?.lastName]
      .filter(Boolean)
      .join(' ') || 'Member';

  const signatureDate = (() => {
    const dateStr = verification?.date as string | undefined;
    if (dateStr) {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  })();

  const handleSubmit = async () => {
    if (!allRequiredChecked) return;

    setSubmitting(true);
    try {
      await dispatch(
        updateProfileCompletionSectionThunk({
          sectionKey: 'consent',
          data: {
            ...consentValues,
            fullName,
            date: new Date().toISOString(),
          },
        }),
      ).unwrap();
      dispatch(
        pushNotification({
          type: 'success',
          title: 'Profile submitted',
          message: 'Your membership profile has been submitted for review.',
        }),
      );
    } catch {
      dispatch(
        pushNotification({
          type: 'error',
          title: 'Submission failed',
          message: 'Something went wrong. Please try again.',
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionShell title="Consent">
      <div className="grid gap-4">
        {consentItems.map((item) => (
          <div
            className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4"
            key={item.key}
          >
            <div className="mb-3 flex items-start gap-3">
              <div className="mt-0.5">
                <AppSwitch
                  checked={consentValues[item.key]}
                  label=""
                  onCheckedChange={(checked) =>
                    setConsentValues((prev) => ({ ...prev, [item.key]: checked }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <AppText variant="bodyMedium" weight="bold">
                    {item.label}
                  </AppText>
                  {item.required && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                      Required
                    </span>
                  )}
                </div>
                <AppText variant="bodySmall" color="textSecondary">
                  {item.text}
                </AppText>
              </div>
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4">
          <AppText variant="bodyMedium" weight="bold" className="mb-3">
            Electronic Signature
          </AppText>
          <div className="grid gap-3">
            <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-2">
              <AppText variant="caption" color="textMuted" weight="bold">
                Full Name
              </AppText>
              <AppText variant="bodySmall" weight="bold" color="textSecondary">
                {fullName}
              </AppText>
            </div>
            <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-2">
              <AppText variant="caption" color="textMuted" weight="bold">
                Date
              </AppText>
              <AppText variant="bodySmall" weight="bold" color="textSecondary">
                {signatureDate}
              </AppText>
            </div>
            <AppText variant="bodySmall" color="textSecondary" className="mt-2 italic">
              By submitting this profile, I acknowledge that the information provided is accurate
              and that I consent to its use for church administration, membership management,
              communication, pastoral care, and related church activities.
            </AppText>
          </div>
        </div>

        <div className="grid gap-2">
          <AppButton
            fullWidth
            loading={submitting}
            disabled={!allRequiredChecked}
            onClick={handleSubmit}
          >
            Submit Membership Profile
          </AppButton>
          <AppText variant="caption" color="textMuted" className="text-center">
            Your membership profile will be reviewed by your church administrator before approval.
            You may be contacted if additional information or verification is required.
          </AppText>
        </div>
      </div>
    </SectionShell>
  );
};
