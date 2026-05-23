// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const btnText = document.querySelector('.btn-text');
const loading = document.querySelector('.loading');
const errorMessage = document.getElementById('errorMessage');

// Función para mostrar errores
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// Función para mostrar loading
function setLoading(isLoading) {
    if (isLoading) {
        btnText.style.display = 'none';
        loading.classList.add('show');
        loginBtn.disabled = true;
    } else {
        btnText.style.display = 'block';
        loading.classList.remove('show');
        loginBtn.disabled = false;
    }
}

// Función para hacer login
async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // Guardar token en localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirigir al dashboard
            window.location.href = 'dashboard.html';
        } else {
            showError(data.message || 'Error en las credenciales');
        }
    } catch (error) {
        console.error('Error en login:', error);
        showError('Error de conexión con el servidor');
    }
}

// Event listener para el formulario
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showError('Por favor completa todos los campos');
        return;
    }

    setLoading(true);
    await login(username, password);
    setLoading(false);
});

// Verificar si ya hay una sesión activa
if (localStorage.getItem('token')) {
    fetch(`${API_BASE_URL}/auth/verify`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = 'dashboard.html';
        }
    })
    .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    });
}

