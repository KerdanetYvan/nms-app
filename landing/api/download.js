export default function handler(req, res) {
  const url = process.env.APK_URL;
  if (!url) {
    return res.status(404).json({ error: "APK non disponible" });
  }
  res.redirect(302, url);
}
