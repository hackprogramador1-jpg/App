import webpush from "web-push";
import { configurePush, db, json } from "@/lib/server";
export const runtime="nodejs";
export async function GET(req:Request){
 const secret=process.env.CRON_SECRET;
 const auth=req.headers.get("authorization");
 if(!secret||auth!=="Bearer "+secret) return json({error:"Não autorizado."},401);
 try{
  configurePush();
  const client=db();
  const now=new Date().toISOString();
  const {data:jobs,error}=await client.from("scheduled_notifications").select("*").eq("status","pending").lte("send_at",now).order("send_at",{ascending:true}).limit(10);
  if(error) throw error;
  let processed=0;
  for(const job of jobs||[]){
   const {data:claim,error:claimError}=await client.from("scheduled_notifications").update({status:"processing"}).eq("id",job.id).eq("status","pending").select("id");
   if(claimError||!claim?.length) continue;
   try{
    const {data:subs,error:subError}=await client.from("push_subscriptions").select("endpoint,subscription");
    if(subError) throw subError;
    let sent=0,failed=0;
    for(const row of subs||[]){
     try{await webpush.sendNotification(row.subscription,{title:job.title,body:job.body,url:job.url||"/"},{TTL:3600});sent++;}
     catch(e){failed++;const code=(e as {statusCode?:number})?.statusCode;if(code===404||code===410) await client.from("push_subscriptions").delete().eq("endpoint",row.endpoint);}
    }
    await client.from("notification_history").insert({title:job.title,body:job.body,sent,failed});
    await client.from("scheduled_notifications").update({status:"sent",processed_at:new Date().toISOString()}).eq("id",job.id);
    processed++;
   }catch(e){console.error("Scheduled notification failed",job.id,e);await client.from("scheduled_notifications").update({status:"pending",last_error:e instanceof Error?e.message:"Unknown error"}).eq("id",job.id);}
  }
  return json({ok:true,processed});
 }catch(e){console.error(e);return json({error:e instanceof Error?e.message:"Cron failed"},500);}
}
