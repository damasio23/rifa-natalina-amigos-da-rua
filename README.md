# Sorteio Natalino Luiz Manni Amig@s da Rua

Site estático (HTML/CSS/JS) + Firebase Firestore (dados compartilhados e persistentes) + GitHub Pages.

## Colocar no ar (uma vez)
1. **Firebase** (gratuito): console.firebase.google.com → criar projeto → *Firestore Database* (modo produção) → *Authentication* → ativar *E-mail/senha*.
2. Em *Firestore → Regras*, colar o conteúdo de `firestore.rules` e publicar.
3. *Authentication → Usuários → Adicionar* (e-mail e senha do administrador). Copie o **UID** do usuário e, no Firestore, crie o documento `admins/<UID>` (qualquer campo, ex.: `ativo: true`).
4. *Configurações do projeto → Seus apps → Web* → copie a config para `config.js` (`window.FIREBASE_CONFIG = {...}`).
5. **GitHub Pages**: Settings → Pages → Source: *GitHub Actions*; faça merge na `main` (o workflow publica).
6. Abra `/admin.html`, entre e clique em **Importar lista inicial** (grava os participantes iniciais no banco).

## Segurança
- Admin = Firebase Auth + documento `admins/<uid>`; regras impedem qualquer escrita pública além de *criar* um número livre.
- `admin.html` não é linkado no site e tem `noindex`. Resultados do sorteio são legíveis só pelo admin.

Sem `FIREBASE_CONFIG`, o site funciona em **modo local de teste** (dados só no navegador; senha admin: `admin`).
