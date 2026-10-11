import { z } from 'zod';
export const bdPhone = /^01[3-9]\d{8}$/;
export const orderSchema = z.object({
  request_key:z.string().uuid(), customer_name:z.string().trim().min(2).max(100), phone:z.string().trim().regex(bdPhone,'বাংলাদেশি ১১ সংখ্যার মোবাইল নম্বর দিন'),
  address:z.string().trim().min(8).max(500), district:z.string().trim().min(2).max(80), area:z.string().trim().min(2).max(120),
  note:z.string().max(500).optional().default(''), payment_method:z.enum(['cod','bkash','nagad']), transaction_id:z.string().max(100).optional().default(''),
  items:z.array(z.object({product_id:z.string().uuid(),quantity:z.number().int().min(1).max(20)})).min(1).max(50), website:z.string().optional().default('')
}).superRefine((v,ctx)=>{ if(v.website) ctx.addIssue({code:'custom',path:['website'],message:'Invalid submission'}); if(v.payment_method!=='cod'&&!v.transaction_id.trim())ctx.addIssue({code:'custom',path:['transaction_id'],message:'Transaction ID required'}); });
export const reviewSchema = z.object({product_id:z.string().uuid(),name:z.string().trim().min(2).max(80),rating:z.number().int().min(1).max(5),comment:z.string().trim().max(1000).optional().default(''),website:z.string().optional().default('')});
export function normalizePhone(s:string){return s.replace(/[\s-]/g,'');}
