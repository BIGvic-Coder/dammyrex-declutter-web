import { NavDone } from '@/components/NavFeedback';

/** Re-mounts on every page change, giving each page a short fade-in. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-fade">
      <NavDone />
      {children}
    </div>
  );
}
