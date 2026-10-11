export const taka=(amount:number)=>new Intl.NumberFormat('en-BD',{style:'currency',currency:'BDT',maximumFractionDigits:0}).format(amount).replace('BDT','৳');
