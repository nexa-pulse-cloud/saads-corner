export function makeOrderNumber(){ return `SC-${new Date().getFullYear()}-${crypto.randomUUID().replace(/-/g,'').slice(0,8).toUpperCase()}`; }
export function deliveryForDistrict(district:string, inside:number, outside:number){return district.trim().toLowerCase()==='rajshahi'?inside:outside;}
