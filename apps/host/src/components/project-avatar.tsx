import { cn } from '@devquake/ui';
import { Icon } from '@/components/icons';
import { projectAvatarLook, type ProjectAvatarInput } from '@/lib/project-avatar';

/**
 * A project's generated logo: its initials (max 3 letters) on its colour, with its symbol in a
 * small badge on the corner (the badge sticks out by ~10%, leave a little room). Decorative
 * next to the project name; pass `label` when it stands alone.
 */
export function ProjectAvatar({
  project,
  size = 48,
  label,
  className,
}: {
  project: ProjectAvatarInput;
  size?: number;
  label?: string;
  className?: string;
}) {
  const look = projectAvatarLook(project);
  const badge = Math.round(size * 0.46);
  const letters = Array.from(look.initials).length;
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('relative inline-flex shrink-0 select-none', className)}
      style={{ width: size, height: size }}
    >
      <span
        className="flex size-full items-center justify-center font-display leading-none font-bold tracking-tight shadow-sm"
        style={{
          background: look.background,
          color: look.foreground,
          borderRadius: size * 0.24,
          fontSize: size * (letters >= 3 ? 0.3 : 0.4),
        }}
      >
        {look.initials}
      </span>
      <span
        // Same colours as the tile (so any chosen colour stays readable), set off by a ring in
        // the page colour.
        className="absolute flex items-center justify-center rounded-full ring-2 ring-white dark:ring-ink"
        style={{
          width: badge,
          height: badge,
          right: -size * 0.12,
          bottom: -size * 0.12,
          background: look.background,
          color: look.foreground,
        }}
      >
        <Icon name={look.symbol} size={Math.round(badge * 0.66)} strokeWidth={2.25} />
      </span>
    </span>
  );
}
