// Configuração do Firebase (backend compartilhado). Veja o README.md, passo a passo.
// Enquanto estiver vazio, o site roda em MODO LOCAL DE TESTE (dados só no navegador).
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBz4qvaMZwsPO1RkNVsDa8_yf9Mp5fgTRI",
  authDomain: "sorteio-natalino-amigos-a0be9.firebaseapp.com",
  projectId: "sorteio-natalino-amigos-a0be9",
  storageBucket: "sorteio-natalino-amigos-a0be9.firebasestorage.app",
  messagingSenderId: "1058787466898",
  appId: "1:1058787466898:web:f225ca0a722366939f504b"
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
