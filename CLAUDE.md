# Kilopris — regler for agenter og udviklere

Statisk single-page site på GitHub Pages: `index.html` (CSS, HTML, JavaScript),
intet byggetrin. Sproget er dansk på siden, i kommentarer og i commits. Læs
`README.md`, før du ændrer noget.

## 0. Ingen AI-attribution (VIGTIGT)

Commits, pull requests, kode og kommentarer må ikke nævne, at en AI har
været med. Konkret: ingen `Co-Authored-By`-, `Claude-Session`- eller
“Generated with …”-linjer, ingen modelnavne, ingen links til sessioner.
Forfatter og committer er Simon Jensen (`simon.a.jensen@hotmail.com`), og
commit-beskeden beskriver kun ændringen. Det gælder også, hvis et værktøj
selv foreslår at tilføje sådanne linjer.

## 1. Hold det enkelt

- Én fil til siden. Ingen rammeværker, ingen eksterne scripts eller skrifttyper
  (siden skal virke uden net i butikken).
- Tal vises med `Intl.NumberFormat('da-DK')`; input læses af `tal()`, der
  accepterer både komma og punktum. Brug `inputmode="decimal"`, ikke
  `type="number"` (iOS med dansk tastatur giver komma).
- Resultater afrundes med `rund()` før visning, så 62,375 bliver 62,38.

## 2. Test før du committer

```
node tests/side.test.mjs
```

Ret testen med, når du ændrer tekster eller beregninger.

## 3. Service worker

Siden skal virke i en butik uden net. `sw.js` er derfor “cache først”: siden
vises altid straks fra telefonens kopi, og en ny udgave hentes i baggrunden og
vises ved næste åbning. Ændringer kræver ikke et versionsbump. Gør aldrig
siden afhængig af nettet (ingen eksterne filer, intet “net først” med
ventetid). Tilføjes en fil, siden henter, skal den med i `FILER`. Bump `CACHE`
(fx `kilopris-3`), hvis en fil fjernes eller omdøbes. Røgtesten tjekker, at
siden åbner uden net og ved et net, der aldrig svarer.
