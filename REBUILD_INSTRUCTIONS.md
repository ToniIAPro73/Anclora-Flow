# Instrucciones para regenerar el CSS completamente

El problema es que el CSS compilado en dist/ no se está actualizando. Sigue estos pasos:

## 1. Detén el servidor si está corriendo
```
Ctrl + C
```

## 2. Elimina la carpeta dist para forzar regeneración
```powershell
cd frontend
rm -rf dist
# O en Windows PowerShell:
Remove-Item -Recurse -Force dist
```

## 3. Limpia la caché de npm/vite
```powershell
npm run clean
# O si no existe ese comando:
rm -rf node_modules/.vite
# En Windows PowerShell:
Remove-Item -Recurse -Force node_modules/.vite
```

## 4. Reinicia el servidor
```powershell
npm run dev
```

## 5. En el navegador:
- Abre DevTools (F12)
- Ve a la pestaña "Application" o "Aplicación"
- En "Storage" → "Clear site data" o "Borrar datos del sitio"
- O simplemente usa Ctrl+Shift+R para recarga forzada

## 6. Verificación
Después de recargar:
- Ve a la tabla de facturas
- Haz click en una fila
- Haz click derecho → Inspeccionar
- Verifica que el `<tr>` tenga la clase `is-selected`
- En el panel de estilos, busca `background` y verifica el valor
