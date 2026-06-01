USE ica_fitosanitario;

-- =======================================================================
-- 1. TABLA DE AUDITORÍA HISTÓRICA: SOLICITUDES DE INSPECCIÓN
-- =======================================================================
CREATE TABLE Log_Solicitudes (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    campo_modificado VARCHAR(100) NOT NULL, -- Almacena el nombre del atributo alterado
    valor_anterior TEXT NULL,                -- Estado viejo (soporta NULL, texto, fechas o IDs)
    valor_nuevo TEXT NULL,                   -- Estado nuevo
    fec_cambio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_accion VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_solicitud) REFERENCES SolicitudInspeccion(id_solicitud) ON DELETE CASCADE
);


-- =======================================================================
-- 2. TABLA DE AUDITORÍA HISTÓRICA: LUGARES DE PRODUCCIÓN
-- =======================================================================
CREATE TABLE Log_LugaresProduccion (
    id_log_lugar INT AUTO_INCREMENT PRIMARY KEY,
    id_lugar_produccion INT NOT NULL,
    campo_modificado VARCHAR(100) NOT NULL, -- Almacena el nombre del atributo alterado
    valor_anterior TEXT NULL,                -- Estado viejo
    valor_nuevo TEXT NULL,                   -- Estado nuevo
    fec_cambio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_accion VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_lugar_produccion) REFERENCES LugarProduccion(id_lugar_produccion) ON DELETE CASCADE
);


-- =======================================================================
-- 3. TRIGGER: AUDITORÍA DE ABSOLUTAMENTE TODOS LOS CAMBIOS EN SOLICITUDES
-- =======================================================================
DELIMITER $$

CREATE TRIGGER TRG_Auditoria_SolicitudInspeccion
AFTER UPDATE ON SolicitudInspeccion
FOR EACH ROW
BEGIN
    -- 1. Evaluar cambio en el Asistente Técnico Asignado
    IF NOT (OLD.id_asistente_asignado <=> NEW.id_asistente_asignado) THEN
        INSERT INTO Log_Solicitudes (id_solicitud, campo_modificado, valor_anterior, valor_nuevo, usuario_accion)
        VALUES (NEW.id_solicitud, 'id_asistente_asignado', OLD.id_asistente_asignado, NEW.id_asistente_asignado, CURRENT_USER());
    END IF;

    -- 2. Evaluar cambio en el Motivo de la Inspección
    IF NOT (OLD.motivo <=> NEW.motivo) THEN
        INSERT INTO Log_Solicitudes (id_solicitud, campo_modificado, valor_anterior, valor_nuevo, usuario_accion)
        VALUES (NEW.id_solicitud, 'motivo', OLD.motivo, NEW.motivo, CURRENT_USER());
    END IF;

    -- 3. Evaluar cambio en el Estado del Trámite
    IF NOT (OLD.estado <=> NEW.estado) THEN
        INSERT INTO Log_Solicitudes (id_solicitud, campo_modificado, valor_anterior, valor_nuevo, usuario_accion)
        VALUES (NEW.id_solicitud, 'estado', OLD.estado, NEW.estado, CURRENT_USER());
    END IF;

    -- 4. Evaluar cambio en la Fecha Programada
    IF NOT (OLD.fec_programada <=> NEW.fec_programada) THEN
        INSERT INTO Log_Solicitudes (id_solicitud, campo_modificado, valor_anterior, valor_nuevo, usuario_accion)
        VALUES (NEW.id_solicitud, 'fec_programada', OLD.fec_programada, NEW.fec_programada, CURRENT_USER());
    END IF;

    -- 5. Evaluar cambio en la Fecha de Finalización/Completado
    IF NOT (OLD.fec_completada <=> NEW.fec_completada) THEN
        INSERT INTO Log_Solicitudes (id_solicitud, campo_modificado, valor_anterior, valor_nuevo, usuario_accion)
        VALUES (NEW.id_solicitud, 'fec_completada', OLD.fec_completada, NEW.fec_completada, CURRENT_USER());
    END IF;

    -- 6. Evaluar cambios en las Observaciones del Productor
    IF NOT (OLD.observaciones_productor <=> NEW.observaciones_productor) THEN
        INSERT INTO Log_Solicitudes (id_solicitud, campo_modificado, valor_anterior, valor_nuevo, usuario_accion)
        VALUES (NEW.id_solicitud, 'observaciones_productor', OLD.observaciones_productor, NEW.observaciones_productor, CURRENT_USER());
    END IF;

    -- 7. Evaluar cambios en las Observaciones del Administrador
    IF NOT (OLD.observaciones_admin <=> NEW.observaciones_admin) THEN
        INSERT INTO Log_Solicitudes (id_solicitud, campo_modificado, valor_anterior, valor_nuevo, usuario_accion)
        VALUES (NEW.id_solicitud, 'observaciones_admin', OLD.observaciones_admin, NEW.observaciones_admin, CURRENT_USER());
    END IF;

    -- 8. Evaluar cambios en las Observaciones de Campo del Asistente Técnico
    IF NOT (OLD.observaciones_asistente <=> NEW.observaciones_asistente) THEN
        INSERT INTO Log_Solicitudes (id_solicitud, campo_modificado, valor_anterior, valor_nuevo, usuario_accion)
        VALUES (NEW.id_solicitud, 'observaciones_asistente', OLD.observaciones_asistente, NEW.observaciones_asistente, CURRENT_USER());
    END IF;
END$$


-- =======================================================================
-- 4. TRIGGER: AUDITORÍA DE ABSOLUTAMENTE TODOS LOS CAMBIOS EN LUGARES
-- =======================================================================
CREATE TRIGGER TRG_Auditoria_LugarProduccion
AFTER UPDATE ON LugarProduccion
FOR EACH ROW
BEGIN
    -- 1. Evaluar cambio en el Nombre Comercial del Lugar
    IF NOT (OLD.nom_lugar_produccion <=> NEW.nom_lugar_produccion) THEN
        INSERT INTO Log_LugaresProduccion (id_lugar_produccion, campo_modificado, valor_anterior, valor_nuevo, usuario_accion)
        VALUES (NEW.id_lugar_produccion, 'nom_lugar_produccion', OLD.nom_lugar_produccion, NEW.nom_lugar_produccion, CURRENT_USER());
    END IF;

    -- 2. Evaluar cambio o asignación del Número de Registro ICA
    IF NOT (OLD.nro_registro_ica <=> NEW.nro_registro_ica) THEN
        INSERT INTO Log_LugaresProduccion (id_lugar_produccion, campo_modificado, valor_anterior, valor_nuevo, usuario_accion)
        VALUES (NEW.id_lugar_produccion, 'nro_registro_ica', OLD.nro_registro_ica, NEW.nro_registro_ica, CURRENT_USER());
    END IF;

    -- 3. Evaluar cambio en el Estado de la Solicitud
    IF NOT (OLD.estado <=> NEW.estado) THEN
        INSERT INTO Log_LugaresProduccion (id_lugar_produccion, campo_modificado, valor_anterior, valor_nuevo, usuario_accion)
        VALUES (NEW.id_lugar_produccion, 'estado', OLD.estado, NEW.estado, CURRENT_USER());
    END IF;

    -- 4. Evaluar modificaciones en las Observaciones Administrativas
    IF NOT (OLD.observaciones_admin <=> NEW.observaciones_admin) THEN
        INSERT INTO Log_LugaresProduccion (id_lugar_produccion, campo_modificado, valor_anterior, valor_nuevo, usuario_accion)
        VALUES (NEW.id_lugar_produccion, 'observaciones_admin', OLD.observaciones_admin, NEW.observaciones_admin, CURRENT_USER());
    END IF;

    -- 5. Evaluar alteraciones en la Fecha de Aprobación Oficial
    IF NOT (OLD.fec_aprobacion <=> NEW.fec_aprobacion) THEN
        INSERT INTO Log_LugaresProduccion (id_lugar_produccion, campo_modificado, valor_anterior, valor_nuevo, usuario_accion)
        VALUES (NEW.id_lugar_produccion, 'fec_aprobacion', OLD.fec_aprobacion, NEW.fec_aprobacion, CURRENT_USER());
    END IF;
END$$

DELIMITER ;