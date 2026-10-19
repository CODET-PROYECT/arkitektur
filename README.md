# Arkitektur Studio

Sitio estático construido con Vite, React y TypeScript. Los archivos para publicar se generan en `dist/`.

## Desarrollo y publicación

Requiere Node.js 20.19+ o 22.12+ y Python con Pillow.

```sh
npm install
npm run dev
npm run build
npm run preview
```

GitHub Actions publica automáticamente `dist/` en GitHub Pages al hacer push a `main` (o iniciar `Deploy to GitHub Pages` manualmente). En GitHub, configura **Settings → Pages → Build and deployment → Source: GitHub Actions**. Vite usa `/arkitektur/`, que corresponde a `https://codet-proyect.github.io/arkitektur/`.

### Imágenes

Los JPG originales y sus derivados AVIF/WebP están en `public/img/`. Para regenerar derivados sin ampliar las fotos, ejecuta:

```sh
npm run images
```

Las páginas usan los formatos modernos con JPG como respaldo. El equipo de origen llega a 900 px de ancho (una foto mide 419 px); solicita al cliente originales de mayor resolución para futuras ampliaciones.

## Editar contenido

- **Teléfonos, correo, WhatsApp y formulario:** `src/site.config.ts`. Los enlaces telefónicos usan el formato E.164 sin espacios. `formAction` puede apuntar a Formspree, Netlify Forms o un endpoint propio; si queda vacío, el formulario valida y prepara un correo para `peiarq@gmail.com`.
- **Aviso de privacidad:** confirma el texto y añade su URL aprobada en `privacyNoticeUrl` antes de publicar.
- **Galerías:** `gallery.json` concentra categoría, descripción, fotografía, dimensiones y texto alternativo. Añade la foto original en `public/img/`, usa un alt descriptivo que pueda verificarse y vuelve a ejecutar `npm run images`.
- **Datos aún por confirmar:** años de experiencia, proyectos concluidos, ubicación, redes, retrato de Edgar, testimonios y detalles de obras. Los campos sin dato aparecen como pendientes en la página.
- **Fuentes:** archivos WOFF2 autoalojados en `public/fonts/`.

## Decisiones de diseño y skills

El entorno no tenía instaladas `/ui-ux-pro-max` ni `/3d-web-pack`, y no contenía el `search.py` del sistema de diseño. Seguí manualmente las reglas y diales del brief; no presenté búsquedas como si se hubieran ejecutado. Las decisiones están persistidas en [`design-system/arkitektur-studio/MASTER.md`](design-system/arkitektur-studio/MASTER.md).

La escena procedural usa React Three Fiber y Drei solo en el hero. Si el navegador solicita movimiento reducido, falta WebGL, está activo `saveData` o el equipo informa cuatro núcleos o menos, permanece la fotografía estática. El build deja el chunk 3D en 226.79 KB gzip.

## Verificaciones

- `npm run build`: correcto.
- `npm audit`: cero vulnerabilidades.
- Galería: 4 categorías, 7 fotos por categoría, alt y dimensiones comprobados; 84 variantes AVIF/WebP presentes y sin ampliación de originales.
- Imagen social: `public/og-cover.jpg`, 1200 × 630.
- Contraste calculado para tokens principales y estados de foco; navegación, controles y campos usan áreas táctiles de al menos 44 px.

No se pudo medir Lighthouse ni completar una pasada visual de 360/1440 px: el navegador integrado devolvió `ERR_CONNECTION_TIMED_OUT` al servidor local. El proyecto se puede abrir localmente con `npm run dev` para completar esa revisión; las puntuaciones Lighthouse y métricas LCP/CLS quedan pendientes de medir en el dominio de despliegue.
