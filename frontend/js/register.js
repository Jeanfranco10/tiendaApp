// =============================================
// REGISTER.JS - Lógica de registro de usuarios
// =============================================

// URL base de la API del backend
const API_BASE_URL = 'https://tiendaapp-backend.onrender.com/api';

// -----------------------------
// 1. OBTENER ELEMENTOS DEL DOM
// -----------------------------
const registerForm = document.getElementById('registerForm');
const registerBtn = document.getElementById('registerBtn');
const btnText = document.querySelector('.btn-text');
const loading = document.querySelector('.loading');
const errorMessage = document.getElementById('errorMessage');

// -----------------------------
// 2. FUNCIONES AUXILIARES
// -----------------------------

// Muestra un mensaje de error en la tarjeta
// - message: texto del error a mostrar
// - Se oculta automáticamente después de 5 segundos
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// Activa o desactiva el estado de carga del botón
// - isLoading: true = muestra spinner y deshabilita el botón
function setLoading(isLoading) {
    if (isLoading) {
        btnText.style.display = 'none';
        loading.classList.add('show');
        registerBtn.disabled = true;
    } else {
        btnText.style.display = 'block';
        loading.classList.remove('show');
        registerBtn.disabled = false;
    }
}

// -----------------------------
// 3. FUNCIÓN PRINCIPAL: REGISTRO
// -----------------------------

// Envía los datos al backend para crear un nuevo usuario
async function register(nombre, email, username, password) {
    try {
        // Hace la petición POST al endpoint /api/auth/register
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Cuerpo de la petición en formato JSON
            body: JSON.stringify({
                nombre: nombre,
                email: email,
                username: username,
                password: password
            })
        });

        // Convierte la respuesta del servidor a objeto JavaScript
        const data = await response.json();

        // Si el registro fue exitoso
        if (data.success) {
            // Muestra mensaje de éxito (opcional, solo por consola)
            console.log('Registro exitoso:', data.message);

            // Redirige al login para que el usuario inicie sesión
            // Se usa replace para que no pueda volver con "atrás"
            window.location.replace('index.html?registro=exitoso');
        } else {
            // Muestra el error que devolvió el servidor
            showError(data.message || 'Error al registrar usuario');
        }
    } catch (error) {
        // Si hay un error de conexión o la petición falla
        console.error('Error en registro:', error);
        showError('Error de conexión con el servidor');
    }
}

// -----------------------------
// 4. VALIDACIÓN DEL FORMULARIO
// -----------------------------

// Cuando el usuario hace clic en "Crear Cuenta"
registerForm.addEventListener('submit', async (e) => {
    // Evita que el formulario se envíe solo (recargar la página)
    e.preventDefault();

    // Obtiene los valores de los campos y limpia espacios en blanco
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    // VALIDACIÓN 1: Todos los campos son obligatorios
    if (!nombre || !email || !username || !password || !confirmPassword) {
        showError('Todos los campos son obligatorios');
        return;
    }

    // VALIDACIÓN 2: Email debe tener un formato válido
    if (!email.includes('@') || !email.includes('.')) {
        showError('Ingresa un correo electrónico válido');
        return;
    }

    // VALIDACIÓN 3: Contraseña mínimo 6 caracteres
    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
    }

    // VALIDACIÓN 4: Las contraseñas deben coincidir
    if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return;
    }

    // VALIDACIÓN 5: Usuario mínimo 3 caracteres
    if (username.length < 3) {
        showError('El usuario debe tener al menos 3 caracteres');
        return;
    }

    // Si todo está bien, activa el loading y hace el registro
    setLoading(true);
    await register(nombre, email, username, password);
    setLoading(false);
});
