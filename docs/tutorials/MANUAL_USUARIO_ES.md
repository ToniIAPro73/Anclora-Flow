# 📖 Manual de Usuario — Anclora Flow

Bienvenido a Anclora Flow, la plataforma fiscal y financiera para autónomos digitales.

## 🟢 Pasos esenciales para arrancar y usar la aplicación

| Orden | Paso                                      | Resultado                                 |
|-------|-------------------------------------------|-------------------------------------------|
| 1     | Ejecuta `docker-compose up --build`       | Servicios (frontend, backend, IA, DB) activos en puertos 3020/8020/8021/5452 |
| 2     | Accede a http://localhost:3020            | Dashboard principal accesible             |
| 3     | Realiza el login social (Google/GitHub)   | Acceso seguro al sistema                  |
| 4     | Navega por el sidebar izquierdo           | Acceso a facturas, gastos, deducciones, etc. |
| 5     | Configura tu idioma y tema en el header   | Interfaz personalizada                    |
| 6     | Consulta el asistente IA para dudas fiscales | Recomendaciones inteligentes automáticas   |
| 7     | Crea y gestiona facturas, gastos y reportes | Flujo completo de gestión                 |
| 8     | Cambia configuración avanzada si eres admin | Control total sobre la app                |

[image:2]  
Pasos esenciales para arrancar y usar Anclora Flow (puertos proyecto-tres).

## 🧑‍💻 Navegación principal

- **Sidebar:** Acceso directo a módulos principales (Dashboard, Ingresos, Gastos, Deducciones, Suscripciones, Calendario, Informes, IA).
- **Header:** Controles de usuario, configuración y temas.
- **Tarjetas:** Acceso rápido a crear facturas, gastos, etc.

## 🌐 Idiomas y temas

- Es posible alternar entre español e inglés en el header.
- Se puede escoger tema claro, oscuro o sistema.
- Mobile first: interfaz optimizada para móviles y tablets.

## ⚡ Flujos automáticos y asistentes

- Recomendaciones IA emergentes según contexto de uso.
- Sugerencias de optimización de gastos y trámites.
- Automatización de tareas repetitivas.

## 🔒 Seguridad

- Multicuenta, roles y autenticación social (Google/GitHub).
- Configuración avanzada protegida para admins.

## 📝 Notas

- Puedes consultar la arquitectura y configuración en `docs/ARQUITECTURA_ES.md`.
