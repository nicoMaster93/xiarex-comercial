# Visor interactivo de productos XIAREX

Se conservaron la estructura y el diseño del portafolio. Únicamente se cambiaron a **Ver más** los botones de los productos que ya tienen documentación.

## Archivos

- `index.html`: portafolio comercial (raíz del proyecto).
- `productos.json`: catálogo de productos (fuente única para tarjetas y visor).
- `catalogo.js`: renderiza las tarjetas del portafolio desde el JSON.
- `producto.html`: experiencia documental reutilizable.
- `producto.css`: diseño futurista y adaptable.
- `producto.js`: visor PDF interactivo.
- `resources/`: PDFs de documentación y `logos-productos/`.

## PDFs esperados en `resources/`

Conservar exactamente estos nombres:

- `GeocargaApp_Logistics_Adm.pdf`
- `GeocargaApp_Operations.pdf`
- `Xiarex_ROC_Digital_Intelligence.pdf`
- `Xiarex_Quick_Guide.pdf`

## Solicitud de demos (carrito)

Productos **sin** `demo.url` se solicitan por correo:

1. El usuario pulsa **Solicitar demo**.
2. Se abre un modal: *¿Te interesa ver más demos?*
3. **Sí** → sigue explorando el catálogo (badge *DEMO A SOLICITAR*).
4. **No** → va al formulario de contacto con la lista prearmada.
5. El FAB flotante mantiene el carrito hasta enviar.

El carrito vive en `localStorage` (`xiarex-demo-cart`) y también funciona desde `producto.html`.

## Cómo agregar un demo

En `productos.json`, dentro del producto:

```json
"demo": {
  "url": "https://ejemplo.com/demo",
  "mode": "embed",
  "label": "Capacitación interactiva"
}
```

- `mode: "embed"`: se carga en un iframe dentro del detalle.
- `mode: "external"`: se abre en una ventana nueva.
- Si hay `documents` y `demo`, aparecen pestañas DOCUMENTACIÓN / LIVE DEMO.
- Si solo hay demo, el detalle abre directo en modo demo (`?vista=demo`).

## Cómo abrir

Servir o abrir desde la raíz de esta carpeta (`comercial/`). Las rutas son relativas:

- Portafolio: `index.html`
- Visor: `producto.html?producto=logistica`, `?producto=roc`, `?producto=bio` o `?producto=compras&vista=demo`

Si PDF.js no puede cargarse, la página cambia automáticamente al visor PDF nativo del navegador.

