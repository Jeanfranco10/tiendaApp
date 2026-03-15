const API_BASE_URL = 'http://localhost:3000/api';
let ventas = [];
let filteredVentas = [];

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '../index.html';
}

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

// Cargar ventas
document.addEventListener('DOMContentLoaded', async () => {
    await loadVentas();
});


async function loadVentas() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/ventas`);
        const data = await response.json();

        if (data.success) {
            ventas = data.data;
            filteredVentas = [...ventas];
            renderTable();
            updateTableInfo();
        } else {
            showError(data.message || 'Error cargando ventas');
        }
    } catch (error) {
        console.error(error);
        showError('Error de conexión');
    }
}

// Renderizar tabla con campos del backend
function renderTable() {
    const tbody = document.getElementById('ventasTableBody');

    if (filteredVentas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-cash-register"></i>
                        <h3>No hay ventas</h3>
                        <p>Comienza registrando tu primera venta</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredVentas.map(v => `
        <tr>
            <td>#${v.venta_id}</td>
            <td>${v.cliente_nombre}</td>
            <td>${v.cliente_email}</td>
            <td>${new Date(v.fecha_venta).toLocaleDateString()}</td>
            <td>S/. ${Number(v.total).toFixed(2)}</td>
            <td>
                <span class="status-badge ${v.estado === 'completada' ? 'status-active' : v.estado === 'pendiente' ? 'status-pending' : 'status-inactive'}">
                    ${v.estado}
                </span>
            </td>
            <td>
                <div class="actions">
                    <button class="action-btn btn-view" onclick="viewSale(${v.venta_id})" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateTableInfo() {
    const total = ventas.length;
    const filtered = filteredVentas.length;

    let info;
    if (total === 0) {
        // No hay ventas en la BD
        info = '0 ventas registradas';
    } else if (filtered === 0) {
        // Hay ventas, pero el filtro no encontró coincidencias
        info = `0 de ${total} venta${total !== 1 ? 's' : ''}`;
    } else if (filtered === total) {
        // Sin filtro aplicado, mostrar todas
        info = `${total} venta${total !== 1 ? 's' : ''}`;
    } else {
        // Filtro aplicado con coincidencias
        info = `${filtered} de ${total} venta${total !== 1 ? 's' : ''}`;
    }

    document.getElementById('tableInfo').textContent = info;
}




document.addEventListener('DOMContentLoaded', () => {
    // cuando escribes en el input de búsqueda
    document.getElementById('searchInput').addEventListener('input', applyFilters);

    // cuando cambias el estado en el select
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
});

function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;

    filteredVentas = ventas.filter(v => {
        const matchSearch = v.cliente_nombre.toLowerCase().includes(search) ||
                            v.cliente_email.toLowerCase().includes(search);
        const matchStatus = status === '' || v.estado === status;
        return matchSearch && matchStatus;
    });

    renderTable();
    updateTableInfo();
}


function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    filteredVentas = ventas; // restaurar todas las ventas
    renderTable();
}


// Ver venta con detalles
async function viewSale(id) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/ventas/${id}`);
        const data = await response.json();

        if (data.success) {
            const v = data.data;
            //validar si hay detalles
            let detallesHtml = (v.detalles && v.detalles.length > 0)
                ? v.detalles.map(d => 
                    `-Producto: ${d.producto_nombre}\n Cantidad: ${d.cantidad}\n Precio: S/. ${Number(d.precio_unitario).toFixed(2)}\n Subtotal: S/. ${Number(d.subtotal_detalle).toFixed(2)}
                  `).join('\n')
                : 'No hay detalles registrados';

            alert(`Venta #${v.venta_id}
Cliente: ${v.cliente_nombre} (${v.cliente_email})
Fecha: ${new Date(v.fecha_venta).toLocaleString()}
Subtotal: S/. ${Number(v.subtotal_venta).toFixed(2)}
Impuestos: S/. ${Number(v.impuestos).toFixed(2)}
Total: S/. ${Number(v.total).toFixed(2)}
Estado: ${v.estado}

Detalles:
${detallesHtml}`);
        } else {
            showError(data.message);
        }
    } catch (error) {
        console.error(error);
        showError('Error obteniendo venta');
    }
}

// Crear nueva venta (cliente_id + detalles[])
async function saveSale(cliente_id, detalles) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/ventas`, {
            method: 'POST',
            body: JSON.stringify({ cliente_id, detalles })
        });
        const data = await response.json();

        if (data.success) {
            showSuccess(data.message);
            await loadVentas();
        } else {
            showError(data.message);
        }
    } catch (error) {
        console.error(error);
        showError('Error de conexión');
    }
}



// Notificaciones
function showSuccess(msg) {
    alert('✅ ' + msg);
}
function showError(msg) {
    alert('❌ ' + msg);
}

// Abrir modal
function openModal() {
    document.getElementById('saleModal').classList.add('show');
}

// Cerrar modal
function closeModal() {
    document.getElementById('saleModal').classList.remove('show');
}

// Agregar fila de detalle
function addDetalle() {
    const container = document.getElementById('detallesContainer');
    const row = document.createElement('div');
    row.classList.add('detalle-row');
    row.innerHTML = `
        <input type="number" name="producto_id" placeholder="Producto ID" required>
        <input type="number" name="cantidad" placeholder="Cantidad" required>
        <input type="number" step="0.01" name="precio_unitario" placeholder="Precio Unitario" required>
        <button type="button" onclick="removeDetalle(this)">❌</button>
    `;
    container.appendChild(row);
}

// Eliminar fila de detalle
function removeDetalle(btn) {
    btn.parentElement.remove();
}

// Enviar venta al backend
async function submitVenta() {
    const cliente_id = document.getElementById('cliente_id').value;
    const estado = document.getElementById('estadoVenta').value;

    const detalleRows = document.querySelectorAll('#detallesContainer .detalle-row');

    // Construir array de detalles
    const detalles = [];
    detalleRows.forEach(row => {
        const producto_id = row.querySelector('input[name="producto_id"]').value;
        const cantidad = row.querySelector('input[name="cantidad"]').value;
        const precio_unitario = row.querySelector('input[name="precio_unitario"]').value;

        detalles.push({
            producto_id: Number(producto_id),
            cantidad: Number(cantidad),
            precio_unitario: Number(precio_unitario)
        });
    });

    // Validación
    if (!cliente_id || detalles.length === 0) {
        alert('Debe ingresar cliente_id y al menos un detalle');
        return;
    }

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/ventas`, {
            method: 'POST',
            body: JSON.stringify({ 
                cliente_id: Number(cliente_id),
                estado:estado,
                 detalles })
        });
        const data = await response.json();

        if (data.success) {
            showSuccess(data.message);
            closeModal();
            await loadVentas();
        } else {
            showError(data.message);
        }
    } catch (error) {
        console.error(error);
        showError('Error de conexión');
    }
}

// Navegación
function goBack() {
    window.location.href = '../dashboard.html';
}





