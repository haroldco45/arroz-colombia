# Arroz de Colombia al Día

App (PWA) de **Vibras Positivas HM** sobre todo el mundo del arroz en Colombia: cultivo, variedades, insumos, épocas de siembra, mecanización, zonas arroceras y Bajo Cauca, laboratorio del molino, calculadoras, sistematizado de pequeños productores, gremios, gobierno, Banco Agrario, TLC, países vecinos e innovación. Español e inglés.

- **Robot**: `.github/workflows/robot.yml` corre cada 30 minutos, trae noticias reales (Google Noticias + GDELT) a `data/noticias.json` y una vez por semana renueva `img/og.jpg` (la imagen de vista previa del enlace) con una foto real de Wikimedia Commons.
- **Hoy**: al abrir la app hace una búsqueda en vivo y la mezcla con lo que dejó el robot.
- **Publicación**: Netlify → https://arroz-colombia.netlify.app (publish directory: raíz del repo).

Hora de referencia: Colombia (America/Bogota, UTC-5).
