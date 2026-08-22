# NEXUS Trading Bot

En Node.js/Express-backend för paper trading med riktiga marknadspriser.
Projektet använder filbaserat tillstånd och kör ingen riktig orderläggning.

## Starta lokalt

1. Installera Node.js 18 eller senare.
2. Kör `npm install`.
3. Valfria nyhetsfilter kan konfigureras med variablerna i `.env.example`.
4. Kör `npm start`.
5. Öppna `http://localhost:3000/` eller kontrollera `http://localhost:3000/health`.

Porten läses från `PORT` och är annars `3000`. Tillstånd sparas i `data/`.

## Smoke-test

Kör följande efter installation:

```bash
npm run test:smoke
```

Testet startar en separat lokal process och verifierar `/health`,
`/api/status` samt dashboardens `/`-route. Health får vara `503` under uppstart
om externa prisdata inte hunnit bli tillgängliga; svaret måste fortfarande vara
giltig JSON.

## Deployment på ny värd

Kör `npm install --omit=dev` följt av `npm start`. Värden måste exponera den
port som anges av `PORT`. Använd beständig disk och sätt vid behov
`RAILWAY_VOLUME_MOUNT_PATH` till en skrivbar datamapp, även om variabelnamnet
är kvar för kompatibilitet med den tidigare deploymenten.

En Dockerfile finns för värdar som bygger från containerdefinition.

## API-rutter

- `GET /` — dashboard
- `GET /health` och `GET /api/health` — enkel driftstatus
- `GET /api/status` — priser, botstatus, trades och statistik
- Övriga rutter — okänd route ger JSON `404`, serverfel ger JSON `500`
- `POST /api/toggle` — starta eller stoppa boten
- `POST /api/deposit` — ändra paper-trading-kapital
- `POST /api/reset` — återställ paper-trading-state
- `POST /api/config` — uppdatera konfigurerbara reglage
- `POST /api/toggle-news` — slå av eller på nyhetsveto

## Begränsningar

Marknadspriser och växelkurs hämtas från externa tjänster. Utan nätåtkomst
startar processen men hälsokontrollen förblir `starting` tills prisdata finns.
Nyhetsveto kräver de valfria variablerna och är annars inte konfigurerat.
Historisk state från en utgången värd kan inte återskapas utan en kopia av
dess datafil eller volym.

Servern sparar state vid kontrollerad `SIGTERM`/`SIGINT`-nedstängning. En
skadad eller felaktigt formad state-fil ignoreras säkert och backend startar
med nytt standard-state.
