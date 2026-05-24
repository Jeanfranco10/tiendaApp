// =============================================
// DASHBOARD.JS - Panel principal
// =============================================

const API_BASE_URL = 'https://tiendaapp-backend.onrender.com/api';

// Al cargar la página, verifica sesión y carga datos
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Verificar que el token sea válido con el backend
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            throw new Error('Token inválido');
        }

        // Mostrar nombre del usuario en sidebar y topbar
        const nombre = user.nombre || user.username || 'Usuario';
        document.getElementById('userName').textContent = nombre;
        document.getElementById('userNameTop').textContent = nombre;

        // Mostrar email del usuario en sidebar
        if (user.email) {
            document.getElementById('userEmail').textContent = user.email;
        }

        // Cargar estadísticas desde el backend
        await loadStats();

    } catch (error) {
        console.error('Error verificando token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
});

        // Función para hacer peticiones autenticadas
        async function fetchWithAuth(url, options = {}) {
            const token = localStorage.getItem('token');
            const defaultOptions = {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };

            return fetch(url, { ...options, ...defaultOptions });
        }

        // Cargar estadísticas
        async function loadStats() {
            try {
                // Cargar estadísticas de cada módulo
                const [productos, categorias, proveedores,clientes,ventas] = await Promise.all([
                    fetchWithAuth(`${API_BASE_URL}/productos`).then(r => r.json()),
                    fetchWithAuth(`${API_BASE_URL}/categorias`).then(r => r.json()),
                    fetchWithAuth(`${API_BASE_URL}/proveedores`).then(r => r.json()),
                    fetchWithAuth(`${API_BASE_URL}/clientes`).then(r => r.json()),
                    fetchWithAuth(`${API_BASE_URL}/ventas`).then(r => r.json())
                ]);

                // Actualizar contadores en las tarjetas
                document.getElementById('totalProductos').textContent = productos.data?.length || 0;
                document.getElementById('totalCategorias').textContent = categorias.data?.length || 0;
                document.getElementById('totalProveedores').textContent = proveedores.data?.length || 0;
                document.getElementById('totalClientes').textContent = clientes.data?.length || 0; // Implementar después
                document.getElementById('totalVentas').textContent = ventas.data?.length || 0; // Implementar después

                // Crear resumen en la sección de estadísticas
                const statsGrid = document.getElementById('statsGrid');
                const totalStock = productos.data?.reduce((sum, p) => sum + (p.stock || 0), 0) || 0;
                const productosActivos = productos.data?.filter(p => p.estado === 'activo').length || 0;
                const categoriasActivas = categorias.data?.filter(c => c.estado === 'activo').length || 0;
                const proveedoresActivos = proveedores.data?.filter(p => p.estado === 'activo').length || 0;
                const clientesActivos = clientes.data?.filter(c => c.estado === 'activo').length || 0;
                const ventasMes=ventas.data?.reduce((sum,v)=>{
                    const fecha=new Date(v.fecha_venta);
                    const hoy=new Date();
                    const total = parseFloat(v.total) || 0;
                    return (fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()) 
                    ? sum + total 
                    : sum;
                },0) || 0;

                statsGrid.innerHTML = `
                    <div class="stat-item">
                        <span class="stat-value">${productos.data?.length || 0}</span>
                        <span class="stat-label">Total Productos</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${productosActivos}</span>
                        <span class="stat-label">Productos Activos</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${totalStock}</span>
                        <span class="stat-label">Stock Total</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${categoriasActivas}</span>
                        <span class="stat-label">Categorías Activas</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${proveedoresActivos}</span>
                        <span class="stat-label">Proveedores Activos</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${clientesActivos}</span>
                        <span class="stat-label">Clientes Activos</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">S/.${ventasMes.toFixed(2)}</span>
                        <span class="stat-label">Ventas del Mes</span>
                    </div>
                `;

            } catch (error) {
                console.error('Error cargando estadísticas:', error);
                document.getElementById('statsGrid').innerHTML = `
                    <div style="text-align: center; color: #666; grid-column: 1 / -1;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error cargando estadísticas</p>
                    </div>
                `;
            }
        }

        // Navegación a diferentes secciones
        function navigateTo(section) {
            if (section === 'dashboard') return; // Ya estamos en dashboard
            window.location.href = `pages/${section}.html`;
        }

        // Toggle sidebar en móvil
        function toggleSidebar() {
            document.querySelector('.sidebar').classList.toggle('show-mobile');
            document.querySelector('.sidebar-overlay')?.classList.toggle('show');
        }

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            }
        });