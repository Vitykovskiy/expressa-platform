# Доменная модель

## 10. Доменная модель

### 10.1. Основные сущности

| Сущность | Ключевые поля |
|---|---|
| `User` | `id`, `phone`, `role`, `created_at`, `updated_at` |
| `OtpChallenge` | `id`, `phone`, `code_hash`, `expires_at`, `attempts`, `consumed_at` |
| `Session` | `id`, `user_id`, `refresh_token_hash`, `expires_at`, `revoked_at` |
| `Category` | `id`, `name`, `description`, `sort_order`, `is_active`, `archived_at` |
| `Product` | `id`, `category_id`, `type`, `name`, `description`, `price_minor`, `sort_order`, `is_active`, `is_available`, `archived_at` |
| `ProductVariant` | `id`, `product_id`, `size`, `price_minor`, `sort_order`, `is_available`, `archived_at` |
| `ModifierGroup` | `id`, `name`, `selection_type`, `min_select`, `max_select`, `is_active`, `archived_at` |
| `ModifierOption` | `id`, `group_id`, `name`, `price_delta_minor`, `sort_order`, `is_default`, `is_available`, `archived_at` |
| `CategoryModifierGroup` | `category_id`, `group_id`, `sort_order` |
| `Order` | `id`, `number`, `customer_id`, `stage`, `total_minor`, timestamps |
| `OrderItem` | `id`, `order_id`, `product_id`, `variant_id` при наличии, snapshot-поля товара и размера напитка при наличии, `quantity`, `unit_total_minor`, `line_total_minor` |
| `OrderItemModifier` | `id`, `order_item_id`, `modifier_option_id`, snapshot-поля добавки и цены |
| `OrderEvent` | `id`, `order_id`, `event_type`, `actor_id`, payload, `created_at` |
| `AuditEvent` | `id`, `actor_id`, `entity_type`, `entity_id`, `action`, payload, `created_at` |
| `ServiceSetting` | `key`, `value`, `updated_by`, `updated_at` |

Расшифровка неочевидных полей:

- `selection_type` — режим выбора вариантов добавок: `single` разрешает выбрать один вариант, `multiple` — несколько;
- `min_select` — минимальное количество вариантов, которое нужно выбрать в группе;
- `max_select` — максимальное количество вариантов, которое можно выбрать в группе;
- `is_default` — признак добавки, выбранной заранее;
- `is_active` — признак публикации элемента в меню;
- `is_available` — возможность заказать товар, размер напитка или добавку в текущий момент;
- `sort_order` — позиция элемента при отображении;
- поля с окончанием `_minor` хранят денежную сумму в целых копейках;
- `archived_at` — время архивирования элемента;
- snapshot-поля — сохранённые в заказе название, размер и цена на момент оформления;
- `payload` — дополнительные данные события.

### 10.2. Целостность

- номера телефонов уникальны после нормализации;
- порядок категории уникален среди активных категорий;
- порядок товара уникален внутри категории;
- тип товара принимает значения `DRINK` и `OTHER`;
- напиток содержит один или несколько размеров из `S`, `M`, `L`, каждый размер уникален внутри напитка;
- товар типа `OTHER` содержит одну цену и не имеет вариантов размера;
- опубликованный напиток содержит хотя бы один доступный размер; `M` выбирается по умолчанию, если доступен;
- минимальное количество выбранных добавок не превышает максимальное: `min_select ≤ max_select`;
- при `selection_type = single` используется `max_select = 1`;
- для обязательной группы требуется выбрать хотя бы одну добавку: `min_select ≥ 1`;
- количество доступных вариантов по умолчанию в обязательной группе находится между `min_select` и `max_select`, каждый такой вариант имеет нулевое изменение цены;
- цена товара, цена размера напитка и изменение цены добавки представлены целыми копейками;
- создание заказа и фиксация снимков выполняются одной транзакцией;
