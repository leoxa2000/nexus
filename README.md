# NEXUS Trading Bot

En Node.js/Express-backend för paper trading med riktiga marknadspriser.
Projektet använder filbaserat tillstånd och kör ingen riktig orderläggning.

**Prisleverantör:** Coinbase (enda källan för spotpriser). Inga API-nycklar krävs för prisdata.

## Starta lokalt

1. Installera Node.js 18 eller senare.
2. Kör `npm install`.
3. Valfria nyhetsfilter kan konfigureras med variablerna i `.env.example`.
4. Kör `npm start`.
5. Öppna `http://localhost:3000/` eller kontrollera `http://localhost:3000/health`.

Porten läses från `PORT` och är annars `3000`. Tillstånd sparas i `data/`.

## Test-rutter

| Rutt | Beskrivning |
|------|-------------|
| `GET /health` | Hälsokontroll — svarar alltid HTTP 200 med `status: "ok"` eller `"starting"` |
| `GET /api/test` | Detaljerad servertest — priser, portfölj, bot-status, Coinbase-anslutning |
| `GET /api/status` | Fullständig bot-status — priser, trades, statistik, dagliga snapshots |

Exempel:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/test
curl http://localhost:3000/api/status
```

## Smoke-test

Kör följande efter installation:

```bash
npm run test:smoke
```

Testet startar en separat lokal process och verifierar `/health`,
`/api/status` samt dashboardens `/`-route. Health svarar alltid HTTP 200;
svaret innehåller `status: "starting"` tills prisdata hunnit bli tillgängligt.

## Deployment på Railway

1. Koppla ditt GitHub-repo till Railway.
2. Railway sätter automatiskt `PORT` — använd `process.env.PORT` (redan konfigurerat).
3. Servern lyssnar på `0.0.0.0` (redan konfigurerat).
4. `/health` svarar alltid HTTP 200 — Railway stoppar inte tjänsten under uppstart.
5. Valfria miljövariabler för nyhetsveto (lägg till i Railway Variables):
   - `CRYPTOPANIC_API_KEY`
   - `ALPHA_VANTAGE_API_KEY`
   - `ANTHROPIC_API_KEY`
6. För permanent lagring, skapa en Railway Volume och mounta den. Sätt
   `RAILWAY_VOLUME_MOUNT_PATH` till mount-punkten (t.ex. `/app/data`).
7. En Dockerfile finns för värdar som bygger från containerdefinition.

### Produktionsrobusthet

- **AbortController-timeout:** Alla Coinbase-anrop har 8 sekunders timeout via `AbortController`. Vid timeout bevaras senast giltiga pris.
- **429-hantering:** Rate-limit-svar loggas utan att krascha servern. Tillgångar som misslyckas behåller sina senaste priser.
- **Felsammanfattning:** Fel loggas med tillgångs-ID och feltyp — inga API-nycklar eller tokens exponeras.
- **Unsupported assets:** Tillgångar som Coinbase inte stödjer (t.ex. BNB) markeras som `unsupported` istället för att orsaka totalt fel.
- **Backoff:** Vid upprepade fel ökar väntetiden automatiskt (30s → 5min) tills API:t svarar igen.

## API-rutter

- `GET /` — dashboard
- `GET /health` — hälsokontroll (alltid HTTP 200)
- `GET /api/health` — omdirigerar till `/health`
- `GET /api/test` — detaljerad servertest (priser, portfölj, bot-status)
- `GET /api/status` — priser, botstatus, trades och statistik
- `POST /api/toggle` — starta eller stoppa boten
- `POST /api/deposit` — ändra paper-trading-kapital
- `POST /api/reset` — återställ paper-trading-state
- `POST /api/config` — uppdatera konfigurerbara reglage
- `POST /api/toggle-news` — slå av eller på nyhetsveto
- Övriga rutter — okänd route ger JSON `404`, serverfel ger JSON `500`

## Begränsningar

Marknadspriser hämtas från Coinbase utan API-nyckel. Utan nätåtkomst
startar processen men hälsokontrollen visar `status: "starting"` tills
prisdata finns. Nyhetsveto kräver de valfria variablerna och är annars
inte konfigurerat. Historisk state från en utgången värd kan inte
återskapas utan en kopia av dess datafil eller volym.

Servern sparar state vid kontrollerad `SIGTERM`/`SIGINT`-nedstängning. En
skadad eller felaktigt formad state-fil ignoreras säkert och backend startar
med nytt standard-state.
