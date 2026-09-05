🇫🇷 Version française | [🇬🇧 English version](design-system.md)

# HiveMind - Design System

[← Retour au README](../README.fr.md)

---

## Vue d'ensemble

Le langage design de HiveMind repose sur trois contraintes : l'interface s'efface derriere l'enigme, la densite d'information est assumee, et la collaboration se lit dans la structure plutot que dans la decoration.

Le systeme a ete facon par deux passes :

- **BLOCK-26** - palette OKLCH accessible, dark mode, layout responsive mobile, etats vides, gestion d'erreurs, micro-interactions
- **BLOCK-27** - audit formel impeccable (score 14/20), ayant produit des tokens couleur semantiques, des anneaux de focus WCAG ring-2, un drag-and-drop accessible au clavier et le support de `prefers-reduced-motion`

Base : Tailwind CSS + shadcn-vue. Les tokens personnalises etendent la couche de tokens shadcn sans la remplacer.

---

## Personnalite de la marque

Sobre, precis, collaboratif. L'interface s'efface pour que l'enigme occupe le premier plan - pas de decorations, pas de gamification, pas de tableau de bord analytique. La densite d'information est une feature, pas un probleme. La collaboration se lit dans la structure (qui fait quoi, quand), pas dans le chrome de l'UI.

**Anti-references :**
- Le starter shadcn-vue par defaut (bleu SaaS generique, aucune identite)
- La gamification agressive (badges, classements, XP)
- Les dashboards d'entreprise lourds (Jira, SharePoint)

---

## Tokens couleur

Les tokens sont definis dans `apps/web/src/assets/main.css` via des proprietes CSS personnalisees, en OKLCH pour la coherence perceptuelle. Les memes noms de variables s'appliquent en mode clair et en mode sombre ; les valeurs sont echangees via le selecteur `.dark`.

### Palette de base

| Token | Clair | Sombre | Usage |
|-------|-------|--------|-------|
| `--background` | oklch(1 0 0) | oklch(0.13 0.015 250) | Fond de page |
| `--foreground` | oklch(0.13 0.015 250) | oklch(0.96 0.005 250) | Texte principal |
| `--card` | oklch(1 0 0) | oklch(0.17 0.012 250) | Surfaces des cartes |
| `--muted` | oklch(0.95 0.005 250) | oklch(0.22 0.01 250) | Fonds secondaires |
| `--muted-foreground` | oklch(0.5 0.02 250) | oklch(0.65 0.02 250) | Texte secondaire |
| `--border` | oklch(0.9 0.01 250) | oklch(0.28 0.015 250) | Bordures, separateurs |
| `--input` | oklch(0.9 0.01 250) | oklch(0.28 0.015 250) | Bordures des inputs |
| `--ring` | oklch(0.62 0.19 250) | oklch(0.62 0.19 250) | Anneaux de focus |

### Couleurs de marque

| Token | Valeur | Usage |
|-------|--------|-------|
| `--primary` | oklch(0.62 0.19 250) | Boutons CTA, liens, etats actifs |
| `--primary-foreground` | oklch(1 0 0) | Texte sur fond primaire |
| `--secondary` | oklch(0.95 0.005 250) | Boutons secondaires, tags |
| `--secondary-foreground` | oklch(0.13 0.015 250) | Texte sur fond secondaire |
| `--accent` | oklch(0.95 0.005 250) | Etats hover |
| `--destructive` | oklch(0.55 0.22 27) | Actions destructives, erreurs |

### Tokens de statut semantiques

Les couleurs de statut des puzzles utilisent des tokens semantiques plutot que des utilitaires Tailwind bruts, assurant la compatibilite dark mode.

| Token | Clair | Sombre | Usage |
|-------|-------|--------|-------|
| `--status-open` | oklch(0.62 0.19 250) | oklch(0.62 0.19 250) | Puzzles ouverts |
| `--status-open-foreground` | oklch(1 0 0) | oklch(1 0 0) | - |
| `--status-progress` | oklch(0.75 0.15 80) | oklch(0.72 0.15 80) | Puzzles en cours |
| `--status-progress-foreground` | oklch(0.2 0.05 80) | oklch(0.95 0.02 80) | - |
| `--status-solved` | oklch(0.65 0.17 145) | oklch(0.62 0.17 145) | Puzzles resolus |
| `--status-solved-foreground` | oklch(1 0 0) | oklch(1 0 0) | - |
| `--status-verified` | oklch(0.55 0.18 145) | oklch(0.52 0.18 145) | Puzzles verifies |
| `--status-verified-foreground` | oklch(1 0 0) | oklch(1 0 0) | - |

---

## Typographie

Police de base : pile system-ui (pas de police personnalisee chargee - l'interface reste rapide et lisible sur tous les appareils).

| Role | Classe | Notes |
|------|--------|-------|
| Titres de page | `text-2xl font-bold tracking-tight` | Titres de collection et de puzzle |
| Titres de section | `text-lg font-semibold` | En-tetes de panneaux |
| Corps de texte | `text-sm` | Par defaut pour la plupart du contenu |
| Texte secondaire | `text-sm text-muted-foreground` | Horodatages, labels, hints |
| Monospace | `font-mono text-sm` | Codes GC, coordonnees, valeurs de tentatives |

---

## Espacement et mise en page

- Unite de base : echelle 4px de Tailwind (`1 = 4px`).
- Largeur max du contenu : `max-w-7xl mx-auto` sur les vues principales.
- Padding des cartes : `p-6` sur desktop, `p-4` sur mobile.
- Ecart entre sections : `gap-4` (16px) entre elements lies, `gap-6` (24px) entre sections.

---

## Composants

### Boutons

Les boutons d'action principale utilisent `h-11` (44px) sur mobile pour satisfaire WCAG 2.5.5. Sur desktop, `h-9` (36px) est acceptable. Utiliser `focus-visible:ring-2` partout - jamais `focus:ring-1`.

```html
<!-- Primaire -->
<button class="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm
               font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90
               disabled:cursor-not-allowed disabled:opacity-50
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
  Action
</button>
```

### Anneaux de focus

Tous les elements interactifs utilisent `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`. La pseudo-classe `focus-visible` fait apparaitre les anneaux uniquement lors de la navigation au clavier, pas au clic souris.

### PuzzleStatusBadge

Utilise les tokens de statut semantiques - jamais les utilitaires Tailwind couleur bruts.

```html
<span :class="`bg-[--status-${status}] text-[--status-${status}-foreground]`">
  {{ t(`puzzle.status.${status}`) }}
</span>
```

### Drag-and-drop (reordonnancement des puzzles)

Accessible au clavier : les elements `[draggable="true"]` repondent aussi aux touches fleches. Les gestionnaires de deplacement appellent la meme logique de reordonnancement que le drag par pointeur. `aria-grabbed` et `aria-dropeffect` sont definis au debut du drag.

---

## Motion

Les animations respectent `prefers-reduced-motion`. Toutes les transitions utilisent le pattern :

```css
@media (prefers-reduced-motion: no-preference) {
  .animate-something {
    transition: transform 150ms ease, opacity 150ms ease;
  }
}
```

Les micro-interactions (hover bouton, elevation carte, glissement de l'indicateur d'onglet) utilisent `duration-150` ou `duration-200`. Aucune animation ne depasse `300ms`.

---

## Dark mode

Le dark mode est active via la classe `.dark` sur `<html>`. La preference est stockee dans `localStorage` et appliquee avant le premier rendu pour eviter le flash.

Tous les tokens couleur ont des surcharges dark mode definies dans `.dark { ... }` dans `main.css`. Les composants n'utilisent que des classes basees sur les tokens - pas de conditionnels clair/sombre codes en dur dans les templates Vue.

---

## Accessibilite

| Exigence | Implementation |
|---|---|
| Contraste couleur | Toutes les combinaisons texte/fond ciblent WCAG AA (4.5:1 pour le corps, 3:1 pour les grands textes) |
| Indicateurs de focus | `focus-visible:ring-2` sur tous les elements interactifs ; le ring offset assure la visibilite sur n'importe quel fond |
| Zones tactiles | `h-11` (44px) minimum sur mobile - satisfait WCAG 2.5.5 |
| Labels lecteur d'ecran | `aria-label` sur les boutons icone seul ; `role="alert"` sur les messages d'erreur ; `aria-hidden` sur les SVG decoratifs |
| Navigation clavier | Tous les elements interactifs sont atteignables par Tab ; les listes drag-and-drop supportent les touches fleches |
| Reduced motion | Toutes les transitions enveloppees dans `prefers-reduced-motion: no-preference` |
| Titres de page | `document.title` mis a jour a chaque changement de route via `router.afterEach` |
