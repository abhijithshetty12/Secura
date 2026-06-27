# 🛡️ Secura

[![Live Demo](https://img.shields.io/badge/Live_Demo-000000?style=flat&logo=vercel&logoColor=white)](https://secura-vault.vercel.app/)
![React](https://img.shields.io/badge/React_18-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Database-FFFFFF?style=flat&logo=firebase&logoColor=orange)

**Secura** is a high-security, zero-knowledge micro-document management system engineered for safeguarding critical identity and asset records. Built using **React 18**, **TypeScript**, and **Tailwind CSS**, it features a refined glassmorphic dashboard that allows users to instantly upload, view, sort, and organize sensitive payloads (such as Aadhaar, PAN, and Voter IDs). Emphasizing premium privacy, Secura features zero-overhead client-side Base64 streaming and an instant, tab-focus reactive security lock system.

---

## 🚀 Key Features

* **🔒 Adaptive Tab-Switch Session Lock:** Instantly locks and masks the interface with a glassmorphic overlay the exact moment a user minimizes the window, switches browser tabs, or shifts desktop focus.
* **⌨️ Mobile-Optimized 6-Digit PIN Re-Auth:** Features a highly responsive visual state synced directly with a hidden semantic input trap. Pulls up native iOS/Android numeric keypads smoothly while accepting seamless physical keyboard inputs.
* **⚡ Zero-Knowledge Document Ingestion:** Upload and parse document payloads directly to custom directory segments using lightweight client-side Base64 data streaming.
* **📁 Directory Segmentation:** Intuitively map asset records across specific document categories (`Aadhaar`, `PAN`, `Voter ID`, `Other`) with dedicated visual typography and asset metadata indicators.
* **🎯 Fuzzy-Match Advanced Search:** Deep filtering engine using multi-word sequential fuzzy matching to index filenames rapidly despite long terms or complex syntax.
* **🔄 Live Firestore Syncing:** Real-time collection streams tracking structural document updates, custom dynamic inline name edits, and file deletions instantaneously.
* **📱 Ultra-Modern Bento Dashboard:** A responsive layout crafted with subtle borders, deep glassmorphic highlights, and micro-interactions optimized for mobile and desktop screens.

---

## 🛠️ Tech Stack

| Category | Tools |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, Lucide React (Icons), Glassmorphic Blur Utilities |
| **Backend / Database** | Firebase Authentication & Cloud Firestore |
| **Parsing Engine** | PDF.js Dist Worker Rendering Streams |
| **Deployment** | Vercel (Production Toolchain Workflow) |

---

## 🖼️ Interface Preview

### Core Vault Experience
| **Login & Identity Gate** | **Secure Asset Dashboard** |
| :---: | :---: |
| <img src="/screenshots/auth-gate.png" alt="Auth Page" /> | <img src="/screenshots/dashboard-core.png" alt="Dashboard Core" /> |

### Security & Actions
| **Tab-Switch Session Lock** | **Inline Asset Metadata Modification** |
| :---: | :---: |
| <img src="/screenshots/session-lock.png" alt="Vault Session Lock" /> | <img src="/screenshots/inline-edit.png" alt="Inline Modification" /> |

### Data Management
| **Segment Filtering & Fuzzy Search** | **Zero-Knowledge Inline Viewer** |
| :---: | :---: |
| <img src="/screenshots/search-filter.png" alt="Advanced Filters" /> | <img src="/screenshots/asset-preview.png" alt="Asset Preview" /> |

---

## 👨‍💻 Author

**Abhijith Shetty** *Front-End Web Developer & UI Enthusiast*

> "Passionate about building modern, user-friendly web applications that blend aesthetic design principles with strong technical architectures."

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/abhijithshetty12)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/abhijithshetty12)

---

## 🌟 Show Your Support

If you love the security workflow or find the glassmorphic implementation helpful, please drop a ⭐ on **GitHub**! It means a lot and keeps me inspired to build clean digital interfaces.