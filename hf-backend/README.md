---
title: Oxinto Backend
emoji: 🚀
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
license: mit
app_port: 7860
short_description: Oxinto AI — Node.js backend API
---

# Oxinto Backend API

Node.js/Express backend for authentication, sessions, products, and webhooks.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/send-otp` | Register (step 1) |
| POST | `/api/auth/verify-otp` | Register (step 2) |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/webhook/web` | Web chat |
| GET | `/api/products` | Product catalog |
