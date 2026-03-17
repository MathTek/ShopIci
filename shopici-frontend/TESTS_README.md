# Tests Fonctionnels - ShopIci

## 🚀 Démarrage Rapide

### Tests Unitaires & Composants (Vitest + Testing Library)

```bash
# Lancer les tests en mode watch
npm run test

# Lancer les tests avec interface graphique
npm run test:ui

# Lancer tous les tests une fois
npm run test:run

# Générer un rapport de couverture
npm run test:coverage
```

## 📋 Structure des Tests

```
src/test/
├── setup.ts              # Configuration globale des tests
├── NavBar.test.tsx       # Tests du composant NavBar
├── Home.test.tsx         # Tests de la page Home
└── ...                   # Autres tests à venir
```

## 🧪 Types de Tests Implémentés

### 1. Tests de Composants (NavBar)
- ✅ Rendu du logo ShopIci
- ✅ Affichage des liens de navigation
- ✅ Présence de l'icône panier

### 2. Tests de Pages (Home)
- ✅ Affichage du message de bienvenue
- ✅ Présence des boutons d'action
- ✅ Navigation vers les bonnes pages au clic

## 🔧 Technologies Utilisées

- **Vitest** : Framework de test rapide intégré à Vite
- **Testing Library** : Utilitaires pour tester les composants React
- **jsdom** : Environnement DOM pour les tests
- **React Testing Library** : Tests spécifiques à React

## 📝 Écrire de Nouveaux Tests

### Exemple de test pour un composant :

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MonComposant from '../components/MonComposant'

describe('MonComposant', () => {
  it('rend correctement', () => {
    render(<MonComposant />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
```

## 🎯 Tests à Implémenter Prochainement

### Tests Fonctionnels (E2E)
- Connexion utilisateur
- Navigation entre pages
- Ajout au panier
- Processus de commande

### Tests d'Intégration
- API calls (Supabase)
- Contextes React (Cart, Auth)
- Formulaires

### Tests de Performance
- Chargement des pages
- Rendu des composants
- Optimisations

## 🛠️ Commandes Utiles

```bash
# Debug d'un test spécifique
npm run test -- MonComposant.test.tsx

# Tests en mode verbose
npm run test -- --reporter=verbose

# Tests avec couverture détaillée
npm run test:coverage -- --reporter=html
```

## 📊 Rapports de Test

Les rapports de couverture sont générés dans `coverage/` avec :
- Résumé console
- Rapport HTML détaillé
- Métriques par fichier/composant

## 🔍 Debugging

Pour debugger les tests :
1. Utilisez `screen.debug()` pour voir le DOM
2. Ajoutez des `console.log()` dans vos tests
3. Utilisez l'interface Vitest UI : `npm run test:ui`

---

**Happy Testing! 🧪✨**