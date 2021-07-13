
# Skripthut Bot
#### **Application Command Formatting:**
Base command:
```json
"name": string,
"description": string,
"type": number,
"options": any[]
```
Options (same for nested):
```json
"type": number,
"name": string,
"description": string,
"options": any[]
```
Formatted all in order. If empty (`[]` or `{}`), delete object.

***

#### **To-Do:**
- Finish /role Command — LOW
- Finish /addon Command (add list) — MEDIUM
- Finish /docs Command (add pagination) — MEDIUM
- Finish /mute Command — MEDIUM
- Add SkriptHub Docs API support for /docs — HIGH
- Add /send Command — LOWEST
- Replace /createticket Command with /ticket Command (add deletability etc.)