// Configuración
const API_BASE_URL = 'http://localhost:3000/api';
let categorias = [];
let filteredCategorias = [];

// Verificar autenticación
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '../index.html';
}

// Función para hacer peticiones autenticadas
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
    await loadCategorias();
});

// Cargar categorías
async function loadCategorias() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/categorias`);
        const data = await response.json();
        
        if (data.success) {
            categorias = data.data;
            filteredCategorias = [...categorias];
            renderTable();
            updateTableInfo();
        } else {
            showError('Error cargando categorías');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

// Renderizar tabla
function renderTable() {
    const tbody = document.getElementById('categoriasTableBody');
    
    if (filteredCategorias.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <i class="fas fa-tags"></i>
                        <h3>No hay categorías</h3>
                        <p>Comienza agregando tu primera categoría</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredCategorias.map(categoria => `
        <tr>
            <td>#${categoria.id}</td>
            <td><strong>${categoria.nombre}</strong></td>
            <td>${categoria.descripcion || ''}</td>
            <td>
                <span class="status-badge ${categoria.estado === 'activo' ? 'activo' : 'inactivo'}">
                    ${categoria.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="actions-group">
                    <button class="action-btn btn-view" onclick="viewCategory(${categoria.id})" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-edit" onclick="editCategory(${categoria.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deleteCategory(${categoria.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Actualizar información de la tabla
function updateTableInfo() {
    const total = categorias.length;
    const filtered = filteredCategorias.length;
    const info = filtered === total ? 
        `${total} categoría${total !== 1 ? 's' : ''}` :
        `${filtered} de ${total} categoría${total !== 1 ? 's' : ''}`;
    document.getElementById('tableInfo').textContent = info;
}

// Filtros
function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;

    filteredCategorias = categorias.filter(categoria => {
        const matchesSearch = !search || 
            categoria.nombre.toLowerCase().includes(search) ||
            (categoria.descripcion && categoria.descripcion.toLowerCase().includes(search));
        
        const matchesStatus = !status || categoria.estado === status;

        return matchesSearch && matchesStatus;
    });

    renderTable();
    updateTableInfo();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    filteredCategorias = [...categorias];
    renderTable();
    updateTableInfo();
}

// Event listeners para filtros en tiempo real
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);


// Modal
function openModal(categoria = null) {
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');
    const title = document.getElementById('modalTitle');

    if (categoria) {
        title.textContent = 'Editar Categoría';
        fillForm(categoria);
    } else {
        title.textContent = 'Nueva Categoría';
        form.reset();
        document.getElementById('categoryId').value = '';
    }

    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('categoryModal').classList.remove('show');
}

function fillForm(categoria) {
    document.getElementById('categoryId').value = categoria.id;
    document.getElementById('nombre').value = categoria.nombre;
    document.getElementById('descripcion').value = categoria.descripcion || '';
    document.getElementById('estado').value = categoria.estado;
}

// CRUD Operations
async function saveCategory(categoryData) {
    try {
        const categoryId = document.getElementById('categoryId').value;
        const isEdit = Boolean(categoryId);
        
        const url = isEdit ? 
            `${API_BASE_URL}/categorias/${categoryId}` : 
            `${API_BASE_URL}/categorias`;
        
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetchWithAuth(url, {
            method,
            body: JSON.stringify(categoryData)
        });

        const data = await response.json();
        
        if (data.success) {
            showSuccess(data.message);
            closeModal();
            await loadCategorias();
        } else {
            showError(data.message || 'Error guardando categoría');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

function editCategory(id) {
    const categoria = categorias.find(c => c.id === id);
    if (categoria) {
        openModal(categoria);
    }
}

function viewCategory(id) {
    const categoria = categorias.find(c => c.id === id);
    if (categoria) {
        alert(`Categoría: ${categoria.nombre}\nDescripción: ${categoria.descripcion || ''}\nEstado: ${categoria.estado}`);
    }
}

async function deleteCategory(id) {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/categorias/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.success) {
            showSuccess(data.message);
            await loadCategorias();
        } else {
            showError(data.message || 'Error eliminando categoría');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

// Form submit
document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const categoryData = {};
    
    for (let [key, value] of formData.entries()) {
        if (value.trim() !== '') {
            categoryData[key] = value;
        }
    }
    
    await saveCategory(categoryData);
});

// Utility functions
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
document.getElementById('categoryModal').addEventListener('click', (e) => {
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

