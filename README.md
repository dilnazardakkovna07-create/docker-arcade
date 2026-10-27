# Docker Arcade 🐳

nginx:alpine негізіндегі мини-ойындар сайты: Snake, Memory, реакция тесті, «Кит аулау». Рекордтар браузерде сақталады.

## Іске қосу

```bash
docker build -t docker-arcade .
docker run -d -p 8080:80 --name arcade docker-arcade
```

Браузерде ашыңыз: http://localhost:8080

## Тоқтату

```bash
docker rm -f arcade
```
