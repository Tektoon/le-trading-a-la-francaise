// Service Worker minimal — pas de cache pour éviter les problèmes
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
// Pas d'intercepttion fetch — tout passe par le réseau normalement
