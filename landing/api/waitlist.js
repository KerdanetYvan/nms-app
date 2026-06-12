export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body ?? {};
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Email invalide" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const betaLink = process.env.BETA_LINK;

  const [betaMail, notifMail] = await Promise.all([
    // Email envoyé à l'inscrit avec le lien bêta
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Doo <onboarding@resend.dev>",
        to: cleanEmail,
        subject: "Ton acces a la beta Doo",
        html: `
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#FDFBF0;color:#3D3540;">
            <svg width="80" height="42" viewBox="0 0 381 199" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin-bottom:32px;">
              <path d="M38.4254 196C34.748 196 31.6557 194.746 29.1484 192.239C26.6412 189.732 25.3875 186.64 25.3875 182.962V13.2198C25.3875 9.37533 26.6412 6.28303 29.1484 3.94291C31.6557 1.43564 34.748 0.182002 38.4254 0.182002H83.807C102.695 0.182002 119.494 4.36079 134.203 12.7184C148.913 21.0759 160.362 32.693 168.553 47.5695C176.743 62.2788 180.838 79.0775 180.838 97.9656C180.838 116.854 176.743 133.736 168.553 148.613C160.362 163.489 148.913 175.106 134.203 183.464C119.494 191.821 102.695 196 83.807 196H38.4254ZM83.807 172.933C97.6806 172.933 110.05 169.757 120.915 163.405C131.947 157.054 140.471 148.195 146.489 136.828C152.673 125.295 155.766 112.341 155.766 97.9656C155.766 83.5906 152.673 70.7199 146.489 59.3536C140.471 47.9873 131.947 39.1283 120.915 32.7765C110.05 26.4248 97.6806 23.2489 83.807 23.2489H51.4632V172.933H83.807Z" fill="#7A6678"/>
              <ellipse cx="237.882" cy="145.035" rx="44.4639" ry="44.7439" stroke="#7A6678" stroke-width="17.9091"/>
              <circle cx="257.891" cy="128.945" r="14.3273" fill="#7A6678"/>
              <ellipse cx="327.428" cy="145.035" rx="44.4639" ry="44.7439" stroke="#7A6678" stroke-width="17.9091"/>
              <circle cx="347.436" cy="128.945" r="14.3273" fill="#7A6678"/>
            </svg>
            <h1 style="font-size:24px;font-weight:800;color:#4A3F4A;margin:0 0 12px;">Bienvenue dans la beta !</h1>
            <p style="font-size:16px;line-height:1.65;color:#9B8F99;margin:0 0 32px;">
              Merci d'etre la. Voici ton lien pour installer Doo et decouvrir
              les premiers defis.
            </p>
            <a href="${betaLink}" style="display:inline-block;background:#766675;color:#fff;font-weight:700;font-size:16px;padding:16px 32px;border-radius:16px;text-decoration:none;">
              Telecharger Doo
            </a>
            <p style="font-size:13px;color:#9B8F99;margin-top:40px;line-height:1.5;">
              Tu recois cet email parce que tu as rejoint la liste d'attente Doo.<br>
              Si c'est une erreur, ignore simplement ce message.
            </p>
          </div>
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
        from: "Doo Waitlist <onboarding@resend.dev>",
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
