const BASE=process.env.REACT_APP_API_URL||'/api';
async function call(path,options={}){let response;try{response=await fetch(BASE+path,{...options,headers:{'Content-Type':'application/json',...options.headers}})}catch{throw Error('Cannot connect to the API. Is the backend running?')}const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||'Request failed');return data}
export const listPools=()=>call('/pools');
export const getPool=id=>call('/pools/'+encodeURIComponent(id));
export const createPool=pool=>call('/pools',{method:'POST',body:JSON.stringify(pool)});
export const claimSquare=(id,index,owner)=>call('/pools/'+encodeURIComponent(id)+'/squares/'+index,{method:'PATCH',body:JSON.stringify({owner})});
export const shufflePool=id=>call('/pools/'+encodeURIComponent(id)+'/shuffle',{method:'POST'});
export const getCurrentUser=()=>call('/auth/me');
export const login=(email,password)=>call('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
export const register=(email,password,firstName,lastName)=>call('/auth/register',{method:'POST',body:JSON.stringify({email,password,firstName,lastName})});
export const googleLogin=credential=>call('/auth/google',{method:'POST',body:JSON.stringify({credential})});
export const logout=()=>call('/auth/logout',{method:'POST'});

export const searchPools=q=>call('/pools/search?q='+encodeURIComponent(q));
export const listJoinedPools=()=>call('/pools/joined');
export const joinPool=(id,password)=>call('/pools/'+encodeURIComponent(id)+'/join',{method:'POST',body:JSON.stringify({password})});
