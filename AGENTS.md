# AGENTS.md — EcoReport Frontend

Guía para futuras sesiones de OpenCode. Léela antes de modificar el frontend.

## Descripción

SPA del sistema de reportes ambientales **EcoReport**. Frontend en **Angular 18** (componentes standalone, lazy loading, Leaflet para mapas) que consume la API REST del repo `ecoreport-backend` (https://github.com/carhuaz/ecoreport-backend). Este repositorio contiene **solo el frontend**.

## Comandos reales

Ejecutar desde la raíz del repo:

```powershell
# Instalar dependencias (usar el lockfile)
npm ci

# Servidor de desarrollo -> http://localhost:4200
npm start

# Build de producción
npx ng build --configuration production

# Tests (Karma + Jasmine; aún no hay archivos .spec.ts)
npm test
```

Requisito: el backend debe estar corriendo en `http://localhost:8000` (`uv run uvicorn app.main:app --reload --port 8000`).

## Arquitectura actual

```
src/main.ts
  -> app/app.config.ts        (providers: router, HttpClient, interceptor, APP_INITIALIZER)
  -> app/app.routes.ts        (rutas + lazy loading + RoleGuard)
       -> pages/*             (páginas por rol)
       -> services/*          (HTTP hacia la API)
       -> guards/*            (auth / roles)
       -> interceptors/*      (JWT Bearer)
       -> models/*            (interfaces TypeScript)
       -> shared/*            (navbar, footer, cards, mapa, modales, paginación)
```

- `app.config.ts`: `provideRouter`, `provideHttpClient(withFetch(), withInterceptors([authInterceptor]))` y `APP_INITIALIZER` que llama a `AuthService.init()`.
- `services/auth.service.ts`: guarda el token en `localStorage` con la clave `ecoreport_token`, mantiene el usuario en un `BehaviorSubject` y valida sesión con `GET /auth/me`.
- `services/reporte.service.ts`, `cuadrilla.service.ts`, `usuario.service.ts`: acceso a la API.
- `interceptors/auth.interceptor.ts`: agrega `Authorization: Bearer <token>`.
- `guards/auth.guard.ts` y `guards/role.guard.ts`: protegen rutas; `role.guard` lee `route.data['roles']`.
- `shared/eco-map`: mapa con Leaflet. `shared/image-uploader`: carga de imágenes. `shared/badge-estado`: estados de reporte.

## Rutas principales

| Ruta | Acceso | Rol |
|---|---|---|
| `/` | Público | — |
| `/login`, `/registro`, `/verify` | Público | — |
| `/reportes-publicos`, `/mapa-ambiental`, `/contacto` | Público | — |
| `/dashboard` | Protegido | Ciudadano, Administrador |
| `/reportar`, `/mis-reportes` | Protegido | Ciudadano |
| `/validacion` | Protegido | Validador |
| `/cuadrillas`, `/estadisticas`, `/admin/usuarios`, `/admin/auditoria` | Protegido | Administrador |
| `/mis-cuadrillas` | Protegido | ResponsableCuadrilla |
| `/acceso-denegado` | Público | — |

## Entornos y API

- `src/environments/environment.ts` (desarrollo) y `environment.prod.ts` (producción).
- Ambos apuntan hoy a `http://localhost:8000/api`. **Antes de desplegar, cambiar `environment.prod.ts` a la URL real del backend.**
- La API expone `/api/auth`, `/api/reportes`, `/api/usuarios`, `/api/cuadrillas`, `/api/estadisticas`, `/api/contacto`.

## Dominio (resumen)

- Roles: `Ciudadano`, `Validador`, `Administrador`, `ResponsableCuadrilla`.
- Estados de reporte: `Pendiente`, `Aprobado`, `Rechazado`, `Programado`, `En atención`, `Atendido`, `Verificado`.
- Estados de cuadrilla: `Disponible`, `En ruta`, `Ocupada`.
- Un `ResponsableCuadrilla` solo ve sus cuadrillas y reportes asignados.

## Trampas del repo

- `environment.prod.ts` sigue apuntando a `localhost`; no desplegar sin cambiarlo.
- **No hay pruebas**: no existen archivos `*.spec.ts` pese a que `npm test` está configurado.
- Los logs `ng-serve.*.log` estaban versionados en la base grupal; ya fueron eliminados. No volver a agregarlos.
- El endpoint `/api/mapa` del backend **no está registrado** en `main.py`; no asumir que responde.
- El `README.md` todavía describe backend y frontend juntos; ahora son repos separados.
- `package-lock.json` es el lockfile real del frontend: **sí** debe versionarse.
- Angular 18 usa componentes standalone: no asumir `NgModule` en las páginas nuevas.

## Validación antes de terminar

1. `npm ci`
2. `npm start` y abrir `http://localhost:4200`.
3. Probar login contra el backend en `http://localhost:8000`.
4. `npx ng build --configuration production` sin errores.
5. Si se tocó una ruta protegida, verificar `RoleGuard` con cada rol.
