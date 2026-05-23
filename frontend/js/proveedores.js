// Configuración
const API_BASE_URL = 'http://localhost:3000/api';
let proveedores = [];
let filteredProveedores = [];

// Verificar autenticación
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '../index.html';
}

// Función para peticiones autenticadas
async function fetchWithAuth(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    return fetch(url, { ...options, ...defaultOptions });
}

// Cargar datos iniciales
document.addEventListener('DOMContentLoaded', async () => {
    await loadProveedores();
});

// Cargar proveedores
async function loadProveedores() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/proveedores`);
        const data = await response.json();
        
        if (data.success) {
            proveedores = data.data;
            filteredProveedores = [...proveedores];
            renderTable();
            updateTableInfo();
        } else {
            showError('Error cargando proveedores');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}


// Renderizar tabla
function renderTable() {
    const tbody = document.getElementById('proveedoresTableBody');
    
    if (filteredProveedores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class="fas fa-truck"></i>
                        <h3>No hay proveedores</h3>
                        <p>Comienza agregando tu primer proveedor</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredProveedores.map(proveedor => `
        <tr>
            <td>#${proveedor.id}</td>
            <td><strong>${proveedor.nombre}</strong></td>
            <td>${proveedor.contacto || ''}</td>
            <td>${proveedor.telefono || ''}</td>
            <td>${proveedor.email || ''}</td>
            <td>${proveedor.direccion || ''}</td>
            <td>
                <span class="status-badge ${proveedor.estado === 'activo' ? 'activo' : 'inactivo'}">
                    ${proveedor.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="actions-group">
                    <button class="action-btn btn-view" onclick="viewProvider(${proveedor.id})" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-edit" onclick="editProvider(${proveedor.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deleteProvider(${proveedor.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Actualizar info tabla
function updateTableInfo() {
    const total = proveedores.length;
    const filtered = filteredProveedores.length;
    const info = filtered === total ? 
        `${total} proveedor${total !== 1 ? 'es' : ''}` :
        `${filtered} de ${total} proveedor${total !== 1 ? 'es' : ''}`;
    document.getElementById('tableInfo').textContent = info;
}

// Filtros
function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;

    filteredProveedores = proveedores.filter(proveedor => {
        const matchesSearch = !search || 
            proveedor.nombre.toLowerCase().includes(search) ||
            (proveedor.contacto && proveedor.contacto.toLowerCase().includes(search));
        
        const matchesStatus = !status || proveedor.estado === status;

        return matchesSearch && matchesStatus;
    });

    renderTable();
    updateTableInfo();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    filteredProveedores = [...proveedores];
    renderTable();
    updateTableInfo();
}

// Eventos filtros en tiempo real
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);


// Modal
function openModal(proveedor = null) {
    const modal = document.getElementById('providerModal');
    const form = document.getElementById('providerForm');
    const title = document.getElementById('modalTitle');

    if (proveedor) {
        title.textContent = 'Editar Proveedor';
        fillForm(proveedor);
    } else {
        title.textContent = 'Nuevo Proveedor';
        form.reset();
        document.getElementById('providerId').value = '';
    }

    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('providerModal').classList.remove('show');
}

function fillForm(proveedor) {
    document.getElementById('providerId').value = proveedor.id;
    document.getElementById('nombre').value = proveedor.nombre;
    document.getElementById('contacto').value = proveedor.contacto || '';
    document.getElementById('telefono').value = proveedor.telefono || '';
    document.getElementById('email').value = proveedor.email || '';
    document.getElementById('direccion').value = proveedor.direccion || '';
    document.getElementById('estado').value = proveedor.estado;
}

// Guardar proveedor (crear/editar)
async function saveProvider(providerData) {
    try {
        const providerId = document.getElementById('providerId').value;
        const isEdit = Boolean(providerId);
        
        const url = isEdit ? 
            `${API_BASE_URL}/proveedores/${providerId}` : 
            `${API_BASE_URL}/proveedores`;
        
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetchWithAuth(url, {
            method,
            body: JSON.stringify(providerData)
        });

        const data = await response.json();
        
        if (data.success) {
            showSuccess(data.message);
            closeModal();
            await loadProveedores();
        } else {
            showError(data.message || 'Error guardando proveedor');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

// Editar proveedor
function editProvider(id) {
    const proveedor = proveedores.find(p => p.id === id);
    if (proveedor) {
        openModal(proveedor);
    }
}

// Ver proveedor
function viewProvider(id) {
    const proveedor = proveedores.find(p => p.id === id);
    if (proveedor) {
        alert(`Proveedor: ${proveedor.nombre}\nContacto: ${proveedor.contacto || ''}\nTeléfono: ${proveedor.telefono || ''}\nEmail: ${proveedor.email || ''}\nDireccion: ${proveedor.direccion || ''}\nEstado: ${proveedor.estado}`);
    }
}

// Eliminar proveedor
async function deleteProvider(id) {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/proveedores/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.success) {
            showSuccess(data.message);
            await loadProveedores();
        } else {
            showError(data.message || 'Error eliminando proveedor');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

// Submit del formulario
document.getElementById('providerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const providerData = {};
    
    for (let [key, value] of formData.entries()) {
        if (value.trim() !== '') {
            providerData[key] = value;
        }
    }
    
    await saveProvider(providerData);
});


// Notificaciones
function showSuccess(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d4edda;
        color: #155724;
        padding: 15px 20px;
        border-radius: 8px;
        border: 1px solid #c3e6cb;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span style="margin-left: 8px;">${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f8d7da;
        color: #721c24;
        padding: 15px 20px;
        border-radius: 8px;
        border: 1px solid #f5c6cb;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span style="margin-left: 8px;">${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}

// Navegación
function goBack() {
    window.location.href = '../dashboard.html';
}

// Cerrar modal con Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Cerrar modal al hacer clic fuera
document.getElementById('providerModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        closeModal();
    }
});

// Animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);
