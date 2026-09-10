import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
export const signToken = (user) => jwt.sign({ id:user.id, username:user.username, displayName:user.display_name, role:user.role }, process.env.JWT_SECRET, { expiresIn:'12h' });
export const hashPassword = (p) => bcrypt.hash(p, 12);
export const verifyPassword = (p,h) => bcrypt.compare(p,h);
export const auth = (req,res,next) => {
  try {
    const raw = req.headers.authorization || '';
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
    if (!token) return res.status(401).json({message:'未登录'});
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({message:'登录已过期，请重新登录'}); }
};
export const adminOnly = (req,res,next) => req.user?.role === 'admin' ? next() : res.status(403).json({message:'无权限'});
