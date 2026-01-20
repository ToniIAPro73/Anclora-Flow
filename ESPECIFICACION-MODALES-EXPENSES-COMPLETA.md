# ESPECIFICACIÓN DE MODALES - Módulo Gastos & Deducciones

**Versión:** 1.0  
**Enfoque:** 3 modales + lógica de categorización + validaciones  
**Estado:** Definición de responsabilidades

---

## 📋 ÍNDICE

1. [Matriz de Modales](#matriz-de-modales)
2. [Modal 1: Crear Gasto](#modal-1-crear-gasto)
3. [Modal 2: Consultar Gasto](#modal-2-consultar-gasto)
4. [Modal 3: Editar Gasto](#modal-3-editar-gasto)

---

## 📊 MATRIZ DE MODALES

```
┌─────────────────┬──────────┬──────────┬────────────┬─────────┐
│ Modal           │ Tipo     │ Modo     │ Editable   │ Acceso  │
├─────────────────┼──────────┼──────────┼────────────┼─────────┤
│ Crear Gasto     │ FORM     │ Crear    │ ✅ Sí      │ Botón   │
│ Consultar       │ DRAWER   │ Lectura  │ ❌ No      │ Click   │
│ Editar          │ MODAL    │ Edición  │ ✅ Sí      │ Botón   │
└─────────────────┴──────────┴──────────┴────────────┴─────────┘
```

---

## 💰 MODAL 1: CREAR GASTO

**Tipo:** Modal Form (Crear)  
**Estado Aplicable:** Nuevo registro  
**Acceso:** Botón "Nuevo Gasto" (header)

### Estructura Propuesta
- **Categoría:** Selector obligatorio (Oficina, Software, Viajes, etc.)
- **Descripción:** Texto obligatorio.
- **Importe:** Decimal > 0.
- **Impuestos:** Desglose de IVA.
- **Deducibilidad:** Toggle (Sí/No) + Porcentaje.
- **Comprobante:** Upload de archivo (PDF, JPG, PNG).

---

## 🔍 MODAL 2: CONSULTAR GASTO

**Tipo:** Drawer (Side Panel)  
**Modo:** 100% lectura  
**Acceso:** Click en fila de tabla

### Características
- Muestra todos los campos del gasto.
- Previsualización del comprobante si existe.
- Enlace al proyecto asociado.

---

## ✏️ MODAL 3: EDITAR GASTO

**Tipo:** Modal Form (Edición)  
**Acceso:** Botón [Editar] en drawer de consulta

### Restricciones
- Solo editable si el periodo fiscal no está cerrado (lógica a implementar).
- Registro de auditoría del cambio.
