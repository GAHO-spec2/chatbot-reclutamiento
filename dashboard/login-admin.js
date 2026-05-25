/* =========================
   CONFIG FIREBASE
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyD6t7kfGjBllkzuDVarL7oaECryUa2-fx4",
  authDomain: "chatbotgpt-2eb38.firebaseapp.com",
  projectId: "chatbotgpt-2eb38",
  storageBucket: "chatbotgpt-2eb38.firebasestorage.app",
  messagingSenderId: "762904867561",
  appId: "1:762904867561:web:984b481d3c469ccd057678",
  measurementId: "G-0W817YXQ6T"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

/* =========================
   ELEMENTOS UI
========================= */
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const loginBtn = document.getElementById("loginBtn");
const loginStatus = document.getElementById("loginStatus");

/* =========================
   STATUS UI
========================= */
function setStatus(message, type = "info") {
  if (!loginStatus) return;

  loginStatus.textContent = message;
  loginStatus.classList.remove("hidden");

  loginStatus.style.borderColor =
    type === "error" ? "rgba(255,0,0,0.4)" :
    type === "success" ? "rgba(0,255,150,0.4)" :
    "rgba(255,255,255,0.2)";
}

/* =========================
   LOADING BOTÓN
========================= */
function setLoading(isLoading) {
  if (!loginBtn) return;

  loginBtn.disabled = isLoading;
  loginBtn.textContent = isLoading ? "Ingresando..." : "Iniciar sesión";
}

/* =========================
   LOGIN
========================= */
async function loginAdmin() {
  const email = adminEmail.value.trim();
  const password = adminPassword.value.trim();

  if (!email || !password) {
    setStatus("⚠️ Completa correo y contraseña.", "error");
    return;
  }

  try {
    setLoading(true);
    setStatus("Verificando credenciales...");

    await auth.signInWithEmailAndPassword(email, password);

    setStatus("✅ Acceso correcto. Redirigiendo...", "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);

  } catch (error) {
    console.error("Error login admin:", error);

    let message = "⚠️ No fue posible iniciar sesión.";

    if (error.code === "auth/user-not-found") {
      message = "❌ Usuario no encontrado.";
    } else if (error.code === "auth/wrong-password") {
      message = "❌ Contraseña incorrecta.";
    } else if (error.code === "auth/invalid-email") {
      message = "❌ Correo inválido.";
    } else if (error.code === "auth/too-many-requests") {
      message = "⚠️ Demasiados intentos. Intenta más tarde.";
    }

    setStatus(message, "error");
  } finally {
    setLoading(false);
  }
}

/* =========================
   ENTER KEY
========================= */
[adminEmail, adminPassword].forEach((el) => {
  if (!el) return;

  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      loginAdmin();
    }
  });
});

/* =========================
   CLICK LOGIN
========================= */
if (loginBtn) {
  loginBtn.addEventListener("click", loginAdmin);
}

/* =========================
   PROTECCIÓN (SI YA LOGUEADO)
========================= */
auth.onAuthStateChanged((user) => {
  if (user) {
    // Ya tiene sesión → lo mandamos directo al dashboard
    window.location.href = "dashboard.html";
  }
});