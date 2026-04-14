# LinkNest 🚀

A smart single-link hub platform (like Linktree, but smarter) that lets users create hubs of multiple links with advanced rules such as time-based and device-based visibility.

---

##  Features

* User authentication (Signup / Login)
* Create multiple hubs per user
* Add unlimited links to each hub
* Attach smart rules to each link:

* Time-based rules (days + time range)
* Device-based rules (mobile / tablet / desktop)
* Public shareable hub links (`/r/{slug}`)
* Rule-aware rendering of links on public page

---

##  Tech Stack

### Backend

* FastAPI (Python)
* MongoDB (Atlas )
* PyMongo
* Passlib (password hashing)
* Cloudinary (profile image uploads)

### Frontend

* HTML, TailwindCSS
* Vanilla JavaScript

---

##  Project Structure

```
.qodo/backend/
  ├── main.py
  ├── database.py
  ├── requirements.txt
  └── .env

.qodo/frontend/
  ├── HomePage/
  ├── Acoount setting/
  ├── Analytic/
  ├── Landing Page/
  ├── Login/
  ├── HubPage/
  ├── MyHubs/
  ├── Viewer Page/
  ├── Popup/
  └── index.html
```

---

##  Backend Setup

### 1️. Clone Repository

```bash
git clone https://github.com/divyanshu0806/LinkNest
cd D:\LinkNest\.qodo\Backend




### 2️ Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
```

---

### 3️ Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 4️ Environment Variables

Create a `.env` file inside `backend/`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smartlinkx
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

### 5️ Run Backend Server

```bash
uvicorn main:app --reload
```

Backend will be available at:

```
http://127.0.0.1:8000
```

---

##  Public URL for Hackathon Demo (Ngrok)

Expose your local backend to the internet:

```bash
ngrok http 8000
```

It will generate a public URL like:

```
https://abcd1234.ngrok-free.app
```

Use this base URL to generate Viewer side links:

```
https://abcd1234.ngrok-free.app/r/{slug}
```

---

##  API Documentation

### Health Check

**GET** `/api/health`

```json
{
  "status": "ok",
  "msg": "Backend connected!"
}
```

---

### Signup

**POST** `/api/signup`

```json
{
  "name": "Team Ur4nium",
  "email": "Ur4nium@example.com",
  "password": "secret123"
}
```

---

### Login

**POST** `/api/login`

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

---

### Create Hub

**POST** `/api/hubs`

```json
{
  "user_email": "john@example.com",
  "title": "John's Links",
  "description": "My personal hub",
  "slug": "john-doe",
  "accentColor": "#22c55e",
  "background": "black",
  "links": [
    {
      "title": "YouTube",
      "url": "https://youtube.com",
      "rules": [
        {
          "rule_id": "uuid",
          "type": "time",
          "days": ["Mon", "Tue"],
          "start_time": "09:00",
          "end_time": "12:00",
          "timezone": "visitor"
        }
      ]
    }
  ]
}
```

---

### Get User Hubs

**GET** `/api/hubs/{email}`

---

### Get Hub by Slug (Public)

**GET** `/api/hub/{slug}`

---

### My Stats

**GET** `/api/my-stats?email=john@example.com`

---

##  Public Hub Routing

Public hub link format:

```
/r/{slug}
```

Example:

```
https://abcd1234.ngrok-free.app/r/john-doe
```

This page fetches:

```
GET /api/hub/john-doe
```

---

##  Rule Evaluation Logic (Frontend)

Each link contains a `rules` array.

At render time:

* If no rules → link is visible
* If rules exist → evaluate all

  * Time rule:

    * Check visitor day
    * Check time range
  * Device rule:

    * Detect user agent

Only show link if all rules pass.

---

##  Hackathon Note

For demo purposes, the backend is run locally .

In production, the system would be deployed to a cloud server with:

* Custom domain
* HTTPS
* CDN

---

## Future Improvements

* Ad system 
* More customisation and rule
* Team collaboration
* Custom domains

---

---

##  License

MIT License
