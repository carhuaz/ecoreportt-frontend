# AGENTS.md — EcoReport Frontend

Guía para futuras sesiones de OpenCode. Léela antes de modificar el frontend.

## Descripción

SPA del sistema de reportes ambientales **EcoReport**. Frontend en **Angular 22** (componentes standalone, lazy loading, Signal Forms en autenticación, Leaflet para mapas) que consume la API REST del repo `ecoreport-backend` (https://github.com/carhuaz/ecoreport-backend). Este repositorio contiene **solo el frontend**.

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

Requisitos:

- Node `22.22.3+`, `24.15+` o `26` (Angular 22) y TypeScript 6, instalado por `ng update`.
- Backend corriendo en `http://localhost:8000` (`uv run uvicorn main:app --reload --port 8000`; `app.main:app` también funciona).

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
- `services/auth.service.ts`: guarda el token en `localStorage` con la clave `ecoreport_token`, mantiene el usuario en un `BehaviorSubject`, valida sesión con `GET /auth/me` y normaliza errores OTP (`detail`, cooldown, intentos restantes).
- `pages/login`, `pages/register`, `pages/verify`: formularios migrados a **Signal Forms** (`form`, `FormField`, `FormRoot`, validadores de `@angular/forms/signals`).
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

- `src/environments/environment.ts` (desarrollo) apunta a `http://localhost:8000/api`.
- `environment.prod.ts` usa `/api` y se aplica con `fileReplacements`; el backend debe quedar detrás del mismo origen o de un proxy inverso.
- La API expone `/api/auth`, `/api/reportes`, `/api/usuarios`, `/api/cuadrillas`, `/api/estadisticas`, `/api/contacto`.

## Dominio (resumen)

- Roles: `Ciudadano`, `Validador`, `Administrador`, `ResponsableCuadrilla`.
- Estados de reporte: `Pendiente`, `Aprobado`, `Rechazado`, `Programado`, `En atención`, `Atendido`, `Verificado`.
- Estados de cuadrilla: `Disponible`, `En ruta`, `Ocupada`.
- Un `ResponsableCuadrilla` solo ve sus cuadrillas y reportes asignados.
- OTP: código de 6 dígitos, expira en 10 min, máximo 5 intentos y reenvío con cooldown de 60 s. El front muestra el `detail` del backend y la cuenta atrás; un `429` no es un error genérico.

## Trampas del repo

- Angular 22 usa los builders de `@angular/build` (`application`, `dev-server`, `extract-i18n`, `karma`). No volver a `@angular-devkit/build-angular`, que está deprecado.
- **No hay pruebas**: no existen archivos `*.spec.ts` pese a que `npm test` está configurado; `ng test` falla con `TS18003` hasta que se agregue al menos un spec.
- Los logs `ng-serve.*.log` estaban versionados en la base grupal; ya fueron eliminados. No volver a agregarlos.
- El endpoint `/api/mapa` del backend **no está registrado** en `main.py`; no asumir que responde.
- El `README.md` todavía describe backend y frontend juntos; ahora son repos separados.
- `package-lock.json` es el lockfile real del frontend: **sí** debe versionarse.
- Angular 22 usa componentes standalone y **OnPush por defecto**. Los componentes no migrados conservan `ChangeDetectionStrategy.Eager`; no quitarlo sin migrar su estado a signals.
- Los formularios de auth usan Signal Forms. No volver a introducir `ngModel`/`FormsModule` en `login`, `register` o `verify`.
- Angular 22 ya no permite `maxlength`/`pattern` nativos en nodos con `[formField]`; usar `maxLength()`/`pattern()` del schema.

## Validación antes de terminar

1. `npm ci`
2. `npx ng build --configuration production` sin errores.
3. `npm start` y abrir `http://localhost:4200`.
4. Probar login contra el backend en `http://localhost:8000`.
5. Probar el flujo OTP: registro → código incorrecto → reenvío en cooldown → verificación → login.
6. Si se tocó una ruta protegida, verificar `RoleGuard` con cada rol.
