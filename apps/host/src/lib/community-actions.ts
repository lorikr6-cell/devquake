'use server';

import { refresh, revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getT, localized } from '@/i18n/server';
import { ADMIN_BASE, requireAdmin, requireUser } from './auth/admin';
import { getSessionUser } from './auth/session';
import {
  COMMUNITY_STATUSES,
  checkComment,
  checkIdeaForm,
  type CommunityStatus,
} from './community-idea-rules';
import {
  addComment,
  addToRoadmap,
  convertIdeaToProject,
  createIdea,
  deleteComment,
  deleteIdea,
  ideaProjects,
  removeIdeaImage,
  saveIdeaImage,
  setCommentHidden,
  setIdeaHidden,
  setIdeaReview,
  toggleVote,
  updateIdea,
} from './community-ideas';

export interface IdeaFormState {
  error?: string;
}

/** Create (ideaId null) or edit an idea, with its optional picture (already shrunk). */
export async function saveIdeaAction(
  ideaId: number | null,
  _prev: IdeaFormState,
  form: FormData,
): Promise<IdeaFormState> {
  const user = await getSessionUser();
  const t = await getT('ideas.errors');
  if (!user) return { error: t('signIn') };
  const projects = await ideaProjects();
  const checked = checkIdeaForm(
    form,
    projects.map((p) => p.id),
  );
  if (!checked.ok) return { error: t(checked.error, { max: checked.max ?? 0 }) };

  const result =
    ideaId === null
      ? await createIdea(user, checked.value)
      : await updateIdea(user, ideaId, checked.value);
  if (!result.ok) return { error: t(result.error) };
  const id = result.id!;

  const image = form.get('image');
  if (image instanceof File && image.size > 0) {
    const saved = await saveIdeaImage(user, id, image);
    if (!saved.ok) return { error: t('pictureNotSaved', { reason: t(saved.error) }) };
  } else if (form.get('remove_image') === 'on') {
    await removeIdeaImage(user, id);
  }
  revalidatePath('/ideas');
  redirect(await localized(`/ideas/${id}`));
}

export async function deleteIdeaAction(id: number): Promise<void> {
  const user = await requireUser();
  await deleteIdea(user, id);
  revalidatePath('/ideas');
  redirect(await localized('/ideas?deleted=1'));
}

export async function voteAction(id: number): Promise<void> {
  const user = await requireUser();
  await toggleVote(user, id);
  refresh();
}

export interface CommentState {
  error?: string;
  posted?: number;
}

export async function commentAction(
  ideaId: number,
  _prev: CommentState,
  form: FormData,
): Promise<CommentState> {
  const user = await getSessionUser();
  const t = await getT('ideas.errors');
  if (!user) return { error: t('signIn') };
  const checked = checkComment(form.get('body'));
  if (!checked.ok) return { error: t(checked.error, { max: checked.max ?? 0 }) };
  const result = await addComment(user, ideaId, checked.value);
  if (!result.ok) return { error: t(result.error) };
  refresh();
  return { posted: Date.now() };
}

export async function deleteCommentAction(commentId: number): Promise<void> {
  const user = await requireUser();
  await deleteComment(user, commentId);
  refresh();
}

// --- staff (admins and the owner) ----------------------------------------------------------

export async function reviewIdeaAction(id: number, form: FormData): Promise<void> {
  const staff = await requireAdmin();
  const status = String(form.get('status')) as CommunityStatus;
  if (!(COMMUNITY_STATUSES as readonly string[]).includes(status)) return;
  await setIdeaReview(staff, id, status, String(form.get('staff_note') ?? ''));
  revalidatePath('/ideas');
  refresh();
}

export async function hideIdeaAction(id: number, hidden: boolean): Promise<void> {
  const staff = await requireAdmin();
  await setIdeaHidden(staff, id, hidden);
  revalidatePath('/ideas');
  refresh();
}

export async function hideCommentAction(commentId: number, hidden: boolean): Promise<void> {
  await requireAdmin();
  await setCommentHidden(commentId, hidden);
  refresh();
}

/** Moderation: staff remove an idea from the control panel. */
export async function staffDeleteIdeaAction(id: number): Promise<void> {
  const staff = await requireAdmin();
  await deleteIdea(staff, id);
  revalidatePath('/ideas');
  refresh();
}

export async function addToRoadmapAction(id: number): Promise<void> {
  const staff = await requireAdmin();
  const roadmapId = await addToRoadmap(staff, id);
  revalidatePath('/ideas');
  if (roadmapId) redirect(`${ADMIN_BASE}/ideas/${roadmapId}`);
  refresh();
}

/** Turns a community idea into a (private) project and opens it (ADR 0020). */
export async function convertToProjectAction(id: number): Promise<void> {
  const staff = await requireAdmin();
  const projectId = await convertIdeaToProject(staff, id);
  revalidatePath('/ideas');
  revalidatePath('/', 'layout');
  if (projectId) redirect(`${ADMIN_BASE}/projects/${projectId}?converted=1`);
  refresh();
}
