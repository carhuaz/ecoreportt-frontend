# EcoReport Huancayo

Sistema web de reportes ambientales para la Municipalidad de Huancayo. Permite a ciudadanos reportar problemas ambientales (acumulación de basura, desmonte, residuos orgánicos, etc.), a validadores evaluar y aprobar/rechazar reportes, a responsables de cuadrilla gestionar la atención en campo, y a administradores supervisar todo el flujo.

---

## Tabla de Contenidos

- [Tecnologías](#tecnologías)
- [Arquitectura General](#arquitectura-general)
- [Backend](#backend)
  - [Estructura](#estructura-del-backend)
  - [Base de Datos (SQL Server)](#base-de-datos)
  - [API REST (FastAPI)](#api-rest)
  - [Autenticación y Roles](#autenticación-y-roles)
  - [Esquemas Pydantic](#esquemas-pydantic)
  - [Endpoints por Router](#endpoints-por-router)
- [Frontend](#frontend)
  - [Estructura](#estructura-del-frontend)
  - [Componentes por Página](#páginas)
  - [Componentes Compartidos](#componentes-compartidos)
  - [Servicios](#servicios)
  - [Modelos](#modelos)
  - [Guardias de Rutas](#guardias-de-rutas)
  - [Interceptor HTTP](#interceptor-http)
- [Flujo Completo del Reporte](#flujo-completo-del-reporte)
- [Roles del Sistema](#roles-del-sistema)
- [Instalación y Configuración](#instalación-y-configuración)
- [Datos de Prueba (Seed)](#datos-de-prueba)
- [Despliegue](#despliegue)

---

## Tecnologías

### Backend

| Tecnología | Versión | Propósito |
|---|---|---|
| Python | 3.11+ | Lenguaje de programación |
| FastAPI | 0.115.0 | Framework web REST API (asíncrono) |
| Uvicorn | 0.31.0 | Servidor ASGI para desarrollo |
| Gunicorn | 23.0.0 | Servidor ASGI/WSGI para producción (Linux) |
| Microsoft SQL Server | 2019+ | Base de datos relacional |
| pyodbc | (implícito) | Driver SQL Server para Windows |
| pymssql | 2.3.2 | Driver SQL Server para Linux |
| SQLAlchemy | — | No usado; SQL directo con fetch_all/fetch_one/execute |
| python-jose | 3.3.0 | JWT (JSON Web Tokens) para autenticación |
| passlib[bcrypt] | 1.7.4 | Hashing de contraseñas con bcrypt |
| python-dotenv | 1.0.1 | Variables de entorno desde `.env` |

### Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| Angular | 18.2 | Framework SPA (standalone components) |
| TypeScript | 5.5.2 | Lenguaje de programación |
| Angular CLI | 18.2 | Herramienta de build y desarrollo |
| Leaflet | 1.9.4 | Mapas interactivos open-source |
| Bootstrap Icons | 1.11.3 | Set de íconos (vía CDN) |
| RxJS | 7.8 | Programación reactiva para HTTP y eventos |
| HTML5 + CSS3 | — | Maquetación y estilos |

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                     Navegador (Angular 18.2)                     │
│  http://localhost:4200                                           │
│                                                                  │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │ Páginas │→ │ Servicios│→ │ Modelos  │  │  Guardias/Rutas │ │
│  │ (17)    │  │ (4)      │  │ (4)      │  │  + Interceptor  │ │
│  └─────────┘  └────┬─────┘  └──────────┘  └─────────────────┘ │
│                    │ HTTP (Authorization: Bearer <JWT>)         │
└────────────────────┼─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              Backend (FastAPI en Python 3.11+)                   │
│  http://localhost:8000                                           │
│                                                                  │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌───────────────┐ │
│  │ Routers  │→ │ Middleware │→ │ Schemas  │  │ Config/.env   │ │
│  │ (6)      │  │ (Auth JWT) │  │ (3)      │  │ + Email Svc   │ │
│  └────┬─────┘  └────────────┘  └──────────┘  └───────────────┘ │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────┐                                                    │
│  │ Database │→ pyodbc (Win) / pymssql (Linux)                    │
│  └────┬─────┘                                                    │
└───────┼──────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│              Microsoft SQL Server (SQLEXPRESS)                    │
│                                                                  │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌────────────────┐│
│  │ usuarios │  │ cuadrillas │  │ reportes │  │historial_rep.  ││
│  └──────────┘  └────────────┘  └──────────┘  └────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Backend

### Estructura del Backend

```
backend/
├── .env                        # Variables de entorno (DB, JWT, SMTP)
├── requirements.txt            # Dependencias Python
├── startup.sh                  # Script de inicio para producción (Azure)
├── sql/
│   ├── 001_schema.sql          # Creación de tablas
│   ├── 002_seed.sql            # Datos de prueba
│   ├── 003_migracion_responsable_cuadrilla.sql  # Migración (add responsable_id)
│   └── todo_en_uno.sql         # Script completo (drop + create + seed)
└── app/
    ├── __init__.py
    ├── main.py                 # Punto de entrada FastAPI, CORS, routers
    ├── config.py               # Configuración desde .env
    ├── database.py             # Capa de BD (fetch_all, fetch_one, execute)
    ├── email_service.py        # Envío de OTP por SMTP (Gmail)
    ├── middleware/
    │   └── auth.py             # JWT, bcrypt, dependencias de roles
    ├── schemas/
    │   ├── auth.py             # Pydantic: login, register, verify
    │   ├── usuario.py          # Pydantic: cambio de rol
    │   └── reporte.py          # Pydantic: create, update, prioridad, asignación
    └── routes/
        ├── auth.py             # /api/auth/*
        ├── reportes.py         # /api/reportes/*
        ├── usuarios.py         # /api/usuarios/*
        ├── cuadrillas.py       # /api/cuadrillas/*
        ├── estadisticas.py     # /api/estadisticas/*
        └── mapa.py             # /api/mapa/*
```

### Base de Datos

**Motor:** Microsoft SQL Server (SQLEXPRESS)

**Base de datos:** `EcoReportDB`

#### Tabla: `usuarios`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT IDENTITY PK | Identificador único |
| `nombre` | NVARCHAR(100) | Nombre completo |
| `email` | NVARCHAR(150) UNIQUE | Correo electrónico (login) |
| `password` | NVARCHAR(255) | Hash bcrypt de la contraseña |
| `dni` | NVARCHAR(8) UNIQUE | Documento Nacional de Identidad |
| `rol` | NVARCHAR(25) | CHECK: `Ciudadano`, `Validador`, `Administrador`, `ResponsableCuadrilla` |
| `activo` | BIT | Usuario activo (1) o desactivado (0) |
| `codigo_verificacion` | NVARCHAR(60) | Código OTP de 6 dígitos para verificación email |
| `esta_verificado` | BIT | Email verificado (1) o pendiente (0) |
| `fecha_registro` | DATE | Fecha de registro (GETDATE por defecto) |

#### Tabla: `cuadrillas`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT IDENTITY PK | Identificador único |
| `nombre` | NVARCHAR(100) | Nombre de la cuadrilla |
| `responsable` | NVARCHAR(100) | Nombre del responsable |
| `responsable_id` | INT FK → usuarios(id) | ID del usuario ResponsableCuadrilla asignado |
| `estado` | NVARCHAR(20) | CHECK: `Disponible`, `En ruta`, `Ocupada` |
| `zona_asignada` | NVARCHAR(200) | Zona geográfica de operación |
| `distrito` | NVARCHAR(50) | Distrito (Huancayo, El Tambo, Chilca) |

#### Tabla: `reportes`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT IDENTITY PK | Identificador único |
| `titulo` | NVARCHAR(200) | Título del reporte |
| `descripcion` | NVARCHAR(MAX) | Descripción detallada |
| `distrito` | NVARCHAR(50) | Distrito donde ocurre |
| `direccion` | NVARCHAR(200) | Dirección específica |
| `estado` | NVARCHAR(20) | Flujo: Pendiente → Aprobado → Programado → En atencion → Atendido → Verificado (o Rechazado) |
| `prioridad` | NVARCHAR(20) | CHECK: `Baja`, `Media`, `Alta`, `Crítica` |
| `puntaje_prioridad` | INT | Puntaje numérico (2, 6, 9, 13) |
| `criterios_prioridad` | NVARCHAR(MAX) | JSON con criterios seleccionados |
| `prioridad_corregida` | BIT | Si el validador corrigió la prioridad |
| `observacion_prioridad` | NVARCHAR(MAX) | Observación del validador al corregir |
| `fecha` | DATE | Fecha del reporte |
| `latitud` | FLOAT | Coordenada geográfica |
| `longitud` | FLOAT | Coordenada geográfica |
| `imagenes` | NVARCHAR(MAX) | JSON array de base64 de imágenes |
| `ciudadano_id` | INT FK → usuarios(id) | Ciudadano que reportó |
| `observacion_validacion` | NVARCHAR(MAX) | Observación al aprobar/rechazar |
| `cuadrilla_id` | INT FK → cuadrillas(id) | Cuadrilla asignada |
| `anonimo` | BIT | Si el reporte es anónimo |

#### Tabla: `historial_reportes`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT IDENTITY PK | Identificador único |
| `reporte_id` | INT FK → reportes(id) | Reporte asociado |
| `fecha` | DATE | Fecha del evento |
| `accion` | NVARCHAR(100) | Acción realizada (ej: "Reporte creado", "Aprobado", "Asignado a cuadrilla", etc.) |
| `usuario` | NVARCHAR(100) | Nombre del usuario que realizó la acción |
| `observacion` | NVARCHAR(MAX) | Observación adicional |

#### Tabla: `contactos`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT IDENTITY PK | Identificador único |
| `codigo` | NVARCHAR(20) | Código de atención (ej: ECO-482719) |
| `nombre` | NVARCHAR(100) | Nombre del remitente |
| `email` | NVARCHAR(150) | Correo del remitente |
| `asunto` | NVARCHAR(100) | Motivo del contacto |
| `mensaje` | NVARCHAR(500) | Contenido del mensaje |
| `fecha` | DATETIME | Fecha y hora de envío |
| `leido` | BIT | Estado de lectura (0 = no leído) |

### API REST

**URL base:** `http://localhost:8000/api`

#### Rutas de Autenticación (`/api/auth`)

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| POST | `/login` | Público | Inicia sesión con email + password, devuelve JWT |
| POST | `/register` | Público | Registra nuevo usuario (rol Ciudadano por defecto) |
| POST | `/verify` | Público | Verifica email con código OTP de 6 dígitos |
| POST | `/reenviar-codigo` | Público | Reenvía código OTP al email |
| GET | `/me` | Autenticado | Obtiene datos del usuario actual desde el token |

#### Rutas de Reportes (`/api/reportes`)

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| GET | `/` | Autenticado | Lista paginada de reportes (filtros por estado, distrito, prioridad) |
| GET | `/publicos` | Público | Reportes públicos con filtros |
| GET | `/mis-reportes` | Ciudadano | Reportes del ciudadano autenticado |
| GET | `/cuadrilla/{id}` | ResponsableCuadrilla | Reportes asignados a una cuadrilla específica |
| GET | `/auditoria` | Administrador | Historial de validaciones (aprobaciones/rechazos) |
| GET | `/auditoria-evidencias` | Administrador | Reportes atendidos/verificados con evidencias, filtros por cuadrilla y estado, paginado |
| GET | `/{id}` | Autenticado | Detalle de un reporte con historial |
| POST | `/` | Ciudadano | Crear nuevo reporte |
| PUT | `/{id}` | Ciudadano | Editar reporte propio |
| DELETE | `/{id}` | Administrador | Eliminar reporte |
| POST | `/{id}/aprobar` | Validador | Aprobar reporte (Programado) |
| POST | `/{id}/rechazar` | Validador | Rechazar reporte |
| POST | `/{id}/corregir-prioridad` | Validador | Corregir prioridad del reporte |
| POST | `/{id}/asignar-cuadrilla` | Administrador | Asignar cuadrilla a reporte (con límite de 3 activos por cuadrilla) |
| POST | `/{id}/atender` | ResponsableCuadrilla | Marcar como "En atencion" |
| POST | `/{id}/completar` | ResponsableCuadrilla | Marcar como "Atendido" |
| POST | `/{id}/completar-con-evidencias` | ResponsableCuadrilla | Completar con imágenes de evidencia |
| POST | `/{id}/verificar` | Administrador | Verificar reporte (Atendido → Verificado) |
| POST | `/{id}/calcular-prioridad` | Ciudadano/Validador | Calcular puntaje de prioridad asistido |

#### Rutas de Cuadrillas (`/api/cuadrillas`)

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| GET | `/` | Administrador | Listar todas las cuadrillas |
| GET | `/disponibles` | Administrador | Listar cuadrillas disponibles |
| GET | `/mis-cuadrillas` | ResponsableCuadrilla | Cuadrillas del responsable autenticado |
| GET | `/{id}` | Autenticado | Detalle de cuadrilla |
| POST | `/` | Administrador | Crear cuadrilla |
| PUT | `/{id}` | Administrador | Actualizar cuadrilla |
| DELETE | `/{id}` | Administrador | Eliminar cuadrilla |
| POST | `/{id}/asignar-revision` | Administrador | Asignar reporte a cuadrilla (método legacy) |

#### Rutas de Usuarios (`/api/usuarios`)

| Método | Ruta | Roles | Descripción |
|---|---|---|---|---|
| GET | `/` | Administrador | Listar usuarios. Parámetros: `page`, `page_size` (5/10/20), `termino` (busca en nombre/email), `rol` |
| GET | `/{id}` | Administrador | Detalle de usuario por ID |
| PUT | `/{id}/rol` | Administrador | Cambiar rol de usuario |
| PUT | `/{id}/activar` | Administrador | Activar usuario |
| PUT | `/{id}/desactivar` | Administrador | Desactivar usuario |

#### Rutas de Estadísticas (`/api/estadisticas`)

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| GET | `/resumen` | Administrador | Resumen: totales por estado, distrito, prioridad |
| GET | `/por-estado` | Administrador | Reportes agrupados por estado |
| GET | `/por-distrito` | Administrador | Reportes agrupados por distrito |
| GET | `/por-prioridad` | Administrador | Reportes agrupados por prioridad |
| GET | `/cuadrillas-resumen` | Administrador | Resumen de cuadrillas con conteos |

#### Rutas de Contacto (`/api/contacto`)

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| POST | `/` | Público | Enviar mensaje de contacto. Guarda en DB, envía acuse al remitente y notificación al administrador |

#### Rutas de Mapa (`/api/mapa`)

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| GET | `/reportes` | Público | Todos los reportes geolocalizados (no rechazados) |

### Autenticación y Roles

**Esquema:** JWT (JSON Web Token) con Bearer token en header `Authorization`.

- **Creación del token:** `create_access_token(data)` en `middleware/auth.py` — genera JWT con claims `id`, `rol` y expiración de 480 minutos (8 horas).
- **Hash de contraseñas:** bcrypt mediante `passlib`.
- **Dependencias FastAPI:**
  - `get_current_user_role`: Extrae `{id, rol}` del token.
  - `require_roles(*roles)`: Restringe endpoint a roles específicos; devuelve 403 si no autorizado.

#### Roles disponibles:

| Rol | Descripción |
|---|---|
| `Ciudadano` | Reporta problemas ambientales, ve sus reportes |
| `Validador` | Aprueba/rechaza reportes, corrige prioridades |
| `Administrador` | Gestiona usuarios, cuadrillas, estadísticas, auditoría |
| `ResponsableCuadrilla` | Gestiona cuadrillas asignadas, atiende reportes en campo |

### Esquemas Pydantic

**`schemas/auth.py`:**
- `LoginRequest`: email, password
- `RegisterRequest`: nombre, email, password, dni
- `AuthResponse`: id, nombre, email, rol, activo, token
- `UsuarioResponse`: id, nombre, email, rol, activo, fecha_registro
- `VerifyRequest`: email, codigo

**`schemas/usuario.py`:**
- `CambiarRolRequest`: rol

**`schemas/reporte.py`:**
- `ReporteCreate`: titulo, descripcion, distrito, direccion, latitud, longitud, imagenes, prioridad, puntaje_prioridad, criterios_prioridad, anonimo
- `ReporteUpdate`: todos opcionales para edición
- `PrioridadRequest`: prioridad, observacion
- `AsignarCuadrillaRequest`: cuadrilla_id
- `ValidacionRequest`: observacion
- `CompletarRequest`: evidencias (lista de strings), observacion

---

## Frontend

### Estructura del Frontend

```
src/
├── index.html                  # Entry point HTML (con Bootstrap Icons CDN)
├── main.ts                     # Bootstrap de Angular standalone
├── styles.css                  # Estilos globales (460 líneas)
└── app/
    ├── app.component.ts        # Componente raíz (navbar + router-outlet + footer)
    ├── app.component.html
    ├── app.component.css
    ├── app.config.ts           # Configuración de providers (router, http, auth init)
    ├── app.routes.ts           # Definición de rutas con lazy loading y guards
    ├── guards/
    │   └── role.guard.ts       # Verifica autenticación + rol requerido
    ├── interceptors/
    │   └── auth.interceptor.ts # Interceptor HTTP: agrega Bearer token a cada request
    ├── models/
    │   ├── usuario.model.ts    # Tipo RolUsuario, interface Usuario
    │   ├── reporte.model.ts    # Estados, prioridades, distritos, interface Reporte
    │   ├── cuadrilla.model.ts  # Interface Cuadrilla
    │   └── paginacion.model.ts # Interface Paginacion<T>
    ├── services/
    │   ├── auth.service.ts     # Login, registro, verificación, sesión
    │   ├── reporte.service.ts  # CRUD reportes, acciones, estadísticas
    │   ├── cuadrilla.service.ts# CRUD cuadrillas, mis-cuadrillas
    │   └── usuario.service.ts  # CRUD usuarios, roles
    ├── shared/
    │   ├── navbar/             # Barra de navegación con menú por rol
    │   ├── footer/             # Footer con enlaces y redes sociales
    │   ├── badge-estado/       # Badge de color según estado del reporte/cuadrilla
    │   ├── card-reporte/       # Tarjeta de reporte reutilizable
    │   ├── eco-map/            # Componente de mapa Leaflet interactivo
    │   ├── image-uploader/     # Subida de imágenes (base64) con previsualización
    │   └── modal-confirmacion/ # Modal de confirmación genérico
    └── pages/
        ├── home/               # Landing page
        ├── login/              # Inicio de sesión
        ├── register/           # Registro de usuario
        ├── verify/             # Verificación de email (OTP)
        ├── dashboard/          # Dashboard con KPIs y mapa
        ├── reportar/           # Crear nuevo reporte
        ├── mis-reportes/       # Reportes del ciudadano
        ├── reportes-publicos/  # Reportes públicos con filtros
        ├── mapa-ambiental/     # Mapa interactivo de reportes
        ├── validacion/         # Panel de validador (aprobar/rechazar)
        ├── cuadrillas/         # Gestión de cuadrillas (Admin)
        ├── mis-cuadrillas/     # Panel del responsable de cuadrilla
        ├── admin-usuarios/     # Gestión de usuarios (Admin)
        ├── admin-auditoria/    # Auditoría de validaciones (Admin)
        ├── estadisticas/       # Estadísticas visuales (Admin)
        ├── contacto/           # Página de contacto
        └── acceso-denegado/    # Página 403
```

### Páginas

#### 1. Home (`/`)
Landing page pública con:
- Hero section con título "EcoReport Huancayo" y botones CTA
- Sección "El Problema" (4 cards: acumulación de basura, malos olores/inseguridad, contaminación del río, falta de comunicación)
- Sección "La Solución" (3 pasos: Ciudadano reporta → Municipalidad valida → Cuadrilla atiende)
- Sección "Impacto Social" (3 cards: participación ciudadana, limpieza urbana, decisiones basadas en datos)

#### 2. Login (`/login`)
- Formulario de inicio de sesión (email + password)
- Muestra credenciales de demostración
- Detecta si el usuario no ha verificado su email y redirige a `/verify`

#### 3. Register (`/registro`)
- Formulario de registro (nombre, email, DNI de 8 dígitos, password, confirmar password)
- Validaciones en cliente (DNI numérico 8 dígitos, password ≥ 6 caracteres, passwords coinciden)
- Redirige a `/verify` tras registro exitoso

#### 4. Verify (`/verify`)
- Toma el email de los parámetros de ruta
- Input de 6 dígitos con autoenvío al completar
- Botón para reenviar código
- Redirige a `/login` tras verificación exitosa

#### 5. Dashboard (`/dashboard`) — Roles: Ciudadano, Administrador
- KPIs (Total, Pendientes, Programados, Atendidos, Críticos)
- Mapa Leaflet con ubicación de reportes
- Lista paginada de reportes recientes

#### 6. Reportar (`/reportar`) — Rol: Ciudadano
- Formulario completo: título, descripción, distrito (select), dirección
- Selector visual de prioridad con 4 niveles (Baja/Media/Alta/Crítica) y ejemplos
- Mapa Leaflet para seleccionar ubicación (con botón "Usar mi ubicación")
- Subida de imágenes (máx. 3, formato JPG/PNG/WEBP, máx. 2MB c/u)
- Checkbox de reporte anónimo

#### 7. Mis Reportes (`/mis-reportes`) — Rol: Ciudadano
- Lista paginada de reportes del ciudadano autenticado
- Estado vacío con CTA para crear primer reporte

#### 8. Reportes Públicos (`/reportes-publicos`)
- Hero con CTA para registrarse
- Filtros por distrito y estado
- Grid paginado de tarjetas de reporte con imagen, badge de prioridad, estado, metadata

#### 9. Mapa Ambiental (`/mapa-ambiental`)
- Mapa Leaflet a pantalla completa con markers de todos los reportes geolocalizados
- Leyenda de colores: aprobado (azul), proceso (amarillo), resuelto (verde)
- Sidebar con detalle del reporte seleccionado (estado, título, descripción, metadata)

#### 10. Validación (`/validacion`) — Rol: Validador
- Tabla de reportes pendientes con paginación
- Modal de detalle con: imágenes, mapa, metadata, criterios de prioridad, historial
- Botones: aprobar (con observación opcional), rechazar (con observación requerida cuando prioridad ≥ Alta)
- Sección "Decisiones realizadas" con historial de acciones del validador

#### 11. Gestión de Cuadrillas (`/cuadrillas`) — Rol: Administrador
- Tabla de reportes aprobados sin cuadrilla asignada (con selector de cuadrilla por fila)
- Tabla de cuadrillas registradas con acciones (editar/eliminar)
- Modal para crear/editar cuadrilla (nombre, responsable, responsable_id, zona, distrito)

#### 12. Mis Cuadrillas (`/mis-cuadrillas`) — Rol: ResponsableCuadrilla
- Tabs para cambiar entre cuadrillas asignadas
- Tarjeta informativa de la cuadrilla actual
- Tabla de reportes activos (Programado, En atencion) con botón "Atender"
- Tabla de reportes completados (Atendido, Verificado)
- Modal para completar con evidencias (subida de imágenes + observación)

#### 13. Admin Usuarios (`/admin/usuarios`) — Rol: Administrador
- Filtros por nombre, email, rol
- Tabla de usuarios con acciones: cambiar rol (modal), activar/desactivar
- Confirmación especial al asignar rol Administrador
- Validación: no puede cambiar su propio rol ni desactivarse a sí mismo

#### 14. Admin Auditoría (`/admin/auditoria`) — Rol: Administrador
- Tabla con reportes atendidos/verificados y sus evidencias
- Columnas: Reporte, Cuadrilla, Distrito, Estado, Evidencias, Fecha
- Modal de detalle con galería de imágenes, observación de completado y datos del reporte
- Filtros por cuadrilla y estado (Atendido/Verificado)
- Paginación completa (5, 10, 20 por página)

#### 15. Estadísticas (`/estadisticas`) — Rol: Administrador
- Tarjeta de total de reportes
- Barras horizontales con porcentaje por estado (Pendiente, Aprobado, Programado, etc.)
- Cards de resumen por estado con conteos

#### 16. Contacto (`/contacto`)
- Columna izquierda: información de contacto (email, teléfono, horario)
- Columna derecha: formulario de contacto con almacenamiento en localStorage

#### 17. Acceso Denegado (`/acceso-denegado`)
- Página estática con mensaje y botones para volver al dashboard o al login

### Componentes Compartidos

#### Navbar (`shared/navbar/`)
- Navbar fijo con menú contextual según rol del usuario:
  - **No autenticado:** Inicio, Ingresar, Registrarse
  - **Ciudadano:** Dashboard, Reportar, Mis reportes
  - **Validador:** Validar reportes
  - **ResponsableCuadrilla:** Mis cuadrillas
  - **Administrador:** Dashboard, Gestión de usuarios, Gestión de cuadrillas, Estadísticas, Auditoría
- Menú responsive con hamburguesa a 980px
- Badge del rol del usuario, nombre y botón de cerrar sesión

#### Footer (`shared/footer/`)
- Tres columnas: marca/descripción, enlaces rápidos, redes sociales + contacto
- Año actual dinámico

#### Badge Estado (`shared/badge-estado/`)
- Componente inline que renderiza un badge de color según el estado:
  - Pendiente → rojo, Aprobado → azul, Programado → amarillo, En atencion → amarillo
  - Atendido → verde, Verificado → verde oscuro, Rechazado → gris
  - Crítica → púrpura, Disponible → verde, En ruta → azul, Ocupada → rojo

#### Card Reporte (`shared/card-reporte/`)
- Tarjeta reutilizable para mostrar reportes: imagen con overlay de prioridad, título, estado, descripción, metadata (distrito, fecha, ciudadano)

#### Eco Map (`shared/eco-map/`)
- Componente Leaflet completo:
  - Inputs: `reportes[]`, `seleccionable` (modo selección de ubicación), `latitud`/`longitud`, `altura`
  - Outputs: `ubicacionChange` (click en mapa), `reporteSeleccionado`
  - Markers de colores por estado del reporte
  - Toolbar con botón de geolocalización
  - Auto-fit bounds para mostrar todos los markers
  - Popups con información del reporte al hacer clic

#### Image Uploader (`shared/image-uploader/`)
- Subida de imágenes con drag & drop o input file
- Validación: solo JPG/JPEG/PNG/WEBP, máx. 2MB, máx. 3 archivos
- Conversión a base64 data URLs
- Previsualización con botón de eliminar

#### Modal Confirmación (`shared/modal-confirmacion/`)
- Modal genérico: título, mensaje, botones de confirmar/cancelar
- Variantes de botón: primario, peligro, éxito
- Overlay semitransparente

### Servicios

#### AuthService (`services/auth.service.ts`)
- `login()`, `logout()`, `registrarUsuario()`, `verificarCodigo()`, `reenviarCodigo()`
- `init()`: Recupera sesión al cargar la app desde el token guardado
- `obtenerUsuarioActual()`, `estaAutenticado()`
- `obtenerRutaInicial()`: Devuelve la ruta por defecto según el rol

#### ReporteService (`services/reporte.service.ts`)
- `obtenerReportes()`, `obtenerReportesPublicos()`, `obtenerReportePorId()`
- `obtenerReportesPorEstado()`, `obtenerReportesPorDistrito()`, `obtenerReportesPorCiudadano()`, `obtenerReportesPorCuadrilla()`
- `agregarReporte()`, `aprobarReporte()`, `rechazarReporte()`, `corregirPrioridad()`
- `asignarCuadrilla()`, `marcarEnAtencion()`, `marcarAtendido()`, `completarConEvidencias()`, `marcarVerificado()`
- `obtenerResumenEstadisticas()`, `obtenerAuditoriaValidaciones()`
- `calcularPrioridadAsistida()`: Calculadora de prioridad basada en respuestas a cuestionario

#### CuadrillaService (`services/cuadrilla.service.ts`)
- `obtenerCuadrillas()`, `obtenerCuadrilasDisponibles()`, `obtenerCuadrillaPorId()`
- `obtenerMisCuadrillas()`: Para el responsable de cuadrilla
- `asignarCuadrilla()`, `crearCuadrilla()`, `actualizarCuadrilla()`, `eliminarCuadrilla()`

#### UsuarioService (`services/usuario.service.ts`)
- `obtenerUsuarios()`, `obtenerUsuarioPorId()`, `buscarUsuarios()`, `filtrarPorRol()`
- `cambiarRolUsuario()`, `activarUsuario()`, `desactivarUsuario()`

### Modelos

```typescript
// usuario.model.ts
type RolUsuario = 'Ciudadano' | 'Validador' | 'Administrador' | 'ResponsableCuadrilla';
interface Usuario { id: number; nombre: string; email: string; rol: RolUsuario; activo: boolean; fechaRegistro: string; }

// reporte.model.ts
type EstadoReporte = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Programado' | 'En atencion' | 'Atendido' | 'Verificado';
type PrioridadReporte = 'Baja' | 'Media' | 'Alta' | 'Critica';
type Distrito = 'Huancayo' | 'El Tambo' | 'Chilca';
interface Reporte { id; titulo; descripcion; distrito; direccion; estado; prioridad; ... }

// cuadrilla.model.ts
interface Cuadrilla { id; nombre; responsable; responsableId?; estado; zonaAsignada; distrito; }

// paginacion.model.ts
interface Paginacion<T> { items: T[]; total: number; page: number; page_size: number; total_pages: number; }
```

### Guardias de Rutas

#### AuthGuard (`guards/auth.guard.ts`)
- Verifica que haya un token en localStorage
- Si no hay token, redirige a `/login`

#### RoleGuard (`guards/role.guard.ts`)
- Verifica que el usuario esté autenticado
- Compara el rol del usuario con los roles requeridos en la ruta (`route.data['roles']`)
- Si no coincide, redirige a `/acceso-denegado`
- Espera a que el usuario se cargue si aún no está disponible (usa `usuario$` observable)

### Guardias de Rutas

Las rutas protegidas con `canActivate: [RoleGuard]`:

| Ruta | Roles Permitidos |
|---|---|
| `/dashboard` | Ciudadano, Administrador |
| `/reportar` | Ciudadano |
| `/mis-reportes` | Ciudadano |
| `/validacion` | Validador |
| `/cuadrillas` | Administrador |
| `/estadisticas` | Administrador |
| `/mis-cuadrillas` | ResponsableCuadrilla |
| `/admin/auditoria` | Administrador |
| `/admin/usuarios` | Administrador |

### Interceptor HTTP

**`interceptors/auth.interceptor.ts`:**
- Intercepta todas las peticiones HTTP salientes
- Agrega el header `Authorization: Bearer <token>` si existe un token en localStorage

---

## Flujo Completo del Reporte

```
1. REGISTRO
   Ciudadano se registra → Recibe OTP por email → Verifica código → ¡Listo!

2. CREACIÓN
   Ciudadano crea reporte (título, descripción, distrito, dirección,
   prioridad, ubicación en mapa, imágenes)
       ↓
   Estado: Pendiente

3. VALIDACIÓN
   Validador revisa reporte pendiente
       ├→ Aprobar (con o sin corrección de prioridad) → Estado: Aprobado
       └→ Rechazar (con observación) → Estado: Rechazado

4. ASIGNACIÓN
   Administrador asigna cuadrilla al reporte aprobado
       ↓
   Estado: Programado
   (La cuadrilla cambia a "En ruta" si estaba disponible,
    o "Ocupada" si ya tiene 1 asignación;
    máximo 2 reportes por cuadrilla)

5. ATENCIÓN EN CAMPO
   ResponsableCuadrilla:
       ↓ "Atender"
   Estado: En atencion (cuadrilla → "Ocupada")
       ↓ "Completar con evidencias" (fotos + observación)
   Estado: Atendido

6. VERIFICACIÓN
   Administrador verifica el trabajo completado
       ↓
   Estado: Verificado
   (Cuadrilla se actualiza según reportes activos restantes)
```

---

## Roles del Sistema

### Ciudadano
- Se registra con email (verificación OTP)
- Crea reportes ambientales con ubicación, fotos y nivel de prioridad
- Ve el estado de sus reportes en "Mis Reportes"
- Puede editar reportes propios

### Validador
- Ve reportes pendientes en el panel de validación
- Aprueba o rechaza reportes
- Corrige la prioridad si es necesario
- Rechazo requiere observación obligatoria para prioridad Alta o Crítica

### Responsable de Cuadrilla
- Ve sus cuadrillas asignadas en "Mis Cuadrillas"
- Atiende reportes (marca como "En atencion")
- Completa reportes con fotos de evidencia
- Puede tener múltiples cuadrillas a su cargo

### Administrador
- Dashboard con KPIs y mapa general
- Gestión de usuarios (cambiar roles, activar/desactivar)
- Gestión de cuadrillas (crear, editar, eliminar)
- Asignación de reportes a cuadrillas
- Verificación de reportes atendidos
- Estadísticas detalladas
- Auditoría de validaciones

---

## Instalación y Configuración

### Requisitos Previos

1. **SQL Server** (SQLEXPRESS o similar) instalado y corriendo
2. **Python 3.11+** instalado
3. **Node.js 18+** y npm instalados
4. **Angular CLI** instalado globalmente:
   ```bash
   npm install -g @angular/cli
   ```

### Paso 1: Base de Datos

Ejecutar el script completo en SQL Server Management Studio (SSMS):

```
backend/sql/todo_en_uno.sql
```

Esto crea la base de datos (o usa `EcoReportDB` existente), elimina tablas si existen, crea las 4 tablas con sus constraints, e inserta datos de prueba.

### Paso 2: Backend

```bash
cd backend

# Crear entorno virtual (opcional pero recomendado)
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Instalar pyodbc (Windows)
pip install pyodbc

# Configurar .env (editar según tu entorno)
# DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD, DB_DRIVER

# Iniciar servidor
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

El backend estará disponible en `http://localhost:8000`.
Documentación interactiva (Swagger): `http://localhost:8000/docs`

### Paso 3: Frontend

```bash
# Desde la raíz del proyecto
npm install
ng serve -o
```

El frontend estará disponible en `http://localhost:4200`.

---

## Datos de Prueba

Todos los usuarios tienen contraseña **`123456`**.

| Email | Rol | Nombre |
|---|---|---|
| `ciudadano@ecoreport.pe` | Ciudadano | Juan Pérez |
| `ciudadano2@ecoreport.pe` | Ciudadano | Ciudadano 2 |
| `ciudadano3@ecoreport.pe` | Ciudadano | María Gómez |
| `validador1@ecoreport.pe` | Validador | Validador 1 |
| `validador2@ecoreport.pe` | Validador | Validador 2 |
| `admin@ecoreport.pe` | Administrador | Admin Municipal |
| `carlos@ecoreport.pe` | ResponsableCuadrilla | Carlos López |
| `rosa@ecoreport.pe` | ResponsableCuadrilla | Rosa Huamán |

### Datos de Cuadrillas

| Cuadrilla | Responsable | Zona | Distrito |
|---|---|---|---|
| Cuadrilla A | Carlos López (id 7) | Norte - Av. Principal | Huancayo |
| Cuadrilla B | Rosa Huamán (id 8) | Sur - Jr. Cusco | Huancayo |
| Cuadrilla C | Pedro Sánchez (id 7) | Centro - Mercado Modelo | El Tambo |
| Cuadrilla D | Lucía Torres (id 8) | Este - Parque Infantil | Chilca |

Hay **40 reportes de ejemplo** distribuidos entre los 3 distritos (Huancayo, El Tambo, Chilca) con diversos estados (Pendiente, Aprobado, Programado, Atendido, Verificado, Rechazado) y prioridades (Baja a Crítica).

---

## Despliegue

### Producción (Azure App Service - Linux)

El archivo `backend/startup.sh` contiene el comando de inicio:

```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

Para el frontend:
```bash
ng build --configuration production
```

Los archivos estáticos se generan en `dist/ecoreport-angular/` y pueden servirse desde cualquier servidor web (Nginx, Azure Static Web Apps, etc.).

### Variables de Entorno Requeridas

```
DB_SERVER=localhost\SQLEXPRESS
DB_NAME=EcoReportDB
DB_USER=sa
DB_PASSWORD=continental
DB_DRIVER=ODBC Driver 17 for SQL Server
SECRET_KEY=ecoreport-jwt-secret-key-cambiar-en-produccion-2024
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ecoreporthyo@gmail.com
SMTP_PASSWORD=tu_contraseña_de_aplicacion
CORS_ORIGINS=http://localhost:4200,https://tudominio.com
```
