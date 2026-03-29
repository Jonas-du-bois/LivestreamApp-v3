import { createRouter, createError } from "radix3";

const router = createRouter();

router.insert("/api/admin/seed", { payload: "this is seed" });

console.log("lowercase:", router.lookup("/api/admin/seed"));
console.log("uppercase:", router.lookup("/Api/Admin/seed"));
