---
title: Project Overview
order: 1
---

# Project Overview

woke-poe-trade is a Path of Exile 1 toolkit forked from Awakened PoE Trade (APT). It is built with Electron, Vue and TypeScript.

## Project rules

- **Modules:** each tool is a module in `woke/` (`main/src/woke/`, `renderer/src/web/woke/`), listed in the registry at `renderer/src/web/woke/modules.ts`.
- **APT core stays untouched** so upstream merges stay easy.
- **Mockups first:** every new feature gets design mockups with options, shown to Guy before building.
- **Nothing permanently on screen during gameplay:** situational info sits behind hover icons. Only one-off popups, such as price check, may show by themselves.
- **Tests:** CI runs on every PR, and each feature adds a test or scenario in `testing/`.
- **Performance:** new pollers tick only while needed. CI enforces perf budgets.

## Local setup

- League: Allflame
- PoE is installed on F:
