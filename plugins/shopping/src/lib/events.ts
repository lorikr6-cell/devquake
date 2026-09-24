// Wording of list activity for the in-app notifications (pure, tested).

export interface ActivityEvent {
  id: number;
  listId: number;
  listName: string;
  userName: string | null;
  kind: string;
  itemName: string | null;
  /** ISO timestamp (UTC). */
  at: string;
}

/** "Ana picked up Milk". A deleted account shows as "Someone". */
export function describeEvent(e: Pick<ActivityEvent, 'kind' | 'userName' | 'itemName'>): string {
  const who = e.userName ?? 'Someone';
  const what = e.itemName ?? 'an item';
  switch (e.kind) {
    case 'item_added':
      return `${who} added ${what}`;
    case 'item_done':
      return `${who} picked up ${what}`;
    case 'item_dropped':
      return `${who} struck out ${what} (not needed)`;
    case 'item_removed':
      return `${who} removed ${what}`;
    case 'price_set':
      return `${who} set the price of ${what}`;
    case 'photo_added':
      return `${who} added a photo of ${what}`;
    case 'member_joined':
      return `${who} joined the list`;
    case 'member_left':
      return `${who} left the list`;
    default:
      return `${who} changed the list`;
  }
}

/** "just now", "5 min ago", "3 h ago", "2 d ago". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}
