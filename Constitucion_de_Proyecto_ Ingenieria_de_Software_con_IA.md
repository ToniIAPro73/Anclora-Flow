Redactar reglas efectivas para el archivo constitution.md es el paso fundacional para pasar del "vibe coding" a una ingeniería de software rigurosa asistida por IA. Este archivo actúa como la **"memoria a largo plazo"** y los **"guardarraíles duros"** del proyecto, definiendo principios que la IA no tiene permiso para violar.  
Para redactar una Constitución efectiva que guíe herramientas como **GitHub Spec Kit** o **Kiro**, debes seguir estas directrices basadas en las fuentes:

### 1\. Categoriza tus "Principios Inmutables"

Una Constitución robusta no es una lista de deseos, sino un conjunto de restricciones técnicas claras. Debes dividir tus reglas en cuatro categorías críticas:

* **Pila Tecnológica Opinada (Opinionated Stack):** Define explícitamente qué tecnologías son obligatorias y cuáles están prohibidas para evitar la fragmentación.  
* *Ejemplo:* "El backend debe construirse exclusivamente en **Python 3.11+**. No se permite el uso de Node.js para servicios de backend" 1\.  
* *Ejemplo:* "La aplicación debe usar **Vite** y **Vanilla JavaScript**. Minimizar el uso de librerías externas" 2\.  
* **Seguridad y Cumplimiento (Hard Guardrails):** Establece límites de seguridad que, si se cruzan, deben provocar un rechazo automático de la tarea.  
* *Ejemplo:* "Nunca subir imágenes a servicios externos; los metadatos deben almacenarse en una base de datos **SQLite local**" 2\.  
* *Ejemplo:* "No implementar autenticación propia; usar siempre proveedores OIDC estándar" 1\.  
* **Estándares de Calidad y Pruebas:** La IA tiende a omitir pruebas si no se le obliga. La Constitución debe exigir la testabilidad como requisito de entrega.  
* *Ejemplo:* "Todo código nuevo debe incluir pruebas unitarias usando **Vitest**" 3\.  
* *Ejemplo:* "Si no puedes escribir un caso de prueba para el resultado *antes* de generarlo, no se debe priorizar esa tarea" 4\.  
* **Principios de Arquitectura y UX:** Define la estructura macro y la consistencia de la experiencia.  
* *Ejemplo:* "Toda aplicación debe ser **CLI-first** (prioridad a la línea de comandos)" 1\.  
* *Ejemplo:* "Mantener consistencia en la experiencia de usuario (UX) y requisitos de rendimiento" 5\.

### 2\. Utiliza "Restricciones Negativas"

Las instrucciones más efectivas para una IA suelen ser aquellas que le dicen explícitamente **qué NO hacer**. Esto reduce el espacio de búsqueda del modelo y evita alucinaciones comunes.

* *Técnica:* En lugar de solo decir "Usa bibliotecas seguras", escribe: " **No** hardcodear credenciales ni claves de API en el código fuente bajo ninguna circunstancia" 1\.  
* *Técnica:* "Las imágenes **no** se suben a la nube" o "Los álbumes **nunca** están anidados dentro de otros álbumes" 2\.

### 3\. Redacta para la Validación Automática

Recuerda que estas reglas serán consultadas por el agente durante la fase de planificación (/plan). Redacta las reglas de manera que el agente pueda verificar binariamente si su plan cumple o no con la Constitución.

* **Mala regla:** "El código debe ser limpio." (Subjetivo, difícil de validar).  
* **Buena regla:** "El código debe pasar las reglas de linter configuradas en .eslintrc sin advertencias" 3, 1\.

### 4\. Ubicación y Estructura del Archivo

Para que herramientas como **GitHub Spec Kit** reconozcan estas reglas, el archivo debe ubicarse correctamente y seguir una estructura legible (Markdown).

* **Ubicación:** .specify/memory/constitution.md 6, 7\.  
* **Comando de Generación:** Puedes usar el comando /speckit.constitution para pedirle a tu agente que redacte un borrador inicial basado en tus directrices verbales 5\.

### Ejemplo de Constitución Efectiva

Aquí tienes un ejemplo consolidado basado en las mejores prácticas de Spec Kit y Kiro:  
\# Constitución del Proyecto (Principios Inmutables)

\#\# 1\. Stack Tecnológico (Innegociable)  
\- \*\*Frontend:\*\* React con TypeScript. No usar jQuery ni Bootstrap.  
\- \*\*Backend:\*\* .NET Aspire con base de datos Postgres \[8\].  
\- \*\*Gestión de Estado:\*\* Usar Context API solo para estados de baja frecuencia.

\#\# 2\. Seguridad  
\- \*\*Cero Secretos:\*\* Prohibido incluir contraseñas o API Keys en el código o logs. Usar variables de entorno.  
\- \*\*Datos:\*\* Los datos de usuario no deben salir del perímetro de la aplicación sin encriptación.

\#\# 3\. Calidad y Pruebas  
\- \*\*Cobertura:\*\* Cada nueva funcionalidad debe incluir pruebas de integración.  
\- \*\*Estilo:\*\* El código debe cumplir con las reglas de estilo de Google para Java/Python.

\#\# 4\. Flujo de Trabajo  
\- \*\*Validación:\*\* No pasar a la fase \`/implement\` sin haber validado el plan técnico contra este documento \[9\].  
Al establecer estas reglas, transformas la Constitución en una herramienta de **gobernanza automatizada**, asegurando que cualquier agente (Claude, Copilot, Gemini) trabaje como un miembro disciplinado de tu equipo y no como un generador de código aleatorio 1, 10\.  
