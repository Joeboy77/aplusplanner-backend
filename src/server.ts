import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cookieParser from 'cookie-parser'
import { swaggerUi, swaggerDocs } from "./config/swagger";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import assignmentRoutes from "./routes/assignmentRoutes";
import paymentRoutes from "./routes/paymentRoutes";


dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true,
}));
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Swagger API Docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/assignments", assignmentRoutes)
app.use("/api/payments", paymentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📄 Swagger UI: http://localhost:${PORT}/api-docs`);
});
