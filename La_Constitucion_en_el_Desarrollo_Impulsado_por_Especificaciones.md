El archivo constitution.md (Constitución) es el componente central de gobernanza en el flujo de trabajo de **Spec-Driven Development (SDD)**, especialmente en herramientas como **GitHub Spec Kit**.  
Consiste en un documento que define los **"principios innegociables"** y las reglas inmutables del proyecto. Actúa como la "memoria a largo plazo" y la ley suprema que los agentes de IA deben consultar y respetar obligatoriamente antes de generar cualquier plan técnico o código.

### ¿En qué consiste exactamente?

Su función principal es establecer **guardarraíles duros** (hard guardrails) que restrinjan la creatividad de la IA para asegurar la consistencia y seguridad del software. Se ubica típicamente en la carpeta .specify/memory/ y cumple los siguientes propósitos:

1. **Establecer Pilas Tecnológicas Opinadas (Opinionated Stacks):** Define qué tecnologías son obligatorias y cuáles están prohibidas, evitando que la IA elija librerías al azar o mezcle frameworks incompatibles 1\.  
2. **Imponer Estándares de Calidad y Seguridad:** Transforma políticas abstractas en reglas que el agente debe verificar (por ejemplo, estándares de pruebas o manejo de credenciales) 2\.  
3. **Anclaje (Grounding) del Plan:** Cuando se ejecuta el comando de planificación (/plan), el agente cruza la solicitud del usuario con la Constitución. Si la solicitud viola la Constitución, el agente debe rechazarla o adaptar la solución técnica para cumplir con la norma 1, 3\.  
4. **Prevención de Amnesia Arquitectónica:** Asegura que las decisiones tomadas al inicio del proyecto se mantengan en futuras iteraciones, evitando que la IA reintroduzca patrones o tecnologías que ya fueron descartados 4, 5\.

### Ejemplos Prácticos de Reglas en una Constitución

A continuación, se presentan ejemplos de lo que podrías encontrar dentro de un archivo constitution.md, clasificados por categoría:

#### 1\. Restricciones del Stack Tecnológico

Estas reglas evitan la fragmentación del código y aseguran que la IA use las herramientas aprobadas por la organización.

* **Lenguaje:** "Todo el código de backend debe escribirse en **Python 3.11+**. El uso de versiones anteriores o de otros lenguajes está estrictamente prohibido" 6\.  
* **Frameworks:** "La interfaz de usuario debe construirse utilizando **React** y **Tailwind CSS**. No se permite el uso de jQuery o Bootstrap" 7\.  
* **Testing:** "Todas las pruebas unitarias deben implementarse utilizando **Vitest**. Se requiere una cobertura mínima de pruebas del 80%" 2\.

#### 2\. Principios de Arquitectura y Diseño

Guían al agente sobre cómo estructurar la aplicación.

* **Enfoque de Producto:** "Toda aplicación construida por este equipo debe ser **CLI-first** (prioridad a la línea de comandos); las interfaces gráficas son secundarias" 1\.  
* **Gestión de Estado:** "El estado global debe gestionarse exclusivamente a través de Redux Toolkit; no usar Context API para datos de alta frecuencia".  
* **Bases de Datos:** "Para persistencia local, utilizar siempre **SQLite**. No se permite subir imágenes a servicios externos; deben almacenarse localmente" 8\.

#### 3\. Seguridad y Cumplimiento (Hard Guardrails)

Reglas críticas que, de violarse, provocan el rechazo inmediato del código generado.

* **Credenciales:** "Nunca hardcodear claves de API o secretos en el código fuente. Utilizar siempre variables de entorno o gestores de secretos" 9\.  
* **Autenticación:** "No implementar sistemas de autenticación propios. Utilizar exclusivamente proveedores de identidad estándar (OIDC/OAuth2)" 10\.

#### 4\. Estilo y Convenciones

Instrucciones para mantener la legibilidad y consistencia.

* **Documentación:** "Cada función pública exportada debe incluir un docstring en formato Google Style".  
* **Linter:** "El código debe pasar las reglas de ESLint configuradas en el proyecto sin advertencias" 2\.

En resumen, la Constitución es el mecanismo que transforma a un agente de IA de un "chat creativo" a un **ingeniero disciplinado**, obligándolo a operar dentro de los límites definidos por el equipo de ingeniería humano.  
