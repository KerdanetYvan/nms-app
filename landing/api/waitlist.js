export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body ?? {};
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Email invalide" });
  }

  const cleanEmail = email.trim().toLowerCase();

  const [betaMail, notifMail] = await Promise.all([
    // Email envoyé à l'inscrit avec les instructions d'accès à la beta
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Doo <noreply@doo.kerdanetyvan.dev>",
        to: cleanEmail,
        subject: "Ton acces a la beta Doo",
        html: `
          <!DOCTYPE html>
          <html lang="fr">
          <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
          <body style="margin:0;padding:0;background-color:#FDFBF0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDFBF0;padding:40px 16px;">
              <tr><td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

                  <!-- Card -->
                  <tr>
                    <td style="background-color:#FFFFFF;border-radius:20px;padding:40px 32px;box-shadow:0 4px 24px rgba(118,102,117,0.10);">
                      <table width="100%" cellpadding="0" cellspacing="0">

                        <!-- Logo -->
                        <tr>
                          <td align="center" style="padding-bottom:24px;">
                            <img src="https://choezufjwraxtlwutuyo.supabase.co/storage/v1/object/public/assets/logo_doo.png" alt="Doo" width="120" style="display:block;border:0;" />
                          </td>
                        </tr>

                        <!-- Titre -->
                        <tr>
                          <td align="center" style="padding-bottom:8px;">
                            <h1 style="margin:0;font-size:22px;font-weight:800;color:#4A3F4A;">Bienvenue dans la beta !</h1>
                          </td>
                        </tr>

                        <!-- Sous-titre -->
                        <tr>
                          <td align="center" style="padding-bottom:32px;">
                            <p style="margin:0;font-size:15px;color:#9B8F99;line-height:1.6;">Suis ces 3 etapes pour acceder a Doo.</p>
                          </td>
                        </tr>

                        <!-- Etape 1 -->
                        <tr>
                          <td style="padding-bottom:24px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="40" valign="top">
                                  <div style="width:32px;height:32px;background:#766675;border-radius:50%;font-weight:800;font-size:15px;color:#fff;line-height:32px;text-align:center;">1</div>
                                </td>
                                <td valign="top">
                                  <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#4A3F4A;">Rejoins le groupe testeur</p>
                                  <p style="margin:0 0 12px;font-size:14px;color:#9B8F99;line-height:1.5;">C'est ce qui te donne acces au test ferme sur le Play Store.</p>
                                  <a href="https://groups.google.com/g/testeur-doo" style="display:inline-block;background:#766675;color:#fff;font-weight:700;font-size:14px;padding:10px 20px;border-radius:12px;text-decoration:none;">Rejoindre le groupe</a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Etape 2 -->
                        <tr>
                          <td style="padding-bottom:24px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="40" valign="top">
                                  <div style="width:32px;height:32px;background:#766675;border-radius:50%;font-weight:800;font-size:15px;color:#fff;line-height:32px;text-align:center;">2</div>
                                </td>
                                <td valign="top">
                                  <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#4A3F4A;">Active ton acces testeur</p>
                                  <p style="margin:0 0 12px;font-size:14px;color:#9B8F99;line-height:1.5;">Clique sur le lien correspondant a ta situation.</p>
                                  <a href="https://play.google.com/store/apps/details?id=app.doo" style="display:inline-block;background:#F0EBE8;color:#4A3F4A;font-weight:700;font-size:14px;padding:10px 20px;border-radius:12px;text-decoration:none;margin-right:8px;">Depuis Android</a>
                                  <a href="https://play.google.com/apps/testing/app.doo" style="display:inline-block;background:#F0EBE8;color:#4A3F4A;font-weight:700;font-size:14px;padding:10px 20px;border-radius:12px;text-decoration:none;">Depuis le Web</a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Etape 3 -->
                        <tr>
                          <td style="padding-bottom:32px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="40" valign="top">
                                  <div style="width:32px;height:32px;background:#766675;border-radius:50%;font-weight:800;font-size:15px;color:#fff;line-height:32px;text-align:center;">3</div>
                                </td>
                                <td valign="top">
                                  <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#4A3F4A;">Telecharge Doo</p>
                                  <p style="margin:0 0 12px;font-size:14px;color:#9B8F99;line-height:1.5;">Une fois testeur active, tu peux installer l'app et decouvrir les premiers defis.</p>
                                  <a href="https://play.google.com/store/apps/details?id=app.doo" style="display:inline-block;background:#766675;color:#fff;font-weight:700;font-size:14px;padding:10px 20px;border-radius:12px;text-decoration:none;">Telecharger Doo</a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Footer note -->
                        <tr>
                          <td align="center">
                            <p style="margin:0;font-size:13px;color:#C2BAC0;line-height:1.5;">
                              Tu recois cet email parce que tu as rejoint la liste d'attente Doo.<br>
                              Si c'est une erreur, ignore simplement ce message.
                            </p>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td align="center" style="padding-top:24px;">
                      <p style="margin:0;font-size:12px;color:#C2BAC0;">© Doo — reprends le controle de ton temps d'ecran</p>
                    </td>
                  </tr>

                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `,
      }),
    }),

    // Notification pour toi
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Doo Waitlist <noreply@doo.kerdanetyvan.dev>",
        to: process.env.WAITLIST_RECIPIENT,
        subject: `Nouvelle inscription beta : ${cleanEmail}`,
        text: cleanEmail,
      }),
    }),
  ]);

  if (!betaMail.ok) {
    const body = await betaMail.json().catch(() => ({}));
    console.error("Resend error:", body);
    return res.status(500).json({ error: "Erreur lors de l'envoi" });
  }

  return res.status(200).json({ ok: true });
}
