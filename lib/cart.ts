export type CartItem={product_id:string;slug:string;name:string;price:number;discount_percent:number;quantity:number;image:string;stock:number};
export const CART_KEY='saads-corner-cart-v1';
export function readCart():CartItem[]{if(typeof window==='undefined')return[];try{return JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch{return[]}}
export function saveCart(items:CartItem[]){if(typeof window!=='undefined')localStorage.setItem(CART_KEY,JSON.stringify(items))}
export function currentPrice(p:Pick<CartItem,'price'|'discount_percent'>){return Math.round(p.price*(1-(p.discount_percent||0)/100))}
