/* =========================================================
   USUARIOS Y ACCESOS
   GA HOSPITALITY - RECRUITMENT CENTER
========================================================= */

const API_URL =
  window.location.origin;

/* =========================================================
   FIREBASE AUTH
========================================================= */

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


/* =========================================================
   ESTADO
========================================================= */

let adminToken = "";
let currentAdminUser = null;
let usuarios = [];


/* =========================================================
   ELEMENTOS PRINCIPALES
========================================================= */

const loadingScreen =
  document.getElementById("loadingScreen");

const accessDenied =
  document.getElementById("accessDenied");

const usuariosApp =
  document.getElementById("usuariosApp");

const sidebarAvatar =
  document.getElementById("sidebarAvatar");

const sidebarUserName =
  document.getElementById("sidebarUserName");

const sidebarUserRole =
  document.getElementById("sidebarUserRole");


/* =========================================================
   HELPERS
========================================================= */

function authHeaders() {
  return {
    Authorization: `Bearer ${adminToken}`
  };
}


function hasPermission(permission) {
  if (!currentAdminUser || !permission) {
    return false;
  }

  const permissions =
    Array.isArray(currentAdminUser.permissions)
      ? currentAdminUser.permissions
      : [];

  return permissions.includes(permission);
}

function configurarNavegacionPorPermisos() {

  const reglasNavegacion = [
    {
      selector:
        'a[href="dashboard.html"]',
      permiso:
        "candidatos.ver"
    },
    {
      selector:
        'a[href="vacantes-admin.html"]',
      permiso:
        "vacantes.ver"
    },
    {
      selector:
        'a[href="entrevistas.html"]',
      permiso:
        "entrevistas.ver"
    },
    {
      selector:
        'a[href="comunicaciones.html"]',
      permiso:
        "comunicaciones.ver"
    },
    {
      selector:
        'a[href="usuarios-admin.html"]',
      permiso:
        "usuarios.gestionar_admins"
    }
  ];

  reglasNavegacion.forEach(
    ({ selector, permiso }) => {

      const elementos =
        document.querySelectorAll(
          selector
        );

      elementos.forEach(
        (elemento) => {

          elemento.classList.toggle(
            "hidden",
            !hasPermission(
              permiso
            )
          );
        }
      );
    }
  );
}

function mostrarToast(
  mensaje,
  tipo = "success"
) {
  const container =
    document.getElementById(
      "toastContainer"
    );

  if (!container || !mensaje) {
    return;
  }

  const toast =
    document.createElement("div");

  toast.className =
    `toast ${tipo}`;

  toast.textContent =
    String(mensaje);

  container.appendChild(toast);

  window.setTimeout(
    () => {
      toast.remove();
    },
    4500
  );
}


function ocultarLoading() {
  if (loadingScreen) {
    loadingScreen.classList.add("hidden");
  }
}


function mostrarAccesoDenegado() {
  ocultarLoading();

  if (usuariosApp) {
    usuariosApp.classList.add("hidden");
  }

  if (accessDenied) {
    accessDenied.classList.remove("hidden");
  }
}


function mostrarAplicacion() {
  ocultarLoading();

  if (accessDenied) {
    accessDenied.classList.add("hidden");
  }

  if (usuariosApp) {
    usuariosApp.classList.remove("hidden");
  }
}


function obtenerInicial(nombre = "") {
  const valor = String(nombre || "")
    .trim();

  return valor
    ? valor.charAt(0).toUpperCase()
    : "A";
}


function formatearRol(role = "") {
  const roles = {
    admin: "Administrador",
    reclutador: "Reclutador",
    gerente: "Gerente"
  };

  return roles[role] || role || "Usuario";
}


/* =========================================================
   PERFIL ADMINISTRATIVO
========================================================= */

async function cargarUsuarioAdministrativo() {
  const response = await fetch(
    `${API_URL}/api/admin/me`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store"
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error ||
      "No fue posible validar tu acceso administrativo.";

    throw new Error(message);
  }

  if (
    !data?.user ||
    !data.user.uid ||
    !data.user.email
  ) {
    throw new Error(
      "El servidor no devolvió un perfil administrativo válido."
    );
  }

  currentAdminUser = data.user;

  console.log(
    "Usuario administrativo en Usuarios y accesos:",
    {
      nombre: currentAdminUser.nombre,
      email: currentAdminUser.email,
      role: currentAdminUser.role,
      isPrimaryAdmin:
        currentAdminUser.isPrimaryAdmin,
      globalAccess:
        currentAdminUser.globalAccess,
      permissions:
        currentAdminUser.permissions
    }
  );

  return currentAdminUser;
}


/* =========================================================
   INFORMACIÓN DEL USUARIO EN SIDEBAR
========================================================= */

function renderUsuarioActual() {
  if (!currentAdminUser) {
    return;
  }

  if (sidebarUserName) {
    sidebarUserName.textContent =
      currentAdminUser.nombre ||
      currentAdminUser.email ||
      "Administrador";
  }

  if (sidebarUserRole) {
    sidebarUserRole.textContent =
      currentAdminUser.isPrimaryAdmin
        ? "Administrador principal"
        : formatearRol(currentAdminUser.role);
  }

  if (sidebarAvatar) {
    sidebarAvatar.textContent =
      obtenerInicial(
        currentAdminUser.nombre ||
        currentAdminUser.email
      );
  }
}

/* =========================================================
   MODAL CREAR / EDITAR USUARIO
========================================================= */

function abrirModalNuevoUsuario() {
  const userModal =
    document.getElementById("userModal");

  const userForm =
    document.getElementById("userForm");

  const usuarioUid =
    document.getElementById("usuarioUid");

  const usuarioNombre =
    document.getElementById("usuarioNombre");

  const usuarioEmail =
    document.getElementById("usuarioEmail");

  const userModalEyebrow =
    document.getElementById("userModalEyebrow");

  const userModalTitle =
    document.getElementById("userModalTitle");

  const userModalDescription =
    document.getElementById("userModalDescription");


  if (!userModal) {
    console.error(
      "No se encontró el modal userModal."
    );

    return;
  }


  if (userForm) {
    userForm.reset();
  }


  if (usuarioUid) {
    usuarioUid.value = "";
  }


  if (usuarioNombre) {
    usuarioNombre.value = "";
  }


  if (usuarioEmail) {
    usuarioEmail.value = "";
    usuarioEmail.disabled = false;
  }

  document
  .querySelectorAll(
    'input[name="usuarioRole"]'
  )
  .forEach((radio) => {
    radio.disabled = false;
  });


const usuarioGlobalAccess =
  document.getElementById(
    "usuarioGlobalAccess"
  );

if (usuarioGlobalAccess) {
  usuarioGlobalAccess.disabled = false;
}


const primaryAdminNotice =
  document.getElementById(
    "primaryAdminNotice"
  );

if (primaryAdminNotice) {
  primaryAdminNotice.classList.add(
    "hidden"
  );
}


  const recruiterRadio =
    document.querySelector(
      'input[name="usuarioRole"][value="reclutador"]'
    );

  if (recruiterRadio) {
    recruiterRadio.checked = true;
  }


  if (userModalEyebrow) {
    userModalEyebrow.textContent =
      "Nuevo acceso";
  }


  if (userModalTitle) {
    userModalTitle.textContent =
      "Crear usuario";
  }


  if (userModalDescription) {
    userModalDescription.textContent =
      "Configura el acceso administrativo del usuario.";
  }


  userModal.classList.remove("hidden");

  userModal.setAttribute(
    "aria-hidden",
    "false"
  );


  setTimeout(
    () => {
      usuarioNombre?.focus();
    },
    50
  );
}

/* =========================================================
   ABRIR MODAL EDITAR USUARIO
========================================================= */

function abrirModalEditarUsuario(uid) {
  const usuario =
    usuarios.find(
      (item) => item.uid === uid
    );


  if (!usuario) {
    console.error(
      "No se encontró el usuario a editar:",
      uid
    );

    return;
  }


  const userModal =
    document.getElementById("userModal");

  const userForm =
    document.getElementById("userForm");

  const usuarioUid =
    document.getElementById("usuarioUid");

  const usuarioNombre =
    document.getElementById("usuarioNombre");

  const usuarioEmail =
    document.getElementById("usuarioEmail");

  const usuarioGlobalAccess =
    document.getElementById(
      "usuarioGlobalAccess"
    );

  const usuarioMarcas =
    document.getElementById(
      "usuarioMarcas"
    );

  const usuarioSucursales =
    document.getElementById(
      "usuarioSucursales"
    );

  const usuarioPaises =
    document.getElementById(
      "usuarioPaises"
    );

  const userModalEyebrow =
    document.getElementById(
      "userModalEyebrow"
    );

  const userModalTitle =
    document.getElementById(
      "userModalTitle"
    );

  const userModalDescription =
    document.getElementById(
      "userModalDescription"
    );

  const primaryAdminNotice =
    document.getElementById(
      "primaryAdminNotice"
    );


  if (!userModal) {
    console.error(
      "No se encontró el modal userModal."
    );

    return;
  }


  if (userForm) {
    userForm.reset();
  }


  if (usuarioUid) {
    usuarioUid.value =
      usuario.uid || "";
  }


  if (usuarioNombre) {
    usuarioNombre.value =
      usuario.nombre || "";
  }


  /*
   * Por seguridad el correo no se modifica
   * desde esta pantalla.
   */
  if (usuarioEmail) {
    usuarioEmail.value =
      usuario.email || "";

    usuarioEmail.disabled = true;
  }


  const roleRadio =
    document.querySelector(
      `input[name="usuarioRole"][value="${CSS.escape(
        usuario.role || ""
      )}"]`
    );


  if (roleRadio) {
    roleRadio.checked = true;
  }


  if (usuarioGlobalAccess) {
    usuarioGlobalAccess.checked =
      usuario.globalAccess === true;
  }


  if (usuarioMarcas) {
    usuarioMarcas.value =
      Array.isArray(
        usuario.allowedBrands
      )
        ? usuario.allowedBrands.join(", ")
        : "";
  }


  if (usuarioSucursales) {
    usuarioSucursales.value =
      Array.isArray(
        usuario.allowedBranches
      )
        ? usuario.allowedBranches.join(", ")
        : "";
  }


  if (usuarioPaises) {
    usuarioPaises.value =
      Array.isArray(
        usuario.allowedCountries
      )
        ? usuario.allowedCountries.join(", ")
        : "";
  }


  if (userModalEyebrow) {
    userModalEyebrow.textContent =
      "Editar acceso";
  }


  if (userModalTitle) {
    userModalTitle.textContent =
      usuario.nombre
        ? `Editar ${usuario.nombre}`
        : "Editar usuario";
  }


  if (userModalDescription) {
    userModalDescription.textContent =
      usuario.isPrimaryAdmin
        ? "Esta cuenta es un administrador principal y tiene protecciones especiales."
        : "Actualiza el rol, alcance y permisos administrativos del usuario.";
  }


  /*
   * Aviso especial para administradores principales.
   */
  if (primaryAdminNotice) {

    if (usuario.isPrimaryAdmin) {
      primaryAdminNotice.classList.remove(
        "hidden"
      );
    } else {
      primaryAdminNotice.classList.add(
        "hidden"
      );
    }

  }


  /*
   * El administrador principal no debe poder
   * cambiar accidentalmente su rol.
   */
  document
    .querySelectorAll(
      'input[name="usuarioRole"]'
    )
    .forEach((radio) => {

      radio.disabled =
        usuario.isPrimaryAdmin === true;

    });


  /*
   * Tampoco permitimos modificar el acceso global
   * del administrador principal desde la UI.
   */
  if (usuarioGlobalAccess) {

    usuarioGlobalAccess.disabled =
      usuario.isPrimaryAdmin === true;

  }


  userModal.classList.remove(
    "hidden"
  );

  userModal.setAttribute(
    "aria-hidden",
    "false"
  );


  setTimeout(
    () => {
      usuarioNombre?.focus();
    },
    50
  );
}


function cerrarModalUsuario() {
  const userModal =
    document.getElementById("userModal");

  const btnNuevoUsuario =
    document.getElementById(
      "btnNuevoUsuario"
    );

  if (!userModal) {
    return;
  }


  /*
   * Si el foco está dentro del modal,
   * lo retiramos antes de ocultarlo.
   */
  const activeElement =
    document.activeElement;

  if (
    activeElement &&
    userModal.contains(activeElement)
  ) {
    activeElement.blur();
  }


  userModal.classList.add("hidden");

  userModal.setAttribute(
    "aria-hidden",
    "true"
  );


  /*
   * Devolvemos el foco al botón
   * que abrió el modal.
   */
  setTimeout(
    () => {
      btnNuevoUsuario?.focus();
    },
    0
  );
}


/* =========================================================
   EVENTOS DEL MODAL
========================================================= */

const btnNuevoUsuario =
  document.getElementById(
    "btnNuevoUsuario"
  );

const btnCerrarModal =
  document.getElementById(
    "btnCerrarModal"
  );

const btnCancelarUsuario =
  document.getElementById(
    "btnCancelarUsuario"
  );

const userModal =
  document.getElementById(
    "userModal"
  );


btnNuevoUsuario?.addEventListener(
  "click",
  abrirModalNuevoUsuario
);


btnCerrarModal?.addEventListener(
  "click",
  cerrarModalUsuario
);


btnCancelarUsuario?.addEventListener(
  "click",
  cerrarModalUsuario
);


userModal?.addEventListener(
  "click",
  (event) => {

    if (event.target === userModal) {
      cerrarModalUsuario();
    }

  }
);


document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape" &&
      userModal &&
      !userModal.classList.contains(
        "hidden"
      )
    ) {
      cerrarModalUsuario();
    }

  }
);


/* =========================================================
   CREAR USUARIO ADMINISTRATIVO
========================================================= */

function convertirTextoALista(valor = "") {
  return String(valor || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}


function mostrarErrorFormulario(mensaje = "") {
  const formError =
    document.getElementById("formError");

  if (!formError) {
    return;
  }

  formError.textContent =
    String(mensaje || "").trim();

  if (formError.textContent) {
    formError.classList.remove("hidden");
  } else {
    formError.classList.add("hidden");
  }
}


async function crearUsuarioAdministrativo(event) {
  event.preventDefault();


 const usuarioUid =
  document.getElementById("usuarioUid");

const editandoUid =
  String(
    usuarioUid?.value || ""
  ).trim();

const esEdicion =
  Boolean(editandoUid);


  const usuarioNombre =
    document.getElementById("usuarioNombre");

  const usuarioEmail =
    document.getElementById("usuarioEmail");

  const usuarioGlobalAccess =
    document.getElementById(
      "usuarioGlobalAccess"
    );

  const usuarioMarcas =
    document.getElementById(
      "usuarioMarcas"
    );

  const usuarioSucursales =
    document.getElementById(
      "usuarioSucursales"
    );

  const usuarioPaises =
    document.getElementById(
      "usuarioPaises"
    );

  const btnGuardarUsuario =
    document.getElementById(
      "btnGuardarUsuario"
    );


  const roleSeleccionado =
    document.querySelector(
      'input[name="usuarioRole"]:checked'
    );


  const nombre =
    String(
      usuarioNombre?.value || ""
    ).trim();

  const email =
    String(
      usuarioEmail?.value || ""
    )
      .trim()
      .toLowerCase();

  const role =
    String(
      roleSeleccionado?.value || ""
    ).trim();


  mostrarErrorFormulario("");


  if (!nombre) {
    mostrarErrorFormulario(
      "Ingresa el nombre del usuario."
    );

    usuarioNombre?.focus();

    return;
  }


  if (!email) {
    mostrarErrorFormulario(
      "Ingresa el correo electrónico del usuario."
    );

    usuarioEmail?.focus();

    return;
  }


  if (!role) {
    mostrarErrorFormulario(
      "Selecciona un rol para el usuario."
    );

    return;
  }


  const payload = {
    nombre,
    email,
    role,

    globalAccess:
      Boolean(
        usuarioGlobalAccess?.checked
      ),

    allowedBrands:
      convertirTextoALista(
        usuarioMarcas?.value
      ),

    allowedBranches:
      convertirTextoALista(
        usuarioSucursales?.value
      ),

    allowedCountries:
      convertirTextoALista(
        usuarioPaises?.value
      ),

    /*
     * Arreglo vacío = usar permisos
     * predeterminados del rol.
     */
    permissions: []
  };


  try {

    if (btnGuardarUsuario) {
      btnGuardarUsuario.disabled = true;
      btnGuardarUsuario.textContent =
        "Creando usuario...";
    }

    const endpoint =
  esEdicion
    ? `${API_URL}/api/admin/users/${encodeURIComponent(
        editandoUid
      )}`
    : `${API_URL}/api/admin/users`;


const method =
  esEdicion
    ? "PATCH"
    : "POST";


const response =
  await fetch(
    endpoint,
    {
      method,

      headers: {
        ...authHeaders(),
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify(payload)
    }
  );



    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }


    if (!response.ok) {

      throw new Error(
        data?.error ||
        "No fue posible crear el usuario."
      );

    }


    console.log(
  esEdicion
    ? "Usuario administrativo actualizado:"
    : "Usuario administrativo creado:",
  {
    uid:
      data?.user?.uid,

    nombre:
      data?.user?.nombre,

    email:
      data?.user?.email,

    role:
      data?.user?.role,

    passwordLinkGenerated:
      Boolean(
        data?.passwordSetup
          ?.linkGenerated
      )
  }
);


    


    cerrarModalUsuario();
    await cargarUsuariosAdministrativos();

    if (esEdicion) {

  console.log(
    "Cambios del usuario guardados correctamente.",
    {
      uid:
        data?.user?.uid,

      nombre:
        data?.user?.nombre,

      role:
        data?.user?.role
    }
  );

} else {

  const emailSent =
    data?.passwordSetup?.emailSent === true;


  console.log(
    "Cuenta creada correctamente.",
    {
      uid:
        data?.user?.uid,

      email:
        data?.user?.email,

      accessEmailSent:
        emailSent
    }
  );


  if (!emailSent) {
    console.warn(
      "La cuenta fue creada, pero el servidor no confirmó el envío del correo de acceso."
    );
  }

}


  } catch (error) {

    console.error(
      "Error creando usuario administrativo:",
      error
    );

    mostrarErrorFormulario(
      error?.message ||
      "No fue posible crear el usuario."
    );

  } finally {

    if (btnGuardarUsuario) {
      btnGuardarUsuario.disabled = false;
      btnGuardarUsuario.textContent =
        "Guardar usuario";
    }

  }
}


/* =========================================================
   SUBMIT DEL FORMULARIO
========================================================= */

const userFormSubmit =
  document.getElementById(
    "userForm"
  );


userFormSubmit?.addEventListener(
  "submit",
  crearUsuarioAdministrativo
);

/* =========================================================
   CARGAR Y MOSTRAR USUARIOS
========================================================= */

async function cargarUsuariosAdministrativos() {
  const response = await fetch(
    `${API_URL}/api/admin/users`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store"
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      "No fue posible cargar los usuarios administrativos."
    );
  }

  usuarios =
    Array.isArray(data?.users)
      ? data.users
      : [];

  renderUsuarios();
}


function renderEstadisticasUsuarios(lista = []) {
  const statTotal =
    document.getElementById("statTotal");

  const statActivos =
    document.getElementById("statActivos");

  const statAdmins =
    document.getElementById("statAdmins");

  const statLimitados =
    document.getElementById("statLimitados");


  const total =
    lista.length;

  const activos =
    lista.filter(
      (usuario) =>
        usuario.active !== false &&
        usuario.firebaseDisabled !== true
    ).length;

  const admins =
    lista.filter(
      (usuario) =>
        usuario.role === "admin"
    ).length;

  const limitados =
    lista.filter(
      (usuario) =>
        usuario.globalAccess !== true
    ).length;


  if (statTotal) {
    statTotal.textContent =
      String(total);
  }

  if (statActivos) {
    statActivos.textContent =
      String(activos);
  }

  if (statAdmins) {
    statAdmins.textContent =
      String(admins);
  }

  if (statLimitados) {
    statLimitados.textContent =
      String(limitados);
  }
}


function obtenerDescripcionAlcance(
  usuario = {}
) {
  if (usuario.globalAccess === true) {
    return "Acceso global";
  }

  const partes = [];

  const marcas =
    Array.isArray(usuario.allowedBrands)
      ? usuario.allowedBrands
      : [];

  const sucursales =
    Array.isArray(usuario.allowedBranches)
      ? usuario.allowedBranches
      : [];

  const paises =
    Array.isArray(usuario.allowedCountries)
      ? usuario.allowedCountries
      : [];


  if (marcas.length) {
    partes.push(
      `${marcas.length} marca${
        marcas.length === 1
          ? ""
          : "s"
      }`
    );
  }

  if (sucursales.length) {
    partes.push(
      `${sucursales.length} sucursal${
        sucursales.length === 1
          ? ""
          : "es"
      }`
    );
  }

  if (paises.length) {
    partes.push(
      `${paises.length} país${
        paises.length === 1
          ? ""
          : "es"
      }`
    );
  }

  return partes.length
    ? partes.join(" · ")
    : "Sin alcance asignado";
}


function crearTarjetaUsuario(
  usuario = {}
) {
  const article =
    document.createElement("article");

  article.className =
    "user-card";


  const estaActivo =
    usuario.active !== false &&
    usuario.firebaseDisabled !== true;


  const nombre =
    usuario.nombre ||
    usuario.email ||
    "Usuario administrativo";


  const roleLabel =
    usuario.isPrimaryAdmin
      ? "Administrador principal"
      : formatearRol(
          usuario.role
        );


  const estadoTexto =
    estaActivo
      ? "Activo"
      : "Desactivado";


  const estadoClase =
    estaActivo
      ? "status-active"
      : "status-inactive";


  const alcance =
    obtenerDescripcionAlcance(
      usuario
    );


  article.innerHTML = `
    <div class="user-card-main">

      <div class="user-avatar">
        ${obtenerInicial(nombre)}
      </div>

      <div class="user-info">

        <div class="user-name-row">

          <strong class="user-name">
            ${escapeHtml(nombre)}
          </strong>

          ${
            usuario.isPrimaryAdmin
              ? `
                <span class="user-badge primary-admin">
                  Principal
                </span>
              `
              : ""
          }

        </div>

        <span class="user-email">
          ${escapeHtml(
            usuario.email || ""
          )}
        </span>

        <div class="user-meta">

          <span class="user-role">
            ${escapeHtml(roleLabel)}
          </span>

          <span class="user-scope">
            ${escapeHtml(alcance)}
          </span>

        </div>

      </div>

    </div>


    <div class="user-card-side">

      <span class="user-status ${estadoClase}">
        ${estadoTexto}
      </span>

     <div class="user-actions-menu-wrapper">

  <button
    type="button"
    class="user-actions-btn"
    data-user-uid="${escapeHtml(
      usuario.uid || ""
    )}"
    aria-expanded="false"
    title="Administrar usuario"
  >
    ⋯
  </button>

  <div
    class="user-actions-menu hidden"
    data-menu-uid="${escapeHtml(
      usuario.uid || ""
    )}"
  >

    <button
      type="button"
      class="user-action-item"
      data-action="edit"
      data-user-uid="${escapeHtml(
        usuario.uid || ""
      )}"
    >
      Editar acceso
    </button>

    <button
      type="button"
      class="user-action-item"
      data-action="password"
      data-user-uid="${escapeHtml(
        usuario.uid || ""
      )}"
    >
      Reenviar acceso
    </button>

    ${
      usuario.isPrimaryAdmin
        ? ""
        : `
          <button
            type="button"
            class="user-action-item danger"
            data-action="status"
            data-user-uid="${escapeHtml(
              usuario.uid || ""
            )}"
          >
            ${
              estaActivo
                ? "Desactivar usuario"
                : "Reactivar usuario"
            }
          </button>
        `
    }

  </div>

</div>

    </div>
  `;


  return article;
}


function escapeHtml(valor = "") {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function obtenerUsuariosFiltrados() {
  const buscarUsuario =
    document.getElementById(
      "buscarUsuario"
    );

  const filtroRol =
    document.getElementById(
      "filtroRol"
    );

  const filtroEstado =
    document.getElementById(
      "filtroEstado"
    );


  const busqueda =
    String(
      buscarUsuario?.value || ""
    )
      .trim()
      .toLowerCase();

  const role =
    String(
      filtroRol?.value || ""
    ).trim();

  const estado =
    String(
      filtroEstado?.value || ""
    ).trim();


  return usuarios.filter(
    (usuario) => {

      const nombre =
        String(
          usuario.nombre || ""
        ).toLowerCase();

      const email =
        String(
          usuario.email || ""
        ).toLowerCase();


      if (
        busqueda &&
        !nombre.includes(busqueda) &&
        !email.includes(busqueda)
      ) {
        return false;
      }


      if (
        role &&
        usuario.role !== role
      ) {
        return false;
      }


      const estaActivo =
        usuario.active !== false &&
        usuario.firebaseDisabled !== true;


      if (
        estado === "activo" &&
        !estaActivo
      ) {
        return false;
      }


      if (
        estado === "inactivo" &&
        estaActivo
      ) {
        return false;
      }


      return true;
    }
  );
}


function renderUsuarios() {
  const usersList =
    document.getElementById(
      "usersList"
    );

  const emptyState =
    document.getElementById(
      "emptyState"
    );


  renderEstadisticasUsuarios(
    usuarios
  );


  if (!usersList) {
    return;
  }


  const filtrados =
    obtenerUsuariosFiltrados();


  usersList.innerHTML = "";


  if (!filtrados.length) {

    if (emptyState) {
      emptyState.classList.remove(
        "hidden"
      );
    }

    return;
  }


  if (emptyState) {
    emptyState.classList.add(
      "hidden"
    );
  }


  const fragment =
    document.createDocumentFragment();


  filtrados.forEach(
    (usuario) => {

      fragment.appendChild(
        crearTarjetaUsuario(
          usuario
        )
      );

    }
  );


  usersList.appendChild(
    fragment
  );
}

/* =========================================================
   GENERAR / REENVIAR ENLACE DE CONTRASEÑA
========================================================= */

async function generarEnlacePassword(uid) {

  const usuario =
    usuarios.find(
      (item) => item.uid === uid
    );


  if (!usuario) {
    console.error(
      "No se encontró el usuario:",
      uid
    );

    return;
  }


  try {

    const response =
      await fetch(
        `${API_URL}/api/admin/users/${encodeURIComponent(uid)}/password-link`,
        {
          method: "POST",

          headers: {
            ...authHeaders(),
            "Content-Type":
              "application/json"
          }
        }
      );


    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }


    if (!response.ok) {
      throw new Error(
        data?.error ||
        "No fue posible enviar el acceso al usuario."
      );
    }


    const emailSent =
      data?.passwordSetup?.emailSent === true;


    if (!emailSent) {
      throw new Error(
        "El servidor generó el acceso, pero no confirmó el envío del correo."
      );
    }


    console.log(
      `Correo de acceso enviado correctamente a ${usuario.email}.`
    );

    mostrarToast(
  `Acceso enviado correctamente a ${usuario.email}.`,
  "success"
);


    return {
      ok: true,
      emailSent: true,
      user:
        data?.user || usuario,
      communication:
        data?.communication || null
    };

  } catch (error) {

    console.error(
  "Error enviando acceso administrativo:",
  {
    message:
      error?.message ||
      "Error desconocido"
  }
);

mostrarToast(
  error?.message ||
    "No fue posible enviar el acceso al usuario.",
  "error"
);

return {
  ok: false,
  error:
    error?.message ||
    "No fue posible enviar el acceso al usuario."
};
  }
}

/* =========================================================
   MODAL CONFIRMACIÓN ACTIVAR / DESACTIVAR
========================================================= */

const confirmModal =
  document.getElementById(
    "confirmModal"
  );

const confirmTitle =
  document.getElementById(
    "confirmTitle"
  );

const confirmMessage =
  document.getElementById(
    "confirmMessage"
  );

const btnConfirmCancel =
  document.getElementById(
    "btnConfirmCancel"
  );

const btnConfirmAction =
  document.getElementById(
    "btnConfirmAction"
  );


let pendingStatusChange = null;


function cerrarModalConfirmacion() {

  pendingStatusChange = null;

  if (confirmModal) {
    confirmModal.classList.add(
      "hidden"
    );

    confirmModal.setAttribute(
      "aria-hidden",
      "true"
    );
  }
}


function abrirModalCambioEstado(
  usuario
) {

  if (!usuario) {
    return;
  }


  const estaActivo =
    usuario.active !== false;


  pendingStatusChange = {
    uid:
      usuario.uid,

    active:
      !estaActivo,

    nombre:
      usuario.nombre ||
      usuario.email ||
      "Usuario"
  };


  if (confirmTitle) {
    confirmTitle.textContent =
      estaActivo
        ? "Desactivar usuario"
        : "Reactivar usuario";
  }


  if (confirmMessage) {
    confirmMessage.textContent =
      estaActivo
        ? `¿Deseas desactivar el acceso de ${pendingStatusChange.nombre}?`
        : `¿Deseas reactivar el acceso de ${pendingStatusChange.nombre}?`;
  }


  if (btnConfirmAction) {

    btnConfirmAction.textContent =
      estaActivo
        ? "Desactivar"
        : "Reactivar";

    btnConfirmAction.classList.toggle(
      "btn-danger",
      estaActivo
    );
  }


  if (confirmModal) {

    confirmModal.classList.remove(
      "hidden"
    );

    confirmModal.setAttribute(
      "aria-hidden",
      "false"
    );
  }
}


btnConfirmCancel?.addEventListener(
  "click",
  cerrarModalConfirmacion
);

btnConfirmAction?.addEventListener(
  "click",
  async () => {

    if (!pendingStatusChange) {
      return;
    }


    const {
      uid,
      active,
      nombre
    } = pendingStatusChange;


    btnConfirmAction.disabled = true;


    try {

      const response =
        await fetch(
          `${API_URL}/api/admin/users/${encodeURIComponent(uid)}/status`,
          {
            method: "PATCH",

            headers: {
              ...authHeaders(),
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                active
              })
          }
        );


      let data = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }


      if (!response.ok) {
        throw new Error(
          data?.error ||
          "No fue posible actualizar el estado del usuario."
        );
      }


      const usuarioIndex =
        usuarios.findIndex(
          (item) =>
            item.uid === uid
        );


      if (usuarioIndex >= 0) {

        usuarios[usuarioIndex] = {
          ...usuarios[usuarioIndex],
          active:
            data?.user?.active ??
            active
        };

      }


      cerrarModalConfirmacion();

      renderUsuarios();


      mostrarToast(
        active
          ? `${nombre} fue reactivado correctamente.`
          : `${nombre} fue desactivado correctamente.`,
        "success"
      );


    } catch (error) {

      mostrarToast(
        error?.message ||
          "No fue posible actualizar el usuario.",
        "error"
      );


    } finally {

      btnConfirmAction.disabled =
        false;

    }

  }
);

/* =========================================================
   MENÚ DE ACCIONES DE USUARIO
========================================================= */

function cerrarMenusUsuarios() {
  document
    .querySelectorAll(
      ".user-actions-menu"
    )
    .forEach((menu) => {
      menu.classList.add("hidden");
    });

  document
    .querySelectorAll(
      ".user-actions-btn"
    )
    .forEach((button) => {
      button.setAttribute(
        "aria-expanded",
        "false"
      );
    });
}


document.addEventListener(
  "click",
  async (event) => {

    const actionsButton =
      event.target.closest(
        ".user-actions-btn"
      );


    if (actionsButton) {

      event.stopPropagation();

      const uid =
        actionsButton.dataset.userUid;

      const menu =
        document.querySelector(
          `.user-actions-menu[data-menu-uid="${CSS.escape(
            uid
          )}"]`
        );


      const estabaAbierto =
        menu &&
        !menu.classList.contains(
          "hidden"
        );


      cerrarMenusUsuarios();


      if (
        menu &&
        !estabaAbierto
      ) {
        menu.classList.remove(
          "hidden"
        );

        actionsButton.setAttribute(
          "aria-expanded",
          "true"
        );
      }

      return;
    }


    const actionItem =
      event.target.closest(
        ".user-action-item"
      );


    if (actionItem) {

      event.stopPropagation();

      const uid =
        actionItem.dataset.userUid;

      const action =
        actionItem.dataset.action;



        console.log(
  "Acción seleccionada:",
  {
    uid,
    action
  }
);


cerrarMenusUsuarios();


if (action === "password") {

  await generarEnlacePassword(
    uid
  );

  return;
}


if (action === "edit") {

  abrirModalEditarUsuario(
    uid
  );

  return;
}


if (action === "status") {

  const usuario =
    usuarios.find(
      (item) =>
        item.uid === uid
    );

  if (!usuario) {
    mostrarToast(
      "No fue posible localizar al usuario.",
      "error"
    );

    return;
  }

  abrirModalCambioEstado(
    usuario
  );

  return;
}
      
    }


    cerrarMenusUsuarios();
  }
);


/* =========================================================
   FILTROS
========================================================= */

const buscarUsuarioInput =
  document.getElementById(
    "buscarUsuario"
  );

const filtroRolSelect =
  document.getElementById(
    "filtroRol"
  );

const filtroEstadoSelect =
  document.getElementById(
    "filtroEstado"
  );


buscarUsuarioInput?.addEventListener(
  "input",
  renderUsuarios
);


filtroRolSelect?.addEventListener(
  "change",
  renderUsuarios
);


filtroEstadoSelect?.addEventListener(
  "change",
  renderUsuarios
);


/* =========================================================
   INICIALIZACIÓN DEL MÓDULO
========================================================= */

async function initUsuariosAdmin() {
  try {
    await cargarUsuarioAdministrativo();
    configurarNavegacionPorPermisos();

    /*
      Esta primera versión del módulo queda reservada
      para quienes tienen capacidad de gestionar
      administradores.

      La seguridad real también está en el backend.
    */
    if (
      !hasPermission(
        "usuarios.gestionar_admins"
      )
    ) {
      console.warn(
        "Acceso denegado a Usuarios y accesos."
      );

      mostrarAccesoDenegado();
      return;
    }

   renderUsuarioActual();

await cargarUsuariosAdministrativos();

mostrarAplicacion();

console.log(
  "Módulo Usuarios y accesos autorizado correctamente.",
  {
    usuariosCargados:
      usuarios.length
  }
);

  } catch (error) {
    console.error(
      "Error inicializando Usuarios y accesos:",
      error
    );

    mostrarAccesoDenegado();
  }
}


/* =========================================================
   CONTROL DE SESIÓN
========================================================= */

auth.onAuthStateChanged(
  async (user) => {

   if (!user) {
  window.location.href =
    "login-admin.html";

  return;
}
    try {
      adminToken =
        await user.getIdToken(true);

      await initUsuariosAdmin();

    } catch (error) {
      console.error(
        "No fue posible iniciar Usuarios y accesos:",
        error
      );

      mostrarAccesoDenegado();
    }
  }
);
