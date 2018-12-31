

let aa=[{"id":1},{"id":2}];

for(let ar in aa){
  console.log(ar);    
  if(aa[ar].id==2){
    aa.splice(ar,1);
  }
};
console.log(aa);
