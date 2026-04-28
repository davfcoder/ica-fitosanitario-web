CREATE DATABASE IF NOT EXISTS ica_fitosanitario;
USE ica_fitosanitario;

-- 1. TABLA ROLES
CREATE TABLE Roles (
    id_rol INT PRIMARY KEY AUTO_INCREMENT,
    nom_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(200) NOT NULL
);

-- 2. TABLA USUARIOS
CREATE TABLE Usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    num_identificacion BIGINT NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo_electronico VARCHAR(100) NOT NULL UNIQUE,
    contrasenia VARCHAR(255) NOT NULL,
    nro_registro_ica VARCHAR(50) NULL,
    tarjeta_profesional VARCHAR(50) NULL,
    id_rol INT NOT NULL,
    FOREIGN KEY (id_rol) REFERENCES Roles(id_rol)
);

-- 3. TABLA LUGAR DE PRODUCCION
CREATE TABLE LugarProduccion (
    id_lugar_produccion INT PRIMARY KEY AUTO_INCREMENT,
    nom_lugar_produccion VARCHAR(150) NOT NULL,
    nro_registro_ica VARCHAR(50) NOT NULL,
    id_usuario_productor INT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    observaciones_admin TEXT NULL,
    fec_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fec_aprobacion TIMESTAMP NULL,
    FOREIGN KEY (id_usuario_productor) REFERENCES Usuarios(id_usuario)
);

-- 4. TABLA PREDIO
CREATE TABLE Predio (
    id_predio INT PRIMARY KEY AUTO_INCREMENT,
    num_predial VARCHAR(50) NOT NULL UNIQUE,
    nro_registro_ica VARCHAR(50) NULL,
    nom_predio VARCHAR(150) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    cx VARCHAR(50) NOT NULL,
    cy VARCHAR(50) NOT NULL,
    area_total DOUBLE NOT NULL,
    id_propietario INT NOT NULL,
    cod_dane_dpto VARCHAR(10) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    cod_dane_municipio VARCHAR(10) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    cod_dane_vereda VARCHAR(10) NOT NULL,
    vereda VARCHAR(100) NOT NULL,
    id_lugar_produccion INT,
    FOREIGN KEY (id_propietario) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_lugar_produccion) REFERENCES LugarProduccion(id_lugar_produccion)
);

-- 5. TABLA ESPECIE VEGETAL
CREATE TABLE EspecieVegetal (
    id_especie INT PRIMARY KEY AUTO_INCREMENT,
    nom_especie VARCHAR(100) NOT NULL,
    nom_comun VARCHAR(100) NOT NULL,
    ciclo_cultivo VARCHAR(50) NOT NULL
);

-- 6. TABLA LUGAR_ESPECIE (Puente)
CREATE TABLE LugarEspecie (
    id_lugar_produccion INT NOT NULL,
    id_especie INT NOT NULL,
    area_dest_cultivo DOUBLE NOT NULL,
    capacidad_produccion_max DOUBLE NOT NULL,
    PRIMARY KEY (id_lugar_produccion, id_especie),
    FOREIGN KEY (id_lugar_produccion) REFERENCES LugarProduccion(id_lugar_produccion),
    FOREIGN KEY (id_especie) REFERENCES EspecieVegetal(id_especie)
);

-- 7. TABLA VARIEDAD ESPECIE
CREATE TABLE VariedadEspecie (
    id_variedad INT PRIMARY KEY AUTO_INCREMENT,
    nom_variedad VARCHAR(100) NOT NULL,
    id_especie INT NOT NULL,
    FOREIGN KEY (id_especie) REFERENCES EspecieVegetal(id_especie)
);

-- 8. TABLA LOTE
CREATE TABLE Lote (
    id_lote INT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(50) NOT NULL,
    area_total DOUBLE NOT NULL,
    fec_siembra DATE NULL,
    fec_eliminacion DATE NULL,
    id_variedad INT NOT NULL,
    id_lugar_produccion INT NOT NULL,
    FOREIGN KEY (id_variedad) REFERENCES VariedadEspecie(id_variedad),
    FOREIGN KEY (id_lugar_produccion) REFERENCES LugarProduccion(id_lugar_produccion)
);

-- 9. TABLA PLAGA
CREATE TABLE Plaga (
    id_plaga INT PRIMARY KEY AUTO_INCREMENT,
    nom_especie VARCHAR(100) NOT NULL,
    nombre_comun VARCHAR(100) NOT NULL
);

-- 10. TABLA ESPECIE_PLAGA (Puente)
CREATE TABLE EspeciePlaga (
    id_especie INT NOT NULL,
    id_plaga INT NOT NULL,
    PRIMARY KEY (id_especie, id_plaga),
    FOREIGN KEY (id_especie) REFERENCES EspecieVegetal(id_especie),
    FOREIGN KEY (id_plaga) REFERENCES Plaga(id_plaga)
);

-- 11. TABLA SOLICITUD INSPECCION
CREATE TABLE SolicitudInspeccion (
    id_solicitud INT PRIMARY KEY AUTO_INCREMENT,
    id_lugar_produccion INT NOT NULL,
    id_usuario_solicitante INT NOT NULL,
    id_asistente_asignado INT NULL,
    motivo VARCHAR(50) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fec_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fec_programada DATE NULL,
    fec_completada TIMESTAMP NULL,
    FOREIGN KEY (id_lugar_produccion) REFERENCES LugarProduccion(id_lugar_produccion),
    FOREIGN KEY (id_usuario_solicitante) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_asistente_asignado) REFERENCES Usuarios(id_usuario)
);

-- ==========================================
-- DATOS INICIALES (SEMILLAS)
-- ==========================================
INSERT INTO Roles (nom_rol, descripcion) VALUES 
('Administrador ICA', 'Gestión general y aprobaciones'),
('Productor', 'Dueño de lugares de producción'),
('Asistente Técnico', 'Encargado de inspecciones en campo'),
('Propietario', 'No tiene interfaz, se crea para hacerlo responsable de predios');

-- Contraseña por defecto: admin123 (encriptada con bcrypt)
INSERT INTO Usuarios (num_identificacion, nombres, apellidos, direccion, telefono, correo_electronico, contrasenia, id_rol) 
VALUES 
(123456789, 'Admin', 'Principal', 'Sede Central ICA', '3000000000', 'admin@ica.gov.co', '$2a$10$h4/Ax79v5DleczAbm6AZbOIBdHzCHwQCkzGqx7yLCPPC2Edsdj7vq', 1);