# Kilopris

En lille hjemmeside, der regner kilo- og literprisen ud, mens du skriver. Lavet
til at stå i butikken med telefonen og sammenligne to pakker uden at regne i
hovedet.

**Adresse:** <https://simon-jensen.github.io/kilopris/>
(direkte til literprisen: <https://simon-jensen.github.io/kilopris/#liter>)

## Sådan virker den

- **Kilopris:** skriv prisen og vægten i g eller kg → kr. pr. kg (og pr. 100 g).
- **Literpris:** skriv prisen og rumfanget i ml, cl eller l → kr. pr. liter (og pr. 100 ml).
- **Stk.:** til flerpak, fx 6 × 33 cl. Tomt felt betyder 1.
- **Sammenlign:** “+ Sammenlign med en vare til” tilføjer et kort mere. Den
  billigste pr. kg/l får mærket *Billigst*, de andre *+N % dyrere*. En ny vare
  arver den forriges enhed.
- Tal kan skrives, som de står på hylden: `24,95`, `24.95`, `1.299,00`, `24,-`.
- Resultatet afrundes som på hyldeforkanten (62,375 → 62,38).
- Tallene huskes, mens fanen er åben (sessionStorage), så de overlever et skift
  til en anden app, men ikke til næste indkøbstur. Den valgte fane huskes.
  **Ryd** nulstiller den viste fane.

Siden virker uden net, når den har været åbnet én gang, og kan lægges på
hjemmeskærmen som en app (iPhone: Safari → Del → *Føj til hjemmeskærm*;
Android: Chrome → ⋮ → *Installer app* / *Føj til startskærm*).

## Filer

| Fil | Indhold |
| --- | --- |
| `index.html` | Hele siden: CSS, HTML og JavaScript. Intet byggetrin. |
| `sw.js` | Service worker: net først (højst 3 s), ellers cachen. |
| `manifest.webmanifest`, `icon-*.png` | Til “Føj til hjemmeskærm”. |
| `.nojekyll` | Får GitHub Pages til at udgive filerne, som de er. |
| `tests/side.test.mjs` | Headless røgtest (Playwright/Chromium). |

## Udgivelse

GitHub Pages udgiver `main` direkte. Slås til én gang i repoets
**Settings → Pages → Build and deployment**: *Source: Deploy from a branch*,
*Branch: `main`*, mappe `/ (root)`. Ændringer slår igennem efter et par
minutter.

Service workeren henter altid siden fra nettet først, så en ny udgave vises
ved næste besøg uden versionsbump. Tilføjes en fil, siden skal bruge uden net,
skal den med i `FILER` i `sw.js`.

## Lokal test

```
python3 -m http.server 8000      # åbn http://localhost:8000/
node tests/side.test.mjs         # røgtest; UD=/tmp/skaerm gemmer skærmbilleder
```
