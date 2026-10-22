import webpush from "web-push";
import { configurePush, db, isAdmin, json } from "@/lib/server";
export const runtime="nodejs";
export async function POST(req:Request){
 if(!isAdmin(req)) return json({error:"Não autorizado."},401);
 try{
  configurePush();
  const data=await req.json();
  const title=String(data?.title||"").trim().slice(0,100);
  const body=String(data?.body||"").trim().slice(0,500);
  if(!title||!body) return json({error:"Informe título e mensagem."},400);
  const client=db();
  const {data:subs,error}=await client.from("push_subscriptions").select("endpoint,subscription");
  if(error) throw error;
  let sent=0,failed=0;
  for(const row of subs||[]){
   try{
    await webpush.sendNotification(row.subscription,{title,body,url:"/"},{TTL:60*60});
    sent++;
   }catch(e){
    failed++;
    const code=(e as {statusCode?:number})?.statusCode;
    if(code===404||code===410) await client.from("push_subscriptions").delete().eq("endpoint",row.endpoint);
   }
  }
  const {error:logError}=await client.from("notification_history").insert({title,body,sent,failed});
  if(logError) console.error("Falha ao registrar histórico",logError.message);
  return json({ok:true,sent,failed,total:(subs||[]).length});
 }catch(e){console.error(e);return json({error:e instanceof Error?e.message:"Falha ao enviar notificações."},500);}
}
