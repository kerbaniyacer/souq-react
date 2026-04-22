# Product Image Import

ضع الصور التي تريد ربطها بالمنتجات هنا:

- `backend/media/imports/products/`

ثم انسخ الملف التالي:

- `backend/product_image_manifest.example.json`

إلى:

- `backend/product_image_manifest.json`

وعدّل القيم داخله بحيث تكتب:

- `slug` المنتج
- `filenames` أسماء الصور داخل مجلد الاستيراد
- `alt_text` وصف اختياري
- `clear_existing` إذا كنت تريد استبدال الصور القديمة

ثم شغّل الأمر:

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py import_product_images --settings=config.settings.development
```

إذا أردت حذف الصور القديمة لكل منتج قبل الربط:

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py import_product_images --clear-existing --settings=config.settings.development
```

ملاحظات:

- أول صورة في `filenames` تصبح الصورة الرئيسية
- الصور تُربط تلقائيًا بالمتغير الرئيسي للمنتج
- الصور تُنسخ إلى `backend/media/variants/<product-slug>/`
