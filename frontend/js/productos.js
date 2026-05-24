 // Configuración
        const API_BASE_URL = 'https://tiendaapp-backend.onrender.com/api';
        let productos = [];
        let categorias = [];
        let proveedores = [];
        let filteredProductos = [];

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
            await Promise.all([
                loadProductos(),
                loadCategorias(),
                loadProveedores()
            ]);
        });

        // Cargar productos
        async function loadProductos() {
            try {
                const response = await fetchWithAuth(`${API_BASE_URL}/productos`);
                const data = await response.json();
                
                if (data.success) {
                    productos = data.data;
                     

                    filteredProductos = [...productos];

                    console.log("Productos recibidos:", productos);

                    renderTable();
                    updateTableInfo();
                } else {
                    showError('Error cargando productos');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Error de conexión');
            }
        }

        // Cargar categorías
        async function loadCategorias() {
            try {
                const response = await fetchWithAuth(`${API_BASE_URL}/categorias`);
                const data = await response.json();
                
                if (data.success) {
                    categorias = data.data;
                    populateSelect('categoryFilter', categorias, 'id', 'nombre');
                    populateSelect('categoria_id', categorias, 'id', 'nombre');
                }
            } catch (error) {
                console.error('Error cargando categorías:', error);
            }
        }

        // Cargar proveedores
        async function loadProveedores() {
            try {
                const response = await fetchWithAuth(`${API_BASE_URL}/proveedores`);
                const data = await response.json();
                
                if (data.success) {
                    proveedores = data.data;
                    populateSelect('proveedor_id', proveedores, 'id', 'nombre');
                }
            } catch (error) {
                console.error('Error cargando proveedores:', error);
            }
        }

        // Poblar select
        function populateSelect(selectId, data, valueField, textField) {
            const select = document.getElementById(selectId);
            const currentOptions = select.innerHTML;
            
            data.forEach(item => {
                if (item.estado === 'activo') {
                    const option = document.createElement('option');
                    option.value = item[valueField];
                    option.textContent = item[textField];
                    select.appendChild(option);
                }
            });
        }

        // Renderizar tabla
        function renderTable() {
            const tbody = document.getElementById('productosTableBody');
            
            if (filteredProductos.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9">
                            <div class="empty-state">
                                <i class="fas fa-box-open"></i>
                                <h3>No hay productos</h3>
                                <p>Comienza agregando tu primer producto</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = filteredProductos.map(producto => { 
                
                console.log("Renderizado producto:",producto.id,producto.nombre);
                return `
                <tr>
                    <td>#${producto.id}</td>
                    <td>
                        <strong>${producto.nombre}</strong>
                        ${producto.descripcion ? `<br><small style="color: #666;">${producto.descripcion.substring(0, 50)}${producto.descripcion.length > 50 ? '...' : ''}</small>` : ''}
                    </td>
                    <td>${producto.categoria_nombre || 'Sin categoría'}</td>
                    <td>$${parseFloat(producto.precio).toFixed(2)}</td>
                    <td>
                        <span class="${producto.stock < 10 ? 'stock-low' : 'stock-ok'}">
                            ${producto.stock}
                            ${producto.stock < 10 ? ' <i class="fas fa-exclamation-triangle"></i>' : ''}
                        </span>
                    </td>
                    <td>${producto.proveedor_nombre || 'Sin proveedor'}</td>
                    <td>
                        <span class="status-badge ${producto.estado === 'activo' ? 'activo' : 'inactivo'}">
                            ${producto.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>
                        ${producto.imagen 
                            ? `<img src="${producto.imagen}" alt="${producto.nombre}" class="img-thumb">` 
                            : '<span style="color:#bcc9c6;">Sin imagen</span>'}
                    </td>
                    <td>
                        <div class="actions-group">
                            <button class="action-btn btn-view" onclick="viewProduct(${producto.id})" title="Ver">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn btn-edit" onclick="editProduct(${producto.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn btn-delete" onclick="deleteProduct(${producto.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        }

        // Actualizar información de la tabla
        function updateTableInfo() {
            const total = productos.length;
            const filtered = filteredProductos.length;
            const info = filtered === total ? 
                `${total} producto${total !== 1 ? 's' : ''}` :
                `${filtered} de ${total} producto${total !== 1 ? 's' : ''}`;
            document.getElementById('tableInfo').textContent = info;
        }

        // Filtros
        function applyFilters() {
            const search = document.getElementById('searchInput').value.toLowerCase();
            const category = document.getElementById('categoryFilter').value;
            const status = document.getElementById('statusFilter').value;

            filteredProductos = productos.filter(producto => {
                const matchesSearch = !search || 
                    producto.nombre.toLowerCase().includes(search) ||
                    (producto.descripcion && producto.descripcion.toLowerCase().includes(search));
                
                const matchesCategory = !category || producto.categoria_id == category;
                const matchesStatus = !status || producto.estado === status;

                return matchesSearch && matchesCategory && matchesStatus;
            });

            renderTable();
            updateTableInfo();
        }

        function clearFilters() {
            document.getElementById('searchInput').value = '';
            document.getElementById('categoryFilter').value = '';
            document.getElementById('statusFilter').value = '';
            filteredProductos = [...productos];
            renderTable();
            updateTableInfo();
        }

        // Event listeners para filtros en tiempo real
        document.getElementById('searchInput').addEventListener('input', applyFilters);
        document.getElementById('categoryFilter').addEventListener('change', applyFilters);
        document.getElementById('statusFilter').addEventListener('change', applyFilters);

        // Modal
        function openModal(producto = null) {
            const modal = document.getElementById('productModal');
            const form = document.getElementById('productForm');
            const title = document.getElementById('modalTitle');

            if (producto) {
                title.textContent = 'Editar Producto';
                fillForm(producto);
            } else {
                title.textContent = 'Nuevo Producto';
                form.reset();
                document.getElementById('productId').value = '';
            }

            modal.classList.add('show');
        }

        function closeModal() {
            document.getElementById('productModal').classList.remove('show');
        }

        function fillForm(producto) {
            document.getElementById('productId').value = producto.id;
            document.getElementById('nombre').value = producto.nombre;
            document.getElementById('descripcion').value = producto.descripcion || '';
            document.getElementById('precio').value = producto.precio;
            document.getElementById('stock').value = producto.stock;
            document.getElementById('categoria_id').value = producto.categoria_id || '';
            document.getElementById('proveedor_id').value = producto.proveedor_id || '';
            document.getElementById('imagen').value = producto.imagen || '';
            document.getElementById('estado').value = producto.estado;
        }

        // CRUD Operations
        async function saveProduct(productData) {
            try {
                const productId = document.getElementById('productId').value;
                const isEdit = Boolean(productId);
                
                const url = isEdit ? 
                    `${API_BASE_URL}/productos/${productId}` : 
                    `${API_BASE_URL}/productos`;
                
                const method = isEdit ? 'PUT' : 'POST';
                
                const response = await fetchWithAuth(url, {
                    method,
                    body: JSON.stringify(productData)
                });

                const data = await response.json();
                
                if (data.success) {
                    showSuccess(data.message);
                    closeModal();
                    await loadProductos();
                } else {
                    showError(data.message || 'Error guardando producto');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Error de conexión');
            }
        }

        function editProduct(id) {
            const producto = productos.find(p => p.id === id);
            if (producto) {
                openModal(producto);
            }
        }

        function viewProduct(id) {
            const producto = productos.find(p => p.id === id);
            if (producto) {
                alert(`Producto: ${producto.nombre}\nPrecio: $${producto.precio}\nStock: ${producto.stock}\nEstado: ${producto.estado}`);
            }
        }

        async function deleteProduct(id) {
            if (!confirm('¿Estás seguro de eliminar este producto?')) return;

            try {
                const response = await fetchWithAuth(`${API_BASE_URL}/productos/${id}`, {
                    method: 'DELETE'
                });

                const data = await response.json();
                
                if (data.success) {
                    showSuccess(data.message);
                    await loadProductos();
                } else {
                    showError(data.message || 'Error eliminando producto');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Error de conexión');
            }
        }

        // Form submit
        document.getElementById('productForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const productData = {};
            
            for (let [key, value] of formData.entries()) {
                if (value.trim() !== '') {
                    if (key === 'precio' || key === 'stock') {
                        productData[key] = parseFloat(value) || 0;
                    } else if (key === 'categoria_id' || key === 'proveedor_id') {
                        productData[key] = value ? parseInt(value) : null;
                    } else {
                        productData[key] = value;
                    }
                }
            }
            
            await saveProduct(productData);
        });

        // Utility functions
        function showSuccess(message) {
            // Crear notificación temporal
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
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        function showError(message) {
            // Crear notificación temporal
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
            
            setTimeout(() => {
                notification.remove();
            }, 4000);
        }

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
        document.getElementById('productModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                closeModal();
            }
        });

        // Agregar estilos para las animaciones
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