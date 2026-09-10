import express from 'express';
import { query } from '../db.js';
import { hashPassword, verifyPassword, signToken, auth, adminOnly } from '../auth.js';
const router = express.Router();

router.post('/login', async (req,res,next)=>{
  try {
    const {username,password} = req.body;
    const [rows] = await query('SELECT * FROM users WHERE username=? LIMIT 1',[username]);
    const user=rows[0];
    if(!user || !user.status || !(await verifyPassword(password||'',user.password_hash))) return res.status(401).json({message:'账号或密码错误'});
    res.json({token:signToken(user), user:{id:user.id,username:user.username,displayName:user.display_name,role:user.role}});
  } catch(e){next(e)}
});
router.get('/me',auth,(req,res)=>res.json({user:req.user}));
router.post('/change-password',auth,async(req,res,next)=>{
  try { const {oldPassword,newPassword}=req.body; const [rows]=await query('SELECT * FROM users WHERE id=?',[req.user.id]); const ok=await verifyPassword(oldPassword||'',rows[0].password_hash); if(!ok) return res.status(400).json({message:'旧密码错误'}); await query('UPDATE users SET password_hash=? WHERE id=?',[await hashPassword(newPassword),req.user.id]); res.json({message:'密码修改成功'});} catch(e){next(e)}
});
router.get('/users',auth,adminOnly,async(req,res,next)=>{ try{const [rows]=await query('SELECT id,username,display_name,role,status,created_at,updated_at FROM users ORDER BY id DESC');res.json({items:rows});}catch(e){next(e)} });
router.post('/users',auth,adminOnly,async(req,res,next)=>{ try{const {username,password,displayName,role='employee'}=req.body; if(!username||!password||!displayName)return res.status(400).json({message:'请填写完整信息'}); const [r]=await query('INSERT INTO users (username,password_hash,display_name,role) VALUES (?,?,?,?)',[username,await hashPassword(password),displayName,role]);res.json({id:r.insertId});}catch(e){ if(e.code==='23505') return res.status(400).json({message:'账号已存在'}); next(e)} });
router.patch('/users/:id/status',auth,adminOnly,async(req,res,next)=>{try{await query('UPDATE users SET status=? WHERE id=?',[Number(req.body.status)?1:0,req.params.id]);res.json({message:'状态已更新'})}catch(e){next(e)}});
router.patch('/users/:id/password',auth,adminOnly,async(req,res,next)=>{try{await query('UPDATE users SET password_hash=? WHERE id=?',[await hashPassword(req.body.password),req.params.id]);res.json({message:'密码已重置'})}catch(e){next(e)}});
export default router;
