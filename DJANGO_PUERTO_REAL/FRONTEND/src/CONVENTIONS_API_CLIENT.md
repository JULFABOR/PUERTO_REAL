Guía rápida: `apiClient` vs `axios`

Propósito
- `apiClient` (archivo `src/api/apiClient.js`): es una instancia centralizada de Axios configurada con `baseURL`, interceptores de autorización, manejo de 401 y configuración CSRF para Django. Usar `apiClient` en llamadas que deben:
  - Incluir automáticamente el token de autenticación desde `localStorage`.
  - Respetar `baseURL` (`/api`) y los interceptores (manejo de errores globales, logout automático en 401).
  - Trabajar con endpoints que requieren CSRF / credenciales.

- `axios` (import directo): usar solo en casos excepcionales cuando necesitas una llamada sin los interceptores ni los headers añadidos por `apiClient` (p. ej. pruebas puntuales, llamadas a servicios externos con distintos dominios o headers personalizados). Si necesitas saltarte `apiClient`, documenta la razón en el archivo que haga la llamada.

Convención recomendada
- Por defecto, preferir `apiClient` para la mayoría de llamadas al backend del proyecto.
- Evitar mezclar `apiClient` y `axios` en la misma pantalla sin motivo; puede confundir tokens y comportamiento de errores.
- Si decides usar `axios` directamente en un archivo, añade un comentario corto justificando el motivo. Ejemplo:
  // Usamos axios directamente aquí porque esta petición se realiza a un servicio externo sin token

Ejemplos
- Correcto (uso estándar):
  import apiClient from '@/api/apiClient';
  const resp = await apiClient.get('/compras/proveedores/');

- Excepcional (documentado):
  import axios from 'axios';
  // Llamada externa a https://some-external-service.test (no usar apiClient porque no requiere token)
  const resp = await axios.get('https://some-external-service.test/data');

Checklist antes de PR
- ¿La petición necesita token o manejo de 401? → usar `apiClient`.
- ¿La petición es a un dominio externo o necesita headers especiales? → documentar y usar `axios` si es necesario.

Si quieres, puedo:
- Añadir estos comentarios a los archivos que importan `axios` (p. ej. `JefeHome.jsx`, `Dashboard.jsx`).
- Buscar discrepancias adicionales y proponerte un PR con la normalización.

Fin de la guía.
