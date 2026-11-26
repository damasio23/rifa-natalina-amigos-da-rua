// Configuração do Firebase (backend compartilhado). Veja o README.md, passo a passo.
// Enquanto estiver vazio, o site roda em MODO LOCAL DE TESTE (dados só no navegador).
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAWIYVl3EGtZ6yN86Loosb4i1oi_xtdv3g",
  authDomain: "sorteio-natalino-amigos-da-rua.firebaseapp.com",
  projectId: "sorteio-natalino-amigos-da-rua",
  storageBucket: "sorteio-natalino-amigos-da-rua.firebasestorage.app",
  messagingSenderId: "266981479312",
  appId: "1:266981479312:web:b952e8537e7b244e3a5915"
};
/* Exemplo:
window.FIREBASE_CONFIG = {
  apiKey: "...", authDomain: "SEU-PROJETO.firebaseapp.com",
  projectId: "SEU-PROJETO", appId: "..."
};
*/
window.RIFA = {
  total: 200, preco: 10, chavePix: "amigosdarua.cdm@gmail.com",
  // Alterar aqui muda os prêmios em todo o site e no sorteio
  premios: [
    { n: 1, titulo: "Maracá", icone: "🪘" },
    { n: 2, titulo: "Mandala + caixa de joias", icone: "🌀" },
    { n: 3, titulo: "Boné + caneca Amigos da Rua", icone: "🧢" },
    { n: 4, titulo: "Copaíba + andiroba + vela aromática + plant hanger de macramê", icone: "🕯️" }
  ]
};
