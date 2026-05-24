// =============================================
// VENTAS.JS - CRUD de ventas con detalles
// =============================================

// URL base de la API del backend
const API_BASE_URL = 'https://tiendaapp-backend.onrender.com/api';

// Variables globales: almacenan las ventas traídas del backend
let ventas = [];          // Lista completa de ventas
let filteredVentas = [];  // Lista filtrada (por búsqueda o estado)

// -----------------------------
// 1. SEGURIDAD: Verificar sesión
// -----------------------------
const token = localStorage.getItem('token');
if (!token) {
    // Si no hay token, redirige al login
    window.location.href = '../index.html';
}

// -----------------------------
// 2. FUNCIÓN AUXILIAR: fetch con token
// -----------------------------
// Agrega automáticamente el token JWT a todas las peticiones
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

// -----------------------------
// 3. INICIALIZACIÓN
// -----------------------------
// Apenas se carga la página, trae las ventas desde el backend
document.addEventListener('DOMContentLoaded', async () => {
    await loadVentas();
});

// -----------------------------
// 4. CARGAR VENTAS (GET)
// -----------------------------
async function loadVentas() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/ventas`);
        const data = await response.json();

        if (data.success) {
            ventas = data.data;           // Guarda todas las ventas
            filteredVentas = [...ventas]; // Inicia sin filtro
            renderTable();                // Dibuja la tabla
            updateTableInfo();            // Actualiza el contador
        } else {
            showError(data.message || 'Error cargando ventas');
        }
    } catch (error) {
        console.error(error);
        showError('Error de conexión');
    }
}

// -----------------------------
// 5. RENDERIZAR TABLA
// -----------------------------
// Toma filteredVentas y las muestra en filas <tr>
function renderTable() {
    const tbody = document.getElementById('ventasTableBody');

    // Si no hay resultados, muestra un mensaje vacío
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

    // Recorre el array y genera las filas dinámicamente
    tbody.innerHTML = filteredVentas.map(v => `
        <tr>
            <td>#${v.venta_id}</td>
            <td>${v.cliente_nombre}</td>
            <td>${v.cliente_email}</td>
            <td>${new Date(v.fecha_venta).toLocaleDateString()}</td>
            <td>S/. ${Number(v.total).toFixed(2)}</td>
            <td>
                <!-- Badge de color según el estado -->
                <span class="status-badge ${v.estado === 'completada' ? 'completada' : v.estado === 'pendiente' ? 'pendiente' : 'cancelada'}">
                    ${v.estado}
                </span>
            </td>
            <td>
                <div class="actions-group">
                    <button class="action-btn btn-view" onclick="viewSale(${v.venta_id})" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// -----------------------------
// 6. ACTUALIZAR CONTADOR
// -----------------------------
// Muestra "X ventas" o "X de Y ventas" según el filtro
function updateTableInfo() {
    const total = ventas.length;
    const filtered = filteredVentas.length;

    let info;
    if (total === 0) {
        info = '0 ventas registradas';
    } else if (filtered === 0) {
        info = `0 de ${total} venta${total !== 1 ? 's' : ''}`;
    } else if (filtered === total) {
        info = `${total} venta${total !== 1 ? 's' : ''}`;
    } else {
        info = `${filtered} de ${total} venta${total !== 1 ? 's' : ''}`;
    }

    document.getElementById('tableInfo').textContent = info;
}

// -----------------------------
// 7. FILTROS (búsqueda y estado)
// -----------------------------
// Escucha eventos en los inputs de búsqueda y estado
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
});

// Filtra las ventas en tiempo real mientras el usuario escribe o selecciona
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

// Restablece los filtros y muestra todas las ventas
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    filteredVentas = ventas;
    renderTable();
    updateTableInfo();
}

// -----------------------------
// 8. VER VENTA (con detalles)
// -----------------------------
// Abre un alert con la información completa de la venta + sus productos
async function viewSale(id) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/ventas/${id}`);
        const data = await response.json();

        if (data.success) {
            const v = data.data;

            // Si hay detalles (productos), arma el texto con cada uno
            let detallesHtml = (v.detalles && v.detalles.length > 0)
                ? v.detalles.map(d =>
                    `- Producto: ${d.producto_nombre}\n  Cantidad: ${d.cantidad}\n  Precio: S/. ${Number(d.precio_unitario).toFixed(2)}\n  Subtotal: S/. ${Number(d.subtotal_detalle).toFixed(2)}`
                  ).join('\n\n')
                : 'No hay detalles registrados';

            alert(`VENTA #${v.venta_id}
━━━━━━━━━━━━━━━━━━━━━
Cliente: ${v.cliente_nombre} (${v.cliente_email})
Fecha: ${new Date(v.fecha_venta).toLocaleString()}
Subtotal: S/. ${Number(v.subtotal_venta).toFixed(2)}
Impuestos: S/. ${Number(v.impuestos).toFixed(2)}
Total: S/. ${Number(v.total).toFixed(2)}
Estado: ${v.estado}

DETALLES:
${detallesHtml}`);
        } else {
            showError(data.message);
        }
    } catch (error) {
        console.error(error);
        showError('Error obteniendo venta');
    }
}

// -----------------------------
// 9. MODAL: abrir y cerrar
// -----------------------------
function openModal() {
    document.getElementById('saleModal').classList.add('show');
}

function closeModal() {
    document.getElementById('saleModal').classList.remove('show');
}

// -----------------------------
// 10. AGREGAR/QUITAR DETALLES (productos)
// -----------------------------
// Agrega una nueva fila de producto en el modal
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

// Elimina una fila de producto del modal
function removeDetalle(btn) {
    btn.parentElement.remove();
}

// -----------------------------
// 11. ENVIAR VENTA (POST)
// -----------------------------
// Toma los datos del formulario y los envía al backend
async function submitVenta() {
    const cliente_id = document.getElementById('cliente_id').value;
    const estado = document.getElementById('estadoVenta').value;

    // Recolecta todas las filas de detalle
    const detalleRows = document.querySelectorAll('#detallesContainer .detalle-row');
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

    // Validación: debe tener cliente y al menos 1 producto
    if (!cliente_id || detalles.length === 0) {
        alert('Debe ingresar cliente_id y al menos un detalle');
        return;
    }

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/ventas`, {
            method: 'POST',
            body: JSON.stringify({
                cliente_id: Number(cliente_id),
                estado: estado,
                detalles: detalles
            })
        });
        const data = await response.json();

        if (data.success) {
            showSuccess(data.message);
            closeModal();     // Cierra el modal
            await loadVentas(); // Recarga la tabla con la nueva venta
        } else {
            showError(data.message);
        }
    } catch (error) {
        console.error(error);
        showError('Error de conexión');
    }
}

// -----------------------------
// 12. NOTIFICACIONES
// -----------------------------
function showSuccess(msg) {
    alert('✅ ' + msg);
}

function showError(msg) {
    alert('❌ ' + msg);
}

// -----------------------------
// 13. NAVEGACIÓN
// -----------------------------
function goBack() {
    window.location.href = '../dashboard.html';
}
