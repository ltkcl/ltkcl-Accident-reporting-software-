import { Router } from "express";
import userRouter from "./user.routes.js";
import adminRoutes from "./admin.routes.js";
const mainRoutes = Router();
console.log("main end point reached")
mainRoutes.use('/users',userRouter);
mainRoutes.use('/admin',adminRoutes);

export default mainRoutes;
