# Fashion Shop 👔👗

Telegram Mini App bilan to'liq e-commerce platforma. Foydalanuvchilar katalogni ko'rishi, mahsulot buyurtma qilishi, to'lovi qilishi va buyurtmalarini kuzatishi mumkin.

## 🚀 Xususiyatlar

- ✅ Telegram Mini App integratsiyasi
- ✅ Telegram Bot asosida qidiruv va katalog
- ✅ Mahsulot katalogi va toifalar
- ✅ Savatcha va sevimlilar
- ✅ Buyurtma tizimi
- ✅ To'lov integratsiyasi (Payme, Click)
- ✅ Admin paneli
- ✅ Rasm yuklash (Cloudinary)
- ✅ JWT autentifikatsiyasi
- ✅ Responsive dizayn

## 📋 Talablar

- Node.js >= 14
- MongoDB
- Telegram Bot Token
- Cloudinary akkaunt
- To'lov tizimlari API kalitlari

## 🔧 O'rnatish

### 1. Repositoriyani klonlash
```bash
git clone https://github.com/SuxrobMamadaliyev/fashion-shop.git
cd fashion-shop
```

### 2. Dependensiyalarni o'rnatish
```bash
npm install
```

### 3. Environment o'zgaruvchilarini sozlash
```bash
cp .env.example .env
```

`.env` faylini tahrirlang va quyidagilarni to'ldiring:
- MongoDB URI
- Telegram Bot Token
- Cloudinary ma'lumotlari
- To'lov tizimlari kalitlari

### 4. Serverni ishga tushirish

**Ishlab chiqish rejimi:**
```bash
npm run dev
```

**Ishlab chiqarish rejimi:**
```bash
npm start
```

## 📁 Loyiha Strukturasi

```
fashion-shop/
├── src/
│   ├── server.js           # Asosiy Express server
│   ├── config/             # Konfiguratsiyalar
│   ├── models/             # Mongoose sxemalari
│   ├── controllers/        # Biznes-logika
│   ├── routes/             # API endpointlar
│   ├── middleware/         # Middleware funktsiylari
│   ├── utils/              # Yordamchi funktsiylari
│   └── bot/                # Telegram Bot
└── public/                 # Frontend (Mini App)
    ├── index.html
    ├── css/
    ├── js/
    └── admin/              # Admin paneli
```

## 🔌 API Endpointlar

### Authentication
- `POST /api/auth/login` - Kirish
- `POST /api/auth/register` - Ro'yxatdan o'tish
- `GET /api/auth/me` - Joriy foydalanuvchi

### Mahsulotlar
- `GET /api/products` - Barcha mahsulotlar
- `GET /api/products/:id` - Bir mahsulot
- `GET /api/categories` - Toifalar

### Savatcha
- `GET /api/cart` - Savatcha
- `POST /api/cart` - Mahsulot qo'shish
- `PUT /api/cart/:id` - Miqdorni o'zgartirish
- `DELETE /api/cart/:id` - O'chirish

### Buyurtmalar
- `POST /api/orders` - Yangi buyurtma
- `GET /api/orders` - Mening buyurtmalarim
- `GET /api/orders/:id` - Buyurtma tafsilotlari

### Admin
- `POST /api/admin/products` - Mahsulot qo'shish
- `PUT /api/admin/products/:id` - O'zgartirish
- `DELETE /api/admin/products/:id` - O'chirish

## 🤖 Telegram Bot Komandalari

- `/start` - Boshlanish
- `/catalog` - Katalog
- `/cart` - Savatcha
- `/orders` - Buyurtmalar
- `/profile` - Profil
- `/admin` - Admin paneli

## 💳 To'lov Tizimi

Quyidagi to'lov tizimlari qo'llab-quvvatlanadi:
- Payme
- Click

## 🔐 Xavfsizlik

- JWT autentifikatsiyasi
- Telegram initData HMAC tekshiruvi
- CORS sozlamalari
- Rate limiting
- Helmet middleware
- Input validatsiyasi

## 📝 Litsenziya

MIT Litsenziyasi - batafsil uchun LICENSE faylini ko'ring

## 👥 Muallif

**Suxrob Mamadaliyev**
- GitHub: [@SuxrobMamadaliyev](https://github.com/SuxrobMamadaliyev)

## 📞 Aloqa

Savollar yoki takliflar bo'lsa, issue ochin yoki pull request yuboring.
