// Gerador one-off dos redirects /go/<slug>/ — não faz parte do site
// publicado (fica fora do que o GitHub Pages serve como link público,
// mas dentro do repo pra rodar de novo se um convite mudar). Roda com:
//   node site/scripts/_generate-go-pages.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = join(__dirname, "..");

// Mesmos 7 grupos verificados de whatsapp_group_landing_config
// (docs/WHATSAPP_LINK_AUDIT.md, 24/09/2026 — todos MATCHED).
const GROUPS = [
  { slug: "principal", name: "Vou com Descontos", invite: "https://chat.whatsapp.com/FcI6D57eHHFKtDGmUIwrAH?s=cl&p=i&mlu=4&ilr=4" },
  { slug: "100-menos", name: "Vou com Descontos 100 menos", invite: "https://chat.whatsapp.com/KHSoOdQ4EG1E2xCwJ8jgZt?s=cl&p=i&mlu=4&ilr=4" },
  { slug: "beleza-feminina", name: "Vou com Descontos - Beleza Feminina", invite: "https://chat.whatsapp.com/KMppNrzezlR2d8wILGXzUv?s=cl&p=i&mlu=4&ilr=4" },
  { slug: "beleza-estilo", name: "Vou com Descontos - Beleza & Estilo", invite: "https://chat.whatsapp.com/JCXvI8kClLZAX0tyi6i3ul?s=cl&p=i&mlu=4&ilr=4" },
  { slug: "for-men", name: "Vou com Descontos FOR MEN", invite: "https://chat.whatsapp.com/Hg171Xm0awyJRA1yyvBi4h?s=cl&p=i&mlu=4&ilr=4" },
  { slug: "bebidas-suplementos", name: "Vou com Descontos Bebidas e Suplementos", invite: "https://chat.whatsapp.com/LI3kqxFVOzK3bDnwHqj4zh?s=cl&p=i&mlu=4&ilr=4" },
  { slug: "viagens", name: "Vou com Descontos - Viagens", invite: "https://chat.whatsapp.com/C0kTFGZF00a4vZlRTpHThk?s=cl&p=i&mlu=4&ilr=4" },
];

function page(group) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Entrando no grupo ${group.name}…</title>
<meta name="robots" content="noindex" />
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; background:#0d3b2e; color:#eafbe8; text-align:center; padding:24px; }
  .box { max-width: 360px; }
  .spinner { width:34px; height:34px; border-radius:50%; border:3px solid rgba(255,255,255,.25); border-top-color:#16a34a; margin:0 auto 18px; animation:spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  a { color:#bfe6c8; }
</style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <p>Abrindo o WhatsApp — ${group.name}…</p>
    <p><small>Se não abrir sozinho, <a id="fallback" href="${group.invite}">toque aqui</a>.</small></p>
  </div>
  <script>
    (function () {
      var GROUP_SLUG = ${JSON.stringify(group.slug)};
      var INVITE_URL = ${JSON.stringify(group.invite)};
      var qs = new URLSearchParams(location.search);
      document.getElementById("fallback").href = INVITE_URL;
      var payload = JSON.stringify({
        event_name: "group_join_click", group_slug: GROUP_SLUG, referrer: document.referrer,
        utm_source: qs.get("utm_source") || null, utm_medium: qs.get("utm_medium") || null,
        utm_campaign: qs.get("utm_campaign") || null, utm_content: qs.get("utm_content") || null,
      });
      // Espera o registro do clique terminar (com teto de 700ms) antes de
      // redirecionar — testado ao vivo (24/09/2026): fetch com
      // keepalive/sendBeacon não sobreviviam de forma confiável à
      // navegação imediata nesse fluxo. Aguardar de verdade é o único
      // jeito confirmado de garantir o registro sem atrasar demais quem
      // está entrando no grupo.
      var tracked = fetch("https://xnavhkburafdjtuxaslo.supabase.co/functions/v1/track-event", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: payload,
      }).catch(function () {});
      var timeout = new Promise(function (resolve) { setTimeout(resolve, 700); });
      Promise.race([tracked, timeout]).then(function () { location.replace(INVITE_URL); });
    })();
  </script>
</body>
</html>
`;
}

for (const group of GROUPS) {
  const path = join(SITE_ROOT, "go", group.slug, "index.html");
  writeFileSync(path, page(group));
  console.log("gerado:", path);
}
