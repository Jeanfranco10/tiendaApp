// Configuración
const API_BASE_URL = 'http://localhost:3000/api';
let clientes = [];
let filteredClientes = [];

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
    await loadClientes();
});

// Cargar clientes
async function loadClientes() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/clientes`);
        const data = await response.json();
        
        if (data.success) {
            clientes = data.data;
            filteredClientes = [...clientes];
            renderTable();
            updateTableInfo();
        } else {
            showError('Error cargando clientes');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

// Renderizar tabla
function renderTable() {
    const tbody = document.getElementById('clientesTableBody');
    
    if (filteredClientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No hay clientes</h3>
                        <p>Comienza agregando tu primer cliente</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredClientes.map(cliente => `
        <tr>
            <td>#${cliente.id}</td>
            <td><strong>${cliente.nombre}</strong></td>
            <td>${cliente.email || ''}</td>
            <td>${cliente.telefono || ''}</td>
            <td>${cliente.direccion || ''}</td>
            <td>
                <span class="status-badge ${cliente.estado === 'activo' ? 'activo' : 'inactivo'}">
                    ${cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="actions-group">
                    <button class="action-btn btn-view" onclick="viewClient(${cliente.id})" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-edit" onclick="editClient(${cliente.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deleteClient(${cliente.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Actualizar info tabla
function updateTableInfo() {
    const total = clientes.length;
    const filtered = filteredClientes.length;
    const info = filtered === total ? 
        `${total} cliente${total !== 1 ? 's' : ''}` :
        `${filtered} de ${total} cliente${total !== 1 ? 's' : ''}`;
    document.getElementById('tableInfo').textContent = info;
}

// Filtros
function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;

    filteredClientes = clientes.filter(cliente => {
        const matchesSearch = !search || 
            cliente.nombre.toLowerCase().includes(search) ||
            (cliente.email && cliente.email.toLowerCase().includes(search));
        
        const matchesStatus = !status || cliente.estado === status;

        return matchesSearch && matchesStatus;
    });

    renderTable();
    updateTableInfo();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    filteredClientes = [...clientes];
    renderTable();
    updateTableInfo();
}

// Eventos filtros en tiempo real
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);


// Modal
function openModal(cliente = null) {
    const modal = document.getElementById('clientModal');
    const form = document.getElementById('clientForm');
    const title = document.getElementById('modalTitle');

    if (cliente) {
        title.textContent = 'Editar Cliente';
        fillForm(cliente);
    } else {
        title.textContent = 'Nuevo Cliente';
        form.reset();
        document.getElementById('clientId').value = '';
    }

    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('clientModal').classList.remove('show');
}

function fillForm(cliente) {
    document.getElementById('clientId').value = cliente.id;
    document.getElementById('nombre').value = cliente.nombre;
    document.getElementById('email').value = cliente.email || '';
    document.getElementById('telefono').value = cliente.telefono || '';
    document.getElementById('direccion').value = cliente.direccion || '';
    document.getElementById('estado').value = cliente.estado;
}

// Guardar cliente (crear/editar)
async function saveClient(clientData) {
    try {
        const clientId = document.getElementById('clientId').value;
        const isEdit = Boolean(clientId);
        
        const url = isEdit ? 
            `${API_BASE_URL}/clientes/${clientId}` : 
            `${API_BASE_URL}/clientes`;
        
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetchWithAuth(url, {
            method,
            body: JSON.stringify(clientData)
        });

        const data = await response.json();
        
        if (data.success) {
            showSuccess(data.message);
            closeModal();
            await loadClientes();
        } else {
            showError(data.message || 'Error guardando cliente');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

// Editar cliente
function editClient(id) {
    const cliente = clientes.find(c => c.id === id);
    if (cliente) {
        openModal(cliente);
    }
}

// Ver cliente
function viewClient(id) {
    const cliente = clientes.find(c => c.id === id);
    if (cliente) {
        alert(`Cliente: ${cliente.nombre}\nEmail: ${cliente.email || ''}\nTeléfono: ${cliente.telefono || ''}\nDireccion: ${cliente.direccion || ''}\nEstado: ${cliente.estado}`);
    }
}

// Eliminar cliente
async function deleteClient(id) {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/clientes/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.success) {
            showSuccess(data.message);
            await loadClientes();
        } else {
            showError(data.message || 'Error eliminando cliente');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

// Submit del formulario
document.getElementById('clientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const clientData = {};
    
    for (let [key, value] of formData.entries()) {
        if (value.trim() !== '') {
            clientData[key] = value;
        }
    }
    
    await saveClient(clientData);
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
document.getElementById('clientModal').addEventListener('click', (e) => {
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

