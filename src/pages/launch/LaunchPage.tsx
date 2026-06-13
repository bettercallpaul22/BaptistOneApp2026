import { Link } from 'react-router-dom';
import { AppButton, AppText } from '@/components/common';
import { paths } from '@/routes/paths';

export default function LaunchPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(145deg,#123B8D_0%,#0B1F4A_100%)] p-4">
      <section className="grid w-full max-w-[34rem] justify-items-center gap-8 rounded-2xl border border-white/15 bg-white/10 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-md" aria-label="BaptistOne launch">
        <Link className="inline-flex items-center gap-2 text-sm font-black text-white" to={paths.launch}>
          <span className="grid size-9 place-items-center rounded-full bg-[#D4A017] text-[#0B1F4A]">B</span>
          BaptistOne
        </Link>
        <div className="grid gap-3">
          <AppText variant="displayMedium" color="textInverse" align="center">
            Welcome Home
          </AppText>
          <AppText variant="bodyLarge" color="#D8E4FF" align="center">
            Your church, faith, and community in one simple place.
          </AppText>
        </div>
        <Link to={paths.register}>
          <AppButton variant="secondary" size="lg">
            Get Started
          </AppButton>
        </Link>
      </section>
    </main>
  );
}
