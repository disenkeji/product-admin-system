import express from 'express';import cors from 'cors';import dotenv from 'dotenv';import path from 'path';import {fileURLToPath} from 'url';
import authRoutes from './routes/auth.js';import categoryRoutes from './routes/categories.js';import productRoutes from './routes/products.js';import uploadRoutes from './routes/upload.js';import {errorHandler} from './middleware/error.js';import {pool, query} from './db.js';import {hashPassword} from './auth.js';import {ensureSchema} from './schema.js';
dotenv.config();
const app=express();const __dirname=path.dirname(fileURLToPath(import.meta.url));
app.use(cors({origin:process.env.CORS_ORIGIN||'http://localhost:5173'}));app.use(express.json({limit:'2mb'}));app.use('/uploads',express.static(path.resolve(process.cwd(),process.env.UPLOAD_DIR||'uploads')));
app.get('/api/health',(req,res)=>res.json({ok:true}));app.use('/api/auth',authRoutes);app.use('/api/categories',categoryRoutes);app.use('/api/products',productRoutes);app.use('/api/upload',uploadRoutes);
const webDist=path.resolve(process.cwd(),'../web/dist');
app.use(express.static(webDist));
app.get(/^(?!\/api)(?!\/uploads).*/, (req,res)=>res.sendFile(path.join(webDist,'index.html')));
app.use(errorHandler);
const port=Number(process.env.PORT||3000);
async function bootstrap(){
 try{await pool.query('SELECT 1'); await ensureSchema(); const [rows]=await query('SELECT id FROM users WHERE username=? LIMIT 1',['admin']); if(!rows[0]){await query('INSERT INTO users(username,password_hash,display_name,role) VALUES(?,?,?,?)',['admin',await hashPassword('Admin@123456'),'系统管理员','admin']); console.log('Created default admin: admin / Admin@123456');} app.listen(port,()=>console.log(`API running on http://localhost:${port}`));}
 catch(e){console.error('Database connection failed:',e.message);process.exit(1)}
}
bootstrap();
