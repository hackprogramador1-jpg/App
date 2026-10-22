 "use client";
import { useEffect, useState } from "react";

type Notice={id:string;title:string;body:string;created_at:string};
const keyName="wkora-notify-admin-key";
export default function Home(){
 const [supported,setSupported]=useState(false),[subscribed,setSubscribed]=useState(false);
 const [status,setStatus]=useState("Ative as notificações para receber um teste neste dispositivo.");
 const [title,setTitle]=useState("Aviso da WKORA"),[body,setBody]=useState("Esta é uma notificação de teste do WKORA NOTIFY.");
 const [adminKey,setAdminKey]=useState(""),[items,setItems]=useState<Notice[]>([]),[busy,setBusy]=useState(false);
 useEffect(()=>{setSupported(typeof window!=="undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window);setAdminKey(sessionStorage.getItem(keyName)||"");},[]);
 async function enablePush(){
  setBusy(true);try{
   if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window))throw new Error("Este navegador não oferece suporte a Web Push.");
   if(!window.isSecureContext)throw new Error("Notificações exigem HTTPS (ou localhost durante desenvolvimento).");
   const permission=await Notification.requestPermission();if(permission!=="granted")throw new Error("Permissão não concedida. Altere a permissão do site nas configurações do navegador.");
   const reg=await navigator.serviceWorker.register("/sw.js");
   const r=await fetch("/api/push/public-key");const d=await r.json();if(!r.ok)throw new Error(d.error||"Não foi possível carregar a chave pública.");
   const key=urlBase64ToUint8Array(d.publicKey);
   const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
   const save=await fetch("/api/push/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subscription:sub.toJSON()})});
   const saved=await save.json();if(!save.ok)throw new Error(saved.error||"Falha ao registrar dispositivo.");
   setSubscribed(true);setStatus("Dispositivo inscrito. Agora envie uma notificação de teste pelo painel administrativo.");
  }catch(e){setStatus(e instanceof Error?e.message:"Erro inesperado.");}finally{setBusy(false);}
 }
 async function send(){
  if(!adminKey.trim()){setStatus("Informe a chave administrativa configurada nas variáveis de ambiente.");return}
  setBusy(true);sessionStorage.setItem(keyName,adminKey);
  try{const r=await fetch("/api/admin/send",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+adminKey},body:JSON.stringify({title,body})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Falha no envio.");setStatus(`Envio concluído: ${d.sent} enviado(s), ${d.failed} falha(s).`);}
  catch(e){setStatus(e instanceof Error?e.message:"Erro inesperado.");}finally{setBusy(false);}
 }
 async function loadHistory(){
  if(!adminKey.trim()){setStatus("Informe a chave administrativa primeiro.");return}
  setBusy(true);try{const r=await fetch("/api/admin/history",{headers:{Authorization:"Bearer "+adminKey}});const d=await r.json();if(!r.ok)throw new Error(d.error||"Falha ao carregar histórico.");setItems(d.items||[]);setStatus("Histórico atualizado.");}catch(e){setStatus(e instanceof Error?e.message:"Erro inesperado.");}finally{setBusy(false);}
 }
 return <main className="shell">
  <header className="top"><div className="brand"><span className="gold">WKORA</span> NOTIFY</div><span className="pill">WEB PUSH • V1</span></header>
  <section className="hero"><div className="gold small">CENTRAL DE NOTIFICAÇÕES</div><h1>Seus avisos.<br/><span className="gold">No momento certo.</span></h1><p className="muted">Inscreva este dispositivo para receber notificações e use o painel autorizado para enviar avisos aos usuários inscritos.</p></section>
  <div className="grid">
   <section className="card"><h2>01 / Este dispositivo</h2><p className="muted">Permita notificações para registrar este navegador. Em Android, use o site HTTPS no Chrome e aceite a permissão.</p><div className="row"><button className="btn" disabled={busy||!supported} onClick={enablePush}>{busy?"Aguarde…":"Ativar notificações"}</button><span className="small">{subscribed?"Inscrição feita nesta sessão":supported?"Navegador compatível":"Verifique suporte do navegador"}</span></div></section>
   <section className="card"><h2>02 / Painel administrativo</h2><p className="muted">A chave deve ser mantida em segredo. Nunca a coloque em código público nem a compartilhe com usuários.</p><div className="field"><label>Chave administrativa</label><input type="password" autoComplete="current-password" value={adminKey} onChange={e=>setAdminKey(e.target.value)} placeholder="ADMIN_API_KEY"/></div><div className="field"><label>Título</label><input maxLength={100} value={title} onChange={e=>setTitle(e.target.value)}/></div><div className="field"><label>Mensagem</label><textarea maxLength={500} value={body} onChange={e=>setBody(e.target.value)}/></div><div className="row"><button className="btn" disabled={busy} onClick={send}>Enviar para inscritos</button><button className="btn secondary" disabled={busy} onClick={loadHistory}>Ver histórico</button></div></section>
  </div>
  <div className="status" role="status">{status}</div>
  {items.length>0&&<section className="section card"><h2>Histórico de envios</h2><div className="list">{items.map(n=><div className="item" key={n.id}><strong>{n.title}</strong><p className="muted">{n.body}</p><span className="small">{new Date(n.created_at).toLocaleString("pt-BR")}</span></div>)}</div></section>}
  <section className="section card"><h2>Como funciona</h2><p className="muted">O navegador registra uma assinatura push; a API salva essa assinatura no Supabase; o servidor usa Web Push para enviar a notificação. O destinatário precisa permitir notificações. O iPhone/iPad tem requisitos próprios para web apps adicionados à tela inicial.</p></section>
  <footer className="footer">WKORA NOTIFY • V1 inicial. Não inclua dados sensíveis nas notificações.</footer>
 </main>;
}
function urlBase64ToUint8Array(base64String:string){const padding="=".repeat((4-base64String.length%4)%4);const base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");const raw=window.atob(base64);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));}
