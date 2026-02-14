## 2025-05-24 - MongoDB Populate Field Selection
**Learning:** Using Mongoose `populate` without field selection retrieves the entire referenced document, which can include large arrays (like `history`) that are unnecessary for the view, significantly inflating payload size.
**Action:** Always specify `select` in `populate` options when only a subset of fields is needed, especially for models with potentially large nested structures.
