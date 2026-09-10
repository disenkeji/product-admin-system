import express from 'express';
import {query} from '../db.js';
import {auth,adminOnly} from '../auth.js';
const router=express.Router();
router.get('/',auth,async(req,res,next)=>{try{const [rows]=await query('SELECT id,parent_id,name,level,sort_order,created_at,updated_at FROM categories ORDER BY level,sort_order,id');res.json({items:rows});}catch(e){next(e)}});
router.post('/',auth,adminOnly,async(req,res,next)=>{try{const {parentId=null,name,sortOrder=0}=req.body; if(!name?.trim())return res.status(400).json({message:'分类名称不能为空'}); let level=1; if(parentId){const [p]=await query('SELECT level FROM categories WHERE id=?',[parentId]); if(!p[0])return res.status(400).json({message:'父分类不存在'}); level=p[0].level+1; if(level>3)return res.status(400).json({message:'最多三级分类'});} const [r]=await query('INSERT INTO categories(parent_id,name,level,sort_order) VALUES(?,?,?,?)',[parentId,name.trim(),level,sortOrder]);res.json({id:r.insertId});}catch(e){next(e)}});
router.put('/:id',auth,adminOnly,async(req,res,next)=>{try{const {name,sortOrder}=req.body;await query('UPDATE categories SET name=COALESCE(?,name),sort_order=COALESCE(?,sort_order) WHERE id=?',[name?.trim()||null,sortOrder??null,req.params.id]);res.json({message:'已更新'})}catch(e){next(e)}});
router.delete('/:id',auth,adminOnly,async(req,res,next)=>{try{const [p]=await query('SELECT COUNT(*) c FROM products WHERE category_id=?',[req.params.id]); if(p[0].c>0)return res.status(400).json({message:'该分类下仍有产品，不能删除'}); await query('DELETE FROM categories WHERE id=?',[req.params.id]);res.json({message:'已删除'})}catch(e){next(e)}});
export default router;
