import { Church } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { useAppSelector } from '@/store/hooks';
import { paths } from '@/routes/paths';

interface ChurchMembershipGuardProps {
  children: React.ReactNode;
}

export const ChurchMembershipGuard = ({ children }: ChurchMembershipGuardProps) => {
  const navigate = useNavigate();
  const membershipStatus = useAppSelector((state) => state.member.data?.membershipStatus ?? null);

  if (membershipStatus === 'APPROVED') {
    return <>{children}</>;
  }

  return (
    <div className="grid min-h-[55vh] place-items-center px-2 pb-24">
      <div className="grid w-full max-w-sm justify-items-center gap-4 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-[#EAF1FF] text-[#123B8D]">
          <Church className="size-6" aria-hidden />
        </span>
        <div className="grid gap-1">
          <AppText variant="h6" align="center">
            Join a church to continue
          </AppText>
          <AppText variant="bodySmall" color="textSecondary" align="center">
            Join a church to access church features, events, departments, and church updates.
          </AppText>
        </div>
        <AppButton onClick={() => navigate(paths.profile, { state: { profileTab: 'church' } })}>
          Join church
        </AppButton>
      </div>
    </div>
  );
};
