import axios from 'axios';import router from './router';
export const api=axios.create({baseURL:'/api'});
api.interceptors.request.use(c=>{const t=localStorage.getItem('token');if(t)c.headers.Authorization=`Bearer ${t}`;return c});
api.interceptors.response.use(r=>r,e=>{if(e.response?.status===401){localStorage.removeItem('token');localStorage.removeItem('user');router.push('/login')}return Promise.reject(e)});
export const fmtDate=v=>v?new Date(v).toLocaleString('zh-CN',{hour12:false}):'';
