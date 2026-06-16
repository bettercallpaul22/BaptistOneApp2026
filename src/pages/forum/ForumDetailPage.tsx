import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Users } from 'lucide-react';
import { AppButton, AppScrollableTabs, AppText } from '@/components/common';
import { AppAvatar, AppCard } from '@/components/display';
import { AppShell } from '@/layouts/AppShell';
import { findForum, findDepartment, findUnit } from '@/pages/forum/forumData';
import { paths } from '@/routes/paths';

const ForumDetailPage = () => {
  const { forumId } = useParams<{ forumId: string }>();
  const [activeTab, setActiveTab] = useState<'members' | 'posts'>('posts');
  const forum = useMemo(() => (forumId ? findForum(forumId) : null), [forumId]);
  const department = useMemo(
    () => (forum ? findDepartment(forum.departmentId) : null),
    [forum],
  );
  const unit = useMemo(() => (forum?.unitId ? findUnit(forum.unitId) : null), [forum]);

  if (!forum) {
    return (
      <AppShell>
        <main className="mx-auto grid max-w-[78rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:px-9">
          <AppText variant="h4">Forum not found</AppText>
          <AppText variant="bodyMedium" color="textSecondary">
            The requested forum does not exist.
          </AppText>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto grid max-w-[78rem] gap-5 px-4 py-6 pb-28 sm:px-6 md:px-9">
        <AppButton variant="secondary" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="size-4" aria-hidden />
          Back to forum
        </AppButton>

        <AppCard className="shadow-[0_12px_28px_rgba(11,31,74,0.08)]">
          <header className="border-b border-slate-100 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <AppText variant="h3">{forum.title}</AppText>
                <AppText variant="bodyMedium" color="textSecondary">
                  {forum.description}
                </AppText>
              </div>
              <div className="grid gap-2 text-right">
                <span className="rounded-full bg-[#EAF1FF] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[#123B8D]">
                  {forum.postCount} posts
                </span>
                <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[#123B8D]">
                  {forum.members.length} members
                </span>
              </div>
            </div>
          </header>

          <div className="grid gap-5 p-4">
            <div className="grid gap-3 rounded-3xl bg-[#F8FAFD] p-4">
              <AppText variant="h5">Forum context</AppText>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <AppText variant="caption" color="textSecondary">
                    Department
                  </AppText>
                  <AppText variant="bodyMedium">{department?.title ?? 'N/A'}</AppText>
                </div>
                {unit && (
                  <div>
                    <AppText variant="caption" color="textSecondary">
                      Unit
                    </AppText>
                    <AppText variant="bodyMedium">{unit.title}</AppText>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              <AppScrollableTabs
                tabs={[
                  { value: 'posts', label: 'Posts' },
                  { value: 'members', label: 'Members' },
                ]}
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'members' | 'posts')}
                ariaLabel="Forum detail tabs"
              />

              <section className="grid gap-4">
                {activeTab === 'posts' ? (
                  <div className="rounded-3xl border border-[#E5E7EB] bg-white p-4 shadow-[0_10px_20px_rgba(11,31,74,0.05)]">
                    <div className="flex items-center gap-2">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#EAF1FF] text-[#123B8D]">
                        <MessageSquare className="size-5" aria-hidden />
                      </span>
                      <AppText variant="h5">Recent posts</AppText>
                    </div>
                    <div className="grid gap-4 pt-3">
                      {forum.posts.map((post) => (
                        <article key={post.id} className="rounded-3xl bg-[#F8FAFD] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <AppText variant="bodyMedium" className="font-semibold">
                                {post.authorName}
                              </AppText>
                              <AppText variant="caption" color="textSecondary">
                                {post.createdAt}
                              </AppText>
                            </div>
                          </div>
                          <AppText variant="bodySmall" color="textSecondary" className="mt-3">
                            {post.content}
                          </AppText>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-[#E5E7EB] bg-white p-4 shadow-[0_10px_20px_rgba(11,31,74,0.05)]">
                    <div className="flex items-center gap-2">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#EAF1FF] text-[#123B8D]">
                        <Users className="size-5" aria-hidden />
                      </span>
                      <AppText variant="h5">Forum members</AppText>
                    </div>
                    <div className="grid gap-3 pt-4">
                      {forum.members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 rounded-3xl border border-[#E5E7EB] bg-[#F8FAFD] p-3">
                          <AppAvatar name={member.name} size="md" />
                          <div>
                            <AppText variant="bodyMedium">{member.name}</AppText>
                            <AppText variant="caption" color="textSecondary">
                              Forum participant
                            </AppText>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <aside className="grid gap-4">
                <AppCard>
                  <header className="border-b border-slate-100 p-4">
                    <AppText variant="h6">Forum summary</AppText>
                  </header>
                  <div className="grid gap-3 p-4">
                    <div>
                      <AppText variant="caption" color="textSecondary">
                        Description
                      </AppText>
                      <AppText variant="bodyMedium">{forum.description}</AppText>
                    </div>
                    <div>
                      <AppText variant="caption" color="textSecondary">
                        Department
                      </AppText>
                      <AppText variant="bodyMedium">{department?.title ?? 'N/A'}</AppText>
                    </div>
                    {unit && (
                      <div>
                        <AppText variant="caption" color="textSecondary">
                          Unit
                        </AppText>
                        <AppText variant="bodyMedium">{unit.title}</AppText>
                      </div>
                    )}
                  </div>
                </AppCard>
              </aside>
            </div>
          </div>
        </AppCard>
      </main>
    </AppShell>
  );
};

export default ForumDetailPage;
