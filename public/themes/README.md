# Темы пилотов — имена файлов

Каждый гонщик = папка `public/themes/{id}/`  
`{id}` как в коде: `verstappen`, `antonelli`, `norris`…

## Обязательные файлы (одинаковые имена у всех)

| Файл | Где в приложении |
|---|---|
| `splash.jpeg` | Экран загрузки |
| `poster.jpeg` | Экран пилота (полный hero) |
| `portrait.jpeg` | Карточка гонщика в Garage |
| `team.jpeg` | Экран команды |
| `car.jpeg` | Экран машины (главное фото / hero) |
| `car-side.jpeg` | Полоска болида в Garage |
| `logo.jpeg` | Логотип команды в Garage |
| `quote.jpeg` | Фон цитаты на Home |
| `team.jpeg` | Экран команды |

`car.jpeg` и `car-side.jpeg` — разные слоты:  
- **Garage** всегда смотрит на `car-side.jpeg`  
- **Экран машины** смотрит на `car.jpeg`

## Аватары в списках (отдельно)

```
public/pilots/Имя Фамилия.jpeg
```

Пример: `Max Verstappen.jpeg`, `Kimi Antonelli.jpeg`

## Новый гонщик

1. Создать `public/themes/{id}/` и положить файлы с именами выше  
2. Добавить аватар в `public/pilots/`  
3. Добавить тему в `lib/themes.ts`  
4. Появится в выборе «Любимый» в Паддоке  
