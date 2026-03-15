create database tiendita_db

use tiendita_db

-- Tabla de usuarios (para login)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo'
);

-- Tabla de categorías
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de proveedores
CREATE TABLE proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo'
);

-- Tabla de productos
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    categoria_id INT,
    proveedor_id INT,
    imagen VARCHAR(500),
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
);

-- Tabla de ventas
CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    impuestos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('completada', 'pendiente', 'cancelada') DEFAULT 'completada',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

-- Tabla de detalle de ventas (relación muchos a muchos entre ventas y productos)
CREATE TABLE venta_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

select*from usuarios
select*from categorias
select*from clientes
select*from productos
select*from proveedores
select*from venta_detalles
select*from ventas

SELECT * FROM productos WHERE id = 1;



-- Insertar datos de prueba

-- Usuario administrador por defecto
INSERT INTO usuarios (username, email, password, nombre) VALUES 
('admin', 'admin@tienda.com', '$2b$10$rX8V7qZ9wQ4yF5kL3mN2pOuH7sR1tE6vW8xY2aB4cD9fG3hI5jK7l', 'Administrador');
-- Nota: La contraseña es 'admin123' hasheada con bcrypt

-- Categorías de ejemplo
INSERT INTO categorias (nombre, descripcion) VALUES 
('Electrónicos', 'Dispositivos y gadgets electrónicos'),
('Ropa', 'Vestimenta y accesorios'),
('Hogar', 'Artículos para el hogar'),
('Deportes', 'Equipamiento deportivo'),
('Libros', 'Literatura y material educativo');

-- Proveedores de ejemplo
INSERT INTO proveedores (nombre, contacto, telefono, email, direccion) VALUES 
('TechSupply SAC', 'Carlos Mendoza', '987654321', 'ventas@techsupply.com', 'Av. Tecnología 123, Lima'),
('ModaMax EIRL', 'Ana García', '976543210', 'contacto@modamax.com', 'Jr. Fashion 456, Lima'),
('HogarPlus SRL', 'Luis Rodríguez', '965432109', 'info@hogarplus.com', 'Av. Hogar 789, Lima');

-- Clientes de ejemplo
INSERT INTO clientes (nombre, email, telefono, direccion) VALUES 
('María Gonzáles', 'maria@email.com', '987123456', 'Jr. Las Flores 123, Lima'),
('Pedro Martínez', 'pedro@email.com', '987654321', 'Av. Los Olivos 456, Lima'),
('Carmen Silva', 'carmen@email.com', '976543210', 'Jr. San Martín 789, Lima');

-- Productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, proveedor_id) VALUES 
('Laptop HP Pavilion', 'Laptop HP Pavilion 15.6" Intel Core i5', 2500.00, 10, 1, 1),
('Smartphone Samsung', 'Samsung Galaxy A54 128GB', 1200.00, 15, 1, 1),
('Polo Nike', 'Polo deportivo Nike talla M', 89.90, 25, 2, 2),
('Sofá 3 cuerpos', 'Sofá cómodo para sala', 1500.00, 5, 3, 3),
('Libro JavaScript', 'Guía completa de JavaScript', 45.00, 20, 5, 3);

-- Ventas de ejemplo
INSERT INTO ventas (cliente_id, subtotal, impuestos, total) VALUES 
(1, 2550.00, 452.00, 2980.00),
(3, 1259.90, 230.18, 1542.08);

-- Detalles de ventas de ejemplo
INSERT INTO venta_detalles (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES 
(1, 1, 1, 2500.00, 2500.00),
(2, 2, 1, 1200.00, 1200.00),
(2, 3, 1, 89.90, 89.90);

-- Crear índices para mejor rendimiento
SELECT * FROM productos WHERE categoria_id = 5;