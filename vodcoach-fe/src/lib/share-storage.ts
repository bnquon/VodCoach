export function getShareGuestName(shareToken: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(getShareGuestNameKey(shareToken));
}

export function setShareGuestName(shareToken: string, guestName: string) {
  localStorage.setItem(getShareGuestNameKey(shareToken), guestName);
}

export function getShareSessionToken(shareToken: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(getShareSessionTokenKey(shareToken));
}

export function setShareSessionToken(shareToken: string, sessionToken: string) {
  localStorage.setItem(getShareSessionTokenKey(shareToken), sessionToken);
}

export function clearShareSessionToken(shareToken: string) {
  localStorage.removeItem(getShareSessionTokenKey(shareToken));
}

function getShareGuestNameKey(shareToken: string) {
  return `vodcoach_share_guest_name:${shareToken}`;
}

function getShareSessionTokenKey(shareToken: string) {
  return `vodcoach_share_token:${shareToken}`;
}
