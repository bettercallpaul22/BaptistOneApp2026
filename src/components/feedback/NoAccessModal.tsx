import { AppButton, AppText } from '@/components/common';
import { AppModal } from '@/components/feedback/AppModal';

interface NoAccessModalProps {
  open: boolean;
  onLogout: () => void;
}

export function NoAccessModal({ open, onLogout }: NoAccessModalProps) {
  return (
    <AppModal
      open={open}
      title="Account Not Available"
      onClose={onLogout}
      footer={
        <AppButton fullWidth onClick={onLogout}>
          Sign In with Another Account
        </AppButton>
      }
    >
      <div className="grid gap-3 text-center">
        <AppText variant="bodyLarge">
          Your account does not have an access type supported by this app.
          Please register as a church member or create a profile to continue.
        </AppText>
      </div>
    </AppModal>
  );
}

interface RegisterRequiredModalProps {
  open: boolean;
  onLogout: () => void;
}

export function RegisterRequiredModal({ open, onLogout }: RegisterRequiredModalProps) {
  return (
    <AppModal
      open={open}
      title="Access Restricted"
      onClose={onLogout}
      footer={
        <AppButton fullWidth onClick={onLogout}>
          Register to Continue
        </AppButton>
      }
    >
      <div className="grid gap-3 text-center">
        <AppText variant="bodyLarge">
          You need to register as a church member or create a profile before accessing this app.
        </AppText>
      </div>
    </AppModal>
  );
}
