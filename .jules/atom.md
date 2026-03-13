
## Extraction de UiKeyValueList
Création de `<UiKeyValueList>` pour standardiser les listes de type clé-valeur (contact, adresses, menus de prix) à travers l'application.
**Règle établie** : Les listes itératives avec des séparateurs et espacements récurrents doivent utiliser ce composant avec ses variantes (`default`, `dashed`, `boxed`) et prop `color` (`white`, `cyan`, `blue`, `violet`) pour garantir l'homogénéité du style visuel et éviter le boilerplate HTML/Tailwind répété dans le `<template>`.
