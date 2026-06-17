export const APP_PACKAGE_MAP: Record<string, string> = {
  TikTok: "com.zhiliaoapp.musically",
  Instagram: "com.instagram.android",
  YouTube: "com.google.android.youtube",
  "X / Twitter": "com.twitter.android",
  Snapchat: "com.snapchat.android",
  Reddit: "com.reddit.frontpage",
  Facebook: "com.facebook.katana",
  LinkedIn: "com.linkedin.android",
};

export function resolvePackageNames(appLabels: string[]): string[] {
  return appLabels
    .map((label) => APP_PACKAGE_MAP[label])
    .filter((pkg): pkg is string => pkg !== undefined);
}
