# ТюменьГорТранс

Приложение для отображения расписания общественного транспорта Тюмени на устройствах Zepp OS (Amazfit).

## Возможности

- Отображение списка остановок из конфига
- Получение предсказаний прибытия транспорта в реальном времени
- Отображение номера маршрута, времени прибытия и типа расчёта (точное/плановое)
- Сжатие данных для передачи через BLE (ограничение 2KB)
- **Mock-режим** для тестирования без API

## Требования

- Node.js 18+
- Zepp OS CLI (`npm install -g @zeppos/zeus-cli`)

## Установка зависимостей

```bash
npm install
```

## Сборка

```bash
make install
```

Команда собирает приложение и генерирует QR-код для установки через приложение Zepp.

## Настройка

### config.js

Файл `config.js` содержит основные настройки:

```javascript
export const STOPS = {
    "Сити-молл в центр" : 1017,
    "Рижская домой": 138,
    "Газпром в центр": 134,
    "Цветной бульвар" : 321,
    "ЖДВ": 326,
    "Ершова": 225
};

export const USE_MOCK_API = false;  // true = мок-данные, false = реальный API
```

#### USE_MOCK_API

- **`false`** (по умолчанию) - используется реальный API через app-side
- **`true`** - генерируются случайные данные на устройстве. Не требуется подключение к телефону/BLE.

#### STOPS

Формат: `"Отображаемое имя" : ID остановки в API`

### Как узнать ID остановки

1. Откройте приложение на устройстве
2. Перейдите на остановку в веб-версии api.tgt72.ru
3. ID остановки будет в URL (например, `checkpoint_id=1017`)

## Архитектура

```
┌─────────────────────┐     BLE (<2KB)     ┌─────────────────────┐
│    Device Side      │ ◄─────────────────► │     App Side        │
│   (Zepp OS app)     │                     │  (Zepp OS side)     │
│                     │                     │                     │
│ • StopsListPage     │    compressed       │ • Получение данных   │
│ • StopDetailPage    │ ─────────────────►  │ • Запрос route names │
│ • API абстракция    │                     │ • Сжатие pako        │
└─────────────────────┘                     └─────────────────────┘
```

При `USE_MOCK_API = true`:
```
┌─────────────────────┐
│    Device Side      │
│                     │
│ • StopsListPage     │
│ • StopDetailPage    │
│ • API абстракция    │──► MockApiService
│ • (без BLE!)        │    генерирует данные
└─────────────────────┘
```

### Device Side (браслет)

- `app.js` - инициализация, API abstraction (выбирает RealApiService или MockApiService)
- `page/StopsListPage.js` - список остановок
- `page/StopDetailPage.js` - детали остановки с прибытиями
- `shared/compressor.js` - распаковка данных (pako inflate + base64)

### App Side (телефон)

- `app-side/index.js` - обработка запросов от device
- Запрос предсказаний: `https://api.tgt72.ru/api/v5/prediction/?checkpoint_id=XXX`
- Запрос номера маршрута: `https://api.tgt72.ru/api/v5/routesforsearch/{route_id}/`
- Сжатие данных pako.deflate → base64

## API Endpoints

### GET /api/v5/prediction/?checkpoint_id={id}

Возвращает предсказания прибытия транспорта для остановки.

```json
{
  "objects": [
    {
      "route_id": 115,
      "order": [
        {
          "distance": 21648,
          "car_id": 7829,
          "prediction": {
            "precise": true,
            "is_plan": false,
            "accurancy": 50,
            "departure_plan": "2026-03-22T13:05:14+05:00",
            "time": "13:05:16"
          },
          "checkpoints_to_current": 15
        }
      ],
      "checkpoint_id": 1017
    }
  ]
}
```

### GET /api/v5/routesforsearch/{route_id}/

Возвращает информацию о маршруте.

```json
{
  "id": 1257,
  "name": "20",
  "description": "ЖДВ - ул. Ершова"
}
```

## Формат данных

На device-side данные приходят в формате:

```javascript
{
  arrivals: [
    {
      r: "20",           // номер маршрута
      t: "2026-03-22T13:05:14+05:00",  // время
      p: 1              // 1 = точное, 0 = плановое
    }
  ]
}
```

## Структура файлов

```
tgt/
├── app.js              # Device: API abstraction (Real/Mock)
├── app.json            # Конфигурация приложения
├── config.js           # Настройка остановок и режима
├── page/
│   ├── StopsListPage.js    # Список остановок
│   └── StopDetailPage.js   # Детали остановки
├── app-side/
│   └── index.js        # App-side: обработка запросов
└── shared/
    ├── compressor.js    # Сжатие/распаковка
    ├── message.js       # Коммуникация BLE
    └── pako.js         # Библиотека сжатия
```

## Версионирование

- **1.0.3** - Текущая версия
- Сжатие данных для BLE
- Mock-режим для тестирования
- Конфиг остановок из config.js
- Один запрос prediction + кэширование route names

## Лицензия

MIT
