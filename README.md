# 🚨 ResQ-Link  
### _Connecting Lives. Responding Faster. Saving Time._

<p align="center">
  <img src="https://img.shields.io/github/stars/I-AM-A-PROGRAMER/ResQ-Link?style=for-the-badge" />
  <img src="https://img.shields.io/github/forks/I-AM-A-PROGRAMER/ResQ-Link?style=for-the-badge" />
  <img src="https://img.shields.io/github/issues/I-AM-A-PROGRAMER/ResQ-Link?style=for-the-badge" />
  <img src="https://img.shields.io/github/license/I-AM-A-PROGRAMER/ResQ-Link?style=for-the-badge" />
</p>

<p align="center">
  <strong>ResQ-Link</strong> is a full-stack emergency response and coordination platform built to modernize how crisis reports are submitted, tracked, and resolved.
</p>

---

## 🌍 About the Project

In real-world emergencies, communication breakdowns cost lives.  
**ResQ-Link** centralizes emergency reporting and response coordination into a single, secure, and scalable system.

It is designed for **speed**, **clarity**, and **reliability** — ensuring the right help reaches the right place at the right time.

---

## ✨ Key Features

- 🚑 Emergency request submission  
- 🧭 Centralized request dashboard  
- 🔐 Secure authentication & authorization  
- 📡 Real-time status updates  
- 📱 Fully responsive UI  
- ⚡ Scalable backend architecture  
- 🗂️ Clean separation of frontend & backend  

---

## 🧠 Tech Stack

### Frontend
- HTML, CSS, JavaScript  
- Responsive UI design  

### Backend
- Node.js  
- Express.js  
- RESTful APIs  

### Database
- MongoDB / PostgreSQL  

### Security
- JWT-based authentication  
- Environment variable configuration  

---

## 📁 Project Structure

```
ResQ-Link/
├── backend/
├── frontend/
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/I-AM-A-PROGRAMER/ResQ-Link.git
cd ResQ-Link
```

---

### Backend Setup

```bash
cd backend
npm install
```

Create `.env`:

```
PORT=5000
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
```

Start backend:

```bash
npm start
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

## 🔌 API Overview

| Method | Endpoint | Description |
|------|---------|------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| POST | /api/requests | Create request |
| GET  | /api/requests | Get requests |

---

## 🤝 Contributing

1. Fork the repo  
2. Create a branch  
3. Commit changes  
4. Push and open PR  

---

## 📜 License

MIT License

---

## ⭐ Support

If this helped you, give it a star.
