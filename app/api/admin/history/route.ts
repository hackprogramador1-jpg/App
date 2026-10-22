import { db, isAdmin, json } from "@/lib/server";
export const runtime="nodejs";
export async function GET(req:Request){
 if(!isAdmin(req)) return json({error:"Não autorizado."},401);
 try{
  const {data,error}=await db().from("notification_history").select("id,title,body,sent,failed,created_at").order("created_at",{ascending:false}).limit(30);
  if(error) throw error;
  return json({items:data||[]});
 }catch(e){return json({error:e instanceof Error?e.message:"Falha ao carregar histórico."},500);}
}
