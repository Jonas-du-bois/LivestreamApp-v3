# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e5]:
    - banner [ref=e6]:
      - generic [ref=e8]:
        - heading "Programme" [level=1] [ref=e9]
        - generic [ref=e10]:
          - button "Recherche" [ref=e11] [cursor=pointer]
          - button "Filtres" [active] [ref=e13] [cursor=pointer]
          - button "Notifications" [ref=e15] [cursor=pointer]
    - main [ref=e17]:
      - generic [ref=e18]:
        - tablist "common.day" [ref=e19]
        - tablist "Filtres" [ref=e20]:
          - tab "Tout" [ref=e21] [cursor=pointer]
        - status "Chargement..." [ref=e23]:
          - generic [ref=e24]: Chargement...
    - navigation [ref=e73]:
      - generic [ref=e74]:
        - link "Accueil" [ref=e75] [cursor=pointer]:
          - /url: /
        - link "Programme" [ref=e80] [cursor=pointer]:
          - /url: /schedule
        - link "Directs" [ref=e85] [cursor=pointer]:
          - /url: /stream
        - link "Résultats" [ref=e90] [cursor=pointer]:
          - /url: /results
        - link "Favoris" [ref=e95] [cursor=pointer]:
          - /url: /favorites
  - status "Chargement de Coupe des Bains" [ref=e100]:
    - generic [ref=e101]:
      - paragraph [ref=e103]: Coupe des Bains
      - paragraph [ref=e104]: Connexion au live...
```