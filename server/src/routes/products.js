import express from 'express';
import {query} from '../db.js';
import {auth,adminOnly} from '../auth.js';
const router=express.Router();
const fields=(role)=>role==='admin'?'p.id,p.category_id,p.model,p.name,p.image,p.price,p.cost,p.created_at,p.updated_at':'p.id,p.category_id,p.model,p.name,p.image,p.price,p.created_at,p.updated_at';
router.get('/',auth,async(req,res,next)=>{try{
  const {categoryId,keyword,page=1,pageSize=20}=req.query; const where=[],params=[];
  if(categoryId){where.push('p.category_id=?');params.push(categoryId)}
  if(keyword){where.push('(p.model ILIKE ? OR p.name ILIKE ?)');params.push(`%${keyword}%`,`%${keyword}%`)}
  const w=where.length?'WHERE '+where.join(' AND '):''; const limit=Math.min(Number(pageSize)||20,100); const offset=(Math.max(Number(page),1)-1)*limit;
  const [count]=await query(`SELECT COUNT(*) total FROM products p ${w}`,params); const [rows]=await query(`SELECT ${fields(req.user.role)} FROM products p ${w} ORDER BY p.id DESC LIMIT ? OFFSET ?`,[...params,limit,offset]); res.json({items:rows,total:count[0].total,page:Number(page),pageSize:limit});
}catch(e){next(e)}});
router.get('/:id',auth,async(req,res,next)=>{try{const [rows]=await query(`SELECT ${fields(req.user.role)} FROM products p WHERE p.id=?`,[req.params.id]); if(!rows[0])return res.status(404).json({message:'产品不存在'});res.json({item:rows[0]})}catch(e){next(e)}});
router.post('/',auth,adminOnly,async(req,res,next)=>{try{const {categoryId,model,name,image=null,price,cost}=req.body; if(!categoryId||!model||!name)return res.status(400).json({message:'请填写分类、型号、名称'}); const [r]=await query('INSERT INTO products(category_id,model,name,image,price,cost) VALUES(?,?,?,?,?,?)',[categoryId,model,name,image,Number(price||0),Number(cost||0)]);res.json({id:r.insertId});}catch(e){next(e)}});
router.put('/:id',auth,adminOnly,async(req,res,next)=>{try{const {categoryId,model,name,image,price,cost}=req.body;await query('UPDATE products SET category_id=?,model=?,name=?,image=?,price=?,cost=? WHERE id=?',[categoryId,model,name,image||null,Number(price||0),Number(cost||0),req.params.id]);res.json({message:'已更新'})}catch(e){next(e)}});
router.delete('/:id',auth,adminOnly,async(req,res,next)=>{try{await query('DELETE FROM products WHERE id=?',[req.params.id]);res.json({message:'已删除'})}catch(e){next(e)}});
export default router;
